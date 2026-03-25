/**
 * Biom: Programmatic control interface for neuroglancer viewer.
 *
 * Provides typed setters that external code (Biom's React components) can call
 * to drive the viewer without touching neuroglancer internals.
 */

import type { Viewer } from "#src/viewer.js";

export class NeuroglancerExternalControl {
  constructor(private viewer: Viewer) {}

  // ── Navigation ──────────────────────────────────────────────────────

  /**
   * Set the viewer position in voxel coordinates.
   */
  setPosition(position: number[]): void {
    const pos = this.viewer.navigationState.pose.position;
    pos.value = Float32Array.from(position);
  }

  /**
   * Get current position in voxel coordinates.
   */
  getPosition(): number[] {
    return Array.from(this.viewer.navigationState.pose.position.value);
  }

  /**
   * Set the cross-section zoom level (nanometers per viewport pixel).
   */
  setCrossSectionScale(scale: number): void {
    this.viewer.crossSectionScale.value = scale;
  }

  /**
   * Set the 3D projection zoom level.
   */
  setProjectionScale(scale: number): void {
    this.viewer.projectionScale.value = scale;
  }

  // ── Layout ──────────────────────────────────────────────────────────

  /**
   * Set the viewer layout.
   * @param layout One of: 'xy', 'xz', 'yz', '3d', '4panel', '4panel-alt'
   */
  setLayout(layout: "xy" | "xz" | "yz" | "3d" | "4panel" | "4panel-alt"): void {
    this.viewer.layout.restoreState(layout);
  }

  // ── Layers ──────────────────────────────────────────────────────────

  /**
   * Set visibility of a layer by name.
   */
  setLayerVisibility(name: string, visible: boolean): void {
    const layer = this.viewer.getLayerByName(name);
    if (layer) {
      layer.visible = visible;
    }
  }

  /**
   * Set opacity of a layer by name (0.0 - 1.0).
   * Only works for layer types that have an opacity property (e.g., image layers).
   */
  setLayerOpacity(name: string, opacity: number): void {
    const layer = this.viewer.getLayerByName(name);
    const userLayer = layer?.layer as any;
    if (userLayer?.opacity) {
      userLayer.opacity.value = Math.max(0, Math.min(1, opacity));
    }
  }

  /**
   * Get all layer names.
   */
  getLayerNames(): string[] {
    return this.viewer.getLayers().map((l) => l.name);
  }

  // ── State ───────────────────────────────────────────────────────────

  /**
   * Get the full viewer state as a JSON-serializable object.
   * Can be used to save/restore viewer configuration.
   */
  getState(): any {
    return this.viewer.state.toJSON();
  }

  /**
   * Restore viewer state from a JSON object.
   */
  restoreState(state: any): void {
    this.viewer.state.restoreState(state);
  }

  /**
   * Get coordinate space info (axis names, scales, units).
   */
  getCoordinateSpace(): {
    names: string[];
    scales: number[];
    units: string[];
  } {
    const cs = this.viewer.navigationState.coordinateSpace.value;
    return {
      names: Array.from(cs.names),
      scales: Array.from(cs.scales),
      units: Array.from(cs.units),
    };
  }
}
