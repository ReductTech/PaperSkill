import ModelPixel, { MODEL_CLASSES, type ModelClass } from "./ModelPixel";

/** HTML wrapper for the exact same SVG pixels used by the lifecycle scene. */
export default function ModelMark({ model = 0 }: { model?: ModelClass }) {
  return <svg className="model-mark" viewBox="0 0 64 64" role="img" aria-label={`${MODEL_CLASSES[model]} 合成类别像素图`}>
    <ModelPixel model={model} x={8} y={8} size={48} />
  </svg>;
}
