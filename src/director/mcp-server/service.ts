import {
  CAMERA_TEMPLATES,
  ACTOR_PRESETS,
  CHARACTER_PERFORMANCE_TEMPLATES,
  MOTION_TEMPLATES,
  PROP_PRESETS,
  activePlan,
  activeShot,
  cameraPatchFromTemplate,
  createDefaultElement,
  createElementFromPreset,
  createDefaultShot,
  createMotionKeyframes,
  elementState,
  evaluateDirectorFrame,
  inspectDirectorPlan,
  motionTemplate,
  newId,
  normalizeShotTimes,
  projectDuration,
  validateProject,
  type DirectorActionClip,
  type DirectorActionId,
  type DirectorCameraMove,
  type DirectorElement,
  type DirectorKeyframeInterpolation,
  type DirectorMotionKeyframe,
  type DirectorSequenceShot,
  type OpenDirectorProject,
  type Vec3,
} from '../index.js';
import { ProjectRepository } from './repository.js';

type JsonObject = Record<string, unknown>;

function object(value: unknown): JsonObject {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonObject : {};
}

function text(value: unknown, name: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${name} is required`);
  return value.trim();
}

function optionalText(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function number(value: unknown, name: string, fallback?: number): number {
  if (value === undefined && fallback !== undefined) return fallback;
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error(`${name} must be a finite number`);
  return value;
}

function boolean(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function vec(value: unknown, name: string): Vec3 {
  const item = object(value);
  return { x: number(item.x, `${name}.x`), y: number(item.y, `${name}.y`), z: number(item.z, `${name}.z`) };
}

function frameToSec(frame: number): number {
  return Math.max(0, Math.round(frame)) / 24;
}

function findElement(project: OpenDirectorProject, id: string): DirectorElement {
  const element = project.elements.find((item) => item.id === id);
  if (!element) throw new Error(`Unknown element id: ${id}`);
  return element;
}

function findShot(project: OpenDirectorProject, id?: string): DirectorSequenceShot {
  const plan = activePlan(project);
  const shot = id ? plan.shots.find((item) => item.id === id) : activeShot(project);
  if (!shot) throw new Error(`Unknown shot id: ${id}`);
  return shot;
}

function assertUnlocked(locked: boolean | undefined, override: boolean, label: string): void {
  if (locked && !override) throw new Error(`${label} is manually locked. Ask the user before setting override_locked=true.`);
}

const AGENT_RULES = [
  'Use the exact element, shot, action and keyframe IDs returned here.',
  'All timeline writes use integer frames at 24fps.',
  'Never override a manually locked item without explicit user confirmation.',
  'Run director_validate after a multi-step edit.',
  'Prefer compact state; set detail=full or read director://catalog only when needed.',
];

function compactSummary(project: OpenDirectorProject): JsonObject {
  const plan = activePlan(project);
  const frame = evaluateDirectorFrame(plan, project.elements, project.currentFrame / 24);
  return {
    name: project.name,
    current_frame: project.currentFrame,
    duration_sec: projectDuration(project),
    active_shot_id: project.activeShotId,
    elements: project.elements.map((item) => ({
      id: item.id,
      kind: item.kind,
      name: item.name,
      position: item.position,
      rotationDeg: item.rotationDeg,
      visible: item.visible,
    })),
    shots: plan.shots.map((shot) => ({
      id: shot.id,
      name: shot.name,
      startSec: shot.startSec,
      durationSec: shot.durationSec,
    })),
    runtime: {
      fps: 24,
      current_time_sec: project.currentFrame / 24,
      evaluated_frame: frame,
    },
    catalog_ids: {
      actions: MOTION_TEMPLATES.map((item) => item.id),
      cameras: CAMERA_TEMPLATES.map((item) => item.id),
      actors: ACTOR_PRESETS.map((item) => item.id),
      props: PROP_PRESETS.map((item) => item.id),
    },
    health: {
      project_issues: validateProject(project),
      plan_issues: inspectDirectorPlan(plan, project.elements),
    },
    agent_rules: AGENT_RULES,
  };
}

function projectSummary(project: OpenDirectorProject): JsonObject {
  const plan = activePlan(project);
  const frame = evaluateDirectorFrame(plan, project.elements, project.currentFrame / 24);
  return {
    project,
    runtime: {
      fps: 24,
      duration_sec: projectDuration(project),
      current_frame: project.currentFrame,
      current_time_sec: project.currentFrame / 24,
      evaluated_frame: frame,
    },
    catalog: {
      actions: MOTION_TEMPLATES,
      cameras: CAMERA_TEMPLATES,
      actors: ACTOR_PRESETS,
      props: PROP_PRESETS,
      performances: CHARACTER_PERFORMANCE_TEMPLATES,
    },
    health: {
      project_issues: validateProject(project),
      plan_issues: inspectDirectorPlan(plan, project.elements),
    },
    agent_rules: AGENT_RULES,
  };
}

export class DirectorService {
  constructor(readonly repository = new ProjectRepository()) {}

  async resource(uri: string): Promise<unknown> {
    const project = await this.repository.get();
    if (uri === 'director://project') return project;
    if (uri === 'director://catalog') {
      return {
        actions: MOTION_TEMPLATES,
        cameras: CAMERA_TEMPLATES,
        actors: ACTOR_PRESETS,
        props: PROP_PRESETS,
        performances: CHARACTER_PERFORMANCE_TEMPLATES,
      };
    }
    const frameMatch = /^director:\/\/frame\/(current|\d+)$/.exec(uri);
    if (frameMatch) {
      const plan = activePlan(project);
      const frame = frameMatch[1] === 'current' ? project.currentFrame : Number(frameMatch[1]);
      return evaluateDirectorFrame(plan, project.elements, frame / 24);
    }
    throw new Error(`Unknown resource: ${uri}`);
  }

  async execute(name: string, rawArguments: unknown = {}): Promise<unknown> {
    const args = object(rawArguments);
    if (name === 'director_get_state') {
      const project = await this.repository.get();
      return optionalText(args.detail) === 'full' ? projectSummary(project) : compactSummary(project);
    }
    if (name === 'director_create_project') return projectSummary(await this.repository.reset(optionalText(args.name)));
    if (name === 'director_undo') {
      const result = await this.repository.undo();
      return result ? { undone: result.label, ...projectSummary(result.project) } : { undone: null, message: 'Nothing to undo' };
    }
    if (name === 'director_redo') {
      const result = await this.repository.redo();
      return result ? { redone: result.label, ...projectSummary(result.project) } : { redone: null, message: 'Nothing to redo' };
    }
    if (name === 'director_validate') return projectSummary(await this.repository.get());
    if (name === 'director_select') return this.select(args);
    if (name === 'director_add_element') return this.addElement(args);
    if (name === 'director_update_element') return this.updateElement(args);
    if (name === 'director_apply_action') return this.applyAction(args);
    if (name === 'director_set_motion_keyframe') return this.setMotionKeyframe(args);
    if (name === 'director_apply_camera') return this.applyCamera(args);
    if (name === 'director_set_camera_keyframe') return this.setCameraKeyframe(args);
    if (name === 'director_manage_shot') return this.manageShot(args);
    if (name === 'director_set_lock') return this.setLock(args);
    if (name === 'director_delete') return this.deleteItem(args);
    throw new Error(`Unknown Director command: ${name}`);
  }

  private async select(args: JsonObject): Promise<unknown> {
    const frame = args.frame === undefined ? undefined : Math.max(0, Math.round(number(args.frame, 'frame')));
    const shotId = optionalText(args.shot_id);
    const project = await this.repository.mutate('Select timeline position', (draft) => {
      if (shotId) {
        const shot = findShot(draft, shotId);
        draft.activeShotId = shot.id;
        draft.currentFrame = Math.round(shot.startSec * 24);
      }
      if (frame !== undefined) draft.currentFrame = frame;
    }, false);
    return projectSummary(project);
  }

  private async addElement(args: JsonObject): Promise<unknown> {
    const kind = optionalText(args.kind) ?? 'mannequin';
    const preset = optionalText(args.preset);
    const project = await this.repository.mutate('Add stage element', (draft) => {
      const index = draft.elements.length;
      let element: DirectorElement;
      if (preset) {
        element = createElementFromPreset(preset, index);
      } else if (kind === 'mannequin') {
        element = createDefaultElement(index);
      } else if (kind === 'crowd') {
        element = {
          id: newId('el'), kind: 'crowd', name: `Crowd ${index + 1}`,
          position: { x: 0, y: 0, z: 0 }, rotationDeg: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 },
          color: '#8fa3b8', visible: true, groupId: null, rows: 3, cols: 4, spacing: 0.8, poseId: 'stand',
        };
      } else {
        if (!['box', 'sphere', 'cylinder', 'wall'].includes(kind)) throw new Error(`Unsupported element kind: ${kind}`);
        element = {
          id: newId('el'), kind: kind as 'box', name: `Prop ${index + 1}`,
          position: { x: 0, y: kind === 'wall' ? 1.5 : 0.5, z: 0 }, rotationDeg: { x: 0, y: 0, z: 0 },
          scale: kind === 'wall' ? { x: 5, y: 3, z: 0.15 } : { x: 1, y: 1, z: 1 },
          color: '#b7bcc5', visible: true, groupId: null,
        };
      }
      element.name = optionalText(args.name) ?? element.name;
      if (args.position) element.position = vec(args.position, 'position');
      if (args.rotation_deg) element.rotationDeg = vec(args.rotation_deg, 'rotation_deg');
      if (args.scale) element.scale = vec(args.scale, 'scale');
      if (optionalText(args.color)) element.color = optionalText(args.color)!;
      if (element.kind === 'mannequin') {
        element.identitySource = (optionalText(args.identity_source) as typeof element.identitySource) ?? element.identitySource ?? 'temporary';
        element.characterId = optionalText(args.character_id) ?? element.characterId ?? element.id;
        element.performanceProfileId = optionalText(args.performance_profile_id) ?? element.performanceProfileId ?? 'neutral';
      }
      draft.elements.push(element);
      for (const plan of draft.plans) for (const shot of plan.shots) shot.elementStates[element.id] = elementState(element);
    });
    return projectSummary(project);
  }

  private async updateElement(args: JsonObject): Promise<unknown> {
    const elementId = text(args.element_id, 'element_id');
    const shotOnly = boolean(args.shot_only);
    const project = await this.repository.mutate('Update stage element', (draft) => {
      const element = findElement(draft, elementId);
      const nextPosition = args.position ? vec(args.position, 'position') : element.position;
      const nextRotation = args.rotation_deg ? vec(args.rotation_deg, 'rotation_deg') : element.rotationDeg;
      const nextScale = args.scale ? vec(args.scale, 'scale') : element.scale;
      if (shotOnly) {
        const shot = findShot(draft, optionalText(args.shot_id));
        const state = shot.elementStates[element.id] ?? elementState(element);
        shot.elementStates[element.id] = { ...state, position: nextPosition, rotationDeg: nextRotation, scale: nextScale, visible: args.visible === undefined ? state.visible : boolean(args.visible) };
      } else {
        element.position = nextPosition;
        element.rotationDeg = nextRotation;
        element.scale = nextScale;
        if (args.visible !== undefined) element.visible = boolean(args.visible);
        if (optionalText(args.name)) element.name = optionalText(args.name)!;
        if (optionalText(args.color)) element.color = optionalText(args.color)!;
        if (element.kind === 'mannequin') {
          if (args.height_m !== undefined) element.heightM = Math.max(0.2, Math.min(4, number(args.height_m, 'height_m')));
          if (optionalText(args.pose_id)) element.poseId = optionalText(args.pose_id)!;
          if (optionalText(args.performance_profile_id)) element.performanceProfileId = optionalText(args.performance_profile_id)!;
        }
        for (const plan of draft.plans) for (const shot of plan.shots) {
          const state = shot.elementStates[element.id] ?? elementState(element);
          shot.elementStates[element.id] = { ...state, position: nextPosition, rotationDeg: nextRotation, scale: nextScale, visible: element.visible };
        }
      }
    });
    return projectSummary(project);
  }

  private async applyAction(args: JsonObject): Promise<unknown> {
    const elementId = text(args.element_id, 'element_id');
    const action = text(args.action, 'action') as DirectorActionId;
    const template = motionTemplate(action);
    if (!MOTION_TEMPLATES.some((item) => item.id === action)) throw new Error(`Unknown action template: ${action}`);
    const project = await this.repository.mutate(`Apply action ${action}`, (draft) => {
      const element = findElement(draft, elementId);
      const shot = findShot(draft, optionalText(args.shot_id));
      const startFrame = Math.max(0, Math.round(number(args.start_frame, 'start_frame', 0)));
      const durationFrames = Math.max(1, Math.round(number(args.duration_frames, 'duration_frames', template.defaultDurationSec * 24)));
      const from = args.from ? vec(args.from, 'from') : (shot.elementStates[element.id]?.position ?? element.position);
      const to = args.to ? vec(args.to, 'to') : { ...from };
      const clip: DirectorActionClip = {
        id: newId('action'), elementId, action, startSec: frameToSec(startFrame), durationSec: frameToSec(durationFrames),
        from, to, templateId: action, intensity: number(args.intensity, 'intensity', 1), locked: boolean(args.locked),
        source: optionalText(args.source) === 'manual' ? 'manual' : 'agent',
        keyframes: createMotionKeyframes(action, frameToSec(durationFrames), from, to, optionalText(args.source) === 'manual' ? 'manual' : 'agent'),
      };
      shot.actions.push(clip);
      shot.actions.sort((a, b) => a.startSec - b.startSec);
    });
    return projectSummary(project);
  }

  private async setMotionKeyframe(args: JsonObject): Promise<unknown> {
    const actionId = text(args.action_id, 'action_id');
    const override = boolean(args.override_locked);
    const manual = optionalText(args.source) === 'manual';
    const project = await this.repository.mutate('Set motion keyframe', (draft) => {
      const shot = findShot(draft, optionalText(args.shot_id));
      const action = shot.actions.find((item) => item.id === actionId);
      if (!action) throw new Error(`Unknown action id: ${actionId}`);
      assertUnlocked(action.locked, override || manual, `Action ${actionId}`);
      const keyframeId = optionalText(args.keyframe_id);
      const existing = keyframeId ? action.keyframes?.find((item) => item.id === keyframeId) : undefined;
      assertUnlocked(existing?.locked, override || manual, `Motion keyframe ${keyframeId}`);
      const frame = Math.max(0, Math.round(number(args.frame, 'frame')));
      const next: DirectorMotionKeyframe = {
        id: existing?.id ?? newId('kf'),
        timeSec: frameToSec(frame),
        position: args.position ? vec(args.position, 'position') : existing?.position,
        rotationDeg: args.rotation_deg ? vec(args.rotation_deg, 'rotation_deg') : existing?.rotationDeg,
        joints: args.joints === undefined ? existing?.joints : object(args.joints) as DirectorMotionKeyframe['joints'],
        pathIn: args.path_in ? vec(args.path_in, 'path_in') : existing?.pathIn,
        pathOut: args.path_out ? vec(args.path_out, 'path_out') : existing?.pathOut,
        pathMode: optionalText(args.path_mode) as DirectorMotionKeyframe['pathMode'] ?? existing?.pathMode,
        interpolation: (optionalText(args.interpolation) as DirectorKeyframeInterpolation) ?? existing?.interpolation ?? 'smooth',
        locked: args.locked === undefined ? existing?.locked : boolean(args.locked),
        source: optionalText(args.source) === 'manual' ? 'manual' : 'agent',
        note: optionalText(args.note) ?? existing?.note,
      };
      action.keyframes = [...(action.keyframes ?? []).filter((item) => item.id !== next.id), next].sort((a, b) => a.timeSec - b.timeSec);
    });
    return projectSummary(project);
  }

  private async applyCamera(args: JsonObject): Promise<unknown> {
    const move = text(args.move, 'move') as DirectorCameraMove;
    if (!CAMERA_TEMPLATES.some((item) => item.id === move)) throw new Error(`Unknown camera template: ${move}`);
    const override = boolean(args.override_locked);
    const project = await this.repository.mutate(`Apply camera ${move}`, (draft) => {
      const shot = findShot(draft, optionalText(args.shot_id));
      for (const frame of shot.cameraKeyframes ?? []) assertUnlocked(frame.locked, override, `Camera keyframe ${frame.id}`);
      Object.assign(shot, cameraPatchFromTemplate(shot, move));
    });
    return projectSummary(project);
  }

  private async setCameraKeyframe(args: JsonObject): Promise<unknown> {
    const override = boolean(args.override_locked);
    const manual = optionalText(args.source) === 'manual';
    const project = await this.repository.mutate('Set camera keyframe', (draft) => {
      const shot = findShot(draft, optionalText(args.shot_id));
      const id = optionalText(args.keyframe_id);
      const existing = id ? shot.cameraKeyframes?.find((item) => item.id === id) : undefined;
      assertUnlocked(existing?.locked, override || manual, `Camera keyframe ${id}`);
      const next = {
        id: existing?.id ?? newId('ckf'),
        timeSec: frameToSec(Math.max(0, Math.round(number(args.frame, 'frame')))),
        position: args.position ? vec(args.position, 'position') : existing?.position ?? shot.position,
        target: args.target ? vec(args.target, 'target') : existing?.target ?? shot.target,
        fov: number(args.fov, 'fov', existing?.fov ?? shot.fov),
        rollDeg: number(args.roll_deg, 'roll_deg', existing?.rollDeg ?? 0),
        interpolation: (optionalText(args.interpolation) as DirectorKeyframeInterpolation) ?? existing?.interpolation ?? 'smooth',
        locked: args.locked === undefined ? existing?.locked : boolean(args.locked),
        source: optionalText(args.source) === 'manual' ? 'manual' as const : 'agent' as const,
        note: optionalText(args.note) ?? existing?.note,
      };
      shot.cameraKeyframes = [...(shot.cameraKeyframes ?? []).filter((item) => item.id !== next.id), next].sort((a, b) => a.timeSec - b.timeSec);
      const first = shot.cameraKeyframes[0];
      const last = shot.cameraKeyframes[shot.cameraKeyframes.length - 1];
      Object.assign(shot, { position: first.position, target: first.target, fov: first.fov, rollDeg: first.rollDeg, cameraEnd: { position: last.position, target: last.target, fov: last.fov, rollDeg: last.rollDeg } });
    });
    return projectSummary(project);
  }

  private async manageShot(args: JsonObject): Promise<unknown> {
    const operation = text(args.operation, 'operation');
    const project = await this.repository.mutate(`${operation} shot`, (draft) => {
      const plan = activePlan(draft);
      if (operation === 'add') {
        const duration = Math.max(1 / 24, frameToSec(Math.max(1, Math.round(number(args.duration_frames, 'duration_frames', 90)))));
        const shot = createDefaultShot(draft.elements, plan.shots.length, projectDuration(draft), duration, draft.aspect);
        shot.name = optionalText(args.name) ?? shot.name;
        plan.shots.push(shot);
        draft.activeShotId = shot.id;
      } else if (operation === 'duplicate') {
        const source = findShot(draft, optionalText(args.shot_id));
        const copy = structuredClone(source);
        copy.id = newId('shot');
        copy.name = `${source.name} Copy`;
        copy.actions = copy.actions.map((action) => ({ ...action, id: newId('action'), keyframes: action.keyframes?.map((frame) => ({ ...frame, id: newId('kf') })) }));
        copy.cameraKeyframes = copy.cameraKeyframes?.map((frame) => ({ ...frame, id: newId('ckf') }));
        plan.shots.splice(plan.shots.indexOf(source) + 1, 0, copy);
        draft.activeShotId = copy.id;
      } else if (operation === 'rename') {
        findShot(draft, optionalText(args.shot_id)).name = text(args.name, 'name');
      } else if (operation === 'delete') {
        const shot = findShot(draft, optionalText(args.shot_id));
        if (plan.shots.length === 1) throw new Error('A plan must keep at least one shot');
        plan.shots = plan.shots.filter((item) => item.id !== shot.id);
        draft.activeShotId = plan.shots[0].id;
      } else if (operation === 'reorder') {
        const shot = findShot(draft, optionalText(args.shot_id));
        const targetIndex = Math.max(0, Math.min(plan.shots.length - 1, Math.round(number(args.index, 'index'))));
        plan.shots = plan.shots.filter((item) => item.id !== shot.id);
        plan.shots.splice(targetIndex, 0, shot);
      } else {
        throw new Error(`Unsupported shot operation: ${operation}`);
      }
      const normalized = normalizeShotTimes(plan);
      draft.plans = draft.plans.map((item) => item.id === plan.id ? normalized : item);
    });
    return projectSummary(project);
  }

  private async setLock(args: JsonObject): Promise<unknown> {
    const target = text(args.target, 'target');
    const id = text(args.id, 'id');
    const locked = boolean(args.locked, true);
    const project = await this.repository.mutate(`${locked ? 'Lock' : 'Unlock'} ${target}`, (draft) => {
      const shot = findShot(draft, optionalText(args.shot_id));
      if (target === 'action') {
        const action = shot.actions.find((item) => item.id === id);
        if (!action) throw new Error(`Unknown action id: ${id}`);
        action.locked = locked;
      } else if (target === 'motion_keyframe') {
        const frame = shot.actions.flatMap((item) => item.keyframes ?? []).find((item) => item.id === id);
        if (!frame) throw new Error(`Unknown motion keyframe id: ${id}`);
        frame.locked = locked;
      } else if (target === 'camera_keyframe') {
        const frame = shot.cameraKeyframes?.find((item) => item.id === id);
        if (!frame) throw new Error(`Unknown camera keyframe id: ${id}`);
        frame.locked = locked;
      } else throw new Error(`Unsupported lock target: ${target}`);
    });
    return projectSummary(project);
  }

  private async deleteItem(args: JsonObject): Promise<unknown> {
    const target = text(args.target, 'target');
    const id = text(args.id, 'id');
    const override = boolean(args.override_locked);
    const project = await this.repository.mutate(`Delete ${target}`, (draft) => {
      const shot = findShot(draft, optionalText(args.shot_id));
      if (target === 'element') {
        findElement(draft, id);
        draft.elements = draft.elements.filter((item) => item.id !== id);
        for (const plan of draft.plans) for (const item of plan.shots) {
          delete item.elementStates[id];
          item.actions = item.actions.filter((action) => action.elementId !== id);
        }
      } else if (target === 'action') {
        const action = shot.actions.find((item) => item.id === id);
        if (!action) throw new Error(`Unknown action id: ${id}`);
        assertUnlocked(action.locked, override, `Action ${id}`);
        shot.actions = shot.actions.filter((item) => item.id !== id);
      } else if (target === 'motion_keyframe') {
        for (const action of shot.actions) {
          const frame = action.keyframes?.find((item) => item.id === id);
          if (frame) assertUnlocked(frame.locked || action.locked, override, `Motion keyframe ${id}`);
          action.keyframes = action.keyframes?.filter((item) => item.id !== id);
        }
      } else if (target === 'camera_keyframe') {
        const frame = shot.cameraKeyframes?.find((item) => item.id === id);
        if (!frame) throw new Error(`Unknown camera keyframe id: ${id}`);
        assertUnlocked(frame.locked, override, `Camera keyframe ${id}`);
        shot.cameraKeyframes = shot.cameraKeyframes?.filter((item) => item.id !== id);
      } else throw new Error(`Unsupported delete target: ${target}`);
    });
    return projectSummary(project);
  }
}
