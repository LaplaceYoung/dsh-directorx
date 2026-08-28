import type { CameraPose } from '../engine';

export interface ShotFraming {
  id: string;
  label: string;
  pose: CameraPose;
}

/** Recovered from original Bc camera preset table — local, no CDN. */
export const SHOT_FRAMINGS: ShotFraming[] = [
  { id: 'front_medium', label: '正面中景', pose: { position: { x: 0, y: 1.5, z: 4 }, target: { x: 0, y: 1.2, z: 0 }, fov: 50 } },
  { id: 'front_closeup', label: '正面特写', pose: { position: { x: 0, y: 1.7, z: 2 }, target: { x: 0, y: 1.6, z: 0 }, fov: 35 } },
  { id: 'front_wide', label: '正面全景', pose: { position: { x: 0, y: 2.5, z: 8 }, target: { x: 0, y: 1, z: 0 }, fov: 60 } },
  { id: 'side_tracking', label: '侧面跟拍', pose: { position: { x: 4, y: 1.5, z: 0 }, target: { x: 0, y: 1.2, z: 0 }, fov: 50 } },
  { id: 'side_close', label: '侧面近景', pose: { position: { x: 2.5, y: 1.5, z: 0 }, target: { x: 0, y: 1.5, z: 0 }, fov: 40 } },
  { id: 'back_medium', label: '背面中景', pose: { position: { x: 0, y: 1.5, z: -4 }, target: { x: 0, y: 1.2, z: 0 }, fov: 50 } },
  { id: 'top_wide', label: '俯拍全景', pose: { position: { x: 0, y: 8, z: 3 }, target: { x: 0, y: 0, z: 0 }, fov: 55 } },
  { id: 'top_45', label: '45°俯拍', pose: { position: { x: 0, y: 5, z: 5 }, target: { x: 0, y: 1, z: 0 }, fov: 50 } },
  { id: 'low_angle', label: '低角度仰拍', pose: { position: { x: 0, y: 0.3, z: 3 }, target: { x: 0, y: 1.8, z: 0 }, fov: 45 } },
  { id: 'low_wide', label: '低角度广角', pose: { position: { x: 0, y: 0.5, z: 5 }, target: { x: 0, y: 1, z: 0 }, fov: 70 } },
  { id: 'over_shoulder_l', label: '过肩镜头', pose: { position: { x: -0.5, y: 1.7, z: 2.5 }, target: { x: 0.5, y: 1.6, z: 0 }, fov: 50 } },
  { id: 'over_shoulder_r', label: '过肩镜头(右)', pose: { position: { x: 0.5, y: 1.7, z: 2.5 }, target: { x: -0.5, y: 1.6, z: 0 }, fov: 50 } },
  { id: 'birdseye', label: '鸟瞰', pose: { position: { x: 0, y: 12, z: 0.5 }, target: { x: 0, y: 0, z: 0 }, fov: 50 } },
  { id: 'dutch', label: '荷兰角', pose: { position: { x: 1.2, y: 1.6, z: 3.4 }, target: { x: 0, y: 1.3, z: 0 }, fov: 42, rollDeg: 18 } },
];
