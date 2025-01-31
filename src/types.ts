import { JSX } from 'solid-js'
import { CanvasToken } from './parser'
import { RequiredPartially } from './utils/typehelpers'

export type Position = {
  x: number
  y: number
}
export type Dimensions = {
  width: number
  height: number
}
export type RGB = {
  r: number
  g: number
  b: number
}
export type RGBA = {
  r: number
  g: number
  b: number
  a: number
}
export type HSL = {
  h: number
  s: number
  l: number
}
export type HSLA = {
  h: number
  s: number
  l: number
  a: number
}

export type Color = RGB | RGBA | HSL | HSLA | string
export type ExtendedColor =
  | Color
  | CanvasGradient
  | CanvasPattern
  | JSX.Element
  | null

export type ImageSource =
  | HTMLImageElement
  | HTMLVideoElement
  | SVGImageElement
  | HTMLCanvasElement
  | ImageBitmap
  | OffscreenCanvas
  | string

export type Composite =
  | 'source-over'
  | 'source-atop'
  | 'source-in'
  | 'source-out'
  | 'destination-over'
  | 'destination-atop'
  | 'destination-in'
  | 'destination-out'
  | 'lighter'
  | 'lighten'
  | 'darken'
  | 'copy'
  | 'xor'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'color-dodge'
  | 'color-burn'
  | 'hard-light'
  | 'soft-light'
  | 'difference'
  | 'exclusion'

type Shape2DStyle = {
  /**
   * Default: 'transparent'
   */
  fill?: ExtendedColor
  /**
   * Default: 'black'.
   */
  stroke?: ExtendedColor
  /**
   * Default: 2
   */
  lineWidth?: number
  /**
   * Default: []
   */
  lineDash?: number[]
  /**
   * Default: 'butt'
   */
  lineCap?: 'butt' | 'round' | 'square'
  /**
   * Default: 'butt'
   */
  lineJoin?: 'round' | 'bevel' | 'miter'
  /**
   * Default: 'butt'
   */
  miterLimit?: number

  /**
   * Default: 0
   */
  skewX?: number
  /**
   * Default: 0
   */
  skewY?: number
  /**
   * Default: { x: 0, y: 0 }
   */
  rotation?: number
  /**
   * Default: { x: 0, y: 0 }
   */
  position?: Position

  shadow?: {
    blur?: number
    color?: Color
    offset?: Position
  }

  /**
   * Set the ctx.globalCompositeOperation. Default: source-over
   */
  composite?: Composite

  /**
   * Sets ctx.globalAlpha. Default: 1
   */
  opacity?: number
}

export type Shape2DProps = Shape2DStyle & {
  // Mouse-Events

  /**
   * Ignore all pointer-events. Default: false
   */
  pointerEvents?: boolean
  /**
   * Enable editable handles. Default: false
   */
  editable?: boolean

  onDragMove?: (position: Position, event: CanvasMouseEvent) => void

  /**
   * Set onMouseDown-eventhandler.
   */
  onMouseDown?: (event: CanvasMouseEvent) => void
  /**
   * Set onMouseDown-eventhandler.
   */
  onMouseMove?: (event: CanvasMouseEvent) => void
  /**
   * Set onMouseDown-eventhandler.
   */
  onMouseUp?: (event: CanvasMouseEvent) => void
  /**
   * Set cursor-style when hovering
   */
  cursor?: CursorStyle

  /**
   * Set cursor-style when hovering
   */
  hoverStyle?: Shape2DStyle
}

export type ResolvedShape2DProps = RequiredPartially<
  Shape2DProps,
  | 'onDragMove'
  | 'onMouseDown'
  | 'onMouseMove'
  | 'onMouseUp'
  | 'composite'
  | 'fill'
  | 'shadow'
  | 'editable'
  | 'cursor'
  | 'hoverStyle'
>

export type CanvasMouseEvent = {
  ctx: CanvasRenderingContext2D
  type: 'onMouseDown' | 'onMouseMove' | 'onMouseUp'
  position: Position
  delta: Position
  propagation: boolean
  target: CanvasToken[]
  cursor: CursorStyle
}

export type BezierPoint = {
  point: Position
  control?: Position
  oppositeControl?: Position
}

export type CursorStyle =
  | 'auto'
  | 'default'
  | 'crosshair'
  | 'help'
  | 'move'
  | 'progress'
  | 'text'
  | 'wait'
  | 'e-resize'
  | 'ne-resize'
  | 'nw-resize'
  | 'n-resize'
  | 'se-resize'
  | 'sw-resize'
  | 's-resize'
  | 'pointer'
  | 'none'
  | undefined
