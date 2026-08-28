/**
 * 选中指示环 — 还原自 formatted/index-Dp22JYcT.js:10297-10317（makeRing）。
 *
 * 平放在地面上的半透明圆环（内 0.55 / 外 0.7，40 段），renderOrder=999、
 * depthTest=false、y=0.02；默认隐藏，由引擎按选中态与 modelVisible 开关。
 * userData 标记 _isSelectionRing/_isHelper（点选过滤与快照隐藏依据）。
 * 使用处：角色环随主题色、道具 #4F8EF7、相机 #FFD60A（放大 1/0.6）。
 */
import * as THREE from 'three';

export function makeSelectionRing(color: string | number): THREE.Mesh {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.55, 0.7, 40),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
      depthTest: false,
    }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.02;
  ring.renderOrder = 999;
  ring.visible = false;
  ring.userData._isSelectionRing = true;
  ring.userData._isHelper = true;
  return ring;
}
