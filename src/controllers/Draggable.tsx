/* @refresh skip */
import { InternalContext } from '../context/InternalContext'
import { createEffect, createSignal, mergeProps, onCleanup } from 'solid-js'
import { CanvasMouseEvent } from 'src/types'
import { ControllerOptions } from './types'

export interface DraggableOptions extends ControllerOptions {
  type: 'drag'
  startPosition: { x: number; y: number }
  controlled?: boolean
  canDrag?: boolean
}

export interface DraggableProps {
  canvas: InternalContext
}

export const Draggable = (options: DraggableOptions) => {
  options = mergeProps({ type: 'drag', startPosition: { x: 0, y: 0 } }, options)
  return (props: DraggableProps, _internal: 'key') => {
    const [dragging, setDragging] = createSignal(false)
    const [dragPosition, setDragPosition] = createSignal({ x: 0, y: 0 })
    createEffect(() => {
      if (!props.canvas) return
      if (dragging()) {
        const handleMouseMove = (event: CanvasMouseEvent) => {
          setDragPosition(position => ({
            x: position.x + event.delta.x,
            y: position.y + event.delta.y,
          }))
          options.onDragMove?.(dragPosition(), event)
          event.propagation = false
        }
        const handleMouseUp = (event: CanvasMouseEvent) => {
          setDragging(false)
        }

        props.canvas.addEventListener('onMouseMove', handleMouseMove)
        props.canvas.addEventListener('onMouseUp', handleMouseUp)

        onCleanup(() => {
          props.canvas.removeEventListener('onMouseMove', handleMouseMove)
        })
      }
    })
    const dragEventHandler = (event: CanvasMouseEvent) => {
      if (
        event.target.length === 1 &&
        event.type === 'onMouseDown' &&
        options.canDrag
      ) {
        setDragging(true)
        event.propagation = false
      }
    }
    return {
      type: options.type,
      dragEventHandler,
      dragPosition,
    }
  }
}
