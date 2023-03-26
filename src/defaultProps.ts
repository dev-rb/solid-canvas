import { ResolvedShape2DProps } from 'src/types'

const defaultShape2DProps: ResolvedShape2DProps = {
  position: { x: 0, y: 0 },
  stroke: 'black',
  rotation: 0,
  fill: 'transparent',
  lineDash: [],
  lineCap: 'butt',
  lineJoin: 'round',
  miterLimit: 10,
  lineWidth: 2,
  skewX: 0,
  skewY: 0,
  pointerEvents: true,
  opacity: 1,
}

const defaultBoundsProps: ResolvedShape2DProps = {
  position: { x: 0, y: 0 },
  stroke: 'grey',
  rotation: 0,
  fill: 'transparent',
  lineDash: [],
  lineCap: 'butt',
  lineJoin: 'round',
  miterLimit: 10,
  lineWidth: 0.5,
  skewX: 0,
  skewY: 0,
  pointerEvents: true,
  opacity: 1,
  composite: 'destination-over',
}

export { defaultShape2DProps, defaultBoundsProps }
