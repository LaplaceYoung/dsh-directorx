import { nanoid } from 'nanoid';
import { createCameraKeyframes } from './cameraTemplates';
import type {
  AspectId,
  DirectorElement,
  DirectorElementState,
  DirectorPlan,
  DirectorSequenceShot,
  Vec3,
} from './types';

export const DIRECTOR_PROJECT_VERSION = 1;
export const DIRECTOR_FPS = 24;

export interface OpenDirectorProject {
  version: 1;
  id: string;
  name: string;
  aspect: AspectId;
  elements: DirectorElement[];
  plans: DirectorPlan[];
  activePlanId: string;
  activeShotId: string;
  currentFrame: number;
  createdAt: number;
  updatedAt: number;
}

export function newId(prefix: string): string {
  return `${prefix}-${nanoid(8)}`;
}

export function elementState(element: DirectorElement): DirectorElementState {
  return {
    position: structuredClone(element.position),
    rotationDeg: structuredClone(element.rotationDeg),
    scale: structuredClone(element.scale),
    visible: element.visible,
  };
}

export function normalizeShotTimes(plan: DirectorPlan): DirectorPlan {
  let cursor = 0;
  return {
    ...plan,
    shots: plan.shots.map((shot) => {
      const next = { ...shot, startSec: cursor, durationSec: Math.max(1 / DIRECTOR_FPS, shot.durationSec) };
      cursor += next.durationSec;
      return next;
    }),
  };
}

export function projectDuration(project: OpenDirectorProject): number {
  const plan = project.plans.find((item) => item.id === project.activePlanId) ?? project.plans[0];
  return plan?.shots.reduce((sum, shot) => sum + shot.durationSec, 0) ?? 0;
}

export function createDefaultElement(index = 0): DirectorElement {
  return {
    id: newId('el'),
    kind: 'mannequin',
    name: `Actor ${index + 1}`,
    position: { x: index * 1.4 - 0.7, y: 0, z: 0 },
    rotationDeg: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    color: index % 2 ? '#55c2ff' : '#ff7a66',
    visible: true,
    groupId: null,
    poseId: 'stand',
    joints: {},
    heightM: 1.72,
    figure: 'male',
    identitySource: 'temporary',
    performanceProfileId: 'neutral',
  };
}

export function createDefaultShot(elements: DirectorElement[], index = 0, startSec = 0, durationSec = 3.75, aspect: AspectId = '16:9'): DirectorSequenceShot {
  const position: Vec3 = { x: index % 2 ? 2.6 : 0, y: 2.2, z: index % 2 ? 6.2 : 7.2 };
  const target: Vec3 = { x: 0, y: 1, z: 0 };
  const shot: DirectorSequenceShot = {
    id: newId('shot'),
    name: `Shot ${index + 1}`,
    position,
    target,
    fov: index % 2 ? 42 : 50,
    aspect,
    createdAt: Date.now(),
    startSec,
    durationSec,
    cameraEnd: { position: { ...position }, target: { ...target }, fov: index % 2 ? 42 : 50 },
    cameraMove: 'static',
    elementStates: Object.fromEntries(elements.map((element) => [element.id, elementState(element)])),
    actions: [],
  };
  shot.cameraKeyframes = createCameraKeyframes(shot, 'static');
  return shot;
}

export function createDefaultProject(name = 'Untitled Previs'): OpenDirectorProject {
  const elements = [createDefaultElement(0), createDefaultElement(1)];
  const shots = Array.from({ length: 4 }, (_, index) => createDefaultShot(elements, index, index * 3.75));
  const plan: DirectorPlan = {
    id: newId('plan'),
    name: 'Main Plan',
    summary: '15 seconds, 4 shots, agent-ready 3D previs',
    createdAt: Date.now(),
    shots,
  };
  const now = Date.now();
  return {
    version: DIRECTOR_PROJECT_VERSION,
    id: newId('project'),
    name,
    aspect: '16:9',
    elements,
    plans: [plan],
    activePlanId: plan.id,
    activeShotId: shots[0].id,
    currentFrame: 0,
    createdAt: now,
    updatedAt: now,
  };
}

export function activePlan(project: OpenDirectorProject): DirectorPlan {
  const plan = project.plans.find((item) => item.id === project.activePlanId) ?? project.plans[0];
  if (!plan) throw new Error('Project has no director plan');
  return plan;
}

export function activeShot(project: OpenDirectorProject): DirectorSequenceShot {
  const plan = activePlan(project);
  const shot = plan.shots.find((item) => item.id === project.activeShotId) ?? plan.shots[0];
  if (!shot) throw new Error('Project has no shot');
  return shot;
}

export function validateProject(project: OpenDirectorProject): string[] {
  const issues: string[] = [];
  if (project.version !== DIRECTOR_PROJECT_VERSION) issues.push(`Unsupported project version: ${project.version}`);
  if (!project.plans.length) issues.push('Project has no plans');
  if (!project.elements.length) issues.push('Project has no stage elements');
  const ids = new Set<string>();
  for (const element of project.elements) {
    if (ids.has(element.id)) issues.push(`Duplicate element id: ${element.id}`);
    ids.add(element.id);
  }
  for (const plan of project.plans) {
    if (!plan.shots.length) issues.push(`Plan ${plan.id} has no shots`);
    for (const shot of plan.shots) {
      for (const action of shot.actions) {
        if (!ids.has(action.elementId)) issues.push(`Action ${action.id} references missing element ${action.elementId}`);
      }
    }
  }
  return issues;
}
