import {
  Quaternion,
  Vector3
} from "./chunks/chunk-NPXDOJG6.js";

// ../../../src/director/optics/contact.ts
var FOOT_ALIASES = {
  l_leg: ["leftupleg", "leftupperleg", "leftthigh", "lupleg", "lupperleg", "lthigh", "uplegl", "thighl", "thigh_l", "defthighl"],
  r_leg: ["rightupleg", "rightupperleg", "rightthigh", "rupleg", "rupperleg", "rthigh", "uplegr", "thighr", "thigh_r", "defthighr"],
  l_knee: ["leftleg", "leftlowerleg", "leftcalf", "lleg", "llowerleg", "legl", "lowerlegl", "shinl", "shin_l", "defshinl"],
  r_knee: ["rightleg", "rightlowerleg", "rightcalf", "rleg", "rlowerleg", "legr", "lowerlegr", "shinr", "shin_r", "defshinr"],
  l_ankle: ["leftfoot", "lfoot", "footl", "foot_l", "deffootl", "leftankle", "lankle"],
  r_ankle: ["rightfoot", "rfoot", "footr", "foot_r", "deffootr", "rightankle", "rankle"]
};
var LEG_CHAINS = {
  l_ankle: { joints: ["l_leg", "l_knee"], effector: "l_ankle" },
  r_ankle: { joints: ["r_leg", "r_knee"], effector: "r_ankle" }
};
function normalizeBoneName(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}
function matchFootJoint(name) {
  const n = normalizeBoneName(name);
  if (FOOT_ALIASES[n]) return n;
  for (const [joint, aliases] of Object.entries(FOOT_ALIASES)) {
    if (aliases.includes(n)) return joint;
  }
  return null;
}
function isSeatedPose(pose) {
  const p = (pose ?? "stand").toLowerCase();
  return p === "sit" || p === "drive" || p === "lie" || p === "lie-down";
}
function rootDrop(rootY, ankleY, groundY = 0, seated = false) {
  if (seated) return 0;
  if (rootY <= 0.08) return 0;
  return Math.min(rootY, Math.max(0, ankleY - groundY));
}

// stage-contact.js
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
  const jointPos = new Vector3();
  const effectorPos = new Vector3();
  const toEff = new Vector3();
  const toTgt = new Vector3();
  const rot = new Quaternion();
  const boneWorld = new Quaternion();
  const parentWorld = new Quaternion();
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
    const v = new Vector3();
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
    if (dropped > 1e-3) {
      group.position.y -= dropped;
      inner.updateWorldMatrix?.(true, true);
      const store = window.__dxStage?.store;
      store?.updateCharacter?.(id, {
        position: { x: group.position.x, y: group.position.y, z: group.position.z }
      }, true);
    }
  }
  const planted = [];
  for (const key of ["l_ankle", "r_ankle"]) {
    const bone = bones[key];
    if (!bone) continue;
    const at = new Vector3();
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
    planted
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
//# sourceMappingURL=stage-contact.js.map
