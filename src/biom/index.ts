/**
 * Biom integration module for neuroglancer.
 *
 * Exports the external event system and programmatic control interface
 * for embedding neuroglancer in Biom's React UI.
 */

export { NeuroglancerExternalEvents } from "#src/biom/external_events.js";
export type {
  CameraChangedEvent,
  CoordinateSpaceChangedEvent,
  LayerChangedEvent,
  LayerErrorEvent,
  LayerInfo,
  LayerReadyEvent,
  MousePositionEvent,
  NeuroglancerExternalEventMap,
} from "#src/biom/external_events.js";

export { NeuroglancerExternalControl } from "#src/biom/external_control.js";
