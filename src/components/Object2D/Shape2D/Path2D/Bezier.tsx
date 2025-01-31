import { createToken } from '@solid-primitives/jsx-tokenizer'
import { mergeProps } from 'solid-js'
import { useInternalContext } from 'src/context/InternalContext'

import { defaultBoundsProps, defaultShape2DProps } from 'src/defaultProps'
import { parser, Shape2DToken } from 'src/parser'
import { Position, Shape2DProps } from 'src/types'
import addPositions from 'src/utils/addPositions'
import hitTest from 'src/utils/hitTest'
import renderPath from 'src/utils/renderPath'
import { createBounds } from 'src/utils/createBounds'
import { createBezierHandles } from 'src/utils/createHandles'
import { createMatrix } from 'src/utils/createMatrix'
import { createProcessedPoints } from 'src/utils/createProcessedPoints'
import { createTransformedPath } from 'src/utils/createTransformedPath'
import withGroup from 'src/utils/withGroup'

/**
 * Paints a cubic bezier to the canvas
 * [link](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/bezierCurveTo)
 */
const Bezier = createToken(
  parser,
  (
    props: Shape2DProps & {
      points: {
        point: Position
        control: Position
        oppositeControl?: Position
      }[]
      close?: boolean
    },
  ) => {
    const canvas = useInternalContext()
    const merged = mergeProps({ ...defaultShape2DProps, close: false }, props)

    const matrix = createMatrix(merged)

    const points = createProcessedPoints(() => props.points, 'cubic')
    const handles = createBezierHandles(points, () => !!props.editable, 'cubic')

    const bounds = createBounds(() => {
      return points()
        .map(Object.values)
        .flat()
        .filter(v => typeof v === 'object')
    }, matrix)

    const path = createTransformedPath(() => {
      const values = points()

      let value = values[0]
      let point = value?.point
      let control = addPositions(point, value?.control)
      let oppositeControl: Position | undefined

      if (!point || !control) return new Path2D()

      let svgString = `M${point.x},${point.y} C${control.x},${control.y} `

      let i = 1

      while ((value = values[i])) {
        point = value.point
        control = addPositions(point, value.control)

        if (!control || !point) {
          console.error('incorrect path', control, point, value)
          return new Path2D()
        }

        oppositeControl = addPositions(point, value.oppositeControl)

        svgString += `${control.x},${control.y} ${point.x},${point.y} `
        if (oppositeControl && i !== values.length - 1)
          svgString += `${oppositeControl.x},${oppositeControl.y} `

        i++
      }

      const path2D = new Path2D(svgString)
      if (merged.close) path2D.closePath()

      return path2D
    }, matrix)

    const token: Shape2DToken = {
      type: 'Shape2D',
      id: 'Bezier',
      path,
      render: ctx => {
        renderPath(
          ctx,
          merged,
          path(),
          canvas?.origin,
          canvas?.isHovered(token) || canvas?.isSelected(token),
        )
        handles.render(ctx)
      },
      debug: ctx => {
        renderPath(
          ctx,
          defaultBoundsProps,
          bounds().path,
          canvas?.origin,
          false,
        )
        handles.render(ctx)
        ctx.restore()
      },
      hitTest: function (event) {
        handles.hitTest(event)
        return hitTest(token, event, canvas, merged)
      },
    }
    return token
  },
)

const GroupedBezier = withGroup(Bezier)

export { GroupedBezier as Bezier }
