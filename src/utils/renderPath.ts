import { ResolvedPath2DProps } from 'src/components/Path2D'
import { resolveColor, resolveExtendedColor } from './resolveColor'

export default (ctx: CanvasRenderingContext2D, props: ResolvedPath2DProps, path: Path2D) => {
  ctx.setLineDash(props.dash)
  if (props.shadow) {
    ctx.shadowBlur = props.shadow.blur ?? 0
    ctx.shadowOffsetX = props.shadow.offset?.x ?? 0
    ctx.shadowOffsetY = props.shadow.offset?.y ?? 0
    ctx.shadowColor = resolveColor(props.shadow.color ?? 'black') ?? 'black'
  }

  if (props.composite) ctx.globalCompositeOperation = props.composite

  ctx.strokeStyle = resolveExtendedColor(props.stroke) ?? 'black'
  ctx.fillStyle = resolveExtendedColor(props.fill) ?? 'transparent'
  ctx.lineWidth = props.lineWidth
  ctx.fill(path)
  ctx.stroke(path)
  ctx.setLineDash([])
}
