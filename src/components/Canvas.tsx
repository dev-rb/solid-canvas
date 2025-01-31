import { resolveTokens } from '@solid-primitives/jsx-tokenizer'
import {
  Accessor,
  Component,
  createEffect,
  createSelector,
  createSignal,
  JSX,
  on,
  onCleanup,
  onMount,
  Show,
  untrack,
} from 'solid-js'
import { createStore } from 'solid-js/store'
import { InternalContext } from 'src/context/InternalContext'
import { UserContext } from 'src/context/UserContext'

import { CanvasToken, parser } from 'src/parser'
import {
  CanvasMouseEvent,
  Color,
  Composite,
  CursorStyle,
  Position,
} from 'src/types'
import forEachReversed from 'src/utils/forEachReversed'
import { resolveColor } from 'src/utils/resolveColor'
import withContext from 'src/utils/withContext'

/**
 * All `solid-canvas`-components have to be inside a `Canvas`
 */

export const Canvas: Component<{
  children: JSX.Element
  style?: JSX.CSSProperties
  fill?: Color
  origin?: Position
  alpha?: boolean
  stats?: boolean
  draggable?: boolean
  debug?: boolean
  clock?: number
  cursor?: CursorStyle
  feedback?:
    | ((ctx: CanvasRenderingContext2D) => void)
    | true
    | {
        opacity?: number
        composite?: Composite
        filter?: string
        offset?: Position | Accessor<Position>
      }
  onMouseDown?: (event: CanvasMouseEvent) => void
  onMouseMove?: (event: CanvasMouseEvent) => void
  onMouseUp?: (event: CanvasMouseEvent) => void
  onFrame?: (args: { clock: number }) => void
}> = props => {
  const [canvasDimensions, setCanvasDimensions] = createSignal({
    width: window.innerWidth,
    height: window.innerHeight,
  })
  const [origin, setOrigin] = createSignal({ x: 0, y: 0 })
  const [cursorStyle, setCursorStyle] = createSignal<CursorStyle>('default')
  const [eventListeners, setEventListeners] = createStore<{
    onMouseDown: ((event: CanvasMouseEvent) => void)[]
    onMouseMove: ((event: CanvasMouseEvent) => void)[]
    onMouseUp: ((event: CanvasMouseEvent) => void)[]
  }>({
    onMouseDown: [],
    onMouseMove: [],
    onMouseUp: [],
  })
  const [selectedToken, setSelectedtoken] = createSignal<CanvasToken>()
  const [hoveredToken, setHoveredToken] = createSignal<CanvasToken>()

  const isSelected = createSelector<CanvasToken | undefined, CanvasToken>(
    selectedToken,
  )
  const isHovered = createSelector<CanvasToken | undefined, CanvasToken>(
    hoveredToken,
  )

  const [stats, setStats] = createStore<{
    fps?: number
    memory?: { used: number; total: number }
  }>({})

  let lastCursorPosition: Position | undefined
  let startRenderTime: number

  const canvas = (
    <canvas
      width={canvasDimensions().width}
      height={canvasDimensions().height}
      style={{ cursor: cursorStyle(), ...props.style }}
      onMouseDown={e => mouseDownHandler(e)}
      onMouseMove={e => mouseMoveHandler(e)}
      onMouseUp={e => mouseUpHandler(e)}
    />
  ) as HTMLCanvasElement

  const ctx = canvas.getContext('2d', {
    alpha: props.alpha,
    willReadFrequently: true,
  })!

  const frameQueue = new Set<(args: { clock: number }) => void>()

  const tokens = resolveTokens(
    parser,
    withContext(
      () => props.children,
      [
        {
          context: InternalContext,
          value: {
            ctx,
            get debug() {
              return !!props.debug
            },
            get origin() {
              return props.origin
                ? {
                    x: origin().x + props.origin.x,
                    y: origin().y + props.origin.y,
                  }
                : origin()
            },
            get selected() {
              return selectedToken()
            },
            isSelected,
            isHovered: (token: CanvasToken) =>
              !selectedToken() && isHovered(token),
            get hovered() {
              return hoveredToken()
            },
            addEventListener: (
              type: CanvasMouseEvent['type'],
              callback: (event: CanvasMouseEvent) => void,
            ) => {
              setEventListeners(type, listeners => [...listeners, callback])
            },
            removeEventListener: (
              type: CanvasMouseEvent['type'],
              callback: (event: CanvasMouseEvent) => void,
            ) => {
              setEventListeners(type, listeners => {
                const index = listeners.indexOf(callback)
                const result = [
                  ...listeners.slice(0, index),
                  ...listeners.slice(index + 1),
                ]
                return result
              })
            },
          },
        },
        {
          context: UserContext,
          value: {
            onFrame: (callback: (args: { clock: number }) => void) => {
              frameQueue.add(callback)
              onCleanup(() => frameQueue.delete(callback))
            },
          },
        },
      ],
    ),
  )

  const render = () => {
    startRenderTime = performance.now()

    untrack(() => {
      props.onFrame?.({ clock: props.clock ?? 0 })
      frameQueue.forEach(frame => {
        frame({ clock: props.clock ?? 0 })
      })
    })

    ctx.save()
    ctx.beginPath()
    if (typeof props.feedback === 'number' || props.feedback) {
      if (typeof props.feedback === 'function') props.feedback(ctx)
      else if (typeof props.feedback === 'object') {
        const feedback = props.feedback
        const bitmap = createImageBitmap(ctx.canvas)
        bitmap.then(bitmap => {
          ctx.restore()
          ctx.save()
          ctx.globalAlpha = feedback.opacity ?? 1
          if (feedback.composite)
            ctx.globalCompositeOperation = feedback.composite
          if (feedback.filter) ctx.filter = feedback.filter ?? ''
          const offset =
            typeof feedback.offset === 'function'
              ? feedback.offset()
              : feedback.offset
          ctx.drawImage(
            bitmap,
            offset?.x ?? 0,
            offset?.y ?? 0,
            ctx.canvas.width,
            ctx.canvas.height,
          )
          ctx.restore()
          bitmap.close()
        })
      }
    } else {
      ctx.clearRect(0, 0, canvasDimensions().width, canvasDimensions().height)
    }

    ctx.restore()

    let data
    for ({ data } of tokens()) {
      ctx.save()
      if ('debug' in data) data.debug(ctx)
      if ('render' in data) data.render(ctx)
      ctx.restore()
    }

    if (props.fill) {
      ctx.save()
      ctx.globalCompositeOperation = 'destination-over'
      ctx.fillStyle = resolveColor(props.fill) ?? 'white'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.restore()
    }

    if (props.stats) {
      setStats('fps', Math.floor(1000 / (performance.now() - startRenderTime)))
      setStats(
        'memory',
        'memory' in performance
          ? {
              // NOTE: performance.memory is chrome-only
              used: Math.floor(
                (performance.memory as any).usedJSHeapSize / 1048576,
              ),
              total: Math.floor(
                (performance.memory as any).jsHeapSizeLimit / 1048576,
              ),
            }
          : undefined,
      )
    }
  }

  createEffect(() => {
    if (props.clock || props.clock === 0) return
    render()
  })
  createEffect(on(() => props.clock, render))

  const mouseEventHandler = (
    e: MouseEvent,
    type: 'onMouseDown' | 'onMouseMove' | 'onMouseUp',
    final: (event: CanvasMouseEvent) => void,
  ) => {
    const position = { x: e.clientX, y: e.clientY }
    const delta = lastCursorPosition
      ? {
          x: position.x - lastCursorPosition.x,
          y: position.y - lastCursorPosition.y,
        }
      : { x: 0, y: 0 }
    lastCursorPosition = position
    let stop = false

    // NOTE:  `event` gets mutated by `token.hitTest`
    const event: CanvasMouseEvent = {
      ctx,
      position,
      delta,
      propagation: true,
      target: [],
      type,
      cursor: 'move',
    }

    forEachReversed(tokens(), ({ data }) => {
      // if (!event.propagation) return
      if ('hitTest' in data) {
        data.hitTest(event)
      }
    })

    if (event.propagation) final(event)

    setCursorStyle(event.cursor)

    if (type === 'onMouseDown' && event.target.length > 0) {
      setSelectedtoken(event.target[0])
    }
    if (type === 'onMouseMove') {
      if (event.target.length > 0) {
        setHoveredToken(event.target[0])
      } else {
        setHoveredToken(undefined)
      }
    }
    if (type === 'onMouseUp') setSelectedtoken(undefined)

    eventListeners[type].forEach(listener => listener(event))

    return event
  }

  const initPan = () => {
    const handleMouseMove = (event: MouseEvent) => {
      setOrigin(position => ({
        x: position.x + event.movementX,
        y: position.y + event.movementY,
      }))
    }
    const handleMouseUp = (event: MouseEvent) => {
      setCursorStyle('default')

      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  const mouseDownHandler = (e: MouseEvent) => {
    mouseEventHandler(e, 'onMouseDown', event => {
      if (props.draggable) {
        initPan()
      }
      props.onMouseDown?.({
        ...event,
        position: {
          x: event.position.x - origin().x,
          y: event.position.y - origin().y,
        },
      })
    })
  }
  const mouseMoveHandler = (e: MouseEvent) => {
    mouseEventHandler(e, 'onMouseMove', event => {
      if (event.target.length === 0 && props.draggable) setCursorStyle('move')
      else if (event.target.length === 0) {
        setCursorStyle(props.cursor ?? 'default')
      } else setCursorStyle('pointer')
      props.onMouseMove?.(event)
    })
  }
  const mouseUpHandler = (e: MouseEvent) => {
    mouseEventHandler(e, 'onMouseUp', event => props.onMouseUp?.(event))
    lastCursorPosition = undefined
  }

  onMount(() => {
    const updateDimensions = () => {
      const { width, height } = document.body.getBoundingClientRect()
      setCanvasDimensions({
        width,
        height,
      })
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
  })

  return (
    <>
      <Show when={props.stats}>
        <div
          style={{
            background: 'white',
            margin: '5px',
            padding: '5px',
            position: 'absolute',
            bottom: '0px',
            left: '0px',
            'font-family': 'monospace',
            'user-select': 'none',
          }}
        >
          fps: {stats.fps}
          <br />
          mem: {stats.memory?.used} / {stats.memory?.total}
        </div>
      </Show>
      {canvas}
    </>
  )
}
