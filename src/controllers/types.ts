import { Shape2DProps } from 'src/types'
import { Draggable } from './Draggable'

export type ControllerOptions = Shape2DProps

type Controller<T extends Record<string, any>> = (
  options: ControllerOptions & T,
) => (...args: any[]) => Record<string, any> & { type: 'mouse' | 'collision' }
type _Controllers = typeof Draggable
export type Controllers =
  | Controller<{}>
  | ReturnType<Controller<{}>>
  | Array<Controller<{}> | ReturnType<Controller<{}>>>
