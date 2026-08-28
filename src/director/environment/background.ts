/**
 * 环境背景：天空色 / 全景球 / 平面背景层 — 还原自 formatted/index-Dp22JYcT.js
 * - resolveSky（10339-10343）：env.skyColor 缺省或占位 "#060608" → 主题天空色
 * - syncPanorama（10414-10457）：backgroundMode "flat" 走平面层，否则全景球；
 *   无 panoramaUrl 时回落纯色背景并清理两层
 * - applyFlatBackground/ensureFlatBgLayer/layoutFlatBackground/renderFlatBackground
 *   （10458-10544）：正交全屏 quad + contain/cover 适配 + flatScale/flatOffsetX/Y，
 *   渲染时先 setClearColor(resolveSky) 清屏再画 quad（供离屏快照复现同一管线）；
 * - applyPanoramaTransform（10553-10557）：rotationY(度) + 半径缩放（默认 90）
 *
 * contentRoot 的 sceneScale/sceneRotation/scenePosition 应用与地面高度
 * （syncEnvironment，10318-10338）由引擎侧完成，不在此模块。
 */
import * as THREE from 'three';
import { THEME_PALETTES, type ThemeName } from '../interaction/theme';

/** env.skyColor 判定：空串或旧版占位黑都视为「跟随主题」（formatted:10341-10342） */
const PLACEHOLDER_SKY = '#060608';
/** 全景球默认半径（formatted:10556 panoramaRadius ?? 90） */
export const PANORAMA_DEFAULT_RADIUS = 90;
export function resolveSky(theme: ThemeName, skyColor: string | undefined): string {
  const requested = (skyColor ?? '').toLowerCase();
  if (!requested || requested === PLACEHOLDER_SKY) return THEME_PALETTES[theme].sky;
  return skyColor!;
}

export interface PanoramaOptions {
  rotationYDeg?: number;
  radius?: number;
}

/**
 * 全景背景球：SphereGeometry(1,60,40) BackSide、depthWrite=false、renderOrder=-1。
 * URL 未变化时只更新变换；纹理加载竞态以 url 比对裁决（过期即 dispose）。
 */
export class PanoramaLayer {
  private mesh: THREE.Mesh | null = null;
  private currentUrl = '';
  private readonly loader = new THREE.TextureLoader();

  constructor(private readonly scene: THREE.Scene) {}

  get activeUrl(): string {
    return this.currentUrl;
  }

  sync(
    url: string,
    colorSpace: THREE.ColorSpace,
    opts: PanoramaOptions,
    onLoad?: () => void,
    onError?: (err: unknown) => void,
  ): void {
    if (this.currentUrl === url && this.mesh) {
      this.applyTransform(opts);
      return;
    }
    this.currentUrl = url;
    this.loader.load(
      url,
      (texture) => {
        if (this.currentUrl !== url) {
          texture.dispose();
          onLoad?.();
          return;
        }
        texture.colorSpace = colorSpace;
        if (this.mesh) {
          (this.mesh.material as THREE.MeshBasicMaterial).map = texture;
          (this.mesh.material as THREE.MeshBasicMaterial).needsUpdate = true;
        } else {
          const material = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.BackSide,
            depthWrite: false,
          });
          this.mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 60, 40), material);
          this.mesh.renderOrder = -1;
          this.mesh.userData._isHelper = true;
          this.scene.add(this.mesh);
        }
        this.applyTransform(opts);
        onLoad?.();
      },
      undefined,
      (err) => onError?.(err),
    );
    this.applyTransform(opts);
  }

  applyTransform(opts: PanoramaOptions): void {
    if (!this.mesh) return;
    this.mesh.rotation.y = (opts.rotationYDeg ?? 0) * (Math.PI / 180);
    this.mesh.scale.setScalar(opts.radius ?? PANORAMA_DEFAULT_RADIUS);
  }

  remove(): void {
    this.currentUrl = '';
    if (!this.mesh) return;
    this.scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
    this.mesh = null;
  }
}

export interface FlatFitState {
  /** 图片宽高比 */
  imageAspect: number;
  /** 视口宽高比 */
  viewportAspect: number;
  fit: 'contain' | 'cover' | undefined;
  scale: number | undefined;
  offsetX: number | undefined;
  offsetY: number | undefined;
}

