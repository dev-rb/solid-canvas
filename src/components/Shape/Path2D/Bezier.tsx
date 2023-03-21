import { createToken } from '@solid-primitives/jsx-tokenizer'
import { Accessor, mergeProps } from 'solid-js'
import { useCanvas } from 'src/context'

import { parser, ShapeToken } from 'src/parser'
import { Position, ShapeProps } from 'src/types'
import { defaultBoundsProps, defaultShapeProps } from 'src/utils/defaultProps'
import hitTest from 'src/utils/hitTest'
import renderLine from 'src/utils/renderLine'
import renderPath from 'src/utils/renderPath'
import renderPoint from 'src/utils/renderPoint'
import transformPath from 'src/utils/transformPath'
import transformPoint from 'src/utils/transformPoint'
import useBounds from 'src/utils/useBounds'
import useDraggable from 'src/utils/useDraggable'
import useMatrix from 'src/utils/useMatrix'

/**
 * Paints a cubic bezier to the canvas
 * [link](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/bezierCurveTo)
 */
const Bezier = createToken(
  parser,
  (
    props: ShapeProps & {
      points: { point: Position; control: Position }[]
      close?: boolean
    },
  ) => {
    const canvas = useCanvas()
    const merged = mergeProps({ ...defaultShapeProps, close: false }, props)
    const [dragPosition, dragEventHandler] = useDraggable()

    const matrix = useMatrix(merged, dragPosition)

    const handles = useHandle(() => props.points, matrix)

    const bounds = useBounds(() => handles.points().map(Object.values).flat(), matrix)

    const path = transformPath(() => {
      let point = handles.points()[0]

      let svgString = `M${point?.point.x},${point?.point.y} C${point?.control.x},${point?.control.y} `

      let i = 1
      while ((point = handles.points()[i])) {
        if (i === 2) svgString += 'S'
        svgString += `${point?.control.x},${point?.control.y} ${point?.point.x},${point?.point.y} `
        i++
      }
      const path2D = new Path2D(svgString)
      if (merged.close) path2D.closePath()
      if (canvas) {
        canvas.ctx.strokeStyle = 'black'
        canvas.ctx.stroke(path2D)
      }

      return path2D
    }, matrix)

    const debug = (ctx: CanvasRenderingContext2D) => {
      if (!canvas) return
      canvas.ctx.save()
      renderPath(ctx, defaultBoundsProps, bounds().path)
      canvas.ctx.restore()
      handles.render()
      canvas.ctx.restore()
    }

    return {
      type: 'Shape',
      id: 'Bezier',
      render: (ctx: CanvasRenderingContext2D) => renderPath(ctx, merged, path()),
      debug,
      clip: ctx => ctx.clip(path()),
      path,
      hitTest: function (event) {
        if (!canvas) return false
        const token: ShapeToken = this
        return hitTest(token, event, canvas.ctx, merged, dragEventHandler)
      },
    }
  },
)

// NOTE:  I was exploring to use a hook for (editable) handles
//        but I am not sure if this is the right approach.

//        I feel that we should be able to write it more as userland
//        with draggable `<Line/>` and `<Arc/>`

//        maybe with an API like:
//          const Bezier = ...
//          export default (points) =>
//            <Controls points={points}>
//              (points) => <Bezier points={points}/>
//            </Controls>

//        but unsure how to design the API that `Controls` could work for all the Canvas-primitives
//          like `Line`, `Bezier`, `Quadratic`, ...

const useHandle = (
  points: Accessor<{ point: Position; control: Position }[]>,
  matrix: Accessor<DOMMatrix>,
) => {
  const canvas = useCanvas()

  const getAllPoints = () =>
    points().map(({ point, control }, i) =>
      i === 0 || i === points().length - 1
        ? { control, point }
        : { control, point, oppositeControl: getOppositeControl(point, control) },
    )

  const getOppositeControl = (point: Position, control: Position) => {
    const delta = {
      x: control.x - point.x,
      y: control.y - point.y,
    }
    return {
      x: point.x + delta.x * -1,
      y: point.y + delta.y * -1,
    }
  }

  const renderHandles = () => {
    if (!canvas) return
    getAllPoints().forEach(({ control, point, oppositeControl }, i) => {
      if (oppositeControl) {
        oppositeControl = transformPoint(oppositeControl, matrix())
        renderPoint(canvas.ctx, oppositeControl)
      }

      point = transformPoint(point, matrix())
      control = transformPoint(control, matrix())
      if (oppositeControl) renderLine(canvas.ctx, point, oppositeControl)

      renderLine(canvas.ctx, point, control)
      renderPoint(canvas.ctx, point)
      renderPoint(canvas.ctx, control)
    })
  }

  return {
    render: renderHandles,
    points: getAllPoints,
  }
}

export { Bezier }
