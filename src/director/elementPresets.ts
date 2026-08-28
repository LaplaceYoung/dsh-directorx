import { actorIdentityColor } from './identityPalette';
import { createDefaultElement, newId } from './project';
import type { DirectorElement, FigureStyle, PrimitiveElement } from './types';

export const ACTOR_PRESETS = [
  { id: 'male', label: '男素体', description: '标准成年男性白模（程序化关节人）', kind: 'person', figure: 'male', heightM: 1.78 },
  { id: 'female', label: '女素体', description: '较窄肩、略宽髋的成年女性白模', kind: 'person', figure: 'female', heightM: 1.66 },
  { id: 'person', label: '中性成人', description: '通用成年人白模', kind: 'person', figure: 'male', heightM: 1.72 },
  { id: 'tall-person', label: '高个', description: '用于身高差和威压构图', kind: 'person', figure: 'tall', heightM: 1.92 },
  { id: 'stocky', label: '壮硕', description: '更宽肩髋的体型', kind: 'person', figure: 'stocky', heightM: 1.7 },
  { id: 'hero', label: '英雄体', description: '夸张肩宽的预演体型', kind: 'person', figure: 'hero', heightM: 1.84 },
  { id: 'child', label: '儿童', description: '头身比更大的矮小体型', kind: 'person', figure: 'child', heightM: 1.22 },
  { id: 'quadruped', label: '四足动物', description: '中型走位白模', kind: 'animal' },
  { id: 'small-animal', label: '小型动物', description: '小型走位白模', kind: 'animal' },
  { id: 'crowd-3', label: '小群众', description: '3×3 阵列', kind: 'crowd' },
  { id: 'crowd-5', label: '大群众', description: '4×5 阵列', kind: 'crowd' },
] as const;

export const PROP_PRESETS = [
  { id: 'mesh_cube', label: '立方体', kind: 'box', scale: { x: 1, y: 1, z: 1 }, y: 0.5 },
  { id: 'mesh_sphere', label: '球体', kind: 'sphere', scale: { x: 1, y: 1, z: 1 }, y: 0.5 },
  { id: 'mesh_cylinder', label: '圆柱', kind: 'cylinder', scale: { x: 1, y: 1.2, z: 1 }, y: 0.6 },
  { id: 'table', label: '长桌', kind: 'box', scale: { x: 1.8, y: 0.75, z: 0.9 }, y: 0.375 },
  { id: 'square_table', label: '方桌', kind: 'box', scale: { x: 1.2, y: 0.75, z: 1.2 }, y: 0.375 },
  { id: 'round-table', label: '圆桌', kind: 'cylinder', scale: { x: 1.25, y: 0.75, z: 1.25 }, y: 0.375 },
  { id: 'desk', label: '书桌', kind: 'box', scale: { x: 1.6, y: 0.74, z: 0.7 }, y: 0.37 },
  { id: 'chair', label: '椅子', kind: 'box', scale: { x: 0.55, y: 0.48, z: 0.55 }, y: 0.24 },
  { id: 'stool', label: '圆凳', kind: 'cylinder', scale: { x: 0.4, y: 0.45, z: 0.4 }, y: 0.225 },
  { id: 'armchair', label: '扶手椅', kind: 'box', scale: { x: 0.85, y: 0.7, z: 0.85 }, y: 0.35 },
  { id: 'sofa', label: '沙发', kind: 'box', scale: { x: 2.1, y: 0.75, z: 0.9 }, y: 0.375 },
  { id: 'bed', label: '床', kind: 'box', scale: { x: 2, y: 0.45, z: 1.6 }, y: 0.225 },
  { id: 'bookshelf', label: '书架', kind: 'box', scale: { x: 1.2, y: 2.2, z: 0.35 }, y: 1.1 },
  { id: 'cabinet', label: '矮柜', kind: 'box', scale: { x: 1.1, y: 0.85, z: 0.45 }, y: 0.425 },
  { id: 'wardrobe', label: '衣柜', kind: 'box', scale: { x: 1.2, y: 2.1, z: 0.55 }, y: 1.05 },
  { id: 'tv', label: '电视', kind: 'box', scale: { x: 1.2, y: 0.75, z: 0.12 }, y: 0.9 },
  { id: 'wall_tv', label: '挂墙电视', kind: 'box', scale: { x: 1.4, y: 0.8, z: 0.08 }, y: 1.5 },
  { id: 'floor_lamp', label: '落地灯', kind: 'cylinder', scale: { x: 0.18, y: 1.7, z: 0.18 }, y: 0.85 },
  { id: 'table_lamp', label: '台灯', kind: 'cylinder', scale: { x: 0.22, y: 0.45, z: 0.22 }, y: 0.9 },
  { id: 'rug', label: '地毯', kind: 'box', scale: { x: 2.4, y: 0.02, z: 1.6 }, y: 0.01 },
  { id: 'door', label: '门', kind: 'wall', scale: { x: 0.85, y: 1, z: 1 }, y: 1.2 },
  { id: 'wall', label: '墙体', kind: 'wall', scale: { x: 2.5, y: 2, z: 0.15 }, y: 1.2 },
  { id: 'column', label: '立柱', kind: 'cylinder', scale: { x: 0.55, y: 2.4, z: 0.55 }, y: 1.2 },
  { id: 'staircase', label: '楼梯', kind: 'box', scale: { x: 1.2, y: 0.9, z: 2.4 }, y: 0.45 },
  { id: 'ramp', label: '斜坡', kind: 'box', scale: { x: 1.4, y: 0.2, z: 3 }, y: 0.1 },
  { id: 'platform', label: '平台', kind: 'box', scale: { x: 2, y: 0.2, z: 2 }, y: 0.1 },
  { id: 'arch', label: '拱门', kind: 'wall', scale: { x: 1.2, y: 1.1, z: 0.3 }, y: 1.3 },
  { id: 'fence', label: '栅栏', kind: 'box', scale: { x: 2.4, y: 1, z: 0.08 }, y: 0.5 },
  { id: 'ladder', label: '梯子', kind: 'box', scale: { x: 0.5, y: 2.2, z: 0.08 }, y: 1.1 },
  { id: 'statue', label: '雕像', kind: 'cylinder', scale: { x: 0.5, y: 1.6, z: 0.5 }, y: 0.8 },
  { id: 'tree_small', label: '小树', kind: 'cylinder', scale: { x: 0.7, y: 1.8, z: 0.7 }, y: 0.9 },
  { id: 'tree_large', label: '大树', kind: 'cylinder', scale: { x: 1.2, y: 3.2, z: 1.2 }, y: 1.6 },
  { id: 'rock', label: '石头', kind: 'sphere', scale: { x: 0.8, y: 0.5, z: 0.7 }, y: 0.25 },
  { id: 'bush', label: '灌木', kind: 'sphere', scale: { x: 0.9, y: 0.7, z: 0.9 }, y: 0.35 },
  { id: 'potted_plant', label: '盆栽', kind: 'cylinder', scale: { x: 0.35, y: 0.8, z: 0.35 }, y: 0.4 },
  { id: 'stump', label: '树桩', kind: 'cylinder', scale: { x: 0.5, y: 0.4, z: 0.5 }, y: 0.2 },
  { id: 'car', label: '轿车', kind: 'box', scale: { x: 1.8, y: 1.3, z: 4.2 }, y: 0.65 },
  { id: 'truck', label: '卡车', kind: 'box', scale: { x: 2.2, y: 2.2, z: 6 }, y: 1.1 },
  { id: 'bicycle', label: '自行车', kind: 'box', scale: { x: 0.4, y: 1, z: 1.6 }, y: 0.5 },
  { id: 'streetlamp', label: '路灯', kind: 'cylinder', scale: { x: 0.16, y: 3.2, z: 0.16 }, y: 1.6 },
  { id: 'bench', label: '长椅', kind: 'box', scale: { x: 1.6, y: 0.45, z: 0.5 }, y: 0.225 },
  { id: 'trash_bin', label: '垃圾桶', kind: 'cylinder', scale: { x: 0.45, y: 0.8, z: 0.45 }, y: 0.4 },
  { id: 'traffic_cone', label: '路锥', kind: 'cylinder', scale: { x: 0.28, y: 0.7, z: 0.28 }, y: 0.35 },
  { id: 'sign', label: '路牌', kind: 'box', scale: { x: 0.9, y: 1.4, z: 0.08 }, y: 1.4 },
  { id: 'fire_hydrant', label: '消防栓', kind: 'cylinder', scale: { x: 0.28, y: 0.7, z: 0.28 }, y: 0.35 },
  { id: 'barrel', label: '油桶', kind: 'cylinder', scale: { x: 0.55, y: 0.9, z: 0.55 }, y: 0.45 },
  { id: 'crate', label: '木箱', kind: 'box', scale: { x: 0.8, y: 0.8, z: 0.8 }, y: 0.4 },
  { id: 'screen', label: '屏幕', kind: 'box', scale: { x: 2.2, y: 1.3, z: 0.12 }, y: 1.3 },
] as const;