/**
 * 计算平面背景 quad 的 scale(x,y) 与 position(x,y)
 * （layoutFlatBackground 数学，formatted:10502-10518；offset 以 NDC ×2 计）。
 */
export function layoutFlatBackground(state: FlatFitState): {
  scaleX: number;
  scaleY: number;
  positionX: number;
  positionY: number;
} {
  const aspectRatio = state.imageAspect / state.viewportAspect;
  const fit = state.fit ?? 'contain';
  const userScale = state.scale ?? 1;
  let scaleX: number;
  let scaleY: number;
  if (fit === 'cover') {
    const grow = Math.max(1 / aspectRatio, 1);
    scaleX = aspectRatio * grow;
    scaleY = grow;
  } else {
    scaleX = aspectRatio;
    scaleY = 1;
  }
  return {
    scaleX: scaleX * userScale,
    scaleY: scaleY * userScale,
    positionX: (state.offsetX ?? 0) * 2,
    positionY: (state.offsetY ?? 0) * 2,
  };
}

/**
 * 平面背景层：独立正交场景（-1..1 quad），主渲染前先清屏再绘制。
 * flatClear 保存底色（resolveSky 结果），保证快照与实时视口一致。
 */
export class FlatBackgroundLayer {
  private overlayScene = new THREE.Scene();
  private overlayCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private mesh: THREE.Mesh;
  private texture: THREE.Texture | null = null;
  private currentUrl = '';
  private readonly loader = new THREE.TextureLoader();

  /** 底色（resolveSky 输出）；active 时由 render() 用作 clearColor */
  clearColor = new THREE.Color('#000000');

  constructor() {
    this.mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.MeshBasicMaterial({ depthTest: false, depthWrite: false }),
    );
    this.overlayScene.add(this.mesh);
  }

  get active(): boolean {
    return this.currentUrl !== '' && this.texture != null;
  }

  get imageAspect(): number {
    return this._imageAspect;
  }
  private _imageAspect = 16 / 9;

  apply(
    url: string,
    colorSpace: THREE.ColorSpace,
    opts: { fit?: 'contain' | 'cover'; scale?: number; offsetX?: number; offsetY?: number },
    viewportAspect: number,
    onLoad?: () => void,
    onError?: (err: unknown) => void,
  ): void {
    if (this.currentUrl === url && this.texture) {
      this.layout(opts, viewportAspect);
      return;
    }
    this.currentUrl = url;
    this.loader.load(
      url,
      (texture) => {
        if (this.currentUrl !== url) {
          texture.dispose();
          onLoad?.();
          return;
        }
        texture.colorSpace = colorSpace;
        const image = texture.image as { width?: number; height?: number } | undefined;
        this._imageAspect =
          image?.width && image?.height ? image.width / image.height : 16 / 9;
        const old = this.texture;
        this.texture = texture;
        old?.dispose();
        (this.mesh.material as THREE.MeshBasicMaterial).map = texture;
        (this.mesh.material as THREE.MeshBasicMaterial).needsUpdate = true;
        this.layout(opts, viewportAspect);
        onLoad?.();
      },
      undefined,
      (err) => onError?.(err),
    );
  }

  layout(
    opts: { fit?: 'contain' | 'cover'; scale?: number; offsetX?: number; offsetY?: number },
    viewportAspect: number,
  ): void {
    const fitted = layoutFlatBackground({
      imageAspect: this._imageAspect,
      viewportAspect,
      fit: opts.fit,
      scale: opts.scale,
      offsetX: opts.offsetX,
      offsetY: opts.offsetY,
    });
    this.mesh.scale.set(fitted.scaleX, fitted.scaleY, 1);
    this.mesh.position.set(fitted.positionX, fitted.positionY, 0);
  }

  /** 主渲染器上执行：清屏 → 画背景 quad；未激活返回 false（调用方继续常规渲染） */
  render(renderer: THREE.WebGLRenderer, viewportAspect: number): boolean {
    if (!this.active || !this.texture) return false;
    renderer.setClearColor(this.clearColor, 1);
    renderer.clear();
    renderer.render(this.overlayScene, this.overlayCamera);
    return true;
  }

  /** 移除背景：释放纹理并恢复调用方的纯色背景责任 */
  remove(): void {
    this.currentUrl = '';
    this.texture?.dispose();
    this.texture = null;
    (this.mesh.material as THREE.MeshBasicMaterial).map = null;
  }
}
