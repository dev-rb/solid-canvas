import { Accessor, createMemo } from 'solid-js'
import { Controllers } from './types'

export const useControllers = (
  controllers: Accessor<Controllers | undefined>,
) => {
  return createMemo(() => {
    if (!controllers()) return []

    if (Array.isArray(controllers)) {
      let resolved: ((props: any, _internal: 'key') => any)[] = []
      for (const controller of controllers) {
        const called = controller({}, 'key')
        if (typeof called === 'function') {
          resolved.push(called)
        } else {
          resolved.push(controller)
        }
      }
      return resolved
    }
    return []
  })
}
