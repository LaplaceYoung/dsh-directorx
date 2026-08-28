/* Foot plant: drop standing roots, CCD ankles to ground. */
import * as THREE from "three";
import { isSeatedPose, LEG_CHAINS, matchFootJoint, rootDrop } from "../src/optics/contact.ts";

function engine() {
  return window.__dxStage?.engine || window.__directorEngine;
}

function collectBones(root, named) {
  const map = { ...named };
  if (!root) return map;
  root.traverse((obj) => {
    if (!obj.isBone && obj.type !== "Bone") return;
    const joint = matchFootJoint(obj.name || "");
    if (joint && !map[joint]) map[joint] = obj;
  });
  return map;
}

function ccd(bones, effectorKey, target, iterations = 12) {
  const chain = LEG_CHAINS[effectorKey];
  const end = bones[chain.effector];
  if (!end) return { ok: false, error: "ankle missing" };
  const joints = chain.joints.filter((name) => bones[name]);
  if (!joints.length) return { ok: false, error: "leg chain missing" };
  const jointPos = new THREE.Vector3();
  const effectorPos = new THREE.Vector3();
  const toEff = new THREE.Vector3();
  const toTgt = new THREE.Vector3();
  const rot = new THREE.Quaternion();
  const boneWorld = new THREE.Quaternion();
  const parentWorld = new THREE.Quaternion();
  for (let iter = 0; iter < iterations; iter += 1) {
    for (let i = joints.length - 1; i >= 0; i -= 1) {
      const bone = bones[joints[i]];
      bone.updateWorldMatrix(true, false);
      end.updateWorldMatrix(true, false);
      bone.getWorldPosition(jointPos);
      end.getWorldPosition(effectorPos);
      toEff.copy(effectorPos).sub(jointPos);
      toTgt.copy(target).sub(jointPos);
      if (toEff.lengthSq() < 1e-8 || toTgt.lengthSq() < 1e-8) continue;
      rot.setFromUnitVectors(toEff.normalize(), toTgt.normalize());
      bone.getWorldQuaternion(boneWorld);
      (bone.parent ?? bone).getWorldQuaternion(parentWorld);
      bone.quaternion.copy(parentWorld.invert().multiply(rot.multiply(boneWorld)));
      bone.updateWorldMatrix(false, true);
    }
  }
  end.getWorldPosition(effectorPos);
  return { ok: true, y: effectorPos.y };
}

function findChar(token) {
  const eng = engine();
  if (!eng?.chars) return null;
  if (eng.chars.has(token)) return token;
  const want = String(token);
  const hits = [];
  for (const [id, rec] of eng.chars) {
    if (id.startsWith(want) || rec?.label === want) hits.push(id);
  }
  return hits.length === 1 ? hits[0] : null;
}

function plantOne(token, groundY) {
  const eng = engine();
  const id = findChar(token);
  const rec = id ? eng?.chars?.get(id) : null;
  const group = rec?.group || rec?.root;
  const inner = rec?.inner || rec?.root || group;
  if (!id || !group || !inner) return { ok: false, id: token, error: "character missing" };
  const named = typeof eng.jointBonesOf === "function" ? eng.jointBonesOf(id) : {};
  const bones = collectBones(inner, named);
  const left = bones.l_ankle;
  const right = bones.r_ankle;
  const ankleY = (bone) => {
    if (!bone) return null;
    const v = new THREE.Vector3();
    bone.getWorldPosition(v);
    return v.y;
  };
  const ly = ankleY(left);
  const ry = ankleY(right);
  const lowest = [ly, ry].filter((y) => y != null);
  const pose = rec.pose || rec.body?.pose;
  const seated = isSeatedPose(pose);
  let dropped = 0;
  if (lowest.length) {
    dropped = rootDrop(group.position.y, Math.min(...lowest), groundY, seated);
    if (dropped > 0.001) {
      group.position.y -= dropped;
      inner.updateWorldMatrix?.(true, true);
      const store = window.__dxStage?.store;
      store?.updateCharacter?.(id, {
        position: { x: group.position.x, y: group.position.y, z: group.position.z },
      }, true);
    }
  }
  const planted = [];
  for (const key of ["l_ankle", "r_ankle"]) {
    const bone = bones[key];
    if (!bone) continue;
    const at = new THREE.Vector3();
    bone.getWorldPosition(at);
    at.y = groundY;
    planted.push({ id: key, ...ccd(bones, key, at) });
  }
  return {
    ok: planted.some((item) => item.ok) || dropped > 0,
    id,
    dropped,
    seated,
    bones: Object.keys(bones),
    planted,
  };
}

async function run(args = {}) {
  const action = args.action || "plant";
  const eng = engine();
  if (!eng?.chars) throw new Error("live engine not ready");
  const groundY = args.groundY != null ? Number(args.groundY) : 0;
  if (action !== "plant") throw new Error(`unknown contact action: ${action}`);
  const wanted = Array.isArray(args.ids) ? args.ids : args.id ? [args.id] : [...eng.chars.keys()];
  const results = wanted.map((id) => plantOne(id, groundY));
  return { ok: results.some((item) => item.ok), groundY, results };
}

window.__dxContact = { run };
