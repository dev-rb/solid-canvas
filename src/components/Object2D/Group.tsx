import {
  createToken,
  resolveTokens,
  TokenElement,
} from '@solid-primitives/jsx-tokenizer'
import { Accessor, createSignal, JSX, mergeProps } from 'solid-js'
import {
  InternalContext,
  useInternalContext,
} from 'src/context/InternalContext'

import { CanvasToken, parser } from 'src/parser'
import { CanvasMouseEvent, Composite, ExtendedColor, Position } from 'src/types'
import { isPointInShape2D } from 'src/utils/isPointInShape2D'
import { resolveExtendedColor } from 'src/utils/resolveColor'
import forEachReversed from 'src/utils/forEachReversed'
import withContext from 'src/utils/withContext'
import { Controllers } from 'src/controllers/types'
import { useControllers } from 'src/controllers/useControllers'

/**
 * Groups (and clips) the component's children
 */

export type GroupProps = {
  children?: JSX.Element | JSX.Element[]
  opacity?: number
  fill?: ExtendedColor
  /**
   * Defaults to { x: 0, y: 0}
   */
  position?: Position
  clip?: Accessor<JSX.Element | JSX.Element[]>
  composite?: Composite
  controllers?: Controllers
}

const Group = createToken(parser, (props: GroupProps) => {
  const canvas = useInternalContext()
  if (!canvas) throw 'CanvasTokens need to be included in Canvas'
  const _resolvedControllers = useControllers(() => props.controllers)
  let resolvedControllers: Array<
    ReturnType<ReturnType<typeof _resolvedControllers>[number]>
  > = []
  for (const controller of _resolvedControllers()) {
    resolvedControllers.push(controller({ canvas }, 'key'))
  }
  const merged = mergeProps({ position: { x: 0, y: 0 } }, props)

  const [offset, setOffset] = createSignal({ x: 0, y: 0 }, { equals: false })
  const context = {
    ...canvas,
    get origin() {
      // console.log(offset())
      return canvas
        ? {
            x: merged.position.x + canvas.origin.x + offset().x,
            y: merged.position.y + canvas.origin.y + offset().y,
          }
        : merged.position
    },
  }

  const clipTokens = resolveTokens(
    parser,
    withContext(
      () => (typeof props.clip === 'function' ? props.clip() : props.clip),
      InternalContext,
      context,
    ),
  )

  const tokens = resolveTokens(
    parser,
    withContext(() => props.children, InternalContext, context),
  )

  const render = (ctx: CanvasRenderingContext2D) => {
    if (props.clip) {
      const path = new Path2D()
      clipTokens().forEach(({ data }) => {
        if ('path' in data) {
          path.addPath(data.path())
        }
        if ('paths' in data) {
          data.paths().forEach(p => {
            path.addPath(p)
          })
        }
      })
      ctx.clip(path)
    }
    if (merged.composite) {
      // TODO:  to accurately composite `Group` we should render the contents of `Group`
      //        to an OffscreenCanvas and then draw the result with the globalCompositeOperation
      ctx.globalCompositeOperation = merged.composite
    }
    if (props.opacity) ctx.globalAlpha = props.opacity
    if (props.fill) {
      ctx.fillStyle = resolveExtendedColor(props.fill) ?? 'transparent'
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    }
    forEachReversed(tokens(), ({ data }) => {
      if ('render' in data) data.render(ctx)
    })
    canvas?.ctx.restore()
    forEachReversed(tokens(), ({ data }) => {
      if ('debug' in data && canvas.debug) data.debug(ctx)
    })
    canvas?.ctx.restore()
  }

  const hitTestClip = (event: CanvasMouseEvent) => {
    const path = new Path2D()
    clipTokens().forEach(({ data }) => {
      if ('path' in data) {
        path.addPath(data.path())
      }
    })
    return isPointInShape2D(event, merged, path)
  }

  const hitTest = (event: CanvasMouseEvent) => {
    if (clipTokens().length > 0) {
      if (!hitTestClip(event)) return false
    }
    let result: TokenElement<CanvasToken>[] = []
    let stop = false
    // const stopPropagation = () => (stop = true)
    forEachReversed(tokens(), token => {
      if (!event.propagation) return
      if ('hitTest' in token.data) {
        const hit = token.data.hitTest(event)
        if (hit) {
          result.push(token)
          event.propagation = false
        }
      }
    })

    if (result.length === 1 && result[0] === tokens()[tokens().length - 1]) {
      for (const controller of resolvedControllers) {
        const called = controller
        if ('onMouseDown' in called) {
          called.onMouseDown(event)
          setOffset(called.dragPosition())
        }
      }
    }
    return false
  }

  return {
    type: 'Group',
    debug: () => {},
    hitTest,
    paths: () => {
      return tokens()
        .map(({ data }) => {
          if ('path' in data) return [data.path()]
          if ('paths' in data) return data.paths()
          return []
        })
        .flat()
    },
    render,
  } as CanvasToken
})

export { Group }
