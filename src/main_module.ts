import "#src/util/polyfills.js";
import "#src/layer/enabled_frontend_modules.js";
import "#src/datasource/enabled_frontend_modules.js";
import "#src/kvstore/enabled_frontend_modules.js";

// Re-export public API for UMD/library consumers
export { Viewer } from "#src/viewer.js";
export type { ViewerOptions } from "#src/viewer.js";
export { makeMinimalViewer } from "#src/ui/minimal_viewer.js";
export { makeDefaultViewer } from "#src/ui/default_viewer.js";
export { makeLayer, ManagedUserLayer } from "#src/layer/index.js";

// Biom integration module
export {
  NeuroglancerExternalEvents,
  NeuroglancerExternalControl,
} from "#src/biom/index.js";
export type {
  CameraChangedEvent,
  CoordinateSpaceChangedEvent,
  LayerChangedEvent,
  LayerErrorEvent,
  LayerInfo,
  LayerReadyEvent,
  MousePositionEvent,
  NeuroglancerExternalEventMap,
} from "#src/biom/index.js";
