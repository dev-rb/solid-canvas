import { createToken, resolveTokens } from '@solid-primitives/jsx-tokenizer'
import { JSX, mergeProps } from 'solid-js'
import { useCanvas } from 'src'
import { CanvasContext } from 'src/context'

import { parser } from 'src/parser'
import { Position, Composite, CanvasMouseEvent } from 'src/types'
import { isPointInShape } from 'src/utils/isPointInShape'
import revEach from 'src/utils/revEach'
import withContext from 'src/utils/withContext'

/**
 * Groups (and clips) the component's children
 */

export type GroupProps = {
  children?: JSX.Element | JSX.Element[]
  /**
   * Defaults to { x: 0, y: 0}
   */
  position?: Position
  clip?: JSX.Element | JSX.Element[]
  composite?: Composite
}

const Group = createToken(parser, (props: GroupProps) => {
  const canvas = useCanvas()
  if (!canvas) throw 'CanvasTokens need to be included in Canvas'
  const merged = mergeProps({ position: { x: 0, y: 0 } }, props)

  const context = {
    ...canvas,
    get origin() {
      return canvas
        ? {
            x: merged.position.x + canvas.origin.x,
            y: merged.position.y + canvas.origin.y,
          }
        : merged.position
    },
  }

  const clipTokens = resolveTokens(
    parser,
    withContext(() => props.clip, CanvasContext, context),
  )

  const tokens = resolveTokens(
    parser,
    withContext(() => props.children, CanvasContext, context),
  )

  const render = (ctx: CanvasRenderingContext2D) => {
    console.log('group tokens', tokens())
    if (props.clip) {
      const path = new Path2D()
      clipTokens().forEach(({ data }) => {
        if ('clip' in data) {
          path.addPath(data.path())
        }
      })
      ctx.clip(path)
    }
    if (merged.composite) {
      // TODO:  to accurately composite `Group` we should render the contents of `Group`
      //        to an OffscreenCanvas and then draw the result with the globalCompositeOperation
      ctx.globalCompositeOperation = merged.composite
    }
    canvas?.ctx.save()
    revEach(tokens(), ({ data }) => {
      if ('render' in data) data.render(ctx)
    })
    canvas?.ctx.restore()
    revEach(tokens(), ({ data }) => {
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
    return isPointInShape(event, merged, path)
  }

  const hitTest = (event: CanvasMouseEvent) => {
    if (clipTokens().length > 0) {
      if (!hitTestClip(event)) return false
    }
    let result = false
    tokens().forEach(({ data }) => {
      if ('hitTest' in data) {
        const hit = data.hitTest(event)

        if (hit) result = true
      }
    })
    /* revEach(tokens(), ({ data }) => {
      }) */
    return result
  }

  return {
    type: 'Group',
    debug: () => {},
    hitTest,
    render,
  }
})

export { Group }
