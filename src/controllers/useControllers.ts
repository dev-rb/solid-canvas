import { Accessor, createMemo } from 'solid-js'
import { Controllers } from './types'

type ReturnValue<T> = T extends (...args: any[]) => infer R
  ? R extends (...args: any[]) => Record<string, any>
    ? R
    : never
  : never
export const useControllers = (
  controllers: Accessor<Controllers | undefined>,
) => {
  return createMemo(() => {
    const controls = controllers()
    if (!controls) return []

    if (Array.isArray(controls)) {
      let resolved: Array<ReturnValue<(typeof controls)[number]>> = []
      for (const controller of controls) {
        const called = controller({} as any)
        if (typeof called === 'function') {
          resolved.push(called)
        } else {
          resolved.push(controller as ReturnValue<typeof controller>)
        }
      }
      return resolved
    }
    return []
  })
}
