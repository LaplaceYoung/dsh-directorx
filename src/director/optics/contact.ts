/**
 * Foot plant: drop a standing root so ankles meet the ground, then CCD the leg chains.
 * Three CCDIKSolver is the generic SkinnedMesh solver; this repo already has the same
 * CCD loop in joint-handles.ts / app.jsx `jp`. Live plant uses that loop on ankle effectors.
 * https://threejs.org/docs/pages/CCDIKSolver.html
 */

export const FOOT_JOINTS = ['l_ankle', 'r_ankle'] as const;

export const FOOT_ALIASES: Record<string, string[]> = {
  l_leg: ['leftupleg', 'leftupperleg', 'leftthigh', 'lupleg', 'lupperleg', 'lthigh', 'uplegl', 'thighl', 'thigh_l', 'defthighl'],
  r_leg: ['rightupleg', 'rightupperleg', 'rightthigh', 'rupleg', 'rupperleg', 'rthigh', 'uplegr', 'thighr', 'thigh_r', 'defthighr'],
  l_knee: ['leftleg', 'leftlowerleg', 'leftcalf', 'lleg', 'llowerleg', 'legl', 'lowerlegl', 'shinl', 'shin_l', 'defshinl'],
  r_knee: ['rightleg', 'rightlowerleg', 'rightcalf', 'rleg', 'rlowerleg', 'legr', 'lowerlegr', 'shinr', 'shin_r', 'defshinr'],
  l_ankle: ['leftfoot', 'lfoot', 'footl', 'foot_l', 'deffootl', 'leftankle', 'lankle'],
  r_ankle: ['rightfoot', 'rfoot', 'footr', 'foot_r', 'deffootr', 'rightankle', 'rankle'],
};

export const LEG_CHAINS: Record<string, { joints: string[]; effector: string }> = {
  l_ankle: { joints: ['l_leg', 'l_knee'], effector: 'l_ankle' },
  r_ankle: { joints: ['r_leg', 'r_knee'], effector: 'r_ankle' },
};

export function normalizeBoneName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function matchFootJoint(name: string): string | null {
  const n = normalizeBoneName(name);
  if (FOOT_ALIASES[n]) return n;
  for (const [joint, aliases] of Object.entries(FOOT_ALIASES)) {
    if (aliases.includes(n)) return joint;
  }
  return null;
}

export function isSeatedPose(pose?: string): boolean {
  const p = (pose ?? 'stand').toLowerCase();
  return p === 'sit' || p === 'drive' || p === 'lie' || p === 'lie-down';
}

/** Metres to subtract from root.y so the lower ankle meets ground. Sit keeps hip height. */
export function rootDrop(rootY: number, ankleY: number, groundY = 0, seated = false): number {
  if (seated) return 0;
  if (rootY <= 0.08) return 0;
  return Math.min(rootY, Math.max(0, ankleY - groundY));
}
