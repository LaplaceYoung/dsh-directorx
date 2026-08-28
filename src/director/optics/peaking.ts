/**
 * Focus-peaking band width in metres.
 * Unreal VCam: red outline at focal distance; the outlined area expands/contracts with iris.
 * https://dev.epicgames.com/documentation/unreal-engine/unreal-vcam-virtual-camera-settings
 *
 * BokehPass `aperture` is blur amount (larger = shallower). That is the inverse of f-stop:
 * more blur → thinner in-focus slice.
 */

export const DEFAULT_BOKEH_APERTURE = 0.00022;

export function peakWidthMeters(aperture = DEFAULT_BOKEH_APERTURE, focusM = 4): number {
  const a = Math.max(1e-6, Number(aperture) || DEFAULT_BOKEH_APERTURE);
  const fromIris = 0.2 * (DEFAULT_BOKEH_APERTURE / a);
  const fromFocus = 0.03 * Math.max(0.4, Number(focusM) || 4);
  return Math.min(2.5, Math.max(0.05, fromIris + fromFocus));
}
