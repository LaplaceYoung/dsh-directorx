import {
  STUDIO_DEFAULTS,
  centroidXZ,
  clampAzimuth,
  parseKeySlot,
  resolveHdriLook,
  spinLightPositions,
  studioLights,
  yawToward
} from "./chunks/chunk-2VFCRDGK.js";
import {
  ACESFilmicToneMapping,
  AgXToneMapping,
  BufferGeometry,
  CanvasTexture,
  CineonToneMapping,
  ClampToEdgeWrapping,
  Color,
  ColorManagement,
  CustomToneMapping,
  Data3DTexture,
  DepthFormat,
  DepthTexture,
  DirectionalLight,
  DoubleSide,
  Euler,
  FileLoader,
  Float32BufferAttribute,
  HalfFloatType,
  LinearFilter,
  LinearToneMapping,
  Loader,
  MathUtils,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshDepthMaterial,
  NearestFilter,
  NeutralToneMapping,
  NoBlending,
  NoToneMapping,
  OrthographicCamera,
  PlaneGeometry,
  PointLight,
  Quaternion,
  RGBADepthPacking,
  RawShaderMaterial,
  RectAreaLight,
  ReinhardToneMapping,
  SRGBColorSpace,
  SRGBTransfer,
  ShaderMaterial,
  SpotLight,
  Timer,
  UniformsUtils,
  UnsignedByteType,
  UnsignedIntType,
  Vector2,
  Vector3,
  WebGLRenderTarget
} from "./chunks/chunk-NPXDOJG6.js";

// ../../../node_modules/three/examples/jsm/shaders/CopyShader.js
var CopyShader = {
  name: "CopyShader",
  uniforms: {
    "tDiffuse": { value: null },
    "opacity": { value: 1 }
  },
  vertexShader: (
    /* glsl */
    `

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`
  ),
  fragmentShader: (
    /* glsl */
    `

		uniform float opacity;

		uniform sampler2D tDiffuse;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );
			gl_FragColor = opacity * texel;


		}`
  )
};

// ../../../node_modules/three/examples/jsm/postprocessing/Pass.js
var Pass = class {
  /**
   * Constructs a new pass.
   */
  constructor() {
    this.isPass = true;
    this.enabled = true;
    this.needsSwap = true;
    this.clear = false;
    this.renderToScreen = false;
  }
  /**
   * Sets the size of the pass.
   *
   * @abstract
   * @param {number} width - The width to set.
   * @param {number} height - The height to set.
   */
  setSize() {
  }
  /**
   * This method holds the render logic of a pass. It must be implemented in all derived classes.
   *
   * @abstract
   * @param {WebGLRenderer} renderer - The renderer.
   * @param {WebGLRenderTarget} writeBuffer - The write buffer. This buffer is intended as the rendering
   * destination for the pass.
   * @param {WebGLRenderTarget} readBuffer - The read buffer. The pass can access the result from the
   * previous pass from this buffer.
   * @param {number} deltaTime - The delta time in seconds.
   * @param {boolean} maskActive - Whether masking is active or not.
   */
  render() {
    console.error("THREE.Pass: .render() must be implemented in derived pass.");
  }
  /**
   * Frees the GPU-related resources allocated by this instance. Call this
   * method whenever the pass is no longer used in your app.
   *
   * @abstract
   */
  dispose() {
  }
};
var _camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
var FullscreenTriangleGeometry = class extends BufferGeometry {
  constructor() {
    super();
    this.setAttribute("position", new Float32BufferAttribute([-1, 3, 0, -1, -1, 0, 3, -1, 0], 3));
    this.setAttribute("uv", new Float32BufferAttribute([0, 2, 0, 0, 2, 0], 2));
  }
};
var _geometry = new FullscreenTriangleGeometry();
var FullScreenQuad = class {
  /**
   * Constructs a new full screen quad.
   *
   * @param {?Material} material - The material to render te full screen quad with.
   */
  constructor(material) {
    this._mesh = new Mesh(_geometry, material);
  }
  /**
   * Frees the GPU-related resources allocated by this instance. Call this
   * method whenever the instance is no longer used in your app.
   */
  dispose() {
    this._mesh.geometry.dispose();
  }
  /**
   * Renders the full screen quad.
   *
   * @param {WebGLRenderer} renderer - The renderer.
   */
  render(renderer) {
    renderer.render(this._mesh, _camera);
  }
  /**
   * The quad's material.
   *
   * @type {?Material}
   */
  get material() {
    return this._mesh.material;
  }
  set material(value) {
    this._mesh.material = value;
  }
};

// ../../../node_modules/three/examples/jsm/postprocessing/ShaderPass.js
var ShaderPass = class extends Pass {
  /**
   * Constructs a new shader pass.
   *
   * @param {Object|ShaderMaterial} [shader] - A shader object holding vertex and fragment shader as well as
   * defines and uniforms. It's also valid to pass a custom shader material.
   * @param {string} [textureID='tDiffuse'] - The name of the texture uniform that should sample
   * the read buffer.
   */
  constructor(shader, textureID = "tDiffuse") {
    super();
    this.textureID = textureID;
    this.uniforms = null;
    this.material = null;
    if (shader instanceof ShaderMaterial) {
      this.uniforms = shader.uniforms;
      this.material = shader;
    } else if (shader) {
      this.uniforms = UniformsUtils.clone(shader.uniforms);
      this.material = new ShaderMaterial({
        name: shader.name !== void 0 ? shader.name : "unspecified",
        defines: Object.assign({}, shader.defines),
        uniforms: this.uniforms,
        vertexShader: shader.vertexShader,
        fragmentShader: shader.fragmentShader
      });
    }
    this._fsQuad = new FullScreenQuad(this.material);
  }
  /**
   * Performs the shader pass.
   *
   * @param {WebGLRenderer} renderer - The renderer.
   * @param {WebGLRenderTarget} writeBuffer - The write buffer. This buffer is intended as the rendering
   * destination for the pass.
   * @param {WebGLRenderTarget} readBuffer - The read buffer. The pass can access the result from the
   * previous pass from this buffer.
   * @param {number} deltaTime - The delta time in seconds.
   * @param {boolean} maskActive - Whether masking is active or not.
   */
  render(renderer, writeBuffer, readBuffer) {
    if (this.uniforms[this.textureID]) {
      this.uniforms[this.textureID].value = readBuffer.texture;
    }
    this._fsQuad.material = this.material;
    if (this.renderToScreen) {
      renderer.setRenderTarget(null);
      this._fsQuad.render(renderer);
    } else {
      renderer.setRenderTarget(writeBuffer);
      if (this.clear) renderer.clear(renderer.autoClearColor, renderer.autoClearDepth, renderer.autoClearStencil);
      this._fsQuad.render(renderer);
    }
  }
  /**
   * Frees the GPU-related resources allocated by this instance. Call this
   * method whenever the pass is no longer used in your app.
   */
  dispose() {
    this.material.dispose();
    this._fsQuad.dispose();
  }
};

// ../../../node_modules/three/examples/jsm/postprocessing/MaskPass.js
var MaskPass = class extends Pass {
  /**
   * Constructs a new mask pass.
   *
   * @param {Scene} scene - The 3D objects in this scene will define the mask.
   * @param {Camera} camera - The camera.
   */
  constructor(scene, camera) {
    super();
    this.scene = scene;
    this.camera = camera;
    this.clear = true;
    this.needsSwap = false;
    this.inverse = false;
  }
  /**
   * Performs a mask pass with the configured scene and camera.
   *
   * @param {WebGLRenderer} renderer - The renderer.
   * @param {WebGLRenderTarget} writeBuffer - The write buffer. This buffer is intended as the rendering
   * destination for the pass.
   * @param {WebGLRenderTarget} readBuffer - The read buffer. The pass can access the result from the
   * previous pass from this buffer.
   * @param {number} deltaTime - The delta time in seconds.
   * @param {boolean} maskActive - Whether masking is active or not.
   */
  render(renderer, writeBuffer, readBuffer) {
    const context = renderer.getContext();
    const state2 = renderer.state;
    state2.buffers.color.setMask(false);
    state2.buffers.depth.setMask(false);
    state2.buffers.color.setLocked(true);
    state2.buffers.depth.setLocked(true);
    let writeValue, clearValue;
    if (this.inverse) {
      writeValue = 0;
      clearValue = 1;
    } else {
      writeValue = 1;
      clearValue = 0;
    }
    state2.buffers.stencil.setTest(true);
    state2.buffers.stencil.setOp(context.REPLACE, context.REPLACE, context.REPLACE);
    state2.buffers.stencil.setFunc(context.ALWAYS, writeValue, 4294967295);
    state2.buffers.stencil.setClear(clearValue);
    state2.buffers.stencil.setLocked(true);
    renderer.setRenderTarget(readBuffer);
    if (this.clear) renderer.clear();
    renderer.render(this.scene, this.camera);
    renderer.setRenderTarget(writeBuffer);
    if (this.clear) renderer.clear();
    renderer.render(this.scene, this.camera);
    state2.buffers.color.setLocked(false);
    state2.buffers.depth.setLocked(false);
    state2.buffers.color.setMask(true);
    state2.buffers.depth.setMask(true);
    state2.buffers.stencil.setLocked(false);
    state2.buffers.stencil.setFunc(context.EQUAL, 1, 4294967295);
    state2.buffers.stencil.setOp(context.KEEP, context.KEEP, context.KEEP);
    state2.buffers.stencil.setLocked(true);
  }
};
var ClearMaskPass = class extends Pass {
  /**
   * Constructs a new clear mask pass.
   */
  constructor() {
    super();
    this.needsSwap = false;
  }
  /**
   * Performs the clear of the currently defined mask.
   *
   * @param {WebGLRenderer} renderer - The renderer.
   * @param {WebGLRenderTarget} writeBuffer - The write buffer. This buffer is intended as the rendering
   * destination for the pass.
   * @param {WebGLRenderTarget} readBuffer - The read buffer. The pass can access the result from the
   * previous pass from this buffer.
   * @param {number} deltaTime - The delta time in seconds.
   * @param {boolean} maskActive - Whether masking is active or not.
   */
  render(renderer) {
    renderer.state.buffers.stencil.setLocked(false);
    renderer.state.buffers.stencil.setTest(false);
  }
};

