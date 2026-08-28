/**
 * 第一人称视角控制器 — 双击模型进入，WASD+鼠标移动视角，ESC 退出。
 *
 * 进入条件：双击场景中的角色素体
 * 退出方式：ESC 或再次双击
 */

import * as THREE from 'three'

export interface FirstPersonConfig {
  /** 前进速度 m/s */
  moveSpeed: number
  /** 鼠标灵敏度 */
  mouseSensitivity: number
  /** 相机高度偏移(米)，从角色头顶向下 */
  eyeHeightOffset: number
}

const DEFAULT_CONFIG: FirstPersonConfig = {
  moveSpeed: 2.5,
  mouseSensitivity: 0.002,
  eyeHeightOffset: 0.12,
}

export class FirstPersonController {
  private camera: THREE.PerspectiveCamera
  private domElement: HTMLElement
  private config: FirstPersonConfig

  /** 是否处于第一人称模式 */
  active = false
  /** 当前控制的角色 root Group */
  targetCharacter: THREE.Group | null = null
  /** 角色的 yaw 旋转（WASD 改变朝向时更新）*/
  characterYaw = 0

  // 键盘状态
  private keys = new Set<string>()
  // 鼠标锁定状态
  private pointerLocked = false

  // 内部事件监听器引用（dispose 时移除）
  private disposers: (() => void)[] = []

  /** 进入/退出第一人称时的回调 */
  onEnter: ((characterId: string) => void) | null = null
  onExit: (() => void) | null = null

  constructor(
    camera: THREE.PerspectiveCamera,
    domElement: HTMLElement,
    config?: Partial<FirstPersonConfig>,
  ) {
    this.camera = camera
    this.domElement = domElement
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  // ── 进入/退出 ──

  /**
   * 双击角色后调用：切换到第一人称视角。
   * @param characterRoot 角色素的 THREE.Group
   * @param characterId 稳定 id（用于通知外部）
   */
  enter(characterRoot: THREE.Group, characterId: string): void {
    if (this.active) this.exit()

    this.active = true
    this.targetCharacter = characterRoot

    // 把相机放到角色头部位置（头顶减去 eyeHeightOffset）
    const headY = this.getHeadHeight(characterRoot)
    const charPos = characterRoot.getWorldPosition(new THREE.Vector3())
    this.camera.position.set(charPos.x, charPos.y + headY - this.config.eyeHeightOffset, charPos.z)

    // 记录角色朝向为初始 yaw
    this.characterYaw = characterRoot.rotation.y

    // 请求 Pointer Lock（隐藏鼠标光标，捕获相对移动）
    this.domElement.requestPointerLock()
    this.pointerLocked = true

    // 注册键盘/鼠标事件
    this.bindEvents()

    this.onEnter?.(characterId)
  }

  /** 退出第一人称，恢复自由视角 */
  exit(): void {
    if (!this.active) return

    this.active = false
    this.targetCharacter = null
    this.keys.clear()

    if (this.pointerLocked) {
      document.exitPointerLock()
      this.pointerLocked = false
    }

    this.unbindEvents()
    this.onExit?.()
  }

  toggle(characterRoot: THREE.Group, characterId: string): void {
    if (this.active) this.exit()
    else this.enter(characterRoot, characterId)
  }

  // ── 事件绑定 ──

  private bindEvents(): void {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') { this.exit(); return }
      if (e.code === 'KeyR') { /* R 重置位置 */ }
      this.keys.add(e.code)
    }
    const onKeyUp = (e: KeyboardEvent) => this.keys.delete(e.code)

    const onMouseMove = (e: MouseEvent) => {
      if (!this.pointerLocked || !this.active) return
      // 鼠标 X → yaw 旋转；Y → pitch（仅相机俯仰）
      this.characterYaw -= e.movementX * this.config.mouseSensitivity
      const pitchDelta = -e.movementY * this.config.mouseSensitivity

      // 更新相机四元数：yaw 绕 Y 轴 + pitch 绕局部 X 轴
      const euler = new THREE.Euler(0, 0, 0, 'YXZ')
      euler.setFromQuaternion(this.camera.quaternion)
      euler.y += e.movementX * this.config.mouseSensitivity
      euler.x = THREE.MathUtils.clamp(euler.x + pitchDelta, -Math.PI / 2.1, Math.PI / 2.1)
      this.camera.quaternion.setFromEuler(euler)
    }

    const onPointerLockChange = () => {
      this.pointerLocked = document.pointerLockElement === this.domElement
      if (!this.pointerLocked && this.active) this.exit()
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('keyup', onKeyUp)
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('pointerlockchange', onPointerLockChange)

    this.disposers.push(
      () => document.removeEventListener('keydown', onKeyDown),
      () => document.removeEventListener('keyup', onKeyUp),
      () => document.removeEventListener('mousemove', onMouseMove),
      () => document.removeEventListener('pointerlockchange', onPointerLockChange),
    )
  }

  private unbindEvents(): void {
    for (const d of this.disposers) d()
    this.disposers.length = 0
  }

  // ── 每帧更新 ──

  /**
   * 每帧调用：处理 WASD 移动并同步角色位置。
   * @param dtMs 距上帧毫秒数
   */
  update(dtMs: number): void {
    if (!this.active || !this.targetCharacter) return

    const dtS = Math.min(dtMs / 1000, 0.1)
    const speed = this.moveSpeedWithModifiers()
    const move = new THREE.Vector3()

    // WASD 方向向量（在相机水平面上）
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion)
    forward.y = 0
    forward.normalize()
    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0))

    if (this.keys.has('KeyW')) move.add(forward)
    if (this.keys.has('KeyS')) move.sub(forward)
    if (this.keys.has('KeyA')) move.sub(right)
    if (this.keys.has('KeyD')) move.add(right)

    // Shift 加速
    const finalSpeed = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight')
      ? speed * 1.8 : speed

    if (move.lengthSq() > 0) {
      move.normalize().multiplyScalar(finalSpeed * dtS)
      this.targetCharacter.position.add(move)

      // 同步角色朝向到相机 yaw
      this.targetCharacter.rotation.y = this.characterYaw
    }

    // Q/E 升降
    if (this.keys.has('KeyQ')) this.targetCharacter.position.y -= speed * dtS
    if (this.keys.has('KeyE')) this.targetCharacter.position.y += speed * dtS

    // 同步相机到角色头部位置
    const headY = this.getHeadHeight(this.targetCharacter)
    const charPos = this.targetCharacter.getWorldPosition(new THREE.Vector3())
    this.camera.position.set(charPos.x, charPos.y + headY - this.config.eyeHeightOffset, charPos.z)
  }

  private moveSpeedWithModifiers(): number {
    return this.config.moveSpeed
  }

  /** 从骨骼 rig 推算头部高度（遍历找 neck/head 关节）*/
  private getHeadHeight(root: THREE.Group): number {
    const neck = root.getObjectByName('neck')
    if (neck) return neck.getWorldPosition(new THREE.Vector3()).y - root.getWorldPosition(new THREE.Vector3()).y
    // 回退：按 bodyType 估算
    const bodyType = root.userData.bodyType as string | undefined
    const ratios: Record<string, number> = { male: 1.68, female: 1.56, child: 1.08 }
    return ratios[bodyType ?? 'male'] ?? 1.55
  }

  dispose(): void {
    this.exit()
    this.unbindEvents()
  }
}
