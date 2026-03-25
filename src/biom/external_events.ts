/**
 * Biom: External event system for neuroglancer viewer integration.
 *
 * Watches key neuroglancer state (camera, layers, mouse position) and emits
 * structured events that external consumers (like Biom's Zustand stores) can
 * subscribe to without depending on neuroglancer internals.
 */

import type { Viewer } from "#src/viewer.js";

// ── Event types ──────────────────────────────────────────────────────

export interface CameraChangedEvent {
  position: number[];
  crossSectionScale: number;
  projectionScale: number;
}

export interface LayerInfo {
  name: string;
  type: string;
  visible: boolean;
  opacity: number;
}

export interface LayerChangedEvent {
  layers: LayerInfo[];
}

export interface LayerErrorEvent {
  layerName: string;
  message: string;
}

export interface LayerReadyEvent {
  layerName: string;
}

export interface CoordinateSpaceChangedEvent {
  names: string[];
  scales: number[];
  units: string[];
}

export interface MousePositionEvent {
  /** Voxel coordinates (integers) */
  voxel: number[];
  /** World coordinates (physical units) */
  world: number[];
}

export interface NeuroglancerExternalEventMap {
  "camera-changed": CameraChangedEvent;
  "layer-changed": LayerChangedEvent;
  "layer-error": LayerErrorEvent;
  "layer-ready": LayerReadyEvent;
  "coordinate-space-changed": CoordinateSpaceChangedEvent;
  "mouse-position": MousePositionEvent;
}

type EventHandler<T> = (data: T) => void;

// ── Event emitter ────────────────────────────────────────────────────

export class NeuroglancerExternalEvents {
  private handlers = new Map<string, Set<EventHandler<any>>>();
  private disposers: (() => void)[] = [];

  constructor(private viewer: Viewer) {}

  on<K extends keyof NeuroglancerExternalEventMap>(
    event: K,
    handler: EventHandler<NeuroglancerExternalEventMap[K]>,
  ): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
    return () => this.handlers.get(event)?.delete(handler);
  }

  private emit<K extends keyof NeuroglancerExternalEventMap>(
    event: K,
    data: NeuroglancerExternalEventMap[K],
  ) {
    const eventHandlers = this.handlers.get(event);
    if (eventHandlers) {
      for (const handler of eventHandlers) {
        try {
          handler(data);
        } catch (e) {
          console.error(`[neuroglancer] External event handler error (${event}):`, e);
        }
      }
    }
  }

  /**
   * Start watching neuroglancer state and emitting events.
   * Call dispose() to stop.
   */
  connect(): void {
    const { viewer } = this;

    // Camera position + scale changes
    const emitCamera = () => {
      const pos = viewer.navigationState.pose.position.value;
      this.emit("camera-changed", {
        position: Array.from(pos),
        crossSectionScale: viewer.crossSectionScale.value,
        projectionScale: viewer.projectionScale.value,
      });
    };

    viewer.navigationState.pose.position.changed.add(emitCamera);
    viewer.crossSectionScale.changed.add(emitCamera);
    viewer.projectionScale.changed.add(emitCamera);
    this.disposers.push(
      () => viewer.navigationState.pose.position.changed.remove(emitCamera),
      () => viewer.crossSectionScale.changed.remove(emitCamera),
      () => viewer.projectionScale.changed.remove(emitCamera),
    );

    // Layer list changes
    const emitLayers = () => {
      const layers: LayerInfo[] = viewer.layerManager.managedLayers.map(
        (ml) => ({
          name: ml.name,
          type: ml.layer?.type ?? "unknown",
          visible: ml.visible,
          opacity: (ml.layer as any)?.opacity?.value ?? 1,
        }),
      );
      this.emit("layer-changed", { layers });
    };

    viewer.layerManager.layersChanged.add(emitLayers);
    this.disposers.push(() =>
      viewer.layerManager.layersChanged.remove(emitLayers),
    );

    // Coordinate space changes
    const emitCoordinateSpace = () => {
      const cs = viewer.navigationState.coordinateSpace.value;
      this.emit("coordinate-space-changed", {
        names: Array.from(cs.names),
        scales: Array.from(cs.scales),
        units: Array.from(cs.units),
      });
    };

    viewer.navigationState.coordinateSpace.changed.add(emitCoordinateSpace);
    this.disposers.push(() =>
      viewer.navigationState.coordinateSpace.changed.remove(
        emitCoordinateSpace,
      ),
    );

    // Mouse position
    const emitMousePosition = () => {
      const ms = viewer.mouseState;
      if (ms.active) {
        this.emit("mouse-position", {
          voxel: Array.from(ms.position),
          world: Array.from(ms.position),
        });
      }
    };

    viewer.mouseState.changed.add(emitMousePosition);
    this.disposers.push(() =>
      viewer.mouseState.changed.remove(emitMousePosition),
    );
  }

  /**
   * Stop watching and remove all event handlers.
   */
  dispose(): void {
    for (const dispose of this.disposers) {
      try {
        dispose();
      } catch {
        // Viewer may already be disposed
      }
    }
    this.disposers.length = 0;
    this.handlers.clear();
  }
}