// ../../../node_modules/three/examples/jsm/postprocessing/EffectComposer.js
var EffectComposer = class {
  /**
   * Constructs a new effect composer.
   *
   * @param {WebGLRenderer} renderer - The renderer.
   * @param {WebGLRenderTarget} [renderTarget] - This render target and a clone will
   * be used as the internal read and write buffers. If not given, the composer creates
   * the buffers automatically.
   */
  constructor(renderer, renderTarget) {
    this.renderer = renderer;
    this._pixelRatio = renderer.getPixelRatio();
    if (renderTarget === void 0) {
      const size = renderer.getSize(new Vector2());
      this._width = size.width;
      this._height = size.height;
      renderTarget = new WebGLRenderTarget(this._width * this._pixelRatio, this._height * this._pixelRatio, { type: HalfFloatType });
      renderTarget.texture.name = "EffectComposer.rt1";
    } else {
      this._width = renderTarget.width;
      this._height = renderTarget.height;
    }
    this.renderTarget1 = renderTarget;
    this.renderTarget2 = renderTarget.clone();
    this.renderTarget2.texture.name = "EffectComposer.rt2";
    this.writeBuffer = this.renderTarget1;
    this.readBuffer = this.renderTarget2;
    this.renderToScreen = true;
    this.passes = [];
    this.copyPass = new ShaderPass(CopyShader);
    this.copyPass.material.blending = NoBlending;
    this.timer = new Timer();
  }
  /**
   * Swaps the internal read/write buffers.
   */
  swapBuffers() {
    const tmp = this.readBuffer;
    this.readBuffer = this.writeBuffer;
    this.writeBuffer = tmp;
  }
  /**
   * Adds the given pass to the pass chain.
   *
   * @param {Pass} pass - The pass to add.
   */
  addPass(pass) {
    this.passes.push(pass);
    pass.setSize(this._width * this._pixelRatio, this._height * this._pixelRatio);
  }
  /**
   * Inserts the given pass at a given index.
   *
   * @param {Pass} pass - The pass to insert.
   * @param {number} index - The index into the pass chain.
   */
  insertPass(pass, index) {
    this.passes.splice(index, 0, pass);
    pass.setSize(this._width * this._pixelRatio, this._height * this._pixelRatio);
  }
  /**
   * Removes the given pass from the pass chain.
   *
   * @param {Pass} pass - The pass to remove.
   */
  removePass(pass) {
    const index = this.passes.indexOf(pass);
    if (index !== -1) {
      this.passes.splice(index, 1);
    }
  }
  /**
   * Returns `true` if the pass for the given index is the last enabled pass in the pass chain.
   *
   * @param {number} passIndex - The pass index.
   * @return {boolean} Whether the pass for the given index is the last pass in the pass chain.
   */
  isLastEnabledPass(passIndex) {
    for (let i = passIndex + 1; i < this.passes.length; i++) {
      if (this.passes[i].enabled) {
        return false;
      }
    }
    return true;
  }
  /**
   * Executes all enabled post-processing passes in order to produce the final frame.
   *
   * @param {number} deltaTime - The delta time in seconds. If not given, the composer computes
   * its own time delta value.
   */
  render(deltaTime) {
    this.timer.update();
    if (deltaTime === void 0) {
      deltaTime = this.timer.getDelta();
    }
    const currentRenderTarget = this.renderer.getRenderTarget();
    let maskActive = false;
    for (let i = 0, il = this.passes.length; i < il; i++) {
      const pass = this.passes[i];
      if (pass.enabled === false) continue;
      pass.renderToScreen = this.renderToScreen && this.isLastEnabledPass(i);
      pass.render(this.renderer, this.writeBuffer, this.readBuffer, deltaTime, maskActive);
      if (pass.needsSwap) {
        if (maskActive) {
          const context = this.renderer.getContext();
          const stencil = this.renderer.state.buffers.stencil;
          stencil.setFunc(context.NOTEQUAL, 1, 4294967295);
          this.copyPass.render(this.renderer, this.writeBuffer, this.readBuffer, deltaTime);
          stencil.setFunc(context.EQUAL, 1, 4294967295);
        }
        this.swapBuffers();
      }
      if (MaskPass !== void 0) {
        if (pass instanceof MaskPass) {
          maskActive = true;
        } else if (pass instanceof ClearMaskPass) {
          maskActive = false;
        }
      }
    }
    this.renderer.setRenderTarget(currentRenderTarget);
  }
  /**
   * Resets the internal state of the EffectComposer.
   *
   * @param {WebGLRenderTarget} [renderTarget] - This render target has the same purpose like
   * the one from the constructor. If set, it is used to setup the read and write buffers.
   */
  reset(renderTarget) {
    if (renderTarget === void 0) {
      const size = this.renderer.getSize(new Vector2());
      this._pixelRatio = this.renderer.getPixelRatio();
      this._width = size.width;
      this._height = size.height;
      renderTarget = this.renderTarget1.clone();
      renderTarget.setSize(this._width * this._pixelRatio, this._height * this._pixelRatio);
    }
    this.renderTarget1.dispose();
    this.renderTarget2.dispose();
    this.renderTarget1 = renderTarget;
    this.renderTarget2 = renderTarget.clone();
    this.writeBuffer = this.renderTarget1;
    this.readBuffer = this.renderTarget2;
  }
  /**
   * Resizes the internal read and write buffers as well as all passes. Similar to {@link WebGLRenderer#setSize},
   * this method honors the current pixel ration.
   *
   * @param {number} width - The width in logical pixels.
   * @param {number} height - The height in logical pixels.
   */
  setSize(width, height) {
    this._width = width;
    this._height = height;
    const effectiveWidth = this._width * this._pixelRatio;
    const effectiveHeight = this._height * this._pixelRatio;
    this.renderTarget1.setSize(effectiveWidth, effectiveHeight);
    this.renderTarget2.setSize(effectiveWidth, effectiveHeight);
    for (let i = 0; i < this.passes.length; i++) {
      this.passes[i].setSize(effectiveWidth, effectiveHeight);
    }
  }
  /**
   * Sets device pixel ratio. This is usually used for HiDPI device to prevent blurring output.
   * Setting the pixel ratio will automatically resize the composer.
   *
   * @param {number} pixelRatio - The pixel ratio to set.
   */
  setPixelRatio(pixelRatio) {
    this._pixelRatio = pixelRatio;
    this.setSize(this._width, this._height);
  }
  /**
   * Frees the GPU-related resources allocated by this instance. Call this
   * method whenever the composer is no longer used in your app.
   */
  dispose() {
    this.renderTarget1.dispose();
    this.renderTarget2.dispose();
    this.copyPass.dispose();
  }
};

