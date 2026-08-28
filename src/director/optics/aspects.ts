/** Viewfinder gates observed on 3D 片场取景器 (2026-08-28 live). */

export interface ViewAspect {
  id: string;
  label: string;
  width: number;
  height: number;
}

export const VIEWFINDER_ASPECTS: ViewAspect[] = [
  { id: '16:9', label: '16:9', width: 16, height: 9 },
  { id: '9:16', label: '9:16', width: 9, height: 16 },
  { id: '4:3', label: '4:3', width: 4, height: 3 },
  { id: '3:4', label: '3:4', width: 3, height: 4 },
  { id: '1:1', label: '1:1', width: 1, height: 1 },
  { id: '3:2', label: '3:2', width: 3, height: 2 },
  { id: '2:3', label: '2:3', width: 2, height: 3 },
  { id: '4:5', label: '4:5', width: 4, height: 5 },
  { id: '9:19.5', label: '9:19.5', width: 9, height: 19.5 },
  { id: '9:21', label: '9:21', width: 9, height: 21 },
  { id: '1.33:1', label: '1.33:1', width: 1.33, height: 1 },
  { id: '1.37:1', label: '1.37:1', width: 1.37, height: 1 },
  { id: '1.43:1', label: '1.43:1', width: 1.43, height: 1 },
  { id: '1.66:1', label: '1.66:1', width: 1.66, height: 1 },
  { id: '1.85:1', label: '1.85:1', width: 1.85, height: 1 },
  { id: '2.00:1', label: '2.00:1', width: 2, height: 1 },
  { id: '2.20:1', label: '2.20:1', width: 2.2, height: 1 },
  { id: '2.35:1', label: '2.35:1', width: 2.35, height: 1 },
  { id: '2.39:1', label: '2.39:1', width: 2.39, height: 1 },
];

export function parseAspect(id?: string): ViewAspect | null {
  if (!id) return null;
  const key = id.trim();
  return VIEWFINDER_ASPECTS.find((item) => item.id === key) ?? null;
}

export function aspectRatio(aspect: ViewAspect): number {
  return aspect.width / aspect.height;
}

export interface Letterbox {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Inner frame for a gate inside a viewport. */
export function letterboxRect(viewW: number, viewH: number, aspect: ViewAspect): Letterbox {
  const vw = Math.max(1, viewW);
  const vh = Math.max(1, viewH);
  const target = aspectRatio(aspect);
  const view = vw / vh;
  if (view > target) {
    const w = vh * target;
    return { x: (vw - w) / 2, y: 0, w, h: vh };
  }
  const h = vw / target;
  return { x: 0, y: (vh - h) / 2, w: vw, h };
}

export interface CanvasRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Letterbox a gate onto an engine canvas rect (not the browser window). */
export function gateOnCanvas(canvas: CanvasRect, aspect: ViewAspect): {
  overlay: CanvasRect;
  gate: Letterbox;
  abs: CanvasRect;
} {
  const overlay = {
    left: canvas.left,
    top: canvas.top,
    width: Math.max(1, canvas.width),
    height: Math.max(1, canvas.height),
  };
  const gate = letterboxRect(overlay.width, overlay.height, aspect);
  return {
    overlay,
    gate,
    abs: {
      left: overlay.left + gate.x,
      top: overlay.top + gate.y,
      width: gate.w,
      height: gate.h,
    },
  };
}
