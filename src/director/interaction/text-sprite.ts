/**
 * 画布文字 Sprite 工厂 — 还原自 formatted/index-Dp22JYcT.js:2034-2067（Vo）。
 *
 * 圆角半透明底板 + 居中文本，导出 sprite 并挂 `__aspect`（宽高比）供调用方
 * 按高度等比缩放（如地面绘制高度标签 scale.set(__aspect*0.32, 0.32, 1)）。
 */
import * as THREE from 'three';

export interface TextSprite extends THREE.Sprite {
  /** 画布宽高比（w/h），用于等比缩放 */
  __aspect: number;
}

export function makeTextSprite(text: string, px: number, color = '#ffffff'): TextSprite | null {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const size = Math.max(12, px);
  const font = `bold ${size}px "PingFang SC", "Microsoft YaHei", sans-serif`;
  ctx.font = font;
  canvas.width = Math.ceil(ctx.measureText(text).width + 0.4 * size * 2);
  canvas.height = Math.ceil(1.5 * size);

  // 圆角底板：半径 0.3*size 的胶囊形
  const radius = 0.3 * size;
  const w = canvas.width;
  const h = canvas.height;
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.lineTo(w - radius, 0);
  ctx.quadraticCurveTo(w, 0, w, radius);
  ctx.lineTo(w, h - radius);
  ctx.quadraticCurveTo(w, h, w - radius, h);
  ctx.lineTo(radius, h);
  ctx.quadraticCurveTo(0, h, 0, h - radius);
  ctx.lineTo(0, radius);
  ctx.quadraticCurveTo(0, 0, radius, 0);
  ctx.fill();

  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, w / 2, h / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false }),
  ) as TextSprite;
  sprite.__aspect = w / h;
  return sprite;
}