// ../../../node_modules/three/examples/jsm/postprocessing/RenderPass.js
var RenderPass = class extends Pass {
  /**
   * Constructs a new render pass.
   *
   * @param {Scene} scene - The scene to render.
   * @param {Camera} camera - The camera.
   * @param {?Material} [overrideMaterial=null] - The override material. If set, this material is used
   * for all objects in the scene.
   * @param {?(number|Color|string)} [clearColor=null] - The clear color of the render pass.
   * @param {?number} [clearAlpha=null] - The clear alpha of the render pass.
   */
  constructor(scene, camera, overrideMaterial = null, clearColor = null, clearAlpha = null) {
    super();
    this.scene = scene;
    this.camera = camera;
    this.overrideMaterial = overrideMaterial;
    this.clearColor = clearColor;
    this.clearAlpha = clearAlpha;
    this.clear = true;
    this.clearDepth = false;
    this.needsSwap = false;
    this.isRenderPass = true;
    this._oldClearColor = new Color();
  }
  /**
   * Performs a beauty pass with the configured scene and camera.
   *
   * @param {WebGLRenderer} renderer - The renderer.
   * @param {WebGLRenderTarget} writeBuffer - The write buffer. This buffer is intended as the rendering
   * destination for the pass.
   * @param {WebGLRenderTarget} readBuffer - The read buffer. The pass can access the result from the
   * previous pass from this buffer.
   * @param {number} deltaTime - The delta time in seconds.
   * @param {boolean} maskActive - Whether masking is active or not.
   */
  render(renderer, writeBuffer, readBuffer) {
    const oldAutoClear = renderer.autoClear;
    renderer.autoClear = false;
    let oldClearAlpha, oldOverrideMaterial;
    if (this.overrideMaterial !== null) {
      oldOverrideMaterial = this.scene.overrideMaterial;
      this.scene.overrideMaterial = this.overrideMaterial;
    }
    if (this.clearColor !== null) {
      renderer.getClearColor(this._oldClearColor);
      renderer.setClearColor(this.clearColor, renderer.getClearAlpha());
    }
    if (this.clearAlpha !== null) {
      oldClearAlpha = renderer.getClearAlpha();
      renderer.setClearAlpha(this.clearAlpha);
    }
    if (this.clearDepth == true) {
      renderer.clearDepth();
    }
    renderer.setRenderTarget(this.renderToScreen ? null : readBuffer);
    if (this.clear === true) {
      renderer.clear(renderer.autoClearColor, renderer.autoClearDepth, renderer.autoClearStencil);
    }
    renderer.render(this.scene, this.camera);
    if (this.clearColor !== null) {
      renderer.setClearColor(this._oldClearColor);
    }
    if (this.clearAlpha !== null) {
      renderer.setClearAlpha(oldClearAlpha);
    }
    if (this.overrideMaterial !== null) {
      this.scene.overrideMaterial = oldOverrideMaterial;
    }
    renderer.autoClear = oldAutoClear;
  }
};

// ../../../node_modules/three/examples/jsm/shaders/BokehShader.js
var BokehShader = {
  name: "BokehShader",
  defines: {
    "DEPTH_PACKING": 1,
    "PERSPECTIVE_CAMERA": 1
  },
  uniforms: {
    "tColor": { value: null },
    "tDepth": { value: null },
    "focus": { value: 1 },
    "aspect": { value: 1 },
    "aperture": { value: 0.025 },
    "maxblur": { value: 0.01 },
    "nearClip": { value: 1 },
    "farClip": { value: 1e3 }
  },
  vertexShader: (
    /* glsl */
    `

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`
  ),
  fragmentShader: (
    /* glsl */
    `

		#include <common>

		varying vec2 vUv;

		uniform sampler2D tColor;
		uniform sampler2D tDepth;

		uniform float maxblur; // max blur amount
		uniform float aperture; // aperture - bigger values for shallower depth of field

		uniform float nearClip;
		uniform float farClip;

		uniform float focus;
		uniform float aspect;

		#include <packing>

		float getDepth( const in vec2 screenPosition ) {
			#if DEPTH_PACKING == 1
			return unpackRGBAToDepth( texture2D( tDepth, screenPosition ) );
			#else
			return texture2D( tDepth, screenPosition ).x;
			#endif
		}

		float getViewZ( const in float depth ) {
			#if PERSPECTIVE_CAMERA == 1
			return perspectiveDepthToViewZ( depth, nearClip, farClip );
			#else
			return orthographicDepthToViewZ( depth, nearClip, farClip );
			#endif
		}


		void main() {

			vec2 aspectcorrect = vec2( 1.0, aspect );

			float viewZ = getViewZ( getDepth( vUv ) );

			float factor = ( focus + viewZ ); // viewZ is <= 0, so this is a difference equation

			vec2 dofblur = vec2 ( clamp( factor * aperture, -maxblur, maxblur ) );

			vec2 dofblur9 = dofblur * 0.9;
			vec2 dofblur7 = dofblur * 0.7;
			vec2 dofblur4 = dofblur * 0.4;

			vec4 col = vec4( 0.0 );

			col += texture2D( tColor, vUv.xy );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.0,   0.4  ) * aspectcorrect ) * dofblur );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.15,  0.37 ) * aspectcorrect ) * dofblur );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.29,  0.29 ) * aspectcorrect ) * dofblur );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.37,  0.15 ) * aspectcorrect ) * dofblur );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.40,  0.0  ) * aspectcorrect ) * dofblur );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.37, -0.15 ) * aspectcorrect ) * dofblur );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.29, -0.29 ) * aspectcorrect ) * dofblur );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.15, -0.37 ) * aspectcorrect ) * dofblur );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.0,  -0.4  ) * aspectcorrect ) * dofblur );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.15,  0.37 ) * aspectcorrect ) * dofblur );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.29,  0.29 ) * aspectcorrect ) * dofblur );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.37,  0.15 ) * aspectcorrect ) * dofblur );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.4,   0.0  ) * aspectcorrect ) * dofblur );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.37, -0.15 ) * aspectcorrect ) * dofblur );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.29, -0.29 ) * aspectcorrect ) * dofblur );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.15, -0.37 ) * aspectcorrect ) * dofblur );

			col += texture2D( tColor, vUv.xy + ( vec2(  0.15,  0.37 ) * aspectcorrect ) * dofblur9 );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.37,  0.15 ) * aspectcorrect ) * dofblur9 );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.37, -0.15 ) * aspectcorrect ) * dofblur9 );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.15, -0.37 ) * aspectcorrect ) * dofblur9 );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.15,  0.37 ) * aspectcorrect ) * dofblur9 );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.37,  0.15 ) * aspectcorrect ) * dofblur9 );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.37, -0.15 ) * aspectcorrect ) * dofblur9 );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.15, -0.37 ) * aspectcorrect ) * dofblur9 );

			col += texture2D( tColor, vUv.xy + ( vec2(  0.29,  0.29 ) * aspectcorrect ) * dofblur7 );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.40,  0.0  ) * aspectcorrect ) * dofblur7 );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.29, -0.29 ) * aspectcorrect ) * dofblur7 );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.0,  -0.4  ) * aspectcorrect ) * dofblur7 );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.29,  0.29 ) * aspectcorrect ) * dofblur7 );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.4,   0.0  ) * aspectcorrect ) * dofblur7 );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.29, -0.29 ) * aspectcorrect ) * dofblur7 );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.0,   0.4  ) * aspectcorrect ) * dofblur7 );

			col += texture2D( tColor, vUv.xy + ( vec2(  0.29,  0.29 ) * aspectcorrect ) * dofblur4 );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.4,   0.0  ) * aspectcorrect ) * dofblur4 );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.29, -0.29 ) * aspectcorrect ) * dofblur4 );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.0,  -0.4  ) * aspectcorrect ) * dofblur4 );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.29,  0.29 ) * aspectcorrect ) * dofblur4 );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.4,   0.0  ) * aspectcorrect ) * dofblur4 );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.29, -0.29 ) * aspectcorrect ) * dofblur4 );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.0,   0.4  ) * aspectcorrect ) * dofblur4 );

			gl_FragColor = col / 41.0;
			gl_FragColor.a = 1.0;

		}`
  )
};

// ../../../node_modules/three/examples/jsm/postprocessing/BokehPass.js
var BokehPass = class extends Pass {
  /**
   * Constructs a new Bokeh pass.
   *
   * @param {Scene} scene - The scene to render the DOF for.
   * @param {Camera} camera - The camera.
   * @param {BokehPass~Options} params - The pass options.
   */
  constructor(scene, camera, params) {
    super();
    this.scene = scene;
    this.camera = camera;
    const focus = params.focus !== void 0 ? params.focus : 1;
    const aperture = params.aperture !== void 0 ? params.aperture : 0.025;
    const maxblur = params.maxblur !== void 0 ? params.maxblur : 1;
    this._renderTargetDepth = new WebGLRenderTarget(1, 1, {
      // will be resized later
      minFilter: NearestFilter,
      magFilter: NearestFilter,
      type: HalfFloatType
    });
    this._renderTargetDepth.texture.name = "BokehPass.depth";
    this._materialDepth = new MeshDepthMaterial();
    this._materialDepth.depthPacking = RGBADepthPacking;
    this._materialDepth.blending = NoBlending;
    const bokehUniforms = UniformsUtils.clone(BokehShader.uniforms);
    bokehUniforms["tDepth"].value = this._renderTargetDepth.texture;
    bokehUniforms["focus"].value = focus;
    bokehUniforms["aspect"].value = camera.aspect;
    bokehUniforms["aperture"].value = aperture;
    bokehUniforms["maxblur"].value = maxblur;
    bokehUniforms["nearClip"].value = camera.near;
    bokehUniforms["farClip"].value = camera.far;
    this.materialBokeh = new ShaderMaterial({
      defines: Object.assign({}, BokehShader.defines),
      uniforms: bokehUniforms,
      vertexShader: BokehShader.vertexShader,
      fragmentShader: BokehShader.fragmentShader
    });
    this.uniforms = bokehUniforms;
    this._fsQuad = new FullScreenQuad(this.materialBokeh);
    this._oldClearColor = new Color();
  }
  /**
   * Performs the Bokeh pass.
   *
   * @param {WebGLRenderer} renderer - The renderer.
   * @param {WebGLRenderTarget} writeBuffer - The write buffer. This buffer is intended as the rendering
   * destination for the pass.
   * @param {WebGLRenderTarget} readBuffer - The read buffer. The pass can access the result from the
   * previous pass from this buffer.
   * @param {number} deltaTime - The delta time in seconds.
   * @param {boolean} maskActive - Whether masking is active or not.
   */
  render(renderer, writeBuffer, readBuffer) {
    this.scene.overrideMaterial = this._materialDepth;
    renderer.getClearColor(this._oldClearColor);
    const oldClearAlpha = renderer.getClearAlpha();
    const oldAutoClear = renderer.autoClear;
    renderer.autoClear = false;
    renderer.setClearColor(16777215);
    renderer.setClearAlpha(1);
    renderer.setRenderTarget(this._renderTargetDepth);
    renderer.clear();
    renderer.render(this.scene, this.camera);
    this.uniforms["tColor"].value = readBuffer.texture;
    this.uniforms["nearClip"].value = this.camera.near;
    this.uniforms["farClip"].value = this.camera.far;
    if (this.renderToScreen) {
      renderer.setRenderTarget(null);
      this._fsQuad.render(renderer);
    } else {
      renderer.setRenderTarget(writeBuffer);
      renderer.clear();
      this._fsQuad.render(renderer);
    }
    this.scene.overrideMaterial = null;
    renderer.setClearColor(this._oldClearColor);
    renderer.setClearAlpha(oldClearAlpha);
    renderer.autoClear = oldAutoClear;
  }
  /**
   * Sets the size of the pass.
   *
   * @param {number} width - The width to set.
   * @param {number} height - The height to set.
   */
  setSize(width, height) {
    this.materialBokeh.uniforms["aspect"].value = width / height;
    this._renderTargetDepth.setSize(width, height);
  }
  /**
   * Frees the GPU-related resources allocated by this instance. Call this
   * method whenever the pass is no longer used in your app.
   */
  dispose() {
    this._renderTargetDepth.dispose();
    this._materialDepth.dispose();
    this.materialBokeh.dispose();
    this._fsQuad.dispose();
  }
};

