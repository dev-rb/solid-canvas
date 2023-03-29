import { Shape2DProps } from 'src/types'

export type ControllerOptions = Shape2DProps

export type Controller<T extends Record<string, unknown>> = (
  options: ControllerOptions & T,
) => (props: any, _internal: 'key') => any

export type Controllers =
  | Controller<{}>
  | ReturnType<Controller<{}>>
  | Array<Controller<{}> | ReturnType<Controller<{}>>>
