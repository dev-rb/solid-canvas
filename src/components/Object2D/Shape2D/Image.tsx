import { createToken } from '@solid-primitives/jsx-tokenizer'
import { mergeProps } from 'solid-js'
import { useInternalContext } from 'src/context/InternalContext'

import { defaultShape2DProps } from 'src/defaultProps'
import { parser, Shape2DToken, StaticShape2D } from 'src/parser'
import { Dimensions, ExtendedColor, ImageSource, Shape2DProps } from 'src/types'
import filterShape2DProps from 'src/utils/filterShape2DProps'
import hitTest from 'src/utils/hitTest'
import resolveImage from 'src/utils/resolveImageSource'
import { Normalize } from 'src/utils/typehelpers'
import { createMatrix } from 'src/utils/createMatrix'
import { createTransformedPath } from 'src/utils/createTransformedPath'
import withGroup from 'src/utils/withGroup'

/**
 * Paints an image to the canvas
 * [link](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/putImageData)
 */

const Image = createToken(
  parser,
  (
    props: Normalize<
      Shape2DProps & {
        image: ImageSource
        dimensions?: Dimensions
        fontFamily?: string
        background?: ExtendedColor
      }
    >,
  ) => {
    const canvas = useInternalContext()
    const merged = mergeProps(
      {
        ...defaultShape2DProps,
        close: true,
        fontFamily: 'arial',
        size: 10,
        dimensions: { width: 100, height: 100 },
      },
      props,
    )
    const filteredProps = filterShape2DProps(merged)

    const image = resolveImage(() => props.image)

    const matrix = createMatrix(merged)

    const path = createTransformedPath(() => {
      const path = new Path2D()
      path.rect(0, 0, merged.dimensions.width, merged.dimensions.height)
      return path
    }, matrix)

    const render = (ctx: CanvasRenderingContext2D) => {
      const img = image()
      if (!img) return

      const origin = canvas?.origin ?? { x: 0, y: 0 }
      if (props.opacity) ctx.globalAlpha = props.opacity
      ctx.drawImage(
        img,
        origin.x + merged.position.x,
        origin.y + merged.position.y,
        merged.dimensions.width,
        merged.dimensions.height,
      )
    }

    const token: Shape2DToken = {
      type: 'Shape2D',
      id: 'Image',
      render,
      hitTest: event => hitTest(token, event, canvas, merged),
      debug: () => {},
      path,
    }
    return token
  },
)

const GroupedImage = withGroup(Image)

export { GroupedImage as Image }