export type ActorPresetId = typeof ACTOR_PRESETS[number]['id'];
export type PropPresetId = typeof PROP_PRESETS[number]['id'];

export function createElementFromPreset(presetId: string, index: number): DirectorElement {
  const actor = ACTOR_PRESETS.find((item) => item.id === presetId);
  if (actor) {
    if (actor.kind === 'crowd') {
      const large = actor.id === 'crowd-5';
      return {
        id: newId('el'), kind: 'crowd', name: `Crowd ${index + 1}`,
        position: { x: 0, y: 0, z: 0 }, rotationDeg: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 },
        color: actorIdentityColor(index), visible: true, groupId: null,
        rows: large ? 4 : 3, cols: large ? 5 : 3, spacing: 0.8, poseId: 'stand',
      };
    }
    const element = createDefaultElement(index);
    if (element.kind !== 'mannequin') return element;
    if (actor.kind === 'animal') {
      element.bodyType = 'animal';
      element.animalSpecies = actor.id === 'small-animal' ? 'small' : 'quadruped';
      element.heightM = actor.id === 'small-animal' ? 0.55 : 1.05;
      element.name = `Animal ${index + 1}`;
    } else {
      element.bodyType = 'person';
      element.figure = 'figure' in actor ? (actor.figure as FigureStyle) : 'male';
      element.heightM = 'heightM' in actor && typeof actor.heightM === 'number' ? actor.heightM : 1.72;
      element.name = actor.label;
    }
    element.color = actorIdentityColor(index);
    return element;
  }

  const prop = PROP_PRESETS.find((item) => item.id === presetId);
  if (!prop) throw new Error(`Unknown element preset: ${presetId}`);
  return {
    id: newId('el'), kind: prop.kind as PrimitiveElement['kind'], name: `Prop ${index + 1}`,
    position: { x: 0, y: prop.y, z: 0 }, rotationDeg: { x: 0, y: 0, z: 0 }, scale: { ...prop.scale },
    color: '#b7bcc5', visible: true, groupId: null,
  };
}
