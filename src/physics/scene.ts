import Matter from 'matter-js'
import { CURSOR, DRIFT, OBJECTS, SPAWN, VIEW, WORLD, type Shape } from '../physics.config'
import { baseSizes as planSizes, fitScale as planScale, planAngles, planSpots } from './layout'

const {
  Bodies, Body, Common, Composite, Engine, Events,
  Mouse, MouseConstraint, Query, Sleeping, Vertices,
} = Matter

type Item = {
  el: HTMLImageElement
  body: Matter.Body
  /** вектор от центра картинки до центра масс тела (в системе координат картинки) */
  offset: Matter.Vector
  w: number
  h: number
  drawn: boolean
  /** направление, в котором объект сейчас плывёт (радианы) */
  course: number
  /** в какую сторону он крутится: +1 или -1 */
  spinDir: number
  /** объект уже появился на экране? */
  alive: boolean
  /** размер картинки при масштабе 1 — от него идёт пересчёт при ресайзе */
  baseW: number
  baseH: number
}

const STEP = 1000 / 60 // один шаг физики = один кадр при 60 fps

/**
 * Собирает физическую сцену в контейнере `root` и двигает переданные <img>.
 * Возвращает функцию остановки — её вызывает React при размонтировании.
 */
export function createScene(
  root: HTMLElement,
  images: HTMLImageElement[],
  /**
   * Размер, по которому считается масштаб предметов. Во вступлении сцена
   * растянута на весь экран, но предметы должны быть сразу такими, какими
   * останутся в колонке, — иначе при сжатии они менялись бы на глазах.
   */
  scaleArea?: () => { width: number; height: number },
) {
  const engine = Engine.create({ enableSleeping: VIEW.sleeping })
  engine.gravity.y = WORLD.gravity
  engine.gravity.x = 0

  let width = root.clientWidth
  let height = root.clientHeight

  /* --- невидимые стенки: пол, левая и правая ---------------------------- */

  let walls: Matter.Body[] = []

  const buildWalls = () => {
    if (walls.length) Composite.remove(engine.world, walls)
    const t = VIEW.wallThickness
    const opts = { isStatic: true, friction: WORLD.friction, restitution: WORLD.restitution }
    walls = [
      // низ
      Bodies.rectangle(width / 2, height + t / 2, width + t * 2, t, opts),
      // левая
      Bodies.rectangle(-t / 2, height / 2, t, height + t * 2, opts),
      // правая
      Bodies.rectangle(width + t / 2, height / 2, t, height + t * 2, opts),
      // верх — в невесомости он тоже нужен, иначе объекты уплывут вверх
      Bodies.rectangle(width / 2, -t / 2, width + t * 2, t, opts),
    ]
    Composite.add(engine.world, walls)
  }

  buildWalls()

  /* --- невидимое тело курсора: расталкивает объекты без захвата ---------- */

  const cursor = Bodies.circle(-9999, -9999, CURSOR.radius, {
    isStatic: true,
    friction: WORLD.friction,
    restitution: 0,
  })
  Composite.add(engine.world, cursor)

  // куда курсор едет в этом кадре; null — мышь ушла с колонки
  let cursorTarget: Matter.Vector | null = null
  let cursorPrev: Matter.Vector = { x: -9999, y: -9999 }

  /* --- тела из картинок -------------------------------------------------- */

  const items: Item[] = []
  const timers: number[] = []
  let stopped = false

  // Размеры и точки считает общий модуль — теми же формулами пользуется
  // заставка, поэтому предметы прилетают ровно на свои места.
  const fitScale = (sizes: { w: number; h: number }[]) => {
    const area = scaleArea?.() ?? { width, height }
    return planScale(sizes, area.width, area.height)
  }

  const baseSizes = planSizes(images.map((el) => ({ w: el.naturalWidth, h: el.naturalHeight })))

  let scaleNow = fitScale(baseSizes)
  // а вот раскладка — по текущему размеру мира: во вступлении предметы
  // должны разойтись по всему экрану
  let spots = planSpots(baseSizes, width, height, scaleNow)
  const angles = planAngles(images.length)

  images.forEach((el, i) => {
    const cfg = OBJECTS[i]
    if (!cfg) return

    const base = baseSizes[i]
    const w = Math.round(base.w * scaleNow)
    const h = Math.round(base.h * scaleNow)

    el.style.width = `${w}px`
    el.style.height = `${h}px`

    const spot = spots[i]
    const x = spot.x
    const y = spot.y

    const options: Matter.IBodyDefinition = {
      density: WORLD.density * (cfg.weight ?? 1),
      restitution: cfg.restitution ?? WORLD.restitution,
      friction: WORLD.friction,
      frictionStatic: WORLD.frictionStatic,
      frictionAir: WORLD.frictionAir,
      // порог засыпания: чем меньше, тем раньше объект «замирает»
      sleepThreshold: 60,
    }

    const { body, offset } = buildBody(cfg.shape, w, h, x, y, options)

    const course = Common.random(0, Math.PI * 2)
    // угол тот же, с каким предмет прилетел с заставки
    Body.setAngle(body, angles[i])
    Body.setAngularVelocity(body, Common.random(-1, 1) * SPAWN.spin)
    Body.setVelocity(body, {
      x: Math.cos(course) * SPAWN.speed,
      y: Math.sin(course) * SPAWN.speed,
    })

    items.push({
      el, body, offset, w, h, drawn: false,
      course,
      spinDir: Math.random() < 0.5 ? -1 : 1,
      alive: false,
      baseW: base.w,
      baseH: base.h,
    })

    // объекты падают по очереди, с задержкой
    const index = items.length - 1
    const timer = window.setTimeout(() => {
      if (stopped) return
      Composite.add(engine.world, body)
      items[index].alive = true
      el.style.opacity = '1'
    }, SPAWN.startDelay + i * SPAWN.delay)
    timers.push(timer)
  })

  /* --- мышь: захват и бросок -------------------------------------------- */

  const mouse = Mouse.create(root)

  // Matter по умолчанию перехватывает колесо мыши — снимаем этот обработчик,
  // иначе скролл над левой колонкой перестанет прокручивать правую.
  const rawMouse = mouse as unknown as {
    mousewheel: EventListener
    mousemove: EventListener
    mousedown: EventListener
    mouseup: (e: MouseEvent) => void
  }
  root.removeEventListener('wheel', rawMouse.mousewheel)

  // то же самое с касаниями: Matter блокирует прокрутку пальцем над сценой.
  // Здесь скролл важнее перетаскивания, поэтому снимаем и touch-обработчики
  // (если захотите таскать объекты пальцем — удалите эти три строки).
  root.removeEventListener('touchmove', rawMouse.mousemove)
  root.removeEventListener('touchstart', rawMouse.mousedown)
  root.removeEventListener('touchend', rawMouse.mouseup as EventListener)

  const mouseConstraint = MouseConstraint.create(engine, {
    mouse,
    constraint: {
      stiffness: CURSOR.grabStiffness,
      damping: CURSOR.grabDamping,
      render: { visible: false },
    },
  })
  Composite.add(engine.world, mouseConstraint)

  // если кнопку отпустили за пределами колонки — всё равно отпускаем объект
  const onWindowUp = (e: MouseEvent) => rawMouse.mouseup(e)
  window.addEventListener('mouseup', onWindowUp)

  // пока объект в руке, тело курсора не мешает — иначе оно дерётся с захватом
  Events.on(mouseConstraint, 'startdrag', () => {
    cursor.collisionFilter.mask = 0
    root.classList.add('is-grabbing')
  })
  Events.on(mouseConstraint, 'enddrag', () => {
    cursor.collisionFilter.mask = 0xffffffff
    root.classList.remove('is-grabbing')
  })

  const onMove = (e: MouseEvent) => {
    const rect = root.getBoundingClientRect()
    cursorTarget = { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }
  const onLeave = () => { cursorTarget = null }

  root.addEventListener('mousemove', onMove)
  root.addEventListener('mouseleave', onLeave)

  /* --- изменение размера окна: пересчитываем стенки ---------------------- */

  const syncSize = () => {
    const w = root.clientWidth
    const h = root.clientHeight

    if (w !== width || h !== height) {
      width = w
      height = h
      buildWalls()
    }

    // Масштаб сверяется всегда, а не только при изменении размеров: при первом
    // запуске сцена могла быть собрана до того, как раскладка встала на место,
    // и тогда объекты остались бы неподходящего размера.
    const sizes = items.map((it) => ({ w: it.baseW, h: it.baseH }))
    spots = planSpots(sizes, width, height, scaleNow)
    const next = fitScale(sizes)
    if (Math.abs(next - scaleNow) > 0.01) {
      const k = next / scaleNow
      scaleNow = next
      for (const item of items) {
        Body.scale(item.body, k, k)
        item.offset = { x: item.offset.x * k, y: item.offset.y * k }
        item.w = Math.round(item.baseW * scaleNow)
        item.h = Math.round(item.baseH * scaleNow)
        item.el.style.width = `${item.w}px`
        item.el.style.height = `${item.h}px`
        item.drawn = false
      }
    }

    // будим всех — иначе спящие объекты останутся висеть на старых местах
    for (const item of items) Sleeping.set(item.body, false)
  }

  // три независимых способа заметить изменение размера: наблюдатель за колонкой,
  // событие окна и периодическая сверка в самом цикле. Наблюдатель иногда молчит
  // (например, когда страница открыта в фоновой вкладке), поэтому одного мало.
  const resizeObserver = new ResizeObserver(syncSize)
  resizeObserver.observe(root)
  window.addEventListener('resize', syncSize)

  /* --- главный цикл ------------------------------------------------------ */

  const moveCursor = () => {
    let target = cursorTarget ?? { x: -9999, y: -9999 }

    // «палец» догоняет мышь не мгновенно, а шагами: без этого резкий рывок
    // мышью превращается в удар огромной силы и объекты улетают
    if (cursorTarget && cursorPrev.x > -9000) {
      const dx = target.x - cursorPrev.x
      const dy = target.y - cursorPrev.y
      const distance = Math.hypot(dx, dy)
      if (distance > CURSOR.maxStep) {
        const k = CURSOR.maxStep / distance
        target = { x: cursorPrev.x + dx * k, y: cursorPrev.y + dy * k }
      }
    }
    // третий аргумент — пересчитать скорость тела по пройденному пути,
    // без него толчок курсором получается безжизненным
    ;(Body.setPosition as (b: Matter.Body, p: Matter.Vector, updateVelocity?: boolean) => void)(
      cursor, target, true,
    )

    // статичное тело само по себе не будит спящие — будим их вручную,
    // иначе улёгшуюся кучу нельзя будет расшевелить курсором
    const moved = Math.hypot(target.x - cursorPrev.x, target.y - cursorPrev.y)
    cursorPrev = target
    if (cursorTarget && moved > 0.4) {
      const r = CURSOR.radius * 2
      const region = {
        min: { x: target.x - r, y: target.y - r },
        max: { x: target.x + r, y: target.y + r },
      }
      for (const body of Query.region(items.map((it) => it.body), region)) {
        Sleeping.set(body, false)
      }
    }
  }

  /**
   * Поддерживает медленное плавание: подталкивает объект, если он замедлился,
   * не даёт разогнаться сверх меры и подкручивает его вокруг своей оси.
   */
  const applyDrift = () => {
    for (const item of items) {
      if (!item.alive) continue
      // объект в руке у пользователя — не мешаем ему
      if (mouseConstraint.body === item.body) continue

      const body = item.body

      // направление дрейфа медленно виляет
      item.course += Common.random(-1, 1) * DRIFT.wander

      // у края колонки подмешиваем направление к центру: иначе объект
      // упирается в стенку и остаётся там, продолжая толкать её впустую
      const margin = Math.min(width, height) * 0.2
      const p = body.position
      if (p.x < margin || p.x > width - margin || p.y < margin || p.y > height - margin) {
        const toCenter = Math.atan2(height / 2 - p.y, width / 2 - p.x)
        const mixX = Math.cos(item.course) + Math.cos(toCenter) * DRIFT.keepInside
        const mixY = Math.sin(item.course) + Math.sin(toCenter) * DRIFT.keepInside
        item.course = Math.atan2(mixY, mixX)
      }

      const v = body.velocity
      const speed = Math.hypot(v.x, v.y)

      if (speed < DRIFT.speed) {
        const push = body.mass * DRIFT.push
        Body.applyForce(body, body.position, {
          x: Math.cos(item.course) * push,
          y: Math.sin(item.course) * push,
        })
      } else if (speed > DRIFT.maxSpeed) {
        // жёсткий потолок — на случай очень сильного броска
        const k = DRIFT.maxSpeed / speed
        Body.setVelocity(body, { x: v.x * k, y: v.y * k })
      } else if (speed > DRIFT.speed * 1.3) {
        // разогнанный объект плавно возвращается к своей крейсерской скорости
        const k = Math.max(DRIFT.speed / speed, 0.99)
        Body.setVelocity(body, { x: v.x * k, y: v.y * k })
      }

      const spin = body.angularVelocity
      if (Math.abs(spin) < DRIFT.spin) {
        Body.setAngularVelocity(body, spin + item.spinDir * DRIFT.spin * 0.08)
      } else if (Math.abs(spin) > DRIFT.maxSpin) {
        Body.setAngularVelocity(body, Math.sign(spin) * DRIFT.maxSpin)
      }
    }
  }

  const render = () => {
    for (const item of items) {
      // спящие объекты уже нарисованы — не трогаем DOM зря
      if (item.body.isSleeping && item.drawn) continue

      const { position, angle } = item.body
      const cos = Math.cos(angle)
      const sin = Math.sin(angle)
      // центр картинки = центр масс минус повёрнутое смещение
      const cx = position.x - (item.offset.x * cos - item.offset.y * sin)
      const cy = position.y - (item.offset.x * sin + item.offset.y * cos)

      item.el.style.transform =
        `translate3d(${(cx - item.w / 2).toFixed(2)}px, ${(cy - item.h / 2).toFixed(2)}px, 0) ` +
        `rotate(${angle.toFixed(4)}rad)`
      item.drawn = true
    }
  }

  /* --- отладка: контуры форм поверх картинок ---------------------------- */

  let debugCanvas: HTMLCanvasElement | null = null
  let debugCtx: CanvasRenderingContext2D | null = null

  if (VIEW.debug) {
    debugCanvas = document.createElement('canvas')
    debugCanvas.className = 'stage__debug'
    root.appendChild(debugCanvas)
    debugCtx = debugCanvas.getContext('2d')
  }

  const renderDebug = () => {
    if (!debugCanvas || !debugCtx) return
    const dpr = window.devicePixelRatio || 1
    if (debugCanvas.width !== width * dpr || debugCanvas.height !== height * dpr) {
      debugCanvas.width = width * dpr
      debugCanvas.height = height * dpr
      debugCanvas.style.width = `${width}px`
      debugCanvas.style.height = `${height}px`
    }
    const ctx = debugCtx
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, width, height)
    ctx.lineWidth = 1.5

    const draw = (bodies: Matter.Body[], color: string) => {
      ctx.strokeStyle = color
      for (const body of bodies) {
        ctx.beginPath()
        body.vertices.forEach((v, i) => (i ? ctx.lineTo(v.x, v.y) : ctx.moveTo(v.x, v.y)))
        ctx.closePath()
        ctx.stroke()
      }
    }

    draw(items.map((it) => it.body), '#ff3b30')
    draw(walls, '#0a84ff')
    draw([cursor], '#34c759')
  }

  if (VIEW.debug) {
    // в режиме отладки сцена доступна из консоли браузера как window.__physics
    ;(window as unknown as Record<string, unknown>).__physics = {
      engine,
      items,
      cursor,
      get walls() { return walls },
      size: () => ({ width, height }),
      get frames() { return frames },
      syncSize,
      /** прогнать n шагов физики вручную — удобно для замеров */
      step: (n: number) => {
        for (let i = 0; i < n; i++) {
          moveCursor()
          applyDrift()
          Engine.update(engine, STEP)
        }
      },
    }
  }

  let frame = 0
  let frames = 0
  let last = performance.now()
  let accumulator = 0

  const tick = (now: number) => {
    frame = requestAnimationFrame(tick)
    frames++

    let elapsed = now - last
    last = now
    if (elapsed > 250) elapsed = STEP // вкладка была свёрнута — не навёрстываем
    accumulator = Math.min(accumulator + elapsed, STEP * 4)

    // размеры сверяем каждый кадр: колонка может плавно менять размер
    // (так во вступлении сцена сжимается с целого экрана до левой колонки)
    syncSize()

    while (accumulator >= STEP) {
      moveCursor()
      applyDrift()
      Engine.update(engine, STEP)
      accumulator -= STEP
    }

    render()
    renderDebug()
  }
  frame = requestAnimationFrame(tick)

  /* --- остановка --------------------------------------------------------- */

  return () => {
    stopped = true
    cancelAnimationFrame(frame)
    timers.forEach(clearTimeout)
    resizeObserver.disconnect()
    window.removeEventListener('resize', syncSize)
    root.removeEventListener('mousemove', onMove)
    root.removeEventListener('mouseleave', onLeave)
    window.removeEventListener('mouseup', onWindowUp)
    debugCanvas?.remove()
    Composite.clear(engine.world, false)
    Engine.clear(engine)
  }
}