// ../../../node_modules/three/examples/jsm/shaders/OutputShader.js
var OutputShader = {
  name: "OutputShader",
  uniforms: {
    "tDiffuse": { value: null },
    "toneMappingExposure": { value: 1 }
  },
  vertexShader: (
    /* glsl */
    `
		precision highp float;

		uniform mat4 modelViewMatrix;
		uniform mat4 projectionMatrix;

		attribute vec3 position;
		attribute vec2 uv;

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`
  ),
  fragmentShader: (
    /* glsl */
    `

		precision highp float;

		uniform sampler2D tDiffuse;

		#include <tonemapping_pars_fragment>
		#include <colorspace_pars_fragment>

		varying vec2 vUv;

		void main() {

			gl_FragColor = texture2D( tDiffuse, vUv );

			// tone mapping

			#ifdef LINEAR_TONE_MAPPING

				gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );

			#elif defined( REINHARD_TONE_MAPPING )

				gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );

			#elif defined( CINEON_TONE_MAPPING )

				gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );

			#elif defined( ACES_FILMIC_TONE_MAPPING )

				gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );

			#elif defined( AGX_TONE_MAPPING )

				gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );

			#elif defined( NEUTRAL_TONE_MAPPING )

				gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );

			#elif defined( CUSTOM_TONE_MAPPING )

				gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );

			#endif

			// color space

			#ifdef SRGB_TRANSFER

				gl_FragColor = sRGBTransferOETF( gl_FragColor );

			#endif

		}`
  )
};

// ../../../node_modules/three/examples/jsm/postprocessing/OutputPass.js
var OutputPass = class extends Pass {
  /**
   * Constructs a new output pass.
   */
  constructor() {
    super();
    this.isOutputPass = true;
    this.uniforms = UniformsUtils.clone(OutputShader.uniforms);
    this.material = new RawShaderMaterial({
      name: OutputShader.name,
      uniforms: this.uniforms,
      vertexShader: OutputShader.vertexShader,
      fragmentShader: OutputShader.fragmentShader
    });
    this._fsQuad = new FullScreenQuad(this.material);
    this._outputColorSpace = null;
    this._toneMapping = null;
  }
  /**
   * Performs the output pass.
   *
   * @param {WebGLRenderer} renderer - The renderer.
   * @param {WebGLRenderTarget} writeBuffer - The write buffer. This buffer is intended as the rendering
   * destination for the pass.
   * @param {WebGLRenderTarget} readBuffer - The read buffer. The pass can access the result from the
   * previous pass from this buffer.
   * @param {number} deltaTime - The delta time in seconds.
   * @param {boolean} maskActive - Whether masking is active or not.
   */
  render(renderer, writeBuffer, readBuffer) {
    this.uniforms["tDiffuse"].value = readBuffer.texture;
    this.uniforms["toneMappingExposure"].value = renderer.toneMappingExposure;
    if (this._outputColorSpace !== renderer.outputColorSpace || this._toneMapping !== renderer.toneMapping) {
      this._outputColorSpace = renderer.outputColorSpace;
      this._toneMapping = renderer.toneMapping;
      this.material.defines = {};
      if (ColorManagement.getTransfer(this._outputColorSpace) === SRGBTransfer) this.material.defines.SRGB_TRANSFER = "";
      if (this._toneMapping === LinearToneMapping) this.material.defines.LINEAR_TONE_MAPPING = "";
      else if (this._toneMapping === ReinhardToneMapping) this.material.defines.REINHARD_TONE_MAPPING = "";
      else if (this._toneMapping === CineonToneMapping) this.material.defines.CINEON_TONE_MAPPING = "";
      else if (this._toneMapping === ACESFilmicToneMapping) this.material.defines.ACES_FILMIC_TONE_MAPPING = "";
      else if (this._toneMapping === AgXToneMapping) this.material.defines.AGX_TONE_MAPPING = "";
      else if (this._toneMapping === NeutralToneMapping) this.material.defines.NEUTRAL_TONE_MAPPING = "";
      else if (this._toneMapping === CustomToneMapping) this.material.defines.CUSTOM_TONE_MAPPING = "";
      this.material.needsUpdate = true;
    }
    if (this.renderToScreen === true) {
      renderer.setRenderTarget(null);
      this._fsQuad.render(renderer);
    } else {
      renderer.setRenderTarget(writeBuffer);
      if (this.clear) renderer.clear(renderer.autoClearColor, renderer.autoClearDepth, renderer.autoClearStencil);
      this._fsQuad.render(renderer);
    }
  }
  /**
   * Frees the GPU-related resources allocated by this instance. Call this
   * method whenever the pass is no longer used in your app.
   */
  dispose() {
    this.material.dispose();
    this._fsQuad.dispose();
  }
};

// ../../../node_modules/three/examples/jsm/postprocessing/LUTPass.js
var LUTShader = {
  name: "LUTShader",
  uniforms: {
    lut: { value: null },
    lutSize: { value: 0 },
    tDiffuse: { value: null },
    intensity: { value: 1 }
  },
  vertexShader: (
    /* glsl */
    `

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}

	`
  ),
  fragmentShader: (
    /* glsl */
    `

		uniform float lutSize;
		uniform sampler3D lut;

		varying vec2 vUv;
		uniform float intensity;
		uniform sampler2D tDiffuse;
		void main() {

			vec4 val = texture2D( tDiffuse, vUv );
			vec4 lutVal;

			// pull the sample in by half a pixel so the sample begins
			// at the center of the edge pixels.
			float pixelWidth = 1.0 / lutSize;
			float halfPixelWidth = 0.5 / lutSize;
			vec3 uvw = vec3( halfPixelWidth ) + val.rgb * ( 1.0 - pixelWidth );


			lutVal = vec4( texture( lut, uvw ).rgb, val.a );

			gl_FragColor = vec4( mix( val, lutVal, intensity ) );

		}

	`
  )
};
var LUTPass = class extends ShaderPass {
  /**
   * Constructs a LUT pass.
   *
   * @param {{lut:Data3DTexture,intensity:number}} [options={}] - The pass options.
   */
  constructor(options = {}) {
    super(LUTShader);
    this.lut = options.lut || null;
    this.intensity = "intensity" in options ? options.intensity : 1;
  }
  set lut(v) {
    const material = this.material;
    if (v !== this.lut) {
      material.uniforms.lut.value = null;
      if (v) {
        material.uniforms.lutSize.value = v.image.width;
        material.uniforms.lut.value = v;
      }
    }
  }
  get lut() {
    return this.material.uniforms.lut.value;
  }
  set intensity(v) {
    this.material.uniforms.intensity.value = v;
  }
  get intensity() {
    return this.material.uniforms.intensity.value;
  }
};

