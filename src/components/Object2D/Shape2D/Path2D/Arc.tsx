import { createToken } from '@solid-primitives/jsx-tokenizer'
import { mergeProps } from 'solid-js'

import { useInternalContext } from 'src/context/InternalContext'
import { defaultBoundsProps, defaultShape2DProps } from 'src/defaultProps'
import { parser, Shape2DToken } from 'src/parser'
import { Shape2DProps } from 'src/types'
import hitTest from 'src/utils/hitTest'
import renderPath from 'src/utils/renderPath'
import { Normalize } from 'src/utils/typehelpers'
import { createBounds } from 'src/utils/createBounds'
import { createMatrix } from 'src/utils/createMatrix'
import { createTransformedPath } from 'src/utils/createTransformedPath'
import withGroup from 'src/utils/withGroup'

/**
 * Paints a rectangle to the canvas
 * [link](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/rect)
 */

const Arc = createToken(
  parser,
  (
    props: Normalize<
      Shape2DProps & {
        radius?: number
        angle?: {
          start: number
          end: number
        }
      }
    >,
  ) => {
    const canvas = useInternalContext()
    const merged = mergeProps(
      {
        ...defaultShape2DProps,
        close: true,
        radius: 10,
        angle: { start: 0, end: 2 * Math.PI },
      },
      props,
    )

    const matrix = createMatrix(merged)

    const getPath = () => {
      const path = new Path2D()
      path.arc(
        merged.radius,
        merged.radius,
        merged.radius,
        merged.angle.start,
        merged.angle.end,
      )
      return path
    }

    const path = createTransformedPath(getPath, matrix)

    const bounds = createBounds(
      () => [
        {
          x: 0,
          y: 0,
        },
        {
          x: merged.radius * 2,
          y: 0,
        },
        {
          x: merged.radius * 2,
          y: merged.radius * 2,
        },
        {
          x: 0,
          y: merged.radius * 2,
        },
      ],
      matrix,
    )

    const token: Shape2DToken = {
      id: 'Arc',
      type: 'Shape2D',
      render: function (ctx: CanvasRenderingContext2D) {
        renderPath(
          ctx,
          merged,
          path(),
          canvas?.origin,
          canvas?.isSelected(token) || canvas?.isHovered(token),
        )
      },
      debug: (ctx: CanvasRenderingContext2D) =>
        renderPath(
          ctx,
          defaultBoundsProps,
          bounds().path,
          canvas?.origin,
          false,
        ),
      path,
      hitTest: function (event) {
        return hitTest(token, event, canvas, merged)
      },
    }
    return token
  },
)
const GroupedArc = withGroup(Arc)

export { GroupedArc as Arc }