/**
 * Превращает форму из файла настроек в физическое тело.
 * Заодно считает, насколько центр масс тела смещён от центра картинки —
 * без этой поправки картинка «съезжает» с формы при вращении.
 */
function buildBody(
  shape: Shape,
  w: number,
  h: number,
  x: number,
  y: number,
  options: Matter.IBodyDefinition,
): { body: Matter.Body; offset: Matter.Vector } {
  if (shape.kind === 'circle') {
    const offset = {
      x: ((shape.cx ?? 0.5) - 0.5) * w,
      y: ((shape.cy ?? 0.5) - 0.5) * h,
    }
    return { body: Bodies.circle(x, y, shape.r * w, options), offset }
  }

  // доли 0..1 → пиксели относительно центра картинки
  const points = shape.points.map(([px, py]) => ({
    x: (px - 0.5) * w,
    y: (py - 0.5) * h,
  }))

  // выпуклая оболочка: гарантирует правильный порядок точек
  // и убирает вмятины, которые движок всё равно не умеет считать
  // Vertices.create превращает точки в «вершины» в терминах движка
  // (приведение типов — у matter-js неточные описания типов для этой пары функций)
  const vertices = Vertices.create(points, null as unknown as Matter.Body) as unknown as Matter.Vertex[]
  const hull = Vertices.hull(vertices)
  const offset = Vertices.centre(hull)

  return { body: Body.create({ ...options, position: { x, y }, vertices: hull }), offset }
}