// ../../../node_modules/three/examples/jsm/loaders/LUTCubeLoader.js
var LUTCubeLoader = class extends Loader {
  /**
   * Constructs a new Cube LUT loader.
   *
   * @param {LoadingManager} [manager] - The loading manager.
   */
  constructor(manager) {
    super(manager);
    this.type = UnsignedByteType;
  }
  /**
   * Sets the texture type.
   *
   * @param {(UnsignedByteType|FloatType)} type - The texture type to set.
   * @return {LUTCubeLoader} A reference to this loader.
   */
  setType(type) {
    this.type = type;
    return this;
  }
  /**
   * Starts loading from the given URL and passes the loaded Cube LUT asset
   * to the `onLoad()` callback.
   *
   * @param {string} url - The path/URL of the file to be loaded. This can also be a data URI.
   * @param {function({title:string,size:number,domainMin:Vector3,domainMax:Vector3,texture3D:Data3DTexture})} onLoad - Executed when the loading process has been finished.
   * @param {onProgressCallback} onProgress - Executed while the loading is in progress.
   * @param {onErrorCallback} onError - Executed when errors occur.
   */
  load(url, onLoad, onProgress, onError) {
    const loader = new FileLoader(this.manager);
    loader.setPath(this.path);
    loader.setResponseType("text");
    loader.load(url, (text) => {
      try {
        onLoad(this.parse(text));
      } catch (e) {
        if (onError) {
          onError(e);
        } else {
          console.error(e);
        }
        this.manager.itemError(url);
      }
    }, onProgress, onError);
  }
  /**
   * Parses the given Cube LUT data and returns the resulting 3D data texture.
   *
   * @param {string} input - The raw Cube LUT data as a string.
   * @return {{title:string,size:number,domainMin:Vector3,domainMax:Vector3,texture3D:Data3DTexture}} The parsed Cube LUT.
   */
  parse(input) {
    const regExpTitle = /TITLE +"([^"]*)"/;
    const regExpSize = /LUT_3D_SIZE +(\d+)/;
    const regExpDomainMin = /DOMAIN_MIN +([\d.]+) +([\d.]+) +([\d.]+)/;
    const regExpDomainMax = /DOMAIN_MAX +([\d.]+) +([\d.]+) +([\d.]+)/;
    const regExpDataPoints = /^([\d.e+-]+) +([\d.e+-]+) +([\d.e+-]+) *$/gm;
    let result = regExpTitle.exec(input);
    const title = result !== null ? result[1] : null;
    result = regExpSize.exec(input);
    if (result === null) {
      throw new Error("THREE.LUTCubeLoader: Missing LUT_3D_SIZE information");
    }
    const size = Number(result[1]);
    const length = size ** 3 * 4;
    const data = this.type === UnsignedByteType ? new Uint8Array(length) : new Float32Array(length);
    const domainMin = new Vector3(0, 0, 0);
    const domainMax = new Vector3(1, 1, 1);
    result = regExpDomainMin.exec(input);
    if (result !== null) {
      domainMin.set(Number(result[1]), Number(result[2]), Number(result[3]));
    }
    result = regExpDomainMax.exec(input);
    if (result !== null) {
      domainMax.set(Number(result[1]), Number(result[2]), Number(result[3]));
    }
    if (domainMin.x > domainMax.x || domainMin.y > domainMax.y || domainMin.z > domainMax.z) {
      throw new Error("THREE.LUTCubeLoader: Invalid input domain");
    }
    const scale = this.type === UnsignedByteType ? 255 : 1;
    let i = 0;
    while ((result = regExpDataPoints.exec(input)) !== null) {
      data[i++] = Number(result[1]) * scale;
      data[i++] = Number(result[2]) * scale;
      data[i++] = Number(result[3]) * scale;
      data[i++] = scale;
    }
    const texture3D = new Data3DTexture();
    texture3D.image.data = data;
    texture3D.image.width = size;
    texture3D.image.height = size;
    texture3D.image.depth = size;
    texture3D.type = this.type;
    texture3D.magFilter = LinearFilter;
    texture3D.minFilter = LinearFilter;
    texture3D.wrapS = ClampToEdgeWrapping;
    texture3D.wrapT = ClampToEdgeWrapping;
    texture3D.wrapR = ClampToEdgeWrapping;
    texture3D.generateMipmaps = false;
    texture3D.needsUpdate = true;
    return {
      title,
      size,
      domainMin,
      domainMax,
      texture3D
    };
  }
};

// ../../../src/director/optics/lut.ts
function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}
function contrastChannel(t, amount = 0.42) {
  const x = clamp01(t);
  const s = x * x * (3 - 2 * x);
  return clamp01(x * (1 - amount) + s * amount);
}
var FALSE_STOPS = [
  [0, [0.16, 0.02, 0.28]],
  [0.03, [0.08, 0.18, 0.88]],
  [0.1, [0.05, 0.62, 0.86]],
  [0.18, [0.12, 0.78, 0.22]],
  [0.42, [0.18, 0.52, 0.2]],
  [0.55, [0.88, 0.48, 0.58]],
  [0.76, [0.96, 0.86, 0.14]],
  [0.9, [0.95, 0.16, 0.1]],
  [1, [1, 1, 1]]
];
function lumaRec709(r, g, b) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function falseColor(y) {
  const t = clamp01(y);
  for (let i = 1; i < FALSE_STOPS.length; i += 1) {
    const [t1, c1] = FALSE_STOPS[i];
    const [t0, c0] = FALSE_STOPS[i - 1];
    if (t <= t1) {
      const u = (t - t0) / (t1 - t0 || 1);
      return [
        c0[0] + (c1[0] - c0[0]) * u,
        c0[1] + (c1[1] - c0[1]) * u,
        c0[2] + (c1[2] - c0[2]) * u
      ];
    }
  }
  return [1, 1, 1];
}
function cubeFile(title, size, sample) {
  const n = Math.max(2, Math.floor(size));
  const lines = [
    `TITLE "${title}"`,
    `LUT_3D_SIZE ${n}`,
    "DOMAIN_MIN 0.0 0.0 0.0",
    "DOMAIN_MAX 1.0 1.0 1.0"
  ];
  for (let b = 0; b < n; b += 1) {
    for (let g = 0; g < n; g += 1) {
      for (let r = 0; r < n; r += 1) {
        const rgb = sample(r / (n - 1), g / (n - 1), b / (n - 1));
        lines.push(`${rgb[0].toFixed(6)} ${rgb[1].toFixed(6)} ${rgb[2].toFixed(6)}`);
      }
    }
  }
  return `${lines.join("\n")}
`;
}
function contrastCube(size = 16) {
  return cubeFile("Contrast", size, (r, g, b) => [
    contrastChannel(r),
    contrastChannel(g),
    contrastChannel(b)
  ]);
}
function falseColorCube(size = 16) {
  return cubeFile("False Color", size, (r, g, b) => falseColor(lumaRec709(r, g, b)));
}
function cubeForPreset(preset) {
  if (preset === "contrast") return contrastCube();
  if (preset === "falsecolor") return falseColorCube();
  return null;
}
function isLutPath(value) {
  return /^\/(uploads|luts)\/[A-Za-z0-9._-]+\.cube$/i.test(value);
}

// ../../../src/director/optics/peaking.ts
var DEFAULT_BOKEH_APERTURE = 22e-5;
function peakWidthMeters(aperture = DEFAULT_BOKEH_APERTURE, focusM = 4) {
  const a = Math.max(1e-6, Number(aperture) || DEFAULT_BOKEH_APERTURE);
  const fromIris = 0.2 * (DEFAULT_BOKEH_APERTURE / a);
  const fromFocus = 0.03 * Math.max(0.4, Number(focusM) || 4);
  return Math.min(2.5, Math.max(0.05, fromIris + fromFocus));
}

