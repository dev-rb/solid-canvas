import { Accessor, createMemo } from 'solid-js'
import { useCanvas } from 'src'
import { ShapeProps, Position } from 'src/types'

export default (props: ShapeProps, dragPosition: Accessor<Position>) => {
  const context = useCanvas()

  return createMemo(() => {
    const position = {
      x: (props.position?.x ?? 0) + dragPosition().x + (context?.origin.x ?? 0),
      y: (props.position?.y ?? 0) + dragPosition().y + (context?.origin.y ?? 0),
    }

    const matrix = new DOMMatrix()

    matrix.skewXSelf(props.skewX)
    matrix.skewYSelf(props.skewY)

    // NOTE:  skewing causes a horizontal/vertical offset
    const point = new DOMPoint(position.x, position.y)
    const offset = point.matrixTransform(matrix)
    matrix.translateSelf(position.x + point.x - offset.x, position.y + point.y - offset.y)

    // NOTE:  the rotation should not be included in this offset-calculation
    matrix.rotateSelf(props.rotation)

    return matrix
  })
}