// stage-look.js
var EQUIRECT_REFLECTION = 303;
var lights = /* @__PURE__ */ new Map();
var looks = /* @__PURE__ */ new Map();
var state = {
  exposure: 1,
  toneMap: "aces",
  dof: false,
  focusM: 4,
  aperture: 22e-5,
  maxblur: 0.012,
  ambient: null,
  hemi: null,
  ibl: false,
  iblIntensity: 1,
  envTex: null,
  envOwned: false,
  lut: "none",
  lutIntensity: 1,
  focusPlane: false,
  peaking: false,
  peakWidth: null,
  kelvin: STUDIO_DEFAULTS.kelvin,
  brightness: STUDIO_DEFAULTS.brightness,
  key: STUDIO_DEFAULTS.key,
  rim: STUDIO_DEFAULTS.rim,
  hdri: null,
  azimuth: 0
};
var waitEngine = () => new Promise((resolve) => {
  let done = false;
  const tick = () => {
    const engine = window.__directorEngine;
    if (done || !engine?.scene || !engine?.renderer) return false;
    done = true;
    resolve(engine);
    return true;
  };
  if (tick()) return;
  const id = setInterval(() => {
    if (tick()) clearInterval(id);
  }, 50);
  const raf = () => {
    if (!tick()) requestAnimationFrame(raf);
  };
  requestAnimationFrame(raf);
});
function dimStockLights(scene, on) {
  scene.traverse((obj) => {
    if (!obj.isLight || obj.userData.dxLook) return;
    if (obj.userData.dxStockIntensity == null) obj.userData.dxStockIntensity = obj.intensity;
    if (obj.isAmbientLight) obj.intensity = on ? state.ambient ?? obj.userData.dxStockIntensity * 0.08 : obj.userData.dxStockIntensity;
    else if (obj.isHemisphereLight) obj.intensity = on ? state.hemi ?? obj.userData.dxStockIntensity * 0.1 : obj.userData.dxStockIntensity;
    else if (obj.isDirectionalLight) obj.intensity = on ? 0 : obj.userData.dxStockIntensity;
  });
}
var shadowedCount = -1;
function enableStageShadows(engine, force = false) {
  const n = (engine.chars?.size || 0) + (engine.props?.size || 0) + (engine.models?.size || 0);
  if (!force && n === shadowedCount) return;
  shadowedCount = n;
  const mark = (root) => {
    root?.traverse?.((obj) => {
      if (!obj.isMesh || obj.userData?._isHelper || obj.userData?.isLabel) return;
      const mat = Array.isArray(obj.material) ? obj.material[0] : obj.material;
      if (!mat || mat.isMeshBasicMaterial) return;
      obj.castShadow = true;
      obj.receiveShadow = true;
    });
  };
  for (const rec of engine.chars?.values?.() || []) mark(rec.group || rec.inner || rec.root);
  for (const rec of engine.props?.values?.() || []) mark(rec.group || rec.root);
  for (const rec of engine.models?.values?.() || []) mark(rec.group || rec.root);
  for (const rec of engine.codeModels?.values?.() || []) mark(rec.group || rec.root);
  if (engine.ground) engine.ground.receiveShadow = true;
}
function colorOf(value) {
  return new Color(value || "#ffffff");
}
function makeLight(spec) {
  let light;
  if (spec.kind === "spot") {
    light = new SpotLight(colorOf(spec.color), spec.intensity, 40, Math.PI / 5, 0.35, 1);
  } else if (spec.kind === "point") {
    light = new PointLight(colorOf(spec.color), spec.intensity, 18, 1.4);
  } else if (spec.kind === "rect") {
    light = new RectAreaLight(colorOf(spec.color), spec.intensity, spec.width || 1.6, spec.height || 0.8);
  } else {
    light = new DirectionalLight(colorOf(spec.color), spec.intensity);
  }
  light.userData.dxLook = true;
  light.userData.dxSpec = spec;
  light.name = spec.id;
  if ("castShadow" in light) {
    light.castShadow = !!spec.castShadow;
    if (light.castShadow && light.shadow) {
      light.shadow.mapSize.set(2048, 2048);
      light.shadow.bias = -2e-4;
      if (light.shadow.camera) {
        Object.assign(light.shadow.camera, { near: 0.5, far: 60, left: -18, right: 18, top: 18, bottom: -18 });
        light.shadow.camera.updateProjectionMatrix?.();
      }
    }
  }
  return light;
}
function placeLight(light, spec) {
  light.position.set(spec.position.x, spec.position.y, spec.position.z);
  light.color.copy(colorOf(spec.color));
  light.intensity = spec.intensity;
  if (light.target && spec.lookAt) {
    light.target.position.set(spec.lookAt.x, spec.lookAt.y, spec.lookAt.z);
    light.target.userData.dxLook = true;
    light.target.updateMatrixWorld?.(true);
    light.updateMatrixWorld?.(true);
  } else if (spec.lookAt && light.lookAt) {
    light.lookAt(spec.lookAt.x, spec.lookAt.y, spec.lookAt.z);
  }
}
function upsertLight(engine, spec) {
  const id = spec.id || `light-${spec.role || "practical"}`;
  const next = { ...spec, id };
  let rec = lights.get(id);
  if (!rec) {
    const light = makeLight(next);
    engine.scene.add(light);
    if (light.target) engine.scene.add(light.target);
    rec = { light, spec: next };
    lights.set(id, rec);
  } else {
    rec.spec = { ...rec.spec, ...next };
    rec.light.intensity = rec.spec.intensity;
    rec.light.color.copy(colorOf(rec.spec.color));
  }
  if (rec.light.parent !== engine.scene) engine.scene.add(rec.light);
  if (rec.light.target && rec.light.target.parent !== engine.scene) engine.scene.add(rec.light.target);
  placeLight(rec.light, rec.spec);
  dimStockLights(engine.scene, true);
  return rec.spec;
}
function applyTone(engine) {
  engine.renderer.outputColorSpace = SRGBColorSpace;
  engine.renderer.toneMapping = state.toneMap === "none" ? NoToneMapping : ACESFilmicToneMapping;
  engine.renderer.toneMappingExposure = state.exposure;
}
function disposeOwnedEnv() {
  if (state.envOwned && state.envTex?.dispose) state.envTex.dispose();
  state.envTex = null;
  state.envOwned = false;
}
function studioCanvas() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
  g.addColorStop(0, "#d7dee8");
  g.addColorStop(0.48, "#8b9199");
  g.addColorStop(1, "#3f3c38");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  return canvas;
}
function findSampleTexture(engine) {
  const direct = engine.panoramaMesh?.material?.map;
  if (direct) return direct;
  let found = null;
  engine.scene.traverse((obj) => {
    if (found) return;
    const mats = obj.material ? Array.isArray(obj.material) ? obj.material : [obj.material] : [];
    for (const mat of mats) {
      if (!mat) continue;
      found = mat.map || mat.envMap || mat.normalMap || mat.roughnessMap || mat.metalnessMap || null;
      if (found) return;
    }
  });
  return found;
}
function textureFromImage(engine, image) {
  const sample = findSampleTexture(engine);
  if (sample?.clone) {
    const tex2 = sample.clone();
    tex2.image = image;
    tex2.mapping = EQUIRECT_REFLECTION;
    tex2.needsUpdate = true;
    return tex2;
  }
  const tex = new CanvasTexture(image);
  tex.mapping = EQUIRECT_REFLECTION;
  tex.needsUpdate = true;
  if ("colorSpace" in tex) tex.colorSpace = SRGBColorSpace;
  return tex;
}
function applyEnvIntensity(engine, intensity) {
  if ("environmentIntensity" in engine.scene) engine.scene.environmentIntensity = intensity;
  engine.scene.traverse((obj) => {
    const mats = obj.material ? Array.isArray(obj.material) ? obj.material : [obj.material] : [];
    for (const mat of mats) {
      if (mat && "envMapIntensity" in mat) mat.envMapIntensity = intensity;
    }
  });
}
function applyIbl(engine, on, intensity = 1) {
  if (!on) {
    engine.scene.environment = null;
    disposeOwnedEnv();
    state.ibl = false;
    applyEnvIntensity(engine, 1);
    return { ibl: false };
  }
  const map = engine.panoramaMesh?.material?.map;
  let env = null;
  let source = "studio";
  let owned = false;
  if (map && (map.image || map.source)) {
    map.mapping = EQUIRECT_REFLECTION;
    map.needsUpdate = true;
    env = map;
    source = "panorama";
  } else {
    env = textureFromImage(engine, studioCanvas());
    owned = !!env;
    source = env ? "studio" : "missing";
  }
  disposeOwnedEnv();
  engine.scene.environment = env;
  applyEnvIntensity(engine, intensity);
  state.envTex = env;
  state.envOwned = owned;
  state.ibl = !!env;
  state.iblIntensity = intensity;
  return { ibl: !!env, source, intensity };
}
var composer = null;
var bokehPass = null;
var lutPass = null;
var peakingPass = null;
var renderPass = null;
var hooked = false;
var lutCache = /* @__PURE__ */ new Map();
var cubeLoader = new LUTCubeLoader();
var focusHelper = null;
var PeakingShader = {
  name: "PeakingShader",
  uniforms: {
    tDiffuse: { value: null },
    tDepth: { value: null },
    resolution: { value: new Vector2(1, 1) },
    cameraNear: { value: 0.1 },
    cameraFar: { value: 200 },
    focusM: { value: 4 },
    peakWidth: { value: 0.2 },
    peakColor: { value: new Color(1, 0.12, 0.12) }
  },
  vertexShader: (
    /* glsl */
    `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `
  ),
  fragmentShader: (
    /* glsl */
    `
    uniform sampler2D tDiffuse;
    uniform sampler2D tDepth;
    uniform vec2 resolution;
    uniform float cameraNear;
    uniform float cameraFar;
    uniform float focusM;
    uniform float peakWidth;
    uniform vec3 peakColor;
    varying vec2 vUv;

    float perspectiveDepthToViewZ(const in float invClipZ, const in float near, const in float far) {
      return (near * far) / ((far - near) * invClipZ - far);
    }

    float luma(vec3 c) {
      return dot(c, vec3(0.2126, 0.7152, 0.0722));
    }

    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      float depth = texture2D(tDepth, vUv).x;
      float viewZ = perspectiveDepthToViewZ(depth, cameraNear, cameraFar);
      float dist = -viewZ;
      float band = abs(dist - focusM) / max(peakWidth, 0.001);
      float inFocus = 1.0 - smoothstep(0.35, 1.0, band);

      vec2 texel = 1.0 / max(resolution, vec2(1.0));
      float n = luma(texture2D(tDiffuse, vUv + vec2(0.0, texel.y)).rgb);
      float s = luma(texture2D(tDiffuse, vUv - vec2(0.0, texel.y)).rgb);
      float e = luma(texture2D(tDiffuse, vUv + vec2(texel.x, 0.0)).rgb);
      float w = luma(texture2D(tDiffuse, vUv - vec2(texel.x, 0.0)).rgb);
      float edge = clamp(abs(n - s) + abs(e - w), 0.0, 1.0);
      float peak = inFocus * smoothstep(0.04, 0.22, edge);
      gl_FragColor = vec4(mix(color.rgb, peakColor, peak), color.a);
    }
  `
  )
};
function lutActive() {
  return state.lut && state.lut !== "none" && state.lutIntensity > 0;
}
function needsComposer() {
  return state.dof || lutActive() || state.peaking;
}
function attachDepth(rt) {
  if (rt.depthTexture) return;
  const depth = new DepthTexture();
  depth.format = DepthFormat;
  depth.type = UnsignedIntType;
  rt.depthTexture = depth;
}
function texture3DFromCube(text) {
  const parsed = cubeLoader.parse(text);
  return parsed.texture3D;
}
async function lutTexture(name) {
  if (lutCache.has(name)) return lutCache.get(name);
  const preset = cubeForPreset(name);
  if (preset) {
    const tex2 = texture3DFromCube(preset);
    lutCache.set(name, tex2);
    return tex2;
  }
  if (!isLutPath(name)) return null;
  const res = await fetch(name);
  if (!res.ok) throw new Error(`cube LUT not found: ${name}`);
  const text = await res.text();
  const tex = texture3DFromCube(text);
  lutCache.set(name, tex);
  return tex;
}
async function applyLutPass() {
  if (!lutPass) return { lut: state.lut, intensity: state.lutIntensity };
  if (!lutActive()) {
    lutPass.enabled = false;
    lutPass.lut = null;
    return { lut: "none", intensity: state.lutIntensity };
  }
  const tex = await lutTexture(state.lut);
  lutPass.lut = tex;
  lutPass.intensity = state.lutIntensity;
  lutPass.enabled = !!tex;
  return { lut: state.lut, intensity: state.lutIntensity, ok: !!tex, custom: isLutPath(state.lut) };
}
function syncPeaking(engine) {
  if (!peakingPass) return { peaking: false };
  peakingPass.enabled = state.peaking === true;
  if (!state.peaking) return { peaking: false };
  const width = state.peakWidth != null ? state.peakWidth : peakWidthMeters(state.aperture, state.focusM);
  const uniforms = peakingPass.uniforms;
  uniforms.focusM.value = state.focusM;
  uniforms.peakWidth.value = width;
  uniforms.cameraNear.value = engine.camera.near || 0.1;
  uniforms.cameraFar.value = engine.camera.far || 200;
  if (composer?.renderTarget1?.depthTexture) uniforms.tDepth.value = composer.renderTarget1.depthTexture;
  return { peaking: true, peakWidth: width, focusM: state.focusM };
}
function ensureComposer(engine) {
  if (!composer) {
    composer = new EffectComposer(engine.renderer);
    attachDepth(composer.renderTarget1);
    attachDepth(composer.renderTarget2);
    renderPass = new RenderPass(engine.scene, engine.camera);
    bokehPass = new BokehPass(engine.scene, engine.camera, {
      focus: state.focusM,
      aperture: state.aperture,
      maxblur: state.maxblur
    });
    lutPass = new LUTPass({ intensity: 1 });
    peakingPass = new ShaderPass(PeakingShader);
    peakingPass.enabled = false;
    composer.addPass(renderPass);
    composer.addPass(bokehPass);
    composer.addPass(lutPass);
    composer.addPass(peakingPass);
    composer.addPass(new OutputPass());
  }
  bokehPass.enabled = state.dof === true;
  if (state.dof) {
    bokehPass.uniforms.focus.value = state.focusM;
    bokehPass.uniforms.aperture.value = state.aperture;
    bokehPass.uniforms.maxblur.value = state.maxblur;
  }
  renderPass.camera = engine.camera;
  if (!hooked) {
    hooked = true;
    let composing = false;
    const orig = engine.renderer.render.bind(engine.renderer);
    engine.renderer.render = (scene, camera) => {
      if (composing || !needsComposer() || scene !== engine.scene) return orig(scene, camera);
      renderPass.camera = camera;
      const size = engine.renderer.getSize(new Vector2());
      composer.setSize(size.x, size.y);
      if (peakingPass?.enabled) {
        peakingPass.uniforms.resolution.value.set(size.x, size.y);
        peakingPass.uniforms.tDepth.value = composer.renderTarget1.depthTexture;
        peakingPass.uniforms.cameraNear.value = camera.near || engine.camera.near || 0.1;
        peakingPass.uniforms.cameraFar.value = camera.far || engine.camera.far || 200;
      }
      composing = true;
      try {
        composer.render();
      } finally {
        composing = false;
      }
    };
  }
}
function syncFocusPlane(engine) {
  if (!state.focusPlane) {
    if (focusHelper) {
      engine.scene.remove(focusHelper);
      focusHelper.geometry?.dispose?.();
      focusHelper.material?.dispose?.();
      focusHelper = null;
    }
    return { focusPlane: false };
  }
  if (!focusHelper) {
    const geom = new PlaneGeometry(10, 10);
    const mat = new MeshBasicMaterial({
      color: 8191851,
      transparent: true,
      opacity: 0.16,
      side: DoubleSide,
      depthWrite: false
    });
    focusHelper = new Mesh(geom, mat);
    focusHelper.userData._isHelper = true;
    focusHelper.userData.dxLook = true;
    focusHelper.name = "dx-focus-plane";
    engine.scene.add(focusHelper);
  }
  const cam = engine.camera;
  cam.updateMatrixWorld?.();
  const dir = new Vector3();
  cam.getWorldDirection(dir);
  focusHelper.position.copy(cam.position).addScaledVector(dir, state.focusM);
  focusHelper.quaternion.copy(cam.quaternion);
  return { focusPlane: true, focusM: state.focusM };
}
function findHeadBone(root) {
  let found = null;
  root.traverse((obj) => {
    if (found) return;
    const n = String(obj.name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    if (n === "head" || n === "defspine006" || n.endsWith("head")) found = obj;
  });
  return found;
}
function applyHeadLook(engine, characterId, target) {
  const rec = engine.chars?.get(characterId);
  const root = rec?.inner || rec?.group;
  if (!root || !target) return { ok: false, error: "character or target missing" };
  const bone = findHeadBone(root);
  if (!bone) return { ok: false, error: "head bone not found" };
  const world = new Vector3();
  bone.getWorldPosition(world);
  const dest = new Vector3(target.x, target.y, target.z);
  const parent = bone.parent;
  const qWorld = new Quaternion();
  const m = new Matrix4();
  m.lookAt(world, dest, new Vector3(0, 1, 0));
  qWorld.setFromRotationMatrix(m);
  if (parent) {
    const pq = new Quaternion();
    parent.getWorldQuaternion(pq);
    bone.quaternion.copy(pq.invert().multiply(qWorld));
  } else bone.quaternion.copy(qWorld);
  const euler = new Euler().setFromQuaternion(bone.quaternion, "YXZ");
  euler.y = MathUtils.clamp(euler.y, -80 * Math.PI / 180, 80 * Math.PI / 180);
  euler.x = MathUtils.clamp(euler.x, -35 * Math.PI / 180, 35 * Math.PI / 180);
  euler.z = MathUtils.clamp(euler.z, -20 * Math.PI / 180, 20 * Math.PI / 180);
  bone.quaternion.setFromEuler(euler);
  looks.set(characterId, { target: { ...target } });
  return { ok: true, id: characterId };
}
function subjectOf(engine, id) {
  const rec = engine.chars?.get(id) || engine.props?.get(id);
  const group = rec?.group || rec?.root;
  if (!group) return null;
  return {
    id,
    position: { x: group.position.x, y: group.position.y, z: group.position.z },
    rotationY: group.rotation.y * 180 / Math.PI
  };
}
function gatherPoints(engine) {
  const pts = [];
  for (const rec of engine.chars?.values?.() || []) {
    const p = (rec.group || rec.root)?.position;
    if (p) pts.push({ x: p.x, z: p.z });
  }
  for (const rec of engine.props?.values?.() || []) {
    const p = (rec.group || rec.root)?.position;
    if (p) pts.push({ x: p.x, z: p.z });
  }
  return pts;
}
function framedSubject(engine, id) {
  const selected = id ? subjectOf(engine, id) : null;
  const origin = selected ? { x: selected.position.x, z: selected.position.z } : centroidXZ(gatherPoints(engine));
  const cam = engine.camera?.position;
  const rotationY = cam ? yawToward(origin, { x: cam.x, z: cam.z }) : selected?.rotationY || 0;
  return {
    id: selected?.id,
    position: { x: origin.x, y: selected?.position.y || 0, z: origin.z },
    rotationY
  };
}
function threePoint(subject, preset = "three_point") {
  const yaw = subject.rotationY * Math.PI / 180;
  const forward = { x: Math.sin(yaw), z: Math.cos(yaw) };
  const right = { x: Math.cos(yaw), z: -Math.sin(yaw) };
  const o = subject.position;
  const lookAt = { x: o.x, y: 1.2, z: o.z };
  const put = (r, f, y) => ({
    x: o.x + right.x * r + forward.x * f,
    y: o.y + y,
    z: o.z + right.z * r + forward.z * f
  });
  const high = preset === "high_key";
  const low = preset === "low_key";
  return [
    { id: "light-key", role: "key", kind: "directional", color: low ? "#ffe0c2" : "#fff5e6", intensity: high ? 2.4 : low ? 2.8 : 2.1, position: put(-3.4, 2.2, 4.6), lookAt, castShadow: true },
    { id: "light-fill", role: "fill", kind: "directional", color: low ? "#9bb4d0" : "#e8f0ff", intensity: high ? 1.35 : low ? 0.28 : 0.7, position: put(3.8, 1.2, 2.4), lookAt, castShadow: false },
    { id: "light-back", role: "back", kind: "directional", color: "#b9d4ff", intensity: high ? 0.9 : low ? 1.6 : 1.2, position: put(0.4, -3.6, 4.8), lookAt, castShadow: false }
  ];
}
function rigAmbient(preset) {
  if (preset === "high_key") return { ambient: 0.55, hemi: 0.45, exposure: 1.15 };
  if (preset === "low_key") return { ambient: 0.12, hemi: 0.18, exposure: 0.82 };
  return { ambient: 0.28, hemi: 0.32, exposure: 1 };
}
async function apply(payload = {}) {
  const engine = await waitEngine();
  const report = { lights: [], look: null, rig: null };
  applyTone(engine);
  if (payload.rig) {
    const id = payload.rig.targetId || engine.selectedId || [...engine.chars?.keys?.() || []][0];
    const subject = subjectOf(engine, id) || { position: { x: 0, y: 0, z: 0 }, rotationY: 0 };
    const preset = payload.rig.preset || "three_point";
    const amb = rigAmbient(preset);
    state.ambient = amb.ambient;
    state.hemi = amb.hemi;
    if (payload.exposure == null) state.exposure = amb.exposure;
    for (const spec of threePoint(subject, preset)) report.lights.push(upsertLight(engine, spec));
    report.rig = { preset, targetId: id, ...amb };
    dimStockLights(engine.scene, true);
  }
  for (const spec of payload.lights || []) report.lights.push(upsertLight(engine, spec));
  for (const id of payload.remove || []) {
    const rec = lights.get(id);
    if (rec) {
      engine.scene.remove(rec.light);
      if (rec.light.target) engine.scene.remove(rec.light.target);
      lights.delete(id);
    }
  }
  if (payload.exposure != null) state.exposure = Number(payload.exposure);
  if (payload.toneMap) state.toneMap = payload.toneMap;
  if (payload.ambient != null) state.ambient = Number(payload.ambient);
  if (payload.hemi != null) state.hemi = Number(payload.hemi);
  if (payload.dof != null) state.dof = payload.dof === true;
  if (payload.focusM != null) state.focusM = Number(payload.focusM);
  if (payload.aperture != null) state.aperture = Number(payload.aperture);
  if (payload.ibl != null || payload.iblIntensity != null) {
    try {
      report.ibl = applyIbl(engine, payload.ibl !== false, payload.iblIntensity ?? state.iblIntensity);
    } catch (error) {
      report.ibl = { ok: false, error: error instanceof Error ? error.message : String(error) };
    }
  }
  if (typeof payload.lut === "string") state.lut = payload.lut;
  if (payload.lutIntensity != null) state.lutIntensity = Math.max(0, Math.min(1, Number(payload.lutIntensity)));
  if (payload.focusPlane != null) state.focusPlane = payload.focusPlane === true;
  if (payload.peaking != null) state.peaking = payload.peaking === true;
  if (payload.peakWidth != null) state.peakWidth = Number(payload.peakWidth);
  if (payload.hdri === null) state.hdri = null;
  if (typeof payload.hdri === "string" && payload.hdri) {
    const look = resolveHdriLook(payload.hdri);
    state.hdri = look.id;
    if (payload.kelvin == null) state.kelvin = look.kelvin;
    if (payload.brightness == null) state.brightness = look.brightness;
    if (!payload.key) state.key = look.key;
    if (payload.rim == null) state.rim = look.rim;
    if (payload.azimuth == null) state.azimuth = look.azimuth;
  }
  if (payload.kelvin != null) state.kelvin = Number(payload.kelvin);
  if (payload.brightness != null) state.brightness = Number(payload.brightness);
  if (payload.key) state.key = parseKeySlot(payload.key) || state.key;
  if (payload.rim != null) state.rim = Number(payload.rim);
  if (payload.azimuth != null) state.azimuth = clampAzimuth(Number(payload.azimuth));
  const studioTouched = payload.kelvin != null || payload.brightness != null || payload.key || payload.rim != null || payload.hdri != null || payload.azimuth != null;
  if (studioTouched) {
    const id = payload.rig?.targetId || engine.selectedId;
    const subject = framedSubject(engine, id);
    const origin = { x: subject.position.x, z: subject.position.z };
    const studio = studioLights(subject, { kelvin: state.kelvin, brightness: state.brightness, key: state.key, rim: state.rim });
    const packedLights = spinLightPositions(studio.lights, origin, state.azimuth);
    if (payload.exposure == null) state.exposure = studio.exposure;
    enableStageShadows(engine, true);
    for (const spec of packedLights) report.lights.push(upsertLight(engine, spec));
    report.studio = { kelvin: state.kelvin, brightness: state.brightness, key: state.key, rim: state.rim, exposure: state.exposure, hdri: state.hdri, azimuth: state.azimuth, yaw: subject.rotationY };
    dimStockLights(engine.scene, true);
  }
  applyTone(engine);
  if (state.ambient != null || state.hemi != null) dimStockLights(engine.scene, lights.size > 0 || state.ambient != null);
  try {
    if (needsComposer()) ensureComposer(engine);
    else {
      if (lutPass) lutPass.enabled = false;
      if (peakingPass) peakingPass.enabled = false;
    }
    report.lut = await applyLutPass();
    report.peaking = syncPeaking(engine);
  } catch (error) {
    report.lut = report.lut || { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
  try {
    report.focusPlane = syncFocusPlane(engine);
  } catch (error) {
    report.focusPlane = { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
  if (payload.lookAt) {
    const characterId = payload.lookAt.id;
    let target = payload.lookAt.point;
    if (!target && payload.lookAt.targetId) {
      const other = subjectOf(engine, payload.lookAt.targetId);
      if (other) target = { x: other.position.x, y: other.position.y + 1.45, z: other.position.z };
    }
    report.look = applyHeadLook(engine, characterId, target);
  }
  if (!engine.__dxLookHooked) {
    engine.__dxLookHooked = true;
    engine.renderCbs?.add(() => {
      for (const [id, item] of looks) applyHeadLook(engine, id, item.target);
      if (state.focusPlane) syncFocusPlane(engine);
      if (lights.size) enableStageShadows(engine);
    });
  }
  return {
    ok: true,
    ...report,
    exposure: state.exposure,
    toneMap: state.toneMap,
    dof: state.dof,
    focusM: state.focusM,
    ibl: state.ibl,
    iblIntensity: state.iblIntensity,
    lut: state.lut,
    lutIntensity: state.lutIntensity,
    focusPlane: state.focusPlane,
    peaking: state.peaking,
    lutReport: report.lut,
    peakingReport: report.peaking,
    hdri: state.hdri,
    azimuth: state.azimuth,
    lights: [...lights.values()].map((item) => item.spec)
  };
}
window.__dxLook = {
  apply,
  state: () => ({
    exposure: state.exposure,
    toneMap: state.toneMap,
    dof: state.dof,
    focusM: state.focusM,
    aperture: state.aperture,
    maxblur: state.maxblur,
    ambient: state.ambient,
    hemi: state.hemi,
    ibl: state.ibl,
    iblIntensity: state.iblIntensity,
    lut: state.lut,
    lutIntensity: state.lutIntensity,
    focusPlane: state.focusPlane,
    peaking: state.peaking,
    peakWidth: state.peakWidth,
    kelvin: state.kelvin,
    brightness: state.brightness,
    hdri: state.hdri,
    azimuth: state.azimuth,
    key: state.key,
    rim: state.rim,
    lights: [...lights.values()].map((item) => item.spec)
  })
};
var boundScene = null;
var binding = false;
var studioPayload = () => ({
  kelvin: state.kelvin,
  brightness: state.brightness,
  key: state.key,
  rim: state.rim,
  azimuth: state.azimuth,
  hdri: state.hdri
});
function bindEngine(engine) {
  if (!engine?.scene || binding) return;
  if (engine.scene === boundScene) {
    for (const rec of lights.values()) {
      if (rec.light.parent === engine.scene) return;
    }
  }
  boundScene = engine.scene;
  binding = true;
  apply(studioPayload()).finally(() => {
    binding = false;
  });
}
waitEngine().then(bindEngine);
setInterval(() => bindEngine(window.__directorEngine), 250);
//# sourceMappingURL=stage-look.js.map
