/** Restored director-stage UI (c.jsx → JSX). */
const __vite__mapDeps = (i, m = __vite__mapDeps, d = m.f || (m.f = ["./spzLoader-CU_GD7s0.js", "./index-Bt3LoRYv.js", "./index-D7VV03Tb.css", "./plyLoader-ChQmPnxM.js"])) => i.map(i => d[i]);
var Eu = Object.defineProperty;
var Cu = (o, e, t) => e in o ? Eu(o, e, {
  enumerable: !0,
  configurable: !0,
  writable: !0,
  value: t
}) : o[e] = t;
var S = (o, e, t) => Cu(o, typeof e != "symbol" ? e + "" : e, t);
import { E as ju, V as R, M as Wn, T as Qn, S as Sa, Q as ve, a as yt, R as Su, P as hc, b as ke, O as Ot, c as Ti, d as ct, L as Sn, C as ye, B as Pe, e as Pt, F as Do, f as z, g as ro, h as _t, i as It, j as St, k as Qe, l as hs, m as Lo, D as zo, n as Tu, o as Pu, p as Iu, q as Nu, r as Ru, t as Se, G as je, s as Ze, u as Rs, I as Zn, v as Du, w as Pi, x as Ii, y as Ni, z as Ta, A as Lu, H as Lt, J as nt, K as zu, N as hi, U as pc, W as Ou, X as Ds, Y as fc, Z as mn, _ as Tn, $ as $t, a0 as Hu, a1 as Fu, a2 as Gn, a3 as Bu, a4 as Uu, a5 as pi, a6 as Gu, a7 as ls, a8 as $u, a9 as mc, aa as Ku, ab as Vu, ac as qu, ad as gc, ae as Yu, af as fi, ag as Xu, ah as Wu, ai as xc, aj as hr, ak as Qu, al as Zu, am as bc, an as Ju, ao as ss, ap as $n, aq as wc, ar as eh, as as th, at as nh, au as sh, av as yc, aw as oh, ax as Pa, ay as Ia, az as Na, aA as Ra, aB as Da, aC as rh, aD as ih, aE as Ri, aF as mi, aG as ah, aH as Oo, aI as Di, aJ as Ho, aK as La, aL as pr, aM as lh, aN as ch, aO as vc, aP as za, aQ as dh, aR as uh, aS as k, aT as c, aU as pe, aV as Oa, aW as hh, aX as ph, aY as fh, aZ as mh, a_ as zsVendor, a$ as gh, b0 as _c, b1 as vt, b2 as xh, b3 as bh, b4 as wh, b5 as yh, b6 as kc, b7 as vh, b8 as Ha, b9 as _h, ba as Ac, bb as Mc, bc as _s, bd as Ec, be as Cc, bf as Fa, bg as kh, bh as Ah, bi as Mh, bj as Eh, bk as Ch, bl as jh, bm as Sh, bn as jc, bo as Th, bp as Ph, bq as Ih, br as fr, bs as Nh, bt as Rh, bu as Dh, bv as Lh, bw as zh } from "./index-Bt3LoRYv.js";
import { dollyZoomFov, jibEnd, lookAtQuat, panLookAt, rollEndTilt, tiltLookAt, zoomEndFov } from "../src/optics/motions";
const zs = () => typeof window !== "undefined" && !!window.hub;
void zsVendor;
const Ne = "__none__",
  Ge = o => {
    var e;
    return (e = o.memberIds) != null && e.length ? o.memberIds : o.characterIds;
  },
  gi = "::",
  Sc = (o, e) => `${o}${gi}${e}`,
  Os = o => {
    const e = o.indexOf(gi);
    return e > 0 ? {
      modelId: o.slice(0, e),
      part: o.slice(e + gi.length)
    } : null;
  },
  Oh = "modulepreload",
  Hh = function (o, e) {
    return new URL(o, e).href;
  },
  Ba = {},
  mr = function (e, t, n) {
    let s = Promise.resolve();
    if (t && t.length > 0) {
      const i = document.getElementsByTagName("link"),
        a = document.querySelector("meta[property=csp-nonce]"),
        l = (a == null ? void 0 : a.nonce) || (a == null ? void 0 : a.getAttribute("nonce"));
      s = Promise.allSettled(t.map(d => {
        if (d = Hh(d, n), d in Ba) return;
        Ba[d] = !0;
        const u = d.endsWith(".css"),
          h = u ? '[rel="stylesheet"]' : "";
        if (!!n) for (let p = i.length - 1; p >= 0; p--) {
          const x = i[p];
          if (x.href === d && (!u || x.rel === "stylesheet")) return;
        } else if (document.querySelector(`link[href="${d}"]${h}`)) return;
        const f = document.createElement("link");
        if (f.rel = u ? "stylesheet" : Oh, u || (f.as = "script"), f.crossOrigin = "", f.href = d, l && f.setAttribute("nonce", l), document.head.appendChild(f), u) return new Promise((p, x) => {
          f.addEventListener("load", p), f.addEventListener("error", () => x(new Error(`Unable to preload CSS for ${d}`)));
        });
      }));
    }
    function r(i) {
      const a = new Event("vite:preloadError", {
        cancelable: !0
      });
      if (a.payload = i, window.dispatchEvent(a), !a.defaultPrevented) throw i;
    }
    return s.then(i => {
      for (const a of i || []) a.status === "rejected" && r(a.reason);
      return e().catch(r);
    });
  },
  Ua = {
    type: "change"
  },
  gr = {
    type: "start"
  },
  Ga = {
    type: "end"
  },
  io = new Su(),
  $a = new hc(),
  Fh = Math.cos(70 * ke.DEG2RAD);
class Bh extends ju {
  constructor(e, t) {
    super(), this.object = e, this.domElement = t, this.domElement.style.touchAction = "none", this.enabled = !0, this.target = new R(), this.cursor = new R(), this.minDistance = 0, this.maxDistance = 1 / 0, this.minZoom = 0, this.maxZoom = 1 / 0, this.minTargetRadius = 0, this.maxTargetRadius = 1 / 0, this.minPolarAngle = 0, this.maxPolarAngle = Math.PI, this.minAzimuthAngle = -1 / 0, this.maxAzimuthAngle = 1 / 0, this.enableDamping = !1, this.dampingFactor = 0.05, this.enableZoom = !0, this.zoomSpeed = 1, this.enableRotate = !0, this.rotateSpeed = 1, this.enablePan = !0, this.panSpeed = 1, this.screenSpacePanning = !0, this.keyPanSpeed = 7, this.zoomToCursor = !1, this.autoRotate = !1, this.autoRotateSpeed = 2, this.keys = {
      LEFT: "ArrowLeft",
      UP: "ArrowUp",
      RIGHT: "ArrowRight",
      BOTTOM: "ArrowDown"
    }, this.mouseButtons = {
      LEFT: Wn.ROTATE,
      MIDDLE: Wn.DOLLY,
      RIGHT: Wn.PAN
    }, this.touches = {
      ONE: Qn.ROTATE,
      TWO: Qn.DOLLY_PAN
    }, this.target0 = this.target.clone(), this.position0 = this.object.position.clone(), this.zoom0 = this.object.zoom, this._domElementKeyEvents = null, this.getPolarAngle = function () {
      return a.phi;
    }, this.getAzimuthalAngle = function () {
      return a.theta;
    }, this.getDistance = function () {
      return this.object.position.distanceTo(this.target);
    }, this.listenToKeyEvents = function (N) {
      N.addEventListener("keydown", Ve), this._domElementKeyEvents = N;
    }, this.stopListenToKeyEvents = function () {
      this._domElementKeyEvents.removeEventListener("keydown", Ve), this._domElementKeyEvents = null;
    }, this.saveState = function () {
      n.target0.copy(n.target), n.position0.copy(n.object.position), n.zoom0 = n.object.zoom;
    }, this.reset = function () {
      n.target.copy(n.target0), n.object.position.copy(n.position0), n.object.zoom = n.zoom0, n.object.updateProjectionMatrix(), n.dispatchEvent(Ua), n.update(), r = s.NONE;
    }, this.update = function () {
      const N = new R(),
        Q = new ve().setFromUnitVectors(e.up, new R(0, 1, 0)),
        we = Q.clone().invert(),
        Y = new R(),
        ge = new ve(),
        pt = new R(),
        Rt = 2 * Math.PI;
      return function (qt = null) {
        const qn = n.object.position;
        N.copy(qn).sub(n.target), N.applyQuaternion(Q), a.setFromVector3(N), n.autoRotate && r === s.NONE && j(y(qt)), n.enableDamping ? (a.theta += l.theta * n.dampingFactor, a.phi += l.phi * n.dampingFactor) : (a.theta += l.theta, a.phi += l.phi);
        let kt = n.minAzimuthAngle,
          bt = n.maxAzimuthAngle;
        isFinite(kt) && isFinite(bt) && (kt < -Math.PI ? kt += Rt : kt > Math.PI && (kt -= Rt), bt < -Math.PI ? bt += Rt : bt > Math.PI && (bt -= Rt), kt <= bt ? a.theta = Math.max(kt, Math.min(bt, a.theta)) : a.theta = a.theta > (kt + bt) / 2 ? Math.max(kt, a.theta) : Math.min(bt, a.theta)), a.phi = Math.max(n.minPolarAngle, Math.min(n.maxPolarAngle, a.phi)), a.makeSafe(), n.enableDamping === !0 ? n.target.addScaledVector(u, n.dampingFactor) : n.target.add(u), n.target.sub(n.cursor), n.target.clampLength(n.minTargetRadius, n.maxTargetRadius), n.target.add(n.cursor), n.zoomToCursor && P || n.object.isOrthographicCamera ? a.radius = ce(a.radius) : a.radius = ce(a.radius * d), N.setFromSpherical(a), N.applyQuaternion(we), qn.copy(n.target).add(N), n.object.lookAt(n.target), n.enableDamping === !0 ? (l.theta *= 1 - n.dampingFactor, l.phi *= 1 - n.dampingFactor, u.multiplyScalar(1 - n.dampingFactor)) : (l.set(0, 0, 0), u.set(0, 0, 0));
        let Yn = !1;
        if (n.zoomToCursor && P) {
          let Nn = null;
          if (n.object.isPerspectiveCamera) {
            const ft = N.length();
            Nn = ce(ft * d);
            const Rn = ft - Nn;
            n.object.position.addScaledVector(E, Rn), n.object.updateMatrixWorld();
          } else if (n.object.isOrthographicCamera) {
            const ft = new R(T.x, T.y, 0);
            ft.unproject(n.object), n.object.zoom = Math.max(n.minZoom, Math.min(n.maxZoom, n.object.zoom / d)), n.object.updateProjectionMatrix(), Yn = !0;
            const Rn = new R(T.x, T.y, 0);
            Rn.unproject(n.object), n.object.position.sub(Rn).add(ft), n.object.updateMatrixWorld(), Nn = N.length();
          } else console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."), n.zoomToCursor = !1;
          Nn !== null && (this.screenSpacePanning ? n.target.set(0, 0, -1).transformDirection(n.object.matrix).multiplyScalar(Nn).add(n.object.position) : (io.origin.copy(n.object.position), io.direction.set(0, 0, -1).transformDirection(n.object.matrix), Math.abs(n.object.up.dot(io.direction)) < Fh ? e.lookAt(n.target) : ($a.setFromNormalAndCoplanarPoint(n.object.up, n.target), io.intersectPlane($a, n.target))));
        } else n.object.isOrthographicCamera && (n.object.zoom = Math.max(n.minZoom, Math.min(n.maxZoom, n.object.zoom / d)), n.object.updateProjectionMatrix(), Yn = !0);
        return d = 1, P = !1, Yn || Y.distanceToSquared(n.object.position) > i || 8 * (1 - ge.dot(n.object.quaternion)) > i || pt.distanceToSquared(n.target) > 0 ? (n.dispatchEvent(Ua), Y.copy(n.object.position), ge.copy(n.object.quaternion), pt.copy(n.target), !0) : !1;
      };
    }(), this.dispose = function () {
      n.domElement.removeEventListener("contextmenu", xe), n.domElement.removeEventListener("pointerdown", et), n.domElement.removeEventListener("pointercancel", at), n.domElement.removeEventListener("wheel", Z), n.domElement.removeEventListener("pointermove", xt), n.domElement.removeEventListener("pointerup", at), n._domElementKeyEvents !== null && (n._domElementKeyEvents.removeEventListener("keydown", Ve), n._domElementKeyEvents = null);
    };
    const n = this,
      s = {
        NONE: -1,
        ROTATE: 0,
        DOLLY: 1,
        PAN: 2,
        TOUCH_ROTATE: 3,
        TOUCH_PAN: 4,
        TOUCH_DOLLY_PAN: 5,
        TOUCH_DOLLY_ROTATE: 6
      };
    let r = s.NONE;
    const i = 1e-6,
      a = new Sa(),
      l = new Sa();
    let d = 1;
    const u = new R(),
      h = new yt(),
      m = new yt(),
      f = new yt(),
      p = new yt(),
      x = new yt(),
      g = new yt(),
      b = new yt(),
      w = new yt(),
      v = new yt(),
      E = new R(),
      T = new yt();
    let P = !1;
    const C = [],
      M = {};
    function y(N) {
      return N !== null ? 2 * Math.PI / 60 * n.autoRotateSpeed * N : 2 * Math.PI / 60 / 60 * n.autoRotateSpeed;
    }
    function I() {
      return Math.pow(0.95, n.zoomSpeed);
    }
    function j(N) {
      l.theta -= N;
    }
    function D(N) {
      l.phi -= N;
    }
    const H = function () {
        const N = new R();
        return function (we, Y) {
          N.setFromMatrixColumn(Y, 0), N.multiplyScalar(-we), u.add(N);
        };
      }(),
      F = function () {
        const N = new R();
        return function (we, Y) {
          n.screenSpacePanning === !0 ? N.setFromMatrixColumn(Y, 1) : (N.setFromMatrixColumn(Y, 0), N.crossVectors(n.object.up, N)), N.multiplyScalar(we), u.add(N);
        };
      }(),
      U = function () {
        const N = new R();
        return function (we, Y) {
          const ge = n.domElement;
          if (n.object.isPerspectiveCamera) {
            const pt = n.object.position;
            N.copy(pt).sub(n.target);
            let Rt = N.length();
            Rt *= Math.tan(n.object.fov / 2 * Math.PI / 180), H(2 * we * Rt / ge.clientHeight, n.object.matrix), F(2 * Y * Rt / ge.clientHeight, n.object.matrix);
          } else n.object.isOrthographicCamera ? (H(we * (n.object.right - n.object.left) / n.object.zoom / ge.clientWidth, n.object.matrix), F(Y * (n.object.top - n.object.bottom) / n.object.zoom / ge.clientHeight, n.object.matrix)) : (console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."), n.enablePan = !1);
        };
      }();
    function ne(N) {
      n.object.isPerspectiveCamera || n.object.isOrthographicCamera ? d /= N : (console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."), n.enableZoom = !1);
    }
    function ae(N) {
      n.object.isPerspectiveCamera || n.object.isOrthographicCamera ? d *= N : (console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."), n.enableZoom = !1);
    }
    function He(N) {
      if (!n.zoomToCursor) return;
      P = !0;
      const Q = n.domElement.getBoundingClientRect(),
        we = N.clientX - Q.left,
        Y = N.clientY - Q.top,
        ge = Q.width,
        pt = Q.height;
      T.x = we / ge * 2 - 1, T.y = -(Y / pt) * 2 + 1, E.set(T.x, T.y, 1).unproject(n.object).sub(n.object.position).normalize();
    }
    function ce(N) {
      return Math.max(n.minDistance, Math.min(n.maxDistance, N));
    }
    function Re(N) {
      h.set(N.clientX, N.clientY);
    }
    function ot(N) {
      He(N), b.set(N.clientX, N.clientY);
    }
    function Ke(N) {
      p.set(N.clientX, N.clientY);
    }
    function rt(N) {
      m.set(N.clientX, N.clientY), f.subVectors(m, h).multiplyScalar(n.rotateSpeed);
      const Q = n.domElement;
      j(2 * Math.PI * f.x / Q.clientHeight), D(2 * Math.PI * f.y / Q.clientHeight), h.copy(m), n.update();
    }
    function De(N) {
      w.set(N.clientX, N.clientY), v.subVectors(w, b), v.y > 0 ? ne(I()) : v.y < 0 && ae(I()), b.copy(w), n.update();
    }
    function dt(N) {
      x.set(N.clientX, N.clientY), g.subVectors(x, p).multiplyScalar(n.panSpeed), U(g.x, g.y), p.copy(x), n.update();
    }
    function it(N) {
      He(N), N.deltaY < 0 ? ae(I()) : N.deltaY > 0 && ne(I()), n.update();
    }
    function Ue(N) {
      let Q = !1;
      switch (N.code) {
        case n.keys.UP:
          N.ctrlKey || N.metaKey || N.shiftKey ? D(2 * Math.PI * n.rotateSpeed / n.domElement.clientHeight) : U(0, n.keyPanSpeed), Q = !0;
          break;
        case n.keys.BOTTOM:
          N.ctrlKey || N.metaKey || N.shiftKey ? D(-2 * Math.PI * n.rotateSpeed / n.domElement.clientHeight) : U(0, -n.keyPanSpeed), Q = !0;
          break;
        case n.keys.LEFT:
          N.ctrlKey || N.metaKey || N.shiftKey ? j(2 * Math.PI * n.rotateSpeed / n.domElement.clientHeight) : U(n.keyPanSpeed, 0), Q = !0;
          break;
        case n.keys.RIGHT:
          N.ctrlKey || N.metaKey || N.shiftKey ? j(-2 * Math.PI * n.rotateSpeed / n.domElement.clientHeight) : U(-n.keyPanSpeed, 0), Q = !0;
          break;
      }
      Q && (N.preventDefault(), n.update());
    }
    function gt() {
      if (C.length === 1) h.set(C[0].pageX, C[0].pageY);else {
        const N = 0.5 * (C[0].pageX + C[1].pageX),
          Q = 0.5 * (C[0].pageY + C[1].pageY);
        h.set(N, Q);
      }
    }
    function Je() {
      if (C.length === 1) p.set(C[0].pageX, C[0].pageY);else {
        const N = 0.5 * (C[0].pageX + C[1].pageX),
          Q = 0.5 * (C[0].pageY + C[1].pageY);
        p.set(N, Q);
      }
    }
    function ut() {
      const N = C[0].pageX - C[1].pageX,
        Q = C[0].pageY - C[1].pageY,
        we = Math.sqrt(N * N + Q * Q);
      b.set(0, we);
    }
    function st() {
      n.enableZoom && ut(), n.enablePan && Je();
    }
    function G() {
      n.enableZoom && ut(), n.enableRotate && gt();
    }
    function W(N) {
      if (C.length == 1) m.set(N.pageX, N.pageY);else {
        const we = Ft(N),
          Y = 0.5 * (N.pageX + we.x),
          ge = 0.5 * (N.pageY + we.y);
        m.set(Y, ge);
      }
      f.subVectors(m, h).multiplyScalar(n.rotateSpeed);
      const Q = n.domElement;
      j(2 * Math.PI * f.x / Q.clientHeight), D(2 * Math.PI * f.y / Q.clientHeight), h.copy(m);
    }
    function ee(N) {
      if (C.length === 1) x.set(N.pageX, N.pageY);else {
        const Q = Ft(N),
          we = 0.5 * (N.pageX + Q.x),
          Y = 0.5 * (N.pageY + Q.y);
        x.set(we, Y);
      }
      g.subVectors(x, p).multiplyScalar(n.panSpeed), U(g.x, g.y), p.copy(x);
    }
    function de(N) {
      const Q = Ft(N),
        we = N.pageX - Q.x,
        Y = N.pageY - Q.y,
        ge = Math.sqrt(we * we + Y * Y);
      w.set(0, ge), v.set(0, Math.pow(w.y / b.y, n.zoomSpeed)), ne(v.y), b.copy(w);
    }
    function se(N) {
      n.enableZoom && de(N), n.enablePan && ee(N);
    }
    function ht(N) {
      n.enableZoom && de(N), n.enableRotate && W(N);
    }
    function et(N) {
      n.enabled !== !1 && (C.length === 0 && (n.domElement.setPointerCapture(N.pointerId), n.domElement.addEventListener("pointermove", xt), n.domElement.addEventListener("pointerup", at)), be(N), N.pointerType === "touch" ? lt(N) : Ye(N));
    }
    function xt(N) {
      n.enabled !== !1 && (N.pointerType === "touch" ? tt(N) : K(N));
    }
    function at(N) {
      Et(N), C.length === 0 && (n.domElement.releasePointerCapture(N.pointerId), n.domElement.removeEventListener("pointermove", xt), n.domElement.removeEventListener("pointerup", at)), n.dispatchEvent(Ga), r = s.NONE;
    }
    function Ye(N) {
      let Q;
      switch (N.button) {
        case 0:
          Q = n.mouseButtons.LEFT;
          break;
        case 1:
          Q = n.mouseButtons.MIDDLE;
          break;
        case 2:
          Q = n.mouseButtons.RIGHT;
          break;
        default:
          Q = -1;
      }
      switch (Q) {
        case Wn.DOLLY:
          if (n.enableZoom === !1) return;
          ot(N), r = s.DOLLY;
          break;
        case Wn.ROTATE:
          if (N.ctrlKey || N.metaKey || N.shiftKey) {
            if (n.enablePan === !1) return;
            Ke(N), r = s.PAN;
          } else {
            if (n.enableRotate === !1) return;
            Re(N), r = s.ROTATE;
          }
          break;
        case Wn.PAN:
          if (N.ctrlKey || N.metaKey || N.shiftKey) {
            if (n.enableRotate === !1) return;
            Re(N), r = s.ROTATE;
          } else {
            if (n.enablePan === !1) return;
            Ke(N), r = s.PAN;
          }
          break;
        default:
          r = s.NONE;
      }
      r !== s.NONE && n.dispatchEvent(gr);
    }
    function K(N) {
      switch (r) {
        case s.ROTATE:
          if (n.enableRotate === !1) return;
          rt(N);
          break;
        case s.DOLLY:
          if (n.enableZoom === !1) return;
          De(N);
          break;
        case s.PAN:
          if (n.enablePan === !1) return;
          dt(N);
          break;
      }
    }
    function Z(N) {
      n.enabled === !1 || n.enableZoom === !1 || r !== s.NONE || (N.preventDefault(), n.dispatchEvent(gr), it(N), n.dispatchEvent(Ga));
    }
    function Ve(N) {
      n.enabled === !1 || n.enablePan === !1 || Ue(N);
    }
    function lt(N) {
      switch (Xe(N), C.length) {
        case 1:
          switch (n.touches.ONE) {
            case Qn.ROTATE:
              if (n.enableRotate === !1) return;
              gt(), r = s.TOUCH_ROTATE;
              break;
            case Qn.PAN:
              if (n.enablePan === !1) return;
              Je(), r = s.TOUCH_PAN;
              break;
            default:
              r = s.NONE;
          }
          break;
        case 2:
          switch (n.touches.TWO) {
            case Qn.DOLLY_PAN:
              if (n.enableZoom === !1 && n.enablePan === !1) return;
              st(), r = s.TOUCH_DOLLY_PAN;
              break;
            case Qn.DOLLY_ROTATE:
              if (n.enableZoom === !1 && n.enableRotate === !1) return;
              G(), r = s.TOUCH_DOLLY_ROTATE;
              break;
            default:
              r = s.NONE;
          }
          break;
        default:
          r = s.NONE;
      }
      r !== s.NONE && n.dispatchEvent(gr);
    }
    function tt(N) {
      switch (Xe(N), r) {
        case s.TOUCH_ROTATE:
          if (n.enableRotate === !1) return;
          W(N), n.update();
          break;
        case s.TOUCH_PAN:
          if (n.enablePan === !1) return;
          ee(N), n.update();
          break;
        case s.TOUCH_DOLLY_PAN:
          if (n.enableZoom === !1 && n.enablePan === !1) return;
          se(N), n.update();
          break;
        case s.TOUCH_DOLLY_ROTATE:
          if (n.enableZoom === !1 && n.enableRotate === !1) return;
          ht(N), n.update();
          break;
        default:
          r = s.NONE;
      }
    }
    function xe(N) {
      n.enabled !== !1 && N.preventDefault();
    }
    function be(N) {
      C.push(N);
    }
    function Et(N) {
      delete M[N.pointerId];
      for (let Q = 0; Q < C.length; Q++) if (C[Q].pointerId == N.pointerId) {
        C.splice(Q, 1);
        return;
      }
    }
    function Xe(N) {
      let Q = M[N.pointerId];
      Q === void 0 && (Q = new yt(), M[N.pointerId] = Q), Q.set(N.pageX, N.pageY);
    }
    function Ft(N) {
      const Q = N.pointerId === C[0].pointerId ? C[1] : C[0];
      return M[Q.pointerId];
    }
    n.domElement.addEventListener("contextmenu", xe), n.domElement.addEventListener("pointerdown", et), n.domElement.addEventListener("pointercancel", at), n.domElement.addEventListener("wheel", Z, {
      passive: !1
    }), this.update();
  }
}
const Dn = new Ti(),
  mt = new R(),
  wn = new R(),
  ze = new ve(),
  Ka = {
    X: new R(1, 0, 0),
    Y: new R(0, 1, 0),
    Z: new R(0, 0, 1)
  },
  xr = {
    type: "change"
  },
  Va = {
    type: "mouseDown"
  },
  qa = {
    type: "mouseUp",
    mode: null
  },
  Ya = {
    type: "objectChange"
  };
class Uh extends Ot {
  constructor(e, t) {
    super(), t === void 0 && (console.warn('THREE.TransformControls: The second parameter "domElement" is now mandatory.'), t = document), this.isTransformControls = !0, this.visible = !1, this.domElement = t, this.domElement.style.touchAction = "none";
    const n = new Yh();
    this._gizmo = n, this.add(n);
    const s = new Xh();
    this._plane = s, this.add(s);
    const r = this;
    function i(w, v) {
      let E = v;
      Object.defineProperty(r, w, {
        get: function () {
          return E !== void 0 ? E : v;
        },
        set: function (T) {
          E !== T && (E = T, s[w] = T, n[w] = T, r.dispatchEvent({
            type: w + "-changed",
            value: T
          }), r.dispatchEvent(xr));
        }
      }), r[w] = v, s[w] = v, n[w] = v;
    }
    i("camera", e), i("object", void 0), i("enabled", !0), i("axis", null), i("mode", "translate"), i("translationSnap", null), i("rotationSnap", null), i("scaleSnap", null), i("space", "world"), i("size", 1), i("dragging", !1), i("showX", !0), i("showY", !0), i("showZ", !0);
    const a = new R(),
      l = new R(),
      d = new ve(),
      u = new ve(),
      h = new R(),
      m = new ve(),
      f = new R(),
      p = new R(),
      x = new R(),
      g = 0,
      b = new R();
    i("worldPosition", a), i("worldPositionStart", l), i("worldQuaternion", d), i("worldQuaternionStart", u), i("cameraPosition", h), i("cameraQuaternion", m), i("pointStart", f), i("pointEnd", p), i("rotationAxis", x), i("rotationAngle", g), i("eye", b), this._offset = new R(), this._startNorm = new R(), this._endNorm = new R(), this._cameraScale = new R(), this._parentPosition = new R(), this._parentQuaternion = new ve(), this._parentQuaternionInv = new ve(), this._parentScale = new R(), this._worldScaleStart = new R(), this._worldQuaternionInv = new ve(), this._worldScale = new R(), this._positionStart = new R(), this._quaternionStart = new ve(), this._scaleStart = new R(), this._getPointer = Gh.bind(this), this._onPointerDown = Kh.bind(this), this._onPointerHover = $h.bind(this), this._onPointerMove = Vh.bind(this), this._onPointerUp = qh.bind(this), this.domElement.addEventListener("pointerdown", this._onPointerDown), this.domElement.addEventListener("pointermove", this._onPointerHover), this.domElement.addEventListener("pointerup", this._onPointerUp);
  }
  updateMatrixWorld() {
    this.object !== void 0 && (this.object.updateMatrixWorld(), this.object.parent === null ? console.error("TransformControls: The attached 3D object must be a part of the scene graph.") : this.object.parent.matrixWorld.decompose(this._parentPosition, this._parentQuaternion, this._parentScale), this.object.matrixWorld.decompose(this.worldPosition, this.worldQuaternion, this._worldScale), this._parentQuaternionInv.copy(this._parentQuaternion).invert(), this._worldQuaternionInv.copy(this.worldQuaternion).invert()), this.camera.updateMatrixWorld(), this.camera.matrixWorld.decompose(this.cameraPosition, this.cameraQuaternion, this._cameraScale), this.camera.isOrthographicCamera ? this.camera.getWorldDirection(this.eye).negate() : this.eye.copy(this.cameraPosition).sub(this.worldPosition).normalize(), super.updateMatrixWorld(this);
  }
  pointerHover(e) {
    if (this.object === void 0 || this.dragging === !0) return;
    Dn.setFromCamera(e, this.camera);
    const t = br(this._gizmo.picker[this.mode], Dn);
    t ? this.axis = t.object.name : this.axis = null;
  }
  pointerDown(e) {
    if (!(this.object === void 0 || this.dragging === !0 || e.button !== 0) && this.axis !== null) {
      Dn.setFromCamera(e, this.camera);
      const t = br(this._plane, Dn, !0);
      t && (this.object.updateMatrixWorld(), this.object.parent.updateMatrixWorld(), this._positionStart.copy(this.object.position), this._quaternionStart.copy(this.object.quaternion), this._scaleStart.copy(this.object.scale), this.object.matrixWorld.decompose(this.worldPositionStart, this.worldQuaternionStart, this._worldScaleStart), this.pointStart.copy(t.point).sub(this.worldPositionStart)), this.dragging = !0, Va.mode = this.mode, this.dispatchEvent(Va);
    }
  }
  pointerMove(e) {
    const t = this.axis,
      n = this.mode,
      s = this.object;
    let r = this.space;
    if (n === "scale" ? r = "local" : (t === "E" || t === "XYZE" || t === "XYZ") && (r = "world"), s === void 0 || t === null || this.dragging === !1 || e.button !== -1) return;
    Dn.setFromCamera(e, this.camera);
    const i = br(this._plane, Dn, !0);
    if (i) {
      if (this.pointEnd.copy(i.point).sub(this.worldPositionStart), n === "translate") this._offset.copy(this.pointEnd).sub(this.pointStart), r === "local" && t !== "XYZ" && this._offset.applyQuaternion(this._worldQuaternionInv), t.indexOf("X") === -1 && (this._offset.x = 0), t.indexOf("Y") === -1 && (this._offset.y = 0), t.indexOf("Z") === -1 && (this._offset.z = 0), r === "local" && t !== "XYZ" ? this._offset.applyQuaternion(this._quaternionStart).divide(this._parentScale) : this._offset.applyQuaternion(this._parentQuaternionInv).divide(this._parentScale), s.position.copy(this._offset).add(this._positionStart), this.translationSnap && (r === "local" && (s.position.applyQuaternion(ze.copy(this._quaternionStart).invert()), t.search("X") !== -1 && (s.position.x = Math.round(s.position.x / this.translationSnap) * this.translationSnap), t.search("Y") !== -1 && (s.position.y = Math.round(s.position.y / this.translationSnap) * this.translationSnap), t.search("Z") !== -1 && (s.position.z = Math.round(s.position.z / this.translationSnap) * this.translationSnap), s.position.applyQuaternion(this._quaternionStart)), r === "world" && (s.parent && s.position.add(mt.setFromMatrixPosition(s.parent.matrixWorld)), t.search("X") !== -1 && (s.position.x = Math.round(s.position.x / this.translationSnap) * this.translationSnap), t.search("Y") !== -1 && (s.position.y = Math.round(s.position.y / this.translationSnap) * this.translationSnap), t.search("Z") !== -1 && (s.position.z = Math.round(s.position.z / this.translationSnap) * this.translationSnap), s.parent && s.position.sub(mt.setFromMatrixPosition(s.parent.matrixWorld))));else if (n === "scale") {
        if (t.search("XYZ") !== -1) {
          let a = this.pointEnd.length() / this.pointStart.length();
          this.pointEnd.dot(this.pointStart) < 0 && (a *= -1), wn.set(a, a, a);
        } else mt.copy(this.pointStart), wn.copy(this.pointEnd), mt.applyQuaternion(this._worldQuaternionInv), wn.applyQuaternion(this._worldQuaternionInv), wn.divide(mt), t.search("X") === -1 && (wn.x = 1), t.search("Y") === -1 && (wn.y = 1), t.search("Z") === -1 && (wn.z = 1);
        s.scale.copy(this._scaleStart).multiply(wn), this.scaleSnap && (t.search("X") !== -1 && (s.scale.x = Math.round(s.scale.x / this.scaleSnap) * this.scaleSnap || this.scaleSnap), t.search("Y") !== -1 && (s.scale.y = Math.round(s.scale.y / this.scaleSnap) * this.scaleSnap || this.scaleSnap), t.search("Z") !== -1 && (s.scale.z = Math.round(s.scale.z / this.scaleSnap) * this.scaleSnap || this.scaleSnap));
      } else if (n === "rotate") {
        this._offset.copy(this.pointEnd).sub(this.pointStart);
        const a = 20 / this.worldPosition.distanceTo(mt.setFromMatrixPosition(this.camera.matrixWorld));
        let l = !1;
        t === "XYZE" ? (this.rotationAxis.copy(this._offset).cross(this.eye).normalize(), this.rotationAngle = this._offset.dot(mt.copy(this.rotationAxis).cross(this.eye)) * a) : (t === "X" || t === "Y" || t === "Z") && (this.rotationAxis.copy(Ka[t]), mt.copy(Ka[t]), r === "local" && mt.applyQuaternion(this.worldQuaternion), mt.cross(this.eye), mt.length() === 0 ? l = !0 : this.rotationAngle = this._offset.dot(mt.normalize()) * a), (t === "E" || l) && (this.rotationAxis.copy(this.eye), this.rotationAngle = this.pointEnd.angleTo(this.pointStart), this._startNorm.copy(this.pointStart).normalize(), this._endNorm.copy(this.pointEnd).normalize(), this.rotationAngle *= this._endNorm.cross(this._startNorm).dot(this.eye) < 0 ? 1 : -1), this.rotationSnap && (this.rotationAngle = Math.round(this.rotationAngle / this.rotationSnap) * this.rotationSnap), r === "local" && t !== "E" && t !== "XYZE" ? (s.quaternion.copy(this._quaternionStart), s.quaternion.multiply(ze.setFromAxisAngle(this.rotationAxis, this.rotationAngle)).normalize()) : (this.rotationAxis.applyQuaternion(this._parentQuaternionInv), s.quaternion.copy(ze.setFromAxisAngle(this.rotationAxis, this.rotationAngle)), s.quaternion.multiply(this._quaternionStart).normalize());
      }
      this.dispatchEvent(xr), this.dispatchEvent(Ya);
    }
  }
  pointerUp(e) {
    e.button === 0 && (this.dragging && this.axis !== null && (qa.mode = this.mode, this.dispatchEvent(qa)), this.dragging = !1, this.axis = null);
  }
  dispose() {
    this.domElement.removeEventListener("pointerdown", this._onPointerDown), this.domElement.removeEventListener("pointermove", this._onPointerHover), this.domElement.removeEventListener("pointermove", this._onPointerMove), this.domElement.removeEventListener("pointerup", this._onPointerUp), this.traverse(function (e) {
      e.geometry && e.geometry.dispose(), e.material && e.material.dispose();
    });
  }
  attach(e) {
    return this.object = e, this.visible = !0, this;
  }
  detach() {
    return this.object = void 0, this.visible = !1, this.axis = null, this;
  }
  reset() {
    this.enabled && this.dragging && (this.object.position.copy(this._positionStart), this.object.quaternion.copy(this._quaternionStart), this.object.scale.copy(this._scaleStart), this.dispatchEvent(xr), this.dispatchEvent(Ya), this.pointStart.copy(this.pointEnd));
  }
  getRaycaster() {
    return Dn;
  }
  getMode() {
    return this.mode;
  }
  setMode(e) {
    this.mode = e;
  }
  setTranslationSnap(e) {
    this.translationSnap = e;
  }
  setRotationSnap(e) {
    this.rotationSnap = e;
  }
  setScaleSnap(e) {
    this.scaleSnap = e;
  }
  setSize(e) {
    this.size = e;
  }
  setSpace(e) {
    this.space = e;
  }
}
function Gh(o) {
  if (this.domElement.ownerDocument.pointerLockElement) return {
    x: 0,
    y: 0,
    button: o.button
  };
  {
    const e = this.domElement.getBoundingClientRect();
    return {
      x: (o.clientX - e.left) / e.width * 2 - 1,
      y: -(o.clientY - e.top) / e.height * 2 + 1,
      button: o.button
    };
  }
}
function $h(o) {
  if (this.enabled) switch (o.pointerType) {
    case "mouse":
    case "pen":
      this.pointerHover(this._getPointer(o));
      break;
  }
}
function Kh(o) {
  this.enabled && (document.pointerLockElement || this.domElement.setPointerCapture(o.pointerId), this.domElement.addEventListener("pointermove", this._onPointerMove), this.pointerHover(this._getPointer(o)), this.pointerDown(this._getPointer(o)));
}
function Vh(o) {
  this.enabled && this.pointerMove(this._getPointer(o));
}
function qh(o) {
  this.enabled && (this.domElement.releasePointerCapture(o.pointerId), this.domElement.removeEventListener("pointermove", this._onPointerMove), this.pointerUp(this._getPointer(o)));
}
function br(o, e, t) {
  const n = e.intersectObject(o, !0);
  for (let s = 0; s < n.length; s++) if (n[s].object.visible || t) return n[s];
  return !1;
}
const ao = new Qe(),
  Te = new R(0, 1, 0),
  Xa = new R(0, 0, 0),
  Wa = new hs(),
  lo = new ve(),
  Co = new ve(),
  Yt = new R(),
  Qa = new hs(),
  Ps = new R(1, 0, 0),
  Un = new R(0, 1, 0),
  Is = new R(0, 0, 1),
  co = new R(),
  ks = new R(),
  As = new R();
class Yh extends Ot {
  constructor() {
    super(), this.isTransformControlsGizmo = !0, this.type = "TransformControlsGizmo";
    const e = new ct({
        depthTest: !1,
        depthWrite: !1,
        fog: !1,
        toneMapped: !1,
        transparent: !0
      }),
      t = new Sn({
        depthTest: !1,
        depthWrite: !1,
        fog: !1,
        toneMapped: !1,
        transparent: !0
      }),
      n = e.clone();
    n.opacity = 0.15;
    const s = t.clone();
    s.opacity = 0.5;
    const r = e.clone();
    r.color.setHex(16711680);
    const i = e.clone();
    i.color.setHex(65280);
    const a = e.clone();
    a.color.setHex(255);
    const l = e.clone();
    l.color.setHex(16711680), l.opacity = 0.5;
    const d = e.clone();
    d.color.setHex(65280), d.opacity = 0.5;
    const u = e.clone();
    u.color.setHex(255), u.opacity = 0.5;
    const h = e.clone();
    h.opacity = 0.25;
    const m = e.clone();
    m.color.setHex(16776960), m.opacity = 0.25, e.clone().color.setHex(16776960);
    const p = e.clone();
    p.color.setHex(7895160);
    const x = new ye(0, 0.04, 0.1, 12);
    x.translate(0, 0.05, 0);
    const g = new Pe(0.08, 0.08, 0.08);
    g.translate(0, 0.04, 0);
    const b = new Pt();
    b.setAttribute("position", new Do([0, 0, 0, 1, 0, 0], 3));
    const w = new ye(0.0075, 0.0075, 0.5, 3);
    w.translate(0, 0.25, 0);
    function v(U, ne) {
      const ae = new It(U, 0.0075, 3, 64, ne * Math.PI * 2);
      return ae.rotateY(Math.PI / 2), ae.rotateX(Math.PI / 2), ae;
    }
    function E() {
      const U = new Pt();
      return U.setAttribute("position", new Do([0, 0, 0, 1, 1, 1], 3)), U;
    }
    const T = {
        X: [[new z(x, r), [0.5, 0, 0], [0, 0, -Math.PI / 2]], [new z(x, r), [-0.5, 0, 0], [0, 0, Math.PI / 2]], [new z(w, r), [0, 0, 0], [0, 0, -Math.PI / 2]]],
        Y: [[new z(x, i), [0, 0.5, 0]], [new z(x, i), [0, -0.5, 0], [Math.PI, 0, 0]], [new z(w, i)]],
        Z: [[new z(x, a), [0, 0, 0.5], [Math.PI / 2, 0, 0]], [new z(x, a), [0, 0, -0.5], [-Math.PI / 2, 0, 0]], [new z(w, a), null, [Math.PI / 2, 0, 0]]],
        XYZ: [[new z(new ro(0.1, 0), h.clone()), [0, 0, 0]]],
        XY: [[new z(new Pe(0.15, 0.15, 0.01), u.clone()), [0.15, 0.15, 0]]],
        YZ: [[new z(new Pe(0.15, 0.15, 0.01), l.clone()), [0, 0.15, 0.15], [0, Math.PI / 2, 0]]],
        XZ: [[new z(new Pe(0.15, 0.15, 0.01), d.clone()), [0.15, 0, 0.15], [-Math.PI / 2, 0, 0]]]
      },
      P = {
        X: [[new z(new ye(0.2, 0, 0.6, 4), n), [0.3, 0, 0], [0, 0, -Math.PI / 2]], [new z(new ye(0.2, 0, 0.6, 4), n), [-0.3, 0, 0], [0, 0, Math.PI / 2]]],
        Y: [[new z(new ye(0.2, 0, 0.6, 4), n), [0, 0.3, 0]], [new z(new ye(0.2, 0, 0.6, 4), n), [0, -0.3, 0], [0, 0, Math.PI]]],
        Z: [[new z(new ye(0.2, 0, 0.6, 4), n), [0, 0, 0.3], [Math.PI / 2, 0, 0]], [new z(new ye(0.2, 0, 0.6, 4), n), [0, 0, -0.3], [-Math.PI / 2, 0, 0]]],
        XYZ: [[new z(new ro(0.2, 0), n)]],
        XY: [[new z(new Pe(0.2, 0.2, 0.01), n), [0.15, 0.15, 0]]],
        YZ: [[new z(new Pe(0.2, 0.2, 0.01), n), [0, 0.15, 0.15], [0, Math.PI / 2, 0]]],
        XZ: [[new z(new Pe(0.2, 0.2, 0.01), n), [0.15, 0, 0.15], [-Math.PI / 2, 0, 0]]]
      },
      C = {
        START: [[new z(new ro(0.01, 2), s), null, null, null, "helper"]],
        END: [[new z(new ro(0.01, 2), s), null, null, null, "helper"]],
        DELTA: [[new _t(E(), s), null, null, null, "helper"]],
        X: [[new _t(b, s.clone()), [-1e3, 0, 0], null, [1e6, 1, 1], "helper"]],
        Y: [[new _t(b, s.clone()), [0, -1e3, 0], [0, 0, Math.PI / 2], [1e6, 1, 1], "helper"]],
        Z: [[new _t(b, s.clone()), [0, 0, -1e3], [0, -Math.PI / 2, 0], [1e6, 1, 1], "helper"]]
      },
      M = {
        XYZE: [[new z(v(0.5, 1), p), null, [0, Math.PI / 2, 0]]],
        X: [[new z(v(0.5, 0.5), r)]],
        Y: [[new z(v(0.5, 0.5), i), null, [0, 0, -Math.PI / 2]]],
        Z: [[new z(v(0.5, 0.5), a), null, [0, Math.PI / 2, 0]]],
        E: [[new z(v(0.75, 1), m), null, [0, Math.PI / 2, 0]]]
      },
      y = {
        AXIS: [[new _t(b, s.clone()), [-1e3, 0, 0], null, [1e6, 1, 1], "helper"]]
      },
      I = {
        XYZE: [[new z(new St(0.25, 10, 8), n)]],
        X: [[new z(new It(0.5, 0.1, 4, 24), n), [0, 0, 0], [0, -Math.PI / 2, -Math.PI / 2]]],
        Y: [[new z(new It(0.5, 0.1, 4, 24), n), [0, 0, 0], [Math.PI / 2, 0, 0]]],
        Z: [[new z(new It(0.5, 0.1, 4, 24), n), [0, 0, 0], [0, 0, -Math.PI / 2]]],
        E: [[new z(new It(0.75, 0.1, 2, 24), n)]]
      },
      j = {
        X: [[new z(g, r), [0.5, 0, 0], [0, 0, -Math.PI / 2]], [new z(w, r), [0, 0, 0], [0, 0, -Math.PI / 2]], [new z(g, r), [-0.5, 0, 0], [0, 0, Math.PI / 2]]],
        Y: [[new z(g, i), [0, 0.5, 0]], [new z(w, i)], [new z(g, i), [0, -0.5, 0], [0, 0, Math.PI]]],
        Z: [[new z(g, a), [0, 0, 0.5], [Math.PI / 2, 0, 0]], [new z(w, a), [0, 0, 0], [Math.PI / 2, 0, 0]], [new z(g, a), [0, 0, -0.5], [-Math.PI / 2, 0, 0]]],
        XY: [[new z(new Pe(0.15, 0.15, 0.01), u), [0.15, 0.15, 0]]],
        YZ: [[new z(new Pe(0.15, 0.15, 0.01), l), [0, 0.15, 0.15], [0, Math.PI / 2, 0]]],
        XZ: [[new z(new Pe(0.15, 0.15, 0.01), d), [0.15, 0, 0.15], [-Math.PI / 2, 0, 0]]],
        XYZ: [[new z(new Pe(0.1, 0.1, 0.1), h.clone())]]
      },
      D = {
        X: [[new z(new ye(0.2, 0, 0.6, 4), n), [0.3, 0, 0], [0, 0, -Math.PI / 2]], [new z(new ye(0.2, 0, 0.6, 4), n), [-0.3, 0, 0], [0, 0, Math.PI / 2]]],
        Y: [[new z(new ye(0.2, 0, 0.6, 4), n), [0, 0.3, 0]], [new z(new ye(0.2, 0, 0.6, 4), n), [0, -0.3, 0], [0, 0, Math.PI]]],
        Z: [[new z(new ye(0.2, 0, 0.6, 4), n), [0, 0, 0.3], [Math.PI / 2, 0, 0]], [new z(new ye(0.2, 0, 0.6, 4), n), [0, 0, -0.3], [-Math.PI / 2, 0, 0]]],
        XY: [[new z(new Pe(0.2, 0.2, 0.01), n), [0.15, 0.15, 0]]],
        YZ: [[new z(new Pe(0.2, 0.2, 0.01), n), [0, 0.15, 0.15], [0, Math.PI / 2, 0]]],
        XZ: [[new z(new Pe(0.2, 0.2, 0.01), n), [0.15, 0, 0.15], [-Math.PI / 2, 0, 0]]],
        XYZ: [[new z(new Pe(0.2, 0.2, 0.2), n), [0, 0, 0]]]
      },
      H = {
        X: [[new _t(b, s.clone()), [-1e3, 0, 0], null, [1e6, 1, 1], "helper"]],
        Y: [[new _t(b, s.clone()), [0, -1e3, 0], [0, 0, Math.PI / 2], [1e6, 1, 1], "helper"]],
        Z: [[new _t(b, s.clone()), [0, 0, -1e3], [0, -Math.PI / 2, 0], [1e6, 1, 1], "helper"]]
      };
    function F(U) {
      const ne = new Ot();
      for (const ae in U) for (let He = U[ae].length; He--;) {
        const ce = U[ae][He][0].clone(),
          Re = U[ae][He][1],
          ot = U[ae][He][2],
          Ke = U[ae][He][3],
          rt = U[ae][He][4];
        ce.name = ae, ce.tag = rt, Re && ce.position.set(Re[0], Re[1], Re[2]), ot && ce.rotation.set(ot[0], ot[1], ot[2]), Ke && ce.scale.set(Ke[0], Ke[1], Ke[2]), ce.updateMatrix();
        const De = ce.geometry.clone();
        De.applyMatrix4(ce.matrix), ce.geometry = De, ce.renderOrder = 1 / 0, ce.position.set(0, 0, 0), ce.rotation.set(0, 0, 0), ce.scale.set(1, 1, 1), ne.add(ce);
      }
      return ne;
    }
    this.gizmo = {}, this.picker = {}, this.helper = {}, this.add(this.gizmo.translate = F(T)), this.add(this.gizmo.rotate = F(M)), this.add(this.gizmo.scale = F(j)), this.add(this.picker.translate = F(P)), this.add(this.picker.rotate = F(I)), this.add(this.picker.scale = F(D)), this.add(this.helper.translate = F(C)), this.add(this.helper.rotate = F(y)), this.add(this.helper.scale = F(H)), this.picker.translate.visible = !1, this.picker.rotate.visible = !1, this.picker.scale.visible = !1;
  }
  updateMatrixWorld(e) {
    const n = (this.mode === "scale" ? "local" : this.space) === "local" ? this.worldQuaternion : Co;
    this.gizmo.translate.visible = this.mode === "translate", this.gizmo.rotate.visible = this.mode === "rotate", this.gizmo.scale.visible = this.mode === "scale", this.helper.translate.visible = this.mode === "translate", this.helper.rotate.visible = this.mode === "rotate", this.helper.scale.visible = this.mode === "scale";
    let s = [];
    s = s.concat(this.picker[this.mode].children), s = s.concat(this.gizmo[this.mode].children), s = s.concat(this.helper[this.mode].children);
    for (let r = 0; r < s.length; r++) {
      const i = s[r];
      i.visible = !0, i.rotation.set(0, 0, 0), i.position.copy(this.worldPosition);
      let a;
      if (this.camera.isOrthographicCamera ? a = (this.camera.top - this.camera.bottom) / this.camera.zoom : a = this.worldPosition.distanceTo(this.cameraPosition) * Math.min(1.9 * Math.tan(Math.PI * this.camera.fov / 360) / this.camera.zoom, 7), i.scale.set(1, 1, 1).multiplyScalar(a * this.size / 4), i.tag === "helper") {
        i.visible = !1, i.name === "AXIS" ? (i.visible = !!this.axis, this.axis === "X" && (ze.setFromEuler(ao.set(0, 0, 0)), i.quaternion.copy(n).multiply(ze), Math.abs(Te.copy(Ps).applyQuaternion(n).dot(this.eye)) > 0.9 && (i.visible = !1)), this.axis === "Y" && (ze.setFromEuler(ao.set(0, 0, Math.PI / 2)), i.quaternion.copy(n).multiply(ze), Math.abs(Te.copy(Un).applyQuaternion(n).dot(this.eye)) > 0.9 && (i.visible = !1)), this.axis === "Z" && (ze.setFromEuler(ao.set(0, Math.PI / 2, 0)), i.quaternion.copy(n).multiply(ze), Math.abs(Te.copy(Is).applyQuaternion(n).dot(this.eye)) > 0.9 && (i.visible = !1)), this.axis === "XYZE" && (ze.setFromEuler(ao.set(0, Math.PI / 2, 0)), Te.copy(this.rotationAxis), i.quaternion.setFromRotationMatrix(Wa.lookAt(Xa, Te, Un)), i.quaternion.multiply(ze), i.visible = this.dragging), this.axis === "E" && (i.visible = !1)) : i.name === "START" ? (i.position.copy(this.worldPositionStart), i.visible = this.dragging) : i.name === "END" ? (i.position.copy(this.worldPosition), i.visible = this.dragging) : i.name === "DELTA" ? (i.position.copy(this.worldPositionStart), i.quaternion.copy(this.worldQuaternionStart), mt.set(1e-10, 1e-10, 1e-10).add(this.worldPositionStart).sub(this.worldPosition).multiplyScalar(-1), mt.applyQuaternion(this.worldQuaternionStart.clone().invert()), i.scale.copy(mt), i.visible = this.dragging) : (i.quaternion.copy(n), this.dragging ? i.position.copy(this.worldPositionStart) : i.position.copy(this.worldPosition), this.axis && (i.visible = this.axis.search(i.name) !== -1));
        continue;
      }
      i.quaternion.copy(n), this.mode === "translate" || this.mode === "scale" ? (i.name === "X" && Math.abs(Te.copy(Ps).applyQuaternion(n).dot(this.eye)) > 0.99 && (i.scale.set(1e-10, 1e-10, 1e-10), i.visible = !1), i.name === "Y" && Math.abs(Te.copy(Un).applyQuaternion(n).dot(this.eye)) > 0.99 && (i.scale.set(1e-10, 1e-10, 1e-10), i.visible = !1), i.name === "Z" && Math.abs(Te.copy(Is).applyQuaternion(n).dot(this.eye)) > 0.99 && (i.scale.set(1e-10, 1e-10, 1e-10), i.visible = !1), i.name === "XY" && Math.abs(Te.copy(Is).applyQuaternion(n).dot(this.eye)) < 0.2 && (i.scale.set(1e-10, 1e-10, 1e-10), i.visible = !1), i.name === "YZ" && Math.abs(Te.copy(Ps).applyQuaternion(n).dot(this.eye)) < 0.2 && (i.scale.set(1e-10, 1e-10, 1e-10), i.visible = !1), i.name === "XZ" && Math.abs(Te.copy(Un).applyQuaternion(n).dot(this.eye)) < 0.2 && (i.scale.set(1e-10, 1e-10, 1e-10), i.visible = !1)) : this.mode === "rotate" && (lo.copy(n), Te.copy(this.eye).applyQuaternion(ze.copy(n).invert()), i.name.search("E") !== -1 && i.quaternion.setFromRotationMatrix(Wa.lookAt(this.eye, Xa, Un)), i.name === "X" && (ze.setFromAxisAngle(Ps, Math.atan2(-Te.y, Te.z)), ze.multiplyQuaternions(lo, ze), i.quaternion.copy(ze)), i.name === "Y" && (ze.setFromAxisAngle(Un, Math.atan2(Te.x, Te.z)), ze.multiplyQuaternions(lo, ze), i.quaternion.copy(ze)), i.name === "Z" && (ze.setFromAxisAngle(Is, Math.atan2(Te.y, Te.x)), ze.multiplyQuaternions(lo, ze), i.quaternion.copy(ze))), i.visible = i.visible && (i.name.indexOf("X") === -1 || this.showX), i.visible = i.visible && (i.name.indexOf("Y") === -1 || this.showY), i.visible = i.visible && (i.name.indexOf("Z") === -1 || this.showZ), i.visible = i.visible && (i.name.indexOf("E") === -1 || this.showX && this.showY && this.showZ), i.material._color = i.material._color || i.material.color.clone(), i.material._opacity = i.material._opacity || i.material.opacity, i.material.color.copy(i.material._color), i.material.opacity = i.material._opacity, this.enabled && this.axis && (i.name === this.axis || this.axis.split("").some(function (l) {
        return i.name === l;
      })) && (i.material.color.setHex(16776960), i.material.opacity = 1);
    }
    super.updateMatrixWorld(e);
  }
}
class Xh extends z {
  constructor() {
    super(new Lo(1e5, 1e5, 2, 2), new ct({
      visible: !1,
      wireframe: !0,
      side: zo,
      transparent: !0,
      opacity: 0.1,
      toneMapped: !1
    })), this.isTransformControlsPlane = !0, this.type = "TransformControlsPlane";
  }
  updateMatrixWorld(e) {
    let t = this.space;
    switch (this.position.copy(this.worldPosition), this.mode === "scale" && (t = "local"), co.copy(Ps).applyQuaternion(t === "local" ? this.worldQuaternion : Co), ks.copy(Un).applyQuaternion(t === "local" ? this.worldQuaternion : Co), As.copy(Is).applyQuaternion(t === "local" ? this.worldQuaternion : Co), Te.copy(ks), this.mode) {
      case "translate":
      case "scale":
        switch (this.axis) {
          case "X":
            Te.copy(this.eye).cross(co), Yt.copy(co).cross(Te);
            break;
          case "Y":
            Te.copy(this.eye).cross(ks), Yt.copy(ks).cross(Te);
            break;
          case "Z":
            Te.copy(this.eye).cross(As), Yt.copy(As).cross(Te);
            break;
          case "XY":
            Yt.copy(As);
            break;
          case "YZ":
            Yt.copy(co);
            break;
          case "XZ":
            Te.copy(As), Yt.copy(ks);
            break;
          case "XYZ":
          case "E":
            Yt.set(0, 0, 0);
            break;
        }
        break;
      case "rotate":
      default:
        Yt.set(0, 0, 0);
    }
    Yt.length() === 0 ? this.quaternion.copy(this.cameraQuaternion) : (Qa.lookAt(mt.set(0, 0, 0), Yt, Te), this.quaternion.setFromRotationMatrix(Qa)), super.updateMatrixWorld(e);
  }
}
const Oe = o => new R(o.x, o.y, o.z),
  Xt = o => ({
    x: o.x,
    y: o.y,
    z: o.z
  });
function Tc(o, e) {
  const t = o.length,
    n = [];
  if (t < 2) return n;
  const s = e ? t : t - 1;
  for (let r = 0; r < s; r++) {
    const i = o[r],
      a = o[(r + 1) % t],
      l = Oe(i.position),
      d = Oe(a.position),
      u = l.clone().add(Oe(i.out)),
      h = d.clone().add(Oe(a.in));
    n.push(new Tu(l, u, h, d));
  }
  return n;
}
function wr(o, e, t) {
  const n = Math.min(e.length, t.length);
  if (n === 0) return 0;
  if (n === 1 || o <= e[0]) return t[0];
  if (o >= e[n - 1]) return t[n - 1];
  for (let s = 0; s < n - 1; s++) if (o <= e[s + 1]) {
    const r = e[s + 1] - e[s];
    if (r < 1e-9) continue;
    const i = (o - e[s]) / r;
    return t[s] + i * (t[s + 1] - t[s]);
  }
  return t[n - 1];
}
const yr = {
  linear: o => o,
  easeIn: o => o * o,
  easeOut: o => 1 - (1 - o) * (1 - o),
  easeInOut: o => o < 0.5 ? 4 * o * o * o : 1 - Math.pow(-2 * o + 2, 3) / 2,
  smoothstep: o => o * o * (3 - 2 * o)
};
class Wh {
  constructor(e, t = !1) {
    S(this, "curve");
    S(this, "single");
    S(this, "frames");
    S(this, "segCount", 0);
    S(this, "tilts");
    S(this, "pointUs", [0]);
    S(this, "pointKs", [0]);
    S(this, "fovUs", []);
    S(this, "fovVals", []);
    if (this.curve = new Pu(), this.tilts = e.map(d => d.tilt ?? 0), e.length < 2) {
      this.single = e.length === 1 ? Oe(e[0].position) : new R();
      return;
    }
    const n = e.length,
      s = Tc(e, t);
    for (const d of s) this.curve.add(d);
    const r = s.length;
    if (this.segCount = r, t && this.tilts.push(e[0].tilt ?? 0), this.curve.getLength() < 1e-6) {
      this.single = Oe(e[0].position);
      return;
    }
    const i = this.curve.getCurveLengths(),
      a = i[i.length - 1] || 1;
    this.pointUs = [0, ...i.map(d => d / a)];
    const l = this.timeKsOf(e, t);
    if (l) this.pointKs = l;else {
      const d = m => ke.clamp(e[m % n].speed ?? 1, 0.1, 5),
        u = [];
      for (let m = 0; m < r; m++) {
        const f = i[m] - (i[m - 1] ?? 0);
        u.push(f / ((d(m) + d(m + 1)) / 2));
      }
      const h = u.reduce((m, f) => m + f, 0);
      if (h > 1e-9) {
        let m = 0;
        this.pointKs = [0, ...u.map(f => (m += f) / h)];
      } else this.pointKs = [...this.pointUs];
    }
    for (let d = 0; d < n; d++) {
      const u = e[d].fov;
      u != null && d < this.pointUs.length && (this.fovUs.push(this.pointUs[d]), this.fovVals.push(u));
    }
    t && e[0].fov != null && (this.fovUs.push(1), this.fovVals.push(e[0].fov));
  }
  get isDegenerate() {
    return !!this.single;
  }
  timeKsOf(e, t) {
    if (t || e.length < 2) return null;
    const n = [];
    for (const i of e) {
      if (i.timeK == null || !Number.isFinite(i.timeK)) return null;
      n.push(i.timeK);
    }
    for (let i = 1; i < n.length; i++) if (n[i] <= n[i - 1]) return null;
    const s = n[0],
      r = n[n.length - 1] - s;
    return r < 1e-9 ? null : n.map(i => (i - s) / r);
  }
  get length() {
    return this.single ? 0 : this.curve.getLength();
  }
  pointTime(e) {
    return this.pointKs[Math.min(Math.max(e, 0), this.pointKs.length - 1)] ?? 0;
  }
  timeToU(e) {
    if (this.single || this.pointKs.length < 2) return 0;
    const t = ke.clamp(e, 0, 1);
    return wr(t, this.pointKs, this.pointUs);
  }
  fovAt(e) {
    return this.fovUs.length === 0 ? null : wr(ke.clamp(e, 0, 1), this.fovUs, this.fovVals);
  }
  positionAt(e) {
    if (this.single) return this.single.clone();
    const t = ke.clamp(e, 0, 1);
    return this.curve.getPointAt(t);
  }
  frameAt(e) {
    if (this.single) return {
      position: this.single.clone(),
      tangent: new R(0, 0, -1),
      up: new R(0, 1, 0)
    };
    const t = ke.clamp(e, 0, 1),
      n = this.curve.getPointAt(t),
      s = this.curve.getTangentAt(t).normalize(),
      r = this.upAt(t, s),
      i = this.tiltAt(t);
    return i !== 0 && r.applyAxisAngle(s, i), {
      position: n,
      tangent: s,
      up: r
    };
  }
  upAt(e, t) {
    if (!this.frames) try {
      this.frames = this.curve.computeFrenetFrames(Math.max(8, this.segCount * 12), !1);
    } catch {
      this.frames = void 0;
    }
    if (this.frames && this.frames.normals.length > 0) {
      const r = this.frames.normals.length - 1,
        i = Math.round(ke.clamp(e, 0, 1) * r),
        a = this.frames.normals[Math.min(i, r)],
        l = this.frames.binormals[Math.min(i, r)];
      if (l && l.lengthSq() > 1e-6) return l.clone().normalize();
      if (a && a.lengthSq() > 1e-6) return a.clone().normalize();
    }
    const n = new R(0, 1, 0),
      s = new R().crossVectors(t, n);
    return s.lengthSq() < 1e-6 ? new R(0, 0, 1) : new R().crossVectors(s.normalize(), t).normalize();
  }
  tiltAt(e) {
    if (this.tilts.length < 2) return this.tilts[0] ?? 0;
    if (this.pointUs.length !== this.tilts.length) {
      const t = this.tilts.length - 1,
        n = ke.clamp(e, 0, 1) * t,
        s = Math.min(Math.floor(n), t - 1),
        r = n - s;
      return this.tilts[s] * (1 - r) + this.tilts[s + 1] * r;
    }
    return wr(ke.clamp(e, 0, 1), this.pointUs, this.tilts);
  }
  sampleLine(e = 120) {
    return this.single ? [this.single.clone(), this.single.clone()] : this.curve.getSpacedPoints(e);
  }
}
function Pc(o, e = !1) {
  return new Wh(o, e);
}
function Vo(o, e, t) {
  const n = document.createElement("canvas"),
    s = n.getContext("2d");
  if (!s) return null;
  const r = Math.max(12, e),
    i = `bold ${r}px "PingFang SC", "Microsoft YaHei", sans-serif`;
  s.font = i, n.width = Math.ceil(s.measureText(o).width + 0.4 * r * 2), n.height = Math.ceil(1.5 * r);
  const a = 0.3 * r,
    l = n.width,
    d = n.height;
  s.fillStyle = "rgba(0,0,0,0.55)", s.beginPath(), s.moveTo(a, 0), s.lineTo(l - a, 0), s.quadraticCurveTo(l, 0, l, a), s.lineTo(l, d - a), s.quadraticCurveTo(l, d, l - a, d), s.lineTo(a, d), s.quadraticCurveTo(0, d, 0, d - a), s.lineTo(0, a), s.quadraticCurveTo(0, 0, a, 0), s.fill(), s.font = i, s.fillStyle = t, s.textAlign = "center", s.textBaseline = "middle", s.fillText(o, l / 2, d / 2);
  const u = new Iu(n);
  u.needsUpdate = !0;
  const h = new Nu(new Ru({
    map: u,
    transparent: !0,
    depthTest: !1
  }));
  return h.__aspect = l / d, h;
}
function Ic(o, e) {
  var n;
  const t = o.children.find(s => {
    var r;
    return (r = s.userData) == null ? void 0 : r[e];
  });
  if (t) {
    const s = t.material;
    (n = s.map) == null || n.dispose(), s.dispose(), o.remove(t);
  }
}
function Qh(o, e, t = 18) {
  const n = typeof o.userData.headY == "number" ? o.userData.headY : 0,
    s = e ? `${e}
${t}
${n.toFixed(3)}` : "",
    r = o.children.some(l => {
      var d;
      return (d = l.userData) == null ? void 0 : d.isLabel;
    });
  if (o.userData.currentLabelKey === s && (s === "" || r) || (Ic(o, "isLabel"), o.userData.currentLabelKey = s, !e)) return;
  const i = Vo(e, t, "#ffffff");
  if (!i) return;
  const a = Math.max(0.16, Math.min(0.58, Math.max(14, t) / 100));
  i.scale.set(i.__aspect * a, a, 1), i.position.set(0, n + 0.14, 0), i.userData.isLabel = !0, o.add(i);
}
function Zh(o, e, t = 14) {
  if (Ic(o, "isCameraLabel"), !e) return;
  const n = Vo(e, t, "#aaddff");
  if (!n) return;
  const s = Math.max(0.14, Math.min(0.5, Math.max(12, t) / 100));
  n.scale.set(n.__aspect * s, s, 1), n.position.set(0, 0.48, 0), n.userData.isCameraLabel = !0, o.add(n);
}
const Nc = 32,
  Za = 12,
  uo = 6,
  ho = {
    dark: 16777215,
    light: 0
  },
  po = 16347926,
  Jh = 2282478,
  ep = 16436245,
  tp = 8248575,
  np = 10265519,
  Ja = 16020150,
  cs = o => ({
    x: o.x,
    y: o.y,
    z: o.z
  }),
  vr = o => o.map(e => ({
    ...e,
    position: cs(e.position),
    in: cs(e.in),
    out: cs(e.out),
    tilt: e.tilt ?? 0
  }));
function Rc(o, e) {
  return 2 * Math.tan(o.fov * Math.PI / 360) / e;
}
function Ns(o, e, t, n, s) {
  const r = n.getBoundingClientRect();
  e.x = (t.clientX - r.left) / r.width * 2 - 1, e.y = -((t.clientY - r.top) / r.height) * 2 + 1, o.setFromCamera(e, s);
}
function Dc(o, e = Nc, t = !1) {
  const n = [],
    s = Tc(o, t);
  for (let r = 0; r < s.length; r++) {
    const i = s[r],
      a = r === 0 ? 0 : 1;
    for (let l = a; l <= e; l++) {
      const d = l / e;
      n.push({
        seg: r,
        t: d,
        pos: i.getPoint(d)
      });
    }
  }
  return n;
}
class sp {
  constructor(e) {
    S(this, "host");
    S(this, "theme", "dark");
    S(this, "raycaster", new Ti());
    S(this, "pointer", new yt());
    S(this, "takeId", null);
    S(this, "points", []);
    S(this, "closed", !1);
    S(this, "lastEmitted", null);
    S(this, "selectedIdx", null);
    S(this, "_dragKind", null);
    S(this, "pointHandles", []);
    S(this, "inHandle", null);
    S(this, "outHandle", null);
    S(this, "tangentLine", null);
    S(this, "curveLine", null);
    S(this, "lookAt", null);
    S(this, "lookAtHandle", null);
    S(this, "lookAtSelected", !1);
    S(this, "sampleCache", []);
    S(this, "anchor", null);
    S(this, "altHeld", !1);
    S(this, "onKeyDown", e => {
      e.key === "Alt" && (this.altHeld = !0);
    });
    S(this, "onKeyUp", e => {
      e.key === "Alt" && (this.altHeld = !1);
    });
    S(this, "onBlur", () => {
      this.altHeld = !1;
    });
    S(this, "_tmpVec", new R());
    this.host = e;
  }
  get active() {
    return this.takeId != null;
  }
  get activeTakeId() {
    return this.takeId;
  }
  get hasSelection() {
    return this.selectedIdx != null || this.lookAtSelected;
  }
  get lookAtIsSelected() {
    return this.lookAtSelected;
  }
  get ownsGizmo() {
    return this._dragKind != null && this.anchor != null && this.host.gizmo.object === this.anchor;
  }
  setTheme(e) {
    this.theme = e, this.pointHandles.forEach((t, n) => {
      n !== this.selectedIdx && t.material.color.setHex(ho[e]);
    });
  }
  enter(e, t, n = !1, s = null) {
    this.takeId && this.exit(), this.takeId = e, this.closed = n, this.lookAt = s ? cs(s) : null, this.points = vr(t), this.lastEmitted = t, this.host.detachMainGizmo(), this.buildVisuals(), window.addEventListener("keydown", this.onKeyDown), window.addEventListener("keyup", this.onKeyUp), window.addEventListener("blur", this.onBlur);
  }
  exit() {
    this.takeId && (this.clearSelection(), this.disposeObj(this.curveLine), this.curveLine = null, this.pointHandles.forEach(e => this.disposeObj(e)), this.pointHandles = [], this.disposeLookAtHandle(), this.lookAt = null, this.sampleCache = [], this.takeId = null, this.points = [], this.closed = !1, this.lastEmitted = null, this.altHeld = !1, window.removeEventListener("keydown", this.onKeyDown), window.removeEventListener("keyup", this.onKeyUp), window.removeEventListener("blur", this.onBlur));
  }
  syncFromStore(e, t) {
    if (!this.takeId) return !1;
    if (t !== void 0 && this.setLookAt(t), e === this.lastEmitted) return !0;
    if (!e || e.length === 0) return this.exit(), !1;
    const n = this.selectedIdx;
    return this.points = vr(e), this.lastEmitted = e, this.clearSelection(), this.rebuildPointHandles(), this.rebuildCurve(), n != null && this.selectPoint(Math.min(n, this.points.length - 1)), !0;
  }
  setClosed(e) {
    !this.takeId || this.closed === e || (this.closed = e, this.rebuildCurve());
  }
  buildVisuals() {
    this.curveLine = new _t(new Pt(), new Sn({
      color: tp,
      transparent: !0,
      opacity: 0.85,
      depthTest: !1
    })), this.curveLine.renderOrder = 998, this.curveLine.userData._isHelper = !0, this.curveLine.userData._isCamPathHandle = !0, this.host.scene.add(this.curveLine), this.rebuildPointHandles(), this.rebuildLookAtHandle(), this.rebuildCurve();
  }
  rebuildLookAtHandle() {
    if (this.disposeLookAtHandle(), !this.lookAt) return;
    const e = this.makeHandle(this.lookAtSelected ? po : Ja, "lookAt", -1),
      t = Vo(Se("pp.campath_look_point"), 28, "#ffd7ef");
    t && (t.scale.set(t.__aspect * 3.4, 3.4, 1), t.position.set(0, 3.2, 0), t.renderOrder = 999, t.userData._isHelper = !0, e.add(t)), this.lookAtHandle = e;
  }
  disposeLookAtHandle() {
    var n;
    const e = this.lookAtHandle;
    if (!e) return;
    const t = e.children.find(s => s.isSprite);
    t && ((n = t.material.map) == null || n.dispose(), t.material.dispose()), this.disposeObj(e), this.lookAtHandle = null;
  }
  setLookAt(e) {
    var n, s;
    const t = !!this.lookAt;
    if (this.lookAt = e ? cs(e) : null, !this.lookAt) {
      if (t) {
        const r = this.lookAtSelected;
        this._dragKind === "lookAt" && this.detachGizmo(), this.clearLookAtSelection(), this.disposeLookAtHandle(), r && ((s = (n = this.host).onCamPathPointSelect) == null || s.call(n, null));
      }
      return;
    }
    (!t || !this.lookAtHandle) && this.rebuildLookAtHandle(), this._dragKind === "lookAt" && this.anchor && this.anchor.position.set(this.lookAt.x, this.lookAt.y, this.lookAt.z);
  }
  makeHandle(e, t, n) {
    const s = new z(new St(1, 16, 12), new ct({
      color: e,
      depthTest: !1,
      transparent: !0,
      opacity: 0.9
    }));
    return s.renderOrder = 999, s.userData._isHelper = !0, s.userData._isCamPathHandle = !0, s.userData.pathKind = t, s.userData.pathIdx = n, this.host.scene.add(s), s;
  }
  disposeObj(e) {
    e && (this.host.scene.remove(e), e.geometry.dispose(), e.material.dispose());
  }
  rebuildPointHandles() {
    this.pointHandles.forEach(e => this.disposeObj(e)), this.pointHandles = this.points.map((e, t) => this.makeHandle(t === this.selectedIdx ? po : ho[this.theme], "point", t));
  }
  rebuildCurve() {
    if (!this.curveLine) return;
    this.sampleCache = this.points.length >= 2 ? Dc(this.points, Nc, this.closed) : [];
    const e = this.sampleCache.map(t => t.pos);
    this.curveLine.visible = e.length >= 2, this.curveLine.geometry.setFromPoints(e);
  }
  updateHandleScales(e) {
    if (!this.takeId) return;
    const t = this.host.dom.clientHeight || 600,
      n = Rc(e, t),
      s = this._tmpVec,
      r = (a, l, d) => {
        if (!a) return;
        a.position.copy(l);
        const u = e.position.distanceTo(l);
        a.scale.setScalar(d * u * n);
      };
    this.pointHandles.forEach((a, l) => {
      const d = this.points[l];
      d && r(a, s.set(d.position.x, d.position.y, d.position.z), uo);
    }), this.lookAtHandle && this.lookAt && r(this.lookAtHandle, s.set(this.lookAt.x, this.lookAt.y, this.lookAt.z), uo);
    const i = this.selectedIdx != null ? this.points[this.selectedIdx] : null;
    i && (r(this.inHandle, s.set(i.position.x + i.in.x, i.position.y + i.in.y, i.position.z + i.in.z), uo * 0.8), r(this.outHandle, s.set(i.position.x + i.out.x, i.position.y + i.out.y, i.position.z + i.out.z), uo * 0.8));
  }
  refreshTangentVisuals() {
    const e = this.selectedIdx;
    if (e == null) return;
    const t = this.points[e];
    if (!t) return;
    this.inHandle || (this.inHandle = this.makeHandle(Jh, "in", e)), this.outHandle || (this.outHandle = this.makeHandle(ep, "out", e)), this.inHandle.userData.pathIdx = e, this.outHandle.userData.pathIdx = e;
    const n = Oe(t.position),
      s = n.clone().add(Oe(t.in)),
      r = n.clone().add(Oe(t.out));
    this.tangentLine || (this.tangentLine = new _t(new Pt(), new Sn({
      color: np,
      transparent: !0,
      opacity: 0.7,
      depthTest: !1
    })), this.tangentLine.renderOrder = 998, this.tangentLine.userData._isHelper = !0, this.tangentLine.userData._isCamPathHandle = !0, this.host.scene.add(this.tangentLine)), this.tangentLine.geometry.setFromPoints([s, n, r]);
  }
  pickHandle(e) {
    if (!this.takeId) return null;
    Ns(this.raycaster, this.pointer, e, this.host.dom, this.host.camera);
    const t = [this.inHandle, this.outHandle].filter(Boolean);
    if (t.length) {
      const s = this.raycaster.intersectObjects(t, !1)[0];
      if (s) return {
        kind: s.object.userData.pathKind,
        idx: s.object.userData.pathIdx
      };
    }
    const n = this.raycaster.intersectObjects(this.pointHandles, !1)[0];
    return n ? {
      kind: "point",
      idx: n.object.userData.pathIdx
    } : this.lookAtHandle && this.raycaster.intersectObject(this.lookAtHandle, !1)[0] ? {
      kind: "lookAt",
      idx: -1
    } : null;
  }
  selectHandle(e) {
    e.kind === "point" ? this.selectPoint(e.idx) : e.kind === "lookAt" ? this.selectLookAt() : e.idx === this.selectedIdx && this.attachGizmoTo(e.kind, e.idx);
  }
  selectLookAt() {
    if (!(!this.lookAtHandle || !this.lookAt)) {
      if (this.lookAtSelected) {
        this._dragKind !== "lookAt" && this.attachGizmoTo("lookAt", -1);
        return;
      }
      this.clearSelection(), this.lookAtSelected = !0, this.lookAtHandle.material.color.setHex(po), this.attachGizmoTo("lookAt", -1);
    }
  }
  clearLookAtSelection() {
    this.lookAtSelected && (this.lookAtSelected = !1, this.lookAtHandle && this.lookAtHandle.material.color.setHex(Ja));
  }
  selectPoint(e) {
    var t, n;
    if (!(e < 0 || e >= this.points.length)) {
      if (this.clearLookAtSelection(), e === this.selectedIdx) {
        this._dragKind !== "point" && this.attachGizmoTo("point", e);
        return;
      }
      this.selectedIdx != null && this.pointHandles[this.selectedIdx] && this.pointHandles[this.selectedIdx].material.color.setHex(ho[this.theme]), this.selectedIdx = e, this.pointHandles[e].material.color.setHex(po), this.refreshTangentVisuals(), this.attachGizmoTo("point", e), (n = (t = this.host).onCamPathPointSelect) == null || n.call(t, e);
    }
  }
  clearSelection() {
    var t, n;
    const e = this.selectedIdx != null || this.lookAtSelected;
    this.selectedIdx != null && this.pointHandles[this.selectedIdx] && this.pointHandles[this.selectedIdx].material.color.setHex(ho[this.theme]), this.selectedIdx = null, this.clearLookAtSelection(), this.disposeObj(this.inHandle), this.disposeObj(this.outHandle), this.disposeObj(this.tangentLine), this.inHandle = this.outHandle = null, this.tangentLine = null, this.detachGizmo(), e && ((n = (t = this.host).onCamPathPointSelect) == null || n.call(t, null));
  }
  attachGizmoTo(e, t) {
    let n;
    if (e === "lookAt") {
      if (!this.lookAt) return;
      n = new R(this.lookAt.x, this.lookAt.y, this.lookAt.z);
    } else {
      const i = this.points[t];
      if (!i) return;
      n = Oe(i.position), e === "in" ? n.add(Oe(i.in)) : e === "out" && n.add(Oe(i.out));
    }
    this.detachGizmo();
    const s = new Ot();
    s.userData._isHelper = !0, s.position.copy(n), this.host.scene.add(s), this.anchor = s, this._dragKind = e;
    const r = this.host.gizmo;
    r.setMode("translate"), r.setSpace("world"), r.showX = !0, r.showY = !0, r.showZ = !0, r.attach(s);
  }
  detachGizmo() {
    this._dragKind && (this.host.gizmo.detach(), this.anchor && (this.host.scene.remove(this.anchor), this.anchor = null), this._dragKind = null);
  }
  onGizmoChange(e) {
    const t = this._dragKind,
      n = this.anchor;
    if (!t || !n) return;
    if (t === "lookAt") {
      if (!this.lookAt) return;
      this.lookAt = Xt(n.position), this.emit(e, {
        lookAt: cs(this.lookAt)
      });
      return;
    }
    const s = this.selectedIdx;
    if (s == null) return;
    const r = this.points[s];
    if (r) {
      if (t === "point") r.position = Xt(n.position);else {
        const i = n.position.clone().sub(Oe(r.position));
        this.altHeld && (r.tangentMode = "free");
        const a = (r.tangentMode ?? "aligned") === "aligned";
        t === "out" ? (r.out = Xt(i), !this.altHeld && a && this.alignOpposite(r, "in", i)) : (r.in = Xt(i), !this.altHeld && a && this.alignOpposite(r, "out", i));
      }
      this.rebuildCurve(), this.refreshTangentVisuals(), this.emit(e);
    }
  }
  alignOpposite(e, t, n) {
    const s = n.lengthSq();
    if (s < 1e-12) return;
    const r = Oe(e[t]).length();
    if (r < 1e-6) return;
    const i = n.clone().multiplyScalar(-r / Math.sqrt(s));
    e[t] = Xt(i);
  }
  emit(e, t) {
    if (!this.takeId) return;
    const n = vr(this.points);
    this.lastEmitted = n, this.host.onCamPathEdit(this.takeId, n, e, t);
  }
  updatePoint(e, t, n) {
    if (!this.takeId) return;
    const s = this.points[e];
    if (!s) return;
    const r = s.tangentMode ?? "aligned";
    if (Object.assign(s, t), (s.tangentMode ?? "aligned") === "aligned" && (t.out ? this.alignOpposite(s, "in", Oe(t.out)) : t.in ? this.alignOpposite(s, "out", Oe(t.in)) : r === "free" && t.tangentMode === "aligned" && this.alignOpposite(s, "in", Oe(s.out))), this.anchor && this.selectedIdx === e && this._dragKind) {
      const a = Oe(s.position);
      this._dragKind === "in" ? a.add(Oe(s.in)) : this._dragKind === "out" && a.add(Oe(s.out)), this.anchor.position.copy(a);
    }
    this.rebuildCurve(), this.refreshTangentVisuals(), this.emit(n);
  }
  tryInsertFromDblClick(e) {
    if (!this.takeId || this.sampleCache.length === 0) return !1;
    const t = this.host.dom.getBoundingClientRect(),
      n = this.host.camera,
      s = new R();
    let r = null,
      i = Za * Za;
    for (const l of this.sampleCache) {
      if (s.copy(l.pos).project(n), s.z > 1) continue;
      const d = (s.x + 1) / 2 * t.width + t.left,
        u = (-s.y + 1) / 2 * t.height + t.top,
        h = (d - e.clientX) ** 2 + (u - e.clientY) ** 2;
      h < i && (i = h, r = {
        seg: l.seg,
        t: l.t
      });
    }
    if (!r) return !1;
    const a = ke.clamp(r.t, 0.05, 0.95);
    return this.splitSegment(r.seg, a), !0;
  }
  splitSegment(e, t) {
    const n = this.points.length,
      s = this.points[e],
      r = this.points[(e + 1) % n];
    if (!s || !r) return;
    const i = Oe(s.position),
      a = i.clone().add(Oe(s.out)),
      l = Oe(r.position),
      d = l.clone().add(Oe(r.in)),
      u = i.clone().lerp(a, t),
      h = a.clone().lerp(d, t),
      m = d.clone().lerp(l, t),
      f = u.clone().lerp(h, t),
      p = h.clone().lerp(m, t),
      x = f.clone().lerp(p, t),
      g = {
        position: Xt(x),
        in: Xt(f.sub(x)),
        out: Xt(p.sub(x)),
        tilt: (s.tilt ?? 0) * (1 - t) + (r.tilt ?? 0) * t,
        speed: (s.speed ?? 1) * (1 - t) + (r.speed ?? 1) * t
      };
    s.out = Xt(u.sub(i)), r.in = Xt(m.sub(l)), this.points.splice(e + 1, 0, g), this.clearSelection(), this.rebuildPointHandles(), this.rebuildCurve(), this.selectPoint(e + 1), this.emit(!0);
  }
  deleteSelected() {
    const e = this.selectedIdx;
    return e == null || this.points.length <= 2 ? !1 : (this.points.splice(e, 1), this.clearSelection(), this.rebuildPointHandles(), this.rebuildCurve(), this.emit(!0), !0);
  }
}
function _r(o, e, t) {
  const n = o.x * t.x,
    s = o.y * t.y,
    r = o.z * t.z,
    i = 2 * (e.y * r - e.z * s),
    a = 2 * (e.z * n - e.x * r),
    l = 2 * (e.x * s - e.y * n);
  return {
    x: n + e.w * i + e.y * l - e.z * a,
    y: s + e.w * a + e.z * i - e.x * l,
    z: r + e.w * l + e.x * a - e.y * i
  };
}
function Lc(o, e) {
  const {
      center: t,
      translate: n,
      quaternion: s,
      scale: r
    } = e,
    i = a => {
      const l = _r({
        x: a.x - t.x,
        y: a.y - t.y,
        z: a.z - t.z
      }, s, r);
      return {
        x: l.x + t.x + n.x,
        y: l.y + t.y + n.y,
        z: l.z + t.z + n.z
      };
    };
  return {
    points: o.map(a => ({
      ...a,
      position: i(a.position),
      in: _r(a.in, s, r),
      out: _r(a.out, s, r)
    })),
    lookAt: e.lookAt ? i(e.lookAt) : void 0
  };
}
function Li(o) {
  const e = o.length;
  return o.map((t, n) => {
    const s = o[Math.max(0, n - 1)],
      r = o[Math.min(e - 1, n + 1)],
      i = n === 0 || n === e - 1 ? 1 / 3 : 1 / 6,
      a = {
        x: (r.x - s.x) * i,
        y: (r.y - s.y) * i,
        z: (r.z - s.z) * i
      };
    return {
      position: {
        x: t.x,
        y: t.y,
        z: t.z
      },
      out: a,
      in: {
        x: -a.x,
        y: -a.y,
        z: -a.z
      },
      tilt: 0
    };
  });
}
function zc() {
  var o, e;
  try {
    const t = (e = (o = window == null ? void 0 : window.hub) == null ? void 0 : o.app) == null ? void 0 : e.region;
    return t === "overseas" || t === "domestic" ? t : "domestic";
  } catch {
    return "domestic";
  }
}
const is = {
    domestic: "",
    overseas: ""
  },
  fo = {
    domestic: `${is.domestic}/assets`,
    overseas: `${is.overseas}/assets`
  },
  Oc = {
    "male-std.glb": ["/models/male-std.glb", "/models/male-std.glb"],
    "female-std.glb": ["/models/female-std.glb", "/models/female-std.glb"]
  },
  op = () => 0;
function kr(o) {
  return String(o).toLowerCase().includes("female") ? "/models/female-std.glb" : "/models/male-std.glb";
}
const rp = {
  domestic: "",
  overseas: ""
};
function el(o, e) {
  return `${rp[zc()]}/${o}.${e}`;
}
const ip = Object.fromEntries(Object.entries(Oc).flatMap(([o, e]) => e.map(t => [t.split("/").pop().toLowerCase(), o])));
function Hc(o) {
  var t;
  if (!o) return "";
  const e = ((t = o.split("?")[0].split("/").pop()) == null ? void 0 : t.toLowerCase()) ?? "";
  return ip[e] ?? e;
}
const ap = 0,
  Fc = "mannequin",
  tl = ["#4F8EF7", "#F75353", "#34C759", "#FF9F0A", "#AF52DE", "#FF2D55", "#5AC8FA", "#FFD60A"],
  Kn = {
    mannequin: {
      bodyType: "mannequin",
      label: "男素体",
      description: "男性素体 GLB（标准化）",
      icon: "男",
      get modelUrl() {
        return "/models/male-std.glb";
      },
      modelName: "男素体",
      scale: {
        x: 1,
        y: 1,
        z: 1
      }
    },
    female: {
      bodyType: "female",
      label: "女素体",
      description: "女性素体 GLB（标准化）",
      icon: "女",
      get modelUrl() {
        return "/models/female-std.glb";
      },
      modelName: "女素体",
      scale: {
        x: 0.92,
        y: 0.92,
        z: 0.92
      }
    },
    child: {
      bodyType: "child",
      label: "儿童素体",
      description: "儿童素体（男素体 GLB 缩放）",
      icon: "童",
      get modelUrl() {
        return "/models/male-std.glb";
      },
      modelName: "儿童素体",
      scale: {
        x: 0.78,
        y: 0.66,
        z: 0.78
      }
    }
  },
  xi = ["mannequin", "female", "child"],
  lp = ["geo", "furniture", "building", "nature", "street"],
  J = {
    x: 1,
    y: 1,
    z: 1
  },
  Vs = [{
    id: "mesh_cube",
    name: "立方体",
    icon: "□",
    category: "geo",
    defaultScale: J
  }, {
    id: "mesh_sphere",
    name: "球体",
    icon: "○",
    category: "geo",
    defaultScale: J
  }, {
    id: "mesh_cylinder",
    name: "圆柱体",
    icon: "▭",
    category: "geo",
    defaultScale: J
  }, {
    id: "mesh_torus",
    name: "环状体",
    icon: "◎",
    category: "geo",
    defaultScale: J
  }, {
    id: "mesh_cone",
    name: "圆锥",
    icon: "△",
    category: "geo",
    defaultScale: J
  }, {
    id: "mesh_pyramid",
    name: "棱锥",
    icon: "◇",
    category: "geo",
    defaultScale: J
  }, {
    id: "mesh_rectangle",
    name: "矩形片",
    icon: "▭",
    category: "geo",
    defaultScale: J
  }, {
    id: "mesh_disc",
    name: "圆盘",
    icon: "●",
    category: "geo",
    defaultScale: J
  }, {
    id: "mesh_capsule",
    name: "胶囊体",
    icon: "⬯",
    category: "geo",
    defaultScale: J
  }, {
    id: "mesh_arc",
    name: "半圆弧",
    icon: "∩",
    category: "geo",
    defaultScale: J
  }, {
    id: "mesh_half_cylinder",
    name: "半圆柱",
    icon: "◖",
    category: "geo",
    defaultScale: J
  }, {
    id: "chair",
    name: "椅子",
    icon: "🪑",
    category: "furniture",
    defaultScale: J
  }, {
    id: "stool",
    name: "圆凳",
    icon: "🪑",
    category: "furniture",
    defaultScale: J
  }, {
    id: "armchair",
    name: "扶手椅",
    icon: "💺",
    category: "furniture",
    defaultScale: J
  }, {
    id: "sofa",
    name: "沙发",
    icon: "🛋️",
    category: "furniture",
    defaultScale: J
  }, {
    id: "square_table",
    name: "方桌",
    icon: "🪵",
    category: "furniture",
    defaultScale: J
  }, {
    id: "desk",
    name: "长桌",
    icon: "🖥️",
    category: "furniture",
    defaultScale: J
  }, {
    id: "round_table",
    name: "圆桌",
    icon: "🫙",
    category: "furniture",
    defaultScale: J
  }, {
    id: "bed",
    name: "床",
    icon: "🛏️",
    category: "furniture",
    defaultScale: J
  }, {
    id: "bookshelf",
    name: "书架",
    icon: "📚",
    category: "furniture",
    defaultScale: J
  }, {
    id: "cabinet",
    name: "矮柜",
    icon: "🗄️",
    category: "furniture",
    defaultScale: J
  }, {
    id: "wardrobe",
    name: "衣柜",
    icon: "🧥",
    category: "furniture",
    defaultScale: J
  }, {
    id: "tv",
    name: "电视",
    icon: "📺",
    category: "furniture",
    defaultScale: J
  }, {
    id: "wall_tv",
    name: "挂墙电视",
    icon: "▰",
    category: "furniture",
    defaultScale: J
  }, {
    id: "floor_lamp",
    name: "落地灯",
    icon: "💡",
    category: "furniture",
    defaultScale: J
  }, {
    id: "table_lamp",
    name: "台灯",
    icon: "🕯️",
    category: "furniture",
    defaultScale: J
  }, {
    id: "rug",
    name: "地毯",
    icon: "🧶",
    category: "furniture",
    defaultScale: J
  }, {
    id: "wall",
    name: "墙段",
    icon: "🧱",
    category: "building",
    defaultScale: J
  }, {
    id: "column",
    name: "柱子",
    icon: "🏛️",
    category: "building",
    defaultScale: J
  }, {
    id: "staircase",
    name: "楼梯段",
    icon: "🪜",
    category: "building",
    defaultScale: J
  }, {
    id: "ramp",
    name: "斜坡",
    icon: "📐",
    category: "building",
    defaultScale: J
  }, {
    id: "platform",
    name: "平台",
    icon: "⬜",
    category: "building",
    defaultScale: J
  }, {
    id: "arch",
    name: "拱门",
    icon: "⛩️",
    category: "building",
    defaultScale: J
  }, {
    id: "door",
    name: "门",
    icon: "🚪",
    category: "building",
    defaultScale: J
  }, {
    id: "fence",
    name: "栅栏",
    icon: "🚧",
    category: "building",
    defaultScale: J
  }, {
    id: "ladder",
    name: "梯子",
    icon: "🪜",
    category: "building",
    defaultScale: J
  }, {
    id: "statue",
    name: "雕像",
    icon: "🗿",
    category: "building",
    defaultScale: J
  }, {
    id: "tree_small",
    name: "小树",
    icon: "🌲",
    category: "nature",
    defaultScale: J
  }, {
    id: "tree_large",
    name: "大树",
    icon: "🌳",
    category: "nature",
    defaultScale: J
  }, {
    id: "rock",
    name: "石头",
    icon: "🪨",
    category: "nature",
    defaultScale: J
  }, {
    id: "bush",
    name: "灌木",
    icon: "🌿",
    category: "nature",
    defaultScale: J
  }, {
    id: "potted_plant",
    name: "盆栽",
    icon: "🪴",
    category: "nature",
    defaultScale: J
  }, {
    id: "stump",
    name: "树桩",
    icon: "🪵",
    category: "nature",
    defaultScale: J
  }, {
    id: "flower_bed",
    name: "花坛",
    icon: "🌼",
    category: "nature",
    defaultScale: J
  }, {
    id: "car",
    name: "轿车",
    icon: "🚗",
    category: "street",
    defaultScale: J
  }, {
    id: "truck",
    name: "卡车",
    icon: "🚚",
    category: "street",
    defaultScale: J
  }, {
    id: "bicycle",
    name: "自行车",
    icon: "🚲",
    category: "street",
    defaultScale: J
  }, {
    id: "streetlamp",
    name: "路灯",
    icon: "🏮",
    category: "street",
    defaultScale: J
  }, {
    id: "bench",
    name: "长椅",
    icon: "🪑",
    category: "street",
    defaultScale: J
  }, {
    id: "trash_bin",
    name: "垃圾桶",
    icon: "🗑️",
    category: "street",
    defaultScale: J
  }, {
    id: "traffic_cone",
    name: "路锥",
    icon: "🚦",
    category: "street",
    defaultScale: J
  }, {
    id: "road_barrier",
    name: "水马护栏",
    icon: "🚧",
    category: "street",
    defaultScale: J
  }, {
    id: "sign",
    name: "路牌",
    icon: "🪧",
    category: "street",
    defaultScale: J
  }, {
    id: "fire_hydrant",
    name: "消防栓",
    icon: "🧯",
    category: "street",
    defaultScale: J
  }, {
    id: "barrel",
    name: "油桶",
    icon: "🛢️",
    category: "street",
    defaultScale: J
  }, {
    id: "crate",
    name: "木箱",
    icon: "📦",
    category: "street",
    defaultScale: J
  }],
  cp = new Set(Vs.map(o => o.id)),
  dp = lp.map(o => ({
    category: o,
    assets: Vs.filter(e => e.category === o)
  })),
  up = {
    "male-std.glb": {
      l_arm: {
        raise: 0,
        straddle: 46,
        turn: 0
      },
      r_arm: {
        raise: 0,
        straddle: 46,
        turn: 0
      },
      l_elbow: {
        bend: 24,
        turn: 0
      },
      r_elbow: {
        bend: 24,
        turn: 0
      }
    },
    "female-std.glb": {
      l_arm: {
        raise: -7.4,
        straddle: 35,
        turn: 74.1
      },
      r_arm: {
        raise: -7.4,
        straddle: 35,
        turn: 74.1
      },
      l_elbow: {
        bend: 16,
        turn: -64
      },
      r_elbow: {
        bend: 16,
        turn: -64
      }
    }
  };
function hp(o) {
  if (!o) return null;
  const e = Hc(o);
  return up[e] ?? null;
}
const ys = {
    body: {
      bend: 0,
      turn: 0,
      tilt: 0
    },
    torso: {
      bend: 2,
      turn: 0,
      tilt: 0
    },
    head: {
      nod: -10,
      turn: 0,
      tilt: 0
    },
    l_arm: {
      raise: -5,
      straddle: 12,
      turn: 0
    },
    r_arm: {
      raise: -5,
      straddle: 12,
      turn: 0
    },
    l_elbow: {
      bend: 15,
      turn: 0
    },
    r_elbow: {
      bend: 15,
      turn: 0
    },
    l_wrist: {
      bend: 0,
      turn: 0
    },
    r_wrist: {
      bend: 0,
      turn: 0
    },
    l_leg: {
      raise: 0,
      straddle: 0,
      turn: 0
    },
    r_leg: {
      raise: 0,
      straddle: 0,
      turn: 0
    },
    l_knee: {
      bend: 0
    },
    r_knee: {
      bend: 0
    },
    l_ankle: {
      bend: 0
    },
    r_ankle: {
      bend: 0
    }
  },
  pp = {
    female: {
      l_arm: {
        straddle: 19
      },
      r_arm: {
        straddle: 19
      }
    }
  };
function hn(o) {
  const e = structuredClone(ys),
    t = o ? pp[o] : void 0;
  if (t) for (const n in t) Object.assign(e[n], t[n]);
  return e;
}
const Bc = [{
    id: "front_medium",
    label: "正面中景",
    position: {
      x: 0,
      y: 1.5,
      z: 4
    },
    lookAt: {
      x: 0,
      y: 1.2,
      z: 0
    },
    fov: 50
  }, {
    id: "front_closeup",
    label: "正面特写",
    position: {
      x: 0,
      y: 1.7,
      z: 2
    },
    lookAt: {
      x: 0,
      y: 1.6,
      z: 0
    },
    fov: 35
  }, {
    id: "front_wide",
    label: "正面全景",
    position: {
      x: 0,
      y: 2.5,
      z: 8
    },
    lookAt: {
      x: 0,
      y: 1,
      z: 0
    },
    fov: 60
  }, {
    id: "side_tracking",
    label: "侧面跟拍",
    position: {
      x: 4,
      y: 1.5,
      z: 0
    },
    lookAt: {
      x: 0,
      y: 1.2,
      z: 0
    },
    fov: 50
  }, {
    id: "side_close",
    label: "侧面近景",
    position: {
      x: 2.5,
      y: 1.5,
      z: 0
    },
    lookAt: {
      x: 0,
      y: 1.5,
      z: 0
    },
    fov: 40
  }, {
    id: "back_medium",
    label: "背面中景",
    position: {
      x: 0,
      y: 1.5,
      z: -4
    },
    lookAt: {
      x: 0,
      y: 1.2,
      z: 0
    },
    fov: 50
  }, {
    id: "top_wide",
    label: "俯拍全景",
    position: {
      x: 0,
      y: 8,
      z: 3
    },
    lookAt: {
      x: 0,
      y: 0,
      z: 0
    },
    fov: 55
  }, {
    id: "top_45",
    label: "45°俯拍",
    position: {
      x: 0,
      y: 5,
      z: 5
    },
    lookAt: {
      x: 0,
      y: 1,
      z: 0
    },
    fov: 50
  }, {
    id: "low_angle",
    label: "低角度仰拍",
    position: {
      x: 0,
      y: 0.3,
      z: 3
    },
    lookAt: {
      x: 0,
      y: 1.8,
      z: 0
    },
    fov: 45
  }, {
    id: "low_wide",
    label: "低角度广角",
    position: {
      x: 0,
      y: 0.5,
      z: 5
    },
    lookAt: {
      x: 0,
      y: 1,
      z: 0
    },
    fov: 70
  }, {
    id: "over_shoulder_l",
    label: "过肩镜头",
    position: {
      x: -0.5,
      y: 1.7,
      z: 2.5
    },
    lookAt: {
      x: 0.5,
      y: 1.6,
      z: 0
    },
    fov: 50
  }, {
    id: "over_shoulder_r",
    label: "过肩镜头(右)",
    position: {
      x: 0.5,
      y: 1.7,
      z: 2.5
    },
    lookAt: {
      x: -0.5,
      y: 1.6,
      z: 0
    },
    fov: 50
  }, {
    id: "birdseye",
    label: "鸟瞰",
    position: {
      x: 0,
      y: 12,
      z: 0.5
    },
    lookAt: {
      x: 0,
      y: 0,
      z: 0
    },
    fov: 60
  }, {
    id: "dutch",
    label: "荷兰角",
    position: {
      x: 1,
      y: 1.5,
      z: 3.5
    },
    lookAt: {
      x: 0,
      y: 1.2,
      z: 0
    },
    fov: 50
  }],
  fp = {
    x: 0,
    y: 2.2,
    z: 10
  },
  mp = {
    x: 0,
    y: 1.2,
    z: 0
  },
  Cn = {
    body: ["bend", "turn", "tilt"],
    torso: ["bend", "turn", "tilt"],
    head: ["nod", "turn", "tilt"],
    l_arm: ["raise", "straddle", "turn"],
    r_arm: ["raise", "straddle", "turn"],
    l_elbow: ["bend", "turn"],
    r_elbow: ["bend", "turn"],
    l_wrist: ["bend", "turn"],
    r_wrist: ["bend", "turn"],
    l_leg: ["raise", "straddle", "turn"],
    r_leg: ["raise", "straddle", "turn"],
    l_knee: ["bend"],
    r_knee: ["bend"],
    l_ankle: ["bend"],
    r_ankle: ["bend"]
  },
  Uc = o => !!o && typeof o == "object" && !Array.isArray(o);
function gp(o, e, t, n) {
  const s = {
    ...e
  };
  if (Uc(o)) for (const r of t) {
    const i = o[r];
    typeof i == "number" && Number.isFinite(i) && (s[r] = i, n.hasValue = !0);
  }
  return s;
}
function Hs(o, e = ys) {
  if (!Uc(o)) return null;
  const t = {
      hasValue: !1
    },
    n = {};
  return Object.keys(Cn).forEach(s => {
    n[s] = gp(o[s], e[s], Cn[s], t);
  }), t.hasValue ? n : null;
}
function Kt(o) {
  return Hs(o, o) ?? structuredClone(ys);
}
const xp = {
    "male-std.glb": {
      sit: 0.8317,
      squat: 0.4129,
      kneel: 0.4936,
      lie: 0.7795,
      drive: 0.8452
    },
    "female-std.glb": {
      sit: 0.8706,
      squat: 0.444,
      kneel: 0.5001,
      lie: 0.8246,
      drive: 0.8836
    }
  },
  nl = {
    walk: {
      body: {
        bend: 0,
        turn: -1.5,
        tilt: 2.7
      },
      torso: {
        bend: 6.9,
        turn: -1.7,
        tilt: 0.6
      },
      head: {
        nod: -6.5,
        turn: 1.2,
        tilt: -2.7
      },
      l_arm: {
        raise: -6.6,
        straddle: 13.1,
        turn: -2.1
      },
      r_arm: {
        raise: 19.6,
        straddle: 20.4,
        turn: -8.3
      },
      l_elbow: {
        bend: 30.4,
        turn: 13.1
      },
      r_elbow: {
        bend: 37.4,
        turn: 16.8
      },
      l_wrist: {
        bend: 12.2,
        turn: -3
      },
      r_wrist: {
        bend: 19.3,
        turn: -3.9
      },
      l_leg: {
        raise: 26.6,
        straddle: 3,
        turn: 0.7
      },
      r_leg: {
        raise: -19.6,
        straddle: -4,
        turn: 0.8
      },
      l_knee: {
        bend: 9.7
      },
      r_knee: {
        bend: 14.2
      },
      l_ankle: {
        bend: -9.2
      },
      r_ankle: {
        bend: 2.3
      }
    },
    run: {
      body: {
        bend: 5.6,
        turn: -1,
        tilt: -5.5
      },
      torso: {
        bend: 18.4,
        turn: -15.5,
        tilt: 3.7
      },
      head: {
        nod: 2.2,
        turn: 18.2,
        tilt: 1.3
      },
      l_arm: {
        raise: -42,
        straddle: 34.2,
        turn: 9
      },
      r_arm: {
        raise: 15,
        straddle: 32,
        turn: 8.4
      },
      l_elbow: {
        bend: 77.7,
        turn: -4.9
      },
      r_elbow: {
        bend: 94,
        turn: -1.6
      },
      l_wrist: {
        bend: 14.6,
        turn: -0.4
      },
      r_wrist: {
        bend: 22.8,
        turn: -5.7
      },
      l_leg: {
        raise: 41.2,
        straddle: -7.1,
        turn: -2.6
      },
      r_leg: {
        raise: -34.4,
        straddle: 5.7,
        turn: -2.8
      },
      l_knee: {
        bend: -3.9
      },
      r_knee: {
        bend: 45.3
      },
      l_ankle: {
        bend: 5.4
      },
      r_ankle: {
        bend: 14.1
      }
    },
    jump: {
      body: {
        bend: -14.3,
        turn: 10.2,
        tilt: -4.1
      },
      torso: {
        bend: 18.3,
        turn: 2.7,
        tilt: -0.2
      },
      head: {
        nod: -34.9,
        turn: -9.4,
        tilt: 3.4
      },
      l_arm: {
        raise: -6,
        straddle: 71.2,
        turn: -22.4
      },
      r_arm: {
        raise: -23,
        straddle: 80.6,
        turn: -20.8
      },
      l_elbow: {
        bend: 22,
        turn: 4.1
      },
      r_elbow: {
        bend: 38.2,
        turn: 0.5
      },
      l_wrist: {
        bend: 9.7,
        turn: 26.8
      },
      r_wrist: {
        bend: 16,
        turn: 6.3
      },
      l_leg: {
        raise: 16.4,
        straddle: 37.8,
        turn: 37
      },
      r_leg: {
        raise: 4.7,
        straddle: 20.4,
        turn: 40.5
      },
      l_knee: {
        bend: 96.5
      },
      r_knee: {
        bend: 45
      },
      l_ankle: {
        bend: -9.7
      },
      r_ankle: {
        bend: 25
      }
    },
    sit: {
      body: {
        bend: 0,
        turn: 0,
        tilt: 0
      },
      torso: {
        bend: 10.1,
        turn: 0,
        tilt: 0
      },
      head: {
        nod: 0.8,
        turn: -11,
        tilt: 0.1
      },
      l_arm: {
        raise: -3.4,
        straddle: 10.8,
        turn: -7.2
      },
      r_arm: {
        raise: 3,
        straddle: 22.4,
        turn: -24.6
      },
      l_elbow: {
        bend: 81.3,
        turn: 0
      },
      r_elbow: {
        bend: 75.6,
        turn: 2.5
      },
      l_wrist: {
        bend: 13.8,
        turn: -50.5
      },
      r_wrist: {
        bend: 14.8,
        turn: -61.3
      },
      l_leg: {
        raise: 79.6,
        straddle: 72.5,
        turn: 73.4
      },
      r_leg: {
        raise: 84,
        straddle: 47,
        turn: 36.6
      },
      l_knee: {
        bend: 80.5
      },
      r_knee: {
        bend: 79.3
      },
      l_ankle: {
        bend: 6
      },
      r_ankle: {
        bend: 6.8
      }
    },
    squat: {
      body: {
        bend: 15.8,
        turn: 9.4,
        tilt: 10.9
      },
      torso: {
        bend: 26.4,
        turn: -7.1,
        tilt: -3.5
      },
      head: {
        nod: 0.1,
        turn: -9.8,
        tilt: -2.3
      },
      l_arm: {
        raise: -5.7,
        straddle: 24.1,
        turn: 0.1
      },
      r_arm: {
        raise: -5,
        straddle: 25.3,
        turn: 9.6
      },
      l_elbow: {
        bend: 46.1,
        turn: 1
      },
      r_elbow: {
        bend: 73.9,
        turn: -5.7
      },
      l_wrist: {
        bend: 11.9,
        turn: 23.3
      },
      r_wrist: {
        bend: 12.3,
        turn: 0.5
      },
      l_leg: {
        raise: 58.1,
        straddle: 156.3,
        turn: 144.8
      },
      r_leg: {
        raise: 75.1,
        straddle: 25.4,
        turn: 17.5
      },
      l_knee: {
        bend: 88.8
      },
      r_knee: {
        bend: 128.2
      },
      l_ankle: {
        bend: 11.2
      },
      r_ankle: {
        bend: -6
      }
    },
    kneel: {
      body: {
        bend: 10.7,
        turn: -2,
        tilt: 1.1
      },
      torso: {
        bend: 30.4,
        turn: -2.7,
        tilt: 1
      },
      head: {
        nod: -22,
        turn: -14.6,
        tilt: 0.3
      },
      l_arm: {
        raise: 53.3,
        straddle: 46.2,
        turn: -22.9
      },
      r_arm: {
        raise: 46.1,
        straddle: 53.9,
        turn: -50.9
      },
      l_elbow: {
        bend: 40.3,
        turn: -6.9
      },
      r_elbow: {
        bend: 52.4,
        turn: -1.2
      },
      l_wrist: {
        bend: -3.2,
        turn: 37.6
      },
      r_wrist: {
        bend: 16.8,
        turn: 48.7
      },
      l_leg: {
        raise: 47.2,
        straddle: 109.2,
        turn: 108.5
      },
      r_leg: {
        raise: 15.8,
        straddle: 8.4,
        turn: 1
      },
      l_knee: {
        bend: 127.1
      },
      r_knee: {
        bend: 92.6
      },
      l_ankle: {
        bend: -40.7
      },
      r_ankle: {
        bend: 68.1
      }
    },
    fight: {
      body: {
        bend: -25.1,
        turn: 14,
        tilt: -4.1
      },
      torso: {
        bend: 20.8,
        turn: -1,
        tilt: -2
      },
      head: {
        nod: -31.2,
        turn: -11.9,
        tilt: -6.7
      },
      l_arm: {
        raise: 41.8,
        straddle: 16.8,
        turn: -5.8
      },
      r_arm: {
        raise: 24.5,
        straddle: 24.9,
        turn: 1
      },
      l_elbow: {
        bend: 118.3,
        turn: -9.5
      },
      r_elbow: {
        bend: 123.2,
        turn: -6.2
      },
      l_wrist: {
        bend: 12.8,
        turn: -2
      },
      r_wrist: {
        bend: 14.4,
        turn: -0.5
      },
      l_leg: {
        raise: 1.9,
        straddle: 12.5,
        turn: 11
      },
      r_leg: {
        raise: -29.4,
        straddle: 25.7,
        turn: 29.7
      },
      l_knee: {
        bend: 38.7
      },
      r_knee: {
        bend: 24.1
      },
      l_ankle: {
        bend: -9.2
      },
      r_ankle: {
        bend: -14.7
      }
    },
    aim: {
      body: {
        bend: -5.3,
        turn: 13.3,
        tilt: -2.3
      },
      torso: {
        bend: 8,
        turn: 10.2,
        tilt: -0.5
      },
      head: {
        nod: -15.7,
        turn: -23.1,
        tilt: -10.3
      },
      l_arm: {
        raise: 64.8,
        straddle: 18.3,
        turn: -21
      },
      r_arm: {
        raise: 69.8,
        straddle: -69.4,
        turn: -94.3
      },
      l_elbow: {
        bend: 57.4,
        turn: -5.2
      },
      r_elbow: {
        bend: 29.5,
        turn: -14.6
      },
      l_wrist: {
        bend: 54,
        turn: 62.4
      },
      r_wrist: {
        bend: 5.1,
        turn: 37
      },
      l_leg: {
        raise: 13.5,
        straddle: 13.1,
        turn: 12.3
      },
      r_leg: {
        raise: -12.8,
        straddle: 13.4,
        turn: 35.3
      },
      l_knee: {
        bend: 16.9
      },
      r_knee: {
        bend: 9.7
      },
      l_ankle: {
        bend: 4.6
      },
      r_ankle: {
        bend: -7.5
      }
    },
    sword: {
      body: {
        bend: -16.2,
        turn: 25.2,
        tilt: -5.1
      },
      torso: {
        bend: 23.5,
        turn: 7.8,
        tilt: 0.9
      },
      head: {
        nod: -19.2,
        turn: -19.5,
        tilt: -3.7
      },
      l_arm: {
        raise: 1.1,
        straddle: 38.8,
        turn: 3.9
      },
      r_arm: {
        raise: -23.7,
        straddle: 26.7,
        turn: 26.9
      },
      l_elbow: {
        bend: 46.9,
        turn: -6.8
      },
      r_elbow: {
        bend: 40.8,
        turn: -3.3
      },
      l_wrist: {
        bend: 11,
        turn: 7.6
      },
      r_wrist: {
        bend: -0.2,
        turn: 14.6
      },
      l_leg: {
        raise: 28.7,
        straddle: 19.8,
        turn: 14.8
      },
      r_leg: {
        raise: 4.7,
        straddle: 39.1,
        turn: 35
      },
      l_knee: {
        bend: 65.9
      },
      r_knee: {
        bend: 64.9
      },
      l_ankle: {
        bend: -16.2
      },
      r_ankle: {
        bend: -26.6
      }
    },
    spell: {
      body: {
        bend: -2,
        turn: 40.8,
        tilt: -5.3
      },
      torso: {
        bend: 9.1,
        turn: 6.6,
        tilt: -0.3
      },
      head: {
        nod: -12.1,
        turn: -43.6,
        tilt: -4.2
      },
      l_arm: {
        raise: 25.5,
        straddle: 86.8,
        turn: 44.7
      },
      r_arm: {
        raise: -10.3,
        straddle: 23.2,
        turn: 3.5
      },
      l_elbow: {
        bend: 34.9,
        turn: -12
      },
      r_elbow: {
        bend: 35.8,
        turn: 9.9
      },
      l_wrist: {
        bend: 0.3,
        turn: -12.4
      },
      r_wrist: {
        bend: 18.2,
        turn: -24.9
      },
      l_leg: {
        raise: 6.9,
        straddle: 23.6,
        turn: 40
      },
      r_leg: {
        raise: 0.4,
        straddle: 19.7,
        turn: 38.7
      },
      l_knee: {
        bend: 24
      },
      r_knee: {
        bend: 19.3
      },
      l_ankle: {
        bend: -1.1
      },
      r_ankle: {
        bend: -7.6
      }
    },
    lie: {
      body: {
        bend: -75.4,
        turn: 100.6,
        tilt: -101
      },
      torso: {
        bend: 10.1,
        turn: 0.2,
        tilt: -0.3
      },
      head: {
        nod: 30.2,
        turn: -2.2,
        tilt: 1.7
      },
      l_arm: {
        raise: -21.1,
        straddle: 87,
        turn: -72.9
      },
      r_arm: {
        raise: 0.6,
        straddle: 127.4,
        turn: -79.1
      },
      l_elbow: {
        bend: -103,
        turn: 8.7
      },
      r_elbow: {
        bend: -23.1,
        turn: 83.1
      },
      l_wrist: {
        bend: -160.8,
        turn: -0.6
      },
      r_wrist: {
        bend: 76.7,
        turn: 78.6
      },
      l_leg: {
        raise: -3.1,
        straddle: 16.6,
        turn: 41.3
      },
      r_leg: {
        raise: 8.8,
        straddle: 20.6,
        turn: 21.2
      },
      l_knee: {
        bend: 12.7
      },
      r_knee: {
        bend: 13.3
      },
      l_ankle: {
        bend: 15.6
      },
      r_ankle: {
        bend: 22.6
      }
    },
    drive: {
      body: {
        bend: -17.7,
        turn: 0,
        tilt: 0
      },
      torso: {
        bend: 10.7,
        turn: 0,
        tilt: 0
      },
      head: {
        nod: -0.9,
        turn: -11,
        tilt: -0.2
      },
      l_arm: {
        raise: 33,
        straddle: 12.7,
        turn: -7.4
      },
      r_arm: {
        raise: 39.6,
        straddle: 20.4,
        turn: -10.7
      },
      l_elbow: {
        bend: 79.5,
        turn: -4.2
      },
      r_elbow: {
        bend: 63.4,
        turn: -3.1
      },
      l_wrist: {
        bend: -6.9,
        turn: 41.3
      },
      r_wrist: {
        bend: 16.9,
        turn: 58.3
      },
      l_leg: {
        raise: 62.2,
        straddle: 35.6,
        turn: 39.6
      },
      r_leg: {
        raise: 61.2,
        straddle: 39.5,
        turn: 39.5
      },
      l_knee: {
        bend: 80.4
      },
      r_knee: {
        bend: 79.2
      },
      l_ankle: {
        bend: 3.8
      },
      r_ankle: {
        bend: 5.2
      }
    }
  },
  Gc = [{
    id: "stand",
    label: "站立",
    icon: "🧍"
  }, {
    id: "tpose",
    label: "T型",
    icon: "🙆"
  }, {
    id: "walk",
    label: "行走",
    icon: "🚶"
  }, {
    id: "run",
    label: "跑步",
    icon: "🏃"
  }, {
    id: "jump",
    label: "跳跃",
    icon: "🤸"
  }, {
    id: "sit",
    label: "坐姿",
    icon: "🪑"
  }, {
    id: "squat",
    label: "蹲下",
    icon: "🧎"
  }, {
    id: "kneel",
    label: "单膝跪",
    icon: "🧎"
  }, {
    id: "lie",
    label: "躺倒",
    icon: "🛌"
  }, {
    id: "drive",
    label: "驾驶",
    icon: "🚗"
  }, {
    id: "wave",
    label: "招手",
    icon: "🙋"
  }, {
    id: "hands_up",
    label: "举手",
    icon: "🙌"
  }, {
    id: "bow",
    label: "鞠躬",
    icon: "🙇"
  }, {
    id: "akimbo",
    label: "叉腰",
    icon: "🧍"
  }, {
    id: "think",
    label: "思考",
    icon: "🤔"
  }, {
    id: "fight",
    label: "格斗",
    icon: "🥊"
  }, {
    id: "aim",
    label: "持枪瞄准",
    icon: "🔫"
  }, {
    id: "sword",
    label: "持剑",
    icon: "🗡️"
  }, {
    id: "spell",
    label: "施法",
    icon: "🪄"
  }],
  bp = {
    sit: 0.83,
    squat: 0.41,
    kneel: 0.49,
    lie: 0.8,
    drive: 0.85
  };
function zi(o, e) {
  var n;
  const t = Hc(e);
  return ((n = xp[t]) == null ? void 0 : n[o]) ?? bp[o] ?? 0;
}
function wp(o, e) {
  return zi(o, void 0);
}
const yp = () => structuredClone(ys);
function Ln(o) {
  const e = yp();
  for (const t in o) Object.assign(e[t], o[t]);
  return e;
}
const ps = {
  stand: Ln({
    body: {
      bend: 0,
      turn: 0,
      tilt: 0
    },
    torso: {
      bend: 2,
      turn: 0,
      tilt: 0
    },
    head: {
      nod: -10,
      turn: 0,
      tilt: 0
    },
    l_arm: {
      raise: -5,
      straddle: 12,
      turn: 0
    },
    r_arm: {
      raise: -5,
      straddle: 12,
      turn: 0
    },
    l_elbow: {
      bend: 15
    },
    r_elbow: {
      bend: 15
    },
    l_leg: {
      raise: 0,
      straddle: 0,
      turn: 0
    },
    r_leg: {
      raise: 0,
      straddle: 0,
      turn: 0
    },
    l_knee: {
      bend: 0
    },
    r_knee: {
      bend: 0
    }
  }),
  tpose: Ln({
    body: {
      bend: 0,
      turn: 0,
      tilt: 0
    },
    torso: {
      bend: 0,
      turn: 0,
      tilt: 0
    },
    head: {
      nod: 0,
      turn: 0,
      tilt: 0
    },
    l_arm: {
      raise: 0,
      straddle: 90,
      turn: 0
    },
    r_arm: {
      raise: 0,
      straddle: 90,
      turn: 0
    },
    l_elbow: {
      bend: 0
    },
    r_elbow: {
      bend: 0
    },
    l_leg: {
      raise: 0,
      straddle: 0,
      turn: 0
    },
    r_leg: {
      raise: 0,
      straddle: 0,
      turn: 0
    },
    l_knee: {
      bend: 0
    },
    r_knee: {
      bend: 0
    }
  }),
  wave: Ln({
    body: {
      bend: 0,
      turn: 0,
      tilt: 0
    },
    torso: {
      bend: 2,
      turn: -10,
      tilt: 0
    },
    head: {
      nod: -5,
      turn: 15,
      tilt: 5
    },
    l_arm: {
      raise: 0,
      straddle: 12,
      turn: 0
    },
    r_arm: {
      raise: 3,
      straddle: 106,
      turn: 90
    },
    l_elbow: {
      bend: 15
    },
    r_elbow: {
      bend: 74
    },
    l_leg: {
      raise: 0,
      straddle: 0,
      turn: 0
    },
    r_leg: {
      raise: 0,
      straddle: 0,
      turn: 0
    },
    l_knee: {
      bend: 0
    },
    r_knee: {
      bend: 0
    }
  }),
  hands_up: Ln({
    body: {
      bend: 0,
      turn: 0,
      tilt: 0
    },
    torso: {
      bend: -3,
      turn: 0,
      tilt: 0
    },
    head: {
      nod: -5,
      turn: 0,
      tilt: 0
    },
    l_arm: {
      raise: 140,
      straddle: 7,
      turn: 0
    },
    r_arm: {
      raise: 140,
      straddle: 7,
      turn: 0
    },
    l_elbow: {
      bend: 15
    },
    r_elbow: {
      bend: 15
    },
    l_leg: {
      raise: 0,
      straddle: 5,
      turn: 0
    },
    r_leg: {
      raise: 0,
      straddle: 5,
      turn: 0
    },
    l_knee: {
      bend: 0
    },
    r_knee: {
      bend: 0
    }
  }),
  bow: Ln({
    body: {
      bend: 29,
      turn: 0,
      tilt: 0
    },
    torso: {
      bend: 30,
      turn: 0,
      tilt: 0
    },
    head: {
      nod: -14,
      turn: 0,
      tilt: 0
    },
    l_arm: {
      raise: 12,
      straddle: 17,
      turn: 0
    },
    r_arm: {
      raise: 12,
      straddle: 17,
      turn: 0
    },
    l_elbow: {
      bend: 53
    },
    r_elbow: {
      bend: 53
    },
    l_leg: {
      raise: 26,
      straddle: 0,
      turn: 0
    },
    r_leg: {
      raise: 26,
      straddle: 0,
      turn: 0
    },
    l_knee: {
      bend: 0
    },
    r_knee: {
      bend: 0
    }
  }),
  akimbo: Ln({
    body: {
      bend: 0,
      turn: 0,
      tilt: 0
    },
    torso: {
      bend: 2,
      turn: 0,
      tilt: 0
    },
    head: {
      nod: -10,
      turn: 0,
      tilt: 0
    },
    l_arm: {
      raise: 0,
      straddle: 41,
      turn: -61
    },
    r_arm: {
      raise: 0,
      straddle: 41,
      turn: -61
    },
    l_elbow: {
      bend: 90
    },
    r_elbow: {
      bend: 90
    },
    l_leg: {
      raise: 0,
      straddle: 0,
      turn: 0
    },
    r_leg: {
      raise: 0,
      straddle: 0,
      turn: 0
    },
    l_knee: {
      bend: 0
    },
    r_knee: {
      bend: 0
    }
  }),
  think: Ln({
    body: {
      bend: 0,
      turn: 0,
      tilt: 0
    },
    torso: {
      bend: 5,
      turn: -5,
      tilt: 0
    },
    head: {
      nod: 10,
      turn: -10,
      tilt: 5
    },
    l_arm: {
      raise: -5,
      straddle: 12,
      turn: 0
    },
    r_arm: {
      raise: 148,
      straddle: -56,
      turn: -80
    },
    l_elbow: {
      bend: 15,
      turn: 0
    },
    r_elbow: {
      bend: 107,
      turn: 57
    },
    l_leg: {
      raise: 0,
      straddle: 0,
      turn: 0
    },
    r_leg: {
      raise: 0,
      straddle: 0,
      turn: 0
    },
    l_knee: {
      bend: 0
    },
    r_knee: {
      bend: 0
    }
  }),
  ...nl,
  lie: {
    ...nl.lie,
    l_arm: {
      raise: 2,
      straddle: 40,
      turn: 0
    },
    r_arm: {
      raise: 2,
      straddle: 28,
      turn: 0
    },
    l_elbow: {
      bend: 15,
      turn: 0
    },
    r_elbow: {
      bend: 12,
      turn: 0
    },
    l_wrist: {
      bend: 0,
      turn: 0
    },
    r_wrist: {
      bend: 0,
      turn: 0
    }
  }
};
function fs(o, e) {
  const t = ps[o];
  return !t || o === "stand" ? hn(e) : Kt(t);
}
const _e = Math.PI / 180,
  Oi = {
    body: ["hips", "pelvis", "hip", "root", "defspine"],
    torso: ["upperchest", "chest", "spine2", "spine1", "spine", "defspine003"],
    head: ["head", "defspine006"],
    l_arm: ["leftupperarm", "leftarm", "lupperarm", "larm", "upperarml", "arml", "defupperarml"],
    r_arm: ["rightupperarm", "rightarm", "rupperarm", "rarm", "upperarmr", "armr", "defupperarmr"],
    l_elbow: ["leftforearm", "leftlowerarm", "lforearm", "llowerarm", "forearml", "lowerarml", "defforearml"],
    r_elbow: ["rightforearm", "rightlowerarm", "rforearm", "rlowerarm", "forearmr", "lowerarmr", "defforearmr"],
    l_wrist: ["lefthand", "lhand", "handl", "hand_l", "defhandl"],
    r_wrist: ["righthand", "rhand", "handr", "hand_r", "defhandr"],
    l_leg: ["leftupleg", "leftupperleg", "leftthigh", "lupleg", "lupperleg", "lthigh", "uplegl", "upperlegl", "thighl", "thigh_l", "defthighl"],
    r_leg: ["rightupleg", "rightupperleg", "rightthigh", "rupleg", "rupperleg", "rthigh", "uplegr", "upperlegr", "thighr", "thigh_r", "defthighr"],
    l_knee: ["leftleg", "leftlowerleg", "leftcalf", "leftshin", "lleg", "llowerleg", "lcalf", "lshin", "legl", "lowerlegl", "calfl", "shinl", "shin_l", "defshinl"],
    r_knee: ["rightleg", "rightlowerleg", "rightcalf", "rightshin", "rleg", "rlowerleg", "rcalf", "rshin", "legr", "lowerlegr", "calfr", "shinr", "shin_r", "defshinr"],
    l_ankle: ["leftfoot", "lfoot", "footl", "foot_l", "deffootl"],
    r_ankle: ["rightfoot", "rfoot", "footr", "foot_r", "deffootr"]
  },
  sl = o => o.toLowerCase().replace(/[^a-z0-9]/g, "");
function $c(o, e) {
  const t = Vc(o, e);
  return new ve().setFromEuler(new Qe(-t.x, -t.y, -t.z, t.order));
}
const Hi = {
  body: {
    order: "YXZ",
    x: {
      field: "bend",
      sign: -1
    },
    y: {
      field: "turn",
      sign: 1
    },
    z: {
      field: "tilt",
      sign: 1
    }
  },
  torso: {
    order: "YXZ",
    x: {
      field: "bend",
      sign: -1
    },
    y: {
      field: "turn",
      sign: 1
    },
    z: {
      field: "tilt",
      sign: 1
    }
  },
  head: {
    order: "YXZ",
    x: {
      field: "nod",
      sign: 1
    },
    y: {
      field: "turn",
      sign: 1
    },
    z: {
      field: "tilt",
      sign: 1
    }
  },
  l_arm: {
    order: "ZXY",
    x: {
      field: "raise",
      sign: -1
    },
    y: {
      field: "turn",
      sign: 1
    },
    z: {
      field: "straddle",
      sign: -1
    }
  },
  r_arm: {
    order: "ZXY",
    x: {
      field: "raise",
      sign: -1
    },
    y: {
      field: "turn",
      sign: -1
    },
    z: {
      field: "straddle",
      sign: 1
    }
  },
  l_leg: {
    order: "ZXY",
    x: {
      field: "raise",
      sign: 1
    },
    y: {
      field: "turn",
      sign: 1
    },
    z: {
      field: "straddle",
      sign: 1
    }
  },
  r_leg: {
    order: "ZXY",
    x: {
      field: "raise",
      sign: 1
    },
    y: {
      field: "turn",
      sign: -1
    },
    z: {
      field: "straddle",
      sign: -1
    }
  },
  l_elbow: {
    order: "XYZ",
    x: {
      field: "bend",
      sign: -1
    },
    y: {
      field: "turn",
      sign: 1
    },
    z: null
  },
  r_elbow: {
    order: "XYZ",
    x: {
      field: "bend",
      sign: -1
    },
    y: {
      field: "turn",
      sign: -1
    },
    z: null
  },
  l_wrist: {
    order: "XYZ",
    x: {
      field: "bend",
      sign: -1
    },
    y: {
      field: "turn",
      sign: 1
    },
    z: null
  },
  r_wrist: {
    order: "XYZ",
    x: {
      field: "bend",
      sign: -1
    },
    y: {
      field: "turn",
      sign: -1
    },
    z: null
  },
  l_knee: {
    order: "XYZ",
    x: {
      field: "bend",
      sign: -1
    },
    y: null,
    z: null
  },
  r_knee: {
    order: "XYZ",
    x: {
      field: "bend",
      sign: -1
    },
    y: null,
    z: null
  },
  l_ankle: {
    order: "XYZ",
    x: {
      field: "bend",
      sign: -1
    },
    y: null,
    z: null
  },
  r_ankle: {
    order: "XYZ",
    x: {
      field: "bend",
      sign: -1
    },
    y: null,
    z: null
  }
};
function vp(o, e) {
  const t = Hi[o],
    n = new Qe().setFromQuaternion(e, t.order),
    s = new Qe(-n.x, -n.y, -n.z, t.order),
    r = {},
    i = (a, l) => {
      a && (r[a.field] = a.sign * (l / _e));
    };
  return i(t.x, s.x), i(t.y, s.y), i(t.z, s.z), r;
}
function Kc(o, e, t) {
  if (t) {
    const a = t.bindQuaternions.get(e.uuid),
      l = t.restInverseQuaternions.get(e.uuid),
      d = e.quaternion.clone();
    return a && d.premultiply(a.clone().invert()), l && d.premultiply(l.clone().invert()), vp(o, d);
  }
  const n = Hi[o],
    s = new Qe().setFromQuaternion(e.quaternion.clone(), n.order),
    r = {},
    i = (a, l) => {
      a && (r[a.field] = a.sign * (l / _e));
    };
  return i(n.x, s.x), i(n.y, s.y), i(n.z, s.z), r;
}
function _p(o) {
  const e = Hi[o];
  return {
    x: !!e.x,
    y: !!e.y,
    z: !!e.z
  };
}
function kp(o, e) {
  const t = [];
  o.traverse(a => {
    a.isBone && t.push(a);
  });
  const n = {};
  t.length && Object.entries(Oi).forEach(([a, l]) => {
    const d = t.find(u => l.some(h => sl(u.name) === h)) ?? t.find(u => l.some(h => sl(u.name).includes(h)));
    d && (n[a] = d);
  });
  const s = new Map();
  Object.values(n).forEach(a => {
    a && s.set(a.uuid, a.quaternion.clone());
  });
  const r = new Map(),
    i = hp(e);
  return i && Object.keys(i).forEach(a => {
    const l = n[a],
      d = i[a];
    !l || !d || r.set(l.uuid, $c(a, d).invert());
  }), {
    bones: n,
    bindQuaternions: s,
    restInverseQuaternions: r
  };
}
function Vc(o, e) {
  switch (o) {
    case "body":
    case "torso":
      return new Qe(-e.bend * _e, e.turn * _e, e.tilt * _e, "YXZ");
    case "head":
      return new Qe(e.nod * _e, e.turn * _e, e.tilt * _e, "YXZ");
    case "l_arm":
      return new Qe(-e.raise * _e, e.turn * _e, -e.straddle * _e, "ZXY");
    case "r_arm":
      return new Qe(-e.raise * _e, -e.turn * _e, e.straddle * _e, "ZXY");
    case "l_leg":
      return new Qe(e.raise * _e, e.turn * _e, e.straddle * _e, "ZXY");
    case "r_leg":
      return new Qe(e.raise * _e, -e.turn * _e, -e.straddle * _e, "ZXY");
    case "l_elbow":
      return new Qe(-e.bend * _e, (e.turn ?? 0) * _e, 0, "XYZ");
    case "r_elbow":
      return new Qe(-e.bend * _e, -(e.turn ?? 0) * _e, 0, "XYZ");
    case "l_wrist":
      return new Qe(-e.bend * _e, (e.turn ?? 0) * _e, 0, "XYZ");
    case "r_wrist":
      return new Qe(-e.bend * _e, -(e.turn ?? 0) * _e, 0, "XYZ");
    case "l_knee":
    case "r_knee":
      return new Qe(-e.bend * _e, 0, 0);
    case "l_ankle":
    case "r_ankle":
      return new Qe(-e.bend * _e, 0, 0);
    default:
      return new Qe();
  }
}
function Fs(o, e) {
  if (!o || Object.keys(o.bones).length === 0) return !1;
  for (const t of Object.keys(Oi)) {
    const n = o.bones[t];
    if (!n || !e[t]) continue;
    const s = $c(t, e[t]),
      r = o.bindQuaternions.get(n.uuid),
      i = o.restInverseQuaternions.get(n.uuid);
    n.quaternion.copy(r), i && n.quaternion.multiply(i), n.quaternion.multiply(s);
  }
  return !0;
}
function Ap(o, e) {
  for (const t of Object.keys(Oi)) {
    const n = o[t];
    if (!n || !e[t]) continue;
    const s = Vc(t, e[t]);
    n.rotation.set(s.x, s.y, s.z, s.order);
  }
}
const Mp = {
    l_wrist: {
      joints: ["l_arm", "l_elbow"],
      effector: "l_wrist"
    },
    r_wrist: {
      joints: ["r_arm", "r_elbow"],
      effector: "r_wrist"
    },
    l_ankle: {
      joints: ["l_leg", "l_knee"],
      effector: "l_ankle"
    },
    r_ankle: {
      joints: ["r_leg", "r_knee"],
      effector: "r_ankle"
    }
  },
  ol = new Set(["l_wrist", "r_wrist", "l_ankle", "r_ankle"]),
  Ep = {
    l_arm: {
      raise: [-180, 180],
      straddle: [-180, 180],
      turn: [-180, 180]
    },
    r_arm: {
      raise: [-180, 180],
      straddle: [-180, 180],
      turn: [-180, 180]
    },
    l_elbow: {
      bend: [0, 150],
      turn: [-90, 90]
    },
    r_elbow: {
      bend: [0, 150],
      turn: [-90, 90]
    },
    l_leg: {
      raise: [-180, 180],
      straddle: [-180, 180],
      turn: [-180, 180]
    },
    r_leg: {
      raise: [-180, 180],
      straddle: [-180, 180],
      turn: [-180, 180]
    },
    l_knee: {
      bend: [0, 150]
    },
    r_knee: {
      bend: [0, 150]
    }
  };
function Cp(o, e) {
  const t = Ep[o];
  if (t) for (const n of Object.keys(e)) {
    const s = t[n];
    s && (e[n] = Math.min(s[1], Math.max(s[0], e[n])));
  }
}
const Ar = new R(),
  mo = new R(),
  go = new R(),
  xo = new R(),
  rl = new ve(),
  il = new ve(),
  al = new ve();
function jp(o, e, t, n, s = 12) {
  const r = Mp[o];
  if (!r) return null;
  const i = e[r.effector];
  if (!i) return null;
  const a = r.joints.filter(u => e[u]);
  if (!a.length) return null;
  const l = {},
    d = 1e-6;
  for (let u = 0; u < s; u++) {
    for (let h = a.length - 1; h >= 0; h--) {
      const m = a[h],
        f = e[m];
      if (f.updateWorldMatrix(!0, !1), i.updateWorldMatrix(!0, !1), f.getWorldPosition(Ar), i.getWorldPosition(mo), go.copy(mo).sub(Ar), xo.copy(t).sub(Ar), go.lengthSq() < 1e-8 || xo.lengthSq() < 1e-8) continue;
      go.normalize(), xo.normalize(), al.setFromUnitVectors(go, xo), f.getWorldQuaternion(rl);
      const p = al.multiply(rl);
      (f.parent ?? f).getWorldQuaternion(il);
      const x = il.invert().multiply(p);
      f.quaternion.copy(x), f.updateWorldMatrix(!1, !0);
      const g = Kc(m, f, n);
      Cp(m, g), l[m] = {
        ...(l[m] || {}),
        ...g
      }, n ? Fs(n, {
        [m]: g
      }) : Ap(e, {
        [m]: g
      }), f.updateWorldMatrix(!1, !0);
    }
    if (i.getWorldPosition(mo), mo.distanceToSquared(t) < d) break;
  }
  return l;
}
const O = (o, e = {}) => new Lt({
    color: o,
    roughness: 0.75,
    metalness: 0.05,
    ...e
  }),
  wt = 10251071,
  zn = 10133672,
  Mr = 5989488,
  On = 8224646,
  ll = 4950843,
  Er = 7031339,
  Sp = 3819350,
  Ut = 7317724;
function q(o, e, t, n, s = e / 2) {
  const r = new z(new Pe(o, e, t), n);
  return r.position.y = s, r.castShadow = !0, r.receiveShadow = !0, r;
}
function fe(o, e, t, n, s = 20, r = t / 2) {
  const i = new z(new ye(o, e, t, s), n);
  return i.position.y = r, i.castShadow = !0, i.receiveShadow = !0, i;
}
function Ae(...o) {
  const e = new je();
  return o.forEach(t => e.add(t)), e;
}
function qo(o) {
  o.computeBoundingBox();
  const e = o.boundingBox;
  if (!e) return o;
  const t = new R(),
    n = new R();
  return e.getSize(t), e.getCenter(n), o.translate(-n.x, -n.y, -n.z), o.scale(t.x > 1e-6 ? 1 / t.x : 1, t.y > 1e-6 ? 1 / t.y : 1, t.z > 1e-6 ? 1 / t.z : 1), o.computeBoundingBox(), o;
}
function qc() {
  return qo(new It(0.5, 0.08, 12, 48, Math.PI));
}
function Yc() {
  const o = new Pi();
  o.moveTo(-0.5, 0);
  const e = 24;
  for (let n = 0; n <= e; n++) {
    const s = Math.PI - n / e * Math.PI;
    o.lineTo(Math.cos(s) * 0.5, Math.sin(s) * 0.5);
  }
  o.lineTo(-0.5, 0);
  const t = new Ii(o, {
    depth: 1,
    bevelEnabled: !1
  });
  return t.translate(0, 0, -0.5), qo(t);
}
function Hn(o) {
  const e = new nt().setFromObject(o);
  return !e.isEmpty() && Number.isFinite(e.min.y) && Math.abs(e.min.y) > 1e-6 && (o.position.y -= e.min.y), o;
}
function Jn(o, e, t, n) {
  const r = o,
    i = [];
  for (const a of [-1, 1]) for (const l of [-1, 1]) {
    const d = fe(0.03, 0.03, r, n, 8, r / 2);
    d.position.x = a * (e / 2 - 0.05), d.position.z = l * (t / 2 - 0.05), i.push(d);
  }
  return i;
}
function Xc(o) {
  switch (o) {
    case "mesh_cube":
      return q(0.6, 0.6, 0.6, O(Ut), 0.3);
    case "mesh_sphere":
      {
        const e = new z(new St(0.35, 24, 18), O(Ut));
        return e.position.y = 0.35, e.castShadow = !0, e.receiveShadow = !0, e;
      }
    case "mesh_cylinder":
      return fe(0.3, 0.3, 0.7, O(Ut), 24, 0.35);
    case "mesh_torus":
      {
        const e = new z(new It(0.3, 0.12, 16, 32), O(Ut));
        return e.position.y = 0.35, e.rotation.x = Math.PI / 2, e.castShadow = !0, Hn(e);
      }
    case "mesh_cone":
      {
        const e = new z(new Rs(0.35, 0.7, 24), O(Ut));
        return e.position.y = 0.35, e.castShadow = !0, e.receiveShadow = !0, e;
      }
    case "mesh_pyramid":
      {
        const e = new z(new Rs(0.4, 0.6, 4), O(Ut));
        return e.position.y = 0.3, e.rotation.y = Math.PI / 4, e.castShadow = !0, e;
      }
    case "mesh_rectangle":
      return q(1, 0.7, 0.04, O(Ut), 0.35);
    case "mesh_disc":
      return fe(0.5, 0.5, 0.04, O(Ut), 48, 0.02);
    case "mesh_capsule":
      {
        const e = new z(qo(new Ni(0.5, 0.5, 8, 24)), O(Ut));
        return e.scale.set(0.6, 1.1, 0.6), e.position.y = 0.55, e.castShadow = !0, e.receiveShadow = !0, e;
      }
    case "mesh_arc":
      {
        const e = new z(qc(), O(Ut));
        return e.scale.set(1, 0.6, 0.08), e.position.y = 0.3, e.castShadow = !0, e.receiveShadow = !0, e;
      }
    case "mesh_half_cylinder":
      {
        const e = new z(Yc(), O(Ut));
        return e.scale.set(1, 0.5, 0.3), e.position.y = 0.25, e.castShadow = !0, e.receiveShadow = !0, e;
      }
    case "chair":
      {
        const e = O(wt),
          t = q(0.45, 0.05, 0.45, e, 0.45),
          n = q(0.45, 0.45, 0.05, e, 0.68);
        return n.position.z = -0.2, Ae(t, n, ...Jn(0.43, 0.45, 0.45, e));
      }
    case "sofa":
      {
        const e = O(Mr),
          t = q(1.6, 0.25, 0.7, e, 0.35),
          n = q(1.6, 0.45, 0.18, e, 0.62);
        n.position.z = -0.26;
        const s = q(0.18, 0.4, 0.7, e, 0.5);
        s.position.x = -0.71;
        const r = q(0.18, 0.4, 0.7, e, 0.5);
        return r.position.x = 0.71, Ae(t, n, s, r, ...Jn(0.22, 1.5, 0.6, O(wt)));
      }
    case "square_table":
      {
        const e = O(wt),
          t = q(1, 0.06, 1, e, 0.74);
        return Ae(t, ...Jn(0.71, 0.9, 0.9, e));
      }
    case "round_table":
      {
        const e = O(wt),
          t = fe(0.6, 0.6, 0.06, e, 32, 0.74),
          n = fe(0.06, 0.06, 0.71, e, 12, 0.355),
          s = fe(0.35, 0.35, 0.04, e, 24, 0.02);
        return Ae(t, n, s);
      }
    case "bed":
      {
        const e = O(wt),
          t = q(1.5, 0.3, 2, e, 0.3),
          n = q(1.45, 0.18, 1.95, O(15262422), 0.49),
          s = q(1.5, 0.6, 0.12, e, 0.6);
        s.position.z = -0.94;
        const r = q(1.2, 0.12, 0.4, O(Mr), 0.62);
        return r.position.z = -0.7, Hn(Ae(t, n, s, r));
      }
    case "bookshelf":
      {
        const e = O(wt),
          t = new je(),
          n = 0.9,
          s = 0.3,
          r = 1.8,
          i = 0.04;
        t.add(q(n, r, i, e, r / 2));
        const a = q(i, r, s, e, r / 2);
        a.position.x = -n / 2 + i / 2;
        const l = q(i, r, s, e, r / 2);
        l.position.x = n / 2 - i / 2, t.add(a, l);
        for (let d = 0; d <= 4; d++) t.add(q(n, i, s, e, r / 4 * d + i / 2));
        return t;
      }
    case "desk":
      {
        const e = O(wt),
          t = q(1.2, 0.06, 0.6, e, 0.73),
          n = Ae(t),
          s = 0.7,
          r = 0.06;
        for (const i of [-1, 1]) for (const a of [-1, 1]) {
          const l = q(r, s, r, e, s / 2);
          l.position.x = i * (1.2 / 2 - 0.06), l.position.z = a * (0.6 / 2 - 0.06), n.add(l);
        }
        return n;
      }
    case "stool":
      {
        const e = O(wt),
          t = fe(0.18, 0.18, 0.05, e, 20, 0.45);
        return Ae(t, ...Jn(0.43, 0.3, 0.3, e));
      }
    case "armchair":
      {
        const e = O(Mr),
          t = q(0.7, 0.25, 0.65, e, 0.35),
          n = q(0.7, 0.5, 0.16, e, 0.62);
        n.position.z = -0.24;
        const s = q(0.16, 0.38, 0.65, e, 0.5);
        s.position.x = -0.43;
        const r = q(0.16, 0.38, 0.65, e, 0.5);
        return r.position.x = 0.43, Ae(t, n, s, r, ...Jn(0.22, 0.9, 0.55, O(wt)));
      }
    case "cabinet":
      {
        const e = O(wt),
          t = new je();
        t.add(q(1, 0.75, 0.45, e, 0.42)), t.add(q(0.015, 0.6, 0.02, O(5913892), 0.42));
        for (const n of [-1, 1]) {
          const s = new z(new St(0.02, 8, 8), O(zn, {
            metalness: 0.6
          }));
          s.position.set(n * 0.08, 0.45, 0.235), t.add(s);
        }
        return t.add(q(0.9, 0.09, 0.38, e, 0.045)), t;
      }
    case "wardrobe":
      {
        const e = O(wt),
          t = new je();
        t.add(q(1, 2, 0.6, e, 1)), t.add(q(0.015, 1.8, 0.02, O(5913892), 1));
        for (const n of [-1, 1]) {
          const s = fe(0.015, 0.015, 0.16, O(zn, {
            metalness: 0.6
          }), 8, 1.05);
          s.position.set(n * 0.07, 1.05, 0.31), t.add(s);
        }
        return t;
      }
    case "tv":
      {
        const i = q(1.2, 0.68, 0.05, O(1316378, {
            roughness: 0.3,
            metalness: 0.4
          }), 0.33999999999999997 + 0.68 / 2),
          a = fe(0.03, 0.03, 0.3, O(2895670), 10, 0.04 + 0.3 / 2),
          l = q(0.5, 0.04, 0.24, O(2895670), 0.04 / 2);
        return Ae(l, a, i);
      }
    case "wall_tv":
      {
        const e = q(1.2, 0.72, 0.06, O(1316378, {
            roughness: 0.3,
            metalness: 0.4
          }), 0.36),
          t = q(1.08, 0.6, 0.008, O(329224, {
            roughness: 0.2,
            metalness: 0.25
          }), 0.36);
        return t.position.z = 0.034, Ae(e, t);
      }
    case "floor_lamp":
      {
        const e = O(2895670),
          t = fe(0.16, 0.18, 0.04, e, 20, 0.02),
          n = fe(0.02, 0.02, 1.5, e, 10, 0.79),
          s = fe(0.14, 0.2, 0.28, O(15984324, {
            emissive: 16769162,
            emissiveIntensity: 0.35
          }), 20, 1.62);
        return Ae(t, n, s);
      }
    case "table_lamp":
      {
        const e = O(2895670),
          t = fe(0.09, 0.11, 0.03, e, 16, 0.015),
          n = fe(0.015, 0.015, 0.28, e, 8, 0.17),
          s = fe(0.08, 0.12, 0.16, O(15984324, {
            emissive: 16769162,
            emissiveIntensity: 0.35
          }), 16, 0.4);
        return Ae(t, n, s);
      }
    case "rug":
      {
        const e = q(1.7, 0.02, 1.2, O(8010555), 0.01),
          t = q(1.4, 0.015, 0.9, O(13218442), 0.024);
        return Ae(e, t);
      }
    case "wall":
      return q(2, 2.4, 0.15, O(On), 1.2);
    case "column":
      {
        const e = O(On),
          t = fe(0.18, 0.18, 2.4, e, 24, 1.3),
          n = q(0.5, 0.12, 0.5, e, 2.56),
          s = q(0.5, 0.12, 0.5, e, 0.06);
        return Ae(s, t, n);
      }
    case "staircase":
      {
        const e = O(On),
          t = new je(),
          n = 6,
          s = 0.18,
          r = 0.3;
        for (let i = 0; i < n; i++) {
          const a = q(1.2, s * (i + 1), r, e, s * (i + 1) / 2);
          a.position.z = -i * r, t.add(a);
        }
        return t;
      }
    case "door":
      {
        const e = O(wt),
          t = q(1, 2.1, 0.12, O(7031339), 1.05),
          n = q(0.86, 1.96, 0.06, e, 1.03);
        n.position.z = 0.04;
        const s = new z(new St(0.04, 10, 8), O(zn, {
          metalness: 0.6
        }));
        return s.position.set(0.34, 1, 0.08), Ae(t, n, s);
      }
    case "fence":
      {
        const e = O(wt),
          t = new je(),
          n = q(2, 0.06, 0.04, e, 0.95),
          s = q(2, 0.06, 0.04, e, 0.4);
        t.add(n, s);
        for (let r = 0; r <= 8; r++) {
          const i = q(0.06, 1.1, 0.04, e, 0.55);
          i.position.x = -1 + r * 2 / 8, t.add(i);
        }
        return t;
      }
    case "ramp":
      {
        const e = new Pi();
        e.moveTo(-0.9, 0), e.lineTo(0.9, 0), e.lineTo(0.9, 0.9), e.closePath();
        const t = new Ii(e, {
          depth: 1.2,
          bevelEnabled: !1
        });
        t.translate(0, 0, -0.6);
        const n = new z(t, O(On));
        return n.castShadow = !0, n.receiveShadow = !0, n;
      }
    case "platform":
      return q(2, 0.2, 2, O(On), 0.1);
    case "arch":
      {
        const e = O(On),
          t = q(0.25, 2.2, 0.25, e, 1.1);
        t.position.x = -0.85;
        const n = q(0.25, 2.2, 0.25, e, 1.1);
        n.position.x = 0.85;
        const s = q(2.2, 0.3, 0.3, e, 2.35);
        return Ae(t, n, s);
      }
    case "ladder":
      {
        const e = O(zn, {
            metalness: 0.4
          }),
          t = new je();
        for (const n of [-1, 1]) {
          const s = q(0.05, 2.4, 0.05, e, 1.2);
          s.position.x = n * 0.22, t.add(s);
        }
        for (let n = 1; n <= 7; n++) {
          const s = fe(0.018, 0.018, 0.44, e, 8, 0.22);
          s.rotation.z = Math.PI / 2, s.position.y = n * 0.3, t.add(s);
        }
        return t;
      }
    case "statue":
      {
        const e = O(9277334, {
            roughness: 0.9
          }),
          t = q(0.7, 0.5, 0.7, e, 0.25),
          n = q(0.34, 0.75, 0.26, e, 1),
          s = new z(new St(0.13, 14, 12), e);
        s.position.y = 1.5, s.castShadow = !0;
        const r = q(0.1, 0.55, 0.16, e, 1.05);
        r.position.x = -0.25, r.rotation.z = 0.25;
        const i = q(0.1, 0.55, 0.16, e, 1.05);
        return i.position.x = 0.25, i.rotation.z = -0.25, Ae(t, n, s, r, i);
      }
    case "tree_small":
      {
        const e = fe(0.08, 0.1, 0.8, O(Er), 10, 0.4),
          t = new z(new Zn(0.5, 1), O(ll, {
            flatShading: !0
          }));
        return t.position.y = 1.15, t.castShadow = !0, Ae(e, t);
      }
    case "tree_large":
      {
        const e = fe(0.16, 0.2, 1.6, O(Er), 12, 0.8),
          t = new z(new Zn(0.9, 1), O(ll, {
            flatShading: !0
          }));
        t.position.y = 2.2, t.castShadow = !0;
        const n = new z(new Zn(0.6, 1), O(4160050, {
          flatShading: !0
        }));
        return n.position.set(0.5, 1.9, 0.2), n.castShadow = !0, Ae(e, t, n);
      }
    case "rock":
      {
        const e = new z(new Du(0.4, 0), O(On, {
          flatShading: !0
        }));
        return e.position.y = 0.3, e.scale.set(1, 0.7, 0.9), e.castShadow = !0, e.receiveShadow = !0, Hn(e);
      }
    case "bush":
      {
        const e = O(4160050, {
            flatShading: !0
          }),
          t = new je();
        for (const [n, s, r, i] of [[0, 0.25, 0, 0.35], [0.3, 0.2, 0.1, 0.28], [-0.25, 0.22, -0.1, 0.26]]) {
          const a = new z(new Zn(i, 1), e);
          a.position.set(n, s, r), a.castShadow = !0, t.add(a);
        }
        return Hn(t);
      }
    case "potted_plant":
      {
        const e = fe(0.18, 0.13, 0.28, O(11884590), 16, 0.14),
          t = fe(0.16, 0.16, 0.03, O(3811868), 16, 0.27),
          n = O(4160050, {
            flatShading: !0
          }),
          s = new je();
        s.add(e, t);
        for (const [r, i, a, l] of [[0, 0.5, 0, 0.22], [0.12, 0.42, 0.08, 0.16], [-0.1, 0.44, -0.06, 0.15]]) {
          const d = new z(new Zn(l, 1), n);
          d.position.set(r, i, a), d.castShadow = !0, s.add(d);
        }
        return s;
      }
    case "stump":
      {
        const e = fe(0.22, 0.28, 0.4, O(Er), 16, 0.2),
          t = fe(0.21, 0.21, 0.02, O(13213802), 16, 0.41);
        return Ae(e, t);
      }
    case "flower_bed":
      {
        const e = new je();
        e.add(q(1, 0.16, 1, O(10246724), 0.08)), e.add(q(0.9, 0.03, 0.9, O(3811868), 0.17));
        const t = O(4160050, {
            flatShading: !0
          }),
          n = [15231634, 16041282, 16777215, 12017617];
        let s = 0;
        for (const [r, i] of [[-0.28, -0.28], [0.25, -0.2], [-0.2, 0.26], [0.28, 0.28], [0, 0.02]]) {
          const a = new z(new Zn(0.12, 1), t);
          a.position.set(r, 0.24, i), a.castShadow = !0;
          const l = new z(new St(0.05, 10, 8), O(n[s++ % n.length]));
          l.position.set(r, 0.36, i), l.castShadow = !0, e.add(a, l);
        }
        return e;
      }
    case "car":
      {
        const e = O(12597547),
          t = new je(),
          n = q(1.8, 0.5, 4, e, 0.55),
          s = q(1.6, 0.5, 2, O(Sp, {
            metalness: 0.3
          }), 1.05);
        s.position.z = -0.2, t.add(n, s);
        for (const r of [-1, 1]) for (const i of [-1, 1]) {
          const a = new z(new ye(0.35, 0.35, 0.25, 18), O(546));
          a.rotation.z = Math.PI / 2, a.position.set(r * 0.9, 0.35, i * 1.3), a.castShadow = !0, t.add(a);
        }
        return Hn(t);
      }
    case "bicycle":
      {
        const e = O(zn, {
            metalness: 0.5
          }),
          t = O(546),
          n = new je(),
          s = 0.33;
        for (const p of [-1, 1]) {
          const x = new z(new It(s, 0.03, 10, 28), t);
          x.rotation.y = Math.PI / 2, x.position.set(0, s, p * 0.55), x.castShadow = !0;
          const g = new z(new ye(0.03, 0.03, 0.08, 10), e);
          g.rotation.z = Math.PI / 2, g.position.set(0, s, p * 0.55), n.add(x, g);
        }
        const r = (p, x, g = 0.02) => {
            const b = new R().subVectors(x, p),
              w = new z(new ye(g, g, b.length(), 8), e);
            return w.position.copy(p).addScaledVector(b, 0.5), w.quaternion.setFromUnitVectors(new R(0, 1, 0), b.clone().normalize()), w.castShadow = !0, w;
          },
          i = new R(0, s, -0.55),
          a = new R(0, s, 0.55),
          l = new R(0, 0.3, -0.1),
          d = new R(0, 0.92, -0.35),
          u = new R(0, 0.95, 0.4);
        n.add(r(i, l), r(i, d), r(l, d), r(l, u), r(d, u), r(a, u));
        const h = new z(new ye(0.02, 0.02, 0.44, 8), e);
        h.rotation.z = Math.PI / 2, h.position.set(0, 0.98, 0.42), h.castShadow = !0;
        const m = q(0.1, 0.05, 0.26, t, 0.96);
        m.position.z = -0.38;
        const f = new z(new ye(0.025, 0.025, 0.14, 10), t);
        return f.rotation.z = Math.PI / 2, f.position.copy(l), n.add(h, m, f), Hn(n);
      }
    case "truck":
      {
        const e = new je(),
          t = q(2, 1.5, 1.5, O(3107760), 1.15);
        t.position.z = 2.4;
        const n = q(1.9, 0.35, 5.6, O(2895670), 0.62);
        n.position.z = 0.3;
        const s = q(2.1, 2, 3.8, O(14146013), 1.85);
        s.position.z = -0.6, e.add(t, n, s);
        for (const [r, i] of [[-1, 2.3], [1, 2.3], [-1, -0.9], [1, -0.9], [-1, -1.9], [1, -1.9]]) {
          const a = new z(new ye(0.42, 0.42, 0.3, 18), O(546));
          a.rotation.z = Math.PI / 2, a.position.set(r * 0.95, 0.42, i), a.castShadow = !0, e.add(a);
        }
        return Hn(e);
      }
    case "streetlamp":
      {
        const e = O(2895670),
          t = fe(0.06, 0.08, 3, e, 12, 1.5),
          n = q(0.05, 0.05, 0.6, e, 3);
        n.position.z = 0.3;
        const s = new z(new St(0.12, 12, 10), O(16773568, {
          emissive: 16769162,
          emissiveIntensity: 0.6
        }));
        return s.position.set(0, 2.95, 0.6), Ae(t, n, s);
      }
    case "bench":
      {
        const e = O(wt),
          t = q(1.4, 0.06, 0.4, e, 0.45),
          n = q(1.4, 0.4, 0.06, e, 0.66);
        return n.position.z = -0.17, Ae(t, n, ...Jn(0.43, 1.3, 0.35, O(zn)));
      }
    case "trash_bin":
      {
        const e = O(3828554),
          t = fe(0.2, 0.16, 0.6, e, 16, 0.3),
          n = fe(0.22, 0.22, 0.06, e, 16, 0.63);
        return Ae(t, n);
      }
    case "traffic_cone":
      {
        const e = O(15226908, {
            emissive: 15226908,
            emissiveIntensity: 0.1
          }),
          t = new z(new Rs(0.16, 0.6, 20), e);
        t.position.y = 0.3, t.castShadow = !0;
        const n = q(0.4, 0.04, 0.4, e, 0.02),
          s = fe(0.12, 0.1, 0.08, O(16777215), 20, 0.4);
        return Ae(n, t, s);
      }
    case "fire_hydrant":
      {
        const e = O(12597547),
          t = fe(0.12, 0.14, 0.6, e, 16, 0.3),
          n = new z(new St(0.13, 16, 10), e);
        n.position.y = 0.6, n.castShadow = !0;
        const s = fe(0.05, 0.05, 0.12, e, 12, 0.42);
        s.rotation.z = Math.PI / 2, s.position.x = -0.15;
        const r = s.clone();
        return r.position.x = 0.15, Ae(t, n, s, r);
      }
    case "barrel":
      {
        const e = O(zn, {
            metalness: 0.4
          }),
          t = fe(0.3, 0.3, 0.9, e, 24, 0.45),
          n = fe(0.32, 0.32, 0.04, O(1092), 24, 0.25),
          s = fe(0.32, 0.32, 0.04, O(1092), 24, 0.65);
        return Ae(t, n, s);
      }
    case "crate":
      {
        const e = O(wt),
          t = Ae(q(0.6, 0.6, 0.6, e, 0.3)),
          n = O(7031339);
        for (const s of [0.02, 0.58]) t.add(q(0.62, 0.04, 0.62, n, s));
        return t;
      }
    case "road_barrier":
      {
        const e = O(14039599),
          t = q(1.5, 0.16, 0.55, e, 0.08),
          n = q(1.4, 0.34, 0.42, e, 0.33),
          s = q(1.42, 0.14, 0.43, O(15922165), 0.57),
          r = q(1.3, 0.28, 0.3, e, 0.78),
          i = q(1.2, 0.08, 0.34, e, 0.96);
        return Ae(t, n, s, r, i);
      }
    case "sign":
      {
        const e = fe(0.03, 0.035, 2.2, O(10133672, {
            metalness: 0.5
          }), 10, 1.1),
          t = q(0.65, 0.65, 0.03, O(2056127), 2);
        return t.position.z = 0.03, Ae(e, t);
      }
    default:
      return q(0.5, 0.5, 0.5, O(8947848), 0.25);
  }
}
new Set(Vs.map(o => o.id));
const Cr = Math.PI / 180,
  Tp = 9080985;
let jr = null;
function Pp(o) {
  if (!jr) {
    const e = new Rs(0.5, 1, 4);
    e.rotateY(Math.PI / 4);
    const t = new It(0.5, 0.15, 14, 36);
    t.rotateX(Math.PI / 2), jr = {
      cube: new Pe(1, 1, 1),
      sphere: new St(0.5, 24, 18),
      cylinder: new ye(0.5, 0.5, 1, 24),
      cone: new Rs(0.5, 1, 24),
      pyramid: e,
      torus: t,
      rectangle: new Pe(1, 1, 1),
      disc: new ye(0.5, 0.5, 1, 48),
      capsule: qo(new Ni(0.5, 0.5, 8, 24)),
      arc: qc(),
      half_cylinder: Yc()
    };
  }
  return jr[o];
}
function Ip() {
  const o = [{
      x: -0.5,
      w: 0.04,
      keel: -0.1
    }, {
      x: -0.4,
      w: 0.34,
      keel: -0.4
    }, {
      x: -0.18,
      w: 0.49,
      keel: -0.5
    }, {
      x: 0.18,
      w: 0.5,
      keel: -0.48
    }, {
      x: 0.4,
      w: 0.38,
      keel: -0.34
    }, {
      x: 0.5,
      w: 0.05,
      keel: -0.06
    }],
    e = [];
  for (const i of o) e.push(i.x, 0.5, i.w, i.x, 0.5, -i.w, i.x, i.keel, i.w * 0.48, i.x, i.keel, -i.w * 0.48);
  const t = [],
    n = (i, a, l, d) => t.push(i, a, l, i, l, d);
  for (let i = 0; i < o.length - 1; i += 1) {
    const a = i * 4,
      l = (i + 1) * 4;
    n(a, l, l + 1, a + 1), n(a, a + 2, l + 2, l), n(a + 1, l + 1, l + 3, a + 3), n(a + 2, a + 3, l + 3, l + 2);
  }
  n(0, 1, 3, 2);
  const s = (o.length - 1) * 4;
  n(s, s + 2, s + 3, s + 1);
  const r = new Pt();
  return r.setAttribute("position", new Do(e, 3)), r.setIndex(t), r.computeVertexNormals(), r;
}
function Np() {
  const o = new Lo(1, 1, 18, 14),
    e = o.getAttribute("position");
  for (let t = 0; t < e.count; t += 1) {
    const n = e.getX(t) + 0.5,
      s = e.getY(t) + 0.5;
    e.setZ(t, Math.sin(Math.PI * n) * Math.sin(Math.PI * s) * 0.5);
  }
  return e.needsUpdate = !0, o.computeVertexNormals(), o;
}
function Rp() {
  const o = [-0.5, -0.5, 0.5, 0.5, -0.5, 0.5, -0.5, -0.5, -0.5, 0.5, -0.5, -0.5, -0.3, 0.5, 0, 0.3, 0.5, 0],
    e = [0, 1, 5, 0, 5, 4, 2, 4, 5, 2, 5, 3, 0, 4, 2, 1, 3, 5],
    t = new Pt();
  return t.setAttribute("position", new Do(o, 3)), t.setIndex(e), t.computeVertexNormals(), t;
}
function Dp(o) {
  var e, t;
  if (o.shape === "extrude" || o.shape === "bezier_extrude") {
    const n = (e = o.profile) != null && e.length && o.profile.length >= 3 ? o.profile : [{
        x: -0.5,
        y: -0.5
      }, {
        x: 0.5,
        y: -0.5
      }, {
        x: 0.5,
        y: 0.5
      }, {
        x: -0.5,
        y: 0.5
      }],
      s = o.shape === "bezier_extrude" ? new Ta(n.map(a => new R(a.x, a.y, 0)), !0, "centripetal").getPoints(Math.max(32, n.length * 8)).map(a => ({
        x: a.x,
        y: a.y
      })) : n,
      r = new Pi();
    r.moveTo(s[0].x, s[0].y);
    for (let a = 1; a < s.length; a += 1) r.lineTo(s[a].x, s[a].y);
    r.closePath();
    const i = new Ii(r, {
      depth: 1,
      steps: 1,
      bevelEnabled: o.shape === "bezier_extrude",
      bevelSize: 0.015,
      bevelThickness: 0.015,
      bevelSegments: 2
    });
    return i.translate(0, 0, -0.5), i;
  }
  if (o.shape === "tube") {
    const n = (t = o.path) != null && t.length && o.path.length >= 2 ? o.path : [{
        x: -0.5,
        y: 0,
        z: 0
      }, {
        x: 0.5,
        y: 0,
        z: 0
      }],
      s = new Ta(n.map(r => new R(r.x, r.y, r.z)), !1, "centripetal");
    return new Lu(s, Math.max(12, n.length * 8), o.radius ?? 0.035, 8, !1);
  }
  return o.shape === "hull" ? Ip() : o.shape === "curved_panel" ? Np() : o.shape === "hip_roof" ? Rp() : Pp(o.shape);
}
function Lp(o) {
  var t, n;
  const e = new je();
  for (const s of o) {
    let r = Tp;
    if (s.color) try {
      r = new Ze(s.color).getHex();
    } catch {}
    const i = new z(Dp(s), O(r));
    if (s.shape === "torus") {
      const d = Math.max(s.size.x, 0.05),
        u = Math.max(Math.min(s.size.y, d * 0.45), 0.01),
        h = d / 1.3;
      i.scale.set(h, u / 0.3, h);
    } else i.scale.set(s.size.x, s.size.y, s.size.z);
    i.position.set(s.position.x, s.position.y, s.position.z), s.rotation && i.rotation.set(s.rotation.x * Cr, s.rotation.y * Cr, s.rotation.z * Cr), i.castShadow = !0, i.receiveShadow = !0;
    const a = ((t = s.repeat) == null ? void 0 : t.count) ?? 1,
      l = (n = s.repeat) == null ? void 0 : n.offset;
    for (let d = 0; d < a; d += 1) {
      const u = d === 0 ? i : i.clone();
      l && u.position.add(new R(l.x * d, l.y * d, l.z * d)), e.add(u);
    }
  }
  return e;
}
function cl(o, e) {
  if (e === zu) return console.warn("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Geometry already defined as triangles."), o;
  if (e === hi || e === pc) {
    let t = o.getIndex();
    if (t === null) {
      const i = [],
        a = o.getAttribute("position");
      if (a !== void 0) {
        for (let l = 0; l < a.count; l++) i.push(l);
        o.setIndex(i), t = o.getIndex();
      } else return console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Undefined position attribute. Processing not possible."), o;
    }
    const n = t.count - 2,
      s = [];
    if (e === hi) for (let i = 1; i <= n; i++) s.push(t.getX(0)), s.push(t.getX(i)), s.push(t.getX(i + 1));else for (let i = 0; i < n; i++) i % 2 === 0 ? (s.push(t.getX(i)), s.push(t.getX(i + 1)), s.push(t.getX(i + 2))) : (s.push(t.getX(i + 2)), s.push(t.getX(i + 1)), s.push(t.getX(i)));
    s.length / 3 !== n && console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unable to generate correct amount of triangles.");
    const r = o.clone();
    return r.setIndex(s), r.clearGroups(), r;
  } else return console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unknown draw mode:", e), o;
}
class zp extends Ou {
  constructor(e) {
    super(e), this.dracoLoader = null, this.ktx2Loader = null, this.meshoptDecoder = null, this.pluginCallbacks = [], this.register(function (t) {
      return new Up(t);
    }), this.register(function (t) {
      return new Qp(t);
    }), this.register(function (t) {
      return new Zp(t);
    }), this.register(function (t) {
      return new Jp(t);
    }), this.register(function (t) {
      return new $p(t);
    }), this.register(function (t) {
      return new Kp(t);
    }), this.register(function (t) {
      return new Vp(t);
    }), this.register(function (t) {
      return new qp(t);
    }), this.register(function (t) {
      return new Bp(t);
    }), this.register(function (t) {
      return new Yp(t);
    }), this.register(function (t) {
      return new Gp(t);
    }), this.register(function (t) {
      return new Wp(t);
    }), this.register(function (t) {
      return new Xp(t);
    }), this.register(function (t) {
      return new Hp(t);
    }), this.register(function (t) {
      return new ef(t);
    }), this.register(function (t) {
      return new tf(t);
    });
  }
  load(e, t, n, s) {
    const r = this;
    let i;
    if (this.resourcePath !== "") i = this.resourcePath;else if (this.path !== "") {
      const d = Ds.extractUrlBase(e);
      i = Ds.resolveURL(d, this.path);
    } else i = Ds.extractUrlBase(e);
    this.manager.itemStart(e);
    const a = function (d) {
        s ? s(d) : console.error(d), r.manager.itemError(e), r.manager.itemEnd(e);
      },
      l = new fc(this.manager);
    l.setPath(this.path), l.setResponseType("arraybuffer"), l.setRequestHeader(this.requestHeader), l.setWithCredentials(this.withCredentials), l.load(e, function (d) {
      try {
        r.parse(d, i, function (u) {
          t(u), r.manager.itemEnd(e);
        }, a);
      } catch (u) {
        a(u);
      }
    }, n, a);
  }
  setDRACOLoader(e) {
    return this.dracoLoader = e, this;
  }
  setDDSLoader() {
    throw new Error('THREE.GLTFLoader: "MSFT_texture_dds" no longer supported. Please update to "KHR_texture_basisu".');
  }
  setKTX2Loader(e) {
    return this.ktx2Loader = e, this;
  }
  setMeshoptDecoder(e) {
    return this.meshoptDecoder = e, this;
  }
  register(e) {
    return this.pluginCallbacks.indexOf(e) === -1 && this.pluginCallbacks.push(e), this;
  }
  unregister(e) {
    return this.pluginCallbacks.indexOf(e) !== -1 && this.pluginCallbacks.splice(this.pluginCallbacks.indexOf(e), 1), this;
  }
  parse(e, t, n, s) {
    let r;
    const i = {},
      a = {},
      l = new TextDecoder();
    if (typeof e == "string") r = JSON.parse(e);else if (e instanceof ArrayBuffer) {
      if (l.decode(new Uint8Array(e, 0, 4)) === Wc) {
        try {
          i[le.KHR_BINARY_GLTF] = new nf(e);
        } catch (h) {
          s && s(h);
          return;
        }
        r = JSON.parse(i[le.KHR_BINARY_GLTF].content);
      } else r = JSON.parse(l.decode(e));
    } else r = e;
    if (r.asset === void 0 || r.asset.version[0] < 2) {
      s && s(new Error("THREE.GLTFLoader: Unsupported asset. glTF versions >=2.0 are supported."));
      return;
    }
    const d = new gf(r, {
      path: t || this.resourcePath || "",
      crossOrigin: this.crossOrigin,
      requestHeader: this.requestHeader,
      manager: this.manager,
      ktx2Loader: this.ktx2Loader,
      meshoptDecoder: this.meshoptDecoder
    });
    d.fileLoader.setRequestHeader(this.requestHeader);
    for (let u = 0; u < this.pluginCallbacks.length; u++) {
      const h = this.pluginCallbacks[u](d);
      h.name || console.error("THREE.GLTFLoader: Invalid plugin found: missing name"), a[h.name] = h, i[h.name] = !0;
    }
    if (r.extensionsUsed) for (let u = 0; u < r.extensionsUsed.length; ++u) {
      const h = r.extensionsUsed[u],
        m = r.extensionsRequired || [];
      switch (h) {
        case le.KHR_MATERIALS_UNLIT:
          i[h] = new Fp();
          break;
        case le.KHR_DRACO_MESH_COMPRESSION:
          i[h] = new sf(r, this.dracoLoader);
          break;
        case le.KHR_TEXTURE_TRANSFORM:
          i[h] = new of();
          break;
        case le.KHR_MESH_QUANTIZATION:
          i[h] = new rf();
          break;
        default:
          m.indexOf(h) >= 0 && a[h] === void 0 && console.warn('THREE.GLTFLoader: Unknown extension "' + h + '".');
      }
    }
    d.setExtensions(i), d.setPlugins(a), d.parse(n, s);
  }
  parseAsync(e, t) {
    const n = this;
    return new Promise(function (s, r) {
      n.parse(e, t, s, r);
    });
  }
}
function Op() {
  let o = {};
  return {
    get: function (e) {
      return o[e];
    },
    add: function (e, t) {
      o[e] = t;
    },
    remove: function (e) {
      delete o[e];
    },
    removeAll: function () {
      o = {};
    }
  };
}
const le = {
  KHR_BINARY_GLTF: "KHR_binary_glTF",
  KHR_DRACO_MESH_COMPRESSION: "KHR_draco_mesh_compression",
  KHR_LIGHTS_PUNCTUAL: "KHR_lights_punctual",
  KHR_MATERIALS_CLEARCOAT: "KHR_materials_clearcoat",
  KHR_MATERIALS_IOR: "KHR_materials_ior",
  KHR_MATERIALS_SHEEN: "KHR_materials_sheen",
  KHR_MATERIALS_SPECULAR: "KHR_materials_specular",
  KHR_MATERIALS_TRANSMISSION: "KHR_materials_transmission",
  KHR_MATERIALS_IRIDESCENCE: "KHR_materials_iridescence",
  KHR_MATERIALS_ANISOTROPY: "KHR_materials_anisotropy",
  KHR_MATERIALS_UNLIT: "KHR_materials_unlit",
  KHR_MATERIALS_VOLUME: "KHR_materials_volume",
  KHR_TEXTURE_BASISU: "KHR_texture_basisu",
  KHR_TEXTURE_TRANSFORM: "KHR_texture_transform",
  KHR_MESH_QUANTIZATION: "KHR_mesh_quantization",
  KHR_MATERIALS_EMISSIVE_STRENGTH: "KHR_materials_emissive_strength",
  EXT_MATERIALS_BUMP: "EXT_materials_bump",
  EXT_TEXTURE_WEBP: "EXT_texture_webp",
  EXT_TEXTURE_AVIF: "EXT_texture_avif",
  EXT_MESHOPT_COMPRESSION: "EXT_meshopt_compression",
  EXT_MESH_GPU_INSTANCING: "EXT_mesh_gpu_instancing"
};
class Hp {
  constructor(e) {
    this.parser = e, this.name = le.KHR_LIGHTS_PUNCTUAL, this.cache = {
      refs: {},
      uses: {}
    };
  }
  _markDefs() {
    const e = this.parser,
      t = this.parser.json.nodes || [];
    for (let n = 0, s = t.length; n < s; n++) {
      const r = t[n];
      r.extensions && r.extensions[this.name] && r.extensions[this.name].light !== void 0 && e._addNodeRef(this.cache, r.extensions[this.name].light);
    }
  }
  _loadLight(e) {
    const t = this.parser,
      n = "light:" + e;
    let s = t.cache.get(n);
    if (s) return s;
    const r = t.json,
      l = ((r.extensions && r.extensions[this.name] || {}).lights || [])[e];
    let d;
    const u = new Ze(16777215);
    l.color !== void 0 && u.setRGB(l.color[0], l.color[1], l.color[2], Tn);
    const h = l.range !== void 0 ? l.range : 0;
    switch (l.type) {
      case "directional":
        d = new Gn(u), d.target.position.set(0, 0, -1), d.add(d.target);
        break;
      case "point":
        d = new Fu(u), d.distance = h;
        break;
      case "spot":
        d = new Hu(u), d.distance = h, l.spot = l.spot || {}, l.spot.innerConeAngle = l.spot.innerConeAngle !== void 0 ? l.spot.innerConeAngle : 0, l.spot.outerConeAngle = l.spot.outerConeAngle !== void 0 ? l.spot.outerConeAngle : Math.PI / 4, d.angle = l.spot.outerConeAngle, d.penumbra = 1 - l.spot.innerConeAngle / l.spot.outerConeAngle, d.target.position.set(0, 0, -1), d.add(d.target);
        break;
      default:
        throw new Error("THREE.GLTFLoader: Unexpected light type: " + l.type);
    }
    return d.position.set(0, 0, 0), d.decay = 2, En(d, l), l.intensity !== void 0 && (d.intensity = l.intensity), d.name = t.createUniqueName(l.name || "light_" + e), s = Promise.resolve(d), t.cache.add(n, s), s;
  }
  getDependency(e, t) {
    if (e === "light") return this._loadLight(t);
  }
  createNodeAttachment(e) {
    const t = this,
      n = this.parser,
      r = n.json.nodes[e],
      a = (r.extensions && r.extensions[this.name] || {}).light;
    return a === void 0 ? null : this._loadLight(a).then(function (l) {
      return n._getNodeRef(t.cache, a, l);
    });
  }
}
class Fp {
  constructor() {
    this.name = le.KHR_MATERIALS_UNLIT;
  }
  getMaterialType() {
    return ct;
  }
  extendParams(e, t, n) {
    const s = [];
    e.color = new Ze(1, 1, 1), e.opacity = 1;
    const r = t.pbrMetallicRoughness;
    if (r) {
      if (Array.isArray(r.baseColorFactor)) {
        const i = r.baseColorFactor;
        e.color.setRGB(i[0], i[1], i[2], Tn), e.opacity = i[3];
      }
      r.baseColorTexture !== void 0 && s.push(n.assignTexture(e, "map", r.baseColorTexture, $t));
    }
    return Promise.all(s);
  }
}
class Bp {
  constructor(e) {
    this.parser = e, this.name = le.KHR_MATERIALS_EMISSIVE_STRENGTH;
  }
  extendMaterialParams(e, t) {
    const s = this.parser.json.materials[e];
    if (!s.extensions || !s.extensions[this.name]) return Promise.resolve();
    const r = s.extensions[this.name].emissiveStrength;
    return r !== void 0 && (t.emissiveIntensity = r), Promise.resolve();
  }
}
class Up {
  constructor(e) {
    this.parser = e, this.name = le.KHR_MATERIALS_CLEARCOAT;
  }
  getMaterialType(e) {
    const n = this.parser.json.materials[e];
    return !n.extensions || !n.extensions[this.name] ? null : mn;
  }
  extendMaterialParams(e, t) {
    const n = this.parser,
      s = n.json.materials[e];
    if (!s.extensions || !s.extensions[this.name]) return Promise.resolve();
    const r = [],
      i = s.extensions[this.name];
    if (i.clearcoatFactor !== void 0 && (t.clearcoat = i.clearcoatFactor), i.clearcoatTexture !== void 0 && r.push(n.assignTexture(t, "clearcoatMap", i.clearcoatTexture)), i.clearcoatRoughnessFactor !== void 0 && (t.clearcoatRoughness = i.clearcoatRoughnessFactor), i.clearcoatRoughnessTexture !== void 0 && r.push(n.assignTexture(t, "clearcoatRoughnessMap", i.clearcoatRoughnessTexture)), i.clearcoatNormalTexture !== void 0 && (r.push(n.assignTexture(t, "clearcoatNormalMap", i.clearcoatNormalTexture)), i.clearcoatNormalTexture.scale !== void 0)) {
      const a = i.clearcoatNormalTexture.scale;
      t.clearcoatNormalScale = new yt(a, a);
    }
    return Promise.all(r);
  }
}
class Gp {
  constructor(e) {
    this.parser = e, this.name = le.KHR_MATERIALS_IRIDESCENCE;
  }
  getMaterialType(e) {
    const n = this.parser.json.materials[e];
    return !n.extensions || !n.extensions[this.name] ? null : mn;
  }
  extendMaterialParams(e, t) {
    const n = this.parser,
      s = n.json.materials[e];
    if (!s.extensions || !s.extensions[this.name]) return Promise.resolve();
    const r = [],
      i = s.extensions[this.name];
    return i.iridescenceFactor !== void 0 && (t.iridescence = i.iridescenceFactor), i.iridescenceTexture !== void 0 && r.push(n.assignTexture(t, "iridescenceMap", i.iridescenceTexture)), i.iridescenceIor !== void 0 && (t.iridescenceIOR = i.iridescenceIor), t.iridescenceThicknessRange === void 0 && (t.iridescenceThicknessRange = [100, 400]), i.iridescenceThicknessMinimum !== void 0 && (t.iridescenceThicknessRange[0] = i.iridescenceThicknessMinimum), i.iridescenceThicknessMaximum !== void 0 && (t.iridescenceThicknessRange[1] = i.iridescenceThicknessMaximum), i.iridescenceThicknessTexture !== void 0 && r.push(n.assignTexture(t, "iridescenceThicknessMap", i.iridescenceThicknessTexture)), Promise.all(r);
  }
}
class $p {
  constructor(e) {
    this.parser = e, this.name = le.KHR_MATERIALS_SHEEN;
  }
  getMaterialType(e) {
    const n = this.parser.json.materials[e];
    return !n.extensions || !n.extensions[this.name] ? null : mn;
  }
  extendMaterialParams(e, t) {
    const n = this.parser,
      s = n.json.materials[e];
    if (!s.extensions || !s.extensions[this.name]) return Promise.resolve();
    const r = [];
    t.sheenColor = new Ze(0, 0, 0), t.sheenRoughness = 0, t.sheen = 1;
    const i = s.extensions[this.name];
    if (i.sheenColorFactor !== void 0) {
      const a = i.sheenColorFactor;
      t.sheenColor.setRGB(a[0], a[1], a[2], Tn);
    }
    return i.sheenRoughnessFactor !== void 0 && (t.sheenRoughness = i.sheenRoughnessFactor), i.sheenColorTexture !== void 0 && r.push(n.assignTexture(t, "sheenColorMap", i.sheenColorTexture, $t)), i.sheenRoughnessTexture !== void 0 && r.push(n.assignTexture(t, "sheenRoughnessMap", i.sheenRoughnessTexture)), Promise.all(r);
  }
}
class Kp {
  constructor(e) {
    this.parser = e, this.name = le.KHR_MATERIALS_TRANSMISSION;
  }
  getMaterialType(e) {
    const n = this.parser.json.materials[e];
    return !n.extensions || !n.extensions[this.name] ? null : mn;
  }
  extendMaterialParams(e, t) {
    const n = this.parser,
      s = n.json.materials[e];
    if (!s.extensions || !s.extensions[this.name]) return Promise.resolve();
    const r = [],
      i = s.extensions[this.name];
    return i.transmissionFactor !== void 0 && (t.transmission = i.transmissionFactor), i.transmissionTexture !== void 0 && r.push(n.assignTexture(t, "transmissionMap", i.transmissionTexture)), Promise.all(r);
  }
}
class Vp {
  constructor(e) {
    this.parser = e, this.name = le.KHR_MATERIALS_VOLUME;
  }
  getMaterialType(e) {
    const n = this.parser.json.materials[e];
    return !n.extensions || !n.extensions[this.name] ? null : mn;
  }
  extendMaterialParams(e, t) {
    const n = this.parser,
      s = n.json.materials[e];
    if (!s.extensions || !s.extensions[this.name]) return Promise.resolve();
    const r = [],
      i = s.extensions[this.name];
    t.thickness = i.thicknessFactor !== void 0 ? i.thicknessFactor : 0, i.thicknessTexture !== void 0 && r.push(n.assignTexture(t, "thicknessMap", i.thicknessTexture)), t.attenuationDistance = i.attenuationDistance || 1 / 0;
    const a = i.attenuationColor || [1, 1, 1];
    return t.attenuationColor = new Ze().setRGB(a[0], a[1], a[2], Tn), Promise.all(r);
  }
}
class qp {
  constructor(e) {
    this.parser = e, this.name = le.KHR_MATERIALS_IOR;
  }
  getMaterialType(e) {
    const n = this.parser.json.materials[e];
    return !n.extensions || !n.extensions[this.name] ? null : mn;
  }
  extendMaterialParams(e, t) {
    const s = this.parser.json.materials[e];
    if (!s.extensions || !s.extensions[this.name]) return Promise.resolve();
    const r = s.extensions[this.name];
    return t.ior = r.ior !== void 0 ? r.ior : 1.5, Promise.resolve();
  }
}
class Yp {
  constructor(e) {
    this.parser = e, this.name = le.KHR_MATERIALS_SPECULAR;
  }
  getMaterialType(e) {
    const n = this.parser.json.materials[e];
    return !n.extensions || !n.extensions[this.name] ? null : mn;
  }
  extendMaterialParams(e, t) {
    const n = this.parser,
      s = n.json.materials[e];
    if (!s.extensions || !s.extensions[this.name]) return Promise.resolve();
    const r = [],
      i = s.extensions[this.name];
    t.specularIntensity = i.specularFactor !== void 0 ? i.specularFactor : 1, i.specularTexture !== void 0 && r.push(n.assignTexture(t, "specularIntensityMap", i.specularTexture));
    const a = i.specularColorFactor || [1, 1, 1];
    return t.specularColor = new Ze().setRGB(a[0], a[1], a[2], Tn), i.specularColorTexture !== void 0 && r.push(n.assignTexture(t, "specularColorMap", i.specularColorTexture, $t)), Promise.all(r);
  }
}
class Xp {
  constructor(e) {
    this.parser = e, this.name = le.EXT_MATERIALS_BUMP;
  }
  getMaterialType(e) {
    const n = this.parser.json.materials[e];
    return !n.extensions || !n.extensions[this.name] ? null : mn;
  }
  extendMaterialParams(e, t) {
    const n = this.parser,
      s = n.json.materials[e];
    if (!s.extensions || !s.extensions[this.name]) return Promise.resolve();
    const r = [],
      i = s.extensions[this.name];
    return t.bumpScale = i.bumpFactor !== void 0 ? i.bumpFactor : 1, i.bumpTexture !== void 0 && r.push(n.assignTexture(t, "bumpMap", i.bumpTexture)), Promise.all(r);
  }
}
class Wp {
  constructor(e) {
    this.parser = e, this.name = le.KHR_MATERIALS_ANISOTROPY;
  }
  getMaterialType(e) {
    const n = this.parser.json.materials[e];
    return !n.extensions || !n.extensions[this.name] ? null : mn;
  }
  extendMaterialParams(e, t) {
    const n = this.parser,
      s = n.json.materials[e];
    if (!s.extensions || !s.extensions[this.name]) return Promise.resolve();
    const r = [],
      i = s.extensions[this.name];
    return i.anisotropyStrength !== void 0 && (t.anisotropy = i.anisotropyStrength), i.anisotropyRotation !== void 0 && (t.anisotropyRotation = i.anisotropyRotation), i.anisotropyTexture !== void 0 && r.push(n.assignTexture(t, "anisotropyMap", i.anisotropyTexture)), Promise.all(r);
  }
}
class Qp {
  constructor(e) {
    this.parser = e, this.name = le.KHR_TEXTURE_BASISU;
  }
  loadTexture(e) {
    const t = this.parser,
      n = t.json,
      s = n.textures[e];
    if (!s.extensions || !s.extensions[this.name]) return null;
    const r = s.extensions[this.name],
      i = t.options.ktx2Loader;
    if (!i) {
      if (n.extensionsRequired && n.extensionsRequired.indexOf(this.name) >= 0) throw new Error("THREE.GLTFLoader: setKTX2Loader must be called before loading KTX2 textures");
      return null;
    }
    return t.loadTextureImage(e, r.source, i);
  }
}
class Zp {
  constructor(e) {
    this.parser = e, this.name = le.EXT_TEXTURE_WEBP, this.isSupported = null;
  }
  loadTexture(e) {
    const t = this.name,
      n = this.parser,
      s = n.json,
      r = s.textures[e];
    if (!r.extensions || !r.extensions[t]) return null;
    const i = r.extensions[t],
      a = s.images[i.source];
    let l = n.textureLoader;
    if (a.uri) {
      const d = n.options.manager.getHandler(a.uri);
      d !== null && (l = d);
    }
    return this.detectSupport().then(function (d) {
      if (d) return n.loadTextureImage(e, i.source, l);
      if (s.extensionsRequired && s.extensionsRequired.indexOf(t) >= 0) throw new Error("THREE.GLTFLoader: WebP required by asset but unsupported.");
      return n.loadTexture(e);
    });
  }
  detectSupport() {
    return this.isSupported || (this.isSupported = new Promise(function (e) {
      const t = new Image();
      t.src = "data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA", t.onload = t.onerror = function () {
        e(t.height === 1);
      };
    })), this.isSupported;
  }
}
class Jp {
  constructor(e) {
    this.parser = e, this.name = le.EXT_TEXTURE_AVIF, this.isSupported = null;
  }
  loadTexture(e) {
    const t = this.name,
      n = this.parser,
      s = n.json,
      r = s.textures[e];
    if (!r.extensions || !r.extensions[t]) return null;
    const i = r.extensions[t],
      a = s.images[i.source];
    let l = n.textureLoader;
    if (a.uri) {
      const d = n.options.manager.getHandler(a.uri);
      d !== null && (l = d);
    }
    return this.detectSupport().then(function (d) {
      if (d) return n.loadTextureImage(e, i.source, l);
      if (s.extensionsRequired && s.extensionsRequired.indexOf(t) >= 0) throw new Error("THREE.GLTFLoader: AVIF required by asset but unsupported.");
      return n.loadTexture(e);
    });
  }
  detectSupport() {
    return this.isSupported || (this.isSupported = new Promise(function (e) {
      const t = new Image();
      t.src = "data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAABcAAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAEAAAABAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQAMAAAAABNjb2xybmNseAACAAIABoAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAAB9tZGF0EgAKCBgABogQEDQgMgkQAAAAB8dSLfI=", t.onload = t.onerror = function () {
        e(t.height === 1);
      };
    })), this.isSupported;
  }
}
class ef {
  constructor(e) {
    this.name = le.EXT_MESHOPT_COMPRESSION, this.parser = e;
  }
  loadBufferView(e) {
    const t = this.parser.json,
      n = t.bufferViews[e];
    if (n.extensions && n.extensions[this.name]) {
      const s = n.extensions[this.name],
        r = this.parser.getDependency("buffer", s.buffer),
        i = this.parser.options.meshoptDecoder;
      if (!i || !i.supported) {
        if (t.extensionsRequired && t.extensionsRequired.indexOf(this.name) >= 0) throw new Error("THREE.GLTFLoader: setMeshoptDecoder must be called before loading compressed files");
        return null;
      }
      return r.then(function (a) {
        const l = s.byteOffset || 0,
          d = s.byteLength || 0,
          u = s.count,
          h = s.byteStride,
          m = new Uint8Array(a, l, d);
        return i.decodeGltfBufferAsync ? i.decodeGltfBufferAsync(u, h, m, s.mode, s.filter).then(function (f) {
          return f.buffer;
        }) : i.ready.then(function () {
          const f = new ArrayBuffer(u * h);
          return i.decodeGltfBuffer(new Uint8Array(f), u, h, m, s.mode, s.filter), f;
        });
      });
    } else return null;
  }
}
class tf {
  constructor(e) {
    this.name = le.EXT_MESH_GPU_INSTANCING, this.parser = e;
  }
  createNodeMesh(e) {
    const t = this.parser.json,
      n = t.nodes[e];
    if (!n.extensions || !n.extensions[this.name] || n.mesh === void 0) return null;
    const s = t.meshes[n.mesh];
    for (const d of s.primitives) if (d.mode !== Dt.TRIANGLES && d.mode !== Dt.TRIANGLE_STRIP && d.mode !== Dt.TRIANGLE_FAN && d.mode !== void 0) return null;
    const i = n.extensions[this.name].attributes,
      a = [],
      l = {};
    for (const d in i) a.push(this.parser.getDependency("accessor", i[d]).then(u => (l[d] = u, l[d])));
    return a.length < 1 ? null : (a.push(this.parser.createNodeMesh(e)), Promise.all(a).then(d => {
      const u = d.pop(),
        h = u.isGroup ? u.children : [u],
        m = d[0].count,
        f = [];
      for (const p of h) {
        const x = new hs(),
          g = new R(),
          b = new ve(),
          w = new R(1, 1, 1),
          v = new Bu(p.geometry, p.material, m);
        for (let E = 0; E < m; E++) l.TRANSLATION && g.fromBufferAttribute(l.TRANSLATION, E), l.ROTATION && b.fromBufferAttribute(l.ROTATION, E), l.SCALE && w.fromBufferAttribute(l.SCALE, E), v.setMatrixAt(E, x.compose(g, b, w));
        for (const E in l) if (E === "_COLOR_0") {
          const T = l[E];
          v.instanceColor = new Uu(T.array, T.itemSize, T.normalized);
        } else E !== "TRANSLATION" && E !== "ROTATION" && E !== "SCALE" && p.geometry.setAttribute(E, l[E]);
        Ot.prototype.copy.call(v, p), this.parser.assignFinalMaterial(v), f.push(v);
      }
      return u.isGroup ? (u.clear(), u.add(...f), u) : f[0];
    }));
  }
}
const Wc = "glTF",
  Ms = 12,
  dl = {
    JSON: 1313821514,
    BIN: 5130562
  };
class nf {
  constructor(e) {
    this.name = le.KHR_BINARY_GLTF, this.content = null, this.body = null;
    const t = new DataView(e, 0, Ms),
      n = new TextDecoder();
    if (this.header = {
      magic: n.decode(new Uint8Array(e.slice(0, 4))),
      version: t.getUint32(4, !0),
      length: t.getUint32(8, !0)
    }, this.header.magic !== Wc) throw new Error("THREE.GLTFLoader: Unsupported glTF-Binary header.");
    if (this.header.version < 2) throw new Error("THREE.GLTFLoader: Legacy binary file detected.");
    const s = this.header.length - Ms,
      r = new DataView(e, Ms);
    let i = 0;
    for (; i < s;) {
      const a = r.getUint32(i, !0);
      i += 4;
      const l = r.getUint32(i, !0);
      if (i += 4, l === dl.JSON) {
        const d = new Uint8Array(e, Ms + i, a);
        this.content = n.decode(d);
      } else if (l === dl.BIN) {
        const d = Ms + i;
        this.body = e.slice(d, d + a);
      }
      i += a;
    }
    if (this.content === null) throw new Error("THREE.GLTFLoader: JSON content not found.");
  }
}
class sf {
  constructor(e, t) {
    if (!t) throw new Error("THREE.GLTFLoader: No DRACOLoader instance provided.");
    this.name = le.KHR_DRACO_MESH_COMPRESSION, this.json = e, this.dracoLoader = t, this.dracoLoader.preload();
  }
  decodePrimitive(e, t) {
    const n = this.json,
      s = this.dracoLoader,
      r = e.extensions[this.name].bufferView,
      i = e.extensions[this.name].attributes,
      a = {},
      l = {},
      d = {};
    for (const u in i) {
      const h = bi[u] || u.toLowerCase();
      a[h] = i[u];
    }
    for (const u in e.attributes) {
      const h = bi[u] || u.toLowerCase();
      if (i[u] !== void 0) {
        const m = n.accessors[e.attributes[u]],
          f = ds[m.componentType];
        d[h] = f.name, l[h] = m.normalized === !0;
      }
    }
    return t.getDependency("bufferView", r).then(function (u) {
      return new Promise(function (h) {
        s.decodeDracoFile(u, function (m) {
          for (const f in m.attributes) {
            const p = m.attributes[f],
              x = l[f];
            x !== void 0 && (p.normalized = x);
          }
          h(m);
        }, a, d);
      });
    });
  }
}
class of {
  constructor() {
    this.name = le.KHR_TEXTURE_TRANSFORM;
  }
  extendTexture(e, t) {
    return (t.texCoord === void 0 || t.texCoord === e.channel) && t.offset === void 0 && t.rotation === void 0 && t.scale === void 0 || (e = e.clone(), t.texCoord !== void 0 && (e.channel = t.texCoord), t.offset !== void 0 && e.offset.fromArray(t.offset), t.rotation !== void 0 && (e.rotation = t.rotation), t.scale !== void 0 && e.repeat.fromArray(t.scale), e.needsUpdate = !0), e;
  }
}
class rf {
  constructor() {
    this.name = le.KHR_MESH_QUANTIZATION;
  }
}
class Qc extends ih {
  constructor(e, t, n, s) {
    super(e, t, n, s);
  }
  copySampleValue_(e) {
    const t = this.resultBuffer,
      n = this.sampleValues,
      s = this.valueSize,
      r = e * s * 3 + s;
    for (let i = 0; i !== s; i++) t[i] = n[r + i];
    return t;
  }
  interpolate_(e, t, n, s) {
    const r = this.resultBuffer,
      i = this.sampleValues,
      a = this.valueSize,
      l = a * 2,
      d = a * 3,
      u = s - t,
      h = (n - t) / u,
      m = h * h,
      f = m * h,
      p = e * d,
      x = p - d,
      g = -2 * f + 3 * m,
      b = f - m,
      w = 1 - g,
      v = b - m + h;
    for (let E = 0; E !== a; E++) {
      const T = i[x + E + a],
        P = i[x + E + l] * u,
        C = i[p + E + a],
        M = i[p + E] * u;
      r[E] = w * T + v * P + g * C + b * M;
    }
    return r;
  }
}
const af = new ve();
class lf extends Qc {
  interpolate_(e, t, n, s) {
    const r = super.interpolate_(e, t, n, s);
    return af.fromArray(r).normalize().toArray(r), r;
  }
}
const Dt = {
    POINTS: 0,
    LINES: 1,
    LINE_LOOP: 2,
    LINE_STRIP: 3,
    TRIANGLES: 4,
    TRIANGLE_STRIP: 5,
    TRIANGLE_FAN: 6
  },
  ds = {
    5120: Int8Array,
    5121: Uint8Array,
    5122: Int16Array,
    5123: Uint16Array,
    5125: Uint32Array,
    5126: Float32Array
  },
  ul = {
    9728: Yu,
    9729: gc,
    9984: qu,
    9985: Vu,
    9986: Ku,
    9987: mc
  },
  hl = {
    33071: Wu,
    33648: Xu,
    10497: fi
  },
  Sr = {
    SCALAR: 1,
    VEC2: 2,
    VEC3: 3,
    VEC4: 4,
    MAT2: 4,
    MAT3: 9,
    MAT4: 16
  },
  bi = {
    POSITION: "position",
    NORMAL: "normal",
    TANGENT: "tangent",
    TEXCOORD_0: "uv",
    TEXCOORD_1: "uv1",
    TEXCOORD_2: "uv2",
    TEXCOORD_3: "uv3",
    COLOR_0: "color",
    WEIGHTS_0: "skinWeight",
    JOINTS_0: "skinIndex"
  },
  yn = {
    scale: "scale",
    translation: "position",
    rotation: "quaternion",
    weights: "morphTargetInfluences"
  },
  cf = {
    CUBICSPLINE: void 0,
    LINEAR: yc,
    STEP: sh
  },
  Tr = {
    OPAQUE: "OPAQUE",
    MASK: "MASK",
    BLEND: "BLEND"
  };
function df(o) {
  return o.DefaultMaterial === void 0 && (o.DefaultMaterial = new Lt({
    color: 16777215,
    emissive: 0,
    metalness: 1,
    roughness: 1,
    transparent: !1,
    depthTest: !0,
    side: rh
  })), o.DefaultMaterial;
}
function Fn(o, e, t) {
  for (const n in t.extensions) o[n] === void 0 && (e.userData.gltfExtensions = e.userData.gltfExtensions || {}, e.userData.gltfExtensions[n] = t.extensions[n]);
}
function En(o, e) {
  e.extras !== void 0 && (typeof e.extras == "object" ? Object.assign(o.userData, e.extras) : console.warn("THREE.GLTFLoader: Ignoring primitive type .extras, " + e.extras));
}
function uf(o, e, t) {
  let n = !1,
    s = !1,
    r = !1;
  for (let d = 0, u = e.length; d < u; d++) {
    const h = e[d];
    if (h.POSITION !== void 0 && (n = !0), h.NORMAL !== void 0 && (s = !0), h.COLOR_0 !== void 0 && (r = !0), n && s && r) break;
  }
  if (!n && !s && !r) return Promise.resolve(o);
  const i = [],
    a = [],
    l = [];
  for (let d = 0, u = e.length; d < u; d++) {
    const h = e[d];
    if (n) {
      const m = h.POSITION !== void 0 ? t.getDependency("accessor", h.POSITION) : o.attributes.position;
      i.push(m);
    }
    if (s) {
      const m = h.NORMAL !== void 0 ? t.getDependency("accessor", h.NORMAL) : o.attributes.normal;
      a.push(m);
    }
    if (r) {
      const m = h.COLOR_0 !== void 0 ? t.getDependency("accessor", h.COLOR_0) : o.attributes.color;
      l.push(m);
    }
  }
  return Promise.all([Promise.all(i), Promise.all(a), Promise.all(l)]).then(function (d) {
    const u = d[0],
      h = d[1],
      m = d[2];
    return n && (o.morphAttributes.position = u), s && (o.morphAttributes.normal = h), r && (o.morphAttributes.color = m), o.morphTargetsRelative = !0, o;
  });
}
function hf(o, e) {
  if (o.updateMorphTargets(), e.weights !== void 0) for (let t = 0, n = e.weights.length; t < n; t++) o.morphTargetInfluences[t] = e.weights[t];
  if (e.extras && Array.isArray(e.extras.targetNames)) {
    const t = e.extras.targetNames;
    if (o.morphTargetInfluences.length === t.length) {
      o.morphTargetDictionary = {};
      for (let n = 0, s = t.length; n < s; n++) o.morphTargetDictionary[t[n]] = n;
    } else console.warn("THREE.GLTFLoader: Invalid extras.targetNames length. Ignoring names.");
  }
}
function pf(o) {
  let e;
  const t = o.extensions && o.extensions[le.KHR_DRACO_MESH_COMPRESSION];
  if (t ? e = "draco:" + t.bufferView + ":" + t.indices + ":" + Pr(t.attributes) : e = o.indices + ":" + Pr(o.attributes) + ":" + o.mode, o.targets !== void 0) for (let n = 0, s = o.targets.length; n < s; n++) e += ":" + Pr(o.targets[n]);
  return e;
}
function Pr(o) {
  let e = "";
  const t = Object.keys(o).sort();
  for (let n = 0, s = t.length; n < s; n++) e += t[n] + ":" + o[t[n]] + ";";
  return e;
}
function wi(o) {
  switch (o) {
    case Int8Array:
      return 1 / 127;
    case Uint8Array:
      return 1 / 255;
    case Int16Array:
      return 1 / 32767;
    case Uint16Array:
      return 1 / 65535;
    default:
      throw new Error("THREE.GLTFLoader: Unsupported normalized accessor component type.");
  }
}
function ff(o) {
  return o.search(/\.jpe?g($|\?)/i) > 0 || o.search(/^data\:image\/jpeg/) === 0 ? "image/jpeg" : o.search(/\.webp($|\?)/i) > 0 || o.search(/^data\:image\/webp/) === 0 ? "image/webp" : "image/png";
}
const mf = new hs();
class gf {
  constructor(e = {}, t = {}) {
    this.json = e, this.extensions = {}, this.plugins = {}, this.options = t, this.cache = new Op(), this.associations = new Map(), this.primitiveCache = {}, this.nodeCache = {}, this.meshCache = {
      refs: {},
      uses: {}
    }, this.cameraCache = {
      refs: {},
      uses: {}
    }, this.lightCache = {
      refs: {},
      uses: {}
    }, this.sourceCache = {}, this.textureCache = {}, this.nodeNamesUsed = {};
    let n = !1,
      s = !1,
      r = -1;
    typeof navigator < "u" && (n = /^((?!chrome|android).)*safari/i.test(navigator.userAgent) === !0, s = navigator.userAgent.indexOf("Firefox") > -1, r = s ? navigator.userAgent.match(/Firefox\/([0-9]+)\./)[1] : -1), typeof createImageBitmap > "u" || n || s && r < 98 ? this.textureLoader = new pi(this.options.manager) : this.textureLoader = new Gu(this.options.manager), this.textureLoader.setCrossOrigin(this.options.crossOrigin), this.textureLoader.setRequestHeader(this.options.requestHeader), this.fileLoader = new fc(this.options.manager), this.fileLoader.setResponseType("arraybuffer"), this.options.crossOrigin === "use-credentials" && this.fileLoader.setWithCredentials(!0);
  }
  setExtensions(e) {
    this.extensions = e;
  }
  setPlugins(e) {
    this.plugins = e;
  }
  parse(e, t) {
    const n = this,
      s = this.json,
      r = this.extensions;
    this.cache.removeAll(), this.nodeCache = {}, this._invokeAll(function (i) {
      return i._markDefs && i._markDefs();
    }), Promise.all(this._invokeAll(function (i) {
      return i.beforeRoot && i.beforeRoot();
    })).then(function () {
      return Promise.all([n.getDependencies("scene"), n.getDependencies("animation"), n.getDependencies("camera")]);
    }).then(function (i) {
      const a = {
        scene: i[0][s.scene || 0],
        scenes: i[0],
        animations: i[1],
        cameras: i[2],
        asset: s.asset,
        parser: n,
        userData: {}
      };
      return Fn(r, a, s), En(a, s), Promise.all(n._invokeAll(function (l) {
        return l.afterRoot && l.afterRoot(a);
      })).then(function () {
        e(a);
      });
    }).catch(t);
  }
  _markDefs() {
    const e = this.json.nodes || [],
      t = this.json.skins || [],
      n = this.json.meshes || [];
    for (let s = 0, r = t.length; s < r; s++) {
      const i = t[s].joints;
      for (let a = 0, l = i.length; a < l; a++) e[i[a]].isBone = !0;
    }
    for (let s = 0, r = e.length; s < r; s++) {
      const i = e[s];
      i.mesh !== void 0 && (this._addNodeRef(this.meshCache, i.mesh), i.skin !== void 0 && (n[i.mesh].isSkinnedMesh = !0)), i.camera !== void 0 && this._addNodeRef(this.cameraCache, i.camera);
    }
  }
  _addNodeRef(e, t) {
    t !== void 0 && (e.refs[t] === void 0 && (e.refs[t] = e.uses[t] = 0), e.refs[t]++);
  }
  _getNodeRef(e, t, n) {
    if (e.refs[t] <= 1) return n;
    const s = n.clone(),
      r = (i, a) => {
        const l = this.associations.get(i);
        l != null && this.associations.set(a, l);
        for (const [d, u] of i.children.entries()) r(u, a.children[d]);
      };
    return r(n, s), s.name += "_instance_" + e.uses[t]++, s;
  }
  _invokeOne(e) {
    const t = Object.values(this.plugins);
    t.push(this);
    for (let n = 0; n < t.length; n++) {
      const s = e(t[n]);
      if (s) return s;
    }
    return null;
  }
  _invokeAll(e) {
    const t = Object.values(this.plugins);
    t.unshift(this);
    const n = [];
    for (let s = 0; s < t.length; s++) {
      const r = e(t[s]);
      r && n.push(r);
    }
    return n;
  }
  getDependency(e, t) {
    const n = e + ":" + t;
    let s = this.cache.get(n);
    if (!s) {
      switch (e) {
        case "scene":
          s = this.loadScene(t);
          break;
        case "node":
          s = this._invokeOne(function (r) {
            return r.loadNode && r.loadNode(t);
          });
          break;
        case "mesh":
          s = this._invokeOne(function (r) {
            return r.loadMesh && r.loadMesh(t);
          });
          break;
        case "accessor":
          s = this.loadAccessor(t);
          break;
        case "bufferView":
          s = this._invokeOne(function (r) {
            return r.loadBufferView && r.loadBufferView(t);
          });
          break;
        case "buffer":
          s = this.loadBuffer(t);
          break;
        case "material":
          s = this._invokeOne(function (r) {
            return r.loadMaterial && r.loadMaterial(t);
          });
          break;
        case "texture":
          s = this._invokeOne(function (r) {
            return r.loadTexture && r.loadTexture(t);
          });
          break;
        case "skin":
          s = this.loadSkin(t);
          break;
        case "animation":
          s = this._invokeOne(function (r) {
            return r.loadAnimation && r.loadAnimation(t);
          });
          break;
        case "camera":
          s = this.loadCamera(t);
          break;
        default:
          if (s = this._invokeOne(function (r) {
            return r != this && r.getDependency && r.getDependency(e, t);
          }), !s) throw new Error("Unknown type: " + e);
          break;
      }
      this.cache.add(n, s);
    }
    return s;
  }
  getDependencies(e) {
    let t = this.cache.get(e);
    if (!t) {
      const n = this,
        s = this.json[e + (e === "mesh" ? "es" : "s")] || [];
      t = Promise.all(s.map(function (r, i) {
        return n.getDependency(e, i);
      })), this.cache.add(e, t);
    }
    return t;
  }
  loadBuffer(e) {
    const t = this.json.buffers[e],
      n = this.fileLoader;
    if (t.type && t.type !== "arraybuffer") throw new Error("THREE.GLTFLoader: " + t.type + " buffer type is not supported.");
    if (t.uri === void 0 && e === 0) return Promise.resolve(this.extensions[le.KHR_BINARY_GLTF].body);
    const s = this.options;
    return new Promise(function (r, i) {
      n.load(Ds.resolveURL(t.uri, s.path), r, void 0, function () {
        i(new Error('THREE.GLTFLoader: Failed to load buffer "' + t.uri + '".'));
      });
    });
  }
  loadBufferView(e) {
    const t = this.json.bufferViews[e];
    return this.getDependency("buffer", t.buffer).then(function (n) {
      const s = t.byteLength || 0,
        r = t.byteOffset || 0;
      return n.slice(r, r + s);
    });
  }
  loadAccessor(e) {
    const t = this,
      n = this.json,
      s = this.json.accessors[e];
    if (s.bufferView === void 0 && s.sparse === void 0) {
      const i = Sr[s.type],
        a = ds[s.componentType],
        l = s.normalized === !0,
        d = new a(s.count * i);
      return Promise.resolve(new ls(d, i, l));
    }
    const r = [];
    return s.bufferView !== void 0 ? r.push(this.getDependency("bufferView", s.bufferView)) : r.push(null), s.sparse !== void 0 && (r.push(this.getDependency("bufferView", s.sparse.indices.bufferView)), r.push(this.getDependency("bufferView", s.sparse.values.bufferView))), Promise.all(r).then(function (i) {
      const a = i[0],
        l = Sr[s.type],
        d = ds[s.componentType],
        u = d.BYTES_PER_ELEMENT,
        h = u * l,
        m = s.byteOffset || 0,
        f = s.bufferView !== void 0 ? n.bufferViews[s.bufferView].byteStride : void 0,
        p = s.normalized === !0;
      let x, g;
      if (f && f !== h) {
        const b = Math.floor(m / f),
          w = "InterleavedBuffer:" + s.bufferView + ":" + s.componentType + ":" + b + ":" + s.count;
        let v = t.cache.get(w);
        v || (x = new d(a, b * f, s.count * f / u), v = new $u(x, f / u), t.cache.add(w, v)), g = new oh(v, l, m % f / u, p);
      } else a === null ? x = new d(s.count * l) : x = new d(a, m, s.count * l), g = new ls(x, l, p);
      if (s.sparse !== void 0) {
        const b = Sr.SCALAR,
          w = ds[s.sparse.indices.componentType],
          v = s.sparse.indices.byteOffset || 0,
          E = s.sparse.values.byteOffset || 0,
          T = new w(i[1], v, s.sparse.count * b),
          P = new d(i[2], E, s.sparse.count * l);
        a !== null && (g = new ls(g.array.slice(), g.itemSize, g.normalized));
        for (let C = 0, M = T.length; C < M; C++) {
          const y = T[C];
          if (g.setX(y, P[C * l]), l >= 2 && g.setY(y, P[C * l + 1]), l >= 3 && g.setZ(y, P[C * l + 2]), l >= 4 && g.setW(y, P[C * l + 3]), l >= 5) throw new Error("THREE.GLTFLoader: Unsupported itemSize in sparse BufferAttribute.");
        }
      }
      return g;
    });
  }
  loadTexture(e) {
    const t = this.json,
      n = this.options,
      r = t.textures[e].source,
      i = t.images[r];
    let a = this.textureLoader;
    if (i.uri) {
      const l = n.manager.getHandler(i.uri);
      l !== null && (a = l);
    }
    return this.loadTextureImage(e, r, a);
  }
  loadTextureImage(e, t, n) {
    const s = this,
      r = this.json,
      i = r.textures[e],
      a = r.images[t],
      l = (a.uri || a.bufferView) + ":" + i.sampler;
    if (this.textureCache[l]) return this.textureCache[l];
    const d = this.loadImageSource(t, n).then(function (u) {
      u.flipY = !1, u.name = i.name || a.name || "", u.name === "" && typeof a.uri == "string" && a.uri.startsWith("data:image/") === !1 && (u.name = a.uri);
      const m = (r.samplers || {})[i.sampler] || {};
      return u.magFilter = ul[m.magFilter] || gc, u.minFilter = ul[m.minFilter] || mc, u.wrapS = hl[m.wrapS] || fi, u.wrapT = hl[m.wrapT] || fi, s.associations.set(u, {
        textures: e
      }), u;
    }).catch(function () {
      return null;
    });
    return this.textureCache[l] = d, d;
  }
  loadImageSource(e, t) {
    const n = this,
      s = this.json,
      r = this.options;
    if (this.sourceCache[e] !== void 0) return this.sourceCache[e].then(h => h.clone());
    const i = s.images[e],
      a = self.URL || self.webkitURL;
    let l = i.uri || "",
      d = !1;
    if (i.bufferView !== void 0) l = n.getDependency("bufferView", i.bufferView).then(function (h) {
      d = !0;
      const m = new Blob([h], {
        type: i.mimeType
      });
      return l = a.createObjectURL(m), l;
    });else if (i.uri === void 0) throw new Error("THREE.GLTFLoader: Image " + e + " is missing URI and bufferView");
    const u = Promise.resolve(l).then(function (h) {
      return new Promise(function (m, f) {
        let p = m;
        t.isImageBitmapLoader === !0 && (p = function (x) {
          const g = new Pa(x);
          g.needsUpdate = !0, m(g);
        }), t.load(Ds.resolveURL(h, r.path), p, void 0, f);
      });
    }).then(function (h) {
      return d === !0 && a.revokeObjectURL(l), h.userData.mimeType = i.mimeType || ff(i.uri), h;
    }).catch(function (h) {
      throw console.error("THREE.GLTFLoader: Couldn't load texture", l), h;
    });
    return this.sourceCache[e] = u, u;
  }
  assignTexture(e, t, n, s) {
    const r = this;
    return this.getDependency("texture", n.index).then(function (i) {
      if (!i) return null;
      if (n.texCoord !== void 0 && n.texCoord > 0 && (i = i.clone(), i.channel = n.texCoord), r.extensions[le.KHR_TEXTURE_TRANSFORM]) {
        const a = n.extensions !== void 0 ? n.extensions[le.KHR_TEXTURE_TRANSFORM] : void 0;
        if (a) {
          const l = r.associations.get(i);
          i = r.extensions[le.KHR_TEXTURE_TRANSFORM].extendTexture(i, a), r.associations.set(i, l);
        }
      }
      return s !== void 0 && (i.colorSpace = s), e[t] = i, i;
    });
  }
  assignFinalMaterial(e) {
    const t = e.geometry;
    let n = e.material;
    const s = t.attributes.tangent === void 0,
      r = t.attributes.color !== void 0,
      i = t.attributes.normal === void 0;
    if (e.isPoints) {
      const a = "PointsMaterial:" + n.uuid;
      let l = this.cache.get(a);
      l || (l = new xc(), hr.prototype.copy.call(l, n), l.color.copy(n.color), l.map = n.map, l.sizeAttenuation = !1, this.cache.add(a, l)), n = l;
    } else if (e.isLine) {
      const a = "LineBasicMaterial:" + n.uuid;
      let l = this.cache.get(a);
      l || (l = new Sn(), hr.prototype.copy.call(l, n), l.color.copy(n.color), l.map = n.map, this.cache.add(a, l)), n = l;
    }
    if (s || r || i) {
      let a = "ClonedMaterial:" + n.uuid + ":";
      s && (a += "derivative-tangents:"), r && (a += "vertex-colors:"), i && (a += "flat-shading:");
      let l = this.cache.get(a);
      l || (l = n.clone(), r && (l.vertexColors = !0), i && (l.flatShading = !0), s && (l.normalScale && (l.normalScale.y *= -1), l.clearcoatNormalScale && (l.clearcoatNormalScale.y *= -1)), this.cache.add(a, l), this.associations.set(l, this.associations.get(n))), n = l;
    }
    e.material = n;
  }
  getMaterialType() {
    return Lt;
  }
  loadMaterial(e) {
    const t = this,
      n = this.json,
      s = this.extensions,
      r = n.materials[e];
    let i;
    const a = {},
      l = r.extensions || {},
      d = [];
    if (l[le.KHR_MATERIALS_UNLIT]) {
      const h = s[le.KHR_MATERIALS_UNLIT];
      i = h.getMaterialType(), d.push(h.extendParams(a, r, t));
    } else {
      const h = r.pbrMetallicRoughness || {};
      if (a.color = new Ze(1, 1, 1), a.opacity = 1, Array.isArray(h.baseColorFactor)) {
        const m = h.baseColorFactor;
        a.color.setRGB(m[0], m[1], m[2], Tn), a.opacity = m[3];
      }
      h.baseColorTexture !== void 0 && d.push(t.assignTexture(a, "map", h.baseColorTexture, $t)), a.metalness = h.metallicFactor !== void 0 ? h.metallicFactor : 1, a.roughness = h.roughnessFactor !== void 0 ? h.roughnessFactor : 1, h.metallicRoughnessTexture !== void 0 && (d.push(t.assignTexture(a, "metalnessMap", h.metallicRoughnessTexture)), d.push(t.assignTexture(a, "roughnessMap", h.metallicRoughnessTexture))), i = this._invokeOne(function (m) {
        return m.getMaterialType && m.getMaterialType(e);
      }), d.push(Promise.all(this._invokeAll(function (m) {
        return m.extendMaterialParams && m.extendMaterialParams(e, a);
      })));
    }
    r.doubleSided === !0 && (a.side = zo);
    const u = r.alphaMode || Tr.OPAQUE;
    if (u === Tr.BLEND ? (a.transparent = !0, a.depthWrite = !1) : (a.transparent = !1, u === Tr.MASK && (a.alphaTest = r.alphaCutoff !== void 0 ? r.alphaCutoff : 0.5)), r.normalTexture !== void 0 && i !== ct && (d.push(t.assignTexture(a, "normalMap", r.normalTexture)), a.normalScale = new yt(1, 1), r.normalTexture.scale !== void 0)) {
      const h = r.normalTexture.scale;
      a.normalScale.set(h, h);
    }
    if (r.occlusionTexture !== void 0 && i !== ct && (d.push(t.assignTexture(a, "aoMap", r.occlusionTexture)), r.occlusionTexture.strength !== void 0 && (a.aoMapIntensity = r.occlusionTexture.strength)), r.emissiveFactor !== void 0 && i !== ct) {
      const h = r.emissiveFactor;
      a.emissive = new Ze().setRGB(h[0], h[1], h[2], Tn);
    }
    return r.emissiveTexture !== void 0 && i !== ct && d.push(t.assignTexture(a, "emissiveMap", r.emissiveTexture, $t)), Promise.all(d).then(function () {
      const h = new i(a);
      return r.name && (h.name = r.name), En(h, r), t.associations.set(h, {
        materials: e
      }), r.extensions && Fn(s, h, r), h;
    });
  }
  createUniqueName(e) {
    const t = Qu.sanitizeNodeName(e || "");
    return t in this.nodeNamesUsed ? t + "_" + ++this.nodeNamesUsed[t] : (this.nodeNamesUsed[t] = 0, t);
  }
  loadGeometries(e) {
    const t = this,
      n = this.extensions,
      s = this.primitiveCache;
    function r(a) {
      return n[le.KHR_DRACO_MESH_COMPRESSION].decodePrimitive(a, t).then(function (l) {
        return pl(l, a, t);
      });
    }
    const i = [];
    for (let a = 0, l = e.length; a < l; a++) {
      const d = e[a],
        u = pf(d),
        h = s[u];
      if (h) i.push(h.promise);else {
        let m;
        d.extensions && d.extensions[le.KHR_DRACO_MESH_COMPRESSION] ? m = r(d) : m = pl(new Pt(), d, t), s[u] = {
          primitive: d,
          promise: m
        }, i.push(m);
      }
    }
    return Promise.all(i);
  }
  loadMesh(e) {
    const t = this,
      n = this.json,
      s = this.extensions,
      r = n.meshes[e],
      i = r.primitives,
      a = [];
    for (let l = 0, d = i.length; l < d; l++) {
      const u = i[l].material === void 0 ? df(this.cache) : this.getDependency("material", i[l].material);
      a.push(u);
    }
    return a.push(t.loadGeometries(i)), Promise.all(a).then(function (l) {
      const d = l.slice(0, l.length - 1),
        u = l[l.length - 1],
        h = [];
      for (let f = 0, p = u.length; f < p; f++) {
        const x = u[f],
          g = i[f];
        let b;
        const w = d[f];
        if (g.mode === Dt.TRIANGLES || g.mode === Dt.TRIANGLE_STRIP || g.mode === Dt.TRIANGLE_FAN || g.mode === void 0) b = r.isSkinnedMesh === !0 ? new Zu(x, w) : new z(x, w), b.isSkinnedMesh === !0 && b.normalizeSkinWeights(), g.mode === Dt.TRIANGLE_STRIP ? b.geometry = cl(b.geometry, pc) : g.mode === Dt.TRIANGLE_FAN && (b.geometry = cl(b.geometry, hi));else if (g.mode === Dt.LINES) b = new bc(x, w);else if (g.mode === Dt.LINE_STRIP) b = new _t(x, w);else if (g.mode === Dt.LINE_LOOP) b = new Ju(x, w);else if (g.mode === Dt.POINTS) b = new ss(x, w);else throw new Error("THREE.GLTFLoader: Primitive mode unsupported: " + g.mode);
        Object.keys(b.geometry.morphAttributes).length > 0 && hf(b, r), b.name = t.createUniqueName(r.name || "mesh_" + e), En(b, r), g.extensions && Fn(s, b, g), t.assignFinalMaterial(b), h.push(b);
      }
      for (let f = 0, p = h.length; f < p; f++) t.associations.set(h[f], {
        meshes: e,
        primitives: f
      });
      if (h.length === 1) return r.extensions && Fn(s, h[0], r), h[0];
      const m = new je();
      r.extensions && Fn(s, m, r), t.associations.set(m, {
        meshes: e
      });
      for (let f = 0, p = h.length; f < p; f++) m.add(h[f]);
      return m;
    });
  }
  loadCamera(e) {
    let t;
    const n = this.json.cameras[e],
      s = n[n.type];
    if (!s) {
      console.warn("THREE.GLTFLoader: Missing camera parameters.");
      return;
    }
    return n.type === "perspective" ? t = new $n(ke.radToDeg(s.yfov), s.aspectRatio || 1, s.znear || 1, s.zfar || 2e6) : n.type === "orthographic" && (t = new wc(-s.xmag, s.xmag, s.ymag, -s.ymag, s.znear, s.zfar)), n.name && (t.name = this.createUniqueName(n.name)), En(t, n), Promise.resolve(t);
  }
  loadSkin(e) {
    const t = this.json.skins[e],
      n = [];
    for (let s = 0, r = t.joints.length; s < r; s++) n.push(this._loadNodeShallow(t.joints[s]));
    return t.inverseBindMatrices !== void 0 ? n.push(this.getDependency("accessor", t.inverseBindMatrices)) : n.push(null), Promise.all(n).then(function (s) {
      const r = s.pop(),
        i = s,
        a = [],
        l = [];
      for (let d = 0, u = i.length; d < u; d++) {
        const h = i[d];
        if (h) {
          a.push(h);
          const m = new hs();
          r !== null && m.fromArray(r.array, d * 16), l.push(m);
        } else console.warn('THREE.GLTFLoader: Joint "%s" could not be found.', t.joints[d]);
      }
      return new eh(a, l);
    });
  }
  loadAnimation(e) {
    const t = this.json,
      n = this,
      s = t.animations[e],
      r = s.name ? s.name : "animation_" + e,
      i = [],
      a = [],
      l = [],
      d = [],
      u = [];
    for (let h = 0, m = s.channels.length; h < m; h++) {
      const f = s.channels[h],
        p = s.samplers[f.sampler],
        x = f.target,
        g = x.node,
        b = s.parameters !== void 0 ? s.parameters[p.input] : p.input,
        w = s.parameters !== void 0 ? s.parameters[p.output] : p.output;
      x.node !== void 0 && (i.push(this.getDependency("node", g)), a.push(this.getDependency("accessor", b)), l.push(this.getDependency("accessor", w)), d.push(p), u.push(x));
    }
    return Promise.all([Promise.all(i), Promise.all(a), Promise.all(l), Promise.all(d), Promise.all(u)]).then(function (h) {
      const m = h[0],
        f = h[1],
        p = h[2],
        x = h[3],
        g = h[4],
        b = [];
      for (let w = 0, v = m.length; w < v; w++) {
        const E = m[w],
          T = f[w],
          P = p[w],
          C = x[w],
          M = g[w];
        if (E === void 0) continue;
        E.updateMatrix && E.updateMatrix();
        const y = n._createAnimationTracks(E, T, P, C, M);
        if (y) for (let I = 0; I < y.length; I++) b.push(y[I]);
      }
      return new th(r, void 0, b);
    });
  }
  createNodeMesh(e) {
    const t = this.json,
      n = this,
      s = t.nodes[e];
    return s.mesh === void 0 ? null : n.getDependency("mesh", s.mesh).then(function (r) {
      const i = n._getNodeRef(n.meshCache, s.mesh, r);
      return s.weights !== void 0 && i.traverse(function (a) {
        if (a.isMesh) for (let l = 0, d = s.weights.length; l < d; l++) a.morphTargetInfluences[l] = s.weights[l];
      }), i;
    });
  }
  loadNode(e) {
    const t = this.json,
      n = this,
      s = t.nodes[e],
      r = n._loadNodeShallow(e),
      i = [],
      a = s.children || [];
    for (let d = 0, u = a.length; d < u; d++) i.push(n.getDependency("node", a[d]));
    const l = s.skin === void 0 ? Promise.resolve(null) : n.getDependency("skin", s.skin);
    return Promise.all([r, Promise.all(i), l]).then(function (d) {
      const u = d[0],
        h = d[1],
        m = d[2];
      m !== null && u.traverse(function (f) {
        f.isSkinnedMesh && f.bind(m, mf);
      });
      for (let f = 0, p = h.length; f < p; f++) u.add(h[f]);
      return u;
    });
  }
  _loadNodeShallow(e) {
    const t = this.json,
      n = this.extensions,
      s = this;
    if (this.nodeCache[e] !== void 0) return this.nodeCache[e];
    const r = t.nodes[e],
      i = r.name ? s.createUniqueName(r.name) : "",
      a = [],
      l = s._invokeOne(function (d) {
        return d.createNodeMesh && d.createNodeMesh(e);
      });
    return l && a.push(l), r.camera !== void 0 && a.push(s.getDependency("camera", r.camera).then(function (d) {
      return s._getNodeRef(s.cameraCache, r.camera, d);
    })), s._invokeAll(function (d) {
      return d.createNodeAttachment && d.createNodeAttachment(e);
    }).forEach(function (d) {
      a.push(d);
    }), this.nodeCache[e] = Promise.all(a).then(function (d) {
      let u;
      if (r.isBone === !0 ? u = new nh() : d.length > 1 ? u = new je() : d.length === 1 ? u = d[0] : u = new Ot(), u !== d[0]) for (let h = 0, m = d.length; h < m; h++) u.add(d[h]);
      if (r.name && (u.userData.name = r.name, u.name = i), En(u, r), r.extensions && Fn(n, u, r), r.matrix !== void 0) {
        const h = new hs();
        h.fromArray(r.matrix), u.applyMatrix4(h);
      } else r.translation !== void 0 && u.position.fromArray(r.translation), r.rotation !== void 0 && u.quaternion.fromArray(r.rotation), r.scale !== void 0 && u.scale.fromArray(r.scale);
      return s.associations.has(u) || s.associations.set(u, {}), s.associations.get(u).nodes = e, u;
    }), this.nodeCache[e];
  }
  loadScene(e) {
    const t = this.extensions,
      n = this.json.scenes[e],
      s = this,
      r = new je();
    n.name && (r.name = s.createUniqueName(n.name)), En(r, n), n.extensions && Fn(t, r, n);
    const i = n.nodes || [],
      a = [];
    for (let l = 0, d = i.length; l < d; l++) a.push(s.getDependency("node", i[l]));
    return Promise.all(a).then(function (l) {
      for (let u = 0, h = l.length; u < h; u++) r.add(l[u]);
      const d = u => {
        const h = new Map();
        for (const [m, f] of s.associations) (m instanceof hr || m instanceof Pa) && h.set(m, f);
        return u.traverse(m => {
          const f = s.associations.get(m);
          f != null && h.set(m, f);
        }), h;
      };
      return s.associations = d(r), r;
    });
  }
  _createAnimationTracks(e, t, n, s, r) {
    const i = [],
      a = e.name ? e.name : e.uuid,
      l = [];
    yn[r.path] === yn.weights ? e.traverse(function (m) {
      m.morphTargetInfluences && l.push(m.name ? m.name : m.uuid);
    }) : l.push(a);
    let d;
    switch (yn[r.path]) {
      case yn.weights:
        d = Na;
        break;
      case yn.rotation:
        d = Ra;
        break;
      case yn.position:
      case yn.scale:
        d = Ia;
        break;
      default:
        switch (n.itemSize) {
          case 1:
            d = Na;
            break;
          case 2:
          case 3:
          default:
            d = Ia;
            break;
        }
        break;
    }
    const u = s.interpolation !== void 0 ? cf[s.interpolation] : yc,
      h = this._getArrayFromAccessor(n);
    for (let m = 0, f = l.length; m < f; m++) {
      const p = new d(l[m] + "." + yn[r.path], t.array, h, u);
      s.interpolation === "CUBICSPLINE" && this._createCubicSplineTrackInterpolant(p), i.push(p);
    }
    return i;
  }
  _getArrayFromAccessor(e) {
    let t = e.array;
    if (e.normalized) {
      const n = wi(t.constructor),
        s = new Float32Array(t.length);
      for (let r = 0, i = t.length; r < i; r++) s[r] = t[r] * n;
      t = s;
    }
    return t;
  }
  _createCubicSplineTrackInterpolant(e) {
    e.createInterpolant = function (n) {
      const s = this instanceof Ra ? lf : Qc;
      return new s(this.times, this.values, this.getValueSize() / 3, n);
    }, e.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline = !0;
  }
}
function xf(o, e, t) {
  const n = e.attributes,
    s = new nt();
  if (n.POSITION !== void 0) {
    const a = t.json.accessors[n.POSITION],
      l = a.min,
      d = a.max;
    if (l !== void 0 && d !== void 0) {
      if (s.set(new R(l[0], l[1], l[2]), new R(d[0], d[1], d[2])), a.normalized) {
        const u = wi(ds[a.componentType]);
        s.min.multiplyScalar(u), s.max.multiplyScalar(u);
      }
    } else {
      console.warn("THREE.GLTFLoader: Missing min/max properties for accessor POSITION.");
      return;
    }
  } else return;
  const r = e.targets;
  if (r !== void 0) {
    const a = new R(),
      l = new R();
    for (let d = 0, u = r.length; d < u; d++) {
      const h = r[d];
      if (h.POSITION !== void 0) {
        const m = t.json.accessors[h.POSITION],
          f = m.min,
          p = m.max;
        if (f !== void 0 && p !== void 0) {
          if (l.setX(Math.max(Math.abs(f[0]), Math.abs(p[0]))), l.setY(Math.max(Math.abs(f[1]), Math.abs(p[1]))), l.setZ(Math.max(Math.abs(f[2]), Math.abs(p[2]))), m.normalized) {
            const x = wi(ds[m.componentType]);
            l.multiplyScalar(x);
          }
          a.max(l);
        } else console.warn("THREE.GLTFLoader: Missing min/max properties for accessor POSITION.");
      }
    }
    s.expandByVector(a);
  }
  o.boundingBox = s;
  const i = new Ri();
  s.getCenter(i.center), i.radius = s.min.distanceTo(s.max) / 2, o.boundingSphere = i;
}
function pl(o, e, t) {
  const n = e.attributes,
    s = [];
  function r(i, a) {
    return t.getDependency("accessor", i).then(function (l) {
      o.setAttribute(a, l);
    });
  }
  for (const i in n) {
    const a = bi[i] || i.toLowerCase();
    a in o.attributes || s.push(r(n[i], a));
  }
  if (e.indices !== void 0 && !o.index) {
    const i = t.getDependency("accessor", e.indices).then(function (a) {
      o.setIndex(a);
    });
    s.push(i);
  }
  return Da.workingColorSpace !== Tn && "COLOR_0" in n && console.warn(`THREE.GLTFLoader: Converting vertex colors from "srgb-linear" to "${Da.workingColorSpace}" not supported.`), En(o, e), xf(o, e, t), Promise.all(s).then(function () {
    return e.targets !== void 0 ? uf(o, e.targets, t) : o;
  });
}
const Zc = new zp();
Zc.setCrossOrigin("anonymous");
const bf = new Map(),
  wf = new Map();
function Jc(o) {
  const e = new Map(),
    t = new Map(),
    n = o.clone();
  return function s(r, i) {
    e.set(i, r), t.set(r, i);
    for (let a = 0; a < r.children.length; a++) s(r.children[a], i.children[a]);
  }(o, n), n.traverse(s => {
    const r = s;
    if (!r.isSkinnedMesh) return;
    const i = e.get(r),
      a = i.skeleton.bones;
    r.skeleton = i.skeleton.clone(), r.bindMatrix.copy(i.bindMatrix), r.skeleton.bones = a.map(l => t.get(l)), r.bind(r.skeleton, r.bindMatrix);
  }), n;
}
function yf(o, e = !0) {
  const t = e ? bf : wf,
    n = t.get(o);
  if (n) return n;
  const s = Zc.loadAsync(o).then(r => {
    const i = r.scene || r.scenes[0];
    if (!i) throw new Error(`glTF scene is empty: ${o}`);
    i.traverse(h => {
      const m = h;
      m.isMesh && (m.castShadow = !1, m.receiveShadow = !1);
    }), i.updateMatrixWorld(!0);
    const a = new nt().setFromObject(i).getSize(new R()).y || 1;
    e && i.scale.multiplyScalar(1.75 / a), i.updateMatrixWorld(!0);
    const l = new nt().setFromObject(i),
      d = l.getCenter(new R());
    i.position.x -= d.x, i.position.z -= d.z, i.position.y -= l.min.y, i.rotation.y = ap * Math.PI / 180, i.updateMatrixWorld(!0);
    const u = new nt().setFromObject(i);
    return i.userData.headY = u.max.y || 1.75, i;
  }).catch(r => {
    throw t.delete(o), r;
  });
  return t.set(o, s), s;
}
async function Yo(o) {
  const e = await yf(o, !0),
    t = Jc(e);
  t.traverse(i => {
    const a = i;
    if (!a.isMesh) return;
    a.castShadow = !1, a.receiveShadow = !1;
    const l = a.material;
    Array.isArray(l) ? a.material = l.map(d => d.clone()) : l && (a.material = l.clone());
  });
  const n = new je();
  n.userData.isGlbCharacter = !0, n.userData.modelUrl = o, n.userData.headY = e.userData.headY ?? 1.75, n.add(t);
  const s = kp(t, o),
    r = Object.keys(s.bones).length > 0;
  return n.userData.glbRig = r ? s : null, {
    group: n,
    rig: r ? s : null
  };
}
function Xo(o, e) {
  o.traverse(t => {
    const n = t;
    if (!n.isMesh) return;
    const s = i => {
        const a = i.color;
        a instanceof Ze && (a.set(e), i.needsUpdate = !0);
      },
      r = n.material;
    Array.isArray(r) ? r.forEach(s) : r && s(r);
  });
}
const vf = Object.freeze(Object.defineProperty({
  __proto__: null,
  cloneSkinned: Jc,
  loadGlbCharacter: Yo,
  tintCharacter: Xo
}, Symbol.toStringTag, {
  value: "Module"
}));
function ed(o = 50) {
  const e = new R(0, -0.01, 0.005),
    t = ke.clamp(o, 1, 90),
    n = ke.clamp(t / 90, 0.35, 1),
    s = 4.5 * n,
    r = 0.68 * n,
    i = 1.5441176470588236 * r,
    a = [new R(-i, r, s), new R(i, r, s), new R(i, -r, s), new R(-i, -r, s)],
    l = [];
  return a.forEach(d => {
    l.push(e, d);
  }), l.push(e, new R(0, 0, s)), a.forEach((d, u) => {
    l.push(d, a[(u + 1) % a.length]);
  }), new Pt().setFromPoints(l);
}
function _f(o = 50) {
  const e = new je();
  e.userData.isCameraIndicator = !0;
  const t = new Lt({
      color: "#FF9F0A",
      roughness: 0.65,
      metalness: 0.1
    }),
    n = new Lt({
      color: "#D98500",
      roughness: 0.75,
      metalness: 0.1
    }),
    s = new Lt({
      color: "#aaaaaa",
      roughness: 0.2,
      metalness: 0.9
    }),
    r = new Lt({
      color: "#3a3a3a",
      roughness: 0.4,
      metalness: 0.75
    }),
    i = new Lt({
      color: "#181818",
      roughness: 0.3,
      metalness: 0.8
    }),
    a = new Lt({
      color: "#2244bb",
      roughness: 0.05,
      metalness: 0.3,
      transparent: !0,
      opacity: 0.55
    }),
    l = new Lt({
      color: "#0a0a12",
      roughness: 0.02,
      metalness: 0.1
    }),
    d = new Lt({
      color: "#ff2200",
      emissive: new Ze("#ff2200"),
      emissiveIntensity: 0.8
    }),
    u = (ae, He) => new z(ae, He),
    h = u(new Pe(0.3, 0.22, 0.17), t);
  h.position.set(-0.02, 0, -0.195);
  const m = u(new Pe(0.1, 0.27, 0.17), n);
  m.position.set(0.19, -0.015, -0.195);
  const f = u(new Pe(0.12, 0.055, 0.11), t);
  f.position.set(-0.055, 0.135, -0.195);
  const p = u(new Pe(0.05, 0.038, 0.013), r);
  p.position.set(-0.055, 0.146, -0.287);
  const x = u(new ye(0.014, 0.017, 0.012, 12), s);
  x.position.set(0.155, 0.126, -0.116);
  const g = u(new ye(0.028, 0.028, 0.016, 14), r);
  g.position.set(0.065, 0.128, -0.137);
  const b = u(new ye(0.033, 0.033, 0.018, 14), r);
  b.position.set(-0.035, 0.128, -0.14);
  const w = u(new It(0.065, 0.01, 8, 28), s);
  w.position.set(0, -0.01, -0.105);
  const v = u(new mi(0.062, 28), r);
  v.position.set(0, -0.01, -0.106);
  const E = u(new ye(0.068, 0.072, 0.036, 22), i);
  E.rotation.x = Math.PI / 2, E.position.set(0, -0.01, -0.088);
  const T = u(new ye(0.062, 0.068, 0.039, 22), i);
  T.rotation.x = Math.PI / 2, T.position.set(0, -0.01, -0.05);
  const P = u(new It(0.066, 0.0075, 8, 24), r);
  P.position.set(0, -0.01, -0.062);
  const C = u(new It(0.066, 0.006, 8, 24), r);
  C.position.set(0, -0.01, -0.039);
  const M = u(new ye(0.054, 0.062, 0.028, 22), i);
  M.rotation.x = Math.PI / 2, M.position.set(0, -0.01, -0.017);
  const y = u(new It(0.056, 0.006, 8, 24), s);
  y.position.set(0, -0.01, -0.002);
  const I = u(new mi(0.05, 24), a);
  I.position.set(0, -0.01, 0);
  const j = u(new Pe(0.165, 0.12, 0.004), l);
  j.position.set(-0.02, -0.02, -0.284);
  const D = u(new ye(0.014, 0.014, 0.01, 8), s);
  D.position.set(0.01, -0.115, -0.177);
  const H = u(new St(0.009, 8, 6), d);
  H.position.set(0.148, 0.064, -0.107);
  const F = u(new Pe(0.011, 0.07, 0.08), n);
  F.position.set(-0.153, -0.02, -0.185);
  const U = u(new ye(0.052, 0.05, 0.2, 16), new ct({
    transparent: !0,
    opacity: 0,
    depthWrite: !1
  }));
  U.rotation.x = Math.PI / 2, U.position.set(0, -0.01, 0.1);
  const ne = new bc(ed(o), new Sn({
    color: "#7DDCFF",
    transparent: !0,
    opacity: 0.36,
    depthWrite: !1
  }));
  return ne.userData.isCameraDirectionGuide = !0, ne.userData.currentFov = o, e.add(h, m, f, p, x, g, b, w, v, E, T, P, C, M, y, I, j, D, H, F, U, ne), e.scale.set(0.6, 0.6, 0.6), e;
}
function kf(o, e) {
  const t = o.children.find(n => {
    var s;
    return (s = n.userData) == null ? void 0 : s.isCameraDirectionGuide;
  });
  t && t.userData.currentFov !== e && (t.geometry.dispose(), t.geometry = ed(e), t.userData.currentFov = e);
}
class Zt extends Error {
  constructor(e, t) {
    super(e), this.phase = t, this.name = "CodeModelError";
  }
}
function fl(o) {
  let e = 0,
    t = 0,
    n = 0;
  return o.traverse(s => {
    const r = s;
    if (!r.isMesh && !s.isPoints && !s.isLine) return;
    const i = r.geometry;
    if (!i) return;
    e += 1;
    const a = i.getAttribute("position");
    a && (t += a.count);
    const l = i.getIndex(),
      d = s.isMesh ? l ? l.count : (a == null ? void 0 : a.count) ?? 0 : 0,
      u = r.isInstancedMesh ? r.count : 1;
    n += Math.floor(d / 3) * u;
  }), {
    meshes: e,
    vertices: t,
    triangles: n
  };
}
function Af(o) {
  const e = new Set();
  return o.updateWorldMatrix(!0, !0), o.traverse(t => {
    if (e.size >= 4) return;
    const n = t;
    if (!n.isMesh && !t.isPoints && !t.isLine && !t.isSprite) return;
    let s = t;
    for (; s.parent && s.parent !== o;) s = s.parent;
    const r = `part "${s.name || "(unnamed)"}"`,
      i = n.geometry,
      a = i == null ? void 0 : i.parameters;
    if (a) for (const [d, u] of Object.entries(a)) {
      if (typeof u == "function") {
        e.add(`${r}: ${i.type} "${d}" received a function instead of a number — a method was passed without calling it (e.g. v.length instead of v.length())`);
        return;
      }
      if (typeof u == "number" && !Number.isFinite(u)) {
        e.add(`${r}: ${i.type} "${d}" is ${u}`);
        return;
      }
    }
    const l = i == null ? void 0 : i.getAttribute("position");
    if (l) {
      const d = l.array;
      for (let u = 0; u < d.length; u++) if (!Number.isFinite(d[u])) {
        e.add(`${r}: ${i.type} position attribute contains ${Number.isNaN(d[u]) ? "NaN" : String(d[u])}`);
        return;
      }
    }
    t.matrixWorld.elements.every(Number.isFinite) || e.add(`${r}: object transform (position/rotation/scale) contains non-finite values`);
  }), e.size ? [...e].join("; ") : null;
}
function Fi(o) {
  var w, v;
  if (typeof o != "string" || !o.trim()) throw new Zt("code is empty", "validate");
  let e;
  try {
    e = new Function("ctx", `"use strict";
${o}
;if (typeof createModel !== "function") { throw new Error("code must define function createModel(ctx)"); }
return createModel(ctx);`);
  } catch (E) {
    throw new Zt(`syntax error: ${E.message}`, "compile");
  }
  let t;
  try {
    t = e({
      THREE: ah
    });
  } catch (E) {
    const T = E,
      P = (w = T.stack) == null ? void 0 : w.split(`
`).find(C => C.includes("<anonymous>:"));
    throw new Zt(`runtime error: ${T.message}${P ? ` (${P.trim()})` : ""}`, "run");
  }
  let n = null;
  if (t && t.isObject3D ? n = t : t && typeof t == "object" && (v = t.root) != null && v.isObject3D && (n = t.root), !n) throw new Zt("createModel(ctx) must return a THREE.Group (or { root, update })", "validate");
  const s = [],
    r = fl(n);
  if (r.meshes === 0) throw new Zt("model contains no meshes — nothing to display", "validate");
  r.triangles > 8e5 && s.push(`heavy mesh: ~${r.triangles} triangles, consider reducing segments`);
  const i = [],
    a = new Set();
  let l = 0;
  if (n.children.forEach((E, T) => {
    var C;
    let P = (((C = E.name) == null ? void 0 : C.trim()) || "").split("::").join("_");
    P || (P = `part_${T + 1}`, l += 1), a.has(P) && (P = `${P}_${T + 1}`), E.name = P, a.add(P), i.push(P);
  }), i.length <= 1 && r.meshes >= 8) throw new Zt(`model has ${r.meshes} meshes but only ${i.length} named top-level part ("${i[0] ?? ""}") — do not wrap everything in one container group; add each semantic assembly (wheels, frame, handlebars, …) as its own named top-level child of the returned root (4–15 parts) so layout can be verified and parts edited individually`, "validate");
  l >= 3 && s.push(`${l} top-level children had no name and were auto-named part_N — give every top-level part a semantic name (wheel/frame/…); anonymous names disable wheel-axle and layout verification by name`), n.updateWorldMatrix(!0, !0);
  const d = new nt().setFromObject(n);
  if (![d.min.x, d.min.y, d.min.z, d.max.x, d.max.y, d.max.z].every(Number.isFinite)) {
    const E = Af(n);
    throw new Zt(`model bounding box has NaN/non-finite values — ${E ?? "check geometry constructor arguments and object transforms"}. Common causes: passing Vector3.length (a method) instead of v.length() where a number is expected; normalize() mutates the vector in place, so read .length() before normalizing; division by zero.`, "validate");
  }
  if (d.isEmpty()) throw new Zt("model bounding box is empty", "validate");
  const h = d.getSize(new R()),
    m = E => Math.round(E * 1e3) / 1e3,
    f = n.children.map(E => ({
      name: E.name,
      box: new nt().setFromObject(E),
      meshes: fl(E).meshes
    })),
    p = f.map(({
      name: E,
      box: T,
      meshes: P
    }) => {
      const C = T.isEmpty() ? new R() : T.getCenter(new R()),
        M = T.isEmpty() ? new R() : T.getSize(new R());
      return {
        name: E,
        center: [m(C.x), m(C.y), m(C.z)],
        size: [m(M.x), m(M.y), m(M.z)],
        meshes: P
      };
    }),
    x = f.filter(E => E.meshes > 0 && !E.box.isEmpty());
  if (x.length >= 2) {
    const E = Math.max(0.02, Math.max(h.x, h.y, h.z) * 0.02),
      T = (P, C) => {
        const M = Math.max(0, P.min.x - C.max.x, C.min.x - P.max.x),
          y = Math.max(0, P.min.y - C.max.y, C.min.y - P.max.y),
          I = Math.max(0, P.min.z - C.max.z, C.min.z - P.max.z);
        return Math.hypot(M, y, I);
      };
    for (const P of x) {
      let C = "",
        M = 1 / 0;
      for (const y of x) {
        if (y === P) continue;
        const I = T(P.box, y.box);
        I < M && (M = I, C = y.name);
      }
      M > E && s.push(`part "${P.name}" is disconnected — its bounding box touches no other part (nearest: "${C}", gap ~${M.toFixed(2)}m); attach it or state why the separation is intentional`);
    }
  }
  const g = h.x > h.z * 1.25 || h.z > h.x * 1.25,
    b = h.x >= h.z ? 0 : 2;
  if (h.x > h.z * 1.25 && s.push(`model's longest horizontal span runs along X (${h.x.toFixed(2)}m vs Z ${h.z.toFixed(2)}m) — the convention is facing +Z with length along Z; if this object has a travel/facing direction, rotate the layout 90° (or confirm a wide object is intentional)`), g) {
    const E = /wheel|tyre|tire|rim/i,
      T = [];
    n.traverse(P => {
      if (P === n || !E.test(P.name || "")) return;
      for (let y = P.parent; y && y !== n; y = y.parent) if (E.test(y.name || "")) return;
      const C = new nt().setFromObject(P);
      if (C.isEmpty()) return;
      const M = C.getSize(new R());
      T.push({
        name: P.name,
        size: [M.x, M.y, M.z]
      });
    });
    for (const P of T) {
      const C = [...P.size].sort((I, j) => I - j);
      if (!(C[0] > 0 && C[0] < C[1] * 0.45 && C[1] >= C[2] * 0.75)) continue;
      const y = P.size.indexOf(Math.min(...P.size));
      y === b && s.push(`wheel-like part "${P.name}" has its rotation axis (thinnest size axis ${"XYZ"[y]}) parallel to the model's length axis — its wheel plane is perpendicular to the travel direction, i.e. the wheel is mounted sideways and cannot roll; a wheel must be thin ACROSS the travel direction`);
    }
  }
  return Math.max(h.x, h.y, h.z) > 200 && s.push(`model spans ${h.x.toFixed(1)}×${h.y.toFixed(1)}×${h.z.toFixed(1)}m — expected real-world meters; check units`), d.min.y < -0.25 && s.push(`model extends ${(-d.min.y).toFixed(2)}m below ground (y=0); origin should sit at ground level`), n.traverse(E => {
    const T = E;
    T.isMesh && (T.castShadow = !0, T.receiveShadow = !0);
  }), {
    root: n,
    parts: i,
    partDetails: p,
    stats: r,
    warnings: s,
    bbox: {
      min: [d.min.x, d.min.y, d.min.z],
      max: [d.max.x, d.max.y, d.max.z],
      size: [h.x, h.y, h.z]
    }
  };
}
const Mf = {
  front: [0, 0.18, 1],
  back: [0, 0.18, -1],
  left: [-1, 0.18, 0],
  right: [1, 0.18, 0],
  top: [0.001, 1, 0.001],
  three_quarter: [0.8, 0.5, 0.8],
  three_quarter_back: [-0.8, 0.5, -0.8]
};
function td(o, e, t, n, s) {
  const r = Fi(o);
  if (n) {
    const x = Math.PI / 180;
    for (const [g, b] of Object.entries(n)) {
      const w = r.root.children.find(v => v.name === g);
      w && (b.visible === !1 && (w.visible = !1), b.position && w.position.set(b.position.x, b.position.y, b.position.z), b.rotation && w.rotation.set(b.rotation.x * x, b.rotation.y * x, b.rotation.z * x), b.scale && w.scale.set(b.scale.x, b.scale.y, b.scale.z));
    }
  }
  const i = new Oo();
  i.background = new Ze(15921906), i.add(new Di(16777215, 12105920, 1.1));
  const a = new Gn(16777215, 2.2);
  a.position.set(4, 7, 5), i.add(a);
  const l = new Gn(16777215, 0.7);
  l.position.set(-5, 3, -4), i.add(l), i.add(r.root);
  const d = document.createElement("canvas");
  d.width = t, d.height = t;
  const u = new Ho({
    canvas: d,
    antialias: !0,
    preserveDrawingBuffer: !0
  });
  u.setSize(t, t, !1), u.outputColorSpace = $t;
  const h = new nt().setFromObject(r.root),
    m = h.getCenter(new R()),
    f = h.getSize(new R()).length() || 1,
    p = new $n(40, 1, f / 100, f * 20);
  try {
    for (const x of e) {
      const g = new R(...Mf[x]).normalize();
      p.position.copy(m).addScaledVector(g, f * 1.45), p.lookAt(m), p.updateProjectionMatrix(), u.render(i, p), s(x, d);
    }
  } finally {
    u.dispose(), u.forceContextLoss(), r.root.traverse(x => {
      var b;
      const g = x;
      if (g.isMesh || x.isPoints || x.isLine) {
        (b = g.geometry) == null || b.dispose();
        const w = g.material;
        Array.isArray(w) ? w.forEach(v => v.dispose()) : w == null || w.dispose();
      }
    });
  }
}
function Ef(o, e, t = 768, n) {
  const s = [];
  return td(o, e, t, n, (r, i) => {
    s.push({
      view: r,
      dataUrl: i.toDataURL("image/jpeg", 0.9),
      width: t,
      height: t
    });
  }), s;
}
function Cf(o) {
  return o <= 2 ? Math.max(o, 1) : o <= 4 ? 2 : o <= 6 ? 3 : 4;
}
function jf(o, e, t = 768, n) {
  const s = Cf(e.length),
    r = Math.ceil(e.length / s),
    i = Math.max(4, Math.round(t * 0.008)),
    a = document.createElement("canvas");
  a.width = s * t + (s + 1) * i, a.height = r * t + (r + 1) * i;
  const l = a.getContext("2d");
  if (!l) throw new Zt("2d canvas context unavailable for sheet composition", "run");
  l.fillStyle = "#3a3a3e", l.fillRect(0, 0, a.width, a.height);
  const d = Math.max(20, Math.round(t * 0.045)),
    u = [];
  return td(o, e, t, n, (h, m) => {
    const f = u.length,
      p = Math.floor(f / s),
      x = f % s,
      g = i + x * (t + i),
      b = i + p * (t + i);
    l.drawImage(m, g, b), l.font = `bold ${d}px system-ui, sans-serif`;
    const w = Math.round(d * 0.5),
      v = Math.round(d * 0.3),
      E = l.measureText(h).width;
    l.fillStyle = "rgba(20, 20, 24, 0.82)", l.fillRect(g, b, E + w * 2, d + v * 2), l.fillStyle = "#ffffff", l.textBaseline = "middle", l.fillText(h, g + w, b + v + d / 2), u.push({
      view: h,
      row: p,
      col: x
    });
  }), {
    dataUrl: a.toDataURL("image/jpeg", 0.9),
    width: a.width,
    height: a.height,
    cells: u
  };
}
function Sf(o) {
  o.traverse(e => {
    var n;
    const t = e;
    if (t.isMesh || e.isPoints || e.isLine) {
      (n = t.geometry) == null || n.dispose();
      const s = t.material;
      Array.isArray(s) ? s.forEach(r => r.dispose()) : s == null || s.dispose();
    }
  });
}
const We = Math.PI / 180,
  Ir = {
    dark: {
      sky: "#000000",
      ground: 1315860,
      gridMajor: 3815994,
      gridMinor: 2105376
    },
    light: {
      sky: "#fafafa",
      ground: 15132390,
      gridMajor: 11842740,
      gridMinor: 14606046
    }
  },
  Tf = "dark",
  Es = {
    dark: 16777215,
    light: 0
  },
  Wt = o => new R(o.x, o.y, o.z);
class Pf {
  constructor() {
    S(this, "tasks", new Map());
  }
  track(e, t) {
    const n = {
      promise: Promise.resolve(),
      error: null
    };
    return n.promise = t.then(() => {}, s => {
      n.error = s instanceof Error ? s : new Error(String(s));
    }), this.tasks.set(e, n), n.promise;
  }
  retain(e) {
    for (const t of this.tasks.keys()) e.has(t) || this.tasks.delete(t);
  }
  async wait(e = 1e4) {
    const t = [...this.tasks.entries()];
    if (!t.length) return;
    let n;
    try {
      await Promise.race([Promise.all(t.map(([, s]) => s.promise)), new Promise((s, r) => {
        n = setTimeout(() => r(new Error(`scene resources did not become ready within ${e}ms`)), e);
      })]);
    } finally {
      n && clearTimeout(n);
    }
    for (const [s, r] of t) if (this.tasks.get(s) === r && r.error) throw new Error(`${s}: ${r.error.message}`);
  }
}
function nd(o) {
  return {
    position: o.position.clone(),
    quaternion: o.quaternion.clone(),
    up: o.up.clone(),
    fov: o.fov,
    zoom: o.zoom
  };
}
function sd(o, e) {
  o.position.copy(e.position), o.quaternion.copy(e.quaternion), o.up.copy(e.up), o.fov = e.fov, o.zoom = e.zoom, o.updateProjectionMatrix();
}
const jt = class jt {
  constructor(e, t = {}) {
    S(this, "scene", new Oo());
    S(this, "renderer");
    S(this, "camera");
    S(this, "controls");
    S(this, "gizmo");
    S(this, "contentRoot", new je());
    S(this, "host");
    S(this, "raf", 0);
    S(this, "lastFrameT", performance.now());
    S(this, "ro");
    S(this, "raycaster", new Ti());
    S(this, "pointer", new yt());
    S(this, "navigationKeys", new Set());
    S(this, "chars", new Map());
    S(this, "props", new Map());
    S(this, "cams", new Map());
    S(this, "models", new Map());
    S(this, "codeModels", new Map());
    S(this, "onCodeModelError");
    S(this, "idIndex", new Map());
    S(this, "panoramaMesh");
    S(this, "panoramaUrl", "");
    S(this, "sceneReadiness", new Pf());
    S(this, "flatBgUrl", "");
    S(this, "flatBgTexture");
    S(this, "flatBgScene");
    S(this, "flatBgCamera");
    S(this, "flatBgMesh");
    S(this, "flatBgImgAspect", 16 / 9);
    S(this, "flatBgActive", !1);
    S(this, "flatClear", new Ze(0));
    S(this, "grid");
    S(this, "groundAxis");
    S(this, "ground");
    S(this, "theme", Tf);
    S(this, "lastEnv");
    S(this, "mode", "translate");
    S(this, "viewMode", "director");
    S(this, "selectedId", null);
    S(this, "selectedIds", []);
    S(this, "poseEditId", null);
    S(this, "jointHandles", new Map());
    S(this, "activeJointKey", null);
    S(this, "activeJointBone", null);
    S(this, "pivot", null);
    S(this, "pivotIds", []);
    S(this, "pivotStart", null);
    S(this, "memberStarts", []);
    S(this, "selectedGroup", null);
    S(this, "marquee", null);
    S(this, "marqueeEl", null);
    S(this, "downPtrId", null);
    S(this, "downX", 0);
    S(this, "downY", 0);
    S(this, "ptrMoved", !1);
    S(this, "lastDblTime", 0);
    S(this, "charLabelsVisible", !0);
    S(this, "camLabelsVisible", !0);
    S(this, "cb");
    S(this, "camTween");
    S(this, "renderCbs", new Set());
    S(this, "cameraDriver", null);
    S(this, "lastDriveT", 0);
    S(this, "groundPickCb", null);
    S(this, "groundPickReticle", null);
    S(this, "groundDrawCb", null);
    S(this, "groundDrawPts", []);
    S(this, "groundDrawLine", null);
    S(this, "groundDrawDots", null);
    S(this, "groundDrawHeight", 1.5);
    S(this, "groundDrawVLine", null);
    S(this, "groundDrawHeightLabel", null);
    S(this, "groundDrawLabelText", "");
    S(this, "groundDrawPointerXY", null);
    S(this, "onGroundDrawWheel", e => {
      !this.groundDrawCb || !e.altKey || (e.preventDefault(), e.stopPropagation(), this.adjustGroundDrawHeight(e.deltaY < 0 ? jt.GROUND_DRAW_H_STEP : -0.25));
    });
    S(this, "camIndicatorsSuppressed", !1);
    S(this, "camPathEditor");
    S(this, "animate", () => {
      var r, i;
      this.raf = requestAnimationFrame(this.animate);
      const e = performance.now(),
        t = Math.min(0.1, Math.max(0, (e - this.lastFrameT) / 1e3));
      if (this.lastFrameT = e, this.cameraDriver) {
        const a = Math.min(100, e - this.lastDriveT);
        this.lastDriveT = e, this.cameraDriver(a);
      } else if (this.camTween) {
        const a = Math.min(1, (e - this.camTween.t0) / this.camTween.dur),
          l = a < 0.5 ? 4 * a * a * a : 1 - Math.pow(-2 * a + 2, 3) / 2;
        this.camera.position.lerpVectors(this.camTween.fromP, this.camTween.toP, l), this.controls.target.lerpVectors(this.camTween.fromT, this.camTween.toT, l);
        const d = this.camTween.fromFov + (this.camTween.toFov - this.camTween.fromFov) * l;
        Math.abs(d - this.camera.fov) > 0.001 && (this.camera.fov = d, this.camera.updateProjectionMatrix()), this.camera.lookAt(this.controls.target), a >= 1 && (this.camTween = void 0);
      } else this.applyViewportNavigation(t), this.controls.update();
      if (!this.camTween && this.viewMode === "camera" && this.trackedCamId) {
        const a = (r = this.lastComp) == null ? void 0 : r.cameras.find(l => l.id === this.trackedCamId);
        if (a && a.lookAtTarget && a.lookAtTarget !== Ne) {
          const l = this.resolveLookAt(a);
          this.controls.target.copy(l), this.camera.position.set(a.position.x, a.position.y, a.position.z), this.camera.lookAt(l);
        }
      }
      this.partHighlight && this.syncPartHighlight();
      const n = (this.host.clientWidth || 1) / (this.host.clientHeight || 1);
      this.updateJointHandlePositions(), (i = this.camPathEditor) == null || i.updateHandleScales(this.camera);
      const s = this.renderFlatBackground(this.renderer, n);
      this.renderer.autoClear = !s, this.renderer.render(this.scene, this.camera), this.renderer.autoClear = !0, this.copyVideoCaptureFrame(), this.renderCbs.forEach(a => a());
    });
    S(this, "onPointerDown", e => {
      var r, i;
      if (this.renderer.domElement.focus({
        preventScroll: !0
      }), e.button === 1 && e.altKey && this.selectedGroup && this.pivot) {
        const a = this.groundPointFromEvent(e, this.pivot.position.y);
        a && (this.pivot.position.copy(a), this.snapshotPivot(), (i = (r = this.cb).onGroupPivotChange) == null || i.call(r, this.selectedGroup.id, {
          x: a.x,
          y: a.y,
          z: a.z
        })), e.preventDefault(), e.stopImmediatePropagation();
        return;
      }
      const t = e.button === 0 && e.ctrlKey && e.altKey,
        n = e.button === 0 && e.shiftKey && !e.ctrlKey && !e.altKey,
        s = e.button === 0 && !e.shiftKey && !e.ctrlKey && !e.altKey && (this.viewMode === "front" || this.viewMode === "top");
      if ((t || n || s) && !this.gizmo.dragging && !this.groundPickCb && !this.groundDrawCb && !this.cameraDriver) {
        this.beginMarquee(e, t ? "remove" : n ? "add" : "replace"), e.preventDefault(), e.stopImmediatePropagation();
        return;
      }
      e.button === 0 && (this.downPtrId = e.pointerId, this.downX = e.clientX, this.downY = e.clientY, this.ptrMoved = !1);
    });
    S(this, "onNavigationKeyDown", e => {
      if (!(e.metaKey || e.ctrlKey || e.altKey)) {
        if (e.code === "ShiftLeft" || e.code === "ShiftRight") {
          this.navigationKeys.add(e.code);
          return;
        }
        jt.NAVIGATION_CODES.has(e.code) && (this.groundPickCb || this.groundDrawCb || (e.preventDefault(), e.stopPropagation(), this.camTween = void 0, this.navigationKeys.add(e.code)));
      }
    });
    S(this, "onNavigationKeyUp", e => {
      this.navigationKeys.has(e.code) && (this.navigationKeys.delete(e.code), jt.NAVIGATION_CODES.has(e.code) && (e.preventDefault(), e.stopPropagation()));
    });
    S(this, "clearNavigationKeys", () => {
      this.navigationKeys.clear();
    });
    S(this, "onPointerMove", e => {
      var t;
      if (((t = this.marquee) == null ? void 0 : t.pointerId) === e.pointerId) {
        this.updateMarqueeElement(e.clientX, e.clientY), e.preventDefault();
        return;
      }
      if (this.downPtrId === e.pointerId && (Math.abs(e.clientX - this.downX) > 4 || Math.abs(e.clientY - this.downY) > 4) && (this.ptrMoved = !0), this.groundDrawCb) {
        this.groundDrawPointerXY = {
          clientX: e.clientX,
          clientY: e.clientY
        }, this.refreshGroundDrawCursor();
        return;
      }
      this.groundPickCb && this.updateGroundPickReticle(e);
    });
    S(this, "onPointerUp", e => {
      if (this.finishMarquee(e) || e.button !== 0 || this.downPtrId !== e.pointerId || (this.downPtrId = null, this.ptrMoved)) return;
      const t = e.clientX,
        n = e.clientY,
        s = e.shiftKey || e.metaKey || e.ctrlKey;
      window.requestAnimationFrame(() => {
        var i, a, l, d, u, h;
        if (performance.now() - this.lastDblTime < 250 || this.gizmo.dragging) return;
        if (this.groundDrawCb) {
          const m = this.groundPointFromEvent({
            clientX: t,
            clientY: n
          }, this.groundDrawHeight);
          m && this.addGroundDrawPoint(m);
          return;
        }
        if (this.groundPickCb) {
          this.resolveGroundPick({
            clientX: t,
            clientY: n
          });
          return;
        }
        if (this.camPathEditor.active) {
          const m = this.camPathEditor.pickHandle({
            clientX: t,
            clientY: n
          });
          if (m) {
            this.camPathEditor.selectHandle(m);
            return;
          }
          const f = this.pick({
            clientX: t,
            clientY: n
          });
          if (f) {
            (a = (i = this.cb).onSelect) == null || a.call(i, f, s, !1);
            return;
          }
          this.camPathEditor.clearSelection();
          return;
        }
        if (this.poseEditId) {
          const m = this.pickJointHandle({
            clientX: t,
            clientY: n
          });
          if (m) {
            this.attachGizmoToJoint(m);
            return;
          }
          const f = this.pick({
            clientX: t,
            clientY: n
          });
          if (f && f !== this.poseEditId) {
            (d = (l = this.cb).onSelect) == null || d.call(l, f, s, !1);
            return;
          }
          this.detachJointGizmo();
          return;
        }
        const r = this.pick({
          clientX: t,
          clientY: n
        });
        (h = (u = this.cb).onSelect) == null || h.call(u, r, s, !1);
      });
    });
    S(this, "onDblClick", e => {
      var n, s, r, i;
      if (e.button !== 0 || this.gizmo.dragging || this.groundPickCb) return;
      if (this.lastDblTime = performance.now(), this.groundDrawCb) {
        e.preventDefault();
        const a = this.groundPointFromEvent(e, this.groundDrawHeight);
        a && this.addGroundDrawPoint(a), this.completeGroundDraw();
        return;
      }
      if (this.camPathEditor.active) {
        e.preventDefault(), this.camPathEditor.tryInsertFromDblClick(e);
        return;
      }
      const t = this.pick(e);
      if (t) {
        if (this.codeModels.has(t)) {
          const a = this.pickCodePart(t, e);
          if (a) {
            e.preventDefault(), (s = (n = this.cb).onSelect) == null || s.call(n, Sc(t, a), !1, !0);
            return;
          }
        }
        e.preventDefault(), (i = (r = this.cb).onSelect) == null || i.call(r, t, !1, !0);
      }
    });
    S(this, "activeIkKey", null);
    S(this, "jointGizmoAnchor", null);
    S(this, "jointAnchorStartQ", null);
    S(this, "jointBoneStartQ", null);
    S(this, "camPathAnchor", null);
    S(this, "camPathAnchorId", null);
    S(this, "camPathAnchorStart", null);
    S(this, "camPathViz", new Map());
    S(this, "camPathVizSuppressed", null);
    S(this, "lastComp");
    S(this, "drivenIds", new Set());
    S(this, "poseDrivenIds", new Set());
    S(this, "modelLoadToken", 0);
    S(this, "partHighlight", null);
    S(this, "objCenterBox", new nt());
    S(this, "objCenterVec", new R());
    S(this, "trackedCamId", null);
    S(this, "videoCaptureTarget", null);
    S(this, "cleanCaptureHidden", null);
    this.host = e, this.cb = t, this.init();
    const n = this;
    this.camPathEditor = new sp({
      get scene() {
        return n.scene;
      },
      get camera() {
        return n.camera;
      },
      get gizmo() {
        return n.gizmo;
      },
      get dom() {
        return n.renderer.domElement;
      },
      detachMainGizmo: () => {
        this.detachJointGizmo(), this.gizmo.detach();
      },
      onCamPathEdit: (s, r, i, a) => {
        var l, d;
        return (d = (l = this.cb).onCamPathEdit) == null ? void 0 : d.call(l, s, r, i, a);
      },
      onCamPathPointSelect: s => {
        var r, i;
        s == null && this.camPathEditor.activeTakeId && this.attachCamPathAnchor(this.camPathEditor.activeTakeId), (i = (r = this.cb).onCamPathPointSelect) == null || i.call(r, s);
      }
    });
  }
  onRender(e) {
    return this.renderCbs.add(e), () => this.renderCbs.delete(e);
  }
  setCameraDriver(e) {
    this.cameraDriver = e, e ? (this.camTween = void 0, this.controls.enabled = !1, this.lastDriveT = performance.now()) : this.controls.enabled = this.viewMode !== "camera";
  }
  get hasCameraDriver() {
    return this.cameraDriver != null;
  }
  requestGroundPick(e) {
    this.cancelGroundPick(), this.cancelGroundDraw(), this.groundPickCb = e, this.renderer.domElement.style.cursor = "crosshair", this.showGroundPickReticle();
  }
  get groundPickActive() {
    return this.groundPickCb != null;
  }
  cancelGroundPick() {
    const e = this.groundPickCb;
    e && (this.groundPickCb = null, this.renderer.domElement.style.cursor = "", this.hideGroundPickReticle(), e(null));
  }
  groundPointFromEvent(e, t = 0) {
    Ns(this.raycaster, this.pointer, e, this.renderer.domElement, this.camera);
    const n = new hc(new R(0, 1, 0), -t),
      s = new R();
    return this.raycaster.ray.intersectPlane(n, s) ? s : null;
  }
  resolveGroundPick(e) {
    const t = this.groundPickCb;
    t && (this.groundPickCb = null, this.renderer.domElement.style.cursor = "", this.hideGroundPickReticle(), t(this.groundPointFromEvent(e)));
  }
  showGroundPickReticle() {
    if (this.groundPickReticle) return;
    const e = new je(),
      t = () => new ct({
        color: Es[this.theme],
        transparent: !0,
        opacity: 0.9,
        depthTest: !1,
        side: zo
      }),
      n = new z(new La(0.34, 0.4, 48), t()),
      s = new z(new mi(0.06, 24), t());
    for (const r of [n, s]) r.rotation.x = -Math.PI / 2, r.renderOrder = 999, e.add(r);
    e.position.y = 0.01, e.visible = !1, e.userData._isHelper = !0, this.scene.add(e), this.groundPickReticle = e;
  }
  hideGroundPickReticle() {
    const e = this.groundPickReticle;
    e && (this.groundPickReticle = null, this.scene.remove(e), e.children.forEach(t => {
      const n = t;
      n.geometry.dispose(), n.material.dispose();
    }));
  }
  updateGroundPickReticle(e) {
    const t = this.groundPickReticle;
    if (!t || !this.groundPickCb) return;
    const n = this.groundPointFromEvent(e);
    n ? (t.position.set(n.x, 0.01, n.z), t.visible = !0) : t.visible = !1;
  }
  requestGroundDraw(e) {
    this.cancelGroundPick(), this.cancelGroundDraw(), this.groundDrawCb = e, this.groundDrawHeight = 1.5, this.renderer.domElement.style.cursor = "crosshair", this.showGroundPickReticle(), window.addEventListener("wheel", this.onGroundDrawWheel, {
      capture: !0,
      passive: !1
    });
  }
  get groundDrawActive() {
    return this.groundDrawCb != null;
  }
  cancelGroundDraw() {
    this.finishGroundDraw(null);
  }
  completeGroundDraw() {
    !this.groundDrawCb || this.groundDrawPts.length < 2 || this.finishGroundDraw([...this.groundDrawPts]);
  }
  adjustGroundDrawHeight(e) {
    this.groundDrawCb && (this.groundDrawHeight = ke.clamp(this.groundDrawHeight + e, 0, jt.GROUND_DRAW_H_MAX), this.refreshGroundDrawCursor());
  }
  addGroundDrawPoint(e) {
    const t = this.groundDrawPts[this.groundDrawPts.length - 1];
    t && t.distanceTo(e) < jt.GROUND_DRAW_MIN_GAP || (this.groundDrawPts.push(e), this.updateGroundDrawLine(e));
  }
  finishGroundDraw(e) {
    const t = this.groundDrawCb;
    t && (this.groundDrawCb = null, this.groundDrawPts = [], this.groundDrawPointerXY = null, window.removeEventListener("wheel", this.onGroundDrawWheel, {
      capture: !0
    }), this.renderer.domElement.style.cursor = "", this.hideGroundPickReticle(), this.hideGroundDrawLine(), t(e));
  }
  refreshGroundDrawCursor() {
    const e = this.groundDrawPointerXY,
      t = e ? this.groundPointFromEvent(e, this.groundDrawHeight) : null,
      n = this.groundPickReticle;
    n && (t ? (n.position.set(t.x, t.y + 0.01, t.z), n.visible = !0) : n.visible = !1), this.updateGroundDrawVLine(t), this.updateGroundDrawLine(t ?? void 0);
  }
  updateGroundDrawVLine(e) {
    const t = this.groundDrawHeight;
    if (!e || t < 0.05) {
      this.groundDrawVLine && (this.groundDrawVLine.visible = !1), this.groundDrawHeightLabel && (this.groundDrawHeightLabel.visible = !1);
      return;
    }
    if (!this.groundDrawVLine) {
      const a = new Pt();
      a.setAttribute("position", new ls(new Float32Array(2 * 3), 3).setUsage(pr)), a.setAttribute("lineDistance", new ls(new Float32Array(2), 1).setUsage(pr));
      const l = new _t(a, new lh({
        color: Es[this.theme],
        transparent: !0,
        opacity: 0.5,
        depthTest: !1,
        dashSize: 0.2,
        gapSize: 0.15
      }));
      l.renderOrder = 999, l.frustumCulled = !1, l.userData._isHelper = !0, this.scene.add(l), this.groundDrawVLine = l;
    }
    const n = this.groundDrawVLine,
      s = n.geometry.getAttribute("position");
    s.setXYZ(0, e.x, 0, e.z), s.setXYZ(1, e.x, e.y, e.z), s.needsUpdate = !0;
    const r = n.geometry.getAttribute("lineDistance");
    r.setX(0, 0), r.setX(1, Math.abs(e.y)), r.needsUpdate = !0, n.visible = !0;
    const i = `${t.toFixed(2)} m`;
    if (i !== this.groundDrawLabelText || !this.groundDrawHeightLabel) {
      this.disposeGroundDrawLabel();
      const a = Vo(i, 14, "#ffffff");
      a && (a.scale.set(a.__aspect * 0.32, 0.32, 1), a.renderOrder = 999, a.userData._isHelper = !0, this.scene.add(a), this.groundDrawHeightLabel = a, this.groundDrawLabelText = i);
    }
    this.groundDrawHeightLabel && (this.groundDrawHeightLabel.position.set(e.x, e.y + 0.45, e.z), this.groundDrawHeightLabel.visible = !0);
  }
  disposeGroundDrawLabel() {
    var t;
    const e = this.groundDrawHeightLabel;
    e && (this.groundDrawHeightLabel = null, this.groundDrawLabelText = "", this.scene.remove(e), (t = e.material.map) == null || t.dispose(), e.material.dispose());
  }
  writeGroundDrawGeometry(e, t) {
    let n = e.getAttribute("position");
    if (!n || n.count < t.length) {
      const s = Math.max(jt.GROUND_DRAW_CAP, ke.ceilPowerOfTwo(t.length));
      n = new ls(new Float32Array(s * 3), 3).setUsage(pr), e.setAttribute("position", n);
    }
    for (let s = 0; s < t.length; s++) n.setXYZ(s, t[s].x, t[s].y + 0.02, t[s].z);
    n.needsUpdate = !0, e.setDrawRange(0, t.length);
  }
  updateGroundDrawLine(e) {
    if (this.groundDrawPts.length > 0) {
      if (!this.groundDrawDots) {
        const n = new ss(new Pt(), new xc({
          color: Es[this.theme],
          size: 8,
          sizeAttenuation: !1,
          transparent: !0,
          opacity: 0.95,
          depthTest: !1
        }));
        n.renderOrder = 999, n.frustumCulled = !1, n.userData._isHelper = !0, this.scene.add(n), this.groundDrawDots = n;
      }
      this.writeGroundDrawGeometry(this.groundDrawDots.geometry, this.groundDrawPts), this.groundDrawDots.visible = !0;
    } else this.groundDrawDots && (this.groundDrawDots.visible = !1);
    const t = e ? [...this.groundDrawPts, e] : this.groundDrawPts;
    if (t.length < 2) {
      this.groundDrawLine && (this.groundDrawLine.visible = !1);
      return;
    }
    if (!this.groundDrawLine) {
      const n = new _t(new Pt(), new Sn({
        color: Es[this.theme],
        transparent: !0,
        opacity: 0.9,
        depthTest: !1
      }));
      n.renderOrder = 999, n.frustumCulled = !1, n.userData._isHelper = !0, this.scene.add(n), this.groundDrawLine = n;
    }
    this.writeGroundDrawGeometry(this.groundDrawLine.geometry, t), this.groundDrawLine.visible = !0;
  }
  hideGroundDrawLine() {
    const e = this.groundDrawLine;
    e && (this.groundDrawLine = null, this.scene.remove(e), e.geometry.dispose(), e.material.dispose());
    const t = this.groundDrawDots;
    t && (this.groundDrawDots = null, this.scene.remove(t), t.geometry.dispose(), t.material.dispose());
    const n = this.groundDrawVLine;
    n && (this.groundDrawVLine = null, this.scene.remove(n), n.geometry.dispose(), n.material.dispose()), this.disposeGroundDrawLabel();
  }
  setCamIndicatorsVisible(e) {
    this.camIndicatorsSuppressed = !e, this.cams.forEach(t => t.group.visible = e && this.viewMode !== "camera" && t.modelVisible);
  }
  enterCamPathEdit(e, t, n = !1) {
    var i, a, l;
    if (this.camPathEditor.activeTakeId === e) return;
    const s = (a = (i = this.lastComp) == null ? void 0 : i.camPaths) == null ? void 0 : a.find(d => d.id === e),
      r = s && s.lookAtTarget === Ne && s.lookAt ? s.lookAt : null;
    this.camPathEditor.enter(e, t, n, r), this.syncCamPathViz((l = this.lastComp) == null ? void 0 : l.camPaths), this.attachCamPathAnchor(e);
  }
  exitCamPathEdit() {
    var e;
    this.camPathEditor.active && (this.camPathEditor.exit(), this.gizmo.setMode(this.mode), this.selectedId && this.setSelected(this.selectedId, this.selectedIds, this.selectedGroup), this.syncCamPathViz((e = this.lastComp) == null ? void 0 : e.camPaths));
  }
  get camPathEditingId() {
    return this.camPathEditor.activeTakeId;
  }
  get camPathEditorLookAtSelected() {
    return this.camPathEditor.active && this.camPathEditor.lookAtIsSelected;
  }
  camPathEditorSelectPoint(e) {
    this.camPathEditor.active && (e == null ? this.camPathEditor.clearSelection() : this.camPathEditor.selectPoint(e));
  }
  camPathEditorUpdatePoint(e, t, n) {
    this.camPathEditor.updatePoint(e, t, n);
  }
  camPathEditorDelete() {
    return this.camPathEditor.deleteSelected();
  }
  syncCamPathFromStore(e, t, n, s) {
    return this.camPathEditor.activeTakeId !== e ? !1 : !t || t.length === 0 ? (this.exitCamPathEdit(), !1) : (n != null && this.camPathEditor.setClosed(n), this.camPathEditor.syncFromStore(t, s));
  }
  init() {
    var l, d;
    const e = this.host.clientWidth || 800,
      t = this.host.clientHeight || 600,
      n = Ir[this.theme];
    this.scene.background = new Ze(n.sky), this.scene.add(this.contentRoot), this.renderer = new Ho({
      antialias: !0,
      preserveDrawingBuffer: !0
    }), this.renderer.setSize(e, t), this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)), this.renderer.outputColorSpace = $t, this.renderer.shadowMap.enabled = !0, this.renderer.shadowMap.type = ch, this.renderer.domElement.tabIndex = 0, this.renderer.domElement.setAttribute("aria-label", "3D viewport"), this.renderer.domElement.style.outline = "none", this.host.appendChild(this.renderer.domElement), this.camera = new $n(50, e / t, 0.1, 2e3), this.camera.position.set(0, 2.2, 10), this.controls = new Bh(this.camera, this.renderer.domElement), this.controls.enableDamping = !0, this.controls.dampingFactor = 0.08, this.controls.minDistance = 1, this.controls.maxDistance = 60, this.controls.target.set(0, 1.2, 0), this.scene.add(new vc(16777215, 1.05)), this.scene.add(new Di(16777215, 2895616, 0.85));
    const s = new Gn(16777215, 1.2);
    s.position.set(5, 10, 5), s.castShadow = !0, s.shadow.mapSize.set(1024, 1024), s.shadow.camera.near = 0.5, s.shadow.camera.far = 50, s.shadow.camera.left = -15, s.shadow.camera.right = 15, s.shadow.camera.top = 15, s.shadow.camera.bottom = -15, this.scene.add(s);
    const r = new Gn(16119807, 0.75);
    r.position.set(-5, 3, -5), this.scene.add(r);
    const i = new z(new Lo(40, 40), new Lt({
      color: n.ground,
      roughness: 0.9,
      transparent: !0,
      opacity: 0.85
    }));
    i.rotation.x = -Math.PI / 2, i.receiveShadow = !0, i.userData._isHelper = !0, this.contentRoot.add(i), this.ground = i;
    const a = new za(20, 20, n.gridMajor, n.gridMinor);
    a.material.opacity = 0.8, a.material.transparent = !0, a.userData._isHelper = !0, this.contentRoot.add(a), this.grid = a, this.groundAxis = this.makeGroundAxis(), this.contentRoot.add(this.groundAxis), this.gizmo = new Uh(this.camera, this.renderer.domElement), this.gizmo.setSize(0.8), this.gizmo.setSpace("world"), this.gizmo.userData._isHelper = !0, (d = (l = this.gizmo).traverse) == null || d.call(l, u => u.userData._isHelper = !0), this.scene.add(this.gizmo), this.gizmo.addEventListener("dragging-changed", u => {
      this.controls.enabled = !u.value && this.viewMode !== "camera" && !this.cameraDriver;
    }), this.gizmo.addEventListener("objectChange", () => {
      var u;
      (u = this.camPathEditor) != null && u.ownsGizmo ? this.camPathEditor.onGizmoChange(!1) : this.activeIkKey ? this.onIkGizmoChange(!1) : this.activeJointKey ? this.onJointGizmoChange(!1) : this.onGizmoChange(!1);
    }), this.gizmo.addEventListener("mouseUp", () => {
      var u;
      (u = this.camPathEditor) != null && u.ownsGizmo ? this.camPathEditor.onGizmoChange(!0) : this.activeIkKey ? this.onIkGizmoChange(!0) : this.activeJointKey ? this.onJointGizmoChange(!0) : this.onGizmoChange(!0);
    }), this.renderer.domElement.addEventListener("pointerdown", this.onPointerDown, !0), this.renderer.domElement.addEventListener("pointermove", this.onPointerMove), this.renderer.domElement.addEventListener("pointerup", this.onPointerUp), this.renderer.domElement.addEventListener("dblclick", this.onDblClick), this.renderer.domElement.addEventListener("keydown", this.onNavigationKeyDown), this.renderer.domElement.addEventListener("keyup", this.onNavigationKeyUp), this.renderer.domElement.addEventListener("blur", this.clearNavigationKeys), window.addEventListener("keyup", this.onNavigationKeyUp), window.addEventListener("blur", this.clearNavigationKeys), this.ro = new ResizeObserver(() => this.resize()), this.ro.observe(this.host), this.animate();
  }
  makeGroundAxis() {
    const e = new je();
    e.userData._isGroundAxis = !0, e.userData._isHelper = !0;
    const t = (n, s, r) => {
      const i = new Pt().setFromPoints([n, s]);
      return new _t(i, new Sn({
        color: r,
        transparent: !0,
        opacity: 0.5
      }));
    };
    return e.add(t(new R(-30, 0, 0), new R(30, 0, 0), 13378099)), e.add(t(new R(0, 0, -30), new R(0, 0, 30), 2250188)), e;
  }
  resize() {
    const e = this.host.clientWidth,
      t = this.host.clientHeight;
    !e || !t || (this.camera.aspect = e / t, this.camera.updateProjectionMatrix(), this.renderer.setSize(e, t), this.layoutFlatBackground());
  }
  pick(e) {
    var r;
    Ns(this.raycaster, this.pointer, e, this.renderer.domElement, this.camera);
    const t = [];
    this.chars.forEach(i => t.push(i.pickProxy, i.group)), this.props.forEach(i => t.push(i.group)), this.models.forEach(i => t.push(i.pickProxy, i.group)), this.codeModels.forEach(i => t.push(i.pickProxy, i.group)), this.cams.forEach(i => t.push(i.group));
    const n = this.raycaster.intersectObjects(t, !0);
    let s = null;
    for (const i of n) {
      let a = !1;
      for (let d = i.object; d; d = d.parent) if ((r = d.userData) != null && r.isCameraDirectionGuide) {
        a = !0;
        break;
      }
      if (a) continue;
      let l = i.object;
      for (; l;) {
        const d = this.idIndex.get(l);
        if (d) {
          s = d;
          break;
        }
        l = l.parent;
      }
      if (s) break;
    }
    return s;
  }
  beginMarquee(e, t) {
    if (this.marquee = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      mode: t
    }, this.controls.enabled = !1, this.renderer.domElement.setPointerCapture(e.pointerId), !this.marqueeEl) {
      const n = document.createElement("div");
      n.style.cssText = ["position:absolute", "pointer-events:none", "z-index:30", "border:1px solid rgba(96,165,250,.95)", "background:rgba(59,130,246,.14)"].join(";"), this.host.appendChild(n), this.marqueeEl = n;
    }
    this.updateMarqueeElement(e.clientX, e.clientY);
  }
  updateMarqueeElement(e, t) {
    if (!this.marquee || !this.marqueeEl) return;
    const n = this.host.getBoundingClientRect(),
      s = Math.min(this.marquee.startX, e) - n.left,
      r = Math.min(this.marquee.startY, t) - n.top;
    this.marqueeEl.style.left = `${s}px`, this.marqueeEl.style.top = `${r}px`, this.marqueeEl.style.width = `${Math.abs(e - this.marquee.startX)}px`, this.marqueeEl.style.height = `${Math.abs(t - this.marquee.startY)}px`;
  }
  idsInMarquee(e, t, n, s) {
    const r = this.renderer.domElement.getBoundingClientRect(),
      i = {
        left: Math.min(e, n),
        right: Math.max(e, n),
        top: Math.min(t, s),
        bottom: Math.max(t, s)
      },
      a = [];
    for (const l of [...this.chars.keys(), ...this.props.keys(), ...this.codeModels.keys(), ...this.cams.keys()]) {
      const d = this.selectionObject(l);
      if (!(d != null && d.visible)) continue;
      const u = this.cams.has(l) ? new nt().setFromCenterAndSize(d.position, new R(0.4, 0.4, 0.4)) : new nt().setFromObject(d);
      if (u.isEmpty()) continue;
      const h = [new R(u.min.x, u.min.y, u.min.z), new R(u.min.x, u.min.y, u.max.z), new R(u.min.x, u.max.y, u.min.z), new R(u.min.x, u.max.y, u.max.z), new R(u.max.x, u.min.y, u.min.z), new R(u.max.x, u.min.y, u.max.z), new R(u.max.x, u.max.y, u.min.z), new R(u.max.x, u.max.y, u.max.z)];
      let m = 1 / 0,
        f = -1 / 0,
        p = 1 / 0,
        x = -1 / 0,
        g = !1;
      for (const b of h) {
        const w = b.project(this.camera);
        if (w.z < -1 || w.z > 1) continue;
        g = !0;
        const v = r.left + (w.x + 1) * r.width / 2,
          E = r.top + (1 - w.y) * r.height / 2;
        m = Math.min(m, v), f = Math.max(f, v), p = Math.min(p, E), x = Math.max(x, E);
      }
      g && m <= i.right && f >= i.left && p <= i.bottom && x >= i.top && a.push(l);
    }
    return a;
  }
  finishMarquee(e) {
    var s, r, i, a, l, d, u;
    const t = this.marquee;
    if (!t || t.pointerId !== e.pointerId) return !1;
    if (this.marquee = null, (s = this.marqueeEl) == null || s.remove(), this.marqueeEl = null, this.renderer.domElement.hasPointerCapture(e.pointerId) && this.renderer.domElement.releasePointerCapture(e.pointerId), this.controls.enabled = this.viewMode !== "camera" && !this.cameraDriver, Math.hypot(e.clientX - t.startX, e.clientY - t.startY) > 4) (i = (r = this.cb).onSelectMany) == null || i.call(r, this.idsInMarquee(t.startX, t.startY, e.clientX, e.clientY), t.mode);else {
      const h = this.pick(e);
      t.mode === "remove" ? (l = (a = this.cb).onSelectMany) == null || l.call(a, h ? [h] : [], "remove") : (u = (d = this.cb).onSelect) == null || u.call(d, h, t.mode === "add", !1);
    }
    return e.preventDefault(), e.stopPropagation(), !0;
  }
  applyViewportNavigation(e) {
    if (!this.navigationKeys.size || e <= 0 || !this.controls.enabled || this.viewMode === "camera" || this.cameraDriver || this.gizmo.dragging || this.groundPickCb || this.groundDrawCb) return;
    const t = Number(this.navigationKeys.has("KeyW") || this.navigationKeys.has("ArrowUp") || this.navigationKeys.has("Numpad8")) - Number(this.navigationKeys.has("KeyS") || this.navigationKeys.has("ArrowDown") || this.navigationKeys.has("Numpad2")),
      n = Number(this.navigationKeys.has("KeyD") || this.navigationKeys.has("ArrowRight") || this.navigationKeys.has("Numpad6")) - Number(this.navigationKeys.has("KeyA") || this.navigationKeys.has("ArrowLeft") || this.navigationKeys.has("Numpad4")),
      s = Number(this.navigationKeys.has("KeyQ")) - Number(this.navigationKeys.has("KeyE")),
      r = this.navigationKeys.has("ShiftLeft") || this.navigationKeys.has("ShiftRight");
    if (s) {
      const i = this.controls.target.clone().sub(this.camera.position);
      if (i.lengthSq() > 1e-8) {
        const a = (r ? 150 : 90) * We;
        i.applyAxisAngle(Ot.DEFAULT_UP, s * a * e), this.controls.target.copy(this.camera.position).add(i), this.camera.lookAt(this.controls.target);
      }
    }
    if (t || n) {
      const i = new R();
      this.camera.getWorldDirection(i), i.y = 0, i.lengthSq() < 1e-8 ? i.set(0, 0, -1) : i.normalize();
      const a = i.clone().cross(Ot.DEFAULT_UP).normalize(),
        l = i.multiplyScalar(t).addScaledVector(a, n);
      l.lengthSq() > 1 && l.normalize();
      const d = this.camera.position.distanceTo(this.controls.target),
        u = ke.clamp(d * 0.8, 2, 20) * (r ? 3 : 1);
      l.multiplyScalar(u * e), this.camera.position.add(l), this.controls.target.add(l);
    }
  }
  pickJointHandle(e) {
    var s, r;
    return this.jointHandles.size === 0 ? null : (Ns(this.raycaster, this.pointer, e, this.renderer.domElement, this.camera), ((r = (s = this.raycaster.intersectObjects([...this.jointHandles.values()], !1)[0]) == null ? void 0 : s.object.userData) == null ? void 0 : r.jointKey) ?? null);
  }
  pickCodePart(e, t) {
    const n = this.codeModels.get(e);
    if (!n) return null;
    Ns(this.raycaster, this.pointer, t, this.renderer.domElement, this.camera);
    for (const s of this.raycaster.intersectObject(n.root, !0)) {
      let r = s.object;
      for (; r && r.parent !== n.root;) r = r.parent;
      if (r != null && r.name && r.visible) return r.name;
    }
    return null;
  }
  onGizmoChange(e) {
    var r, i, a, l, d, u, h, m, f, p, x, g, b;
    const t = this.gizmo.object;
    if (!t) return;
    if (this.pivot && t === this.pivot && this.pivotStart) {
      const w = this.pivotStart,
        v = this.pivot,
        E = [],
        T = w.quaternion.clone().invert().premultiply(v.quaternion),
        P = new R(w.scale.x !== 0 ? v.scale.x / w.scale.x : 1, w.scale.y !== 0 ? v.scale.y / w.scale.y : 1, w.scale.z !== 0 ? v.scale.z / w.scale.z : 1);
      for (const M of this.memberStarts) {
        const y = {};
        if (this.mode === "translate") {
          const I = M.position.clone().add(v.position.clone().sub(w.position));
          if (y.position = {
            x: I.x,
            y: I.y,
            z: I.z
          }, M.kind === "camera" && M.lookAt) {
            const j = M.lookAt.clone().add(v.position.clone().sub(w.position));
            y.lookAt = {
              x: j.x,
              y: j.y,
              z: j.z
            };
          }
        } else if (this.mode === "rotate") {
          const I = M.position.clone().sub(w.position).applyQuaternion(T),
            j = w.position.clone().add(I);
          if (y.position = {
            x: j.x,
            y: j.y,
            z: j.z
          }, M.kind === "camera" && M.lookAt) {
            const D = w.position.clone().add(M.lookAt.clone().sub(w.position).applyQuaternion(T));
            y.lookAt = {
              x: D.x,
              y: D.y,
              z: D.z
            };
          } else {
            const D = M.quaternion.clone().premultiply(T),
              H = new Qe().setFromQuaternion(D);
            y.rotation = {
              x: H.x / We,
              y: H.y / We,
              z: H.z / We
            };
          }
        } else {
          const I = M.position.clone().sub(w.position).multiply(P),
            j = w.position.clone().add(I);
          if (y.position = {
            x: j.x,
            y: j.y,
            z: j.z
          }, M.kind === "camera" && M.lookAt) {
            const D = M.lookAt.clone().add(j.clone().sub(M.position));
            y.lookAt = {
              x: D.x,
              y: D.y,
              z: D.z
            };
          } else if (M.dataScale) {
            const D = M.dataScale.clone().multiply(P);
            y.scale = {
              x: D.x,
              y: D.y,
              z: D.z
            };
          }
        }
        E.push({
          kind: M.kind,
          id: M.id,
          patch: y
        });
      }
      const C = this.selectedGroup ? {
        groupId: this.selectedGroup.id,
        pivot: {
          x: this.pivot.position.x,
          y: this.pivot.position.y,
          z: this.pivot.position.z
        }
      } : void 0;
      C && (this.selectedGroup = {
        id: C.groupId,
        pivot: C.pivot
      }), (i = (r = this.cb).onTransformMany) == null || i.call(r, E, e, C), e && this.recenterPivot();
      return;
    }
    if (!this.selectedId) return;
    const n = this.selectedId;
    if (this.camPathAnchor && t === this.camPathAnchor && this.camPathAnchorId && this.camPathAnchorStart) {
      const w = this.camPathAnchorStart,
        v = this.camPathAnchor,
        {
          points: E,
          lookAt: T
        } = Lc(w.points, {
          center: w.pos,
          translate: v.position.clone().sub(w.pos),
          quaternion: v.quaternion,
          scale: v.scale,
          lookAt: w.lookAt
        }),
        P = T ? {
          lookAt: T
        } : void 0;
      (l = (a = this.cb).onCamPathEdit) == null || l.call(a, this.camPathAnchorId, E, e, P), e && (w.pos.copy(v.position), v.quaternion.identity(), v.scale.set(1, 1, 1), w.points = E, P != null && P.lookAt && (w.lookAt = P.lookAt));
      return;
    }
    const s = {
      position: {
        x: t.position.x,
        y: t.position.y,
        z: t.position.z
      }
    };
    if (this.mode === "rotate" && this.cams.has(n)) {
      const w = (d = this.lastComp) == null ? void 0 : d.cameras.find(P => P.id === n),
        v = w && t.position.distanceTo(Wt(w.lookAt)) || 10,
        E = new R(0, 0, 1).applyQuaternion(t.quaternion),
        T = t.position.clone().add(E.multiplyScalar(v));
      s.lookAt = {
        x: T.x,
        y: T.y,
        z: T.z
      }, (h = (u = this.cb).onTransform) == null || h.call(u, n, s, e);
      return;
    }
    if (this.mode === "rotate" && (s.rotation = {
      x: t.rotation.x / We,
      y: t.rotation.y / We,
      z: t.rotation.z / We
    }), this.mode === "scale") {
      const w = ((m = this.lastComp) == null ? void 0 : m.characters.find(E => E.id === n)) ?? ((f = this.lastComp) == null ? void 0 : f.props.find(E => E.id === n)) ?? ((x = (p = this.lastComp) == null ? void 0 : p.codeModels) == null ? void 0 : x.find(E => E.id === n)),
        v = (w == null ? void 0 : w.uniformScale) || 1;
      s.scale = {
        x: t.scale.x / v,
        y: t.scale.y / v,
        z: t.scale.z / v
      };
    }
    (b = (g = this.cb).onTransform) == null || b.call(g, n, s, e);
  }
  setMode(e) {
    this.mode = e, this.gizmo.setMode(e);
  }
  jointBonesOf(e) {
    const t = this.chars.get(e);
    return t ? t.isGlb && t.rig ? t.rig.bones : {} : {};
  }
  setPoseEdit(e) {
    if (this.poseEditId !== e) {
      if (this.clearJointHandles(), this.poseEditId = e, !e || !this.chars.has(e)) {
        this.gizmo.setMode(this.mode), this.selectedId && this.setSelected(this.selectedId, this.selectedIds, this.selectedGroup);
        return;
      }
      this.gizmo.detach(), this.buildJointHandles(e);
    }
  }
  buildJointHandles(e) {
    const t = this.jointBonesOf(e),
      n = new St(1, 16, 12),
      s = new Pe(1.7, 1.7, 1.7);
    Object.keys(t).forEach(r => {
      if (!t[r]) return;
      const a = ol.has(r),
        l = new ct({
          color: a ? 16436245 : 3718648,
          depthTest: !1,
          transparent: !0,
          opacity: 0.9
        }),
        d = new z((a ? s : n).clone(), l);
      d.renderOrder = 999, d.userData._isHelper = !0, d.userData._isJointHandle = !0, d.userData.jointKey = r, this.scene.add(d), this.jointHandles.set(r, d);
    }), this.updateJointHandlePositions();
  }
  updateJointHandlePositions() {
    if (!this.poseEditId || this.jointHandles.size === 0) return;
    const e = this.jointBonesOf(this.poseEditId),
      t = new R(),
      n = 6,
      s = this.renderer.domElement.clientHeight || this.host.clientHeight || 600,
      r = Rc(this.camera, s);
    this.jointHandles.forEach((i, a) => {
      const l = e[a];
      if (!l) {
        i.visible = !1;
        return;
      }
      i.visible = !0, l.getWorldPosition(t), i.position.copy(t);
      const d = this.camera.position.distanceTo(t);
      i.scale.setScalar(n * d * r);
    }), this.activeJointBone && this.jointGizmoAnchor && this.gizmo.object === this.jointGizmoAnchor && !this.gizmo.dragging && (this.activeJointBone.getWorldPosition(t), this.jointGizmoAnchor.position.copy(t));
  }
  clearJointHandles() {
    this.detachJointGizmo(), this.jointHandles.forEach(e => {
      this.scene.remove(e), e.geometry.dispose(), e.material.dispose();
    }), this.jointHandles.clear();
  }
  detachJointGizmo() {
    this.activeIkKey && (this.gizmo.detach(), this.gizmo.setSpace("local"), this.jointGizmoAnchor && (this.scene.remove(this.jointGizmoAnchor), this.jointGizmoAnchor = null), this.activeIkKey = null, this.activeJointBone = null), this.activeJointKey && (this.gizmo.detach(), this.gizmo.showX = !0, this.gizmo.showY = !0, this.gizmo.showZ = !0, this.jointGizmoAnchor && (this.scene.remove(this.jointGizmoAnchor), this.jointGizmoAnchor = null), this.activeJointKey = null, this.activeJointBone = null, this.jointBoneStartQ = null, this.jointAnchorStartQ = null);
  }
  attachIkToEffector(e) {
    const t = this.poseEditId;
    if (!t) return;
    const s = this.jointBonesOf(t)[e];
    if (!s) return;
    this.detachJointGizmo(), this.activeIkKey = e, this.activeJointBone = s;
    const r = new Ot(),
      i = new R();
    s.getWorldPosition(i), r.position.copy(i), r.userData._isHelper = !0, this.scene.add(r), this.jointGizmoAnchor = r, this.gizmo.setMode("translate"), this.gizmo.setSpace("world"), this.gizmo.showX = !0, this.gizmo.showY = !0, this.gizmo.showZ = !0, this.gizmo.attach(r);
  }
  onIkGizmoChange(e) {
    var l, d;
    const t = this.poseEditId,
      n = this.activeIkKey,
      s = this.jointGizmoAnchor;
    if (!t || !n || !s) return;
    const r = this.chars.get(t);
    if (!r) return;
    const i = this.jointBonesOf(t),
      a = jp(n, i, s.position.clone(), r.isGlb ? r.rig : null);
    if (a && ((d = (l = this.cb).onJointRotate) == null || d.call(l, t, a, e)), e) {
      const u = i[n];
      if (u) {
        const h = new R();
        u.getWorldPosition(h), s.position.copy(h);
      }
    }
  }
  attachGizmoToJoint(e) {
    const t = this.poseEditId;
    if (!t) return;
    const s = this.jointBonesOf(t)[e];
    if (!s) return;
    if (ol.has(e)) {
      this.attachIkToEffector(e);
      return;
    }
    this.detachJointGizmo(), this.activeJointKey = e, this.activeJointBone = s;
    const r = new Ot(),
      i = new R(),
      a = new ve();
    s.getWorldPosition(i), s.getWorldQuaternion(a), r.position.copy(i), r.quaternion.copy(a), r.userData._isHelper = !0, this.scene.add(r), this.jointGizmoAnchor = r, this.jointAnchorStartQ = a.clone(), this.gizmo.setMode("rotate"), this.gizmo.setSpace("local");
    const l = _p(e);
    this.gizmo.showX = l.x, this.gizmo.showY = l.y, this.gizmo.showZ = l.z, this.gizmo.attach(r);
  }
  onJointGizmoChange(e) {
    var f, p;
    const t = this.poseEditId,
      n = this.activeJointKey,
      s = this.activeJointBone,
      r = this.jointGizmoAnchor,
      i = this.jointAnchorStartQ;
    if (!t || !n || !s || !r || !i) return;
    const a = this.chars.get(t);
    if (!a) return;
    const l = r.quaternion.clone().multiply(i.clone().invert()),
      d = new ve();
    (s.parent ?? s).getWorldQuaternion(d);
    const u = d.clone().invert().multiply(l).multiply(d);
    this.jointBoneStartQ || (this.jointBoneStartQ = s.quaternion.clone()), s.quaternion.copy(u.multiply(this.jointBoneStartQ));
    const h = Kc(n, s, a.isGlb ? a.rig : null),
      m = {
        [n]: h
      };
    if ((p = (f = this.cb).onJointRotate) == null || p.call(f, t, m, e), e) {
      this.jointBoneStartQ = null;
      const x = new ve();
      s.getWorldQuaternion(x), r.quaternion.copy(x), this.jointAnchorStartQ = x.clone();
    }
  }
  setSnapEnabled(e) {
    this.gizmo.setTranslationSnap(e ? 1 : null);
  }
  setGridVisible(e) {
    this.grid && (this.grid.visible = e), this.groundAxis && (this.groundAxis.visible = e);
  }
  setCharacterLabelsVisible(e) {
    this.charLabelsVisible !== e && (this.charLabelsVisible = e, this.lastComp && this.syncChars(this.lastComp.characters));
  }
  selectionObject(e) {
    var t, n, s, r, i;
    return ((t = this.chars.get(e)) == null ? void 0 : t.group) ?? ((n = this.props.get(e)) == null ? void 0 : n.group) ?? ((s = this.models.get(e)) == null ? void 0 : s.group) ?? ((r = this.codeModels.get(e)) == null ? void 0 : r.group) ?? ((i = this.cams.get(e)) == null ? void 0 : i.group) ?? null;
  }
  selectionKind(e) {
    return this.chars.has(e) ? "character" : this.props.has(e) ? "prop" : this.models.has(e) || this.codeModels.has(e) ? "model" : this.cams.has(e) ? "camera" : null;
  }
  codePartObject(e) {
    const t = Os(e);
    if (!t) return null;
    const n = this.codeModels.get(t.modelId);
    return (n == null ? void 0 : n.root.children.find(s => s.name === t.part)) ?? null;
  }
  getCodePartLocal(e, t) {
    const n = this.codeModels.get(e),
      s = n == null ? void 0 : n.root.children.find(r => r.name === t);
    return s ? {
      position: {
        x: s.position.x,
        y: s.position.y,
        z: s.position.z
      },
      rotation: {
        x: s.rotation.x / We,
        y: s.rotation.y / We,
        z: s.rotation.z / We
      },
      scale: {
        x: s.scale.x,
        y: s.scale.y,
        z: s.scale.z
      }
    } : null;
  }
  membersCenter(e) {
    const t = e.map(r => this.selectionObject(r)).filter(r => !!r),
      n = new nt();
    if (e.forEach(r => {
      const i = this.selectionObject(r);
      i && (this.cams.has(r) ? n.expandByPoint(i.position) : n.expandByObject(i));
    }), !n.isEmpty()) return n.getCenter(new R());
    const s = new R();
    return t.forEach(r => s.add(r.position)), s.multiplyScalar(1 / Math.max(t.length, 1));
  }
  snapshotPivot() {
    this.pivot && (this.pivotStart = {
      position: this.pivot.position.clone(),
      quaternion: this.pivot.quaternion.clone(),
      scale: this.pivot.scale.clone()
    }, this.memberStarts = this.pivotIds.filter(e => !!this.selectionObject(e)).map(e => {
      var r, i, a;
      const t = this.selectionObject(e),
        n = this.selectionKind(e),
        s = n === "character" ? (r = this.lastComp) == null ? void 0 : r.characters.find(l => l.id === e) : n === "prop" ? (i = this.lastComp) == null ? void 0 : i.props.find(l => l.id === e) : (a = this.lastComp) == null ? void 0 : a.cameras.find(l => l.id === e);
      return {
        id: e,
        kind: n,
        position: t.position.clone(),
        quaternion: t.quaternion.clone(),
        scale: t.scale.clone(),
        dataScale: n !== "camera" && s && "scale" in s ? Wt(s.scale) : void 0,
        lookAt: n === "camera" && s && "lookAt" in s ? Wt(s.lookAt) : void 0
      };
    }));
  }
  recenterPivot() {
    var t;
    if (!this.pivot || this.pivotIds.length < 2) return;
    const e = (t = this.selectedGroup) == null ? void 0 : t.pivot;
    this.pivot.position.copy(e ? Wt(e) : this.membersCenter(this.pivotIds)), this.pivot.quaternion.set(0, 0, 0, 1), this.pivot.scale.set(1, 1, 1), this.pivot.rotation.set(0, 0, 0), this.snapshotPivot();
  }
  attachPivot(e, t) {
    this.disposePivot();
    const n = new Ot();
    n.userData._isHelper = !0, n.userData._isMultiSelectPivot = !0, n.position.copy(t ? Wt(t) : this.membersCenter(e)), this.scene.add(n), this.pivot = n, this.pivotIds = e, this.snapshotPivot(), this.gizmo.attach(n);
  }
  disposePivot() {
    this.pivot && (this.gizmo.object === this.pivot && this.gizmo.detach(), this.scene.remove(this.pivot), this.pivot = null, this.pivotIds = [], this.pivotStart = null, this.memberStarts = []);
  }
  attachCamPathAnchor(e) {
    var s, r;
    const t = (r = (s = this.lastComp) == null ? void 0 : s.camPaths) == null ? void 0 : r.find(i => i.id === e);
    if (!t || t.points.length === 0) {
      this.disposeCamPathAnchor(), this.gizmo.detach();
      return;
    }
    if (this.camPathAnchorId === e && this.camPathAnchor) {
      this.gizmo.dragging || (this.recenterCamPathAnchor(t), this.gizmo.setMode(this.mode)), this.gizmo.object !== this.camPathAnchor && this.gizmo.attach(this.camPathAnchor);
      return;
    }
    this.disposeCamPathAnchor();
    const n = new Ot();
    n.userData._isHelper = !0, this.scene.add(n), this.camPathAnchor = n, this.camPathAnchorId = e, this.recenterCamPathAnchor(t), this.gizmo.setMode(this.mode), this.gizmo.attach(n);
  }
  recenterCamPathAnchor(e) {
    if (!this.camPathAnchor) return;
    const t = new R();
    for (const n of e.points) t.add(Wt(n.position));
    t.divideScalar(e.points.length), this.camPathAnchor.position.copy(t), this.camPathAnchor.quaternion.identity(), this.camPathAnchor.scale.set(1, 1, 1), this.camPathAnchorStart = {
      pos: t.clone(),
      points: e.points.map(n => ({
        ...n,
        position: {
          ...n.position
        },
        in: {
          ...n.in
        },
        out: {
          ...n.out
        }
      })),
      lookAt: e.lookAtTarget === Ne && e.lookAt ? {
        ...e.lookAt
      } : void 0
    };
  }
  disposeCamPathAnchor() {
    this.camPathAnchor && (this.gizmo.object === this.camPathAnchor && this.gizmo.detach(), this.scene.remove(this.camPathAnchor), this.camPathAnchor = null, this.camPathAnchorId = null, this.camPathAnchorStart = null);
  }
  setSelected(e, t, n) {
    var l, d, u, h, m, f, p, x;
    this.selectedId = e, this.selectedIds = t && t.length > 0 ? t : e ? [e] : [], this.selectedGroup = n ?? null;
    const s = new Set(this.selectedIds);
    if (this.chars.forEach((g, b) => g.ring.visible = s.has(b)), this.props.forEach((g, b) => g.ring.visible = s.has(b)), this.models.forEach((g, b) => g.ring.visible = s.has(b)), this.codeModels.forEach((g, b) => g.ring.visible = s.has(b)), this.syncPartHighlight(), this.cams.forEach((g, b) => g.ring.visible = s.has(b)), this.poseEditId) return;
    if ((l = this.camPathEditor) != null && l.active) {
      !this.camPathEditor.hasSelection && e && this.camPathEditor.activeTakeId === e && this.attachCamPathAnchor(e);
      return;
    }
    const r = this.selectedIds.filter(g => !!this.selectionObject(g));
    if (r.length > 1 && r.length === this.selectedIds.length) {
      if (this.pivot && this.pivotIds.length === r.length && this.pivotIds.every((b, w) => b === r[w])) {
        this.gizmo.dragging || this.recenterPivot(), this.gizmo.object !== this.pivot && this.gizmo.attach(this.pivot);
        return;
      }
      this.attachPivot(r, n == null ? void 0 : n.pivot);
      return;
    }
    if (this.disposePivot(), !e) {
      this.disposeCamPathAnchor(), this.gizmo.detach();
      return;
    }
    const i = ((d = this.chars.get(e)) == null ? void 0 : d.group) ?? ((u = this.props.get(e)) == null ? void 0 : u.group) ?? ((h = this.models.get(e)) == null ? void 0 : h.group) ?? ((m = this.codeModels.get(e)) == null ? void 0 : m.group) ?? ((f = this.cams.get(e)) == null ? void 0 : f.group),
      a = i ? null : this.codePartObject(e);
    i ? (this.disposeCamPathAnchor(), this.gizmo.attach(i)) : a ? (this.disposeCamPathAnchor(), this.gizmo.attach(a)) : (x = (p = this.lastComp) == null ? void 0 : p.camPaths) != null && x.some(g => g.id === e) ? this.attachCamPathAnchor(e) : (this.disposeCamPathAnchor(), this.gizmo.detach());
  }
  trackSceneLoad(e, t) {
    return this.sceneReadiness.track(e, t);
  }
  waitForSceneReady(e = 1e4) {
    return this.sceneReadiness.wait(e);
  }
  sync(e) {
    var n;
    const t = new Set();
    for (const s of e.characters) {
      const r = s.modelUrl || ((n = Kn[s.bodyType]) == null ? void 0 : n.modelUrl) || "";
      r && t.add(`character:${s.id}:${r}`);
    }
    for (const s of e.models ?? []) t.add(`model:${s.id}:${s.modelUrl}`);
    e.environment.panoramaUrl && t.add(`${e.environment.backgroundMode === "panorama" ? "panorama" : "flat-background"}:${e.environment.panoramaUrl}`), this.sceneReadiness.retain(t), this.lastComp = e, this.charLabelsVisible = e.environment.showCharacterLabels !== !1, this.syncEnvironment(e.environment), this.syncChars(e.characters), this.syncProps(e.props), this.syncModels(e.models ?? []), this.syncCodeModels(e.codeModels ?? []), this.syncCams(e.cameras), this.syncCamPathViz(e.camPaths), this.selectedId && this.setSelected(this.selectedId, this.selectedIds, this.selectedGroup);
  }
  setCamPathVizSuppressed(e) {
    var t;
    this.camPathVizSuppressed = e, this.syncCamPathViz((t = this.lastComp) == null ? void 0 : t.camPaths);
  }
  syncCamPathViz(e) {
    var s;
    const t = e ?? [],
      n = new Set();
    for (const r of t) {
      n.add(r.id);
      const i = ((s = this.camPathEditor) == null ? void 0 : s.activeTakeId) === r.id || this.camPathVizSuppressed === "*" || this.camPathVizSuppressed === r.id,
        a = !!r.closed;
      let l = this.camPathViz.get(r.id);
      if (!(l && l.points === r.points && l.visible === r.visible && l.hidden === i && l.closed === a)) {
        if (!l) {
          const d = new _t(new Pt(), new Sn({
            color: 8248575,
            transparent: !0,
            opacity: 0.55,
            depthWrite: !1
          }));
          d.userData._isHelper = !0, d.userData._isCamPathViz = !0, this.scene.add(d), l = {
            line: d,
            points: null,
            visible: !1,
            hidden: !1,
            closed: !1
          }, this.camPathViz.set(r.id, l);
        }
        l.points = r.points, l.visible = r.visible, l.hidden = i, l.closed = a, l.line.visible = r.visible && !i && r.points.length >= 2, l.line.visible && l.line.geometry.setFromPoints(Dc(r.points, void 0, !!r.closed).map(d => d.pos));
      }
    }
    this.camPathViz.forEach((r, i) => {
      n.has(i) || (this.scene.remove(r.line), r.line.geometry.dispose(), r.line.material.dispose(), this.camPathViz.delete(i));
    });
  }
  applyTransform(e, t) {
    e.position.set(t.position.x, t.position.y, t.position.z), e.rotation.set(t.rotation.x * We, t.rotation.y * We, t.rotation.z * We);
    const n = t.uniformScale ?? 1;
    e.scale.set(t.scale.x * n, t.scale.y * n, t.scale.z * n);
  }
  setShadow(e, t) {
    e.traverse(n => {
      const s = n;
      s.isMesh && (s.castShadow = t);
    });
  }
  syncChars(e) {
    var n;
    const t = new Set();
    for (const s of e) {
      t.add(s.id);
      let r = this.chars.get(s.id);
      const i = s.modelUrl || ((n = Kn[s.bodyType]) == null ? void 0 : n.modelUrl) || "",
        a = `char:${s.bodyType}:${i}`;
      r && r.meshKey !== a && (this.disposeChar(s.id), r = void 0), r || (r = this.makeChar(s, a, i)), this.drivenIds.has(s.id) || this.applyTransform(r.group, s), r.group.visible = s.visible, this.setShadow(r.inner, s.shadowEnabled), r.isGlb && r.color !== s.color && (Xo(r.inner, s.color), r.color = s.color);
      const l = s.jointAngles ?? fs(s.pose, s.bodyType),
        d = JSON.stringify(l),
        u = this.poseEditId === s.id && this.gizmo.dragging,
        h = this.poseDrivenIds.has(s.id);
      r.jaKey !== d && !u && !h && (r.isGlb && r.rig && Fs(r.rig, l), r.jaKey = d);
      const m = zi(s.pose, i);
      h || (r.inner.position.y = -m);
      const f = this.charLabelsVisible ? s.label : "";
      (r.labelKey !== f || f) && (r.group.userData.headY = (r.inner.userData.headY ?? 1.75) - m, Qh(r.group, f), r.labelKey = f);
    }
    for (const s of [...this.chars.keys()]) t.has(s) || this.disposeChar(s);
  }
  makeChar(e, t, n) {
    var u, h;
    const s = new je(),
      r = new je();
    s.add(r);
    const i = new z(new Ni(0.4, 1.2, 4, 8), new ct({
      visible: !1
    }));
    i.position.y = 0.9, i.name = "__pick_proxy", s.add(i);
    const a = this.makeRing(e.color);
    s.add(a), this.contentRoot.add(s);
    const l = {
      group: s,
      inner: r,
      rig: null,
      isGlb: !1,
      loadToken: 0,
      pickProxy: i,
      ring: a,
      meshKey: t,
      jaKey: "",
      color: "",
      labelKey: "",
      dispose: () => {
        this.contentRoot.remove(s), s.traverse(m => {
          var p, x;
          const f = m;
          if (f.isMesh) {
            (p = f.geometry) == null || p.dispose();
            const g = f.material;
            Array.isArray(g) ? g.forEach(b => b.dispose()) : g == null || g.dispose();
          } else if (m.isSprite) {
            const g = m.material;
            (x = g.map) == null || x.dispose(), g.dispose();
          }
        });
      }
    };
    this.chars.set(e.id, l), this.idIndex.set(s, e.id), this.idIndex.set(i, e.id);
    const d = ++l.loadToken;
    if (n) {
      const m = `character:${e.id}:${n}`,
        f = Yo(n).then(({
          group: p,
          rig: x
        }) => {
          l.loadToken !== d || !this.chars.has(e.id) || (s.remove(r), s.add(p), l.inner = p, l.rig = x, l.isGlb = !0, l.jaKey = "", l.color = "", l.labelKey = "__reload__", this.resyncChar(e.id));
        }).catch(p => {
          var x, g;
          if (!(l.loadToken !== d || !this.chars.has(e.id))) throw (g = (x = this.cb).onCharLoadError) == null || g.call(x, e.id, e.label, n), p;
        });
      this.trackSceneLoad(m, f);
    } else (h = (u = this.cb).onCharLoadError) == null || h.call(u, e.id, e.label, "");
    return l;
  }
  resyncChar(e) {
    this.lastComp && this.syncChars(this.lastComp.characters);
  }
  driveObject(e, t, n) {
    var r, i;
    const s = ((r = this.chars.get(e)) == null ? void 0 : r.group) ?? ((i = this.props.get(e)) == null ? void 0 : i.group);
    s && (s.position.copy(t), n != null && (s.rotation.y = n));
  }
  setDrivenObjects(e) {
    const t = [...this.drivenIds].some(n => !e.has(n));
    this.drivenIds = new Set(e), t && this.lastComp && (this.syncChars(this.lastComp.characters), this.syncProps(this.lastComp.props));
  }
  clearDrivenObjects() {
    this.setDrivenObjects(new Set()), this.setPoseDrivenObjects(new Set());
  }
  drivePose(e, t, n = 0) {
    const s = this.chars.get(e);
    !s || !s.isGlb || !s.rig || (Fs(s.rig, t), s.inner.position.y = -n);
  }
  setPoseDrivenObjects(e) {
    let t = !1;
    for (const n of this.poseDrivenIds) {
      if (e.has(n)) continue;
      t = !0;
      const s = this.chars.get(n);
      s && (s.jaKey = "");
    }
    this.poseDrivenIds = new Set(e), t && this.lastComp && this.syncChars(this.lastComp.characters);
  }
  disposeChar(e) {
    const t = this.chars.get(e);
    t && (this.poseEditId === e && this.clearJointHandles(), this.idIndex.delete(t.group), this.idIndex.delete(t.pickProxy), t.dispose(), this.chars.delete(e));
  }
  syncProps(e) {
    const t = new Set();
    for (const n of e) {
      t.add(n.id);
      let s = this.props.get(n.id);
      s && (s.assetId !== n.assetId || s.partsRef !== n.parts) && (this.disposeProp(n.id), s = void 0), s || (s = this.makeProp(n)), this.drivenIds.has(n.id) || this.applyTransform(s.group, n), s.group.visible = n.visible;
    }
    for (const n of [...this.props.keys()]) t.has(n) || this.disposeProp(n);
  }
  makeProp(e) {
    var r;
    const t = new je();
    t.add((r = e.parts) != null && r.length ? Lp(e.parts) : Xc(e.assetId));
    const n = this.makeRing("#4F8EF7");
    t.add(n), this.contentRoot.add(t);
    const s = {
      group: t,
      ring: n,
      assetId: e.assetId,
      partsRef: e.parts,
      dispose: () => this.contentRoot.remove(t)
    };
    return this.props.set(e.id, s), this.idIndex.set(t, e.id), s;
  }
  disposeProp(e) {
    const t = this.props.get(e);
    t && (this.idIndex.delete(t.group), t.dispose(), this.props.delete(e));
  }
  syncModels(e) {
    const t = new Set();
    for (const n of e) {
      t.add(n.id);
      let s = this.models.get(n.id);
      if (s && (s.modelUrl !== n.modelUrl || s.modelType !== n.modelType) && (this.disposeModel(n.id), s = void 0), s || (s = this.makeModel(n)), this.drivenIds.has(n.id) || this.applyTransform(s.group, n), s.group.visible = n.visible, n.modelType === "pointcloud" && s.inner instanceof ss) {
        const r = s.inner.material;
        n.pointSize != null && r.size !== n.pointSize && (r.size = n.pointSize, r.needsUpdate = !0), n.pointColor ? (r.vertexColors || !r.color.equals(new Ze(n.pointColor))) && (r.vertexColors = !1, r.color.set(n.pointColor), r.needsUpdate = !0) : r.vertexColors || (r.vertexColors = !0, r.color.set(16777215), r.needsUpdate = !0);
      }
      n.modelType === "mesh" && n.shadowEnabled != null && this.setShadow(s.inner, n.shadowEnabled);
    }
    for (const n of [...this.models.keys()]) t.has(n) || this.disposeModel(n);
  }
  makeModel(e) {
    const t = new je(),
      n = new je();
    t.add(n);
    const s = new z(new Pe(1, 1, 1), new ct({
      visible: !1
    }));
    s.position.y = 0.5, t.add(s);
    const r = this.makeRing("#FF9500");
    t.add(r), this.contentRoot.add(t);
    const i = ++this.modelLoadToken,
      a = {
        group: t,
        inner: n,
        ring: r,
        pickProxy: s,
        modelUrl: e.modelUrl,
        modelType: e.modelType,
        loadToken: i,
        dispose: () => {
          this.contentRoot.remove(t), n.traverse(l => {
            var d, u;
            (l instanceof z || l instanceof ss) && ((d = l.geometry) == null || d.dispose(), Array.isArray(l.material) ? l.material.forEach(h => h.dispose()) : (u = l.material) == null || u.dispose());
          });
        }
      };
    return this.models.set(e.id, a), this.idIndex.set(t, e.id), this.trackSceneLoad(`model:${e.id}:${e.modelUrl}`, this.loadModelAsync(e, a, i)), a;
  }
  async loadModelAsync(e, t, n) {
    try {
      let s;
      if (e.modelType === "pointcloud") {
        if (/\.spz$/i.test(e.modelName || e.modelUrl)) {
          const {
            loadSPZPointCloud: d
          } = await mr(async () => {
            const {
              loadSPZPointCloud: u
            } = await import("./spzLoader-CU_GD7s0.js");
            return {
              loadSPZPointCloud: u
            };
          }, __vite__mapDeps([0, 1, 2, 3]), import.meta.url);
          s = await d(e.modelUrl, e.pointSize ?? 0.05, e.pointColor, this.theme);
        } else {
          const {
            loadPLYPointCloud: d
          } = await mr(async () => {
            const {
              loadPLYPointCloud: u
            } = await import("./plyLoader-ChQmPnxM.js");
            return {
              loadPLYPointCloud: u
            };
          }, __vite__mapDeps([3, 1, 2]), import.meta.url);
          s = await d(e.modelUrl, e.pointSize ?? 0.05, e.pointColor, this.theme);
        }
      } else {
        const {
          loadGlbCharacter: l
        } = await mr(async () => {
          const {
            loadGlbCharacter: u
          } = await Promise.resolve().then(() => vf);
          return {
            loadGlbCharacter: u
          };
        }, void 0, import.meta.url);
        s = (await l(e.modelUrl)).group;
      }
      if (n !== t.loadToken) {
        s.traverse(l => {
          var d, u;
          (l instanceof z || l instanceof ss) && ((d = l.geometry) == null || d.dispose(), Array.isArray(l.material) ? l.material.forEach(h => h.dispose()) : (u = l.material) == null || u.dispose());
        });
        return;
      }
      t.group.remove(t.inner), t.inner = s, t.group.add(s);
      const r = new nt().setFromObject(s),
        i = r.getSize(new R());
      t.pickProxy.scale.set(i.x || 1, i.y || 1, i.z || 1);
      const a = r.getCenter(new R());
      t.pickProxy.position.copy(a);
    } catch (s) {
      console.error(`Failed to load model ${e.modelUrl}:`, s);
      this.cb.onCharLoadError && this.cb.onCharLoadError(e.id, e.label, e.modelUrl);
    }
  }
  disposeModel(e) {
    const t = this.models.get(e);
    t && (this.idIndex.delete(t.group), t.dispose(), this.models.delete(e));
  }
  syncCodeModels(e) {
    const t = new Set();
    for (const n of e) {
      t.add(n.id);
      let s = this.codeModels.get(n.id);
      if (s && s.code !== n.code && (this.disposeCodeModel(n.id), s = void 0), !s) {
        const r = this.makeCodeModel(n);
        if (!r) continue;
        s = r;
      }
      this.drivenIds.has(n.id) || this.applyTransform(s.group, n), s.group.visible = n.visible, this.setShadow(s.root, n.shadowEnabled !== !1), s.overridesRef !== n.partOverrides && (s.overridesRef = n.partOverrides, this.applyPartOverrides(s, n));
    }
    for (const n of [...this.codeModels.keys()]) t.has(n) || this.disposeCodeModel(n);
  }
  applyPartOverrides(e, t) {
    var s, r;
    const n = this.gizmo.dragging && this.selectedId && ((s = Os(this.selectedId)) == null ? void 0 : s.modelId) === t.id;
    for (const i of e.root.children) {
      const a = e.baseline.get(i.name),
        l = (r = t.partOverrides) == null ? void 0 : r[i.name];
      i.visible = (l == null ? void 0 : l.visible) !== !1, !(n && this.gizmo.object === i) && a && (l != null && l.position ? i.position.set(l.position.x, l.position.y, l.position.z) : i.position.copy(a.position), l != null && l.rotation ? i.rotation.set(l.rotation.x * We, l.rotation.y * We, l.rotation.z * We) : i.rotation.copy(a.rotation), l != null && l.scale ? i.scale.set(l.scale.x, l.scale.y, l.scale.z) : i.scale.copy(a.scale));
    }
  }
  makeCodeModel(e) {
    var m;
    let t;
    try {
      t = Fi(e.code);
    } catch (f) {
      return (m = this.onCodeModelError) == null || m.call(this, e.id, f.message), null;
    }
    const n = new je();
    n.add(t.root);
    const s = new nt().setFromObject(t.root),
      r = s.getSize(new R()),
      i = s.getCenter(new R()),
      a = new z(new Pe(1, 1, 1), new ct({
        visible: !1
      }));
    a.scale.set(r.x || 1, r.y || 1, r.z || 1), a.position.copy(i), n.add(a);
    const l = this.makeRing("#30D158"),
      d = Math.max(0.6, Math.hypot(r.x, r.z) * 0.5 * 1.15);
    l.scale.setScalar(d / 0.6), l.position.set(i.x, l.position.y, i.z), n.add(l), this.contentRoot.add(n);
    const u = new Map();
    for (const f of t.root.children) u.set(f.name, {
      position: f.position.clone(),
      rotation: f.rotation.clone(),
      scale: f.scale.clone()
    });
    const h = {
      group: n,
      root: t.root,
      ring: l,
      pickProxy: a,
      code: e.code,
      baseline: u,
      dispose: () => {
        this.contentRoot.remove(n), Sf(t.root), a.geometry.dispose(), a.material.dispose();
      }
    };
    return this.codeModels.set(e.id, h), this.idIndex.set(n, e.id), this.applyPartOverrides(h, e), h;
  }
  disposeCodeModel(e) {
    const t = this.codeModels.get(e);
    t && (this.idIndex.delete(t.group), t.dispose(), this.codeModels.delete(e));
  }
  syncPartHighlight() {
    const e = this.selectedId ? this.codePartObject(this.selectedId) : null;
    if (!e) {
      this.disposePartHighlight();
      return;
    }
    this.partHighlight ? this.partHighlight.setFromObject(e) : (this.partHighlight = new dh(e, 3199320), this.partHighlight.userData._isHelper = !0, this.scene.add(this.partHighlight));
  }
  disposePartHighlight() {
    this.partHighlight && (this.scene.remove(this.partHighlight), this.partHighlight.geometry.dispose(), this.partHighlight.material.dispose(), this.partHighlight = null);
  }
  getObjectCenter(e) {
    var s, r, i, a;
    const t = ((s = this.chars.get(e)) == null ? void 0 : s.group) ?? ((r = this.props.get(e)) == null ? void 0 : r.group) ?? ((i = this.models.get(e)) == null ? void 0 : i.group) ?? ((a = this.codeModels.get(e)) == null ? void 0 : a.group);
    if (!t) return null;
    const n = this.objCenterBox.setFromObject(t);
    return n.isEmpty() ? t.getWorldPosition(this.objCenterVec) : n.getCenter(this.objCenterVec);
  }
  resolveLookAt(e) {
    const t = e.lookAtTarget;
    if (t && t !== Ne) {
      const n = this.getObjectCenter(t);
      if (n) return n;
    }
    return Wt(e.lookAt);
  }
  syncCams(e) {
    const t = new Set();
    for (const n of e) {
      t.add(n.id);
      let s = this.cams.get(n.id);
      s || (s = this.makeCam(n)), s.group.position.set(n.position.x, n.position.y, n.position.z), s.group.lookAt(this.resolveLookAt(n)), s.modelVisible = n.visible, s.group.visible = n.visible && this.viewMode !== "camera" && !this.camIndicatorsSuppressed, s.fov !== n.fov && (kf(s.group, n.fov), s.fov = n.fov), Zh(s.group, this.camLabelsVisible ? n.label : "");
    }
    for (const n of [...this.cams.keys()]) t.has(n) || this.disposeCam(n);
  }
  makeCam(e) {
    const t = _f(e.fov),
      n = t.children.find(i => {
        var a;
        return (a = i.userData) == null ? void 0 : a.isCameraDirectionGuide;
      }),
      s = this.makeRing("#FFD60A");
    s.scale.setScalar(1 / 0.6), t.add(s), this.scene.add(t);
    const r = {
      group: t,
      frustum: n,
      ring: s,
      fov: e.fov,
      modelVisible: e.visible,
      dispose: () => {
        this.scene.remove(t), t.traverse(i => {
          var l, d;
          const a = i;
          if (a.isMesh || i.isLineSegments) {
            (l = a.geometry) == null || l.dispose();
            const u = a.material;
            Array.isArray(u) ? u.forEach(h => h.dispose()) : u == null || u.dispose();
          } else if (i.isSprite) {
            const u = i.material;
            (d = u.map) == null || d.dispose(), u.dispose();
          }
        });
      }
    };
    return this.cams.set(e.id, r), this.idIndex.set(t, e.id), r;
  }
  disposeCam(e) {
    const t = this.cams.get(e);
    t && (this.idIndex.delete(t.group), t.dispose(), this.cams.delete(e));
  }
  makeRing(e) {
    const t = new z(new La(0.55, 0.7, 40), new ct({
      color: e,
      transparent: !0,
      opacity: 0.9,
      side: zo,
      depthTest: !1
    }));
    return t.rotation.x = -Math.PI / 2, t.position.y = 0.02, t.renderOrder = 999, t.visible = !1, t.userData._isSelectionRing = !0, t.userData._isHelper = !0, t;
  }
  syncEnvironment(e) {
    this.lastEnv = e;
    const t = e.sceneScale ?? {
        x: 1,
        y: 1,
        z: 1
      },
      n = e.sceneRotation ?? {
        x: 0,
        y: 0,
        z: 0
      },
      s = e.scenePosition ?? {
        x: 0,
        y: 0,
        z: 0
      };
    this.contentRoot.scale.set(t.x, t.y, t.z), this.contentRoot.rotation.set(n.x * We, n.y * We, n.z * We), this.contentRoot.position.set(s.x, s.y, s.z), e.panoramaUrl || (this.scene.background = new Ze(this.resolveSky(e)));
    const r = e.showGround !== !1,
      i = e.groundOpacity ?? 0.4,
      a = (e.groundHeight ?? 0) / (this.contentRoot.scale.x || 1);
    this.ground && (this.ground.material.opacity = i, this.ground.visible = r && i > 0.01, this.ground.position.y = a), this.grid && (this.grid.visible = r, this.grid.position.y = a), this.groundAxis && (this.groundAxis.visible = r, this.groundAxis.position.y = a), this.syncPanorama(e);
  }
  resolveSky(e) {
    const t = Ir[this.theme],
      n = (e.skyColor ?? "").toLowerCase();
    return !n || n === "#060608" ? t.sky : e.skyColor;
  }
  setTheme(e) {
    var s, r, i, a, l, d, u;
    if (this.theme === e) return;
    this.theme = e;
    const t = Ir[e];
    this.lastEnv && !this.lastEnv.panoramaUrl ? this.scene.background = new Ze(this.resolveSky(this.lastEnv)) : this.lastEnv || (this.scene.background = new Ze(t.sky)), this.flatBgActive && this.lastEnv && this.flatClear.set(this.resolveSky(this.lastEnv)), this.ground && this.ground.material.color.set(t.ground);
    const n = Es[e];
    if (this.camPathEditor.setTheme(e), (s = this.groundPickReticle) == null || s.traverse(h => {
      h instanceof z && h.material.color.set(n);
    }), (i = (r = this.groundDrawVLine) == null ? void 0 : r.material) == null || i.color.set(n), (l = (a = this.groundDrawDots) == null ? void 0 : a.material) == null || l.color.set(n), (u = (d = this.groundDrawLine) == null ? void 0 : d.material) == null || u.color.set(n), this.grid) {
      const h = this.grid.visible,
        m = this.grid.position.y,
        f = this.grid.parent,
        p = this.grid.material.opacity,
        x = this.grid.material.transparent;
      f == null || f.remove(this.grid), this.grid.geometry.dispose(), this.grid.material.dispose();
      const g = new za(20, 20, t.gridMajor, t.gridMinor);
      g.material.opacity = p, g.material.transparent = x, g.userData._isHelper = !0, g.visible = h, g.position.y = m, f == null || f.add(g), this.grid = g;
    }
    this.models.forEach(h => {
      var m, f;
      if (h.inner instanceof ss) {
        const p = h.inner.material,
          x = h.inner.geometry,
          g = (f = (m = this.lastComp) == null ? void 0 : m.models) == null ? void 0 : f.find(b => {
            var w;
            return b.id === ((w = [...this.models.entries()].find(([v, E]) => E === h)) == null ? void 0 : w[0]);
          });
        !p.vertexColors && !(g != null && g.pointColor) && !x.hasAttribute("color") && (p.color.set(e === "dark" ? 16777215 : 0), p.needsUpdate = !0);
      }
    });
  }
  syncPanorama(e) {
    const t = e.backgroundMode ?? "flat";
    if (!e.panoramaUrl) {
      this.removePanoramaMesh(), this.removeFlatBackground(), this.scene.background = new Ze(this.resolveSky(e));
      return;
    }
    if (t === "flat") {
      this.removePanoramaMesh(), this.applyFlatBackground(e.panoramaUrl);
      return;
    }
    if (this.removeFlatBackground(), this.panoramaUrl !== e.panoramaUrl) {
      this.panoramaUrl = e.panoramaUrl;
      const n = e.panoramaUrl,
        s = new Promise((r, i) => new pi().load(n, a => {
          if (this.panoramaUrl !== n) {
            a.dispose(), r();
            return;
          }
          if (a.colorSpace = $t, this.panoramaMesh) this.panoramaMesh.material.map = a, this.panoramaMesh.material.needsUpdate = !0;else {
            const l = new St(1, 60, 40),
              d = new ct({
                map: a,
                side: uh,
                depthWrite: !1
              });
            this.panoramaMesh = new z(l, d), this.panoramaMesh.renderOrder = -1, this.panoramaMesh.userData._isHelper = !0, this.scene.add(this.panoramaMesh);
          }
          this.applyPanoramaTransform(e), r();
        }, void 0, i));
      this.trackSceneLoad(`panorama:${n}`, s);
    }
    this.applyPanoramaTransform(e);
  }
  applyFlatBackground(e) {
    if (this.flatBgActive = !0, this.lastEnv && this.flatClear.set(this.resolveSky(this.lastEnv)), this.scene.background = null, this.flatBgUrl === e && this.flatBgTexture) {
      this.layoutFlatBackground();
      return;
    }
    this.flatBgUrl = e;
    const t = new Promise((n, s) => new pi().load(e, r => {
      var l;
      if (this.flatBgUrl !== e) {
        r.dispose(), n();
        return;
      }
      r.colorSpace = $t;
      const i = r.image;
      this.flatBgImgAspect = i.width && i.height ? i.width / i.height : 16 / 9, this.ensureFlatBgLayer(), (l = this.flatBgTexture) == null || l.dispose(), this.flatBgTexture = r;
      const a = this.flatBgMesh.material;
      a.map = r, a.needsUpdate = !0, this.layoutFlatBackground(), n();
    }, void 0, s));
    this.trackSceneLoad(`flat-background:${e}`, t);
  }
  ensureFlatBgLayer() {
    if (this.flatBgScene) return;
    this.flatBgScene = new Oo(), this.flatBgCamera = new wc(-1, 1, 1, -1, 0, 1);
    const e = new ct({
      depthTest: !1,
      depthWrite: !1
    });
    this.flatBgMesh = new z(new Lo(2, 2), e), this.flatBgScene.add(this.flatBgMesh);
  }
  layoutFlatBackground(e) {
    if (!this.flatBgMesh) return;
    const t = e ?? (this.host.clientWidth || 1) / (this.host.clientHeight || 1),
      n = this.lastEnv,
      s = (n == null ? void 0 : n.flatFit) ?? "contain",
      r = (n == null ? void 0 : n.flatScale) ?? 1,
      i = (n == null ? void 0 : n.flatOffsetX) ?? 0,
      a = (n == null ? void 0 : n.flatOffsetY) ?? 0,
      l = this.flatBgImgAspect / t;
    let d, u;
    if (s === "cover") {
      const h = Math.max(1 / l, 1);
      d = l * h, u = h;
    } else d = l, u = 1;
    this.flatBgMesh.scale.set(d * r, u * r, 1), this.flatBgMesh.position.set(i * 2, a * 2, 0);
  }
  removeFlatBackground() {
    var e;
    if (this.flatBgActive = !1, !this.flatBgUrl && !this.flatBgTexture) {
      this.lastEnv && (this.scene.background = new Ze(this.resolveSky(this.lastEnv)));
      return;
    }
    this.flatBgUrl = "", (e = this.flatBgTexture) == null || e.dispose(), this.flatBgTexture = void 0, this.flatBgMesh && (this.flatBgMesh.material.map = null), this.lastEnv && (this.scene.background = new Ze(this.resolveSky(this.lastEnv)));
  }
  renderFlatBackground(e, t) {
    return !this.flatBgActive || !this.flatBgTexture || !this.flatBgScene || !this.flatBgCamera ? !1 : (this.layoutFlatBackground(t), e.setClearColor(this.flatClear, 1), e.clear(), e.render(this.flatBgScene, this.flatBgCamera), !0);
  }
  removePanoramaMesh() {
    this.panoramaUrl = "", this.panoramaMesh && (this.scene.remove(this.panoramaMesh), this.panoramaMesh.geometry.dispose(), this.panoramaMesh.material.dispose(), this.panoramaMesh = void 0);
  }
  applyPanoramaTransform(e) {
    this.panoramaMesh && (this.panoramaMesh.rotation.y = (e.panoramaRotationY ?? 0) * We, this.panoramaMesh.scale.setScalar(e.panoramaRadius ?? 90));
  }
  setViewMode(e, t) {
    const n = this.viewMode;
    this.viewMode = e, e !== "camera" && (this.trackedCamId = null), this.controls.enabled = e !== "camera";
    const s = this.contentRoot.scale.x || 1;
    e === "director" && t != null && t.keepPose && n === "camera" ? this.camTween = void 0 : e === "director" ? this.flyTo(new R(0, 2.2 * s, 10 * s), new R(0, 1.2 * s, 0), 700, 50) : e === "front" ? this.flyTo(new R(0, 1.6 * s, 6 * s), new R(0, 1.2 * s, 0), 700, 50) : e === "top" && this.flyTo(new R(0, 12 * s, 0.01), new R(0, 0, 0), 700, 50), this.cams.forEach(r => r.group.visible = e !== "camera" && r.modelVisible && !this.camIndicatorsSuppressed);
  }
  enterCameraView(e, t) {
    this.viewMode = "camera", this.controls.enabled = !1, this.trackedCamId = e.id;
    const n = this.resolveLookAt(e);
    t != null && t.immediate ? this.snapTo(Wt(e.position), n, e.fov) : this.flyTo(Wt(e.position), n, 700, e.fov), this.cams.forEach(s => s.group.visible = !1);
  }
  resetView() {
    this.setViewMode("director");
  }
  applyAxisView(e) {
    const t = {
        top: new R(0, 1, 0.001),
        bottom: new R(0, -1, 0.001),
        front: new R(0, 0, 1),
        back: new R(0, 0, -1),
        right: new R(1, 0, 0),
        left: new R(-1, 0, 0)
      },
      n = this.controls.target.clone(),
      s = this.camera.position.distanceTo(n) || 10,
      r = n.clone().add(t[e].clone().normalize().multiplyScalar(s));
    this.flyTo(r, n, 500);
  }
  snapTo(e, t, n) {
    this.camTween = void 0, this.camera.position.copy(e), this.controls.target.copy(t), n != null && Math.abs(n - this.camera.fov) > 0.001 && (this.camera.fov = n, this.camera.updateProjectionMatrix()), this.camera.lookAt(this.controls.target), this.controls.update();
  }
  flyTo(e, t, n = 700, s) {
    this.camTween = {
      fromP: this.camera.position.clone(),
      toP: e.clone(),
      fromT: this.controls.target.clone(),
      toT: t.clone(),
      fromFov: this.camera.fov,
      toFov: s ?? this.camera.fov,
      t0: performance.now(),
      dur: n
    };
  }
  focusObject(e) {
    if (this.viewMode === "camera" || this.cameraDriver) return;
    const t = this.selectionObject(e);
    if (!t) return;
    const n = new nt().setFromObject(t);
    if (n.isEmpty()) return;
    const s = n.getCenter(new R()),
      r = n.getSize(new R()).length() || 2,
      i = this.camera.position.clone().sub(this.controls.target);
    i.lengthSq() < 1e-6 && i.set(0.8, 0.6, 0.8), i.normalize();
    const a = ke.clamp(r * 1.4, 1.5, 120);
    this.flyTo(s.clone().addScaledVector(i, a), s, 600);
  }
  get canvas() {
    return this.renderer.domElement;
  }
  beginVideoCapture(e) {
    this.endVideoCapture();
    const t = (this.host.clientWidth || 1) / (this.host.clientHeight || 1),
      n = this.renderFlatBackground(this.renderer, t);
    if (this.renderer.autoClear = !n, this.renderer.render(this.scene, this.camera), this.renderer.autoClear = !0, !e) return this.renderer.domElement;
    const s = this.aspectCrop(e),
      r = document.createElement("canvas");
    r.width = s.w, r.height = s.h;
    const i = r.getContext("2d");
    if (!i) throw new Error("cannot create video capture canvas");
    return this.videoCaptureTarget = {
      canvas: r,
      ctx: i,
      crop: s
    }, this.copyVideoCaptureFrame(), r;
  }
  endVideoCapture() {
    this.videoCaptureTarget = null;
  }
  copyVideoCaptureFrame() {
    const e = this.videoCaptureTarget;
    if (!e) return;
    const {
      x: t,
      y: n,
      w: s,
      h: r
    } = e.crop;
    e.ctx.drawImage(this.renderer.domElement, t, n, s, r, 0, 0, s, r);
  }
  aspectCrop(e) {
    const t = this.host.clientWidth,
      n = this.host.clientHeight,
      s = this.renderer.domElement,
      r = 0.92;
    let i = t * r,
      a = i / e;
    a > n * r && (a = n * r, i = a * e);
    let l = Math.max(1, Math.round(i * s.width / t)),
      d = Math.max(1, Math.round(a * s.height / n));
    const h = [[21, 9], [16, 9], [4, 3], [1, 1], [3, 4], [9, 16]].find(([m, f]) => Math.abs(m / f - e) < 1e-6);
    if (h) {
      const [m, f] = h;
      let p = Math.max(1, Math.floor(Math.min(l / m, d / f)));
      p > 1 && p % 2 !== 0 && (p -= 1), l = m * p, d = f * p;
    }
    return {
      x: Math.round((s.width - l) / 2),
      y: Math.round((s.height - d) / 2),
      w: l,
      h: d
    };
  }
  beginCleanCapture() {
    if (this.cleanCaptureHidden) return;
    const e = [];
    this.scene.traverse(t => {
      t.userData._isHelper && t.visible && t !== this.panoramaMesh && t !== this.ground && (e.push(t), t.visible = !1);
    }), this.cams.forEach(t => {
      t.group.visible && (e.push(t.group), t.group.visible = !1);
    }), this.cleanCaptureHidden = e;
  }
  endCleanCapture() {
    var e;
    (e = this.cleanCaptureHidden) == null || e.forEach(t => t.visible = !0), this.cleanCaptureHidden = null;
  }
  captureCamera(e, t = null) {
    const n = this.host.clientWidth,
      s = this.host.clientHeight;
    if (!n || !s) return "";
    const r = nd(this.camera),
      i = this.controls.target.clone(),
      a = this.viewMode,
      l = this.trackedCamId,
      d = this.controls.enabled,
      u = !!this.cleanCaptureHidden;
    try {
      if (e) {
        const b = this.resolveLookAt(e);
        this.camera.position.copy(Wt(e.position)), this.camera.up.set(0, 1, 0), this.camera.lookAt(b), this.camera.fov = e.fov, this.camera.updateProjectionMatrix(), this.controls.target.copy(b);
      }
      this.beginCleanCapture();
      const h = n / s,
        m = this.renderFlatBackground(this.renderer, h);
      this.renderer.autoClear = !m, this.renderer.render(this.scene, this.camera), this.renderer.autoClear = !0;
      const f = this.renderer.domElement,
        p = t ? this.aspectCrop(t) : {
          x: 0,
          y: 0,
          w: f.width,
          h: f.height
        },
        x = document.createElement("canvas");
      x.width = p.w, x.height = p.h;
      const g = x.getContext("2d");
      return g ? (g.drawImage(f, p.x, p.y, p.w, p.h, 0, 0, p.w, p.h), x.toDataURL("image/jpeg", 0.92)) : "";
    } finally {
      u || this.endCleanCapture(), sd(this.camera, r), this.controls.target.copy(i), this.viewMode = a, this.trackedCamId = l, this.controls.enabled = d, this.renderer.autoClear = !0, this.renderer.render(this.scene, this.camera);
    }
  }
  contentBounds() {
    const e = new nt();
    return this.chars.forEach(t => {
      t.group.visible && e.expandByObject(t.group);
    }), this.props.forEach(t => {
      t.group.visible && e.expandByObject(t.group);
    }), e.isEmpty() ? null : e;
  }
  retargetOrbitPivot() {
    const e = this.camera,
      t = new R(0, 0, -1).applyQuaternion(e.quaternion);
    let n = 0;
    const s = this.contentBounds();
    s && (n = s.getCenter(new R()).sub(e.position).dot(t)), n <= 0.5 && t.y < -1e-4 && (n = -e.position.y / t.y), n <= 0.5 && (n = 5), n = ke.clamp(n, this.controls.minDistance + 1, this.controls.maxDistance - 10), this.controls.target.copy(e.position).addScaledVector(t, n);
  }
  mountCameraPreview(e, t) {
    const n = new $n(50, 1, 0.1, 2e3),
      s = new Ho({
        antialias: !0,
        canvas: t
      });
    s.setPixelRatio(Math.min(window.devicePixelRatio, 2)), s.outputColorSpace = $t;
    let r = !1;
    const i = () => {
        var p;
        if (r) return;
        const l = (p = this.lastComp) == null ? void 0 : p.cameras.find(x => x.id === e);
        if (!l) return;
        const d = t.clientWidth || 240,
          u = t.clientHeight || 135,
          h = s.getPixelRatio();
        (s.domElement.width !== Math.floor(d * h) || s.domElement.height !== Math.floor(u * h)) && (s.setSize(d, u, !1), n.aspect = d / u), n.position.set(l.position.x, l.position.y, l.position.z), n.lookAt(this.resolveLookAt(l)), Math.abs(n.fov - l.fov) > 0.001 && (n.fov = l.fov), n.updateProjectionMatrix();
        const m = [];
        this.scene.traverse(x => {
          x.userData._isHelper && x.visible && x !== this.panoramaMesh && x !== this.ground && (m.push(x), x.visible = !1);
        }), this.cams.forEach(x => {
          x.group.visible && (m.push(x.group), x.group.visible = !1);
        });
        const f = this.renderFlatBackground(s, d / u);
        s.autoClear = !f, s.render(this.scene, n), s.autoClear = !0, m.forEach(x => x.visible = !0);
      },
      a = this.onRender(i);
    return () => {
      r = !0, a(), s.dispose();
    };
  }
  viewportAspect() {
    const e = this.host.clientWidth,
      t = this.host.clientHeight;
    return e && t ? e / t : 16 / 9;
  }
  currentViewAsCamera() {
    const e = new R();
    this.camera.getWorldDirection(e);
    const t = this.controls.target.clone();
    return {
      position: {
        x: this.camera.position.x,
        y: this.camera.position.y,
        z: this.camera.position.z
      },
      lookAt: {
        x: t.x,
        y: t.y,
        z: t.z
      },
      fov: this.camera.fov
    };
  }
  dispose() {
    var e, t, n, s, r, i, a, l, d;
    cancelAnimationFrame(this.raf), (e = this.ro) == null || e.disconnect(), this.groundPickCb = null, this.groundDrawCb = null, window.removeEventListener("wheel", this.onGroundDrawWheel, {
      capture: !0
    }), this.hideGroundPickReticle(), this.hideGroundDrawLine(), this.renderer.domElement.removeEventListener("pointerdown", this.onPointerDown, !0), this.renderer.domElement.removeEventListener("pointermove", this.onPointerMove), this.renderer.domElement.removeEventListener("pointerup", this.onPointerUp), this.renderer.domElement.removeEventListener("dblclick", this.onDblClick), this.renderer.domElement.removeEventListener("keydown", this.onNavigationKeyDown), this.renderer.domElement.removeEventListener("keyup", this.onNavigationKeyUp), this.renderer.domElement.removeEventListener("blur", this.clearNavigationKeys), window.removeEventListener("keyup", this.onNavigationKeyUp), window.removeEventListener("blur", this.clearNavigationKeys), this.clearNavigationKeys(), (t = this.marqueeEl) == null || t.remove(), this.marqueeEl = null, this.marquee = null, (n = this.camPathEditor) == null || n.exit(), this.camPathViz.forEach(u => {
      u.line.geometry.dispose(), u.line.material.dispose();
    }), this.camPathViz.clear(), this.clearJointHandles(), this.chars.forEach(u => u.dispose()), this.props.forEach(u => u.dispose()), this.cams.forEach(u => u.dispose()), this.models.forEach(u => u.dispose()), this.codeModels.forEach(u => u.dispose()), this.disposePartHighlight(), this.controls.dispose(), (r = (s = this.gizmo).dispose) == null || r.call(s), (i = this.flatBgTexture) == null || i.dispose(), (a = this.flatBgMesh) == null || a.geometry.dispose(), (d = (l = this.flatBgMesh) == null ? void 0 : l.material) == null || d.dispose(), this.renderer.dispose(), this.renderer.domElement.remove();
  }
};
S(jt, "GROUND_DRAW_MIN_GAP", 0.1), S(jt, "GROUND_DRAW_H_STEP", 0.25), S(jt, "GROUND_DRAW_H_MAX", 30), S(jt, "GROUND_DRAW_CAP", 256), S(jt, "NAVIGATION_CODES", new Set(["KeyW", "KeyA", "KeyS", "KeyD", "KeyQ", "KeyE", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Numpad8", "Numpad4", "Numpad6"]));
let yi = jt;
const $e = () => typeof crypto < "u" && typeof crypto.randomUUID == "function" ? crypto.randomUUID() : `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
  Bs = () => ({
    x: 0,
    y: 0,
    z: 0
  }),
  Fo = () => ({
    x: 1,
    y: 1,
    z: 1
  });
function If(o) {
  let e = Math.max(0, o),
    t = "";
  do t = String.fromCharCode(65 + e % 26) + t, e = Math.floor(e / 26) - 1; while (e >= 0);
  return `${Se("common.character_default")}${t}`;
}
function Wo(o, e = Fc) {
  var t;
  return {
    id: $e(),
    label: If(o),
    color: tl[o % tl.length],
    bodyType: e,
    pose: "stand",
    jointAngles: hn(e),
    position: {
      x: o * 1.2 - 0,
      y: 0,
      z: 0
    },
    rotation: Bs(),
    scale: {
      ...(((t = Kn[e]) == null ? void 0 : t.scale) ?? Fo())
    },
    uniformScale: 1,
    shadowEnabled: !1,
    visible: !0,
    locked: !1
  };
}
function od(o, e) {
  const t = Vs.find(s => s.id === o),
    n = t ? Se(`prop.${t.id}`) : Se("common.prop_default");
  return {
    id: $e(),
    label: `${n}${e + 1}`,
    assetId: o,
    position: {
      x: 0,
      y: 0,
      z: 0
    },
    rotation: Bs(),
    scale: {
      ...((t == null ? void 0 : t.defaultScale) ?? Fo())
    },
    uniformScale: 1,
    visible: !0,
    locked: !1
  };
}
function Bo(o, e) {
  const t = e ? Bc.find(n => n.id === e) : void 0;
  return {
    id: $e(),
    label: `${Se("common.camera_default")}${o + 1}`,
    position: {
      ...((t == null ? void 0 : t.position) ?? fp)
    },
    lookAt: {
      ...((t == null ? void 0 : t.lookAt) ?? mp)
    },
    lookAtTarget: "",
    cameraRotation: Bs(),
    fov: (t == null ? void 0 : t.fov) ?? 50,
    zoom: 1,
    visible: !0,
    locked: !1,
    screenshots: []
  };
}
function ml(o, e) {
  return {
    id: $e(),
    label: `${Se("common.campath_default")}${o + 1}`,
    points: e,
    duration: 5e3,
    visible: !0,
    lookAtTarget: Ne,
    lookAt: {
      x: 0,
      y: 1.2,
      z: 0
    }
  };
}
function Nf() {
  return {
    referenceImageUrl: "",
    referenceImageOpacity: 0.32,
    showReferenceImage: !1,
    backgroundMode: "panorama",
    panoramaUrl: "",
    panoramaSource: "none",
    panoramaRotationY: 0,
    panoramaRadius: 90,
    flatFit: "contain",
    flatScale: 1,
    flatOffsetX: 0,
    flatOffsetY: 0,
    skyColor: "#060608",
    showGround: !0,
    groundOpacity: 0.4,
    groundHeight: 0,
    sceneScale: Fo(),
    sceneRotation: Bs(),
    scenePosition: Bs(),
    gaussianSplatPosition: {
      x: 0,
      y: 0,
      z: 0
    },
    gaussianSplatRotation: {
      x: 180,
      y: 0,
      z: 0
    },
    gaussianSplatScale: Fo(),
    gaussianSplatSphericalHarmonicsDegree: 0
  };
}
function Rf() {
  return {
    characters: [Wo(0, Fc)],
    props: [],
    cameras: [Bo(0)],
    characterGroups: [],
    environment: Nf()
  };
}
const Df = [{
  type: "skip",
  re: /^\s+/
}, {
  type: "str",
  re: /^"([^"]*)"/
}, {
  type: "dur",
  re: /^(\d+(?:\.\d+)?s)\b/
}, {
  type: "num",
  re: /^(-?\d+(?:\.\d+)?)/
}, {
  type: "word",
  re: /^([A-Za-z_][A-Za-z0-9_-]*)/
}, {
  type: "colon",
  re: /^(:)/
}];
class Bi extends Error {
  constructor(e, t) {
    super(t), this.line = e, this.name = "LexError";
  }
}
function Lf(o) {
  let e = !1;
  for (let t = 0; t < o.length; t++) {
    const n = o[t];
    if (n === '"' && (e = !e), !e && (n === "#" || n === "/" && o[t + 1] === "/")) return o.slice(0, t);
  }
  return o;
}
function zf(o, e) {
  const t = [];
  let n = o;
  for (; n.length > 0;) {
    let s = !1;
    for (const r of Df) {
      const i = r.re.exec(n);
      if (i) {
        s = !0, n = n.slice(i[0].length), r.type !== "skip" && t.push({
          type: r.type,
          value: i[1] ?? i[0]
        });
        break;
      }
    }
    if (!s) throw new Bi(e, `unexpected character: "${n[0]}"`);
  }
  return t;
}
function rd(o) {
  const e = [],
    t = o.split(/\r?\n/);
  for (let n = 0; n < t.length; n++) {
    const s = Lf(t[n]);
    if (s.trim().length === 0) continue;
    const r = s.length - s.trimStart().length,
      i = zf(s.trimStart(), n + 1);
    i.length > 0 && e.push({
      line: n + 1,
      indent: r,
      tokens: i
    });
  }
  return e;
}
const Nr = ["flow", "settle", "drive", "snap", "linear"],
  Of = new Set(["base", "loop", "repeat", "sink", "step"]),
  as = o => o && o.type === "word" ? o.value : null;
function Hf(o) {
  var x, g, b, w, v, E, T, P;
  const e = [];
  let t;
  try {
    t = rd(o);
  } catch (C) {
    if (C instanceof Bi) return {
      ast: null,
      errors: [{
        line: C.line,
        message: C.message
      }]
    };
    throw C;
  }
  if (t.length === 0) return {
    ast: null,
    errors: [{
      line: 1,
      message: "empty document"
    }]
  };
  const n = t[0],
    s = n.tokens;
  if (n.indent !== 0 || s.length !== 2 || as(s[0]) !== "motion" || ((x = s[1]) == null ? void 0 : x.type) !== "str") return {
    ast: null,
    errors: [{
      line: n.line,
      message: 'document must start with a `motion "<name>"` header'
    }]
  };
  const r = {
    name: s[1].value,
    base: "stand",
    baseOverrides: [],
    loop: !1,
    repeat: 1,
    steps: []
  };
  let i = null,
    a = null,
    l = null,
    d = null,
    u = null,
    h = null,
    m = null,
    f = !1;
  const p = () => {
    i = null, d = null, u = null, h = null, m = null;
  };
  for (let C = 1; C < t.length; C++) {
    const M = t[C];
    if (a !== null) {
      if (M.indent > a) continue;
      a = null;
    }
    const y = as(M.tokens[0]),
      I = M.tokens;
    if (y !== null && Of.has(y) && !(y === "sink" && ((g = I[1]) == null ? void 0 : g.type) === "colon")) {
      if (M.indent <= n.indent) {
        e.push({
          line: M.line,
          message: `top-level \`${y}\` must be indented beneath the motion header`
        }), p(), (y === "step" || ((b = I[I.length - 1]) == null ? void 0 : b.type) === "colon") && (a = M.indent);
        continue;
      }
      if (l === null && (l = M.indent), M.indent !== l) {
        e.push({
          line: M.line,
          message: `top-level \`${y}\` must use the document indentation level (${l} spaces)`
        }), p(), (y === "step" || ((w = I[I.length - 1]) == null ? void 0 : w.type) === "colon") && (a = M.indent);
        continue;
      }
      p();
    } else {
      if (i && d !== null) {
        if (M.indent <= d) {
          e.push({
            line: M.line,
            message: "step children must be indented beneath their `step` header"
          });
          continue;
        }
        if (u === null && (u = M.indent), M.indent !== u) {
          e.push({
            line: M.line,
            message: `step children must use one indentation level (${u} spaces)`
          });
          continue;
        }
      } else if (h !== null) {
        if (M.indent <= h) {
          e.push({
            line: M.line,
            message: "base overrides must be indented beneath their `base <pose>:` header"
          });
          continue;
        }
        if (m === null && (m = M.indent), M.indent !== m) {
          e.push({
            line: M.line,
            message: `base overrides must use one indentation level (${m} spaces)`
          });
          continue;
        }
        const H = id(M);
        H.error ? e.push(H.error) : r.baseOverrides.push(H.target);
        continue;
      } else {
        const H = gl(M, null);
        H && e.push(H);
        continue;
      }
      const D = gl(M, i);
      D && e.push(D);
      continue;
    }
    switch (y) {
      case "base":
        {
          const D = as(I[1]),
            H = I.length === 3 && ((v = I[2]) == null ? void 0 : v.type) === "colon";
          if (!D || I.length !== 2 && !H) {
            e.push({
              line: M.line,
              message: "expected `base <pose-id>` or `base <pose-id>:`"
            }), ((E = I[I.length - 1]) == null ? void 0 : E.type) === "colon" && (a = M.indent);
            break;
          }
          if (f) {
            e.push({
              line: M.line,
              message: "duplicate `base` declaration; a motion defines exactly one base pose"
            }), H && (a = M.indent);
            break;
          }
          f = !0, r.base = D, H && (h = M.indent, m = null);
          break;
        }
      case "loop":
        {
          I.length !== 1 ? e.push({
            line: M.line,
            message: "`loop` takes no arguments"
          }) : r.loop = !0;
          break;
        }
      case "sink":
        {
          const D = ((T = I[1]) == null ? void 0 : T.type) === "num" ? Number(I[1].value) : NaN;
          I.length === 2 && Number.isFinite(D) && D >= -2 && D <= 2 ? r.baseSink = D : e.push({
            line: M.line,
            message: "expected `sink <meters>` in [-2, 2] (base root drop at t=0)"
          });
          break;
        }
      case "repeat":
        {
          const D = ((P = I[1]) == null ? void 0 : P.type) === "num" ? Number(I[1].value) : NaN;
          I.length === 2 && Number.isInteger(D) && D >= 1 && D <= 64 ? r.repeat = D : e.push({
            line: M.line,
            message: "repeat requires an integer count in [1, 64]"
          });
          break;
        }
      case "step":
        {
          const D = I[1],
            H = I[2],
            F = as(I[3]),
            U = I[4];
          if ((D == null ? void 0 : D.type) !== "str" || (H == null ? void 0 : H.type) !== "dur" || !F || !Nr.includes(F) || (U == null ? void 0 : U.type) !== "colon" || I.length !== 5) {
            e.push({
              line: M.line,
              message: F && !Nr.includes(F) ? `unknown timing mode "${F}"; expected one of ${Nr.join(", ")}` : 'expected `step "<name>" <duration>s <mode>:`'
            }), p(), a = M.indent;
            break;
          }
          const ne = parseFloat(H.value.replace(/s$/, ""));
          if (!(ne > 0) || ne > 60) {
            e.push({
              line: M.line,
              message: "step duration must be in (0, 60] seconds"
            }), p(), a = M.indent;
            break;
          }
          i = {
            name: D.value,
            durationSec: ne,
            mode: F,
            targets: [],
            line: M.line
          }, r.steps.push(i), d = M.indent, u = null;
          break;
        }
    }
  }
  return r.steps.length === 0 && e.push({
    line: n.line,
    message: "a motion requires at least one step"
  }), {
    ast: r,
    errors: e
  };
}
function gl(o, e) {
  var r, i, a;
  const t = o.tokens,
    n = as(t[0]);
  if (n === "cue") return e ? t.length !== 2 || ((r = t[1]) == null ? void 0 : r.type) !== "str" ? {
    line: o.line,
    message: "`cue` requires exactly one quoted string"
  } : (e.cue = t[1].value, null) : {
    line: o.line,
    message: "`cue` outside of a step"
  };
  if (n === "sink") {
    if (!e) return {
      line: o.line,
      message: "`sink` outside of a step"
    };
    if (t.length !== 3 || ((i = t[1]) == null ? void 0 : i.type) !== "colon" || ((a = t[2]) == null ? void 0 : a.type) !== "num") return {
      line: o.line,
      message: "expected `sink: <meters>` (negative = rise/airborne)"
    };
    const l = Number(t[2].value);
    return !Number.isFinite(l) || l < -2 || l > 2 ? {
      line: o.line,
      message: "`sink` must be in [-2, 2] meters"
    } : (e.sink = l, null);
  }
  if (!e) return {
    line: o.line,
    message: "joint target outside of a step"
  };
  const s = id(o);
  return s.error ? s.error : (e.targets.push(s.target), null);
}
function id(o) {
  var r, i;
  const e = o.tokens,
    t = as(e[0]);
  if (t === null || ((r = e[1]) == null ? void 0 : r.type) !== "colon" || ((i = e[2]) == null ? void 0 : i.type) !== "word") return {
    target: null,
    error: {
      line: o.line,
      message: "expected `<joint>: <action> <degrees>` or `<joint>: hold`"
    }
  };
  const n = e[2].value;
  if (n === "hold" || n === "neutral") return e.length !== 3 ? {
    target: null,
    error: {
      line: o.line,
      message: `expected \`<joint>: ${n}\` (no trailing angle)`
    }
  } : {
    target: {
      joint: t,
      action: n,
      degrees: null,
      line: o.line
    },
    error: null
  };
  const s = e[3];
  return e.length !== 4 || (s == null ? void 0 : s.type) !== "num" ? {
    target: null,
    error: {
      line: o.line,
      message: "expected `<joint>: <action> <degrees>`"
    }
  } : {
    target: {
      joint: t,
      action: n,
      degrees: Number(s.value),
      line: o.line
    },
    error: null
  };
}
const ad = {
    pelvis: {
      flex: {
        field: "bend",
        sign: 1,
        min: 0,
        max: 90
      },
      extend: {
        field: "bend",
        sign: -1,
        min: 0,
        max: 115
      },
      "twist-left": {
        field: "turn",
        sign: 1,
        min: 0,
        max: 60
      },
      "twist-right": {
        field: "turn",
        sign: -1,
        min: 0,
        max: 60
      },
      "tilt-left": {
        field: "tilt",
        sign: 1,
        min: 0,
        max: 45
      },
      "tilt-right": {
        field: "tilt",
        sign: -1,
        min: 0,
        max: 45
      }
    },
    torso: {
      flex: {
        field: "bend",
        sign: 1,
        min: 0,
        max: 60
      },
      extend: {
        field: "bend",
        sign: -1,
        min: 0,
        max: 30
      },
      "twist-left": {
        field: "turn",
        sign: 1,
        min: 0,
        max: 45
      },
      "twist-right": {
        field: "turn",
        sign: -1,
        min: 0,
        max: 45
      },
      "tilt-left": {
        field: "tilt",
        sign: 1,
        min: 0,
        max: 35
      },
      "tilt-right": {
        field: "tilt",
        sign: -1,
        min: 0,
        max: 35
      }
    },
    head: {
      flex: {
        field: "nod",
        sign: 1,
        min: 0,
        max: 50
      },
      extend: {
        field: "nod",
        sign: -1,
        min: 0,
        max: 60
      },
      "twist-left": {
        field: "turn",
        sign: 1,
        min: 0,
        max: 80
      },
      "twist-right": {
        field: "turn",
        sign: -1,
        min: 0,
        max: 80
      },
      "tilt-left": {
        field: "tilt",
        sign: 1,
        min: 0,
        max: 45
      },
      "tilt-right": {
        field: "tilt",
        sign: -1,
        min: 0,
        max: 45
      }
    },
    arm: {
      flex: {
        field: "raise",
        sign: 1,
        min: 0,
        max: 180
      },
      extend: {
        field: "raise",
        sign: -1,
        min: 0,
        max: 60
      },
      abduct: {
        field: "straddle",
        sign: 1,
        min: 0,
        max: 180
      },
      adduct: {
        field: "straddle",
        sign: -1,
        min: 0,
        max: 50
      },
      "rotate-out": {
        field: "turn",
        sign: 1,
        min: 0,
        max: 90
      },
      "rotate-in": {
        field: "turn",
        sign: -1,
        min: 0,
        max: 70
      }
    },
    elbow: {
      flex: {
        field: "bend",
        sign: 1,
        min: 0,
        max: 150
      },
      extend: {
        field: "bend",
        sign: -1,
        min: 0,
        max: 5
      },
      supinate: {
        field: "turn",
        sign: 1,
        min: 0,
        max: 90
      },
      pronate: {
        field: "turn",
        sign: -1,
        min: 0,
        max: 85
      }
    },
    wrist: {
      flex: {
        field: "bend",
        sign: 1,
        min: 0,
        max: 80
      },
      extend: {
        field: "bend",
        sign: -1,
        min: 0,
        max: 70
      },
      "rotate-out": {
        field: "turn",
        sign: 1,
        min: 0,
        max: 90
      },
      "rotate-in": {
        field: "turn",
        sign: -1,
        min: 0,
        max: 85
      }
    },
    hip: {
      flex: {
        field: "raise",
        sign: 1,
        min: 0,
        max: 135
      },
      extend: {
        field: "raise",
        sign: -1,
        min: 0,
        max: 30
      },
      abduct: {
        field: "straddle",
        sign: 1,
        min: 0,
        max: 60
      },
      adduct: {
        field: "straddle",
        sign: -1,
        min: 0,
        max: 30
      },
      "rotate-out": {
        field: "turn",
        sign: 1,
        min: 0,
        max: 45
      },
      "rotate-in": {
        field: "turn",
        sign: -1,
        min: 0,
        max: 40
      }
    },
    knee: {
      flex: {
        field: "bend",
        sign: 1,
        min: 0,
        max: 150
      },
      extend: {
        field: "bend",
        sign: -1,
        min: 0,
        max: 5
      }
    },
    ankle: {
      plantarflex: {
        field: "bend",
        sign: 1,
        min: 0,
        max: 50
      },
      dorsiflex: {
        field: "bend",
        sign: -1,
        min: 0,
        max: 35
      }
    }
  },
  Me = (o, ...e) => ({
    kind: o,
    keys: e
  }),
  ld = {
    pelvis: Me("pelvis", "body"),
    spine: Me("torso", "torso"),
    torso: Me("torso", "torso"),
    head: Me("head", "head"),
    neck: Me("head", "head"),
    shoulders: Me("arm", "l_arm", "r_arm"),
    shoulder_left: Me("arm", "l_arm"),
    shoulder_right: Me("arm", "r_arm"),
    arms: Me("arm", "l_arm", "r_arm"),
    arm_left: Me("arm", "l_arm"),
    arm_right: Me("arm", "r_arm"),
    elbows: Me("elbow", "l_elbow", "r_elbow"),
    elbow_left: Me("elbow", "l_elbow"),
    elbow_right: Me("elbow", "r_elbow"),
    forearms: Me("elbow", "l_elbow", "r_elbow"),
    forearm_left: Me("elbow", "l_elbow"),
    forearm_right: Me("elbow", "r_elbow"),
    wrists: Me("wrist", "l_wrist", "r_wrist"),
    wrist_left: Me("wrist", "l_wrist"),
    wrist_right: Me("wrist", "r_wrist"),
    hips: Me("hip", "l_leg", "r_leg"),
    hip_left: Me("hip", "l_leg"),
    hip_right: Me("hip", "r_leg"),
    knees: Me("knee", "l_knee", "r_knee"),
    knee_left: Me("knee", "l_knee"),
    knee_right: Me("knee", "r_knee"),
    ankles: Me("ankle", "l_ankle", "r_ankle"),
    ankle_left: Me("ankle", "l_ankle"),
    ankle_right: Me("ankle", "r_ankle")
  },
  xl = 120;
function Ff(o) {
  const e = ld[o];
  if (!e) return [];
  const t = Object.keys(ad[e.kind]);
  return e.kind === "pelvis" && t.push("hinge"), t.push("hold", "neutral"), t;
}
function Bf(o, e) {
  return ad[o][e] ?? null;
}
const bl = Math.PI / 180,
  wl = 0.46,
  yl = 0.45,
  Uf = {
    flow: !1,
    settle: !0,
    drive: !1,
    snap: !0,
    linear: !1
  };
function vl(o, e) {
  const t = o * bl,
    n = (o - e) * bl,
    s = wl * Math.cos(t) + yl * Math.cos(n);
  return wl + yl - s;
}
function _l(o) {
  const e = o.body.bend,
    t = vl(o.l_leg.raise - e, o.l_knee.bend),
    n = vl(o.r_leg.raise - e, o.r_knee.bend);
  return Math.max(0, Math.min(t, n));
}
function kl(o) {
  const e = Kt(o.ja);
  return o.hinge !== 0 && (e.body.bend += o.hinge, e.l_leg.raise += o.hinge, e.r_leg.raise += o.hinge), e;
}
function Al(o, e, t, n, s, r) {
  const i = ps.stand ?? ys;
  for (const a of t) {
    const l = ld[a.joint];
    if (!l) {
      r.push({
        line: a.line,
        message: `unknown joint: "${a.joint}"`
      });
      continue;
    }
    if (a.action === "hold" || a.action === "neutral") {
      const h = a.action === "hold" ? n : i;
      for (const m of l.keys) o.ja[m] = {
        ...h[m]
      };
      l.kind === "pelvis" && (o.hinge = 0);
      continue;
    }
    if (a.degrees === null) {
      r.push({
        line: a.line,
        message: `action "${a.action}" requires an angle`
      });
      continue;
    }
    if (l.kind === "pelvis" && a.action === "hinge") {
      const h = Math.min(xl, Math.max(0, a.degrees));
      h !== a.degrees && s.push({
        line: a.line,
        step: e,
        joint: a.joint,
        action: "hinge",
        requested: a.degrees,
        clamped: h,
        min: 0,
        max: xl
      }), o.hinge = h;
      continue;
    }
    const d = Bf(l.kind, a.action);
    if (!d) {
      r.push({
        line: a.line,
        message: `action "${a.action}" is not supported for ${a.joint}; expected one of ${Ff(a.joint).join(", ")}`
      });
      continue;
    }
    const u = Math.min(d.max, Math.max(d.min, a.degrees));
    u !== a.degrees && s.push({
      line: a.line,
      step: e,
      joint: a.joint,
      action: a.action,
      requested: a.degrees,
      clamped: u,
      min: d.min,
      max: d.max
    });
    for (const h of l.keys) o.ja[h][d.field] = d.sign * u;
  }
}
function Gf(o, e) {
  for (const t of Object.keys(Cn)) for (const n of Cn[t]) if (Math.abs(o[t][n] - e[t][n]) > 1e-4) return !1;
  return !0;
}
function $f(o, e, t) {
  const n = [],
    s = [],
    r = ps[t.base];
  if (!r) return s.push({
    line: 1,
    message: `unknown base pose "${t.base}"; expected one of ${Object.keys(ps).join(", ")}`
  }), {
    motion: null,
    errors: s,
    warnings: n
  };
  const i = {
    ja: Kt(r ?? ys),
    hinge: 0
  };
  Al(i, "base", t.baseOverrides, r, n, s);
  const a = kl(i);
  i.ja = Kt(a), i.hinge = 0;
  const l = wp(t.base),
    d = _l(Kt(r)),
    u = (g, b) => b !== void 0 ? b : l + _l(g) - d,
    h = [{
      t: 0,
      mode: "flow",
      rest: !0,
      ja: a,
      drop: u(a, t.baseSink)
    }],
    m = [];
  let f = 0;
  for (const g of t.steps) {
    Al(i, g.name, g.targets, a, n, s);
    const b = kl(i),
      w = f;
    f += Math.round(g.durationSec * 1e3), h.push({
      t: f,
      mode: g.mode,
      rest: Uf[g.mode],
      ja: b,
      drop: u(b, g.sink)
    }), m.push({
      name: g.name,
      start: w,
      end: f,
      ...(g.cue ? {
        cue: g.cue
      } : {})
    });
  }
  if (s.length > 0) return {
    motion: null,
    errors: s,
    warnings: n
  };
  const p = h[h.length - 1];
  if (t.loop && (!Gf(p.ja, a) || Math.abs(p.drop - h[0].drop) > 1e-4)) {
    const g = Math.round(t.steps[0].durationSec * 1e3);
    f += g, h.push({
      t: f,
      mode: "flow",
      rest: !0,
      ja: Kt(a),
      drop: h[0].drop
    }), m.push({
      name: "(wrap)",
      start: f - g,
      end: f
    });
  }
  const x = Math.max(100, f);
  return {
    motion: {
      id: o,
      source: e,
      loop: t.loop,
      cycleMs: x,
      defaultMs: x * (t.loop ? t.repeat : 1),
      keys: h,
      segments: m,
      warnings: n
    },
    errors: s,
    warnings: n
  };
}
function cd(o, e) {
  const {
    ast: t,
    errors: n
  } = Hf(e);
  return !t || n.length > 0 ? {
    motion: null,
    errors: n,
    warnings: []
  } : $f(o, e, t);
}
function dd(o) {
  const e = /^motion\s+"([^"]*)"/.exec(o.trimStart());
  return e ? e[1] : null;
}
const Kf = [{
    id: "idle",
    source: `motion "Idle"
  loop
  step "inhale" 1.5s flow:
    torso: flex 4.5
    shoulders: abduct 14
    elbows: flex 18
    head: extend 8
  step "exhale" 1.5s flow:
    torso: flex 2
    shoulders: abduct 12
    elbows: flex 15
    head: extend 10
`
  }, {
    id: "walk",
    source: `motion "Walk"
  loop
  repeat 2
  base stand:
    hip_right: flex 24
    knee_right: flex 6
    ankle_right: dorsiflex 6
    hip_left: extend 13
    knee_left: flex 24
    ankle_left: plantarflex 14
    shoulder_left: flex 16
    shoulder_right: extend 14
    elbows: flex 25
    torso: twist-right 4
  step "left passes" 0.33s flow:
    hip_left: flex 22
    knee_left: flex 58
    ankle_left: dorsiflex 4
    hip_right: extend 2
    knee_right: flex 9
    ankle_right: plantarflex 2
    shoulder_left: flex 2
    shoulder_right: extend 3
    torso: twist-right 0
  step "left contact" 0.33s flow:
    hip_left: flex 24
    knee_left: flex 6
    ankle_left: dorsiflex 6
    hip_right: extend 13
    knee_right: flex 24
    ankle_right: plantarflex 14
    shoulder_right: flex 16
    shoulder_left: extend 14
    torso: twist-left 4
  step "right passes" 0.33s flow:
    hip_right: flex 22
    knee_right: flex 58
    ankle_right: dorsiflex 4
    hip_left: extend 2
    knee_left: flex 9
    ankle_left: plantarflex 2
    shoulder_right: flex 2
    shoulder_left: extend 3
    torso: twist-left 0
`
  }, {
    id: "run",
    source: `motion "Run"
  loop
  repeat 2
  base stand:
    pelvis: flex 5
    torso: flex 12
    hip_right: flex 36
    knee_right: flex 28
    ankle_right: dorsiflex 8
    hip_left: extend 18
    knee_left: flex 50
    ankle_left: plantarflex 18
    shoulder_left: flex 32
    shoulder_right: extend 22
    elbows: flex 85
    torso: twist-right 6
  step "flight" 0.12s drive:
    hip_right: extend 20
    knee_right: flex 30
    ankle_right: plantarflex 30
    hip_left: flex 52
    knee_left: flex 95
    ankle_left: dorsiflex 5
    shoulder_left: flex 6
    shoulder_right: flex 4
    torso: twist-left 0
    sink: -0.05
  step "left contact" 0.22s flow:
    hip_left: flex 36
    knee_left: flex 28
    ankle_left: dorsiflex 8
    hip_right: extend 18
    knee_right: flex 50
    ankle_right: plantarflex 18
    shoulder_right: flex 32
    shoulder_left: extend 22
    torso: twist-left 6
  step "flight back" 0.12s drive:
    hip_left: extend 20
    knee_left: flex 30
    ankle_left: plantarflex 30
    hip_right: flex 52
    knee_right: flex 95
    ankle_right: dorsiflex 5
    shoulder_right: flex 6
    shoulder_left: flex 4
    torso: twist-right 0
    sink: -0.05
  step "right contact" 0.22s flow:
    hip_right: flex 36
    knee_right: flex 28
    ankle_right: dorsiflex 8
    hip_left: extend 18
    knee_left: flex 50
    ankle_left: plantarflex 18
    shoulder_left: flex 32
    shoulder_right: extend 22
    torso: twist-right 6
`
  }, {
    id: "jump",
    source: `motion "Jump"
  step "crouch" 0.35s settle:
    hips: flex 62
    knees: flex 80
    ankles: dorsiflex 22
    torso: flex 22
    shoulders: extend 28
    elbows: flex 20
    head: extend 18
    cue "Load the legs, arms swing back"
  step "launch" 0.22s drive:
    hips: flex 2
    knees: flex 2
    ankles: plantarflex 32
    torso: flex 2
    shoulders: flex 168
    elbows: flex 10
    head: extend 12
    sink: -0.32
  step "peak tuck" 0.28s flow:
    hips: flex 42
    knees: flex 55
    ankles: dorsiflex 5
    shoulders: flex 120
    sink: -0.5
  step "land" 0.2s snap:
    hips: flex 48
    knees: flex 62
    ankles: dorsiflex 12
    torso: flex 15
    shoulders: flex 25
    elbows: flex 30
    head: extend 10
  step "recover" 0.45s settle:
    hips: hold
    knees: hold
    ankles: hold
    torso: hold
    shoulders: hold
    elbows: hold
    head: hold
`
  }, {
    id: "talk",
    source: `motion "Talk"
  loop
  step "offer palm" 1.0s flow:
    shoulder_right: flex 32
    elbow_right: flex 72
    forearm_right: supinate 40
    head: twist-left 6
    torso: twist-left 3
  step "small beat" 0.9s flow:
    elbow_right: flex 55
    head: flex 2
    head: twist-left 2
  step "settle" 1.1s flow:
    shoulder_right: flex 15
    elbow_right: flex 35
    forearm_right: supinate 10
    head: twist-right 4
    torso: twist-right 0
  step "reset" 0.8s flow:
    shoulder_right: hold
    elbow_right: hold
    forearm_right: hold
    head: hold
    torso: hold
`
  }, {
    id: "wave",
    source: `motion "Wave"
  step "raise arm" 0.4s settle:
    shoulder_right: abduct 95
    shoulder_right: rotate-out 80
    elbow_right: flex 75
    head: tilt-left 5
    cue "Hand up beside the head"
  step "wave out" 0.22s flow:
    elbow_right: flex 95
    wrist_right: extend 10
  step "wave in" 0.22s flow:
    elbow_right: flex 52
    wrist_right: flex 10
  step "wave out again" 0.22s flow:
    elbow_right: flex 95
    wrist_right: extend 10
  step "wave in again" 0.22s flow:
    elbow_right: flex 52
    wrist_right: flex 10
  step "lower arm" 0.5s settle:
    shoulder_right: hold
    elbow_right: hold
    wrist_right: hold
    head: hold
`
  }, {
    id: "bow",
    source: `motion "Bow"
  step "bow down" 0.7s settle:
    pelvis: hinge 40
    head: flex 15
    shoulders: extend 8
    elbows: flex 8
    cue "Fold at the hips, back straight"
  step "hold" 0.7s settle:
    pelvis: hinge 40
    head: flex 15
  step "rise" 0.8s settle:
    pelvis: hinge 0
    head: hold
    shoulders: hold
    elbows: hold
`
  }, {
    id: "cheer",
    source: `motion "Cheer"
  loop
  base stand:
    # V 形双臂走侧举过头（abduct）：raise 过头顶后 straddle 会向内交叉，不可用
    shoulders: abduct 150
    elbows: flex 10
    head: extend 22
    torso: extend 5
  step "dip" 0.3s drive:
    knees: flex 22
    shoulders: abduct 115
    elbows: flex 45
  step "throw up" 0.3s snap:
    knees: flex 2
    shoulders: abduct 155
    elbows: flex 5
  step "back to poise" 0.3s flow:
    knees: flex 0
    shoulders: abduct 150
    elbows: flex 10
`
  }, {
    id: "dance",
    source: `motion "Dance"
  loop
  repeat 2
  base stand:
    knees: flex 12
    elbows: flex 60
  step "left accent" 0.4s flow:
    torso: tilt-left 10
    torso: twist-left 8
    knees: flex 22
    shoulder_right: flex 70
    shoulder_right: abduct 30
    elbow_right: flex 95
    shoulder_left: extend 18
    elbow_left: flex 45
    head: tilt-left 7
  step "right accent" 0.4s flow:
    torso: tilt-right 10
    torso: twist-right 8
    knees: flex 8
    shoulder_left: flex 70
    shoulder_left: abduct 30
    elbow_left: flex 95
    shoulder_right: extend 18
    elbow_right: flex 45
    head: tilt-right 7
`
  }, {
    id: "sit_talk",
    source: `motion "Sit talk"
  loop
  base sit:
    shoulder_right: flex 35
    elbow_right: flex 80
    forearm_right: supinate 30
  step "gesture" 1.0s flow:
    elbow_right: flex 60
    head: twist-left 7
    torso: flex 8
  step "beat" 0.9s flow:
    elbow_right: flex 85
    head: flex 3
  step "settle" 1.1s flow:
    elbow_right: flex 80
    head: twist-right 5
    torso: flex 10.1
`
  }, {
    id: "punch",
    source: `motion "Punch"
  step "guard" 0.3s settle:
    elbows: flex 120
    shoulders: flex 30
    shoulders: adduct 15
    forearms: pronate 40
    knees: flex 15
    hip_left: flex 14
    hip_right: extend 8
    torso: twist-right 14
    head: flex 5
  step "cross" 0.12s snap:
    shoulder_right: flex 82
    shoulder_right: adduct 22
    elbow_right: flex 10
    forearm_right: pronate 75
    torso: twist-left 16
    cue "Hips drive the straight right"
  step "retract" 0.25s drive:
    shoulder_right: flex 30
    shoulder_right: adduct 15
    elbow_right: flex 120
    forearm_right: pronate 40
    torso: twist-right 10
  step "relax" 0.4s settle:
    shoulders: hold
    elbows: hold
    forearms: hold
    knees: hold
    hips: hold
    torso: hold
    head: hold
`
  }, {
    id: "death",
    source: `motion "Death"
  step "struck" 0.35s flow:
    torso: extend 12
    head: extend 22
    shoulders: abduct 40
    elbows: flex 30
    knees: flex 15
    pelvis: extend 5
  step "knees buckle" 0.45s drive:
    knees: flex 100
    hips: flex 20
    pelvis: extend 15
    torso: extend 5
    shoulders: abduct 25
    head: flex 5
  step "fall back" 0.5s drive:
    pelvis: extend 92
    hips: flex 18
    knees: flex 22
    torso: extend 2
    head: extend 30
    shoulders: abduct 45
    elbows: flex 18
    sink: 0.82
    cue "Topples backward onto the ground"
  step "collapse flat" 0.35s snap:
    pelvis: extend 96
    hips: flex 10
    knees: flex 14
    head: extend 20
    shoulders: abduct 50
    elbows: flex 10
    sink: 0.87
  step "still" 0.55s settle:
    pelvis: extend 96
    sink: 0.87
`
  }],
  es = new Map(),
  Vf = 128;
function ud(o, e, t) {
  const n = `${o}\0${e}`;
  if (es.has(n)) {
    const a = es.get(n);
    return a && t !== void 0 && a.label !== t ? {
      ...a,
      label: t
    } : a;
  }
  const {
    motion: s,
    errors: r
  } = cd(o, e);
  if (!s && r.length && console.warn(`[motion] compile failed for "${o}":`, r.map(a => `L${a.line}: ${a.message}`).join("; ")), es.size >= Vf) {
    const a = es.keys().next().value;
    a !== void 0 && es.delete(a);
  }
  const i = s ? {
    ...s,
    ...(t !== void 0 ? {
      label: t
    } : {})
  } : null;
  return es.set(n, i), i;
}
const Qo = Kf.map(o => ud(o.id, o.source)).filter(o => o !== null),
  hd = new Map(Qo.map(o => [o.id, o])),
  vi = o => hd.has(o);
function Vt(o, e) {
  const t = hd.get(o);
  if (t) return t;
  const n = e == null ? void 0 : e.find(s => s.id === o);
  if (n) return ud(n.id, n.source, n.label ?? dd(n.source) ?? n.id) ?? void 0;
}
const Us = 200,
  Ht = o => o.kind === "anim" ? "anim" : o.targetId ? "object" : "camera";
function ms(o) {
  return {
    id: $e(),
    label: `${Se("common.track_default")}${o + 1}`,
    clips: []
  };
}
function Vn(o, e, t) {
  return {
    id: $e(),
    pathId: o,
    start: Math.max(0, Math.round(e)),
    duration: Math.max(Us, Math.round(t))
  };
}
function Gt(o) {
  if (!o) return 0;
  let e = 0;
  for (const t of o.tracks) for (const n of t.clips) e = Math.max(e, n.start + n.duration);
  return e;
}
function Ui(o) {
  let e = 0;
  for (const t of o.clips) e = Math.max(e, t.start + t.duration);
  return e;
}
const qf = (o, e) => o.enabled !== !1 && e >= o.start && e < o.start + o.duration;
function pd(o, e, t) {
  let n = null;
  for (const s of o.clips) !qf(s, e) || !t(s.pathId) || (!n || s.start > n.start) && (n = s);
  return n ? {
    clip: n,
    k: Math.min(1, Math.max(0, (e - n.start) / n.duration))
  } : null;
}
function Yf(o, e, t) {
  if (!o) return null;
  for (const n of o.tracks) {
    if (n.muted || Ht(n) !== "camera") continue;
    const s = pd(n, e, t);
    if (s) return {
      clip: s.clip,
      trackId: n.id,
      k: s.k
    };
  }
  return null;
}
function fd(o, e, t, n, s) {
  let r = null,
    i = null,
    a = null,
    l = null;
  for (const d of o) if (!(d.muted || n && Ht(d) !== n) && !(s !== void 0 && d.targetId !== s)) for (const u of d.clips) {
    if (u.enabled === !1 || !t(u.pathId)) continue;
    const h = u.start + u.duration;
    h <= e ? (!r || h > r.start + r.duration) && (r = u, i = d) : u.start > e && (!a || u.start < a.start) && (a = u, l = d);
  }
  return r ? {
    track: i,
    clip: r,
    k: 1
  } : a ? {
    track: l,
    clip: a,
    k: 0
  } : null;
}
function Xf(o, e, t) {
  return o ? fd(o.tracks, e, t, "camera") : null;
}
function md(o, e, t, n, s) {
  if (s.clear(), !o) return s;
  for (const r of o.tracks) {
    if (r.muted || Ht(r) !== t || !r.targetId || s.has(r.targetId)) continue;
    const i = pd(r, e, n);
    i && s.set(r.targetId, {
      track: r,
      clip: i.clip,
      k: i.k
    });
  }
  for (const r of o.tracks) {
    if (r.muted || Ht(r) !== t || !r.targetId || s.has(r.targetId)) continue;
    const i = fd(o.tracks, e, n, t, r.targetId);
    i && s.set(r.targetId, i);
  }
  return s;
}
function Wf(o, e, t, n = new Map()) {
  return md(o, e, "object", t, n);
}
function Qf(o, e, t, n = new Map()) {
  return md(o, e, "anim", t, n);
}
function gd(o) {
  const e = o.camPaths ?? [];
  if (!o.camTimeline) {
    if (e.length === 0) return o;
    const r = ms(0);
    let i = 0;
    for (const a of e) r.clips.push(Vn(a.id, i, a.duration)), i += Math.max(Us, Math.round(a.duration));
    return {
      ...o,
      camTimeline: {
        tracks: [r]
      }
    };
  }
  const t = new Set(e.map(r => r.id));
  let n = !1;
  const s = o.camTimeline.tracks.map(r => {
    const i = Ht(r) === "anim" ? l => !!Vt(l, o.customMotions) : l => t.has(l),
      a = r.clips.filter(l => i(l.pathId));
    return a.length !== r.clips.length ? (n = !0, {
      ...r,
      clips: a
    }) : r;
  });
  return n ? {
    ...o,
    camTimeline: {
      tracks: s
    }
  } : o;
}
function re(o, e) {
  const t = o.transientPast ?? o.present,
    n = [...o.past, t].slice(-100);
  return {
    ...o,
    past: n,
    present: e,
    future: [],
    transientPast: null
  };
}
function Mt(o, e) {
  return {
    ...o,
    transientPast: o.transientPast ?? o.present,
    present: e
  };
}
const sn = (o, e, t) => o.map(n => n.id === e ? t(n) : n);
function Rr(o, e) {
  if (!o) return o;
  let t = !1;
  const n = o.tracks.map(s => {
    const r = s.clips.filter(i => i.pathId !== e);
    return r.length !== s.clips.length ? (t = !0, {
      ...s,
      clips: r
    }) : s;
  });
  return t ? {
    tracks: n
  } : o;
}
function Zf(o, e, t, n, s) {
  const r = o.camTimeline ?? {
      tracks: []
    },
    i = t ? r.tracks.find(d => d.id === t) : void 0,
    a = (n == null ? void 0 : n.duration) ?? e.duration;
  let l;
  if (i) {
    const d = Vn(e.id, (n == null ? void 0 : n.start) ?? Ui(i), a);
    (n == null ? void 0 : n.enabled) === !1 && (d.enabled = !1), l = r.tracks.map(u => u.id === i.id ? {
      ...u,
      clips: [...u.clips, d]
    } : u);
  } else {
    const d = {
        ...ms(r.tracks.length),
        ...s
      },
      u = Vn(e.id, (n == null ? void 0 : n.start) ?? Gt(r), a);
    (n == null ? void 0 : n.enabled) === !1 && (u.enabled = !1), l = [...r.tracks, {
      ...d,
      clips: [u]
    }];
  }
  return {
    ...o,
    camPaths: [...(o.camPaths ?? []), e],
    camTimeline: {
      tracks: l
    }
  };
}
function Uo(o, e) {
  const t = o.present;
  switch (e.type) {
    case "RESTORE_HISTORY_STATE":
      return e.state;
    case "APPLY_COMPOSITION":
      {
        const n = gd(e.composition),
          s = new Set([...n.characters.map(r => r.id), ...n.props.map(r => r.id), ...n.cameras.map(r => r.id), ...(n.camPaths ?? []).map(r => r.id), ...(n.models ?? []).map(r => r.id), ...(n.codeModels ?? []).map(r => r.id)]);
        return {
          ...re(o, n),
          selectedIds: o.selectedIds.filter(r => s.has(r))
        };
      }
    case "ADD_CHARACTER":
      {
        const n = Wo(t.characters.length, e.bodyType);
        return e.position && (n.position = {
          ...e.position
        }), {
          ...re(o, {
            ...t,
            characters: [...t.characters, n]
          }),
          selectedIds: [n.id]
        };
      }
    case "ADD_CHARACTERS":
      {
        let n = {
          ...t,
          characters: [...t.characters, ...e.chars]
        };
        if (e.groupLabel && e.chars.length >= 2) {
          const s = e.chars.map(i => i.id),
            r = {
              id: $e(),
              label: e.groupLabel,
              characterIds: s,
              memberIds: s,
              locked: !0
            };
          return n = {
            ...n,
            characterGroups: [...n.characterGroups, r]
          }, {
            ...re(o, n),
            selectedIds: r.characterIds
          };
        }
        return re(o, n);
      }
    case "DUPLICATE_CHARACTER":
      {
        const n = t.characters.find(r => r.id === e.id);
        if (!n) return o;
        const s = {
          ...n,
          id: $e(),
          jointAngles: Kt(n.jointAngles),
          position: {
            ...n.position,
            x: n.position.x + 0.6
          }
        };
        return {
          ...re(o, {
            ...t,
            characters: [...t.characters, s]
          }),
          selectedIds: [s.id]
        };
      }
    case "PASTE_CHARACTERS":
      {
        if (!e.chars.length) return o;
        const n = e.chars.map(s => ({
          ...s
        }));
        return {
          ...re(o, {
            ...t,
            characters: [...t.characters, ...n]
          }),
          selectedIds: n.map(s => s.id)
        };
      }
    case "UPDATE_CHARACTER":
      {
        const n = {
          ...t,
          characters: sn(t.characters, e.id, s => ({
            ...s,
            ...e.patch
          }))
        };
        return (e.history ? re : Mt)(o, n);
      }
    case "UPDATE_CHARACTERS":
      {
        const n = new Set(e.ids),
          s = {
            ...t,
            characters: t.characters.map(r => n.has(r.id) ? {
              ...r,
              ...e.patch
            } : r)
          };
        return (e.history ? re : Mt)(o, s);
      }
    case "UPDATE_CHARACTERS_EACH":
      {
        const n = new Map(e.updates.map(r => [r.id, r.patch])),
          s = {
            ...t,
            characters: t.characters.map(r => {
              const i = n.get(r.id);
              return i ? {
                ...r,
                ...i
              } : r;
            })
          };
        return (e.history ? re : Mt)(o, s);
      }
    case "UPDATE_SELECTION_TRANSFORMS":
      {
        if (!e.updates.length) return o;
        const n = new Map(),
          s = new Map(),
          r = new Map();
        for (const a of e.updates) a.kind === "character" ? n.set(a.id, a.patch) : a.kind === "prop" ? s.set(a.id, a.patch) : r.set(a.id, a.patch);
        const i = {
          ...t,
          characters: t.characters.map(a => {
            const l = n.get(a.id);
            return l ? {
              ...a,
              ...l
            } : a;
          }),
          props: t.props.map(a => {
            const l = s.get(a.id);
            return l ? {
              ...a,
              ...l
            } : a;
          }),
          cameras: t.cameras.map(a => {
            const l = r.get(a.id);
            return l ? {
              ...a,
              ...l
            } : a;
          }),
          characterGroups: e.groupPivot ? t.characterGroups.map(a => a.id === e.groupPivot.groupId ? {
            ...a,
            pivot: {
              ...e.groupPivot.pivot
            }
          } : a) : t.characterGroups
        };
        return (e.history ? re : Mt)(o, i);
      }
    case "UPDATE_SELECTION_VISIBILITY":
      {
        const n = new Set(e.ids);
        return re(o, {
          ...t,
          characters: t.characters.map(s => n.has(s.id) ? {
            ...s,
            visible: e.visible
          } : s),
          props: t.props.map(s => n.has(s.id) ? {
            ...s,
            visible: e.visible
          } : s)
        });
      }
    case "UPDATE_CHARACTER_POSE":
      {
        const n = {
          ...t,
          characters: sn(t.characters, e.id, s => {
            const r = Hs({
                ...s.jointAngles,
                ...e.jointAngles
              }, hn(s.bodyType)) ?? s.jointAngles,
              i = e.pose === void 0 ? {
                jointAngles: r
              } : {
                pose: e.pose,
                jointAngles: r
              };
            return {
              ...s,
              ...i
            };
          })
        };
        return (e.history ? re : Mt)(o, n);
      }
    case "ADD_PROP":
      {
        const n = od(e.assetId, t.props.length);
        return e.position && (n.position = {
          ...e.position
        }), {
          ...re(o, {
            ...t,
            props: [...t.props, n]
          }),
          selectedIds: [n.id]
        };
      }
    case "ADD_PROPS":
      return e.props.length ? re(o, {
        ...t,
        props: [...t.props, ...e.props]
      }) : o;
    case "UPDATE_PROP":
      {
        const n = {
          ...t,
          props: sn(t.props, e.id, s => ({
            ...s,
            ...e.patch
          }))
        };
        return (e.history ? re : Mt)(o, n);
      }
    case "ADD_MODEL":
      {
        const n = t.models ?? [];
        return {
          ...re(o, {
            ...t,
            models: [...n, e.model]
          }),
          selectedIds: [e.model.id]
        };
      }
    case "UPDATE_MODEL":
      {
        const n = t.models ?? [],
          s = {
            ...t,
            models: sn(n, e.id, r => ({
              ...r,
              ...e.patch
            }))
          };
        return (e.history ? re : Mt)(o, s);
      }
    case "ADD_CODE_MODEL":
      {
        const n = t.codeModels ?? [],
          r = n.some(i => i.id === e.model.id) ? n.map(i => i.id === e.model.id ? e.model : i) : [...n, e.model];
        return {
          ...re(o, {
            ...t,
            codeModels: r
          }),
          selectedIds: [e.model.id]
        };
      }
    case "UPDATE_CODE_MODEL":
      {
        const n = t.codeModels ?? [],
          s = {
            ...t,
            codeModels: sn(n, e.id, r => ({
              ...r,
              ...e.patch
            }))
          };
        return (e.history ? re : Mt)(o, s);
      }
    case "UPDATE_CODE_MODEL_PART":
      {
        const n = t.codeModels ?? [],
          s = {
            ...t,
            codeModels: sn(n, e.id, r => {
              const i = {
                ...(r.partOverrides ?? {})
              };
              return e.patch === null ? delete i[e.part] : i[e.part] = {
                ...i[e.part],
                ...e.patch
              }, {
                ...r,
                partOverrides: i
              };
            })
          };
        return (e.history ? re : Mt)(o, s);
      }
    case "ADD_CAMERA":
      {
        const n = Bo(t.cameras.length, e.presetId);
        return {
          ...re(o, {
            ...t,
            cameras: [...t.cameras, n]
          }),
          selectedIds: [n.id]
        };
      }
    case "INSERT_CAMERA":
      return {
        ...re(o, {
          ...t,
          cameras: [...t.cameras, e.camera]
        }),
        selectedIds: [e.camera.id]
      };
    case "DUPLICATE_CAMERA":
      {
        const n = t.cameras.find(r => r.id === e.id);
        if (!n) return o;
        const s = {
          ...n,
          id: $e(),
          label: `${Se("common.camera_default")}${t.cameras.length + 1}`,
          screenshots: []
        };
        return {
          ...re(o, {
            ...t,
            cameras: [...t.cameras, s]
          }),
          selectedIds: [s.id]
        };
      }
    case "UPDATE_CAMERA":
      {
        const n = {
          ...t,
          cameras: sn(t.cameras, e.id, s => ({
            ...s,
            ...e.patch
          }))
        };
        return (e.history ? re : Mt)(o, n);
      }
    case "ADD_CAM_PATH_CLIP":
      return {
        ...re(o, Zf(t, e.path, e.trackId, e.clip, e.track)),
        selectedIds: [e.path.id]
      };
    case "REMOVE_CAM_PATH":
      return re(o, {
        ...t,
        camPaths: (t.camPaths ?? []).filter(n => n.id !== e.id),
        camTimeline: Rr(t.camTimeline, e.id)
      });
    case "UPDATE_CAM_PATH":
      {
        const n = ["points", "duration", "easing", "lookAt", "lookAtTarget", "loopMode", "closed", "fovStart", "fovEnd", "recorded"],
          s = !("source" in e.patch) && n.some(i => i in e.patch),
          r = {
            ...t,
            camPaths: (t.camPaths ?? []).map(i => {
              if (i.id !== e.id) return i;
              const a = {
                ...i,
                ...e.patch
              };
              return s && a.source && delete a.source, a;
            })
          };
        return (e.history ? re : Mt)(o, r);
      }
    case "REMOVE_CAM_TRACK":
      {
        const n = t.camTimeline;
        if (!n) return o;
        const s = n.tracks.find(l => l.id === e.trackId);
        if (!s) return o;
        const r = n.tracks.filter(l => l.id !== e.trackId),
          i = new Set(r.flatMap(l => l.clips.map(d => d.pathId))),
          a = new Set(s.clips.map(l => l.pathId).filter(l => !i.has(l)));
        return {
          ...re(o, {
            ...t,
            camTimeline: {
              tracks: r
            },
            camPaths: (t.camPaths ?? []).filter(l => !a.has(l.id))
          }),
          selectedIds: o.selectedIds.filter(l => !a.has(l))
        };
      }
    case "UPDATE_CAM_TRACK":
      {
        const n = t.camTimeline;
        if (!n) return o;
        const s = {
          ...t,
          camTimeline: {
            tracks: sn(n.tracks, e.trackId, r => ({
              ...r,
              ...e.patch
            }))
          }
        };
        return (e.history ? re : Mt)(o, s);
      }
    case "MOVE_CAM_TRACK":
      {
        const n = t.camTimeline;
        if (!n) return o;
        const s = n.tracks.findIndex(l => l.id === e.trackId),
          r = Math.max(0, Math.min(n.tracks.length - 1, e.toIndex));
        if (s < 0 || s === r) return o;
        const i = [...n.tracks],
          [a] = i.splice(s, 1);
        return i.splice(r, 0, a), re(o, {
          ...t,
          camTimeline: {
            tracks: i
          }
        });
      }
    case "ADD_CAM_CLIP":
      {
        const n = t.camTimeline ?? {
            tracks: []
          },
          r = n.tracks.some(i => i.id === e.trackId) ? sn(n.tracks, e.trackId, i => ({
            ...i,
            clips: [...i.clips, e.clip]
          })) : [...n.tracks, {
            ...ms(n.tracks.length),
            clips: [e.clip]
          }];
        return re(o, {
          ...t,
          camTimeline: {
            tracks: r
          }
        });
      }
    case "ADD_ANIM_CLIP":
      {
        const n = Vt(e.animId, t.customMotions);
        if (!n) return o;
        const s = t.camTimeline ?? {
            tracks: []
          },
          r = e.trackId ? s.tracks.find(l => l.id === e.trackId) : void 0,
          i = e.duration ?? n.defaultMs;
        let a;
        if (r) {
          const l = Vn(e.animId, e.start ?? Ui(r), i);
          a = s.tracks.map(d => d.id === r.id ? {
            ...d,
            clips: [...d.clips, l]
          } : d);
        } else {
          const l = {
            ...ms(s.tracks.length),
            kind: "anim",
            targetId: e.targetId
          };
          e.newTrackId && (l.id = e.newTrackId);
          const d = Vn(e.animId, e.start ?? Gt(s), i);
          a = [...s.tracks, {
            ...l,
            clips: [d]
          }];
        }
        return re(o, {
          ...t,
          camTimeline: {
            tracks: a
          }
        });
      }
    case "SET_MOTION":
      {
        const n = t.customMotions ?? [],
          s = n.findIndex(i => i.id === e.def.id),
          r = s >= 0 ? n.map((i, a) => a === s ? e.def : i) : [...n, e.def];
        return re(o, {
          ...t,
          customMotions: r
        });
      }
    case "REMOVE_MOTION":
      {
        const n = t.customMotions ?? [];
        if (!n.some(i => i.id === e.id)) return o;
        const s = n.filter(i => i.id !== e.id);
        let r = t.camTimeline;
        if (r) {
          let i = !1;
          const a = [];
          for (const l of r.tracks) {
            if (Ht(l) !== "anim") {
              a.push(l);
              continue;
            }
            const d = l.clips.filter(u => u.pathId !== e.id);
            if (d.length === l.clips.length) {
              a.push(l);
              continue;
            }
            i = !0, d.length > 0 && a.push({
              ...l,
              clips: d
            });
          }
          i && (r = {
            tracks: a
          });
        }
        return re(o, {
          ...t,
          customMotions: s,
          camTimeline: r
        });
      }
    case "REMOVE_CAM_CLIP":
      {
        const n = t.camTimeline;
        if (!n) return o;
        const s = n.tracks.find(d => d.clips.some(u => u.id === e.clipId)),
          r = s == null ? void 0 : s.clips.find(d => d.id === e.clipId);
        if (!s || !r) return o;
        if (s.clips.length === 1) return Uo(o, {
          type: "REMOVE_CAM_TRACK",
          trackId: s.id
        });
        const i = n.tracks.map(d => ({
            ...d,
            clips: d.clips.filter(u => u.id !== e.clipId)
          })),
          l = !i.some(d => d.clips.some(u => u.pathId === r.pathId)) && (t.camPaths ?? []).some(d => d.id === r.pathId);
        return {
          ...re(o, {
            ...t,
            camTimeline: {
              tracks: i
            },
            camPaths: l ? (t.camPaths ?? []).filter(d => d.id !== r.pathId) : t.camPaths
          }),
          selectedIds: l ? o.selectedIds.filter(d => d !== r.pathId) : o.selectedIds
        };
      }
    case "UPDATE_CAM_CLIP":
      {
        const n = t.camTimeline;
        if (!n) return o;
        const s = n.tracks.map(i => i.clips.some(a => a.id === e.clipId) ? {
            ...i,
            clips: i.clips.map(a => {
              if (a.id !== e.clipId) return a;
              const l = {
                ...a,
                ...e.patch
              };
              return l.start = Math.max(0, Math.round(l.start)), l.duration = Math.max(Us, Math.round(l.duration)), l;
            })
          } : i),
          r = {
            ...t,
            camTimeline: {
              tracks: s
            }
          };
        return (e.history ? re : Mt)(o, r);
      }
    case "UPDATE_ENV":
      {
        const n = {
          ...t,
          environment: {
            ...t.environment,
            ...e.patch
          }
        };
        return (e.history ? re : Mt)(o, n);
      }
    case "CREATE_CHARACTER_GROUP":
      {
        const n = [...new Set(e.characterIds)].filter(a => t.characters.some(l => l.id === a) || t.props.some(l => l.id === a));
        if (n.length < 2) return o;
        const s = n.filter(a => t.characters.some(l => l.id === a)),
          r = {
            id: $e(),
            label: `${Se("common.group_default")}${t.characterGroups.length + 1}`,
            characterIds: s,
            memberIds: n,
            locked: !0
          },
          i = t.characterGroups.map(a => {
            const l = Ge(a).filter(d => !n.includes(d));
            return {
              ...a,
              memberIds: l,
              characterIds: a.characterIds.filter(d => !n.includes(d))
            };
          }).filter(a => Ge(a).length >= 2);
        return re(o, {
          ...t,
          characterGroups: [...i, r]
        });
      }
    case "UPDATE_CHARACTER_GROUP":
      return re(o, {
        ...t,
        characterGroups: t.characterGroups.map(n => n.id === e.groupId ? {
          ...n,
          ...e.patch
        } : n)
      });
    case "UNGROUP_CHARACTER_GROUP":
      return re(o, {
        ...t,
        characterGroups: t.characterGroups.filter(n => n.id !== e.groupId)
      });
    case "REMOVE":
      {
        const n = e.id;
        return {
          ...re(o, {
            ...t,
            characters: t.characters.filter(s => s.id !== n),
            props: t.props.filter(s => s.id !== n),
            cameras: t.cameras.filter(s => s.id !== n),
            camPaths: (t.camPaths ?? []).filter(s => s.id !== n),
            models: (t.models ?? []).filter(s => s.id !== n),
            camTimeline: Rr(t.camTimeline, n),
            customMotions: (t.customMotions ?? []).filter(s => s.id !== n),
            codeModels: (t.codeModels ?? []).filter(s => s.id !== n),
            characterGroups: t.characterGroups.map(s => ({
              ...s,
              memberIds: Ge(s).filter(r => r !== n),
              characterIds: s.characterIds.filter(r => r !== n)
            })).filter(s => Ge(s).length >= 2)
          }),
          selectedIds: o.selectedIds.filter(s => s !== n)
        };
      }
    case "REMOVE_MANY":
      {
        const n = new Set(e.ids);
        if (!n.size) return o;
        let s = t.camTimeline;
        for (const r of n) s = Rr(s, r);
        return {
          ...re(o, {
            ...t,
            characters: t.characters.filter(r => !n.has(r.id)),
            props: t.props.filter(r => !n.has(r.id)),
            cameras: t.cameras.filter(r => !n.has(r.id)),
            camPaths: (t.camPaths ?? []).filter(r => !n.has(r.id)),
            models: (t.models ?? []).filter(r => !n.has(r.id)),
            codeModels: (t.codeModels ?? []).filter(r => !n.has(r.id)),
            customMotions: (t.customMotions ?? []).filter(r => !n.has(r.id)),
            camTimeline: s,
            characterGroups: t.characterGroups.map(r => ({
              ...r,
              memberIds: Ge(r).filter(i => !n.has(i)),
              characterIds: r.characterIds.filter(i => !n.has(i))
            })).filter(r => Ge(r).length >= 2)
          }),
          selectedIds: o.selectedIds.filter(r => !n.has(r))
        };
      }
    case "REMOVE_CHARACTERS":
      {
        const n = new Set(e.ids);
        return {
          ...re(o, {
            ...t,
            characters: t.characters.filter(s => !n.has(s.id)),
            characterGroups: t.characterGroups.map(s => ({
              ...s,
              memberIds: Ge(s).filter(r => !n.has(r)),
              characterIds: s.characterIds.filter(r => !n.has(r))
            })).filter(s => Ge(s).length >= 2)
          }),
          selectedIds: o.selectedIds.filter(s => !n.has(s))
        };
      }
    case "SELECT":
      {
        if (e.id == null) return {
          ...o,
          selectedIds: []
        };
        const n = t.characterGroups.find(s => Ge(s).includes(e.id));
        if (e.additive) {
          const s = n && n.locked !== !1 ? Ge(n) : [e.id],
            r = s.every(i => o.selectedIds.includes(i));
          return {
            ...o,
            selectedIds: r ? o.selectedIds.filter(i => !s.includes(i)) : [...o.selectedIds.filter(i => !s.includes(i)), ...s]
          };
        }
        if (n && n.locked !== !1 && !e.individual) {
          const s = new Set([...t.characters.map(i => i.id), ...t.props.map(i => i.id)]),
            r = Ge(n).filter(i => s.has(i));
          if (r.length > 0) return {
            ...o,
            selectedIds: [...r.filter(i => i !== e.id), e.id]
          };
        }
        return {
          ...o,
          selectedIds: [e.id]
        };
      }
    case "SELECT_MANY":
      {
        const n = new Set([...t.characters.map(r => r.id), ...t.props.map(r => r.id), ...t.cameras.map(r => r.id), ...(t.camPaths ?? []).map(r => r.id), ...(t.codeModels ?? []).map(r => r.id)]),
          s = [];
        for (const r of e.ids) {
          if (!n.has(r)) continue;
          const i = t.characterGroups.find(a => a.locked !== !1 && Ge(a).includes(r));
          for (const a of i ? Ge(i) : [r]) n.has(a) && !s.includes(a) && s.push(a);
        }
        if (e.mode === "replace") return {
          ...o,
          selectedIds: s
        };
        if (e.mode === "remove") {
          const r = new Set(s);
          return {
            ...o,
            selectedIds: o.selectedIds.filter(i => !r.has(i))
          };
        }
        return {
          ...o,
          selectedIds: [...o.selectedIds.filter(r => !s.includes(r)), ...s]
        };
      }
    case "SELECT_CHARACTER_GROUP":
      {
        const n = t.characterGroups.find(i => i.id === e.groupId);
        if (!n) return o;
        const s = new Set([...t.characters.map(i => i.id), ...t.props.map(i => i.id)]),
          r = Ge(n).filter(i => s.has(i));
        return r.length === 0 ? o : {
          ...o,
          selectedIds: r
        };
      }
    case "COMMIT_TRANSIENT":
      {
        if (!o.transientPast) return o;
        const n = [...o.past, o.transientPast].slice(-100);
        return {
          ...o,
          past: n,
          future: [],
          transientPast: null
        };
      }
    case "UNDO":
      {
        if (!o.past.length) return o;
        const n = o.past[o.past.length - 1];
        return {
          ...o,
          past: o.past.slice(0, -1),
          present: n,
          future: [o.present, ...o.future],
          transientPast: null
        };
      }
    case "REDO":
      {
        if (!o.future.length) return o;
        const n = o.future[0];
        return {
          ...o,
          past: [...o.past, o.present],
          present: n,
          future: o.future.slice(1),
          transientPast: null
        };
      }
    default:
      return o;
  }
}
function Jf(o) {
  return {
    present: o.present,
    canUndo: o.past.length > 0,
    canRedo: o.future.length > 0,
    undoDepth: o.past.length,
    redoDepth: o.future.length
  };
}
function em(o, e, t) {
  let n = o,
    s = 0;
  for (; s < t; s += 1) {
    const r = Uo(n, {
      type: e === "undo" ? "UNDO" : "REDO"
    });
    if (r === n) break;
    n = r;
  }
  return {
    state: n,
    stepsTaken: s
  };
}
function tm(o) {
  const [e, t] = k.useReducer(Uo, void 0, () => ({
      past: [],
      present: gd(o),
      future: [],
      transientPast: null,
      selectedIds: []
    })),
    n = k.useRef(e);
  n.current = e;
  const s = k.useCallback(d => {
      const u = Uo(n.current, d);
      n.current = u, t({
        type: "RESTORE_HISTORY_STATE",
        state: u
      });
    }, []),
    r = k.useMemo(() => ({
      applyComposition: d => s({
        type: "APPLY_COMPOSITION",
        composition: d
      }),
      addCharacter: (d, u) => s({
        type: "ADD_CHARACTER",
        bodyType: d,
        position: u
      }),
      addCharacters: (d, u) => s({
        type: "ADD_CHARACTERS",
        chars: d,
        groupLabel: u
      }),
      duplicateCharacter: d => s({
        type: "DUPLICATE_CHARACTER",
        id: d
      }),
      pasteCharacters: d => s({
        type: "PASTE_CHARACTERS",
        chars: d
      }),
      updateCharacter: (d, u, h = !0) => s({
        type: "UPDATE_CHARACTER",
        id: d,
        patch: u,
        history: h
      }),
      updateCharacters: (d, u, h = !0) => s({
        type: "UPDATE_CHARACTERS",
        ids: d,
        patch: u,
        history: h
      }),
      updateCharactersEach: (d, u = !0) => s({
        type: "UPDATE_CHARACTERS_EACH",
        updates: d,
        history: u
      }),
      updateSelectionTransforms: (d, u = !0, h) => s({
        type: "UPDATE_SELECTION_TRANSFORMS",
        updates: d,
        history: u,
        groupPivot: h
      }),
      updateSelectionVisibility: (d, u) => s({
        type: "UPDATE_SELECTION_VISIBILITY",
        ids: d,
        visible: u
      }),
      updateCharacterPose: (d, u, h) => s({
        type: "UPDATE_CHARACTER_POSE",
        id: d,
        jointAngles: u,
        pose: h == null ? void 0 : h.pose,
        history: (h == null ? void 0 : h.history) ?? !0
      }),
      addProp: (d, u) => s({
        type: "ADD_PROP",
        assetId: d,
        position: u
      }),
      addProps: d => s({
        type: "ADD_PROPS",
        props: d
      }),
      updateProp: (d, u, h = !0) => s({
        type: "UPDATE_PROP",
        id: d,
        patch: u,
        history: h
      }),
      addModel: d => s({
        type: "ADD_MODEL",
        model: d
      }),
      updateModel: (d, u, h = !0) => s({
        type: "UPDATE_MODEL",
        id: d,
        patch: u,
        history: h
      }),
      addCodeModel: d => s({
        type: "ADD_CODE_MODEL",
        model: d
      }),
      updateCodeModel: (d, u, h = !0) => s({
        type: "UPDATE_CODE_MODEL",
        id: d,
        patch: u,
        history: h
      }),
      updateCodeModelPart: (d, u, h, m = !0) => s({
        type: "UPDATE_CODE_MODEL_PART",
        id: d,
        part: u,
        patch: h,
        history: m
      }),
      addCamera: d => s({
        type: "ADD_CAMERA",
        presetId: d
      }),
      insertCamera: d => s({
        type: "INSERT_CAMERA",
        camera: d
      }),
      duplicateCamera: d => s({
        type: "DUPLICATE_CAMERA",
        id: d
      }),
      updateCamera: (d, u, h = !0) => s({
        type: "UPDATE_CAMERA",
        id: d,
        patch: u,
        history: h
      }),
      addCamPathClip: (d, u, h, m) => s({
        type: "ADD_CAM_PATH_CLIP",
        path: d,
        trackId: u,
        clip: h,
        track: m
      }),
      removeCamPath: d => s({
        type: "REMOVE_CAM_PATH",
        id: d
      }),
      updateCamPath: (d, u, h = !0) => s({
        type: "UPDATE_CAM_PATH",
        id: d,
        patch: u,
        history: h
      }),
      removeCamTrack: d => s({
        type: "REMOVE_CAM_TRACK",
        trackId: d
      }),
      updateCamTrack: (d, u, h = !0) => s({
        type: "UPDATE_CAM_TRACK",
        trackId: d,
        patch: u,
        history: h
      }),
      moveCamTrack: (d, u) => s({
        type: "MOVE_CAM_TRACK",
        trackId: d,
        toIndex: u
      }),
      addCamClip: (d, u) => s({
        type: "ADD_CAM_CLIP",
        trackId: d,
        clip: u
      }),
      addAnimClip: (d, u, h = null, m) => s({
        type: "ADD_ANIM_CLIP",
        animId: d,
        targetId: u,
        trackId: h,
        ...m
      }),
      setMotion: d => s({
        type: "SET_MOTION",
        def: d
      }),
      removeMotion: d => s({
        type: "REMOVE_MOTION",
        id: d
      }),
      removeCamClip: d => s({
        type: "REMOVE_CAM_CLIP",
        clipId: d
      }),
      updateCamClip: (d, u, h = !0) => s({
        type: "UPDATE_CAM_CLIP",
        clipId: d,
        patch: u,
        history: h
      }),
      updateEnv: (d, u = !0) => s({
        type: "UPDATE_ENV",
        patch: d,
        history: u
      }),
      createCharacterGroup: d => s({
        type: "CREATE_CHARACTER_GROUP",
        characterIds: d
      }),
      updateCharacterGroup: (d, u) => s({
        type: "UPDATE_CHARACTER_GROUP",
        groupId: d,
        patch: u
      }),
      ungroupCharacterGroup: d => s({
        type: "UNGROUP_CHARACTER_GROUP",
        groupId: d
      }),
      remove: d => s({
        type: "REMOVE",
        id: d
      }),
      removeMany: d => s({
        type: "REMOVE_MANY",
        ids: d
      }),
      removeCharacters: d => s({
        type: "REMOVE_CHARACTERS",
        ids: d
      }),
      select: (d, u = !1, h = !1) => s({
        type: "SELECT",
        id: d,
        additive: u,
        individual: h
      }),
      selectMany: (d, u = "replace") => s({
        type: "SELECT_MANY",
        ids: d,
        mode: u
      }),
      selectCharacterGroup: d => s({
        type: "SELECT_CHARACTER_GROUP",
        groupId: d
      }),
      commitTransientUpdate: () => s({
        type: "COMMIT_TRANSIENT"
      }),
      undo: () => s({
        type: "UNDO"
      }),
      redo: () => s({
        type: "REDO"
      })
    }), [s]),
    i = k.useCallback((d, u) => {
      const h = em(n.current, d, u);
      return h.stepsTaken > 0 && s({
        type: "RESTORE_HISTORY_STATE",
        state: h.state
      }), h.stepsTaken;
    }, [s]),
    a = k.useCallback(() => Jf(n.current), []),
    l = k.useCallback(() => e.present, [e.present]);
  return {
    present: e.present,
    selectedIds: e.selectedIds,
    selectedId: e.selectedIds[e.selectedIds.length - 1] ?? null,
    canUndo: e.past.length > 0,
    canRedo: e.future.length > 0,
    exportComposition: l,
    stepHistory: i,
    historySnapshot: a,
    ...r
  };
}
const Ce = (o = 18, e = "") => ({
    width: o,
    height: o,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className: e
  }),
  nm = ({
    size: o,
    className: e
  }) => <svg {...Ce(o, e)}><path d="M21 12a9 9 0 1 1-3-6.7" /><path d="M21 4v4h-4" /></svg>,
  sm = ({
    size: o,
    className: e
  }) => <svg {...Ce(o, e)}><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg>,
  bo = ({
    size: o,
    className: e
  }) => <svg {...Ce(o, e)}><circle cx="12" cy="5" r="2.4" /><path d="M12 7.5v6M7 10h10M12 13.5 8 21M12 13.5 16 21" /></svg>,
  om = ({
    size: o,
    className: e
  }) => <svg {...Ce(o, e)}><path d="M3 8.5A1.5 1.5 0 0 1 4.5 7h2l1.2-1.6h6.6L16 7H17l4-1.5v12L17 16M3 8.5V17a1 1 0 0 0 1 1h13" /><circle cx="10" cy="12" r="3" /></svg>,
  UiRm = ({
    size: o,
    className: e
  }) => <svg {...Ce(o, e)}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>,
  UiJo = ({
    size: o,
    className: e
  }) => <svg {...Ce(o, e)}><path d="M6 6l12 12M18 6 6 18" /></svg>,
  UiIm = ({
    size: o,
    className: e
  }) => <svg {...Ce(o, e)}><path d="M9 7 4 12l5 5M4 12h11a5 5 0 0 1 0 10h-1" /></svg>,
  UiAm = ({
    size: o,
    className: e
  }) => <svg {...Ce(o, e)}><path d="m15 7 5 5-5 5M20 12H9a5 5 0 0 0 0 10h1" /></svg>,
  UiLm = ({
    size: o,
    className: e
  }) => <svg {...Ce(o, e)}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>,
  UiCm = ({
    size: o,
    className: e
  }) => <svg {...Ce(o, e)}><path d="M3 3l18 18M10.6 6.2A10.6 10.6 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7a10.4 10.4 0 0 0 3.6-.6" /><path d="M9.5 9.5a3 3 0 0 0 4 4" /></svg>,
  UiDm = ({
    size: o,
    className: e
  }) => <svg {...Ce(o, e)}><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>,
  UiUm = ({
    size: o,
    className: e
  }) => <svg {...Ce(o, e)}><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 7.5-1.9" /></svg>,
  UiHm = ({
    size: o,
    className: e
  }) => <svg {...Ce(o, e)}><path d="M17 3a2.4 2.4 0 0 1 3.4 3.4L7.5 19.3 3 21l1.7-4.5L17.6 3.6M15 5l4 4" /></svg>,
  UiPm = ({
    size: o,
    className: e
  }) => <svg {...Ce(o, e)}><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>,
  Zo = ({
    size: o,
    className: e
  }) => <svg {...Ce(o, e)}><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" /></svg>,
  Dr = ({
    size: o,
    className: e
  }) => <svg {...Ce(o, e)}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>,
  UiFn = ({
    size: o,
    className: e
  }) => <svg {...Ce(o, e)}><path d="m9 6 6 6-6 6" /></svg>,
  Pn = ({
    size: o,
    className: e
  }) => <svg {...Ce(o, e)}><path d="M5 12.5 10 17.5 19 7" /></svg>,
  fm = ({
    size: o,
    className: e
  }) => <svg {...Ce(o, e)}><path d="M5 3l6 16 2.2-6.2L19.5 10.5 5 3z" /></svg>,
  UiXd = ({
    size: o,
    className: e
  }) => <svg {...Ce(o, e)}><path d="M4 15.5V19a1.5 1.5 0 0 0 1.5 1.5h13A1.5 1.5 0 0 0 20 19v-3.5" /><path d="M12 4v11M12 4 8.2 7.8M12 4l3.8 3.8" /></svg>,
  UiMm = ({
    size: o,
    className: e
  }) => <svg {...Ce(o, e)}><circle cx="12" cy="5" r="2.2" /><path d="M9.4 9.4h5.2L16.2 21H7.8L9.4 9.4z" /></svg>,
  bd = ({
    size: o,
    className: e
  }) => <svg {...Ce(o, e)}><path d="M12 2.8 20.3 7.5v9L12 21.2 3.7 16.5v-9L12 2.8z" /><path d="M3.7 7.5 12 12.2l8.3-4.7M12 12.2v9" /></svg>,
  Ml = ({
    size: o = 20,
    className: e = ""
  }) => <svg width={o} height={o} viewBox="0 0 14 14" fill="none" className={e} aria-hidden="true"><path fill="currentColor" d="M1.48 7.624a.13.13 0 0 1 .198.112.14.14 0 0 1-.045.102c-.299.28-.465.588-.465.912 0 .99 1.543 1.835 3.718 2.174v-.88c0-.192.221-.301.375-.184l1.588 1.222a.35.35 0 0 1-.007.56L5.256 12.8a.233.233 0 0 1-.37-.189v-.565C2.218 11.662.294 10.569.293 9.28c0-.615.438-1.186 1.186-1.656m10.845.112a.13.13 0 0 1 .198-.112c.748.47 1.186 1.041 1.186 1.656 0 1.36-2.14 2.5-5.033 2.824a.2.2 0 0 1-.22-.198v-.716c0-.102.078-.188.18-.2 2.425-.283 4.197-1.179 4.198-2.24 0-.324-.166-.632-.465-.912a.14.14 0 0 1-.044-.102m-1.977-6.355a1.34 1.34 0 0 1 1.254.78q.174.356.174.797v4.294q0 .441-.174.804a1.37 1.37 0 0 1-.496.564 1.35 1.35 0 0 1-.758.21q-.456 0-.779-.21a1.35 1.35 0 0 1-.485-.564 1.9 1.9 0 0 1-.164-.804V2.958q0-.446.169-.803.172-.357.495-.565.323-.21.764-.21M4.622 2.532 3.551 8.75H2.44l1.09-6.229H1.925v-1.06h2.697zm2.073-1.151q.392 0 .665.13.274.128.442.366t.243.575q.08.333.079.744 0 .492-.148 1.062a9 9 0 0 1-.388 1.165q-.238.594-.535 1.175-.298.575-.605 1.09h1.696V8.75H5.238V7.688q.343-.525.664-1.105.323-.58.58-1.166a8 8 0 0 0 .417-1.14q.154-.55.154-1.011 0-.328-.065-.61-.064-.283-.293-.283-.227 0-.292.282a2.7 2.7 0 0 0-.064.61v.506h-1.07v-.505q-.001-.436.073-.784.079-.351.248-.595.169-.247.441-.376.273-.13.664-.13m3.653 1.042a.28.28 0 0 0-.273.168.8.8 0 0 0-.084.367v4.294q0 .213.084.377.084.159.273.16a.29.29 0 0 0 .273-.16.8.8 0 0 0 .084-.377V2.958a.8.8 0 0 0-.084-.377.29.29 0 0 0-.273-.158" /></svg>,
  gm = ({
    size: o,
    className: e
  }) => <svg {...Ce(o, e)}><rect x="3" y="7" width="12" height="10" rx="2" /><path d="M15 10.5 21 7v10l-6-3.5z" /></svg>,
  Gi = ({
    size: o,
    className: e
  }) => <svg {...Ce(o, e)}><path d="M4 18c5-1 3-9 8-10 4-.8 5 3 8 2" /><circle cx="4" cy="18" r="1.7" fill="currentColor" stroke="none" /><circle cx="12" cy="8" r="1.7" fill="currentColor" stroke="none" /><circle cx="20" cy="10" r="1.7" fill="currentColor" stroke="none" /></svg>,
  UiWd = ({
    size: o = 18,
    className: e = ""
  }) => <svg width={o} height={o} viewBox="0 0 20 20" fill="none" className={e} aria-hidden="true"><path d="M16.8369 1.67676C17.6773 1.76205 18.3328 2.47115 18.333 3.33398V16.668L18.3242 16.8379C18.2446 17.6224 17.6214 18.2456 16.8369 18.3252L16.667 18.334H3.33301C2.47017 18.3338 1.76107 17.6783 1.67578 16.8379L1.66699 16.668V3.33398C1.66717 2.41377 2.41279 1.66814 3.33301 1.66797H16.667L16.8369 1.67676ZM3.33301 3.16699C3.24122 3.16717 3.16619 3.24219 3.16602 3.33398V16.668C3.16619 16.7598 3.24122 16.8338 3.33301 16.834H16.667C16.7588 16.8338 16.8328 16.7598 16.833 16.668V3.33398C16.8328 3.2422 16.7588 3.16717 16.667 3.16699H3.33301ZM5 10.9473C5.39764 10.9473 5.71973 11.2703 5.71973 11.668V14.2803H8.33301C8.73065 14.2803 9.05371 14.6033 9.05371 15.001C9.05371 15.3986 8.73065 15.7207 8.33301 15.7207H5C4.60236 15.7207 4.2793 15.3986 4.2793 15.001V11.668C4.2793 11.2703 4.60235 10.9473 5 10.9473ZM15 4.28027C15.3976 4.28027 15.7197 4.60333 15.7197 5.00098V8.33398C15.7197 8.73163 15.3976 9.05469 15 9.05469C14.6024 9.05469 14.2793 8.73163 14.2793 8.33398V5.7207H11.667C11.2693 5.7207 10.9463 5.39862 10.9463 5.00098C10.9463 4.60333 11.2693 4.28027 11.667 4.28027H15Z" fill="currentColor" /></svg>,
  xm = ({
    size: o,
    className: e
  }) => <svg {...Ce(o, e)}><rect x="3" y="4" width="13" height="13" rx="2" /><path d="m4 16 4-4 3 3" /><circle cx="8" cy="8.5" r="1.4" /><path d="M18 15v6M15 18h6" /></svg>,
  $i = ({
    size: o,
    className: e
  }) => <svg {...Ce(o, e)}><path d="M10.5 4.5 12.2 9l4.5 1.7-4.5 1.7-1.7 4.5-1.7-4.5-4.5-1.7L8.8 9l1.7-4.5z" /><path d="m18 14 .9 2.3L21.2 17.2l-2.3.9L18 20.4l-.9-2.3-2.3-.9 2.3-.9L18 14z" /></svg>,
  UiYd = ({
    size: o,
    className: e
  }) => <svg {...Ce(o, e)}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M15 4v16" /><path d="m11 9-3 3 3 3" /></svg>,
  UiVd = ({
    size: o,
    className: e
  }) => <svg {...Ce(o, e)}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M15 4v16" /><path d="m8 9 3 3-3 3" /></svg>,
  UiBm = ({
    size: o,
    className: e
  }) => <svg {...Ce(o, e)}><rect x="2.5" y="6" width="19" height="12" rx="2" /><path d="M6 9.5h.01M9.5 9.5h.01M13 9.5h.01M16.5 9.5h.01M6 13h.01M17.5 13h.01M9 13h6" /></svg>,
  Ki = ({
    size: o = 18,
    className: e = ""
  }) => <svg width={o} height={o} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className={e} aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7" /></svg>;
function UiOn({
  label: o,
  Icon: UiE,
  color: t,
  active: n,
  visible: s,
  onSelect: r,
  onToggleVisible: i,
  onRename: a,
  onDelete: l,
  onDuplicate: d,
  locked: u,
  onToggleLock: h,
  expandable: m,
  expanded: f,
  onToggleExpand: p,
  indent: x
}) {
  const g = pe(),
    [b, w] = k.useState(!1),
    [v, E] = k.useState(o),
    T = () => {
      w(!1);
      const C = v.trim();
      C && C !== o && (a == null || a(C));
    },
    P = n ? "bg-foreground/10 text-foreground font-medium" : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground";
  return <div className={`group flex cursor-pointer items-center gap-2 px-2.5 py-1.5 text-[13px] transition-colors ${P} ${x ? "pl-7" : ""}`} onClick={r}>{m && <button className={`grid w-3 shrink-0 place-items-center text-muted-foreground transition-transform hover:text-foreground ${f ? "rotate-90" : ""}`} onClick={C => {
      C.stopPropagation(), p == null || p();
    }}><UiFn size={10} /></button>}<span className="grid w-4 shrink-0 place-items-center" style={t ? {
      color: t
    } : void 0}><UiE size={15} /></span>{b ? <input autoFocus={!0} className="w-0 flex-1 border border-ring bg-muted px-1 py-0 text-[13px] text-foreground outline-none" value={v} onChange={C => E(C.target.value)} onBlur={T} onKeyDown={C => {
      C.key === "Enter" ? T() : C.key === "Escape" && w(!1);
    }} onClick={C => C.stopPropagation()} /> : <span className={`flex-1 truncate ${s ? "" : "opacity-40"}`} onDoubleClick={C => {
      a && (C.stopPropagation(), E(o), w(!0));
    }}>{o}</span>}<span className="hidden items-center gap-1 text-muted-foreground group-hover:flex">{h && <button title={g(u ? "tree.group_unlock" : "tree.group_lock")} className="grid h-5 w-5 place-items-center transition-colors hover:text-foreground" onClick={C => {
        C.stopPropagation(), h();
      }}>{u ? <UiDm size={13} /> : <UiUm size={13} />}</button>}{d && <button title={g("common.duplicate")} className="grid h-5 w-5 place-items-center transition-colors hover:text-foreground" onClick={C => {
        C.stopPropagation(), d();
      }}><UiPm size={13} /></button>}<button title={g("tree.toggle_visible")} className="grid h-5 w-5 place-items-center transition-colors hover:text-foreground" onClick={C => {
        C.stopPropagation(), i();
      }}>{s ? <UiLm size={13} /> : <UiCm size={13} />}</button>{a && <button title={g("tree.rename")} className="grid h-5 w-5 place-items-center transition-colors hover:text-foreground" onClick={C => {
        C.stopPropagation(), E(o), w(!0);
      }}><UiHm size={13} /></button>}{l && <button title={g("common.delete")} className="grid h-5 w-5 place-items-center transition-colors hover:text-destructive" onClick={C => {
        C.stopPropagation(), l();
      }}><Zo size={13} /></button>}</span></div>;
}
function UiVn({
  title: o,
  count: e,
  children: t
}) {
  const [n, s] = k.useState(!0);
  return <div className="mb-1"><button className="flex w-full items-center gap-1 px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground" onClick={() => s(!n)}><span className={`transition-transform ${n ? "rotate-90" : ""}`}><UiFn size={11} /></span><span>{o}</span><span className="ml-auto tabular-nums">{e}</span></button>{n && <div className="pl-0.5">{t}</div>}</div>;
}
function UiWm({
  comp: o,
  store: e,
  expanded: t,
  onToggleExpanded: n,
  onEnterCamera: s
}) {
  var P, C, M;
  const r = pe(),
    [i, a] = k.useState(""),
    l = k.useRef(null),
    d = y => !i || y.toLowerCase().includes(i.toLowerCase()),
    u = o.characters.filter(y => !y.modelUrl && d(y.label)),
    h = o.characters.filter(y => y.modelUrl && d(y.label)),
    m = (o.models ?? []).filter(y => d(y.label)),
    f = (o.codeModels ?? []).filter(y => d(y.label)),
    p = o.props.filter(y => d(y.label)),
    x = o.cameras.filter(y => d(y.label)),
    g = (o.camPaths ?? []).filter(y => d(y.label)),
    [b, w] = k.useState(new Set()),
    v = [...x, ...g, ...u, ...h, ...m, ...f, ...p].map(y => y.id),
    E = (y, I, j = {}) => {
      const D = I.metaKey || I.ctrlKey,
        H = l.current;
      if (I.shiftKey && H) {
        const F = v.indexOf(H),
          U = v.indexOf(y);
        if (F >= 0 && U >= 0) {
          const ae = [...v.slice(Math.min(F, U), Math.max(F, U) + 1).filter(He => He !== y), y];
          e.selectMany(ae, D ? "add" : "replace");
          return;
        }
      }
      e.select(y, D, j.individual), l.current = y, !D && !I.shiftKey && j.enterCamera && (s == null || s(j.enterCamera));
    },
    T = o.characters.length + o.props.length + o.cameras.length + (((P = o.camPaths) == null ? void 0 : P.length) ?? 0) + (((C = o.codeModels) == null ? void 0 : C.length) ?? 0) + (((M = o.models) == null ? void 0 : M.length) ?? 0) === 0;
  return t ? <div className="director-scene-tree flex w-[248px] shrink-0 flex-col border-r border-border bg-[var(--sidebar)]"><div className="flex items-center px-3 py-2 text-xs font-medium text-foreground"><span className="flex-1">{r("tree.title")}</span><button type="button" className="grid h-6 w-6 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground" title={r("tree.collapse")} aria-label={r("tree.collapse")} aria-expanded={!0} onClick={n}><UiFn size={14} className="rotate-180" /></button></div><div className="px-3 py-2"><div className="relative"><span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"><UiRm size={14} /></span><input className="w-full bg-muted border border-border rounded-[10px] pl-8 pr-2 py-1.5 text-[12.5px] text-foreground outline-none transition-colors focus:border-ring placeholder:text-muted-foreground" placeholder={r("tree.search_placeholder")} value={i} onChange={y => a(y.target.value)} /></div></div><div className="flex-1 overflow-y-auto px-2 pb-2">{T ? <div className="mt-10 px-6 text-center text-[12px] leading-relaxed text-muted-foreground">{r("tree.empty")}</div> : <div className="pt-1">{x.length > 0 && <UiVn title={r("tree.section.cameras")} count={x.length}>{x.map(y => <UiOn key={y.id} label={y.label} Icon={om} active={e.selectedIds.includes(y.id)} visible={y.visible} onSelect={I => E(y.id, I, {
            enterCamera: y
          })} onToggleVisible={() => e.updateCamera(y.id, {
            visible: !y.visible
          })} onRename={I => e.updateCamera(y.id, {
            label: I
          })} onDuplicate={() => e.duplicateCamera(y.id)} onDelete={() => e.remove(y.id)} />)}</UiVn>}{g.length > 0 && <UiVn title={r("tree.section.campaths")} count={g.length}>{g.map(y => <UiOn key={y.id} label={y.label} Icon={Gi} active={e.selectedIds.includes(y.id)} visible={y.visible} onSelect={I => E(y.id, I)} onToggleVisible={() => e.updateCamPath(y.id, {
            visible: !y.visible
          })} onRename={I => e.updateCamPath(y.id, {
            label: I
          })} onDelete={() => e.removeCamPath(y.id)} />)}</UiVn>}{u.length > 0 && <UiVn title={r("tree.section.characters")} count={u.length}>{u.map(y => <UiOn key={y.id} label={y.label} Icon={bo} color={y.color} active={e.selectedIds.includes(y.id)} visible={y.visible} onSelect={I => E(y.id, I, {
            individual: !0
          })} onToggleVisible={() => e.updateCharacter(y.id, {
            visible: !y.visible
          })} onRename={I => e.updateCharacter(y.id, {
            label: I
          })} onDuplicate={() => e.duplicateCharacter(y.id)} onDelete={() => e.remove(y.id)} />)}</UiVn>}{h.length > 0 && <UiVn title={r("tree.section.local_assets")} count={h.length}>{h.map(y => <UiOn key={y.id} label={y.label} Icon={bo} color={y.color} active={e.selectedIds.includes(y.id)} visible={y.visible} onSelect={I => E(y.id, I, {
            individual: !0
          })} onToggleVisible={() => e.updateCharacter(y.id, {
            visible: !y.visible
          })} onRename={I => e.updateCharacter(y.id, {
            label: I
          })} onDuplicate={() => e.duplicateCharacter(y.id)} onDelete={() => e.remove(y.id)} />)}</UiVn>}{p.length > 0 && <UiVn title={r("tree.section.props")} count={p.length}>{p.map(y => <UiOn key={y.id} label={y.label} Icon={Dr} active={e.selectedIds.includes(y.id)} visible={y.visible} onSelect={I => E(y.id, I)} onToggleVisible={() => e.updateProp(y.id, {
            visible: !y.visible
          })} onRename={I => e.updateProp(y.id, {
            label: I
          })} onDelete={() => e.remove(y.id)} />)}</UiVn>}{m.length > 0 && <UiVn title={r("tree.section.models")} count={m.length}>{m.map(y => <UiOn key={y.id} label={y.label} Icon={y.modelType === "pointcloud" ? Dr : bo} active={e.selectedIds.includes(y.id)} visible={y.visible} onSelect={I => E(y.id, I)} onToggleVisible={() => e.updateModel(y.id, {
            visible: !y.visible
          })} onRename={I => e.updateModel(y.id, {
            label: I
          })} onDelete={() => e.remove(y.id)} />)}</UiVn>}{f.length > 0 && <UiVn title={r("tree.section.codemodels")} count={f.length}>{f.map(y => {
            const I = b.has(y.id);
            return <div key={y.id}><UiOn label={y.label} Icon={xm} active={e.selectedIds.includes(y.id)} visible={y.visible} expandable={y.parts.length > 0} expanded={I} onToggleExpand={() => w(j => {
                const D = new Set(j);
                return D.has(y.id) ? D.delete(y.id) : D.add(y.id), D;
              })} onSelect={j => E(y.id, j)} onToggleVisible={() => e.updateCodeModel(y.id, {
                visible: !y.visible
              })} onRename={j => e.updateCodeModel(y.id, {
                label: j
              })} onDelete={() => e.remove(y.id)} />{I && y.parts.map(j => {
                var F, U;
                const D = Sc(y.id, j),
                  H = ((U = (F = y.partOverrides) == null ? void 0 : F[j]) == null ? void 0 : U.visible) !== !1;
                return <UiOn key={D} label={j} Icon={bd} indent={!0} active={e.selectedId === D} visible={H} onSelect={() => e.select(D)} onToggleVisible={() => e.updateCodeModelPart(y.id, j, {
                  visible: !H
                })} />;
              })}</div>;
          })}</UiVn>}{o.characterGroups.length > 0 && <UiVn title={r("tree.section.groups")} count={o.characterGroups.length}>{o.characterGroups.map(y => {
            const I = Ge(y),
              j = I.length > 0 && I.every(ne => e.selectedIds.includes(ne)),
              D = o.characters.filter(ne => I.includes(ne.id)),
              H = o.props.filter(ne => I.includes(ne.id)),
              F = [...D, ...H].some(ne => ne.visible),
              U = H.length > 0 && D.length === 0 ? Dr : bo;
            return <UiOn key={y.id} label={`${y.label}(${I.length})`} Icon={U} active={j} visible={F} onSelect={ne => {
              ne.shiftKey || ne.metaKey || ne.ctrlKey ? e.selectMany(I, ne.metaKey || ne.ctrlKey ? "add" : "replace") : e.selectCharacterGroup(y.id), l.current = I[I.length - 1] ?? null;
            }} onToggleVisible={() => e.updateSelectionVisibility(I, !F)} onRename={ne => e.updateCharacterGroup(y.id, {
              label: ne
            })} locked={y.locked !== !1} onToggleLock={() => e.updateCharacterGroup(y.id, {
              locked: y.locked === !1
            })} onDelete={() => e.ungroupCharacterGroup(y.id)} />;
          })}</UiVn>}</div>}</div></div> : null;
}
const _d = k.createContext("dark");
function Lr(o) {
  typeof document > "u" || document.documentElement.setAttribute("data-theme", o);
}
function UiYm({
  children: o
}) {
  const [e, t] = k.useState(() => Oa());
  return k.useEffect(() => {
    const n = Oa();
    t(n), Lr(n);
    const s = hh(r => {
      t(r), Lr(r);
    });
    return () => s();
  }, []), Lr(e), <_d.Provider value={e}>{o}</_d.Provider>;
}
function Vi() {
  return k.useContext(_d);
}
const vm = {
  flow: o => o,
  settle: o => 1 - (1 - o) * (1 - o),
  drive: o => o * o,
  snap: o => 1 - (1 - o) * (1 - o) * (1 - o),
  linear: o => o
};
function _m(o, e, t, n, s, r) {
  const i = r * r,
    a = i * r;
  return (2 * a - 3 * i + 1) * o + (a - 2 * i + r) * s * t + (-2 * a + 3 * i) * e + (a - i) * s * n;
}
function El(o, e, t, n, s, r, i) {
  if (i) return 0;
  const a = t - o,
    l = s - t;
  if (a <= 1e-6 || l <= 1e-6) return 0;
  const d = (n - e) / a,
    u = (r - n) / l;
  if (d * u <= 0) return 0;
  const h = (r - e) / (s - o),
    m = 3 * Math.min(Math.abs(d), Math.abs(u));
  return Math.sign(h) * Math.min(Math.abs(h), m);
}
function km(o, e) {
  const t = o.keys,
    n = t.length - 1;
  let s;
  e > 0 ? s = {
    key: t[e - 1],
    tOffset: 0
  } : o.loop && t.length > 2 ? s = {
    key: t[n - 1],
    tOffset: -o.cycleMs
  } : s = {
    key: t[e],
    tOffset: 0
  };
  let r;
  return e + 2 <= n ? r = {
    key: t[e + 2],
    tOffset: 0
  } : o.loop && t.length > 2 ? r = {
    key: t[1],
    tOffset: o.cycleMs
  } : r = {
    key: t[e + 1],
    tOffset: 0
  }, {
    prev: s,
    next: r
  };
}
function qi(o, e) {
  const t = o.keys;
  if (t.length === 1) return {
    ja: t[0].ja,
    drop: t[0].drop
  };
  const n = Math.max(1, o.cycleMs);
  let s;
  o.loop ? (s = e % n, s < 0 && (s += n)) : s = Math.min(n, Math.max(0, e));
  let r = 0;
  for (; r < t.length - 2 && t[r + 1].t <= s;) r++;
  const i = t[r],
    a = t[r + 1],
    l = Math.max(1e-6, a.t - i.t),
    d = Math.min(1, Math.max(0, (s - i.t) / l)),
    u = vm[a.mode](d);
  if (a.mode === "linear") {
    const w = {};
    for (const v of Object.keys(Cn)) {
      const E = i.ja[v],
        T = a.ja[v],
        P = {};
      for (const C of Cn[v]) P[C] = E[C] + (T[C] - E[C]) * u;
      w[v] = P;
    }
    return {
      ja: w,
      drop: i.drop + (a.drop - i.drop) * u
    };
  }
  const {
      prev: h,
      next: m
    } = km(o, r),
    f = h.key.t + h.tOffset,
    p = m.key.t + m.tOffset,
    x = (w, v, E, T) => {
      const P = El(f, w, i.t, v, a.t, E, i.rest),
        C = El(i.t, v, a.t, E, p, T, a.rest);
      return _m(v, E, P, C, l, u);
    },
    g = {};
  for (const w of Object.keys(Cn)) {
    const v = h.key.ja[w],
      E = i.ja[w],
      T = a.ja[w],
      P = m.key.ja[w],
      C = {};
    for (const M of Cn[w]) C[M] = x(v[M], E[M], T[M], P[M]);
    g[w] = C;
  }
  const b = x(h.key.drop, i.drop, a.drop, m.key.drop);
  return {
    ja: g,
    drop: b
  };
}
const Cl = 256,
  kd = "#f2f3f5",
  Am = {
    walk: 0.5,
    run: 0.35,
    jump: 0.45,
    talk: 0.3,
    wave: 0.35,
    bow: 0.45,
    cheer: 0.65,
    dance: 0.35,
    sit_talk: 0.3,
    punch: 0.4,
    death: 0.85
  };
function Yi() {
  const o = new Ho({
    antialias: !0,
    alpha: !0,
    preserveDrawingBuffer: !0
  });
  return o.setPixelRatio(1), o.setSize(Cl, Cl, !1), o.outputColorSpace = $t, o.setClearColor(0, 0), o;
}
function Xi() {
  const o = new Oo();
  o.add(new vc(16777215, 1.05)), o.add(new Di(16777215, 2895616, 0.85));
  const e = new Gn(16777215, 1.2);
  e.position.set(5, 10, 5), o.add(e);
  const t = new Gn(16119807, 0.75);
  return t.position.set(-5, 3, -5), o.add(t), o;
}
function Mm() {
  const o = new $n(32, 1, 0.1, 100),
    e = ke.degToRad(25),
    t = 4.6;
  return o.position.set(Math.sin(e) * t, 1.35, Math.cos(e) * t), o.lookAt(0, 0.95, 0), o;
}
async function Wi(o) {
  const e = Yi(),
    t = Xi(),
    n = Mm(),
    s = {};
  try {
    const r = await Yo(Kn.mannequin.modelUrl);
    Xo(r.group, kd), t.add(r.group);
    for (const i of o) r.rig && Fs(r.rig, i.ja), r.group.position.y = -i.drop, r.group.updateMatrixWorld(!0), e.render(t, n), s[i.id] = e.domElement.toDataURL("image/png");
    t.remove(r.group);
  } finally {
    e.dispose();
  }
  return s;
}
function Jo(o) {
  let e = null,
    t = null;
  return () => e ? Promise.resolve(e) : (t || (t = o().then(n => (e = n, n)).finally(() => {
    t = null;
  })), t);
}
const Em = Jo(() => Wi(Qo.map(o => {
    const {
      ja: e,
      drop: t
    } = qi(o, (Am[o.id] ?? 0) * o.cycleMs);
    return {
      id: o.id,
      ja: e,
      drop: t
    };
  }))),
  Cs = new Map(),
  Cm = 64;
async function jm(o) {
  const e = {},
    t = [];
  for (const n of o) {
    const s = Cs.get(`${n.id}\0${n.source}`);
    s ? e[n.id] = s : t.push(n);
  }
  if (t.length > 0) {
    const n = await Wi(t.map(s => {
      const {
        ja: r,
        drop: i
      } = qi(s, 0.5 * s.cycleMs);
      return {
        id: s.id,
        ja: r,
        drop: i
      };
    }));
    for (const s of t) {
      const r = n[s.id];
      if (r) {
        if (Cs.size >= Cm) {
          const i = Cs.keys().next().value;
          i !== void 0 && Cs.delete(i);
        }
        Cs.set(`${s.id}\0${s.source}`, r), e[s.id] = r;
      }
    }
  }
  return e;
}
const Sm = Jo(() => Wi(Gc.map(o => ({
    id: o.id,
    ja: fs(o.id, "mannequin"),
    drop: zi(o.id, Kn.mannequin.modelUrl)
  })))),
  Tm = Jo(async () => {
    const o = Yi(),
      e = Xi(),
      t = new $n(32, 1, 0.01, 100),
      n = ke.degToRad(25),
      s = {};
    try {
      for (const r of xi) {
        const i = Kn[r],
          a = await Yo(i.modelUrl);
        a.group.scale.set(i.scale.x, i.scale.y, i.scale.z), Xo(a.group, kd), a.rig && Fs(a.rig, fs("stand", r)), e.add(a.group), a.group.updateMatrixWorld(!0);
        const l = new nt().setFromObject(a.group),
          d = l.getCenter(new R()),
          h = l.getBoundingSphere(new Ri()).radius / Math.tan(ke.degToRad(t.fov / 2)) * 1.18;
        t.position.set(d.x + Math.sin(n) * h, d.y + h * 0.08, d.z + Math.cos(n) * h), t.lookAt(d), o.render(e, t), s[r] = o.domElement.toDataURL("image/png"), e.remove(a.group), a.group.traverse(m => {
          const p = m.material;
          Array.isArray(p) ? p.forEach(x => x.dispose()) : p == null || p.dispose();
        });
      }
    } finally {
      o.dispose();
    }
    return s;
  });
function Pm(o) {
  o.traverse(e => {
    const t = e;
    t.geometry && t.geometry.dispose();
    const n = t.material;
    Array.isArray(n) ? n.forEach(s => s.dispose()) : n == null || n.dispose();
  });
}
const Im = Jo(async () => {
    const o = Yi(),
      e = Xi(),
      t = new $n(32, 1, 0.01, 200),
      n = ke.degToRad(35),
      s = {};
    try {
      for (const r of Vs) {
        const i = Xc(r.id);
        e.add(i), i.updateMatrixWorld(!0);
        const a = new nt().setFromObject(i),
          l = a.getCenter(new R()),
          u = a.getBoundingSphere(new Ri()).radius / Math.tan(ke.degToRad(t.fov / 2)) * 1.15;
        t.position.set(l.x + Math.sin(n) * u * 0.92, l.y + u * 0.42, l.z + Math.cos(n) * u * 0.92), t.lookAt(l), o.render(e, t), s[r.id] = o.domElement.toDataURL("image/png"), e.remove(i), Pm(i);
      }
    } finally {
      o.dispose();
    }
    return s;
  }),
  Ad = o => 4 / 3 * Math.tan(Math.PI / (2 * o));
function rn(o) {
  return o.targetId ? {
    lookAtTarget: o.targetId
  } : {
    lookAtTarget: Ne,
    lookAt: {
      x: o.center.x,
      y: o.center.y + 1.2,
      z: o.center.z
    }
  };
}
const zr = o => Math.atan2(o.x, o.z);
function Md(o, e, t, n) {
  const s = {
      x: o.x + Math.sin(t) * e,
      y: n,
      z: o.z + Math.cos(t) * e
    },
    r = {
      x: Math.cos(t),
      y: 0,
      z: -Math.sin(t)
    };
  return {
    pos: s,
    tan: r
  };
}
function jl(o, e, t, n, s, r, i = !1) {
  const a = n - t,
    l = i ? s : s - 1,
    d = a / l,
    u = e * Ad(2 * Math.PI / Math.abs(d)),
    h = [];
  for (let m = 0; m < s; m++) {
    const {
        pos: f,
        tan: p
      } = Md(o, e, t + d * m, r),
      x = Math.sign(d) || 1;
    h.push({
      position: f,
      out: {
        x: p.x * u * x,
        y: 0,
        z: p.z * u * x
      },
      in: {
        x: -p.x * u * x,
        y: 0,
        z: -p.z * u * x
      },
      tilt: 0
    });
  }
  return h;
}
function ts(o, e, t) {
  const n = {
      x: (e.x - o.x) / (t - 1),
      y: (e.y - o.y) / (t - 1),
      z: (e.z - o.z) / (t - 1)
    },
    s = [];
  for (let r = 0; r < t; r++) s.push({
    x: o.x + n.x * r,
    y: o.y + n.y * r,
    z: o.z + n.z * r
  });
  return Li(s);
}
function Sl(o) {
  const e = o.startDir,
    t = Math.max(1, o.radius * 0.35);
  return {
    near: {
      x: o.center.x + e.x * t,
      y: Math.max(0.8, o.height * 0.7),
      z: o.center.z + e.z * t
    },
    far: {
      x: o.center.x + e.x * o.radius,
      y: o.height,
      z: o.center.z + e.z * o.radius
    }
  };
}
function Tl(o) {
  const e = o.startDir,
    t = o.radius;
  return {
    lo: {
      x: o.center.x + e.x * t * 0.7,
      y: Math.max(0.8, o.center.y + 0.8),
      z: o.center.z + e.z * t * 0.7
    },
    hi: {
      x: o.center.x + e.x * t * 1.1,
      y: o.center.y + Math.max(3, t * 0.9),
      z: o.center.z + e.z * t * 1.1
    }
  };
}
const Qi = [{
    id: "orbit",
    build(o) {
      const e = zr(o.startDir);
      return {
        points: jl(o.center, o.radius, e, e + Math.PI * 2, 4, o.height, !0),
        closed: !0,
        loopMode: "loop",
        duration: 8e3,
        ...rn(o)
      };
    }
  }, {
    id: "arc",
    build(o) {
      const e = zr(o.startDir);
      return {
        points: jl(o.center, o.radius, e - Math.PI / 2, e + Math.PI / 2, 3, o.height),
        easing: "easeInOut",
        ...rn(o)
      };
    }
  }, {
    id: "dolly_in",
    build(o) {
      const {
        near: e,
        far: t
      } = Sl(o);
      return {
        points: ts(t, e, 2),
        easing: "easeInOut",
        ...rn(o)
      };
    }
  }, {
    id: "dolly_out",
    build(o) {
      const {
        near: e,
        far: t
      } = Sl(o);
      return {
        points: ts(e, t, 2),
        easing: "easeInOut",
        ...rn(o)
      };
    }
  }, {
    id: "dolly_zoom",
    build(o) {
      const e = o.startDir,
        t = Math.max(1, o.radius * 0.4),
        n = {
          x: o.center.x + e.x * o.radius,
          y: o.height,
          z: o.center.z + e.z * o.radius
        },
        s = {
          x: o.center.x + e.x * t,
          y: o.height,
          z: o.center.z + e.z * t
        },
        r = {
          x: o.center.x,
          y: o.center.y + 1.2,
          z: o.center.z
        },
        i = u => Math.hypot(u.x - r.x, u.y - r.y, u.z - r.z),
        a = 32,
        l = Math.min(110, Math.max(10, 2 * Math.atan(Math.tan(a * Math.PI / 360) * (i(n) / Math.max(0.5, i(s)))) * 180 / Math.PI)),
        d = ts(n, s, 2);
      return d[0].fov = a, d[d.length - 1].fov = l, {
        points: d,
        easing: "easeInOut",
        duration: 6e3,
        ...rn(o)
      };
    }
  }, {
    id: "crane_up",
    build(o) {
      const {
        lo: e,
        hi: t
      } = Tl(o);
      return {
        points: ts(e, t, 3),
        easing: "easeInOut",
        ...rn(o)
      };
    }
  }, {
    id: "crane_down",
    build(o) {
      const {
        lo: e,
        hi: t
      } = Tl(o);
      return {
        points: ts(t, e, 3),
        easing: "easeInOut",
        ...rn(o)
      };
    }
  }, {
    id: "truck",
    build(o) {
      const e = o.startDir,
        t = {
          x: -e.z,
          z: e.x
        },
        n = o.radius * 1.2,
        s = {
          x: o.center.x + e.x * o.radius,
          y: o.height,
          z: o.center.z + e.z * o.radius
        },
        r = {
          x: s.x - t.x * n / 2,
          y: o.height,
          z: s.z - t.z * n / 2
        },
        i = {
          x: s.x + t.x * n / 2,
          y: o.height,
          z: s.z + t.z * n / 2
        };
      return {
        points: ts(r, i, 3),
        ...rn(o)
      };
    }
  }, {
    id: "spiral",
    build(o) {
      const e = zr(o.startDir),
        t = 8,
        s = Math.PI * 3 / (t - 1),
        r = o.radius / (t - 1),
        i = [];
      for (let a = 0; a < t; a++) {
        const l = a / (t - 1),
          d = o.radius * (1 - 0.3 * l),
          u = o.height + o.radius * l,
          {
            pos: h,
            tan: m
          } = Md(o.center, d, e + s * a, u),
          f = d * Ad(2 * Math.PI / s);
        i.push({
          position: h,
          out: {
            x: m.x * f,
            y: r / 3,
            z: m.z * f
          },
          in: {
            x: -m.x * f,
            y: -r / 3,
            z: -m.z * f
          },
          tilt: 0
        });
      }
      return {
        points: i,
        duration: 1e4,
        easing: "easeInOut",
        ...rn(o)
      };
    }
  }, {
    id: "pan",
    build(o) {
      const e = {
          x: o.center.x + o.startDir.x * o.radius,
          y: o.height,
          z: o.center.z + o.startDir.z * o.radius
        },
        t = {
          x: o.center.x,
          y: o.center.y + 1.2,
          z: o.center.z
        },
        n = panLookAt(e, t, 30);
      return {
        points: ts(e, {
          x: e.x + 0.02,
          y: e.y,
          z: e.z
        }, 2),
        duration: 2500,
        easing: "easeInOut",
        recorded: {
          rot: [{
            k: 0,
            q: lookAtQuat(e, t)
          }, {
            k: 1,
            q: lookAtQuat(e, n)
          }]
        }
      };
    }
  }, {
    id: "tilt",
    build(o) {
      const e = {
          x: o.center.x + o.startDir.x * o.radius,
          y: o.height,
          z: o.center.z + o.startDir.z * o.radius
        },
        t = {
          x: o.center.x,
          y: o.center.y + 1.2,
          z: o.center.z
        },
        n = tiltLookAt(e, t, 18);
      return {
        points: ts(e, {
          x: e.x + 0.02,
          y: e.y,
          z: e.z
        }, 2),
        duration: 2200,
        easing: "easeInOut",
        recorded: {
          rot: [{
            k: 0,
            q: lookAtQuat(e, t)
          }, {
            k: 1,
            q: lookAtQuat(e, n)
          }]
        }
      };
    }
  }, {
    id: "zoom_in",
    build(o) {
      const e = {
          x: o.center.x + o.startDir.x * o.radius,
          y: o.height,
          z: o.center.z + o.startDir.z * o.radius
        },
        t = ts(e, {
          x: e.x + 0.02,
          y: e.y,
          z: e.z
        }, 2);
      return t[0].fov = 48, t[t.length - 1].fov = 28, {
        points: t,
        duration: 2500,
        easing: "easeInOut",
        ...rn(o)
      };
    }
  }, {
    id: "zoom_out",
    build(o) {
      const e = {
          x: o.center.x + o.startDir.x * o.radius,
          y: o.height,
          z: o.center.z + o.startDir.z * o.radius
        },
        t = ts(e, {
          x: e.x + 0.02,
          y: e.y,
          z: e.z
        }, 2);
      return t[0].fov = 32, t[t.length - 1].fov = 55, {
        points: t,
        duration: 2500,
        easing: "easeInOut",
        ...rn(o)
      };
    }
  }, {
    id: "jib_up",
    build(o) {
      const e = {
          x: o.center.x + o.startDir.x * o.radius,
          y: o.height,
          z: o.center.z + o.startDir.z * o.radius
        },
        t = {
          x: o.center.x,
          y: o.center.y + 1.2,
          z: o.center.z
        };
      return {
        points: ts(e, jibEnd(e, t, Math.max(1.2, o.radius * 0.45), "up"), 3),
        easing: "easeInOut",
        ...rn(o)
      };
    }
  }, {
    id: "jib_down",
    build(o) {
      const e = {
          x: o.center.x + o.startDir.x * o.radius,
          y: o.height,
          z: o.center.z + o.startDir.z * o.radius
        },
        t = {
          x: o.center.x,
          y: o.center.y + 1.2,
          z: o.center.z
        };
      return {
        points: ts(e, jibEnd(e, t, Math.max(1.2, o.radius * 0.45), "down"), 3),
        easing: "easeInOut",
        ...rn(o)
      };
    }
  }, {
    id: "pedestal",
    build(o) {
      const e = {
        x: o.center.x + o.startDir.x * o.radius,
        y: o.height,
        z: o.center.z + o.startDir.z * o.radius
      };
      return {
        points: ts(e, {
          x: e.x,
          y: e.y + Math.max(1.4, o.radius * 0.4),
          z: e.z
        }, 2),
        easing: "easeInOut",
        ...rn(o)
      };
    }
  }, {
    id: "roll",
    build(o) {
      const e = {
          x: o.center.x + o.startDir.x * o.radius,
          y: o.height,
          z: o.center.z + o.startDir.z * o.radius
        },
        t = ts(e, {
          x: e.x + 0.02,
          y: e.y,
          z: e.z
        }, 2);
      return t[0].tilt = 0, t[t.length - 1].tilt = 12 * Math.PI / 180, {
        points: t,
        duration: 2e3,
        easing: "easeInOut",
        ...rn(o)
      };
    }
  }, {
    id: "whip",
    build(o) {
      const e = {
          x: o.center.x + o.startDir.x * o.radius,
          y: o.height,
          z: o.center.z + o.startDir.z * o.radius
        },
        t = {
          x: o.center.x,
          y: o.center.y + 1.2,
          z: o.center.z
        },
        n = panLookAt(e, t, 70);
      return {
        points: ts(e, {
          x: e.x + 0.02,
          y: e.y,
          z: e.z
        }, 2),
        duration: 400,
        easing: "easeIn",
        recorded: {
          rot: [{
            k: 0,
            q: lookAtQuat(e, t)
          }, {
            k: 1,
            q: lookAtQuat(e, n)
          }]
        }
      };
    }
  }, {
    id: "follow",
    build(o) {
      const {
        near: e,
        far: t
      } = Sl(o);
      return {
        points: ts(t, e, 3),
        duration: 4e3,
        easing: "easeInOut",
        ...rn(o)
      };
    }
  }, {
    id: "tracking",
    build(o) {
      const e = {
        x: o.startDir.z,
        y: 0,
        z: -o.startDir.x
      };
      const t = {
        x: o.center.x + e.x * o.radius,
        y: o.height,
        z: o.center.z + e.z * o.radius
      };
      const n = {
        x: o.center.x - e.x * o.radius,
        y: o.height,
        z: o.center.z - e.z * o.radius
      };
      return {
        points: ts(t, n, 3),
        duration: 4e3,
        easing: "easeInOut",
        ...rn(o)
      };
    }
  }, {
    id: "hero_reveal",
    build(o) {
      const e = o.startDir;
      const t = {
        x: o.center.x + e.x * o.radius * 1.2,
        y: Math.max(0.4, o.height * 0.4),
        z: o.center.z + e.z * o.radius * 1.2
      };
      const n = {
        x: o.center.x + e.x * o.radius * 0.65,
        y: o.height + 1.1,
        z: o.center.z + e.z * o.radius * 0.65
      };
      return {
        points: ts(t, n, 3),
        duration: 5e3,
        easing: "easeInOut",
        ...rn(o)
      };
    }
  }, {
    id: "punch_in",
    build(o) {
      const e = {
        x: o.center.x + o.startDir.x * o.radius,
        y: o.height,
        z: o.center.z + o.startDir.z * o.radius
      };
      const t = ts(e, {
        x: e.x + 0.02,
        y: e.y,
        z: e.z
      }, 2);
      t[0].fov = 46;
      t[t.length - 1].fov = 32;
      return {
        points: t,
        duration: 800,
        easing: "easeIn",
        ...rn(o)
      };
    }
  }],
  Pl = "user_poses",
  _i = 20;
function Nm() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
function Rm(o) {
  if (!Array.isArray(o)) return [];
  const e = [];
  for (const t of o) {
    if (!t || typeof t != "object") continue;
    const n = t;
    typeof n.id != "string" || !n.id || typeof n.name == "string" && typeof n.createdAt == "number" && (!n.jointAngles || typeof n.jointAngles != "object" || e.push({
      id: n.id,
      name: n.name.slice(0, _i),
      createdAt: n.createdAt,
      jointAngles: Kt(n.jointAngles)
    }));
  }
  return e;
}
class Dm {
  constructor() {
    S(this, "list", []);
    S(this, "loaded", !1);
    S(this, "listeners", new Set());
    S(this, "offHost", () => {});
    this.offHost = ph(() => {
      this.refresh();
    });
  }
  dispose() {
    this.offHost(), this.listeners.clear();
  }
  subscribe(e) {
    return this.listeners.add(e), () => {
      this.listeners.delete(e);
    };
  }
  getAll() {
    return this.list;
  }
  async ensureLoaded() {
    this.loaded || (await this.refresh());
  }
  async refresh() {
    const e = await fh(Pl);
    this.list = Rm(e), this.loaded = !0, this.emit();
  }
  async add(e, t) {
    await this.ensureLoaded();
    const n = Nm(),
      r = (e ?? "").trim().slice(0, _i) || Se("pp.pose_untitled"),
      a = [{
        id: n,
        name: r,
        jointAngles: Kt(t),
        createdAt: Date.now()
      }, ...this.list];
    return await this.commit(a), n;
  }
  async rename(e, t) {
    await this.ensureLoaded();
    const n = this.list.findIndex(i => i.id === e);
    if (n < 0) return;
    const s = (t ?? "").trim().slice(0, _i);
    if (!s) return;
    const r = this.list.slice();
    r[n] = {
      ...r[n],
      name: s
    }, await this.commit(r);
  }
  async remove(e) {
    await this.ensureLoaded();
    const t = this.list.filter(n => n.id !== e);
    t.length !== this.list.length && (await this.commit(t));
  }
  async commit(e) {
    this.list = e, this.loaded = !0, this.emit(), await mh(Pl, e);
  }
  emit() {
    const e = this.list.slice();
    for (const t of this.listeners) try {
      t(e);
    } catch (n) {
      console.error("[userPoses] listener threw", n);
    }
  }
}
let Or = null;
function So() {
  return Or || (Or = new Dm()), Or;
}
function Zi(o, e, t) {
  const n = (t == null ? void 0 : t.enabled) ?? !0,
    s = (t == null ? void 0 : t.escape) ?? !1,
    r = k.useRef(e);
  r.current = e, k.useEffect(() => {
    if (!n) return;
    const i = l => {
      o.current && !o.current.contains(l.target) && r.current();
    };
    document.addEventListener("mousedown", i);
    const a = s ? l => {
      l.key === "Escape" && r.current();
    } : null;
    return a && document.addEventListener("keydown", a), () => {
      document.removeEventListener("mousedown", i), a && document.removeEventListener("keydown", a);
    };
  }, [n, s]);
}
function UiOe({
  label: o,
  children: e
}) {
  return <div className="mb-3"><div className="mb-1 text-[11px] text-muted-foreground">{o}</div>{e}</div>;
}
function UiVs({
  value: o,
  onChange: e
}) {
  return <input className="w-full rounded-[10px] bg-muted border border-border px-3 py-2 text-[13px] text-foreground outline-none transition-colors focus:border-ring placeholder:text-muted-foreground" value={o} onChange={t => e(t.target.value)} />;
}
function Lm({
  axis: o,
  value: e,
  step: t,
  onChange: n,
  onCommit: s
}) {
  const r = k.useRef(null),
    i = d => {
      r.current = {
        x: d.clientX,
        v: e
      }, d.target.setPointerCapture(d.pointerId);
    },
    a = d => {
      if (!r.current) return;
      const u = (d.clientX - r.current.x) * t * 2;
      n(+(r.current.v + u).toFixed(3));
    },
    l = () => {
      r.current && (r.current = null, s());
    };
  return <label className="flex items-center gap-1 rounded-[10px] bg-muted border border-border px-2 py-1.5"><span className="w-3 cursor-ew-resize select-none text-[11px] lowercase text-muted-foreground" onPointerDown={i} onPointerMove={a} onPointerUp={l}>{o}</span><input type="number" className="w-full bg-transparent text-[12px] text-foreground outline-none" value={Number.isFinite(e) ? +e.toFixed(3) : 0} step={t} onChange={d => n(parseFloat(d.target.value) || 0)} onBlur={s} /></label>;
}
function Ie({
  value: o,
  step: e = 0.05,
  onChange: t,
  onCommit: n
}) {
  return <div className="grid grid-cols-3 gap-2">{["x", "y", "z"].map(s => <Lm key={s} axis={s} value={o[s]} step={e} onChange={r => t({
      ...o,
      [s]: r
    }, !0)} onCommit={n} />)}</div>;
}
function UiQe({
  label: o,
  value: e,
  min: t,
  max: n,
  step: s,
  format: r,
  onChange: i,
  onCommit: a
}) {
  const [l, d] = k.useState(null),
    u = r ? r(e) : e.toFixed(2),
    h = f => Math.min(n, Math.max(t, f)),
    m = f => {
      const p = parseFloat(f);
      Number.isNaN(p) || i(h(p), !1), a(), d(null);
    };
  return <div className="mb-3">{o && <div className="mb-1.5 text-[11px] text-muted-foreground">{o}</div>}<div className="flex items-center gap-3"><input type="range" className="flex-1" value={e} min={t} max={n} step={s} onChange={f => i(parseFloat(f.target.value), !0)} onMouseUp={a} onTouchEnd={a} /><input type="text" inputMode="decimal" className="w-[58px] shrink-0 rounded-[10px] bg-muted border border-border px-2 py-1.5 text-center text-[12px] tabular-nums text-foreground outline-none transition-colors focus:border-ring" value={l ?? u} onFocus={() => d(String(+e.toFixed(2)))} onChange={f => d(f.target.value)} onBlur={f => m(f.target.value)} onKeyDown={f => {
        f.key === "Enter" ? f.target.blur() : f.key === "Escape" && d(null);
      }} /></div></div>;
}
function UiZm({
  label: o,
  value: e,
  min: t,
  max: n,
  onChange: s,
  onCommit: r
}) {
  return <UiQe label={o} value={e} min={t} max={n} step={1} format={i => `${Math.round(i)}°`} onChange={s} onCommit={r} />;
}
function Go({
  value: o,
  options: e,
  onChange: t,
  compact: n = !1
}) {
  const [s, r] = k.useState(!1),
    i = k.useRef(null);
  Zi(i, () => r(!1), {
    enabled: s,
    escape: !0
  });
  const a = e.find(l => l.id === o);
  return <div className="relative" ref={i}><button type="button" className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-md border border-border bg-muted text-foreground outline-none transition-colors hover:border-foreground/50 focus-visible:border-ring ${n ? "py-1 pl-2.5 pr-2 text-[11px]" : "py-2 pl-3 pr-2.5 text-[13px]"}`} onClick={() => r(l => !l)} aria-haspopup="listbox" aria-expanded={s}><span className="truncate text-left">{(a == null ? void 0 : a.label) ?? o}</span><span className={`shrink-0 text-muted-foreground transition-transform ${s ? "rotate-180" : ""}`}><UiFn size={12} /></span></button>{s && <div role="listbox" className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-[280px] overflow-y-auto rounded-xl border border-border bg-popover p-1.5 shadow-lg">{e.map(l => {
        const d = l.id === o;
        return <button key={l.id} type="button" role="option" aria-selected={d} className={`flex w-full items-center justify-between gap-2 rounded-md text-left transition-colors hover:bg-foreground/10 ${n ? "px-2 py-1 text-[11px]" : "px-2.5 py-1.5 text-[12.5px]"} ${d ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"}`} onClick={() => {
          t(l.id), r(!1);
        }}><span className="truncate">{l.label}</span>{d && <span className="shrink-0"><Pn size={11} /></span>}</button>;
      })}</div>}</div>;
}
function Il({
  title: o,
  children: e
}) {
  return <div className="mb-4"><div className="mb-2 text-[12px] font-medium text-foreground">{o}</div>{e}</div>;
}
const Om = [{
  titleKey: "joint.group.body",
  rows: [{
    joint: "body",
    axis: "bend",
    labelKey: "joint.bend_fwd",
    min: -180,
    max: 180
  }, {
    joint: "body",
    axis: "turn",
    labelKey: "joint.turn_body",
    min: -180,
    max: 180
  }, {
    joint: "body",
    axis: "tilt",
    labelKey: "joint.tilt_side",
    min: -180,
    max: 180
  }]
}, {
  titleKey: "joint.group.torso",
  rows: [{
    joint: "torso",
    axis: "bend",
    labelKey: "joint.bend_fwd",
    min: -180,
    max: 180
  }, {
    joint: "torso",
    axis: "turn",
    labelKey: "joint.twist",
    min: -180,
    max: 180
  }, {
    joint: "torso",
    axis: "tilt",
    labelKey: "joint.tilt_side",
    min: -180,
    max: 180
  }]
}, {
  titleKey: "joint.group.head",
  rows: [{
    joint: "head",
    axis: "nod",
    labelKey: "joint.nod",
    min: -180,
    max: 180
  }, {
    joint: "head",
    axis: "turn",
    labelKey: "joint.turn_head",
    min: -180,
    max: 180
  }, {
    joint: "head",
    axis: "tilt",
    labelKey: "joint.tilt_head",
    min: -180,
    max: 180
  }]
}, {
  titleKey: "joint.group.l_arm",
  rows: [{
    joint: "l_arm",
    axis: "raise",
    labelKey: "joint.raise_fwd",
    min: -180,
    max: 180
  }, {
    joint: "l_arm",
    axis: "straddle",
    labelKey: "joint.straddle",
    min: -180,
    max: 180
  }, {
    joint: "l_arm",
    axis: "turn",
    labelKey: "joint.twist",
    min: -180,
    max: 180
  }, {
    joint: "l_elbow",
    axis: "bend",
    labelKey: "joint.elbow_bend",
    min: -180,
    max: 180
  }, {
    joint: "l_elbow",
    axis: "turn",
    labelKey: "joint.forearm_twist",
    min: -180,
    max: 180
  }, {
    joint: "l_wrist",
    axis: "bend",
    labelKey: "joint.wrist_bend",
    min: -90,
    max: 90
  }, {
    joint: "l_wrist",
    axis: "turn",
    labelKey: "joint.wrist_twist",
    min: -90,
    max: 90
  }]
}, {
  titleKey: "joint.group.r_arm",
  rows: [{
    joint: "r_arm",
    axis: "raise",
    labelKey: "joint.raise_fwd",
    min: -180,
    max: 180
  }, {
    joint: "r_arm",
    axis: "straddle",
    labelKey: "joint.straddle",
    min: -180,
    max: 180
  }, {
    joint: "r_arm",
    axis: "turn",
    labelKey: "joint.twist",
    min: -180,
    max: 180
  }, {
    joint: "r_elbow",
    axis: "bend",
    labelKey: "joint.elbow_bend",
    min: -180,
    max: 180
  }, {
    joint: "r_elbow",
    axis: "turn",
    labelKey: "joint.forearm_twist",
    min: -180,
    max: 180
  }, {
    joint: "r_wrist",
    axis: "bend",
    labelKey: "joint.wrist_bend",
    min: -90,
    max: 90
  }, {
    joint: "r_wrist",
    axis: "turn",
    labelKey: "joint.wrist_twist",
    min: -90,
    max: 90
  }]
}, {
  titleKey: "joint.group.l_leg",
  rows: [{
    joint: "l_leg",
    axis: "raise",
    labelKey: "joint.raise_fwd",
    min: -180,
    max: 180
  }, {
    joint: "l_leg",
    axis: "straddle",
    labelKey: "joint.straddle",
    min: -180,
    max: 180
  }, {
    joint: "l_leg",
    axis: "turn",
    labelKey: "joint.twist",
    min: -180,
    max: 180
  }, {
    joint: "l_knee",
    axis: "bend",
    labelKey: "joint.knee_bend",
    min: -180,
    max: 180
  }, {
    joint: "l_ankle",
    axis: "bend",
    labelKey: "joint.ankle_bend",
    min: -50,
    max: 50
  }]
}, {
  titleKey: "joint.group.r_leg",
  rows: [{
    joint: "r_leg",
    axis: "raise",
    labelKey: "joint.raise_fwd",
    min: -180,
    max: 180
  }, {
    joint: "r_leg",
    axis: "straddle",
    labelKey: "joint.straddle",
    min: -180,
    max: 180
  }, {
    joint: "r_leg",
    axis: "turn",
    labelKey: "joint.twist",
    min: -180,
    max: 180
  }, {
    joint: "r_knee",
    axis: "bend",
    labelKey: "joint.knee_bend",
    min: -180,
    max: 180
  }, {
    joint: "r_ankle",
    axis: "bend",
    labelKey: "joint.ankle_bend",
    min: -50,
    max: 50
  }]
}];
function Hm() {
  const o = So(),
    [e, t] = k.useState(() => o.getAll());
  return k.useEffect(() => (o.ensureLoaded(), o.subscribe(t)), [o]), e;
}
function Fm({
  ch: o,
  store: e,
  count: t,
  m: n
}) {
  const s = pe(),
    r = Hm(),
    [i, a] = k.useState(!1),
    [l, d] = k.useState(""),
    [u, h] = k.useState(null),
    [m, f] = k.useState(""),
    p = k.useRef(null),
    x = k.useRef(null);
  k.useEffect(() => {
    i && requestAnimationFrame(() => {
      var M;
      return (M = p.current) == null ? void 0 : M.focus();
    });
  }, [i]), k.useEffect(() => {
    u && requestAnimationFrame(() => {
      var M;
      return (M = x.current) == null ? void 0 : M.focus();
    });
  }, [u]);
  const g = () => {
      d(""), a(!0);
    },
    b = () => {
      a(!1), d("");
    },
    w = async () => {
      const M = l.trim(),
        y = Hs(o.jointAngles, hn(o.bodyType)) ?? hn(o.bodyType);
      (await So().add(M, y)) ? (vt(s("pp.pose_user_saved"), "info"), a(!1), d("")) : vt(s("pp.pose_user_save_failed"), "error");
    },
    v = M => {
      const y = {
        pose: "",
        jointAngles: Kt(M.jointAngles)
      };
      if (t > 1) {
        const j = e.selectedIds.filter(D => e.present.characters.some(H => H.id === D)).map(D => ({
          id: D,
          patch: y
        }));
        e.updateCharactersEach(j, !0);
      } else e.updateCharacter(o.id, y, !0);
    },
    E = M => {
      h(M.id), f(M.name);
    },
    T = async () => {
      if (!u) return;
      const M = m.trim();
      M && (await So().rename(u, M), vt(s("pp.pose_user_renamed"), "info")), h(null), f("");
    },
    P = () => {
      h(null), f("");
    },
    C = async M => {
      await So().remove(M.id), vt(s("pp.pose_user_removed"), "info");
    };
  return <div><div className="mb-2 flex items-center justify-between"><span className="text-[12px] font-medium text-foreground">{s("pp.pose_user_poses")}</span>{!i && <button type="button" className="rounded-sm px-1.5 py-0.5 text-[11.5px] text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground" onClick={g}>{s("pp.pose_save")}</button>}</div>{i && <div className="mb-2 flex items-center gap-1.5 rounded-md border border-border bg-muted px-2.5 py-1.5 transition-colors focus-within:border-ring"><input ref={p} value={l} onChange={M => d(M.target.value)} onKeyDown={M => {
        M.key === "Enter" ? w() : M.key === "Escape" && b();
      }} placeholder={s("pp.pose_save_placeholder")} maxLength={20} style={{
        boxShadow: "none",
        WebkitAppearance: "none",
        appearance: "none"
      }} className="flex-1 min-w-0 border-0 bg-transparent p-0 text-[12.5px] text-foreground outline-none ring-0 focus:outline-none focus:ring-0 focus:border-0 focus-visible:outline-none focus-visible:ring-0 placeholder:text-muted-foreground" /><button type="button" className="grid h-5 w-5 place-items-center rounded-sm text-foreground transition-colors hover:bg-foreground/10" onClick={() => void w()} title={s("pp.pose_save_confirm")}><Pn size={11} /></button><button type="button" className="grid h-5 w-5 place-items-center rounded-sm text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground" onClick={b} title={s("common.cancel")}><UiJo size={11} /></button></div>}{r.length === 0 ? <div className="rounded-md border border-dashed border-border px-2 py-2 text-[11px] text-muted-foreground">{s("pp.pose_user_empty")}</div> : <ul className="flex max-h-52 flex-col gap-1 overflow-y-auto">{r.map(M => {
        const y = u === M.id;
        return <li key={M.id} className={`flex items-center gap-1 rounded-md border bg-muted px-2.5 py-1.5 transition-colors ${y ? "border-ring" : "border-border hover:border-foreground/50"}`}>{y ? <input ref={x} value={m} onChange={I => f(I.target.value)} onKeyDown={I => {
            I.key === "Enter" ? T() : I.key === "Escape" && P();
          }} onBlur={() => void T()} maxLength={20} style={{
            boxShadow: "none",
            WebkitAppearance: "none",
            appearance: "none"
          }} className="flex-1 min-w-0 border-0 bg-transparent p-0 text-[12.5px] text-foreground outline-none ring-0 focus:outline-none focus:ring-0 focus:border-0 focus-visible:outline-none focus-visible:ring-0" /> : <button type="button" className="flex-1 truncate text-left text-[12.5px] text-foreground" title={M.name} onClick={() => v(M)}>{M.name}</button>}{!y && <div className="flex shrink-0 items-center gap-0.5"><button type="button" className="rounded-sm px-1.5 py-0.5 text-[10.5px] text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground" onClick={() => v(M)} title={s("pp.pose_user_apply")}>{s("pp.pose_user_apply")}</button><button type="button" className="rounded-sm px-1.5 py-0.5 text-[10.5px] text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground" onClick={() => E(M)} title={s("pp.pose_user_rename")}>{s("pp.pose_user_rename")}</button><button type="button" className="grid h-5 w-5 place-items-center rounded-sm text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground" onClick={() => void C(M)} title={s("pp.pose_user_delete")}><Zo size={11} /></button></div>}</li>;
      })}</ul>}</div>;
}
function Bm({
  ch: o,
  count: e,
  store: t,
  engine: n
}) {
  const s = pe(),
    [r, i] = k.useState("attr"),
    [a, l] = k.useState(null);
  k.useEffect(() => {
    if (r !== "pose" || a) return;
    let g = !0;
    return Sm().then(b => {
      g && l(b);
    }).catch(() => {}), () => {
      g = !1;
    };
  }, [r, a]);
  const d = () => t.commitTransientUpdate();
  k.useEffect(() => {
    if (!n) return;
    const g = r === "pose" && e <= 1;
    return n.setPoseEdit(g ? o.id : null), () => {
      n.setPoseEdit(null);
    };
  }, [n, r, o.id, e]);
  const u = () => {
      const g = t.present.characters;
      return t.selectedIds.filter(b => g.some(w => w.id === b));
    },
    h = (g, b = !0) => {
      const w = u();
      if (w.length > 1 && w.includes(o.id)) {
        const v = t.present.characters,
          E = w.map(T => {
            const P = v.find(M => M.id === T),
              C = {
                ...g
              };
            return g.position && (C.position = {
              x: P.position.x + (g.position.x - o.position.x),
              y: P.position.y + (g.position.y - o.position.y),
              z: P.position.z + (g.position.z - o.position.z)
            }), g.rotation && (C.rotation = {
              x: P.rotation.x + (g.rotation.x - o.rotation.x),
              y: P.rotation.y + (g.rotation.y - o.rotation.y),
              z: P.rotation.z + (g.rotation.z - o.rotation.z)
            }), g.scale && (C.scale = {
              x: P.scale.x + (g.scale.x - o.scale.x),
              y: P.scale.y + (g.scale.y - o.scale.y),
              z: P.scale.z + (g.scale.z - o.scale.z)
            }), {
              id: T,
              patch: C
            };
          });
        t.updateCharactersEach(E, b);
      } else t.updateCharacter(o.id, g, b);
    },
    m = Hs(o.jointAngles, hn(o.bodyType)) ?? hn(o.bodyType),
    f = (g, b) => {
      const w = u();
      if (w.length > 1 && w.includes(o.id)) {
        const v = t.present.characters,
          E = w.map(T => ({
            id: T,
            patch: g(v.find(P => P.id === T))
          }));
        t.updateCharactersEach(E, b);
      } else {
        const v = g(o);
        t.updateCharacter(o.id, v, b);
      }
    },
    p = (g, b, w, v) => f(E => {
      const T = Hs(E.jointAngles, hn(E.bodyType)) ?? hn(E.bodyType);
      return {
        jointAngles: {
          ...T,
          [g]: {
            ...T[g],
            [b]: w
          }
        }
      };
    }, !v),
    x = g => f(b => ({
      pose: g,
      jointAngles: fs(g, b.bodyType)
    }), !0);
  return <div>{r === "pose" && <div data-pose-tab-active={!0} hidden={!0} />}<div className="mb-3 flex rounded-md border border-border bg-muted p-0.5">{["attr", "pose"].map(g => <button key={g} className={`flex-1 py-1 text-[12px] rounded-sm transition-colors ${r === g ? "bg-foreground text-background font-medium" : "text-muted-foreground hover:text-foreground"}`} onClick={() => i(g)}>{s(g === "attr" ? "pp.tab_attr" : "pp.tab_pose")}</button>)}</div>{e > 1 && <div className="mb-3 rounded-md border border-border bg-foreground/[0.04] px-2 py-1 text-[11px] text-muted-foreground">{s("pp.multi_note", {
        count: e
      })}</div>}{r === "attr" ? <>{e <= 1 && <UiOe label={s("pp.name")}><UiVs value={o.label} onChange={g => h({
          label: g
        })} /></UiOe>}<UiOe label={s("pp.position")}><Ie value={o.position} step={0.05} onChange={(g, b) => h({
          position: g
        }, !b)} onCommit={d} /></UiOe><UiOe label={s("pp.rotation")}><Ie value={o.rotation} step={1} onChange={(g, b) => h({
          rotation: g
        }, !b)} onCommit={d} /></UiOe><UiOe label={s("pp.scale")}><Ie value={o.scale} step={0.05} onChange={(g, b) => h({
          scale: g
        }, !b)} onCommit={d} /></UiOe><UiQe label={s("pp.uniform_scale")} value={o.uniformScale} min={0.1} max={10} step={0.05} onChange={(g, b) => h({
        uniformScale: g
      }, !b)} onCommit={d} /><UiOe label={s("pp.color")}><div className="flex items-center gap-2 rounded-md border border-border bg-muted px-2 py-1.5"><span className="relative h-6 w-6 shrink-0 overflow-hidden rounded-sm border border-border"><input type="color" className="absolute inset-0 h-full w-full cursor-pointer" value={o.color} onChange={g => h({
              color: g.target.value
            })} /></span><span className="text-[13px] text-muted-foreground">#</span><input className="flex-1 bg-transparent text-[13px] uppercase text-foreground outline-none" value={o.color.replace(/^#/, "")} onChange={g => h({
            color: "#" + g.target.value.replace(/^#/, "")
          })} /></div></UiOe><label className="mt-2 flex cursor-pointer items-center justify-between text-[13px] text-foreground"><span>{s("pp.cast_shadow")}</span><UiEr checked={o.shadowEnabled} onChange={g => h({
          shadowEnabled: g
        })} /></label></> : <><Il title={s("pp.pose_presets")}><div className="grid grid-cols-4 gap-1.5">{Gc.map(g => {
            const b = o.pose === g.id,
              w = s(`pose.${g.id}`);
            return <button key={g.id} type="button" title={w} className={`group flex min-w-0 flex-col items-center gap-0.5 rounded-md border p-1 transition-colors ${b ? "border-foreground bg-foreground/10" : "border-transparent bg-muted hover:border-border"}`} onClick={() => x(g.id)}><span className="relative block aspect-square w-full overflow-hidden bg-background/40">{a != null && a[g.id] ? <img src={a[g.id]} alt={w} draggable={!1} className="h-full w-full object-contain" /> : <span className="grid h-full w-full place-items-center text-[16px]">{g.icon}</span>}{b && <span className="absolute bottom-0.5 right-0.5 flex h-3.5 w-3.5 items-center justify-center bg-foreground text-background"><Pn size={9} /></span>}</span><span className={`truncate text-[11px] leading-tight ${b ? "text-foreground font-medium" : "text-muted-foreground group-hover:text-foreground"}`}>{w}</span></button>;
          })}</div><div className="my-4"><Fm ch={o} store={t} count={e} m={m} /></div></Il><Il title={s("pp.pose_adjust")}>{Om.map(g => <div key={g.titleKey} className="mb-3"><div className="mb-1.5 text-[11px] text-muted-foreground">{s(g.titleKey)}</div>{g.rows.map(b => {
            var w;
            return <UiZm key={b.joint + b.axis} label={s(b.labelKey)} value={((w = m[b.joint]) == null ? void 0 : w[b.axis]) ?? 0} min={b.min} max={b.max} onChange={(v, E) => p(b.joint, b.axis, v, E)} onCommit={d} />;
          })}</div>)}</Il></>}</div>;
}
function Um({
  p: o,
  store: e
}) {
  const t = pe(),
    n = (r, i = !0) => e.updateProp(o.id, r, i),
    s = () => e.commitTransientUpdate();
  return <div><UiOe label={t("pp.name")}><UiVs value={o.label} onChange={r => n({
        label: r
      })} /></UiOe><UiOe label={t("pp.position")}><Ie value={o.position} step={0.05} onChange={(r, i) => n({
        position: r
      }, !i)} onCommit={s} /></UiOe><UiOe label={t("pp.rotation")}><Ie value={o.rotation} step={1} onChange={(r, i) => n({
        rotation: r
      }, !i)} onCommit={s} /></UiOe><UiOe label={t("pp.scale")}><Ie value={o.scale} step={0.05} onChange={(r, i) => n({
        scale: r
      }, !i)} onCommit={s} /></UiOe><UiQe label={t("pp.uniform_scale")} value={o.uniformScale} min={0.1} max={10} step={0.05} onChange={(r, i) => n({
      uniformScale: r
    }, !i)} onCommit={s} /></div>;
}
function Gm({
  m: o,
  store: e
}) {
  const t = pe(),
    n = (i, a = !0) => e.updateModel(o.id, i, a),
    s = () => e.commitTransientUpdate(),
    r = o.modelType === "pointcloud";
  return <div><UiOe label={t("pp.name")}><UiVs value={o.label} onChange={i => n({
        label: i
      })} /></UiOe><UiOe label={t("pp.model_type")}><div className="rounded-md border border-border bg-muted px-3 py-2 text-[13px] text-muted-foreground">{r ? `点云 (${/\.spz$/i.test(o.modelName) ? "SPZ" : "PLY"})` : "网格 (GLB/GLTF)"}</div></UiOe><UiOe label={t("pp.model_file")}><div className="rounded-md border border-border bg-muted px-3 py-2 text-[13px] text-muted-foreground truncate" title={o.modelName}>{o.modelName}</div></UiOe><UiOe label={t("pp.position")}><Ie value={o.position} step={0.05} onChange={(i, a) => n({
        position: i
      }, !a)} onCommit={s} /></UiOe><UiOe label={t("pp.rotation")}><Ie value={o.rotation} step={1} onChange={(i, a) => n({
        rotation: i
      }, !a)} onCommit={s} /></UiOe><UiOe label={t("pp.scale")}><Ie value={o.scale} step={0.05} onChange={(i, a) => n({
        scale: i
      }, !a)} onCommit={s} /></UiOe><UiQe label={t("pp.uniform_scale")} value={o.uniformScale} min={0.1} max={10} step={0.05} onChange={(i, a) => n({
      uniformScale: i
    }, !a)} onCommit={s} />{r && <><UiQe label={t("pp.point_size")} value={o.pointSize ?? 0.05} min={0.01} max={0.5} step={0.01} format={i => i.toFixed(2)} onChange={(i, a) => n({
        pointSize: i
      }, !a)} onCommit={s} /><UiOe label={t("pp.point_color")}><div className="flex items-center gap-2"><label className="flex items-center gap-2 text-[12px] text-foreground"><input type="checkbox" checked={!o.pointColor} onChange={i => n({
              pointColor: i.target.checked ? void 0 : "#ffffff"
            })} className="h-3.5 w-3.5" /><span>使用原始颜色</span></label>{o.pointColor && <input type="color" value={o.pointColor} onChange={i => n({
            pointColor: i.target.value
          })} className="h-8 w-16 cursor-pointer rounded border border-border" />}</div></UiOe></>}{!r && <label className="mt-2 flex cursor-pointer items-center justify-between text-[13px] text-foreground"><span>{t("pp.cast_shadow")}</span><UiEr checked={o.shadowEnabled ?? !0} onChange={i => n({
        shadowEnabled: i
      })} /></label>}</div>;
}
function $m({
  m: o,
  store: e
}) {
  const t = pe(),
    [n, s] = k.useState(!1),
    r = (a, l = !0) => e.updateCodeModel(o.id, a, l),
    i = () => e.commitTransientUpdate();
  return <div><UiOe label={t("pp.name")}><UiVs value={o.label} onChange={a => r({
        label: a
      })} /></UiOe><UiOe label={t("pp.position")}><Ie value={o.position} step={0.05} onChange={(a, l) => r({
        position: a
      }, !l)} onCommit={i} /></UiOe><UiOe label={t("pp.rotation")}><Ie value={o.rotation} step={1} onChange={(a, l) => r({
        rotation: a
      }, !l)} onCommit={i} /></UiOe><UiOe label={t("pp.scale")}><Ie value={o.scale} step={0.05} onChange={(a, l) => r({
        scale: a
      }, !l)} onCommit={i} /></UiOe><UiQe label={t("pp.uniform_scale")} value={o.uniformScale} min={0.1} max={10} step={0.05} onChange={(a, l) => r({
      uniformScale: a
    }, !l)} onCommit={i} /><label className="mt-2 flex cursor-pointer items-center justify-between text-[13px] text-foreground"><span>{t("pp.cast_shadow")}</span><UiEr checked={o.shadowEnabled !== !1} onChange={a => r({
        shadowEnabled: a
      })} /></label><div className="mt-3 border-t border-border pt-3"><div className="mb-1.5 text-[11px] text-muted-foreground">{t("pp.parts")} ({o.parts.length})</div><div className="flex flex-wrap gap-1">{o.parts.map(a => {
          var d, u;
          const l = ((u = (d = o.partOverrides) == null ? void 0 : d[a]) == null ? void 0 : u.visible) === !1;
          return <button key={a} className={`rounded-md border border-border px-2 py-0.5 text-[11px] transition-colors hover:border-foreground/50 ${l ? "text-muted-foreground/50 line-through" : "text-muted-foreground hover:text-foreground"}`} title={a} onClick={() => e.select(`${o.id}::${a}`)}>{a}</button>;
        })}</div></div><div className="mt-3 border-t border-border pt-3"><button className="flex w-full items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground" onClick={() => s(a => !a)}><span className={`transition-transform ${n ? "rotate-90" : ""}`}><UiFn size={11} /></span><span>{t("pp.view_code")}</span><span className="ml-auto tabular-nums">{(o.code.length / 1024).toFixed(1)}KB</span></button>{n && <pre className="mt-2 max-h-[280px] overflow-auto rounded-md border border-border bg-muted p-2 text-[10px] leading-relaxed text-muted-foreground">{o.code}</pre>}</div><p className="mt-3 text-[11px] leading-relaxed text-muted-foreground/70">{t("pp.regen_hint")}</p></div>;
}
function Km({
  m: o,
  part: e,
  store: t,
  engine: n
}) {
  var h;
  const s = pe(),
    r = ((h = o.partOverrides) == null ? void 0 : h[e]) ?? {},
    i = (m, f = !0) => t.updateCodeModelPart(o.id, e, m, f),
    a = () => t.commitTransientUpdate(),
    l = n == null ? void 0 : n.getCodePartLocal(o.id, e),
    d = {
      x: 0,
      y: 0,
      z: 0
    },
    u = {
      x: 1,
      y: 1,
      z: 1
    };
  return <div><div className="mb-3 rounded-md border border-border bg-muted px-3 py-2"><div className="truncate text-[13px] font-medium text-foreground" title={e}>{e}</div><button className="mt-0.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground" onClick={() => t.select(o.id)}>{s("pp.part_of", {
          label: o.label
        })}</button></div><label className="mb-2 flex cursor-pointer items-center justify-between text-[13px] text-foreground"><span>{s("pp.visible")}</span><UiEr checked={r.visible !== !1} onChange={m => i({
        visible: m
      })} /></label><UiOe label={s("pp.position")}><Ie value={r.position ?? (l == null ? void 0 : l.position) ?? d} step={0.02} onChange={(m, f) => i({
        position: m
      }, !f)} onCommit={a} /></UiOe><UiOe label={s("pp.rotation")}><Ie value={r.rotation ?? (l == null ? void 0 : l.rotation) ?? d} step={1} onChange={(m, f) => i({
        rotation: m
      }, !f)} onCommit={a} /></UiOe><UiOe label={s("pp.scale")}><Ie value={r.scale ?? (l == null ? void 0 : l.scale) ?? u} step={0.05} onChange={(m, f) => i({
        scale: m
      }, !f)} onCommit={a} /></UiOe><button className="mt-2 h-8 w-full rounded-md border border-border text-[12px] text-muted-foreground transition-colors hover:border-foreground/50 hover:text-foreground" onClick={() => t.updateCodeModelPart(o.id, e, null)}>{s("pp.part_reset")}</button></div>;
}
function Vm({
  c: o,
  comp: e,
  engine: t,
  store: n
}) {
  const s = pe(),
    r = (f, p = !0) => n.updateCamera(o.id, f, p),
    i = () => n.commitTransientUpdate(),
    a = k.useRef(null);
  k.useEffect(() => {
    if (!(!t || !a.current)) return t.mountCameraPreview(o.id, a.current);
  }, [t, o.id]);
  const [l, d] = k.useState(16 / 9);
  k.useEffect(() => {
    if (t) return t.onRender(() => {
      const f = t.viewportAspect();
      d(p => Math.abs(p - f) > 0.001 ? f : p);
    });
  }, [t]);
  const u = [{
      id: Ne,
      label: s("pp.look_free")
    }, ...e.characters.map(f => ({
      id: f.id,
      label: f.label
    })), ...e.props.map(f => ({
      id: f.id,
      label: f.label
    }))],
    h = o.lookAtTarget && o.lookAtTarget !== "" ? o.lookAtTarget : Ne,
    m = h !== Ne && u.some(f => f.id === h);
  return <div><UiOe label={`FOV ${Math.round(o.fov)}°`}><div className="relative w-full overflow-hidden rounded-md border border-border bg-background" style={{
        aspectRatio: String(l)
      }}><canvas ref={a} className="block h-full w-full" /></div></UiOe><UiOe label={s("pp.name")}><UiVs value={o.label} onChange={f => r({
        label: f
      })} /></UiOe><UiOe label={s("pp.position")}><Ie value={o.position} step={0.05} onChange={(f, p) => r({
        position: f
      }, !p)} onCommit={i} /></UiOe><UiOe label={s("pp.look_target")}><Go value={h} options={u} onChange={f => r({
        lookAtTarget: f
      })} /></UiOe>{!m && <UiOe label={s("pp.look_coord")}><Ie value={o.lookAt} step={0.05} onChange={(f, p) => r({
        lookAt: f
      }, !p)} onCommit={i} /></UiOe>}<UiOe label={s("pp.fov")}><UiQe value={o.fov} min={10} max={120} step={1} format={f => `${Math.round(f)}`} onChange={(f, p) => r({
        fov: f
      }, !p)} onCommit={i} /></UiOe></div>;
}
function UiEr({
  checked: o,
  onChange: e
}) {
  return <button type="button" role="checkbox" aria-checked={o} className={`grid h-4 w-4 shrink-0 place-items-center rounded-sm border transition-colors ${o ? "border-foreground bg-foreground text-background" : "border-border bg-muted hover:border-foreground/50"}`} onClick={() => e(!o)}>{o && <Pn size={10} />}</button>;
}
function Gs({
  label: o,
  checked: e,
  onToggle: t
}) {
  return <button className="flex w-full items-center justify-between py-2.5 text-[13px] text-foreground" onClick={() => t(!e)}><span>{o}</span><Ed checked={e} /></button>;
}
function Ed({
  checked: o
}) {
  return <span className={`relative h-5 w-9 rounded-full transition-colors ${o ? "bg-foreground" : "bg-muted border border-border"}`}><span className={`absolute top-0.5 h-4 w-4 rounded-full transition-all ${o ? "left-[18px] bg-background" : "left-0.5 bg-muted-foreground"}`} /></span>;
}
function UiQm({
  env: o,
  onPick: e
}) {
  const [t, n] = k.useState(!1),
    [s, r] = k.useState([]),
    i = k.useRef(null),
    a = pe(),
    l = k.useRef(o);
  l.current = o;
  const d = k.useRef(e);
  if (d.current = e, k.useEffect(() => {
    if (!zs()) return;
    let f = !0;
    const p = () => {
      xh().then(g => {
        if (!f) return;
        r(g);
        const b = l.current.panoramaUrl,
          w = !!b && g.some(v => v.url === b);
        g.length > 0 && !w && d.current(g[0].url, "upload");
      });
    };
    p();
    const x = gh(p);
    return () => {
      f = !1, x();
    };
  }, []), k.useEffect(() => {
    const f = p => {
      i.current && !i.current.contains(p.target) && n(!1);
    };
    return document.addEventListener("mousedown", f), () => document.removeEventListener("mousedown", f);
  }, []), !zs()) {
    const f = () => {
      const p = document.createElement("input");
      p.type = "file", p.accept = "image/*", p.onchange = () => {
        var g;
        const x = (g = p.files) == null ? void 0 : g[0];
        x && e(URL.createObjectURL(x), "upload");
      }, p.click();
    };
    return <button className="flex w-full items-center justify-between gap-2 rounded-md border border-border bg-muted px-3 py-2.5 text-[13px] text-foreground transition-colors hover:border-foreground/50" onClick={f}><span className="truncate">{o.panoramaUrl ? a("pp.panorama_selected") : a("pp.pick_from_canvas")}</span><span className="shrink-0 text-muted-foreground"><UiFn size={12} /></span></button>;
  }
  const u = s.find(f => f.url === o.panoramaUrl),
    h = o.panoramaUrl ? (u == null ? void 0 : u.name) ?? a("pp.panorama_selected") : a("common.none"),
    m = (f, p) => {
      e(f, p), n(!1);
    };
  return <div className="relative" ref={i}><button className="flex w-full items-center justify-between gap-2 rounded-md border border-border bg-muted px-3 py-2.5 text-[13px] text-foreground transition-colors hover:border-foreground/50" onClick={() => n(f => !f)}><span className="truncate">{h}</span><span className="shrink-0 text-muted-foreground"><UiFn size={12} /></span></button>{t && <div className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-[280px] overflow-y-auto rounded-xl border border-border bg-popover p-1.5">{s.length > 0 && <div className="px-2.5 py-1 text-[10px] text-muted-foreground">{a("pp.incoming_images")}</div>}{s.map(f => <button key={f.nodeId} className={`flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[12.5px] transition-colors hover:bg-foreground/10 ${f.url === o.panoramaUrl ? "text-foreground font-medium" : "text-muted-foreground"}`} onClick={() => m(f.url, "upload")}><img src={f.url} alt="" className="h-7 w-7 shrink-0 bg-background/40 object-cover" /><span className="truncate">{f.name || a("common.image")}</span></button>)}{s.length > 0 && <div className="mx-1 my-1.5 h-px bg-border" />}<button className="w-full rounded-md px-2.5 py-1.5 text-left text-[12.5px] text-foreground font-medium transition-colors hover:bg-foreground/10" onClick={() => m("", "none")}>{a("common.none")}</button><button className="w-full rounded-md px-2.5 py-1.5 text-left text-[12.5px] text-foreground transition-colors hover:bg-foreground/10" onClick={async () => {
        const f = await _c();
        f && m(f.url, "upload");
      }}>{a("pp.pick_from_canvas")}</button></div>}</div>;
}
function Ym({
  value: o,
  onChange: e
}) {
  const t = pe(),
    [n, s] = k.useState(!1),
    [r, i] = k.useState(o.toUpperCase()),
    a = k.useRef(null);
  k.useEffect(() => {
    i(o.toUpperCase());
  }, [o]), k.useEffect(() => {
    const u = h => {
      a.current && !a.current.contains(h.target) && s(!1);
    };
    return document.addEventListener("mousedown", u), () => document.removeEventListener("mousedown", u);
  }, []);
  const l = ["#000000", "#1F2937", "#374151", "#6B7280", "#9CA3AF", "#D1D5DB", "#F3F4F6", "#FFFFFF", "#7C3AED", "#3B82F6", "#06B6D4", "#10B981", "#84CC16", "#EAB308", "#F97316", "#EF4444", "#FCE7F3", "#E0E7FF", "#DBEAFE", "#CFFAFE", "#D1FAE5", "#FEF3C7", "#FFEDD5", "#FEE2E2"],
    d = u => {
      let h = u.trim();
      h.startsWith("#") || (h = "#" + h), /^#[0-9a-fA-F]{6}$/.test(h) ? e(h.toLowerCase()) : i(o.toUpperCase());
    };
  return <div className="relative" ref={a}><button type="button" className="flex w-full items-center gap-2 rounded-md border border-border bg-muted px-2 py-1.5 transition-colors hover:border-foreground/50" onClick={() => s(u => !u)}><span className="h-6 w-6 shrink-0 rounded-sm border border-border" style={{
        background: o
      }} /><span className="text-[13px] text-foreground">{o.toUpperCase()}</span></button>{n && <div className="absolute left-0 right-0 top-full z-50 mt-1.5 rounded-xl border border-border bg-popover p-3 shadow-lg"><div className="grid grid-cols-8 gap-1.5">{l.map(u => {
          const h = u.toLowerCase() === o.toLowerCase();
          return <button key={u} type="button" aria-label={u} title={u} className={`relative aspect-square w-full rounded-md border transition-transform hover:scale-110 ${h ? "border-foreground ring-2 ring-foreground/30" : "border-border"}`} style={{
            background: u
          }} onClick={() => {
            e(u.toLowerCase()), s(!1);
          }} />;
        })}</div><div className="mt-3 flex items-center gap-2"><label className="relative flex h-7 w-7 shrink-0 cursor-pointer overflow-hidden rounded-md border border-border" title={t("pp.custom_color")}><input type="color" value={o} onChange={u => e(u.target.value)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" /><span className="block h-full w-full" style={{
            background: "conic-gradient(from 180deg, #ef4444, #eab308, #10b981, #06b6d4, #3b82f6, #7c3aed, #ef4444)"
          }} /></label><input type="text" value={r} onChange={u => i(u.target.value.toUpperCase())} onBlur={u => d(u.target.value)} onKeyDown={u => {
          u.key === "Enter" && (d(u.target.value), s(!1));
        }} maxLength={7} className="h-7 flex-1 rounded-md border border-border bg-muted px-2 text-[12.5px] text-foreground outline-none focus:border-foreground/50" /></div></div>}</div>;
}
function Xm({
  comp: o,
  store: e,
  snapEnabled: t,
  onToggleSnap: n
}) {
  var f;
  const s = o.environment,
    r = (p, x = !0) => e.updateEnv(p, x),
    i = () => e.commitTransientUpdate(),
    a = Math.round((((f = s.sceneScale) == null ? void 0 : f.x) ?? 1) * 100),
    l = pe(),
    u = Vi() === "light" ? "#fafafa" : "#000000",
    m = s.skyColor && s.skyColor.toLowerCase() !== "#060608" ? s.skyColor : u;
  return <div><div className="mb-3 text-[15px] font-medium text-foreground">{l("env.scene_3d")}</div><UiQe label={l("env.scene_scale")} value={a} min={10} max={500} step={5} format={p => `${Math.round(p)}%`} onChange={(p, x) => r({
      sceneScale: {
        x: p / 100,
        y: p / 100,
        z: p / 100
      }
    }, !x)} onCommit={i} /><UiOe label={l("env.scene_move")}><Ie value={s.scenePosition ?? {
        x: 0,
        y: 0,
        z: 0
      }} step={0.05} onChange={(p, x) => r({
        scenePosition: p
      }, !x)} onCommit={i} /></UiOe><UiOe label={l("env.scene_rotate")}><Ie value={s.sceneRotation ?? {
        x: 0,
        y: 0,
        z: 0
      }} step={1} onChange={(p, x) => r({
        sceneRotation: p
      }, !x)} onCommit={i} /></UiOe><div className="my-4 h-px bg-border" /><div className="mb-3 text-[15px] font-medium text-foreground">{l("env.sky_color")}</div><Ym value={m} onChange={p => r({
      skyColor: p
    })} /><div className="my-4 h-px bg-border" /><div id="dx-look-slot" /><div className="my-4 h-px bg-border" /><div className="mb-3 text-[15px] font-medium text-foreground">{l("env.bg_image")}</div><UiQm env={s} onPick={(p, x) => r({
      panoramaUrl: p,
      panoramaSource: x
    })} /><div className="my-4 h-px bg-border" /><div className="mb-3 text-[15px] font-medium text-foreground">{l("env.panorama_bg")}</div><div className="mb-3 flex rounded-lg border border-border bg-muted p-0.5">{["panorama", "flat"].map(p => {
        const x = (s.backgroundMode ?? "panorama") === p;
        return <button key={p} className={`flex-1 py-1 text-[12px] rounded-md transition-colors ${x ? "bg-foreground text-background font-medium" : "text-muted-foreground hover:text-foreground"}`} onClick={() => r({
          backgroundMode: p
        })}>{l(p === "flat" ? "env.bg_mode_flat" : "env.bg_mode_panorama")}</button>;
      })}</div>{(s.backgroundMode ?? "panorama") === "panorama" && <><UiQe label={l("env.h_rotate")} value={s.panoramaRotationY ?? 0} min={0} max={360} step={1} format={p => `${Math.round(p)}°`} onChange={(p, x) => r({
        panoramaRotationY: p
      }, !x)} onCommit={i} /><UiQe label={l("env.sphere_radius")} value={s.panoramaRadius ?? 90} min={10} max={100} step={10} format={p => `${Math.round(p)}`} onChange={(p, x) => r({
        panoramaRadius: p
      }, !x)} onCommit={i} /></>}{(s.backgroundMode ?? "panorama") === "flat" && <><UiOe label={l("env.flat_fit")}><div className="flex rounded-lg border border-border bg-muted p-0.5">{["contain", "cover"].map(p => {
            const x = (s.flatFit ?? "contain") === p;
            return <button key={p} className={`flex-1 py-1 text-[12px] rounded-md transition-colors ${x ? "bg-foreground text-background font-medium" : "text-muted-foreground hover:text-foreground"}`} onClick={() => r({
              flatFit: p
            })}>{l(p === "cover" ? "env.flat_fit_cover" : "env.flat_fit_contain")}</button>;
          })}</div></UiOe><UiQe label={l("env.flat_scale")} value={s.flatScale ?? 1} min={0.05} max={3} step={0.05} format={p => `${Math.round(p * 100)}%`} onChange={(p, x) => r({
        flatScale: p
      }, !x)} onCommit={i} /><UiQe label={l("env.flat_offset_x")} value={s.flatOffsetX ?? 0} min={-1} max={1} step={0.01} format={p => p.toFixed(2)} onChange={(p, x) => r({
        flatOffsetX: p
      }, !x)} onCommit={i} /><UiQe label={l("env.flat_offset_y")} value={s.flatOffsetY ?? 0} min={-1} max={1} step={0.01} format={p => p.toFixed(2)} onChange={(p, x) => r({
        flatOffsetY: p
      }, !x)} onCommit={i} /></>}<div className="my-4 h-px bg-border" /><Gs label={l("env.char_labels")} checked={s.showCharacterLabels ?? !0} onToggle={p => r({
      showCharacterLabels: p
    })} /><Gs label={l("env.grid_snap")} checked={t} onToggle={n} /><div className="mt-3"><button type="button" role="switch" aria-checked={s.showGround ?? !0} className="mb-2 flex w-full items-center justify-between text-left" onClick={() => r({
        showGround: !(s.showGround ?? !0)
      })}><span className="text-[15px] font-medium leading-none text-foreground">{l("env.ground")}</span><Ed checked={s.showGround ?? !0} /></button>{(s.showGround ?? !0) && <div className="space-y-1"><UiQe label={l("env.opacity")} value={s.groundOpacity ?? 0.4} min={0} max={1} step={0.05} format={p => p.toFixed(2)} onChange={(p, x) => r({
          groundOpacity: p
        }, !x)} onCommit={i} /><UiQe label={l("env.height")} value={s.groundHeight ?? 0} min={-2} max={2} step={0.05} format={p => p.toFixed(1)} onChange={(p, x) => r({
          groundHeight: p
        }, !x)} onCommit={i} /></div>}</div></div>;
}
function Wm({
  comp: o,
  store: e,
  engine: t,
  snapEnabled: n,
  onToggleSnap: s,
  camPathCtl: r,
  camPathPicker: i,
  animPicker: a,
  propPicker: l
}) {
  var P;
  const d = e.selectedId,
    u = o.characters.find(C => C.id === d),
    h = o.props.find(C => C.id === d),
    m = (o.models ?? []).find(C => C.id === d),
    f = (o.codeModels ?? []).find(C => C.id === d),
    p = d ? Os(d) : null,
    x = p ? (o.codeModels ?? []).find(C => C.id === p.modelId) : void 0,
    g = o.cameras.find(C => C.id === d),
    b = (P = o.camPaths) == null ? void 0 : P.find(C => C.id === d),
    w = pe(),
    v = new Set(e.selectedIds),
    E = v.size > 1 ? o.characterGroups.find(C => Ge(C).length === v.size && Ge(C).every(M => v.has(M))) : void 0;
  if (i != null && i.open) return <div className="flex w-[300px] shrink-0 flex-col border-l border-border bg-[var(--sidebar)]"><div className="flex items-center justify-between border-b border-border px-4 py-3"><span className="text-[13px] font-medium text-foreground">{w("tl.add_path")}</span><button className="grid h-6 w-6 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground" aria-label="close" onClick={i.onClose}><UiJo size={12} /></button></div><div className="flex-1 overflow-y-auto px-4 pb-4 pt-3"><Qm control={i} paths={o.camPaths ?? []} /></div></div>;
  if (a != null && a.open) return <div className="flex w-[300px] shrink-0 flex-col border-l border-border bg-[var(--sidebar)]"><div className="flex items-center justify-between border-b border-border px-4 py-3"><span className="text-[13px] font-medium text-foreground">{w("tl.add_anim")}</span><button className="grid h-6 w-6 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground" aria-label="close" onClick={a.onClose}><UiJo size={12} /></button></div><div className="flex-1 overflow-y-auto px-4 pb-4 pt-3"><Zm onPick={a.onPick} custom={o.customMotions} onAiGenerate={a.onAiGenerate} aiBusy={a.aiBusy} onRemove={a.onRemoveCustom} /></div></div>;
  if (l != null && l.open) return <div className="flex w-[300px] shrink-0 flex-col border-l border-border bg-[var(--sidebar)]"><div className="flex items-center justify-between border-b border-border px-4 py-3"><span className="text-[13px] font-medium text-foreground">{w("tree.section.characters")} / {w("tree.section.props")}</span><button className="grid h-6 w-6 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground" aria-label="close" onClick={l.onClose}><UiJo size={12} /></button></div><div className="flex-1 overflow-y-auto px-4 pb-4 pt-3"><Jm control={l} /></div></div>;
  const T = E ? `${E.label}(${Ge(E).length})` : u ? w("pp.header_character") : h ? w("pp.header_prop") : m ? w("pp.header_model") : f ? w("pp.header_codemodel") : x && p ? w("pp.header_codepart") : g ? w("pp.header_camera") : b ? w("pp.header_campath") : null;
  return <div className="flex w-[300px] shrink-0 flex-col border-l border-border bg-[var(--sidebar)]">{T && <div className="border-b border-border px-4 py-3 text-[13px] font-medium text-foreground">{T}</div>}<div className="pose-scroll-host flex-1 overflow-y-auto px-4 pb-4 pt-3">{u ? <Bm ch={u} count={e.selectedIds.length} store={e} engine={t} /> : h ? <Um p={h} store={e} /> : m ? <Gm m={m} store={e} /> : f ? <$m m={f} store={e} /> : x && p ? <Km m={x} part={p.part} store={e} engine={t} /> : g ? <Vm c={g} comp={o} engine={t} store={e} /> : b ? <UiNg p={b} comp={o} store={e} ctl={r} /> : <Xm comp={o} store={e} snapEnabled={n} onToggleSnap={s} />}</div></div>;
}
function Qm({
  control: o,
  paths: e
}) {
  const t = pe(),
    n = e.filter(i => !!i.source).reverse(),
    s = i => {
      i.play().catch(() => {});
    },
    r = i => {
      i.pause(), i.currentTime = 0;
    };
  return <div><p className="mb-3 text-[11px] leading-relaxed text-muted-foreground/70">{t("tl.path_picker_hint")}</p><button type="button" className="mb-2 flex h-10 w-full items-center gap-2.5 rounded-md border border-border bg-muted px-3 text-[12px] text-foreground transition-colors hover:bg-foreground/10 disabled:cursor-wait disabled:opacity-60" disabled={o.aiBusy} onClick={o.onAiGenerate}>{o.aiBusy ? <span className="block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent opacity-60" /> : <$i size={17} />}<span>{t("aigen.entry")}</span><span className="ml-auto text-[10px] text-muted-foreground">{t("aipath.entry_hint")}</span></button><button type="button" className="mb-4 flex h-10 w-full items-center gap-2.5 rounded-md border border-border bg-muted px-3 text-[12px] text-foreground transition-colors hover:bg-foreground/10" onClick={o.onManual}><Gi size={17} /><span>{t("tb.campath_draw")}</span></button>{n.length > 0 && <><p className="mb-1.5 text-[11px] font-medium text-muted-foreground">{t("aipath.history")}</p><div className="mb-4 flex max-h-40 flex-col gap-1 overflow-y-auto">{n.map(i => <div key={i.id} className="group flex items-center rounded-md border border-border bg-muted pr-1"><button className="min-w-0 flex-1 px-2.5 py-2 text-left" onClick={() => o.onReuse(i)}><span className="block truncate text-[11.5px] text-foreground">{i.label}</span><span className="text-[10px] text-muted-foreground">{(i.duration / 1e3).toFixed(1)}s</span></button><button className="grid h-6 w-6 shrink-0 place-items-center rounded text-muted-foreground opacity-0 transition-colors hover:bg-red-500 hover:text-white group-hover:opacity-100" title={t("tl.delete_campath")} onClick={() => o.onRemove(i.id)}><Zo size={11} /></button></div>)}</div></>}<div className="mb-1.5 flex items-center justify-between"><p className="text-[11px] font-medium text-muted-foreground">{t("tb.campath_presets")}</p><span className="text-[10px] text-muted-foreground/60">{t("tl.preview_hover")}</span></div><div className="grid grid-cols-2 gap-1.5">{Qi.map(i => {
        const a = t(`campath.${i.id}`);
        return <button key={i.id} type="button" title={a} className="group min-w-0 overflow-hidden rounded-md border border-transparent bg-muted p-1 text-left transition-colors hover:border-border focus-visible:border-foreground" onClick={() => o.onPickPreset(i.id)} onMouseEnter={l => s(l.currentTarget.querySelector("video"))} onMouseLeave={l => r(l.currentTarget.querySelector("video"))} onFocus={l => s(l.currentTarget.querySelector("video"))} onBlur={l => r(l.currentTarget.querySelector("video"))}><span className="relative block aspect-video w-full overflow-hidden rounded-sm bg-background/40"><video src={el(i.id, "mp4")} poster={el(i.id, "jpg")} muted={!0} loop={!0} playsInline={!0} preload="metadata" aria-label={a} className="h-full w-full object-cover" /><span className="pointer-events-none absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/5" /></span><span className="mt-1 block truncate px-0.5 text-[11px] text-muted-foreground group-hover:text-foreground">{a}</span></button>;
      })}</div></div>;
}
function Zm({
  onPick: o,
  custom: e,
  onAiGenerate: t,
  aiBusy: n,
  onRemove: s
}) {
  const r = pe(),
    [i, a] = k.useState(null),
    [l, d] = k.useState(null);
  k.useEffect(() => {
    let f = !0;
    return Em().then(p => {
      f && a(p);
    }).catch(() => {}), () => {
      f = !1;
    };
  }, []);
  const u = (e ?? []).map(f => Vt(f.id, e)).filter(f => !!f),
    [h, m] = k.useState({});
  return k.useEffect(() => {
    if (u.length === 0) return;
    let f = !0;
    return jm(u).then(p => {
      f && m(p);
    }).catch(() => {}), () => {
      f = !1;
    };
  }, [e]), <div><p className="mb-3 text-[11px] leading-relaxed text-muted-foreground/70">{r("tl.anim_picker_hint")}</p>{t && <button type="button" className="mb-3 flex h-10 w-full items-center gap-2.5 rounded-md border border-border bg-muted px-3 text-[12px] text-foreground transition-colors hover:bg-foreground/10 disabled:cursor-wait disabled:opacity-60" disabled={n} onClick={t}>{n ? <span className="block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent opacity-60" /> : <$i size={17} />}<span>{r("aigen.entry")}</span><span className="ml-auto text-[10px] text-muted-foreground">{r("aimotion.entry_hint")}</span></button>}{u.length > 0 && <><p className="mb-1.5 text-[11px] font-medium text-muted-foreground">{r("tl.custom_motions")}</p><div className="mb-3 max-h-56 overflow-y-auto pr-0.5"><div className="grid grid-cols-2 gap-1.5">{u.map(f => {
            const p = l === f.id,
              x = f.label ?? f.id;
            return <button key={f.id} type="button" title={x} className={`group relative flex min-w-0 flex-col items-center gap-0.5 rounded-md border p-1 transition-colors ${p ? "border-foreground bg-foreground/10" : "border-transparent bg-muted hover:border-border"}`} onClick={() => {
              d(f.id), o(f.id);
            }}><span className="relative block aspect-square w-full overflow-hidden bg-background/40">{h[f.id] ? <img src={h[f.id]} alt={x} draggable={!1} className="h-full w-full object-contain" /> : <span className="grid h-full w-full place-items-center text-lg">🎭</span>}{p && <span className="absolute bottom-0.5 right-0.5 flex h-3.5 w-3.5 items-center justify-center bg-foreground text-background"><Pn size={9} /></span>}</span>{s && <span role="button" tabIndex={-1} title={r("tl.delete_motion")} aria-label={r("tl.delete_motion")} className="absolute right-1.5 top-1.5 hidden h-5 w-5 place-items-center rounded bg-background/85 text-muted-foreground shadow-sm transition-colors hover:bg-red-500 hover:text-white group-hover:grid" onClick={g => {
                g.stopPropagation(), s(f.id);
              }}><Zo size={11} /></span>}<span className={`truncate text-[11px] leading-tight ${p ? "text-foreground font-medium" : "text-muted-foreground group-hover:text-foreground"}`}>{x}</span><span className="text-[10px] leading-tight text-muted-foreground/60">{(f.defaultMs / 1e3).toFixed(1)}s{f.loop ? " ↻" : ""}</span></button>;
          })}</div></div><p className="mb-1.5 text-[11px] font-medium text-muted-foreground">{r("tl.preset_motions")}</p></>}<div className="grid grid-cols-2 gap-1.5">{Qo.map(f => {
        const p = l === f.id,
          x = r(`anim.${f.id}`);
        return <button key={f.id} type="button" title={x} className={`group flex min-w-0 flex-col items-center gap-0.5 rounded-md border p-1 transition-colors ${p ? "border-foreground bg-foreground/10" : "border-transparent bg-muted hover:border-border"}`} onClick={() => {
          d(f.id), o(f.id);
        }}><span className="relative block aspect-square w-full overflow-hidden bg-background/40">{i != null && i[f.id] ? <img src={i[f.id]} alt={x} draggable={!1} className="h-full w-full object-contain" /> : <span className="grid h-full w-full place-items-center text-[10px] text-muted-foreground/50">…</span>}{p && <span className="absolute bottom-0.5 right-0.5 flex h-3.5 w-3.5 items-center justify-center bg-foreground text-background"><Pn size={9} /></span>}</span><span className={`truncate text-[11px] leading-tight ${p ? "text-foreground font-medium" : "text-muted-foreground group-hover:text-foreground"}`}>{x}</span><span className="text-[10px] leading-tight text-muted-foreground/60">{(f.defaultMs / 1e3).toFixed(1)}s{f.loop ? " ↻" : ""}</span></button>;
      })}</div>{!i && <p className="mt-3 text-[11px] text-muted-foreground/70">{r("tl.anim_thumbs_baking")}</p>}</div>;
}
const Nl = {
  mannequin: "body.mannequin",
  female: "body.female",
  child: "body.child"
};
function Jm({
  control: o
}) {
  const e = pe(),
    [t, n] = k.useState(null),
    [s, r] = k.useState(null),
    [i, a] = k.useState(null),
    [l, d] = k.useState(!0),
    [u, h] = k.useState("3"),
    [m, f] = k.useState("3"),
    [p, x] = k.useState("1.2"),
    [g, b] = k.useState("mannequin"),
    w = k.useRef(null);
  k.useEffect(() => {
    let M = !0;
    return Im().then(y => {
      M && n(y);
    }).catch(() => {}), Tm().then(y => {
      M && r(y);
    }).catch(() => {}), () => {
      M = !1;
    };
  }, []);
  const v = (M, y, I) => Math.min(I, Math.max(y, M)),
    E = v(parseInt(u, 10) || 0, 0, 10),
    T = v(parseInt(m, 10) || 0, 0, 10),
    P = v(parseFloat(p) || 1.2, 0.4, 5),
    C = E * T;
  return <div><p className="mb-3 text-[11px] leading-relaxed text-muted-foreground/70">{e("pp.prop_picker_hint")}</p><button type="button" className="mb-2 flex h-10 w-full items-center gap-2.5 rounded-md border border-border bg-muted px-3 text-[12px] text-foreground transition-colors hover:bg-foreground/10" onClick={() => {
      var M;
      return (M = w.current) == null ? void 0 : M.click();
    }}><UiXd size={17} /><span>{e("tb.local_upload")}</span><span className="ml-auto text-[10px] text-muted-foreground">GLB / GLTF / PLY / SPZ</span></button><button type="button" className="mb-4 flex h-10 w-full items-center gap-2.5 rounded-md border border-border bg-muted px-3 text-[12px] text-foreground transition-colors hover:bg-foreground/10 disabled:cursor-wait disabled:opacity-60" disabled={o.aiBusy} onClick={o.onAiGenerate}>{o.aiBusy ? <span className="block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent opacity-60" /> : <$i size={17} />}<span>{e("aigen.entry")}</span><span className="ml-auto text-[10px] text-muted-foreground">{e("aigen.entry_hint")}</span></button><input ref={w} type="file" accept=".glb,.gltf,.ply,.spz" className="hidden" onChange={M => {
      var I;
      const y = (I = M.target.files) == null ? void 0 : I[0];
      y && o.onUploadCharacter(y), M.target.value = "";
    }} /><div className="mb-1.5 text-[11px] text-muted-foreground">{e("tree.section.characters")}</div><div className="mb-2 grid grid-cols-3 gap-1.5">{xi.map(M => {
        const y = i === `character:${M}`,
          I = e(Nl[M]);
        return <button key={M} type="button" title={I} className={`group flex min-w-0 flex-col items-center gap-0.5 rounded-md border p-1 transition-colors ${y ? "border-foreground bg-foreground/10" : "border-transparent bg-muted hover:border-border"}`} onClick={() => {
          a(`character:${M}`), o.onPickCharacter(M);
        }}><span className="relative block aspect-square w-full overflow-hidden bg-background/40">{s != null && s[M] ? <img src={s[M]} alt={I} draggable={!1} className="h-full w-full object-contain" /> : <span className="grid h-full w-full place-items-center text-muted-foreground/50"><UiMm size={25} /></span>}{y && <span className="absolute bottom-0.5 right-0.5 flex h-3.5 w-3.5 items-center justify-center bg-foreground text-background"><Pn size={9} /></span>}</span><span className={`w-full truncate text-center text-[11px] leading-tight ${y ? "font-medium text-foreground" : "text-muted-foreground group-hover:text-foreground"}`}>{I}</span></button>;
      })}</div><button type="button" aria-expanded={l} className="mb-1.5 mt-4 flex w-full items-center text-left text-[11px] text-muted-foreground transition-colors hover:text-foreground" onClick={() => d(M => !M)}><span>{e("tb.crowd", {
          rows: E || 3,
          cols: T || 3
        })}</span><span className="ml-auto mr-2">{e("tb.crowd_count", {
          total: C
        })}</span><span className={`transition-transform ${l ? "rotate-90" : ""}`}><UiFn size={12} /></span></button>{l && <div className="mb-4 rounded-md border border-border bg-muted/60 p-3"><div className="mb-2 flex items-center gap-2 text-[11px] text-muted-foreground"><span className="shrink-0">{e("pp.header_character")}</span><div className="ml-auto w-[132px] min-w-0"><Go value={g} options={xi.map(M => ({
            id: M,
            label: e(Nl[M])
          }))} onChange={M => b(M)} compact={!0} /></div></div><div className="mb-2 grid grid-cols-[auto_1fr_auto_1fr] items-center gap-1.5 text-[11px] text-muted-foreground"><span>{e("tb.rows")}</span><input className="min-w-0 rounded-md border border-border bg-background px-2 py-1 text-foreground outline-none focus:border-ring" value={u} onChange={M => h(M.target.value)} /><span>{e("tb.cols")}</span><input className="min-w-0 rounded-md border border-border bg-background px-2 py-1 text-foreground outline-none focus:border-ring" value={m} onChange={M => f(M.target.value)} /></div><div className="mb-3 flex items-center gap-2 text-[11px] text-muted-foreground"><span>{e("tb.gap")}</span><input className="min-w-0 flex-1 rounded-md border border-border bg-background px-2 py-1 text-foreground outline-none focus:border-ring" value={p} onChange={M => x(M.target.value)} /></div><button type="button" disabled={C < 1} className="h-8 w-full bg-foreground text-[12px] font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-40" onClick={() => {
        a("character:crowd"), o.onAddCrowd(E, T, P, g);
      }}>{e("common.add")}</button></div>}{dp.map(M => <div key={M.category} className="mb-4"><div className="mb-1.5 text-[11px] text-muted-foreground">{e(`propgroup.${M.category}`)}</div><div className="grid grid-cols-3 gap-1.5">{M.assets.map(y => {
          const I = i === `prop:${y.id}`,
            j = e(`prop.${y.id}`);
          return <button key={y.id} type="button" title={j} className={`group flex min-w-0 flex-col items-center gap-0.5 rounded-md border p-1 transition-colors ${I ? "border-foreground bg-foreground/10" : "border-transparent bg-muted hover:border-border"}`} onClick={() => {
            a(`prop:${y.id}`), o.onPick(y.id);
          }}><span className="relative block aspect-square w-full overflow-hidden bg-background/40">{t != null && t[y.id] ? <img src={t[y.id]} alt={j} draggable={!1} className="h-full w-full object-contain" /> : <span className="grid h-full w-full place-items-center text-[16px]">{y.icon}</span>}{I && <span className="absolute bottom-0.5 right-0.5 flex h-3.5 w-3.5 items-center justify-center bg-foreground text-background"><Pn size={9} /></span>}</span><span className={`w-full truncate text-center text-[11px] leading-tight ${I ? "text-foreground font-medium" : "text-muted-foreground group-hover:text-foreground"}`}>{j}</span></button>;
        })}</div></div>)}{!t && <p className="mt-3 text-[11px] text-muted-foreground/70">{e("pp.prop_thumbs_baking")}</p>}</div>;
}
const eg = ["linear", "easeIn", "easeOut", "easeInOut", "smoothstep"],
  Rl = 180 / Math.PI,
  To = Math.PI / 180;
function UiTg({
  p: o,
  store: e
}) {
  const t = pe(),
    n = () => {
      const g = {
        x: 0,
        y: 0,
        z: 0
      };
      for (const w of o.points) g.x += w.position.x, g.y += w.position.y, g.z += w.position.z;
      const b = Math.max(1, o.points.length);
      return g.x /= b, g.y /= b, g.z /= b, {
        pathId: o.id,
        points: o.points.map(w => ({
          ...w,
          position: {
            ...w.position
          },
          in: {
            ...w.in
          },
          out: {
            ...w.out
          }
        })),
        center: g,
        lookAt: o.lookAtTarget === Ne && o.lookAt ? {
          ...o.lookAt
        } : void 0,
        emitted: o.points
      };
    },
    [s, r] = k.useState(n),
    [i, a] = k.useState(s.center),
    [l, d] = k.useState({
      x: 0,
      y: 0,
      z: 0
    }),
    [u, h] = k.useState({
      x: 1,
      y: 1,
      z: 1
    }),
    [m, f] = k.useState(1);
  if (s.pathId !== o.id || s.emitted !== o.points) {
    const g = n();
    r(g), a(g.center), d({
      x: 0,
      y: 0,
      z: 0
    }), h({
      x: 1,
      y: 1,
      z: 1
    }), f(1);
  }
  const p = (g, b, w, v, E) => {
      const T = new ve().setFromEuler(new Qe(b.x * To, b.y * To, b.z * To)),
        P = s.center,
        {
          points: C,
          lookAt: M
        } = Lc(s.points, {
          center: P,
          translate: {
            x: g.x - P.x,
            y: g.y - P.y,
            z: g.z - P.z
          },
          quaternion: T,
          scale: {
            x: w.x * v,
            y: w.y * v,
            z: w.z * v
          },
          lookAt: s.lookAt
        });
      r(y => ({
        ...y,
        emitted: C
      })), e.updateCamPath(o.id, M ? {
        points: C,
        lookAt: M
      } : {
        points: C
      }, !E);
    },
    x = () => e.commitTransientUpdate();
  return <><UiOe label={t("pp.position")}><Ie value={i} step={0.05} onChange={(g, b) => {
        a(g), p(g, l, u, m, b);
      }} onCommit={x} /></UiOe><UiOe label={t("pp.rotation")}><Ie value={l} step={1} onChange={(g, b) => {
        d(g), p(i, g, u, m, b);
      }} onCommit={x} /></UiOe><UiOe label={t("pp.scale")}><Ie value={u} step={0.05} onChange={(g, b) => {
        h(g), p(i, l, g, m, b);
      }} onCommit={x} /></UiOe><UiQe label={t("pp.uniform_scale")} value={m} min={0.1} max={10} step={0.05} onChange={(g, b) => {
      f(g), p(i, l, u, g, b);
    }} onCommit={x} /></>;
}
function UiNg({
  p: o,
  comp: e,
  store: t,
  ctl: n
}) {
  var p, x;
  const s = pe(),
    r = (g, b = !0) => t.updateCamPath(o.id, g, b),
    i = () => t.commitTransientUpdate(),
    a = (n == null ? void 0 : n.editingId) === o.id,
    l = [{
      id: "",
      label: s((x = (p = o.recorded) == null ? void 0 : p.rot) != null && x.length ? "pp.campath_look_recorded" : "pp.campath_look_tangent")
    }, {
      id: Ne,
      label: s("pp.campath_look_fixed")
    }, ...e.characters.map(g => ({
      id: g.id,
      label: g.label
    })), ...e.props.map(g => ({
      id: g.id,
      label: g.label
    }))],
    d = o.lookAtTarget && l.some(g => g.id === o.lookAtTarget) ? o.lookAtTarget : o.lookAtTarget === Ne ? Ne : "",
    u = o.fovStart != null && o.fovEnd != null,
    h = o.points.some(g => g.fov != null),
    m = a && n ? n.selectedPointIdx : null,
    f = m != null ? o.points[m] : null;
  return <div><UiOe label={s("pp.name")}><UiVs value={o.label} onChange={g => r({
        label: g
      })} /></UiOe><UiTg key={o.id} p={o} store={t} /><UiOe label={s("pp.campath_look")}><Go value={d} options={l} onChange={g => r(g === Ne ? {
        lookAtTarget: Ne,
        lookAt: o.lookAt ?? {
          x: 0,
          y: 1.2,
          z: 0
        }
      } : {
        lookAtTarget: g
      })} /></UiOe>{d === Ne && <UiOe label={s("pp.look_coord")}><Ie value={o.lookAt ?? {
        x: 0,
        y: 1.2,
        z: 0
      }} step={0.05} onChange={(g, b) => r({
        lookAt: g
      }, !b)} onCommit={i} /></UiOe>}<UiOe label={s("pp.campath_easing")}><Go value={o.easing ?? "linear"} options={eg.map(g => ({
        id: g,
        label: s(`ease.${g}`)
      }))} onChange={g => r({
        easing: g
      })} /></UiOe><Gs label={s("pp.campath_closed")} checked={!!o.closed} onToggle={g => r({
      closed: g
    })} />{h ? <div className="flex w-full items-center justify-between py-2.5 text-[13px]"><span className="text-muted-foreground/60">{s("pp.campath_fov_anim")}</span><span className="text-[11px] text-muted-foreground/60">{s("pp.campath_fov_overridden")}</span></div> : <><Gs label={s("pp.campath_fov_anim")} checked={u} onToggle={g => r(g ? {
        fovStart: o.fovStart ?? 50,
        fovEnd: o.fovEnd ?? 50
      } : {
        fovStart: void 0,
        fovEnd: void 0
      })} />{u && <><UiOe label={`${s("pp.campath_fov_start")} ${Math.round(o.fovStart ?? 50)}°`}><UiQe value={o.fovStart ?? 50} min={10} max={120} step={1} format={g => `${Math.round(g)}°`} onChange={(g, b) => r({
            fovStart: g
          }, !b)} onCommit={i} /></UiOe><UiOe label={`${s("pp.campath_fov_end")} ${Math.round(o.fovEnd ?? 50)}°`}><UiQe value={o.fovEnd ?? 50} min={10} max={120} step={1} format={g => `${Math.round(g)}°`} onChange={(g, b) => r({
            fovEnd: g
          }, !b)} onCommit={i} /></UiOe></>}</>}{a && n && f && m != null && <div className="mt-3 border-t border-border pt-3"><UiSg p={o} idx={m} point={f} ctl={n} /></div>}</div>;
}
function UiSg({
  p: o,
  idx: e,
  point: t,
  ctl: n
}) {
  const s = pe(),
    r = o.points.length,
    i = (h, m) => n.onUpdatePoint(e, h, m),
    a = h => n.onUpdatePoint(e, h, !0),
    l = h => n.onSelectPoint(o, (e + h + r) % r),
    d = t.tangentMode ?? "aligned",
    u = "grid h-6 w-6 place-items-center rounded-md border border-border text-muted-foreground transition-colors hover:border-foreground/50 hover:text-foreground";
  return <div><div className="mb-3 flex items-center justify-between"><span className="text-[12px] font-medium text-foreground">{s("pp.campath_point_section")} {e + 1} / {r}</span><div className="flex items-center gap-1.5"><button className={u} onClick={() => l(-1)} aria-label="prev"><span className="-translate-y-px">‹</span></button><button className={u} onClick={() => l(1)} aria-label="next"><span className="-translate-y-px">›</span></button></div></div><UiOe label={s("pp.campath_point_pos")}><Ie value={t.position} step={0.05} onChange={(h, m) => i({
        position: h
      }, !m)} onCommit={() => a({})} /></UiOe><UiOe label={s("pp.campath_tangent_mode")}><div className="flex rounded-md border border-border bg-muted p-0.5">{["aligned", "free"].map(h => <button key={h} className={`flex-1 rounded px-2 py-1 text-[11px] transition-colors ${d === h ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`} onClick={() => d !== h && a({
          tangentMode: h
        })}>{s(`tan.${h}`)}</button>)}</div></UiOe><UiOe label={s("pp.campath_tangent_in")}><Ie value={t.in} step={0.05} onChange={(h, m) => i({
        in: h
      }, !m)} onCommit={() => a({})} /></UiOe><UiOe label={s("pp.campath_tangent_out")}><Ie value={t.out} step={0.05} onChange={(h, m) => i({
        out: h
      }, !m)} onCommit={() => a({})} /></UiOe><UiOe label={`${s("pp.campath_roll")} ${Math.round((t.tilt ?? 0) * Rl)}°`}><UiQe value={(t.tilt ?? 0) * Rl} min={-180} max={180} step={1} format={h => `${Math.round(h)}°`} onChange={(h, m) => i({
        tilt: h * To
      }, !m)} onCommit={() => a({})} /></UiOe><Gs label={s("pp.campath_point_fov")} checked={t.fov != null} onToggle={h => a({
      fov: h ? 50 : void 0
    })} />{t.fov != null && <UiQe value={t.fov} min={10} max={120} step={1} format={h => `${Math.round(h)}°`} onChange={(h, m) => i({
      fov: h
    }, !m)} onCommit={() => a({})} />}<UiOe label={`${s("pp.campath_speed")} ×${(t.speed ?? 1).toFixed(1)}`}><UiQe value={t.speed ?? 1} min={0.1} max={3} step={0.1} format={h => `×${h.toFixed(1)}`} onChange={(h, m) => i({
        speed: h
      }, !m)} onCommit={() => a({})} /></UiOe></div>;
}
const pn = 44;
function Cd(o, e, t) {
  const n = Math.max(-e * pn, Math.min((t - 1 - e) * pn, o));
  return {
    dy: n,
    dTracks: Math.round(n / pn)
  };
}
const zt = 10,
  og = 8;
function Hr(o, e, t) {
  let n = o,
    s = t;
  for (const i of e) {
    const a = Math.abs(o - i);
    a < s && (n = i, s = a);
  }
  if (n !== o) return n;
  const r = Math.round(o / 1e3) * 1e3;
  return Math.abs(o - r) < t ? r : o;
}
function UiRg({
  clip: o,
  path: e,
  trackId: t,
  trackIndex: n,
  trackCount: s,
  kind: r,
  animLabel: i,
  pxPerMs: a,
  snapTargets: l,
  selected: d,
  disabled: u,
  store: h,
  camPathCtl: m,
  onSelect: f,
  onSeek: p,
  onDragPreview: x
}) {
  const g = k.useRef(null),
    b = og / a,
    w = o.enabled !== !1,
    v = k.useMemo(() => {
      if (!d || !e || e.points.length < 2) return [];
      const j = Pc(e.points, !!e.closed);
      return e.points.map((D, H) => j.pointTime(H));
    }, [d, e == null ? void 0 : e.points, e == null ? void 0 : e.closed]),
    E = (j, D) => {
      if (!u) {
        j.stopPropagation();
        try {
          j.currentTarget.setPointerCapture(j.pointerId);
        } catch {}
        g.current = {
          kind: D,
          x0: j.clientX,
          y0: j.clientY,
          start0: o.start,
          dur0: o.duration,
          lastStart: o.start,
          lastDur: o.duration,
          dTracks: 0
        }, f(o.id);
      }
    },
    T = j => {
      const D = g.current;
      if (!D) return;
      const H = (j.clientX - D.x0) / a;
      if (D.kind === "move") {
        const F = Math.max(0, Math.round(Hr(D.start0 + H, l, b)));
        F !== D.lastStart && (D.lastStart = F, h.updateCamClip(o.id, {
          start: F
        }, !1));
        const {
          dy: U,
          dTracks: ne
        } = Cd(j.clientY - D.y0, n, s);
        D.dTracks = ne, x(U);
      } else if (D.kind === "right") {
        const F = Hr(D.start0 + D.dur0 + H, l, b),
          U = Math.max(Us, Math.round(F - D.start0));
        U !== D.lastDur && (D.lastDur = U, h.updateCamClip(o.id, {
          duration: U
        }, !1));
      } else {
        const F = D.start0 + D.dur0;
        let U = Math.max(0, Math.round(Hr(D.start0 + H, l, b)));
        U = Math.min(U, F - Us), U !== D.lastStart && (D.lastStart = U, D.lastDur = F - U, h.updateCamClip(o.id, {
          start: U,
          duration: F - U
        }, !1));
      }
    },
    P = () => {
      const j = g.current;
      g.current = null, x(null), j && (j.kind === "move" && j.dTracks !== 0 ? h.moveCamTrack(t, n + j.dTracks) : h.commitTransientUpdate());
    },
    C = zt + o.start * a,
    M = Math.max(6, o.duration * a),
    y = (e == null ? void 0 : e.label) ?? i ?? "—",
    I = r === "anim" ? d ? "z-20 border-violet-400 bg-violet-500/30 text-foreground shadow-[0_0_0_1px_rgba(167,139,250,.5)]" : "z-10 border-violet-500/40 bg-violet-500/15 text-foreground/80 hover:bg-violet-500/25" : r === "object" ? d ? "z-20 border-emerald-400 bg-emerald-500/30 text-foreground shadow-[0_0_0_1px_rgba(52,211,153,.5)]" : "z-10 border-emerald-500/40 bg-emerald-500/15 text-foreground/80 hover:bg-emerald-500/25" : d ? "z-20 border-sky-400 bg-sky-500/30 text-foreground shadow-[0_0_0_1px_rgba(56,189,248,.5)]" : "z-10 border-sky-500/40 bg-sky-500/15 text-foreground/80 hover:bg-sky-500/25";
  return <div className={`absolute top-1.5 bottom-1.5 select-none touch-none rounded-md border text-[11px] leading-none transition-shadow ${I} ${w ? "" : "opacity-40"} ${u ? "pointer-events-none" : "cursor-grab active:cursor-grabbing"}`} style={{
    left: C,
    width: M
  }} onPointerDown={j => E(j, "move")} onPointerMove={T} onPointerUp={P} onPointerCancel={P} title={y}><div className="pointer-events-none absolute inset-x-2 top-1.5 flex items-center gap-1 truncate"><span className="truncate">{y}</span><span className="shrink-0 text-[10px] text-foreground/50">{(o.duration / 1e3).toFixed(1)}s</span></div>{d && e && v.map((j, D) => {
      const H = m.editingId === e.id && m.selectedPointIdx === D;
      return <button key={D} className="absolute bottom-0.5 z-10 -translate-x-1/2 p-1" style={{
        left: `${j * 100}%`
      }} onPointerDown={F => F.stopPropagation()} onClick={F => {
        F.stopPropagation(), m.onSelectPoint(e, D), p(o.start + j * o.duration);
      }}><span className={`block h-2 w-2 rotate-45 border ${H ? "border-orange-400 bg-orange-400" : "border-foreground/60 bg-background/70 hover:bg-foreground/60"}`} /></button>;
    })}<div className="absolute inset-y-0 left-0 w-2 cursor-ew-resize hover:bg-foreground/20" onPointerDown={j => E(j, "left")} onPointerMove={T} onPointerUp={P} onPointerCancel={P} /><div className="absolute inset-y-0 right-0 w-2 cursor-ew-resize hover:bg-foreground/20" onPointerDown={j => E(j, "right")} onPointerMove={T} onPointerUp={P} onPointerCancel={P} /></div>;
}
const cn = 188,
  os = "flex w-full items-center gap-1.5 px-2.5 py-1.5 text-left text-[12.5px] text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground",
  rs = o => <span className={`w-3 shrink-0 text-[11px] ${o ? "text-emerald-400" : "text-transparent"}`}>✓</span>;
function UiIg({
  track: o,
  index: e,
  count: t,
  store: n,
  disabled: s,
  selected: r,
  onSelect: i,
  onDragPreview: a
}) {
  const l = pe(),
    [d, u] = k.useState(null),
    [h, m] = k.useState(null),
    f = k.useRef(null),
    p = !!o.muted,
    x = Ht(o),
    g = x === "object",
    b = x === "anim",
    w = (o.orient ?? "follow") === "follow",
    v = n.present.characters,
    E = n.present.props,
    T = g || b ? v.find(j => j.id === o.targetId) ?? (b ? void 0 : E.find(j => j.id === o.targetId)) : void 0,
    P = !!T && v.some(j => j.id === T.id),
    C = (g || b) && !T,
    M = k.useRef(null),
    y = "grid h-5 w-5 place-items-center rounded text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground disabled:opacity-30 disabled:pointer-events-none";
  Zi(f, () => m(null), {
    enabled: !!h
  }), k.useLayoutEffect(() => {
    const j = f.current;
    if (!h || !j) return;
    const D = 8,
      H = j.getBoundingClientRect(),
      F = Math.max(D, Math.min(h.left, window.innerWidth - D - H.width)),
      U = Math.max(D, Math.min(h.top, window.innerHeight - D - H.height));
    j.style.left = `${F}px`, j.style.top = `${U}px`;
  }, [h, v.length, E.length, g, C]);
  const I = () => {
    const j = M.current;
    M.current = null, a(null), j && j.dTracks !== 0 && n.moveCamTrack(o.id, e + j.dTracks);
  };
  return <div className={`sticky left-0 z-30 flex shrink-0 touch-none items-center gap-1 border-b border-r border-border px-2 ${r ? "bg-muted" : "bg-[var(--sidebar)]"} ${p ? "opacity-60" : ""} ${s ? "" : "cursor-grab active:cursor-grabbing"}`} style={{
    width: cn,
    height: pn
  }} onPointerDown={j => {
    if (!(s || j.target.closest("button, input"))) {
      i();
      try {
        j.currentTarget.setPointerCapture(j.pointerId);
      } catch {}
      M.current = {
        y0: j.clientY,
        dTracks: 0
      };
    }
  }} onPointerMove={j => {
    const D = M.current;
    if (!D) return;
    const {
      dy: H,
      dTracks: F
    } = Cd(j.clientY - D.y0, e, t);
    D.dTracks = F, a(H);
  }} onPointerUp={I} onPointerCancel={I}>{d != null ? <input autoFocus={!0} className="min-w-0 flex-1 rounded border border-border bg-muted px-1 py-0.5 text-[11px] text-foreground outline-none focus:border-ring" value={d} onChange={j => u(j.target.value)} onBlur={() => {
      d.trim() && n.updateCamTrack(o.id, {
        label: d.trim()
      }), u(null);
    }} onKeyDown={j => {
      j.key === "Enter" ? j.target.blur() : j.key === "Escape" && u(null);
    }} /> : <span className={`min-w-0 flex-1 truncate text-[11px] ${b ? "text-violet-300/90" : g ? "text-emerald-300/90" : "text-foreground"}`} onDoubleClick={() => !s && u(o.label)} title={g || b ? (T == null ? void 0 : T.label) ?? o.label : o.label}>{g || b ? (T == null ? void 0 : T.label) ?? o.label : o.label}</span>}<button className={y} disabled={s} title={l(p ? "tl.track_unmute" : "tl.track_mute")} onClick={() => n.updateCamTrack(o.id, {
      muted: !p
    })}>{p ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" opacity=".35" /><path d="M4 4l16 16" /></svg> : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" /><circle cx="12" cy="12" r="2.6" /></svg>}</button><div className="relative"><button className={`${y} ${C ? "text-amber-400" : b ? "text-violet-400" : g ? "text-emerald-400" : ""}`} disabled={s} title={C ? l("tl.target_missing") : g || b ? `${l("tl.bind_target")}: ${T == null ? void 0 : T.label}` : l("tl.bind_target")} onClick={j => {
        if (h) {
          m(null);
          return;
        }
        const D = j.currentTarget.getBoundingClientRect();
        m({
          left: D.right + 6,
          top: D.top
        });
      }}>{C ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3 2.5 20h19L12 3Z" /><path d="M12 10v4M12 17.2v.3" /></svg> : b ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="14" cy="4.5" r="2.2" /><path d="M6 20.5 9.5 14l3-3.5 2 3 4 1" /><path d="M9.5 14l4 2.5 1 5" /><path d="M12.5 10.5 9 9.5 6.5 12" /></svg> : g ? P ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="5.5" r="3" /><path d="M5 21v-2a7 7 0 0 1 14 0v2" /></svg> : <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 8l-9-4.5L3 8v8l9 4.5L21 16Z" /><path d="M3 8l9 4.5L21 8M12 12.5V21" /></svg> : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15.5 9.5 21 7v10l-5.5-2.5" /><rect x="3" y="6.5" width="12.5" height="11" rx="2" /></svg>}</button>{h && bh.createPortal(<div ref={f} className="fixed z-50 max-h-[280px] w-[188px] overflow-y-auto rounded-xl border border-border bg-popover p-1.5" style={{
        left: h.left,
        top: h.top
      }}><div className="px-2 py-1 text-[10px] text-muted-foreground">{l("tl.pick_object")}</div>{C && <div className="px-2.5 py-1 text-[11px] text-amber-400">{l("tl.target_missing")}</div>}{!b && <button className={os} onClick={() => {
          m(null), n.updateCamTrack(o.id, {
            targetId: void 0
          });
        }}>{rs(!g)}<span className="truncate">{l("tl.bind_camera")}</span></button>}{(b ? v.length === 0 : v.length === 0 && E.length === 0) && <div className="px-2.5 py-1.5 text-[12px] text-muted-foreground">{l(b ? "tl.no_chars" : "tl.no_objects")}</div>}{v.map(j => <button key={j.id} className={os} onClick={() => {
          m(null), n.updateCamTrack(o.id, {
            targetId: j.id
          });
        }}>{rs(o.targetId === j.id)}<span className="truncate">{j.label}</span></button>)}{!b && E.map(j => <button key={j.id} className={os} onClick={() => {
          m(null), n.updateCamTrack(o.id, {
            targetId: j.id
          });
        }}>{rs(o.targetId === j.id)}<span className="truncate">{j.label}</span></button>)}{g && <><div className="mx-2 my-1 h-px bg-border" /><button className={os} onClick={() => n.updateCamTrack(o.id, {
            orient: "follow"
          })}>{rs(w)}<span className="truncate">{l("tl.orient_follow")}</span></button><button className={os} onClick={() => n.updateCamTrack(o.id, {
            orient: "keep"
          })}>{rs(!w)}<span className="truncate">{l("tl.orient_keep")}</span></button></>}</div>, document.body)}</div><button className={y} disabled={s || e === 0} title={l("tl.track_up")} onClick={() => n.moveCamTrack(o.id, e - 1)}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 15l6-6 6 6" /></svg></button><button className={y} disabled={s || e === t - 1} title={l("tl.track_down")} onClick={() => n.moveCamTrack(o.id, e + 1)}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg></button><button className={y} disabled={s} title={l("tl.track_delete")} onClick={() => n.removeCamTrack(o.id)}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg></button></div>;
}
function UiAg({
  track: o,
  index: e,
  trackCount: t,
  paths: n,
  pxPerMs: s,
  contentW: r,
  snapTargets: i,
  selectedClipId: a,
  disabled: l,
  store: d,
  camPathCtl: u,
  onSelectClip: h,
  onSeek: m,
  onDragPreview: f
}) {
  const p = pe(),
    x = Ht(o);
  return <div className={`relative border-b border-border/60 ${o.muted ? "opacity-50" : ""}`} style={{
    height: pn,
    width: r
  }} onPointerDown={g => {
    if (l || g.target !== g.currentTarget) return;
    h(null);
    const b = g.currentTarget.getBoundingClientRect();
    m(Math.max(0, (g.clientX - b.left - zt) / s));
  }}>{o.clips.map(g => {
      const b = x === "anim" ? Vt(g.pathId, d.present.customMotions) : void 0;
      return <UiRg key={g.id} clip={g} path={n.get(g.pathId)} trackId={o.id} trackIndex={e} trackCount={t} kind={x} animLabel={b ? b.label ?? p(`anim.${b.id}`) : void 0} pxPerMs={s} snapTargets={i.filter(w => w !== g.start && w !== g.start + g.duration)} selected={a === g.id} disabled={l} store={d} camPathCtl={u} onSelect={h} onSeek={m} onDragPreview={f} />;
    })}</div>;
}
const Dl = 236,
  Ll = 24,
  Fr = 12,
  Br = 240,
  Ur = 60,
  zl = o => `${(o / 1e3).toFixed(1)}s`;
function UiLg({
  open: o,
  engine: e,
  store: t,
  ctl: n,
  camPathCtl: s,
  canvasSelectionRevision: r
}) {
  var st;
  const i = pe(),
    a = t.present.camTimeline ?? {
      tracks: []
    },
    l = a.tracks,
    d = Gt(a),
    [u, h] = k.useState(Ur),
    m = u / 1e3,
    [f, p] = k.useState(null),
    [x, g] = k.useState(null),
    [b, w] = k.useState(null);
  k.useEffect(() => {
    p(null), g(null);
  }, [r]);
  const v = k.useRef(null),
    E = k.useRef(null),
    T = k.useRef(null),
    P = k.useRef(0),
    C = !!((st = n.session) != null && st.playing),
    M = n.exporting,
    y = Math.max(d + 4e3, 2e4),
    I = zt + Math.ceil(y * m),
    j = k.useMemo(() => {
      const G = new Map();
      for (const W of t.present.camPaths ?? []) G.set(W.id, W);
      return G;
    }, [t.present.camPaths]),
    D = k.useMemo(() => {
      if (!f) return null;
      for (const G of l) for (const W of G.clips) if (W.id === f) return {
        clip: W,
        trackId: G.id
      };
      return null;
    }, [f, l]);
  k.useEffect(() => {
    f && !D && p(null);
  }, [f, D]), k.useEffect(() => {
    x && !l.some(G => G.id === x) && g(null);
  }, [x, l]), k.useEffect(() => {
    !D || !j.has(D.clip.pathId) || t.selectedId && t.selectedId !== D.clip.pathId && p(null);
  }, [t.selectedId, D, j]);
  const H = k.useRef(null),
    F = k.useRef(u);
  F.current = u;
  const U = k.useRef(null),
    ne = l.length > 0;
  k.useEffect(() => {
    const G = H.current;
    if (!G) return;
    const W = ee => {
      if (!ee.ctrlKey && !ee.metaKey) return;
      ee.preventDefault();
      const de = F.current,
        se = Math.max(Fr, Math.min(Br, de * Math.exp(-ee.deltaY * 0.01)));
      if (se === de) return;
      const ht = ee.clientX - G.getBoundingClientRect().left;
      U.current = {
        tMs: (ht + G.scrollLeft - cn - zt) * 1e3 / de,
        x: ht
      }, h(se);
    };
    return G.addEventListener("wheel", W, {
      passive: !1
    }), () => G.removeEventListener("wheel", W);
  }, [ne, M]), k.useLayoutEffect(() => {
    const G = U.current;
    if (!G) return;
    U.current = null;
    const W = H.current;
    W && (W.scrollLeft = cn + zt + G.tMs * m - G.x);
  }, [m]);
  const ae = s.editingId != null && s.selectedPointIdx != null,
    He = x ?? (D == null ? void 0 : D.trackId) ?? null,
    ce = He ? l.find(G => G.id === He) ?? null : null,
    Re = !!ce && Ht(ce) === "object" && !!ce.targetId;
  k.useEffect(() => {
    if (!o || M || ae || !D && !x) return;
    const G = W => {
      var de;
      if (W.key !== "Delete" && W.key !== "Backspace" || W.defaultPrevented) return;
      const ee = (de = W.target) == null ? void 0 : de.tagName;
      ee === "INPUT" || ee === "TEXTAREA" || (D ? (t.removeCamClip(D.clip.id), p(null)) : x && (t.removeCamTrack(x), g(null)), W.preventDefault(), W.stopPropagation());
    };
    return window.addEventListener("keydown", G, {
      capture: !0
    }), () => window.removeEventListener("keydown", G, {
      capture: !0
    });
  }, [o, M, ae, D, x, t]);
  const ot = k.useRef(null);
  k.useEffect(() => {
    if (!o || M) return;
    const G = W => {
      var se, ht;
      if (!(W.metaKey || W.ctrlKey) || W.altKey || W.shiftKey) return;
      const ee = W.key.toLowerCase();
      if (ee !== "c" && ee !== "v") return;
      const de = (se = W.target) == null ? void 0 : se.tagName;
      if (!(de === "INPUT" || de === "TEXTAREA")) if (ee === "c") {
        if (!D) return;
        const et = window.getSelection();
        if (et && !et.isCollapsed) return;
        const xt = j.get(D.clip.pathId);
        if (!xt) return;
        const at = l.find(Ye => Ye.id === D.trackId);
        ot.current = {
          path: JSON.parse(JSON.stringify(xt)),
          clip: {
            start: D.clip.start,
            duration: D.clip.duration,
            enabled: D.clip.enabled !== !1
          },
          track: {
            targetId: at == null ? void 0 : at.targetId,
            orient: at == null ? void 0 : at.orient
          }
        }, W.preventDefault();
      } else {
        const et = ot.current;
        if (!et) return;
        const xt = {
          ...JSON.parse(JSON.stringify(et.path)),
          id: $e(),
          label: `${i("common.campath_default")}${(((ht = t.present.camPaths) == null ? void 0 : ht.length) ?? 0) + 1}`
        };
        t.addCamPathClip(xt, null, {
          ...et.clip
        }, {
          ...et.track
        }), W.preventDefault();
      }
    };
    return window.addEventListener("keydown", G), () => window.removeEventListener("keydown", G);
  }, [o, M, D, j, l, t, i]);
  const Ke = k.useMemo(() => {
      const G = new Set([0]);
      for (const W of l) for (const ee of W.clips) G.add(ee.start), G.add(ee.start + ee.duration);
      return [...G];
    }, [l]),
    rt = G => {
      const W = `${cn + zt + G * m}px`;
      v.current && (v.current.style.left = W), E.current && (E.current.style.left = W), T.current && (T.current.textContent = zl(G));
    };
  k.useEffect(() => {
    if (!(!e || !o)) return !n.session && !n.exporting && (P.current = Math.min(P.current, d)), rt(P.current), e.onRender(() => {
      const G = n.getProgress();
      G && (P.current = G.tMs, rt(G.tMs));
    });
  }, [e, o, m, !!n.session, n.exporting, d]);
  const De = G => {
      const W = Math.max(0, Math.min(G, d));
      P.current = W, n.onSeek(W), rt(W);
    },
    dt = G => {
      const W = G.currentTarget.parentElement;
      if (!W) return;
      const ee = W.getBoundingClientRect();
      De((G.clientX - ee.left - cn - zt) / m);
    },
    it = G => {
      if (p(G), g(null), G) {
        let W = null;
        for (const ee of l) {
          const de = ee.clips.find(se => se.id === G);
          if (de) {
            j.has(de.pathId) && (W = de.pathId);
            break;
          }
        }
        (t.selectedId !== W || t.selectedIds.length !== (W ? 1 : 0)) && t.select(W);
      }
    },
    Ue = k.useRef(null);
  k.useEffect(() => {
    const G = new Set();
    for (const de of l) for (const se of de.clips) G.add(se.id);
    const W = Ue.current;
    if (Ue.current = G, !W) return;
    const ee = [];
    for (const de of G) W.has(de) || ee.push(de);
    ee.length === 1 && it(ee[0]);
  }, [l]);
  const gt = "grid h-7 w-7 shrink-0 place-items-center rounded-md border border-border text-muted-foreground transition-colors hover:border-foreground/50 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30",
    Je = "flex h-7 shrink-0 items-center gap-1 whitespace-nowrap rounded-md border border-border px-2 text-[11px] text-muted-foreground transition-colors hover:border-foreground/50 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30",
    ut = "flex h-7 shrink-0 items-center gap-1 whitespace-nowrap rounded-md border border-foreground bg-foreground px-2 text-[11px] text-background transition-colors disabled:cursor-not-allowed disabled:opacity-30";
  return <div className="shrink-0 overflow-hidden border-t border-border bg-[var(--sidebar)] transition-[height] duration-200 ease-out" style={{
    height: o ? Dl : 0,
    borderTopWidth: o ? 1 : 0
  }}><div className="flex h-full flex-col" style={{
      height: Dl
    }}><div className="relative flex h-10 shrink-0 items-center gap-2 border-b border-border px-3"><button className={gt} disabled={M || u <= Fr} title={i("tl.zoom_out")} onClick={() => h(G => Math.max(Fr, G / 1.5))}><span className="text-[13px] leading-none">−</span></button><button className="flex h-7 w-12 shrink-0 items-center justify-center rounded-md border border-border text-[11px] tabular-nums text-muted-foreground transition-colors hover:border-foreground/50 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30" disabled={M} title={i("tl.zoom_reset")} onClick={() => h(Ur)}>{Math.round(u / Ur * 100)}%</button><button className={gt} disabled={M || u >= Br} title={i("tl.zoom_in")} onClick={() => h(G => Math.min(Br, G * 1.5))}><span className="text-[13px] leading-none">＋</span></button><button className={gt} disabled={M || d <= 0} title={i(C ? "tl.pause" : "tl.play")} onClick={() => n.onPlayPause()}>{C ? <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true"><rect x="2" y="1.5" width="3" height="9" rx="0.5" /><rect x="7" y="1.5" width="3" height="9" rx="0.5" /></svg> : <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true"><path d="M3 1.8v8.4c0 .5.55.8.98.53l6.3-4.2a.62.62 0 0 0 0-1.06l-6.3-4.2A.62.62 0 0 0 3 1.8Z" /></svg>}</button><span className="shrink-0 whitespace-nowrap text-[12px] tabular-nums text-foreground"><span ref={T}>0.0s</span><span className="text-muted-foreground"> / {zl(d)}</span></span>{ce && <UiCg track={ce} store={t} disabled={M} />}<div className="flex-1" />{!Re && !n.exporting && <button className={n.pathPickerOpen ? ut : Je} disabled={M} onClick={() => n.onTogglePathPicker()}><span className="text-[13px] leading-none">＋</span>{i("tl.add_path")}</button>}{!Re && !n.exporting && <button className={n.animPickerOpen ? ut : Je} disabled={M} onClick={() => n.onToggleAnimPicker()}><span className="text-[13px] leading-none">＋</span>{i("tl.add_anim")}</button>}{!Re && !n.exporting && <button className={Je} disabled={M} title={i("tl.vcam")} onClick={() => n.onOpenVCam()}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="7" y="2.5" width="10" height="19" rx="2.2" /><path d="M11 18.5h2" /><path d="M2.5 9.5v5M4.5 12h-2" opacity=".7" /><path d="M21.5 9.5v5M19.5 12h2" opacity=".7" /></svg>{i("tl.vcam")}</button>}{!Re && !n.exporting && <div className="mx-1 h-4 w-px bg-border" />}{!Re && (n.exporting ? <button className={`${Je} border-orange-400/60 text-orange-400 hover:border-orange-400 hover:text-orange-300`} onClick={() => n.onCancelExport()}><span className="block h-2.5 w-2.5 animate-pulse rounded-full bg-orange-400" />{i("tl.export_cancel")}</button> : <button className={Je} disabled={d <= 0 || !n.exportSupported} title={n.exportSupported ? d <= 0 ? i("tl.no_clips") : i("tl.export") : i("tl.export_unsupported")} onClick={() => n.onExport()}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>{i("tl.export")}</button>)}</div>{n.exporting && <div className="flex h-6 shrink-0 items-center justify-center border-b border-border bg-orange-500/10 text-[11px] text-orange-400">{i("tl.export_hint")}</div>}{l.length === 0 ? <div className="flex flex-1 items-center justify-center text-[12px] text-muted-foreground">{i("tl.empty_hint")}</div> : <div ref={H} className={`relative min-h-0 flex-1 overflow-auto ${M ? "pointer-events-none opacity-70" : ""}`}><div className="relative" style={{
          width: cn + I
        }}><div className="sticky top-0 z-40 flex" style={{
            height: Ll
          }}><div className="sticky left-0 z-50 shrink-0 border-b border-r border-border bg-[var(--sidebar)]" style={{
              width: cn
            }} /><UiDg pxPerMs={m} contentMs={y} onScrub={De} /><div ref={E} className="absolute inset-y-0 z-10 flex w-4 -translate-x-1/2 cursor-ew-resize touch-none items-end justify-center text-foreground" style={{
              left: cn + zt
            }} onPointerDown={G => {
              G.currentTarget.setPointerCapture(G.pointerId), dt(G);
            }} onPointerMove={G => {
              G.currentTarget.hasPointerCapture(G.pointerId) && dt(G);
            }}><svg width="11" height="13" viewBox="0 0 11 13" fill="currentColor" aria-hidden="true"><path d="M0.5 0.5h10v6.2L5.5 12.5 0.5 6.7Z" /></svg></div></div>{l.map((G, W) => {
            let ee = 0,
              de = !1;
            if (b) {
              const se = Math.round(b.dy / pn);
              W === b.index ? (ee = b.dy, de = !0) : se > 0 && W > b.index && W <= b.index + se ? ee = -pn : se < 0 && W < b.index && W >= b.index + se && (ee = pn);
            }
            return <div key={G.id} className={`flex ${de ? "relative z-[35]" : b ? "transition-transform duration-150" : ""}`} style={{
              transform: ee ? `translateY(${ee}px)` : void 0
            }}><UiIg track={G} index={W} count={l.length} store={t} disabled={M} selected={x === G.id} onSelect={() => {
                t.select(null), g(G.id), p(null);
              }} onDragPreview={se => w(se == null ? null : {
                index: W,
                dy: se
              })} /><UiAg track={G} index={W} trackCount={l.length} paths={j} pxPerMs={m} contentW={I} snapTargets={Ke} selectedClipId={f} disabled={M} store={t} camPathCtl={s} onSelectClip={it} onSeek={De} onDragPreview={se => w(se == null ? null : {
                index: W,
                dy: se
              })} /></div>;
          })}<div ref={v} className="pointer-events-none absolute top-0 z-[25] -translate-x-1/2" style={{
            left: cn + zt,
            height: Ll + l.length * pn
          }}><div className="mx-auto h-full w-[2px] bg-foreground" /></div></div></div>}<UiUg selected={D} pathMap={j} store={t} disabled={M} /></div></div>;
}
function Ol({
  label: o,
  valueLabel: e,
  warn: t,
  hint: n,
  options: s,
  value: r,
  disabled: i,
  title: a,
  onPick: l
}) {
  const [d, u] = k.useState(null),
    h = k.useRef(null);
  return Zi(h, () => u(null), {
    enabled: !!d
  }), <div ref={h} className={`flex h-7 shrink-0 items-center gap-1.5 text-[11px] ${t ? "text-amber-400" : "text-muted-foreground"}`}><span className="shrink-0">{o}</span><button className="flex h-7 w-[140px] shrink-0 items-center gap-1.5 rounded-md border border-border px-2 transition-colors hover:border-foreground/50 disabled:cursor-not-allowed disabled:opacity-30" disabled={i} title={a} onClick={m => {
      if (d) {
        u(null);
        return;
      }
      const f = m.currentTarget.getBoundingClientRect();
      u({
        right: window.innerWidth - f.right,
        bottom: window.innerHeight - f.top + 6,
        maxH: Math.min(320, f.top - 18)
      });
    }}><span className={`min-w-0 flex-1 truncate text-left ${t ? "text-amber-400" : "text-foreground"}`}>{e}</span><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0"><path d="M6 9l6 6 6-6" /></svg></button>{d && <div className="fixed z-50 w-[188px] overflow-y-auto rounded-xl border border-border bg-popover p-1.5" style={{
      right: d.right,
      bottom: d.bottom,
      maxHeight: d.maxH
    }}><div className="px-2 py-1 text-[10px] text-muted-foreground">{o}</div>{n && <div className={`px-2.5 py-1 text-[11px] ${n.warn ? "text-amber-400" : "text-muted-foreground"}`}>{n.text}</div>}{s.map(m => <button key={m.id} className={os} onClick={() => {
        u(null), l(m.id);
      }}>{rs(r === m.id)}<span className="truncate">{m.label}</span></button>)}</div>}</div>;
}
function UiCg({
  track: o,
  store: e,
  disabled: t
}) {
  const n = pe(),
    s = e.present.characters,
    r = e.present.props,
    i = o.targetId,
    a = Ht(o),
    l = a === "object",
    d = a === "anim",
    u = i ? s.find(f => f.id === i) ?? (d ? void 0 : r.find(f => f.id === i)) : void 0,
    h = !!i && !u,
    m = o.orient ?? "follow";
  return <><Ol label={n("tl.pick_object")} valueLabel={h ? n("tl.target_missing") : (u == null ? void 0 : u.label) ?? (d ? "—" : n("tl.bind_camera"))} warn={h} title={n(h ? "tl.target_missing" : "tl.bind_target")} hint={h ? {
      text: n("tl.target_missing"),
      warn: !0
    } : (d ? s.length === 0 : s.length === 0 && r.length === 0) ? {
      text: n(d ? "tl.no_chars" : "tl.no_objects")
    } : void 0} options={d ? s.map(f => ({
      id: f.id,
      label: f.label
    })) : [{
      id: "",
      label: n("tl.bind_camera")
    }, ...s.map(f => ({
      id: f.id,
      label: f.label
    })), ...r.map(f => ({
      id: f.id,
      label: f.label
    }))]} value={h ? i : i ?? ""} disabled={t} onPick={f => {
      d && !f || e.updateCamTrack(o.id, {
        targetId: f || void 0
      });
    }} />{l && <Ol label={n("tl.orient_label")} valueLabel={n(m === "follow" ? "tl.orient_follow" : "tl.orient_keep")} options={[{
      id: "follow",
      label: n("tl.orient_follow")
    }, {
      id: "keep",
      label: n("tl.orient_keep")
    }]} value={m} disabled={t} onPick={f => e.updateCamTrack(o.id, {
      orient: f
    })} />}</>;
}
function UiDg({
  pxPerMs: o,
  contentMs: e,
  onScrub: t
}) {
  const n = o * 1e3,
    s = n >= 48 ? 1 : n >= 24 ? 2 : n >= 10 ? 5 : 10,
    r = [];
  for (let a = 0; a * 1e3 <= e; a += s) r.push(a);
  const i = a => {
    const l = a.currentTarget.getBoundingClientRect();
    return Math.max(0, (a.clientX - l.left - zt) / o);
  };
  return <div className="relative shrink-0 cursor-pointer touch-none select-none border-b border-border bg-[var(--sidebar)]" style={{
    width: zt + e * o,
    height: "100%"
  }} onPointerDown={a => {
    a.currentTarget.setPointerCapture(a.pointerId), t(i(a));
  }} onPointerMove={a => {
    a.currentTarget.hasPointerCapture(a.pointerId) && t(i(a));
  }}>{r.map(a => <div key={a} className="absolute bottom-0 top-0" style={{
      left: zt + a * n
    }}><div className="absolute bottom-0 h-2 w-px bg-foreground/30" /><span className="absolute bottom-2 left-1 text-[9px] tabular-nums text-muted-foreground">{a}s</span></div>)}</div>;
}
function UiUg({
  selected: o,
  pathMap: e,
  store: t,
  disabled: n
}) {
  const s = pe();
  if (!o) return null;
  const {
      clip: r
    } = o,
    i = e.get(r.pathId),
    a = i ? void 0 : Vt(r.pathId, t.present.customMotions),
    l = r.enabled !== !1;
  return <div className={`flex h-9 shrink-0 items-center gap-3 border-t border-border px-3 text-[11px] text-muted-foreground ${n ? "pointer-events-none opacity-60" : ""}`}>{a ? <span className="flex items-center gap-1.5">{s("tl.anim_clip")}<span className="max-w-[140px] truncate rounded border border-border bg-muted px-1.5 py-0.5 text-foreground">{a.label ?? s(`anim.${a.id}`)}</span></span> : <span className="flex items-center gap-1.5">{s("tl.clip_path")}<button className="max-w-[140px] truncate rounded border border-border bg-muted px-1.5 py-0.5 text-foreground transition-colors hover:border-foreground/50" onClick={() => i && t.select(i.id)} title={i == null ? void 0 : i.label}>{(i == null ? void 0 : i.label) ?? "—"}</button></span>}<Hl label={s("tl.clip_start")} valueMs={r.start} min={0} onCommit={d => t.updateCamClip(r.id, {
      start: d
    })} /><Hl label={s("tl.duration")} valueMs={r.duration} min={0.2} onCommit={d => t.updateCamClip(r.id, {
      duration: d
    })} /><label className="flex cursor-pointer items-center gap-1.5"><input type="checkbox" checked={l} className="accent-current" onChange={d => t.updateCamClip(r.id, {
        enabled: d.target.checked
      })} />{s("tl.clip_enabled")}</label></div>;
}
function Hl({
  label: o,
  valueMs: e,
  min: t,
  onCommit: n
}) {
  const [s, r] = k.useState(null),
    i = (e / 1e3).toFixed(1),
    a = l => {
      const d = parseFloat(l);
      Number.isNaN(d) || n(Math.round(Math.max(t, Math.min(600, d)) * 1e3)), r(null);
    };
  return <label className="flex items-center gap-1">{o}<input type="text" inputMode="decimal" className="w-[52px] rounded border border-border bg-muted px-1.5 py-0.5 text-center tabular-nums text-foreground outline-none transition-colors focus:border-ring" value={s ?? i} onFocus={() => r(i)} onChange={l => r(l.target.value)} onBlur={l => a(l.target.value)} onKeyDown={l => {
      l.key === "Enter" ? l.target.blur() : l.key === "Escape" && r(null);
    }} />s</label>;
}
const qs = "w-10 h-10 grid place-items-center rounded-md transition-colors disabled:opacity-30",
  Ys = o => o ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground hover:bg-foreground/10";
function Gr({
  Icon: UiO,
  tip: e,
  active: t,
  disabled: n,
  onClick: s,
  refEl: r
}) {
  return <div className="group relative"><button ref={r} disabled={n} className={`${qs} ${Ys(!!t)}`} onClick={s}><UiO size={20} /></button><div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-popover text-popover-foreground px-2 py-1 text-[11px] opacity-0 transition-opacity group-hover:opacity-100">{e}</div></div>;
}
function UiKi({
  Icon: UiO,
  glyph: e,
  label: t,
  shortcut: n,
  chevron: s,
  active: r,
  onClick: i
}) {
  return <button className={`flex w-full items-center gap-2.5 px-3 py-1.5 text-[13px] transition-colors ${r ? "bg-foreground/10 text-foreground font-medium" : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"}`} onClick={i}>{UiO && <span className={`grid w-[18px] shrink-0 place-items-center ${r ? "text-foreground" : "text-muted-foreground"}`}><UiO size={16} /></span>}{!UiO && e && <span className="w-[18px] shrink-0 text-center text-[13px] text-muted-foreground">{e}</span>}<span className="flex-1 truncate text-left">{t}</span>{n && <span className="pl-3 text-[11.5px] text-muted-foreground">{n}</span>}{s && <span className="shrink-0 text-muted-foreground"><UiFn size={12} /></span>}</button>;
}
const $r = [{
  mode: "translate",
  labelKey: "tool.move",
  key: "1",
  Icon: fm
}, {
  mode: "rotate",
  labelKey: "tool.rotate",
  key: "2",
  Icon: nm
}, {
  mode: "scale",
  labelKey: "tool.scale",
  key: "3",
  Icon: sm
}];
function UiHg({
  mode: o,
  onMode: e
}) {
  const t = pe(),
    [n, s] = k.useState(!1),
    r = k.useRef(null);
  k.useEffect(() => {
    const a = l => {
      r.current && !r.current.contains(l.target) && s(!1);
    };
    return document.addEventListener("mousedown", a), () => document.removeEventListener("mousedown", a);
  }, []);
  const i = $r.find(a => a.mode === o) ?? $r[0];
  return <div className="group relative" ref={r}><button className={`${qs} ${Ys(n)}`} onClick={() => s(a => !a)}><i.Icon size={20} /></button>{!n && <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-popover text-popover-foreground px-2 py-1 text-[11px] opacity-0 transition-opacity group-hover:opacity-100">{t(i.labelKey)} ({i.key})</div>}{n && <div className="absolute bottom-full left-1/2 z-40 mb-3 min-w-[172px] -translate-x-1/2 rounded-[16px] border border-border bg-popover p-1.5">{$r.map(a => <UiKi key={a.mode} Icon={a.Icon} label={t(a.labelKey)} shortcut={a.key} active={a.mode === o} onClick={() => {
        e(a.mode), s(!1);
      }} />)}</div>}</div>;
}
function UiPg({
  onUpload: o,
  onAi: e,
  busy: t
}) {
  const n = pe(),
    [s, r] = k.useState(!1),
    i = k.useRef(null);
  return k.useEffect(() => {
    const a = l => {
      i.current && !i.current.contains(l.target) && r(!1);
    };
    return document.addEventListener("mousedown", a), () => document.removeEventListener("mousedown", a);
  }, []), k.useEffect(() => {
    t && r(!1);
  }, [t]), <div className="group relative" ref={i}><button className={`${qs} ${Ys(s)}`} disabled={t} onClick={() => r(a => !a)}>{t ? <span className="block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent opacity-60" /> : <Ml size={20} />}</button>{!s && !t && <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-popover text-popover-foreground px-2 py-1 text-[11px] opacity-0 transition-opacity group-hover:opacity-100">{n("tb.panorama")}</div>}{s && !t && <div className="absolute bottom-full left-1/2 z-40 mb-3 min-w-[160px] -translate-x-1/2 rounded-xl border border-border bg-popover p-1.5"><UiKi Icon={UiXd} label={n("tb.local_upload")} onClick={() => {
        r(!1), o();
      }} /><UiKi Icon={Ml} label={n("tb.ai_generate")} onClick={() => {
        r(!1), e();
      }} /></div>}</div>;
}
function UiFg({
  title: o,
  Icon: UiE,
  tip: t,
  children: n
}) {
  const [s, r] = k.useState(!1),
    i = k.useRef(null);
  return k.useEffect(() => {
    const a = l => {
      i.current && !i.current.contains(l.target) && r(!1);
    };
    return document.addEventListener("mousedown", a), () => document.removeEventListener("mousedown", a);
  }, []), <div className="group relative" ref={i}><button className={`${qs} ${Ys(s)}`} onClick={() => r(a => !a)}><UiE size={20} /></button>{!s && <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-popover text-popover-foreground px-2 py-1 text-[11px] opacity-0 transition-opacity group-hover:opacity-100">{t}</div>}{s && <div className="absolute bottom-full left-1/2 z-40 mb-3 min-w-[176px] -translate-x-1/2 rounded-[16px] border border-border bg-popover p-1.5" onClick={() => r(!1)}><div className="px-2 py-1 text-[10px] text-muted-foreground">{o}</div>{n}</div>}</div>;
}
function Fl({
  icon: o,
  children: e,
  onClick: t
}) {
  return <button className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-[12.5px] text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground" onClick={t}>{o && <span className="inline-block w-5 text-center text-muted-foreground">{o}</span>}<span className="truncate">{e}</span></button>;
}
const mg = ["Auto", "21:9", "16:9", "4:3", "1:1", "3:4", "9:16", "2.39:1", "2.35:1", "1.85:1"];
function UiGg({
  ratio: o,
  active: e
}) {
  const t = "currentColor",
    n = e ? 1 : 0.6;
  if (o === "Auto") return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={t} strokeOpacity={n} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M8 4H4v4M16 4h4v4M20 16v4h-4M4 16v4h4" /></svg>;
  const s = o.match(/^(\d+(?:\.\d+)?):(\d+(?:\.\d+)?)$/),
    r = s ? parseFloat(s[1]) : 16,
    i = s ? parseFloat(s[2]) : 9,
    a = 18;
  let l = a,
    d = a * i / r;
  return d > a && (d = a, l = a * r / i), <svg width="24" height="22" viewBox="0 0 24 22"><rect x={(24 - l) / 2} y={(22 - d) / 2} width={l} height={d} fill="none" stroke={t} strokeOpacity={n} strokeWidth="1.7" /></svg>;
}
function UiXg({
  mode: o,
  onMode: e,
  onPanoramaUpload: t,
  onPanoramaAi: n,
  panoBusy: s,
  onScreenshot: r,
  onFullscreen: i,
  fullscreen: a,
  onAspect: l,
  aspect: d,
  onAddCamera: u,
  timelineOpen: h,
  onToggleTimeline: m,
  propPickerOpen: f,
  onTogglePropPicker: p
}) {
  const x = pe(),
    [g, b] = k.useState(!1),
    w = k.useRef(null);
  return k.useEffect(() => {
    const v = E => {
      w.current && !w.current.contains(E.target) && b(!1);
    };
    return document.addEventListener("mousedown", v), () => document.removeEventListener("mousedown", v);
  }, []), <div className="absolute bottom-7 left-1/2 z-30 -translate-x-1/2"><div className="flex items-center gap-1.5 rounded-[16px] border border-border bg-popover px-2.5 py-1.5"><UiHg mode={o} onMode={e} /><Gr Icon={bd} tip={`${x("tree.section.characters")} / ${x("tree.section.props")}`} active={f} onClick={p} /><UiPg onUpload={t} onAi={n} busy={s} /><UiFg title={x("tb.add_camera")} Icon={gm} tip={x("tb.add_camera")}><Fl onClick={() => u()}>{x("tb.apply_current_view")}</Fl><div className="px-2 py-1 text-[10px] text-muted-foreground">{x("tb.preset_views")}</div><div className="max-h-[260px] overflow-y-auto">{Bc.map(v => <Fl key={v.id} onClick={() => u(v.id)}>{x(`camera.${v.id}`)}</Fl>)}</div></UiFg><Gr Icon={Gi} tip={x("tl.panel_title")} active={h} onClick={m} /><div className="group relative" ref={w}><button className={`${qs} ${Ys(g)}`} onClick={() => b(v => !v)}><UiWd size={20} /></button>{!g && <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-popover text-popover-foreground px-2 py-1 text-[11px] opacity-0 transition-opacity group-hover:opacity-100">{x("tb.aspect")}</div>}{g && <div className="absolute bottom-full left-1/2 z-40 mb-3 -translate-x-1/2 rounded-[16px] border border-border bg-popover p-3"><div className="mb-2 text-[12px] text-muted-foreground">{x("tb.ratio")}</div><div className="grid w-[300px] grid-cols-4 gap-2">{mg.map(v => {
              const E = v === d;
              return <button key={v} className={`flex h-[68px] flex-col items-center justify-center gap-1.5 border transition-colors ${E ? "border-foreground bg-foreground/10 text-foreground" : "border-border text-muted-foreground hover:border-foreground/50 hover:text-foreground"}`} onClick={() => {
                l(v), b(!1);
              }}><UiGg ratio={v} active={E} /><span className="text-[11px]">{v}</span></button>;
            })}</div></div>}</div><Gr Icon={a ? UiVd : UiYd} tip={x(a ? "tb.exit_fullscreen" : "tb.fullscreen")} onClick={i} /></div></div>;
}
const Bl = globalThis.__DIRECTOR_API_HOST__ ?? "",
  Ul = {
    fileUrl(o) {
      const e = o.replace(/^\/+/, "");
      return `${Bl}/files/${e}`;
    },
    async generateImage(o) {
      var r;
      const e = await fetch(`${Bl}/api/generate/image`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify(o)
      });
      if (!e.ok) throw new Error(`generate/image ${e.status}`);
      const t = await e.json(),
        n = (t == null ? void 0 : t.data) ?? t;
      if (n.ok === !1) throw new Error(n.user_message ?? n.error ?? Se("err.img_gen_failed"));
      const s = ((r = n.paths) != null && r.length ? n.paths : [n.path]).filter(i => !!i);
      if (!s.length) throw new Error(Se("err.img_empty"));
      return {
        paths: s
      };
    }
  },
  bg = "",
  wg = "2:1",
  yg = {
    "1k": {
      low: 20,
      medium: 80,
      high: 300
    },
    "2k": {
      low: 50,
      medium: 200,
      high: 800
    },
    "4k": {
      low: 100,
      medium: 400,
      high: 1600
    }
  },
  vg = 1;
function _g(o) {
  const e = yg[o.resolution ?? "1k"][o.quality ?? "high"],
    t = Math.max(0, Math.floor(o.refCount ?? 0)),
    n = e + t * vg,
    s = Math.min(4, Math.max(1, Math.floor(o.count ?? 1)));
  return n * s;
}
function kg(o) {
  return `Generate a 360-degree equirectangular panorama (cylindrical equidistant projection), seamless view where the left and right edges connect perfectly, ${o.trim() || "an immersive 360 degree environment"}, full horizontal 360° & vertical 180°, including zenith (top) and nadir (bottom), even ambient lighting, photorealistic, no visible seam, no warped text`;
}
function Ag() {
  return yh() === "overseas" ? "gpt-image-2" : "g-image-2";
}
const Mg = "gpt-image-2";
async function Eg(o, e = {}) {
  var u, h, m, f, p;
  const t = o.prompt.trim(),
    n = (o.referencePaths ?? []).filter(Boolean).slice(0, 4);
  if (!t && n.length === 0) throw new Error(Se("pgen.err_empty"));
  if (!zs()) return (u = e.onProgress) == null || u.call(e, 1), await new Promise(x => setTimeout(x, 800)), (h = e.onProgress) == null || h.call(e, 2), {
    items: [{
      url: bg,
      path: ""
    }]
  };
  const s = n,
    r = Ag(),
    i = o.background ?? "auto",
    a = Math.min(9, Math.max(1, Math.floor(o.count ?? 1))),
    l = wh(),
    d = {
      backend: "openai",
      model_id: r,
      prompt: kg(t),
      filename: "panorama",
      ...(s.length ? {
        image_paths: s
      } : {}),
      ...(l ? {
        source_node_id: l
      } : {}),
      ...(a > 1 ? {
        count: a
      } : {}),
      params: {
        model_name: Mg,
        aspect_ratio: wg,
        resolution: o.resolution ?? "1k",
        quality: o.quality ?? "high",
        ...(i !== "auto" ? {
          background: i
        } : {})
      }
    };
  (m = e.onProgress) == null || m.call(e, 1);
  try {
    const {
      paths: x
    } = await Ul.generateImage(d);
    return (f = e.onProgress) == null || f.call(e, 2), {
      items: x.map(g => ({
        url: Ul.fileUrl(g),
        path: g
      }))
    };
  } catch (x) {
    throw (p = e.onProgress) == null || p.call(e, 3), x;
  }
}
const Gl = [{
    value: "1k",
    label: "1k"
  }, {
    value: "2k",
    label: "2k"
  }, {
    value: "4k",
    label: "4K"
  }],
  Cg = [1, 2, 3, 4],
  Kr = 4;
function UiJg({
  open: o,
  onClose: e,
  onSubmit: t
}) {
  var y, I;
  const n = pe(),
    [s, r] = k.useState(""),
    [i, a] = k.useState([]),
    [l, d] = k.useState("2k"),
    [u, h] = k.useState("low"),
    [m, f] = k.useState(1),
    [p, x] = k.useState(!1),
    g = k.useRef(null),
    b = [{
      value: "low",
      label: n("pgen.q_low")
    }, {
      value: "medium",
      label: n("pgen.q_medium")
    }, {
      value: "high",
      label: n("pgen.quality_high")
    }],
    w = ((y = b.find(j => j.value === u)) == null ? void 0 : y.label) ?? "",
    v = ((I = Gl.find(j => j.value === l)) == null ? void 0 : I.label) ?? "";
  if (k.useEffect(() => {
    o || (r(""), a([]), d("2k"), h("low"), f(1), x(!1));
  }, [o]), k.useEffect(() => {
    const j = D => {
      D.key === "Escape" && (p ? x(!1) : e());
    };
    return o && document.addEventListener("keydown", j), () => document.removeEventListener("keydown", j);
  }, [o, p, e]), k.useEffect(() => {
    if (!p) return;
    const j = D => {
      g.current && !g.current.contains(D.target) && x(!1);
    };
    return document.addEventListener("mousedown", j), () => document.removeEventListener("mousedown", j);
  }, [p]), !o) return null;
  const E = async () => {
      const j = Kr - i.length;
      if (j <= 0) return;
      const D = await kc(j);
      D.length && a(H => {
        const F = new Set(H.map(ne => ne.nodeId)),
          U = D.filter(ne => !F.has(ne.nodeId));
        return [...H, ...U].slice(0, Kr);
      });
    },
    T = j => a(D => D.filter(H => H.nodeId !== j)),
    P = !!s.trim() || i.length > 0,
    C = _g({
      resolution: l,
      quality: u,
      count: m,
      refCount: i.length
    }),
    M = () => {
      P && (t({
        prompt: s,
        referencePaths: i.map(j => j.path),
        resolution: l,
        quality: u,
        count: m
      }), e());
    };
  return <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40" onMouseDown={() => {
    p || e();
  }}><div className="relative w-[620px] max-w-[92vw] rounded-2xl border border-border bg-popover p-4 text-foreground shadow-xl" onMouseDown={j => {
      j.stopPropagation(), p && g.current && !g.current.contains(j.target) && x(!1);
    }}><button className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground" onClick={() => e()} title={n("common.cancel")} aria-label={n("common.cancel")}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12" /></svg></button><div className="mb-3 flex flex-wrap items-start gap-3">{i.map(j => <div key={j.nodeId} className="relative h-[88px] w-[124px] shrink-0 overflow-hidden rounded-xl border border-border bg-muted"><img src={j.url} alt="" className="h-full w-full object-cover" /><button className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-md bg-black/50 text-[11px] text-white transition-colors hover:bg-black/70" onClick={() => T(j.nodeId)}>✕</button></div>)}{i.length < Kr && <button className="grid h-[88px] w-[124px] shrink-0 place-items-center rounded-xl border border-dashed border-border bg-muted text-muted-foreground transition-colors hover:border-foreground/50 hover:text-foreground disabled:opacity-40" onClick={E} title={n("pgen.add_reference")}><span className="text-[28px] font-light leading-none">+</span></button>}</div><textarea className="h-[104px] w-full resize-none bg-transparent px-1 text-[14px] text-foreground outline-none focus-visible:outline-none placeholder:text-muted-foreground" placeholder={n("pgen.placeholder")} value={s} onChange={j => r(j.target.value)} autoFocus={!0} /><div className="mt-1 flex items-center justify-between"><div className="flex items-center gap-2 text-[13px] text-muted-foreground"><div className="relative" ref={g}><button className={`flex items-center gap-1.5 rounded-md border px-2 py-1 transition-colors ${p ? "border-foreground/50 text-foreground" : "border-transparent hover:bg-foreground/5 hover:text-foreground"}`} onClick={() => x(j => !j)}><UiWd size={15} />{v} · {w} · ×{m}</button>{p && <div className="absolute bottom-[calc(100%+8px)] left-0 z-10 w-[420px] rounded-xl border border-border bg-popover p-4 text-foreground shadow-xl"><Vr title={n("pgen.resolution")}>{Gl.map(j => <UiQr key={j.value} active={l === j.value} onClick={() => d(j.value)}>{j.label}</UiQr>)}</Vr><Vr title={n("pgen.quality")}>{b.map(j => <UiQr key={j.value} active={u === j.value} onClick={() => h(j.value)}>{j.label}</UiQr>)}</Vr><Vr title={n("pgen.count")}>{Cg.map(j => <UiQr key={j} active={m === j} onClick={() => f(j)}>×{j}</UiQr>)}</Vr></div>}</div></div><div className="flex items-center gap-3"><span className="flex shrink-0 items-center gap-1.5 text-[14px] tracking-tight text-muted-foreground"><svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" clipRule="evenodd" d="M6.52105 2L7.25885 6.2093L4.80361 2.71115L2.71115 4.80361L6.2093 7.25885L2 6.52111V9.47895L6.2093 8.74115L2.71115 11.1964L4.80361 13.2889L7.25885 9.7907L6.52105 14H9.47889L8.74108 9.7907L11.1964 13.2889L13.2889 11.1964L9.7907 8.74115L14 9.47895V6.52111L9.7907 7.25885L13.2889 4.80361L11.1964 2.71115L8.74108 6.2093L9.47889 2H6.52105Z" /></svg><span>{C}</span></span><button className="flex h-8 w-8 items-center justify-center rounded-[4px] bg-foreground text-[14px] font-medium text-background transition-opacity hover:enabled:opacity-90 disabled:cursor-not-allowed disabled:opacity-50" disabled={!P} onClick={M} title={n("pgen.generate")} aria-label={n("pgen.generate")}><Ki size={16} /></button></div></div></div></div>;
}
function Vr({
  title: o,
  children: e
}) {
  return <div className="mb-3 last:mb-0"><div className="mb-1.5 text-[12px] text-muted-foreground">{o}</div><div className="flex flex-wrap gap-2">{e}</div></div>;
}
function UiQr({
  active: o,
  onClick: e,
  children: t
}) {
  return <button className={`min-w-[68px] flex-1 rounded-lg border px-3 py-2 text-[13px] transition-colors ${o ? "border-foreground/60 bg-foreground/10 text-foreground" : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"}`} onClick={e}>{t}</button>;
}
const Yr = 3;
function Sg({
  open: o,
  onClose: e,
  onSubmit: t
}) {
  const n = pe(),
    [s, r] = k.useState(""),
    [i, a] = k.useState([]);
  if (k.useEffect(() => {
    o || (r(""), a([]));
  }, [o]), k.useEffect(() => {
    if (!o) return;
    const h = m => {
      m.key === "Escape" && e();
    };
    return document.addEventListener("keydown", h), () => document.removeEventListener("keydown", h);
  }, [o, e]), !o) return null;
  const l = async () => {
      const h = Yr - i.length;
      if (h <= 0) return;
      const m = await kc(h);
      m.length && a(f => {
        const p = new Set(f.map(x => x.assetId));
        return [...f, ...m.filter(x => !p.has(x.assetId))].slice(0, Yr);
      });
    },
    d = !!s.trim() || i.length > 0,
    u = () => {
      d && (t({
        prompt: s.trim(),
        referencePaths: i.map(h => h.path)
      }), e());
    };
  return <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40" onMouseDown={e}><div className="relative w-[640px] max-w-[92vw] rounded-2xl border border-border bg-popover p-5 text-foreground shadow-xl" onMouseDown={h => h.stopPropagation()}><div className="mb-4 flex items-center justify-between"><span className="text-[15px] font-semibold">{n("aigen.title")}</span><button className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground" onClick={e} aria-label={n("common.cancel")}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12" /></svg></button></div><div className="mb-3 flex flex-wrap items-start gap-3">{i.map(h => <div key={h.assetId} className="relative h-[132px] w-[132px] shrink-0 overflow-hidden rounded-xl border border-border bg-muted"><img src={h.url} alt="" className="h-full w-full object-cover" /><button className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-md bg-black/50 text-[11px] text-white transition-colors hover:bg-black/70" onClick={() => a(m => m.filter(f => f.assetId !== h.assetId))}>✕</button></div>)}{i.length < Yr && <button className="grid h-[132px] w-[132px] shrink-0 place-items-center rounded-xl border border-dashed border-border bg-muted/60 text-muted-foreground transition-colors hover:border-foreground/50 hover:text-foreground" onClick={l} title={n("aigen.add_reference")}><span className="text-[30px] font-light leading-none">+</span></button>}</div><textarea className="h-[128px] w-full resize-none bg-transparent px-1 text-[14px] text-foreground outline-none focus-visible:outline-none placeholder:text-muted-foreground" placeholder={n("aigen.placeholder")} value={s} onChange={h => r(h.target.value)} onKeyDown={h => {
        h.key === "Enter" && (h.metaKey || h.ctrlKey) && (h.preventDefault(), u());
      }} autoFocus={!0} /><div className="mt-2 flex items-center justify-end"><button className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-foreground text-background transition-opacity hover:enabled:opacity-90 disabled:cursor-not-allowed disabled:opacity-40" disabled={!d} onClick={u} title={n("aigen.generate")} aria-label={n("aigen.generate")}><Ki size={17} /></button></div></div></div>;
}
function $l({
  open: o,
  title: e,
  placeholder: t,
  onClose: n,
  onSubmit: s
}) {
  const r = pe(),
    [i, a] = k.useState("");
  if (k.useEffect(() => {
    o || a("");
  }, [o]), k.useEffect(() => {
    if (!o) return;
    const u = h => {
      h.key === "Escape" && n();
    };
    return document.addEventListener("keydown", u), () => document.removeEventListener("keydown", u);
  }, [o, n]), !o) return null;
  const l = !!i.trim(),
    d = () => {
      l && (s(i.trim()), n());
    };
  return <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40" onMouseDown={n}><div className="relative w-[560px] max-w-[92vw] rounded-2xl border border-border bg-popover p-5 text-foreground shadow-xl" onMouseDown={u => u.stopPropagation()}><div className="mb-3 flex items-center justify-between"><span className="text-[15px] font-semibold">{e}</span><button className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground" onClick={n} aria-label={r("common.cancel")}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12" /></svg></button></div><textarea className="h-[112px] w-full resize-none bg-transparent px-1 text-[14px] text-foreground outline-none focus-visible:outline-none placeholder:text-muted-foreground" placeholder={t} value={i} onChange={u => a(u.target.value)} onKeyDown={u => {
        u.key === "Enter" && (u.metaKey || u.ctrlKey) && (u.preventDefault(), d());
      }} autoFocus={!0} /><div className="mt-2 flex items-center justify-end"><button className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-foreground text-background transition-opacity hover:enabled:opacity-90 disabled:cursor-not-allowed disabled:opacity-40" disabled={!l} onClick={d} title={r("aigen.generate")} aria-label={r("aigen.generate")}><Ki size={17} /></button></div></div></div>;
}
const Xr = new R();
class Tg {
  constructor(e) {
    S(this, "rotKs");
    S(this, "rotQs");
    S(this, "fovKeys");
    S(this, "fovKs");
    S(this, "rotSeg", 0);
    S(this, "fovSeg", 0);
    this.rotKs = e.rot.map(t => t.k), this.rotQs = e.rot.map(t => new ve(t.q[0], t.q[1], t.q[2], t.q[3]).normalize());
    for (let t = 1; t < this.rotQs.length; t++) if (this.rotQs[t - 1].dot(this.rotQs[t]) < 0) {
      const n = this.rotQs[t];
      n.set(-n.x, -n.y, -n.z, -n.w);
    }
    this.fovKeys = e.fov ?? [], this.fovKs = this.fovKeys.map(t => t.k);
  }
  get hasRot() {
    return this.rotQs.length > 0;
  }
  get hasFov() {
    return this.fovKeys.length > 0;
  }
  locate(e, t, n) {
    const s = e.length - 2;
    if (s < 0) return 0;
    for (let a = Math.max(0, n); a <= Math.min(n + 1, s); a++) if (t >= e[a] && t <= e[a + 1]) return a;
    let r = 0,
      i = s;
    for (; r < i;) {
      const a = r + i + 1 >> 1;
      e[a] <= t ? r = a : i = a - 1;
    }
    return r;
  }
  rotAt(e, t) {
    const n = this.rotKs,
      s = this.rotQs,
      r = s.length;
    if (r === 1 || e <= n[0]) return t.copy(s[0]);
    if (e >= n[r - 1]) return t.copy(s[r - 1]);
    const i = this.locate(n, e, this.rotSeg);
    this.rotSeg = i;
    const a = n[i + 1] - n[i],
      l = a > 1e-9 ? (e - n[i]) / a : 1;
    return t.slerpQuaternions(s[i], s[i + 1], l);
  }
  fovAt(e) {
    const t = this.fovKeys,
      n = t.length;
    if (n === 0) return null;
    if (n === 1 || e <= t[0].k) return t[0].fov;
    if (e >= t[n - 1].k) return t[n - 1].fov;
    const s = this.locate(this.fovKs, e, this.fovSeg);
    this.fovSeg = s;
    const r = t[s],
      i = t[s + 1],
      a = i.k - r.k,
      l = a > 1e-9 ? (e - r.k) / a : 1;
    return r.fov + (i.fov - r.fov) * l;
  }
}
class jd {
  constructor(e, t) {
    S(this, "onEnd");
    S(this, "playing", !0);
    S(this, "_elapsed", 0);
    S(this, "curve");
    S(this, "duration");
    S(this, "recorded");
    S(this, "ended", !1);
    var n, s;
    this.path = e, this.resolveTarget = t, this.curve = Pc(e.points, e.closed ?? !1), this.duration = Math.max(1, e.duration), this.recorded = (s = (n = e.recorded) == null ? void 0 : n.rot) != null && s.length ? new Tg(e.recorded) : null;
  }
  tick(e, t) {
    var r;
    this.playing && !this.ended && (this._elapsed += e);
    const {
      k: n,
      done: s
    } = this.cycleProgress();
    this.applyFrame(n, t), this.playing && !this.ended && s && (this.ended = !0, this.playing = !1, (r = this.onEnd) == null || r.call(this));
  }
  pause() {
    this.playing = !1;
  }
  resume() {
    if (this.ended) {
      this.ended = !1;
      const {
        k: e
      } = this.cycleProgress();
      e >= 1 && (this._elapsed = 0);
    }
    this.playing = !0;
  }
  seek(e) {
    this._elapsed = ke.clamp(e, 0, 1) * this.duration, this.ended = !1;
  }
  applyAt(e, t) {
    this.seek(e), this.applyFrame(ke.clamp(e, 0, 1), t);
  }
  sampleAt(e) {
    const t = yr[this.path.easing ?? "linear"](ke.clamp(e, 0, 1));
    return this.curve.frameAt(this.curve.timeToU(t));
  }
  getProgress() {
    const {
        k: e
      } = this.cycleProgress(),
      t = this.curve.timeToU(yr[this.path.easing ?? "linear"](e));
    return {
      k: e,
      u: t,
      elapsedMs: e * this.duration,
      playing: this.playing && !this.ended
    };
  }
  applyFrame(e, t) {
    const n = yr[this.path.easing ?? "linear"](e),
      s = this.curve.timeToU(n),
      r = this.curve.frameAt(s);
    t.position.copy(r.position), this.applyOrientation(t, r.position, r.tangent, r.up, n), this.applyFov(t, s, n);
  }
  cycleProgress() {
    const e = this._elapsed / this.duration;
    switch (this.path.loopMode ?? "once") {
      case "loop":
        return {
          k: e % 1,
          done: !1
        };
      case "pingpong":
        {
          const t = e % 2;
          return {
            k: t <= 1 ? t : 2 - t,
            done: !1
          };
        }
      default:
        return {
          k: Math.min(e, 1),
          done: e >= 1
        };
    }
  }
  applyOrientation(e, t, n, s, r) {
    var l;
    const i = this.path.lookAtTarget;
    let a = null;
    if (i && i !== Ne) a = this.resolveTarget(i);else if (i === Ne && this.path.lookAt) {
      const d = this.path.lookAt;
      a = Xr.set(d.x, d.y, d.z);
    }
    a ? (e.up.set(0, 1, 0), e.lookAt(a)) : (l = this.recorded) != null && l.hasRot ? this.recorded.rotAt(r, e.quaternion) : (e.up.copy(s), Xr.copy(t).add(n), e.lookAt(Xr), e.up.set(0, 1, 0));
  }
  applyFov(e, t, n) {
    var r;
    let s = (r = this.recorded) != null && r.hasFov ? this.recorded.fovAt(n) : null;
    if (s == null && (s = this.curve.fovAt(t)), s == null) {
      const {
        fovStart: i,
        fovEnd: a
      } = this.path;
      if (i == null || a == null) return;
      s = i + (a - i) * n;
    }
    Math.abs(s - e.fov) > 0.001 && (e.fov = s, e.updateProjectionMatrix());
  }
}
function Pg(o) {
  var e, t;
  return (t = (e = o.recorded) == null ? void 0 : e.fov) != null && t.length || o.points.some(n => n.fov != null) ? !0 : o.fovStart != null && o.fovEnd != null;
}
function Ig(o, e, t) {
  const n = Math.max(1, t),
    r = Math.min(400, Math.max(180, n * 0.09)) / n,
    i = o.sampleAt(Math.max(0, e - r)),
    a = o.sampleAt(Math.min(1, e + r)),
    l = a.position.x - i.position.x,
    d = a.position.z - i.position.z;
  if (l * l + d * d > 1e-8) return Math.atan2(l, d);
  const u = o.sampleAt(e);
  return u.tangent.lengthSq() > 1e-8 ? Math.atan2(u.tangent.x, u.tangent.z) : null;
}
class Po {
  constructor(e, t, n, s, r, i, a) {
    S(this, "onEnd");
    S(this, "playing", !1);
    S(this, "_t", 0);
    S(this, "durationMs");
    S(this, "players", new Map());
    S(this, "pathById", new Map());
    S(this, "lastClipId", null);
    S(this, "ended", !1);
    S(this, "hasPath", e => this.players.has(e));
    S(this, "hasAnim", e => !!Vt(e, this.customMotions));
    S(this, "objectHits", new Map());
    S(this, "animHits", new Map());
    S(this, "lastDriven", new Set());
    S(this, "lastPoseDriven", new Set());
    this.timeline = e, this.resolveTarget = n, this.baseFov = s, this.objectDriver = i, this.customMotions = a;
    for (const d of t) this.pathById.set(d.id, d);
    this.durationMs = Gt(e), r && (this.lastDriven = new Set(r.lastDriven), this.lastPoseDriven = new Set(r.lastPoseDriven));
    const l = new Set();
    for (const d of e.tracks) for (const u of d.clips) l.add(u.pathId);
    for (const d of l) {
      const u = this.pathById.get(d);
      if (!u) continue;
      const h = r == null ? void 0 : r.players.get(d);
      h && (r == null ? void 0 : r.pathById.get(d)) === u ? this.players.set(d, h) : this.players.set(d, new jd({
        ...u,
        loopMode: "once"
      }, n));
    }
  }
  get duration() {
    return this.durationMs;
  }
  tick(e, t) {
    var s;
    this.playing && !this.ended && (this._t += e);
    const n = Math.min(this._t, this.durationMs);
    this.applyFrame(n, t), this.playing && !this.ended && this._t >= this.durationMs && (this.ended = !0, this.playing = !1, (s = this.onEnd) == null || s.call(this));
  }
  play() {
    (this.ended || this._t >= this.durationMs) && (this._t = 0, this.ended = !1), this.playing = !0;
  }
  pause() {
    this.playing = !1;
  }
  seek(e) {
    this._t = ke.clamp(e, 0, this.durationMs), this.ended = !1;
  }
  applyAt(e, t) {
    this.seek(e), this.applyFrame(this._t, t);
  }
  getProgress() {
    return {
      tMs: Math.min(this._t, this.durationMs),
      durationMs: this.durationMs,
      playing: this.playing && !this.ended,
      activeClipId: this.lastClipId
    };
  }
  applyFrame(e, t) {
    let n = null,
      s = null,
      r = 0;
    const i = Yf(this.timeline, e, this.hasPath);
    if (i) n = i.clip.id, s = i.clip.pathId, r = i.k;else {
      const a = Xf(this.timeline, e, this.hasPath);
      a && (n = a.clip.id, s = a.clip.pathId, r = a.k);
    }
    if (!s) {
      this.lastClipId = null, this.applyObjects(e), this.applyAnims(e);
      return;
    }
    if (n !== this.lastClipId) {
      const a = this.pathById.get(s);
      a && !Pg(a) && Math.abs(t.fov - this.baseFov) > 0.001 && (t.fov = this.baseFov, t.updateProjectionMatrix()), this.lastClipId = n;
    }
    this.players.get(s).applyAt(r, t), this.applyObjects(e), this.applyAnims(e);
  }
  applyObjects(e) {
    if (!this.objectDriver) return;
    const t = Wf(this.timeline, e, this.hasPath, this.objectHits);
    for (const [s, r] of t) {
      const i = this.players.get(r.clip.pathId),
        a = i.sampleAt(r.k);
      let l = null;
      (r.track.orient ?? "follow") === "follow" && (l = Ig(i, r.k, r.clip.duration)), this.objectDriver.drive(s, a.position, l);
    }
    let n = t.size !== this.lastDriven.size;
    if (!n) {
      for (const s of t.keys()) if (!this.lastDriven.has(s)) {
        n = !0;
        break;
      }
    }
    n && (this.lastDriven = new Set(t.keys()), this.objectDriver.setDriven(this.lastDriven));
  }
  applyAnims(e) {
    if (!this.objectDriver) return;
    const t = Qf(this.timeline, e, this.hasAnim, this.animHits);
    for (const [s, r] of t) {
      const i = Vt(r.clip.pathId, this.customMotions),
        a = qi(i, r.k * r.clip.duration);
      this.objectDriver.drivePose(s, a.ja, a.drop);
    }
    let n = t.size !== this.lastPoseDriven.size;
    if (!n) {
      for (const s of t.keys()) if (!this.lastPoseDriven.has(s)) {
        n = !0;
        break;
      }
    }
    n && (this.lastPoseDriven = new Set(t.keys()), this.objectDriver.setPoseDriven(this.lastPoseDriven));
  }
}
function Io() {
  if (typeof MediaRecorder > "u") return null;
  for (const o of ["video/mp4;codecs=avc1", "video/mp4"]) if (MediaRecorder.isTypeSupported(o)) return {
    mime: o,
    ext: ".mp4"
  };
  for (const o of ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"]) if (MediaRecorder.isTypeSupported(o)) return {
    mime: o,
    ext: ".webm"
  };
  return null;
}
class Ng {
  constructor() {
    S(this, "mode", "realtime");
    S(this, "recorder", null);
    S(this, "stream", null);
    S(this, "chunks", []);
    S(this, "mimeType", "video/mp4");
    S(this, "ext", ".mp4");
    S(this, "opts", null);
    S(this, "stopped", null);
  }
  begin(e) {
    const t = Io();
    if (!t) throw new Error("browser does not support MediaRecorder video capture");
    this.mimeType = t.mime, this.ext = t.ext, this.opts = e, this.chunks = [], this.stream = e.canvas.captureStream(e.fps ?? 30), this.recorder = new MediaRecorder(this.stream, {
      mimeType: t.mime,
      videoBitsPerSecond: e.videoBitsPerSecond ?? 8e6
    }), this.recorder.ondataavailable = n => {
      n.data.size > 0 && this.chunks.push(n.data);
    }, this.stopped = new Promise(n => {
      this.recorder.onstop = () => n();
    }), this.recorder.start(250);
  }
  onFrame(e) {
    var t, n;
    (n = (t = this.opts) == null ? void 0 : t.onProgress) == null || n.call(t, e, this.opts.durationMs);
  }
  async finish() {
    const e = this.recorder;
    if (!e) throw new Error("exporter not started");
    return e.state !== "inactive" && e.stop(), await this.stopped, this.teardown(), {
      blob: new Blob(this.chunks, {
        type: this.mimeType
      }),
      mimeType: this.mimeType,
      ext: this.ext
    };
  }
  cancel() {
    this.recorder && this.recorder.state !== "inactive" && this.recorder.stop(), this.teardown(), this.chunks = [];
  }
  teardown() {
    var e;
    (e = this.stream) == null || e.getTracks().forEach(t => t.stop()), this.stream = null, this.recorder = null, this.opts = null;
  }
}
function Rg(o, e) {
  const t = URL.createObjectURL(o),
    n = document.createElement("a");
  n.href = t, n.download = e, document.body.appendChild(n), n.click(), n.remove(), setTimeout(() => URL.revokeObjectURL(t), 1e4);
}
const Dg = [{
    dir: [1, 0, 0],
    color: "#fd5b5d",
    view: "right",
    positive: !0
  }, {
    dir: [0, 1, 0],
    color: "#38e2b3",
    view: "top",
    positive: !0
  }, {
    dir: [0, 0, 1],
    color: "#4d79ff",
    view: "front",
    positive: !0
  }, {
    dir: [-1, 0, 0],
    color: "#888888",
    view: "left",
    positive: !1
  }, {
    dir: [0, -1, 0],
    color: "#888888",
    view: "bottom",
    positive: !1
  }, {
    dir: [0, 0, -1],
    color: "#888888",
    view: "back",
    positive: !1
  }],
  wo = new R(),
  _n = new R(),
  an = new R(),
  Kl = new R(),
  Lg = new R(0, 1, 0),
  zg = new R(1, 0, 0);
function Vl(o, e, t) {
  return e ? _n.copy(o.position).sub(e) : o.getWorldDirection(_n).negate(), _n.lengthSq() < 1e-8 && o.getWorldDirection(_n).negate(), _n.normalize(), an.crossVectors(Lg, _n), an.lengthSq() < 1e-8 ? an.copy(t.lengthSq() > 1e-8 ? t : zg) : (an.normalize(), t.lengthSq() > 1e-8 && an.dot(t) < 0 && an.negate()), t.copy(an), Kl.crossVectors(_n, an).normalize(), Dg.map(n => {
    wo.set(...n.dir);
    const s = wo.dot(an),
      r = wo.dot(Kl),
      i = wo.dot(_n);
    return {
      ...n,
      sx: 36 + 28 * s,
      sy: 36 - 28 * r,
      lx: 36 + 28 * s * 0.8,
      ly: 36 - 28 * r * 0.8,
      z: i
    };
  });
}
function Og({
  engine: o,
  onSelect: e,
  onReset: t
}) {
  const n = k.useRef(null),
    s = k.useRef(new R(1, 0, 0)),
    r = pe(),
    i = Vi(),
    a = k.useRef("rgba(22, 24, 34, 0.92)");
  a.current = i === "light" ? "#ffffff" : "rgba(22, 24, 34, 0.92)", k.useEffect(() => {
    const d = n.current;
    if (!(!d || !o)) return o.onRender(() => {
      var x;
      const u = o.camera;
      if (!u) return;
      const h = d.getContext("2d");
      if (!h) return;
      const m = window.devicePixelRatio || 1,
        f = Math.round(72 * m);
      d.width !== f && (d.width = f, d.height = f), h.setTransform(m, 0, 0, m, 0, 0), h.clearRect(0, 0, 72, 72), h.beginPath(), h.arc(36, 36, 35, 0, 2 * Math.PI), h.fillStyle = a.current, h.fill();
      const p = Vl(u, (x = o.controls) == null ? void 0 : x.target, s.current);
      p.sort((g, b) => g.z - b.z);
      for (const g of p) h.globalAlpha = g.positive ? 1 : 0.3, h.beginPath(), h.moveTo(36, 36), h.lineTo(g.lx, g.ly), h.strokeStyle = g.color, h.lineWidth = 0.8, h.stroke(), h.globalAlpha = g.positive ? 1 : g.z > 0 ? 0.8 : 0.4, h.beginPath(), h.arc(g.sx, g.sy, 4.5, 0, 2 * Math.PI), h.fillStyle = g.color, h.fill();
      h.globalAlpha = 1;
    });
  }, [o]);
  const l = k.useCallback(d => {
    var w;
    const u = n.current,
      h = o == null ? void 0 : o.camera;
    if (!u || !h) return;
    const m = u.getBoundingClientRect(),
      f = (d.clientX - m.left) * (72 / m.width),
      p = (d.clientY - m.top) * (72 / m.height),
      x = Vl(h, (w = o.controls) == null ? void 0 : w.target, s.current);
    x.sort((v, E) => E.z - v.z);
    let g = null,
      b = 1 / 0;
    for (const v of x) {
      const E = Math.hypot(f - v.sx, p - v.sy);
      E < b && (b = E, g = v);
    }
    g && b < 10.5 && e(g.view);
  }, [o, e]);
  return <div className="flex flex-col"><canvas ref={n} width={72} height={72} style={{
      width: 72,
      height: 72,
      display: "block",
      cursor: "pointer",
      borderRadius: "50%",
      border: "1px solid var(--border)"
    }} onClick={l} /><button type="button" onClick={t} className="mt-1.5 w-full rounded-[10px] border border-border bg-popover py-0.5 text-[11px] text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground">{r("viewcube.reset")}</button></div>;
}
class $ extends Error {
  constructor(e, t, n) {
    super(t), this.code = e, this.candidates = n, this.name = "AgentOperationError";
  }
}
const ql = ["linear", "easeIn", "easeOut", "easeInOut", "smoothstep"],
  Hg = new Set(["move", "dolly", "truck", "crane", "orbit", "hold", "push", "pull", "follow", "pedestal", "arc", "spiral", "zoom", "dolly-zoom", "jib", "boom", "pan", "tilt", "whip", "roll"]),
  Fg = new Set(["look", "easing", "loop", "from"]),
  campathHeadHint = "look, easing, loop, from, move, dolly, truck, crane, orbit, hold, push, pull, zoom, dolly-zoom, pan, tilt, whip, roll, jib, boom, pedestal, arc, spiral, follow",
  un = o => o && o.type === "word" ? o.value : null,
  us = o => o && o.type === "num" && Number.isFinite(Number(o.value)) ? Number(o.value) : null;
function Ai(o, e) {
  const t = us(o[e]),
    n = us(o[e + 1]),
    s = us(o[e + 2]);
  return t === null || n === null || s === null ? null : {
    x: t,
    y: n,
    z: s
  };
}
function yo(o) {
  if (!o || o.type !== "dur") return null;
  const e = parseFloat(o.value.replace(/s$/, ""));
  return Number.isFinite(e) ? e : null;
}
function vo(o, e, t) {
  return o === null ? (t.push({
    line: e.line,
    message: "missing duration — every segment ends with `<seconds>s` (e.g. `3s`, `0.5s`)"
  }), null) : !(o > 0) || o > 60 ? (t.push({
    line: e.line,
    message: "segment duration must be in (0, 60] seconds"
  }), null) : o;
}
function No(o, e, t) {
  const n = o.tokens,
    s = {};
  for (let r = e; r < n.length; r += 2) {
    const i = un(n[r]),
      a = us(n[r + 1]);
    if (!i || !t.includes(i) || a === null) return {
      opts: null,
      error: {
        line: o.line,
        message: `bad trailing options — allowed: ${t.map(l => `\`${l} <n>\``).join(", ")}`
      }
    };
    if (i in s) return {
      opts: null,
      error: {
        line: o.line,
        message: `duplicate option \`${i}\``
      }
    };
    s[i] = a;
  }
  return {
    opts: s,
    error: null
  };
}
function Bg(o) {
  var u, h, m;
  const e = [];
  let t;
  try {
    t = rd(o);
  } catch (f) {
    if (f instanceof Bi) return {
      ast: null,
      errors: [{
        line: f.line,
        message: f.message
      }]
    };
    throw f;
  }
  if (t.length === 0) return {
    ast: null,
    errors: [{
      line: 1,
      message: "empty document"
    }]
  };
  const n = t[0],
    s = n.tokens;
  if (n.indent !== 0 || s.length !== 2 || un(s[0]) !== "campath" || ((u = s[1]) == null ? void 0 : u.type) !== "str") return {
    ast: null,
    errors: [{
      line: n.line,
      message: 'document must start with a `campath "<name>"` header'
    }]
  };
  const r = {
    name: s[1].value,
    look: {
      kind: "ahead"
    },
    segments: []
  };
  let i = null,
    a = !1,
    l = !1,
    d = !1;
  for (let f = 1; f < t.length; f++) {
    const p = t[f],
      x = p.tokens,
      g = un(x[0]);
    if (!g || !Fg.has(g) && !Hg.has(g)) {
      e.push({
        line: p.line,
        message: `unknown line head "${g ?? ((h = x[0]) == null ? void 0 : h.value) ?? "?"}" — expected one of: ${campathHeadHint}`
      });
      continue;
    }
    if (p.indent <= n.indent) {
      e.push({
        line: p.line,
        message: `\`${g}\` must be indented beneath the campath header`
      });
      continue;
    }
    if (i === null && (i = p.indent), p.indent !== i) {
      e.push({
        line: p.line,
        message: `all lines must share one indentation level (${i} spaces)`
      });
      continue;
    }
    switch (g) {
      case "look":
        {
          if (a) {
            e.push({
              line: p.line,
              message: "duplicate `look` — a campath has exactly one aim (split into two paths to re-aim)"
            });
            break;
          }
          const b = un(x[1]);
          if (b === "ahead" && x.length === 2) r.look = {
            kind: "ahead"
          };else if (b === "target" && x.length === 3 && ((m = x[2]) == null ? void 0 : m.type) === "str") r.look = {
            kind: "target",
            ref: x[2].value,
            line: p.line
          };else if (b === "at" && x.length === 5) {
            const w = Ai(x, 2);
            if (!w) {
              e.push({
                line: p.line,
                message: "expected `look at <x> <y> <z>`"
              });
              break;
            }
            r.look = {
              kind: "at",
              point: w
            };
          } else {
            e.push({
              line: p.line,
              message: 'expected `look target "<object-id>"` / `look at <x> <y> <z>` / `look ahead`'
            });
            break;
          }
          a = !0;
          break;
        }
      case "easing":
        {
          if (l) {
            e.push({
              line: p.line,
              message: "duplicate `easing`"
            });
            break;
          }
          const b = un(x[1]);
          if (x.length !== 2 || !b || !ql.includes(b)) {
            e.push({
              line: p.line,
              message: `expected \`easing <${ql.join("|")}>\``
            });
            break;
          }
          r.easing = b, l = !0;
          break;
        }
      case "loop":
        {
          if (d) {
            e.push({
              line: p.line,
              message: "duplicate `loop`"
            });
            break;
          }
          if (x.length === 1) r.loopMode = "loop";else if (x.length === 2 && un(x[1]) === "pingpong") r.loopMode = "pingpong";else {
            e.push({
              line: p.line,
              message: "expected `loop` or `loop pingpong`"
            });
            break;
          }
          d = !0;
          break;
        }
      case "from":
        {
          if (r.from) {
            e.push({
              line: p.line,
              message: "duplicate `from` — a campath has exactly one start position"
            });
            break;
          }
          if (r.segments.length > 0) {
            e.push({
              line: p.line,
              message: "`from` must come before the first move segment"
            });
            break;
          }
          const b = Ai(x, 1);
          if (!b) {
            e.push({
              line: p.line,
              message: "expected `from <x> <y> <z>` (camera start position, meters)"
            });
            break;
          }
          const {
            opts: w,
            error: v
          } = No(p, 4, ["fov"]);
          if (v) {
            e.push(v);
            break;
          }
          r.from = {
            point: b,
            ...(w.fov !== void 0 ? {
              fov: w.fov
            } : {}),
            line: p.line
          };
          break;
        }
      default:
        {
          if (!r.from) {
            e.push({
              line: p.line,
              message: "declare `from <x> <y> <z>` (camera start) before the first move segment"
            });
            break;
          }
          const b = Ug(g, p, e);
          b && r.segments.push(b);
          break;
        }
    }
  }
  return r.from || e.push({
    line: n.line,
    message: "a campath requires `from <x> <y> <z>` (camera start position)"
  }), r.segments.length === 0 && e.push({
    line: n.line,
    message: "a campath requires at least one move segment (move/dolly/truck/crane/orbit/hold/zoom/pan/jib/…)"
  }), {
    ast: r,
    errors: e
  };
}
function Ug(o, e, t) {
  const n = e.tokens;
  switch (o) {
    case "move":
      {
        const s = un(n[1]) === "to" ? Ai(n, 2) : null,
          r = s ? vo(yo(n[5]), e, t) : null;
        if (!s) return t.push({
          line: e.line,
          message: "expected `move to <x> <y> <z> <seconds>s [fov <n>]`"
        }), null;
        if (r === null) return null;
        const {
          opts: i,
          error: a
        } = No(e, 6, ["fov"]);
        return a ? (t.push(a), null) : {
          kind: "move",
          to: s,
          durationSec: r,
          ...(i.fov !== void 0 ? {
            fov: i.fov
          } : {}),
          line: e.line
        };
      }
    case "dolly":
    case "truck":
    case "crane":
      {
        const s = o === "dolly" ? ["in", "out"] : o === "truck" ? ["left", "right"] : ["up", "down"],
          r = un(n[1]),
          i = us(n[2]);
        if (!r || !s.includes(r) || i === null) return t.push({
          line: e.line,
          message: `expected \`${o} ${s.join("|")} <meters> <seconds>s [fov <n>]\``
        }), null;
        if (!(i > 0)) return t.push({
          line: e.line,
          message: `\`${o}\` distance must be positive (meters)`
        }), null;
        const a = vo(yo(n[3]), e, t);
        if (a === null) return null;
        const {
          opts: l,
          error: d
        } = No(e, 4, ["fov"]);
        if (d) return t.push(d), null;
        const u = l.fov !== void 0 ? {
          fov: l.fov
        } : {};
        return o === "dolly" ? {
          kind: "dolly",
          dir: r,
          meters: i,
          durationSec: a,
          ...u,
          line: e.line
        } : o === "truck" ? {
          kind: "truck",
          dir: r,
          meters: i,
          durationSec: a,
          ...u,
          line: e.line
        } : {
          kind: "crane",
          dir: r,
          meters: i,
          durationSec: a,
          ...u,
          line: e.line
        };
      }
    case "orbit":
      {
        const s = un(n[1]),
          r = us(n[2]);
        if (!s || !["left", "right"].includes(s) || r === null) return t.push({
          line: e.line,
          message: "expected `orbit left|right <degrees> <seconds>s [rise <m>] [radius <m>] [fov <n>]`"
        }), null;
        if (!(r > 0)) return t.push({
          line: e.line,
          message: "`orbit` degrees must be positive (direction comes from left|right)"
        }), null;
        const i = vo(yo(n[3]), e, t);
        if (i === null) return null;
        const {
          opts: a,
          error: l
        } = No(e, 4, ["rise", "radius", "fov"]);
        return l ? (t.push(l), null) : {
          kind: "orbit",
          dir: s,
          degrees: r,
          durationSec: i,
          ...(a.rise !== void 0 ? {
            rise: a.rise
          } : {}),
          ...(a.radius !== void 0 ? {
            radius: a.radius
          } : {}),
          ...(a.fov !== void 0 ? {
            fov: a.fov
          } : {}),
          line: e.line
        };
      }
    case "hold":
      {
        const s = vo(yo(n[1]), e, t);
        if (s === null) return null;
        const {
          opts: r,
          error: i
        } = No(e, 2, ["fov"]);
        return i ? (t.push(i), null) : {
          kind: "hold",
          durationSec: s,
          ...(r.fov !== void 0 ? {
            fov: r.fov
          } : {}),
          line: e.line
        };
      }
    case "push":
    case "pull":
    case "follow":
      {
        const s = ["in", "out"].includes(un(n[1])) ,
          r = us(n[s ? 2 : 1]),
          i = vo(yo(n[s ? 3 : 2]), e, t);
        if (r === null || !(r > 0) || i === null) return t.push({
          line: e.line,
          message: `expected \`${o} <meters> <seconds>s [fov <n>]\``
        }), null;
        const {
          opts: a,
          error: l
        } = No(e, s ? 4 : 3, ["fov"]);
        if (l) return t.push(l), null;
        return {
          kind: "dolly",
          dir: o === "pull" ? "out" : "in",
          meters: r,
          durationSec: i,
          ...(a.fov !== void 0 ? {
            fov: a.fov
          } : {}),
          line: e.line
        };
      }
    case "pedestal":
      {
        const s = un(n[1]),
          r = us(n[2]),
          i = vo(yo(n[3]), e, t);
        if (!s || !["up", "down"].includes(s) || r === null || i === null) return t.push({
          line: e.line,
          message: "expected `pedestal up|down <meters> <seconds>s [fov <n>]`"
        }), null;
        const {
          opts: a,
          error: l
        } = No(e, 4, ["fov"]);
        return l ? (t.push(l), null) : {
          kind: "crane",
          dir: s,
          meters: r,
          durationSec: i,
          ...(a.fov !== void 0 ? {
            fov: a.fov
          } : {}),
          line: e.line
        };
      }
    case "arc":
    case "spiral":
      {
        const s = un(n[1]),
          r = us(n[2]);
        if (!s || !["left", "right"].includes(s) || r === null) return t.push({
          line: e.line,
          message: `expected \`${o} left|right <degrees> <seconds>s [rise <m>] [radius <m>] [fov <n>]\``
        }), null;
        const i = vo(yo(n[3]), e, t);
        if (i === null) return null;
        const {
          opts: a,
          error: l
        } = No(e, 4, ["rise", "radius", "fov"]);
        if (l) return t.push(l), null;
        return {
          kind: "orbit",
          dir: s,
          degrees: r,
          durationSec: i,
          ...(a.rise !== void 0 ? {
            rise: a.rise
          } : o === "spiral" ? {
            rise: 1.2
          } : {}),
          ...(a.radius !== void 0 ? {
            radius: a.radius
          } : {}),
          ...(a.fov !== void 0 ? {
            fov: a.fov
          } : {}),
          line: e.line
        };
      }
    case "zoom":
      {
        const s = un(n[1]),
          r = us(n[2]);
        if (!s || !["in", "out"].includes(s) || r === null) return t.push({
          line: e.line,
          message: "expected `zoom in|out <degrees> <seconds>s [fov <n>]`"
        }), null;
        const i = vo(yo(n[3]), e, t);
        if (i === null) return null;
        const {
          opts: a,
          error: l
        } = No(e, 4, ["fov"]);
        return l ? (t.push(l), null) : {
          kind: "zoom",
          dir: s,
          degrees: r,
          durationSec: i,
          ...(a.fov !== void 0 ? {
            fov: a.fov
          } : {}),
          line: e.line
        };
      }
    case "dolly-zoom":
      {
        const s = un(n[1]),
          r = us(n[2]);
        if (!s || !["in", "out"].includes(s) || r === null) return t.push({
          line: e.line,
          message: "expected `dolly-zoom in|out <meters> <seconds>s`"
        }), null;
        if (!(r > 0)) return t.push({
          line: e.line,
          message: "`dolly-zoom` distance must be positive (meters)"
        }), null;
        const i = vo(yo(n[3]), e, t);
        return i === null ? null : {
          kind: "dolly-zoom",
          dir: s,
          meters: r,
          durationSec: i,
          line: e.line
        };
      }
    case "jib":
    case "boom":
      {
        const s = un(n[1]),
          r = us(n[2]);
        if (!s || !["up", "down"].includes(s) || r === null) return t.push({
          line: e.line,
          message: `expected \`${o} up|down <meters> <seconds>s [fov <n>]\``
        }), null;
        const i = vo(yo(n[3]), e, t);
        if (i === null) return null;
        const {
          opts: a,
          error: l
        } = No(e, 4, ["fov"]);
        return l ? (t.push(l), null) : {
          kind: "jib",
          dir: s,
          meters: r,
          durationSec: i,
          ...(a.fov !== void 0 ? {
            fov: a.fov
          } : {}),
          line: e.line
        };
      }
    case "pan":
    case "whip":
      {
        const s = un(n[1]),
          r = us(n[2]);
        if (!s || !["left", "right"].includes(s) || r === null) return t.push({
          line: e.line,
          message: `expected \`${o} left|right <degrees> <seconds>s\``
        }), null;
        const i = vo(yo(n[3]), e, t);
        return i === null ? null : {
          kind: "pan",
          dir: s,
          degrees: r,
          durationSec: i,
          line: e.line
        };
      }
    case "tilt":
      {
        const s = un(n[1]),
          r = us(n[2]);
        if (!s || !["up", "down"].includes(s) || r === null) return t.push({
          line: e.line,
          message: "expected `tilt up|down <degrees> <seconds>s`"
        }), null;
        const i = vo(yo(n[3]), e, t);
        return i === null ? null : {
          kind: "tilt",
          dir: s,
          degrees: r,
          durationSec: i,
          line: e.line
        };
      }
    case "roll":
      {
        const s = un(n[1]),
          r = us(n[2]);
        if (!s || !["left", "right"].includes(s) || r === null) return t.push({
          line: e.line,
          message: "expected `roll left|right <degrees> <seconds>s`"
        }), null;
        const i = vo(yo(n[3]), e, t);
        return i === null ? null : {
          kind: "roll",
          dir: s,
          degrees: r,
          durationSec: i,
          line: e.line
        };
      }
  }
  return null;
}
const Gg = Math.PI / 180,
  Yl = 48,
  Xl = 0.5,
  Wl = 120,
  ns = 0.5,
  $g = 0.02,
  Jt = o => Math.round(o * 1e4) / 1e4,
  _o = o => ({
    x: Jt(o.x),
    y: Jt(o.y),
    z: Jt(o.z)
  }),
  js = (o, e) => ({
    x: o.x + e.x,
    y: o.y + e.y,
    z: o.z + e.z
  }),
  Wr = (o, e) => ({
    x: o.x - e.x,
    y: o.y - e.y,
    z: o.z - e.z
  }),
  ln = (o, e) => ({
    x: o.x * e,
    y: o.y * e,
    z: o.z * e
  }),
  Qr = o => Math.hypot(o.x, o.y, o.z);
function Kg(o, e = {}) {
  var M;
  const {
    ast: t,
    errors: n
  } = Bg(o);
  if (!t || n.length > 0) return {
    path: null,
    errors: n,
    warnings: []
  };
  const s = [],
    r = [],
    i = (y, I) => r.push({
      line: y,
      message: I
    }),
    a = (y, I) => {
      const j = {
        x: Math.min(500, Math.max(-500, y.x)),
        y: Math.min(500, Math.max(0.02, y.y)),
        z: Math.min(500, Math.max(-500, y.z))
      };
      return Math.abs(j.x - y.x) + Math.abs(j.y - y.y) + Math.abs(j.z - y.z) > 1e-9 && i(I, `position (${Jt(y.x)}, ${Jt(y.y)}, ${Jt(y.z)}) clamped to stage bounds (|x|,|z| ≤ 500, y ≥ 0.02)`), j;
    },
    l = (y, I, j, D, H) => {
      const F = Math.min(j, Math.max(I, y));
      return F !== y && i(D, `${H} ${y} clamped to ${F} (range ${I}..${j})`), F;
    },
    d = (y, I) => l(y, 10, 120, I, "fov");
  let u,
    h,
    m = null;
  if (t.look.kind === "target") {
    const y = ((M = e.resolveTarget) == null ? void 0 : M.call(e, t.look.ref)) ?? null;
    if (!y) return s.push({
      line: t.look.line,
      message: `look target "${t.look.ref}" not found in the scene — use an object id from scene.get (8-char prefix ok) or "$N" for an object created earlier in this batch`
    }), {
      path: null,
      errors: s,
      warnings: r
    };
    u = y.id, m = y.aim;
  } else t.look.kind === "at" && (u = Ne, h = t.look.point, m = t.look.point);
  if (!t.from) return {
    path: null,
    errors: [{
      line: 1,
      message: "missing `from`"
    }],
    warnings: r
  };
  const f = a(t.from.point, t.from.line),
    p = [{
      position: f,
      in: {
        x: 0,
        y: 0,
        z: 0
      },
      out: {
        x: 0,
        y: 0,
        z: 0
      },
      tilt: 0,
      ...(m ? {
        aim: {
          x: m.x,
          y: m.y,
          z: m.z
        }
      } : {}),
      ...(t.from.fov !== void 0 ? {
        fov: d(t.from.fov, t.from.line)
      } : {}),
      tSec: 0
    }];
  let x = f,
    g = null,
    b = 0,
    bakeAim = !1,
    currentFov = t.from.fov,
    currentTilt = 0;
  if (!m) {
    const y = t.segments.find(I => I.kind === "move");
    if (y) {
      const I = Wr(y.to, f),
        j = Qr(I);
      j > 1e-6 && (g = ln(I, 1 / j));
    }
  }
  const w = (y, I, j, D) => {
      const H = a(y, j),
        F = Wr(H, x),
        U = Qr(F);
      if (U < 0.005) return s.push({
        line: j,
        message: "segment travel is ~zero — use `hold <seconds>s` for a static beat"
      }), !1;
      const ne = ln(F, 1 / 3);
      return p[p.length - 1].out = ne, b += I, p.push({
        position: H,
        in: ln(ne, -1),
        out: {
          x: 0,
          y: 0,
          z: 0
        },
        tilt: p[p.length - 1].tilt ?? 0,
        ...(p[p.length - 1].aim ? {
          aim: p[p.length - 1].aim
        } : {}),
        ...(D !== void 0 ? {
          fov: d(D, j)
        } : {}),
        tSec: b
      }), x = H, g = ln(F, 1 / U), !0;
    },
    v = y => m || (s.push({
      line: y.line,
      message: `\`${y.kind}\` needs a look point — declare \`look target "<id>"\` or \`look at <x> <y> <z>\` before the segments`
    }), null),
    Q = (I, j, D) => {
      let H = g;
      if (!H && m) {
        const F = x.x - m.x,
          U = x.z - m.z,
          ne = Math.hypot(F, U);
        ne > 1e-4 && (H = {
          x: F / ne,
          y: 0,
          z: U / ne
        });
      }
      H || (H = {
        x: 1,
        y: 0,
        z: 0
      });
      const ae = g;
      w(js(x, ln(H, $g)), I, j, D), g = ae;
    };
  for (const y of t.segments) E(y);
  function E(y) {
    switch (y.kind) {
      case "move":
        {
          w(y.to, y.durationSec, y.line, y.fov);
          return;
        }
      case "dolly":
        {
          const I = v(y);
          if (!I) return;
          let j = l(y.meters, 0.05, 100, y.line, "dolly distance");
          const D = Wr(I, x),
            H = Qr(D);
          if (H < 1e-6) {
            s.push({
              line: y.line,
              message: "camera sits exactly on the look point — dolly direction is undefined"
            });
            return;
          }
          const F = ln(D, 1 / H);
          if (y.dir === "in") {
            const U = H - ns;
            if (U < 0.05) {
              s.push({
                line: y.line,
                message: `camera is already within ${ns} m of the look point — no room to dolly in`
              });
              return;
            }
            j > U && (i(y.line, `dolly in ${j} clamped to ${Jt(U)} m (stops ${ns} m short of the look point)`), j = U), w(js(x, ln(F, j)), y.durationSec, y.line, y.fov);
          } else w(js(x, ln(F, -j)), y.durationSec, y.line, y.fov);
          return;
        }
      case "truck":
        {
          const I = v(y);
          if (!I) return;
          const j = l(y.meters, 0.05, 100, y.line, "truck distance"),
            D = I.x - x.x,
            H = I.z - x.z,
            F = Math.hypot(D, H);
          if (F < 1e-4) {
            s.push({
              line: y.line,
              message: "camera is directly above/below the look point — truck direction is undefined"
            });
            return;
          }
          const U = {
            x: -H / F,
            y: 0,
            z: D / F
          };
          w(js(x, ln(U, y.dir === "right" ? j : -j)), y.durationSec, y.line, y.fov);
          return;
        }
      case "crane":
        {
          const I = l(y.meters, 0.05, 100, y.line, "crane distance");
          w(js(x, {
            x: 0,
            y: y.dir === "up" ? I : -I,
            z: 0
          }), y.durationSec, y.line, y.fov);
          return;
        }
      case "orbit":
        {
          const I = v(y);
          if (!I) return;
          const j = I.x,
            D = I.z,
            H = x.x - j,
            F = x.z - D,
            U = Math.hypot(H, F);
          if (U < ns) {
            s.push({
              line: y.line,
              message: `orbit needs the camera at least ${ns} m horizontally from the look point (current: ${Jt(U)} m) — move or \`dolly out\` first`
            });
            return;
          }
          const ne = l(y.degrees, 5, 720, y.line, "orbit degrees"),
            ae = y.dir === "right" ? 1 : -1,
            He = y.radius !== void 0 ? l(y.radius, ns, 100, y.line, "orbit end radius") : U,
            ce = y.rise !== void 0 ? l(y.rise, -50, 50, y.line, "orbit rise") : 0,
            Re = Math.atan2(H, F),
            ot = x.y,
            Ke = Math.max(1, Math.ceil(ne / 90)),
            rt = ne * Gg / Ke,
            De = Ue => Ue * (4 / 3) * Math.tan(rt / 4),
            dt = ce / Ke,
            it = {
              x: Math.cos(Re),
              z: -Math.sin(Re)
            };
          p[p.length - 1].out = {
            x: it.x * De(U) * ae,
            y: dt / 3,
            z: it.z * De(U) * ae
          };
          for (let Ue = 1; Ue <= Ke; Ue++) {
            const gt = Ue / Ke,
              Je = Re + rt * Ue * ae,
              ut = U + (He - U) * gt,
              st = a({
                x: j + Math.sin(Je) * ut,
                y: ot + ce * gt,
                z: D + Math.cos(Je) * ut
              }, y.line),
              G = {
                x: Math.cos(Je),
                z: -Math.sin(Je)
              },
              W = De(ut);
            b += y.durationSec / Ke, p.push({
              position: st,
              in: {
                x: -G.x * W * ae,
                y: -dt / 3,
                z: -G.z * W * ae
              },
              out: {
                x: G.x * W * ae,
                y: dt / 3,
                z: G.z * W * ae
              },
              ...(Ue === Ke && y.fov !== void 0 ? {
                fov: d(y.fov, y.line)
              } : {}),
              tSec: b
            }), Ue === Ke && (x = st, g = {
              x: G.x * ae,
              y: 0,
              z: G.z * ae
            });
          }
          return;
        }
      case "hold":
        {
          Q(y.durationSec, y.line, y.fov);
          y.fov !== void 0 && (currentFov = d(y.fov, y.line));
          return;
        }
      case "zoom":
        {
          const I = currentFov ?? p[p.length - 1].fov ?? 40;
          p[p.length - 1].fov == null && (p[p.length - 1].fov = I);
          const j = y.fov !== void 0 ? d(y.fov, y.line) : d(zoomEndFov(I, y.dir, l(y.degrees, 0.5, 80, y.line, "zoom degrees")), y.line);
          Q(y.durationSec, y.line, j), currentFov = j;
          return;
        }
      case "dolly-zoom":
        {
          const I = v(y);
          if (!I) return;
          let j = l(y.meters, 0.05, 100, y.line, "dolly-zoom distance");
          const D = Wr(I, x),
            H = Qr(D);
          if (H < 1e-6) {
            s.push({
              line: y.line,
              message: "camera sits exactly on the look point — dolly-zoom direction is undefined"
            });
            return;
          }
          const F = ln(D, 1 / H),
            U = currentFov ?? p[p.length - 1].fov ?? 40;
          p[p.length - 1].fov == null && (p[p.length - 1].fov = U);
          if (y.dir === "in") {
            const ne = H - ns;
            if (ne < 0.05) {
              s.push({
                line: y.line,
                message: `camera is already within ${ns} m of the look point — no room to dolly-zoom in`
              });
              return;
            }
            j > ne && (i(y.line, `dolly-zoom in ${j} clamped to ${Jt(ne)} m`), j = ne), w(js(x, ln(F, j)), y.durationSec, y.line);
          } else w(js(x, ln(F, -j)), y.durationSec, y.line);
          const ae = dollyZoomFov(U, H, Qr(Wr(I, x)));
          p[p.length - 1].fov = ae, currentFov = ae;
          return;
        }
      case "jib":
        {
          const I = v(y);
          if (!I) return;
          const j = l(y.meters, 0.05, 100, y.line, "jib distance");
          w(jibEnd(x, I, j, y.dir), y.durationSec, y.line, y.fov);
          y.fov !== void 0 && (currentFov = d(y.fov, y.line));
          return;
        }
      case "pan":
        {
          m || (m = g ? js(x, ln(g, 4)) : {
            x: x.x,
            y: x.y,
            z: x.z - 4
          });
          p[p.length - 1].aim = {
            x: m.x,
            y: m.y,
            z: m.z
          };
          const I = l(y.degrees, 1, 180, y.line, "pan degrees");
          m = panLookAt(x, m, y.dir === "left" ? I : -I), h = m, bakeAim = !0, u = void 0, Q(y.durationSec, y.line), p[p.length - 1].aim = {
            x: m.x,
            y: m.y,
            z: m.z
          };
          return;
        }
      case "tilt":
        {
          m || (m = g ? js(x, ln(g, 4)) : {
            x: x.x,
            y: x.y,
            z: x.z - 4
          });
          p[p.length - 1].aim = {
            x: m.x,
            y: m.y,
            z: m.z
          };
          const I = l(y.degrees, 1, 80, y.line, "tilt degrees");
          m = tiltLookAt(x, m, y.dir === "up" ? I : -I), h = m, bakeAim = !0, u = void 0, Q(y.durationSec, y.line), p[p.length - 1].aim = {
            x: m.x,
            y: m.y,
            z: m.z
          };
          return;
        }
      case "roll":
        {
          const I = l(y.degrees, 0.5, 45, y.line, "roll degrees"),
            j = rollEndTilt(currentTilt, y.dir, I);
          p[p.length - 1].tilt = currentTilt, Q(y.durationSec, y.line), p[p.length - 1].tilt = j, currentTilt = j;
          return;
        }
    }
  }
  if (s.length > 0) return {
    path: null,
    errors: s,
    warnings: r
  };
  if (p.length > Yl) return s.push({
    line: 1,
    message: `too many control points (${p.length} > ${Yl}) — merge segments or reduce orbit sweep`
  }), {
    path: null,
    errors: s,
    warnings: r
  };
  if (b < Xl) return s.push({
    line: 1,
    message: `total duration ${Jt(b)}s is below ${Xl}s — lengthen the segments`
  }), {
    path: null,
    errors: s,
    warnings: r
  };
  if (b > Wl) return s.push({
    line: 1,
    message: `total duration ${Jt(b)}s exceeds ${Wl}s — shorten or split into multiple paths`
  }), {
    path: null,
    errors: s,
    warnings: r
  };
  const T = b,
    P = p.map((y, I) => ({
      position: _o(y.position),
      in: _o(y.in),
      out: _o(y.out),
      tilt: y.tilt ?? 0,
      tangentMode: "free",
      timeK: I === 0 ? 0 : I === p.length - 1 ? 1 : y.tSec / T,
      ...(y.fov !== void 0 ? {
        fov: y.fov
      } : {})
    })),
    recorded = bakeAim ? {
      rot: p.map((y, I) => {
        const j = I === 0 ? 0 : I === p.length - 1 ? 1 : y.tSec / T,
          D = y.aim || m || js(y.position, {
            x: 0,
            y: 0,
            z: -1
          });
        return {
          k: j,
          q: lookAtQuat(y.position, D)
        };
      })
    } : null;
  return {
    path: {
      label: t.name,
      points: P,
      duration: Math.round(T * 1e3),
      ...(u !== void 0 && !bakeAim ? {
        lookAtTarget: u
      } : {}),
      ...(h ? {
        lookAt: _o(h)
      } : m && bakeAim ? {
        lookAt: _o(m)
      } : {}),
      ...(t.easing ? {
        easing: t.easing
      } : {}),
      loopMode: t.loopMode ?? "once",
      ...(recorded ? {
        recorded
      } : {})
    },
    errors: [],
    warnings: r
  };
}
const Zr = o => Math.round(o * 1e3) / 1e3,
  Sd = o => ({
    x: Zr(o.x),
    y: Zr(o.y),
    z: Zr(o.z)
  }),
  Fe = o => ({
    x: o.x,
    y: o.y,
    z: o.z
  });
function $s(o) {
  var e, t, n, s, r;
  return {
    characters: o.characters.length,
    props: o.props.length,
    models: ((e = o.models) == null ? void 0 : e.length) ?? 0,
    codeModels: ((t = o.codeModels) == null ? void 0 : t.length) ?? 0,
    cameras: o.cameras.length,
    camPaths: ((n = o.camPaths) == null ? void 0 : n.length) ?? 0,
    timelineTracks: ((s = o.camTimeline) == null ? void 0 : s.tracks.length) ?? 0,
    timelineDurationMs: Gt(o.camTimeline),
    customMotions: ((r = o.customMotions) == null ? void 0 : r.length) ?? 0
  };
}
function Vg(o, e, t) {
  var n;
  return {
    revision: t,
    summary: $s(o),
    codeModels: (o.codeModels ?? []).map(s => ({
      id: s.id,
      label: s.label,
      parts: s.parts,
      position: Fe(s.position),
      rotation: Fe(s.rotation),
      scale: Fe(s.scale),
      uniformScale: s.uniformScale,
      visible: s.visible,
      locked: s.locked,
      shadowEnabled: s.shadowEnabled ?? !0,
      partOverrides: s.partOverrides ?? {},
      referencePath: s.referencePath ?? null,
      codeChars: s.code.length
    })),
    characters: o.characters.map(s => ({
      id: s.id,
      label: s.label,
      bodyType: s.bodyType,
      pose: s.pose,
      color: s.color,
      position: Fe(s.position),
      rotation: Fe(s.rotation),
      scale: Fe(s.scale),
      uniformScale: s.uniformScale,
      visible: s.visible,
      locked: s.locked,
      shadowEnabled: s.shadowEnabled
    })),
    props: o.props.map(s => ({
      id: s.id,
      label: s.label,
      assetId: s.assetId,
      position: Fe(s.position),
      rotation: Fe(s.rotation),
      scale: Fe(s.scale),
      uniformScale: s.uniformScale,
      visible: s.visible,
      locked: s.locked
    })),
    models: (o.models ?? []).map(s => ({
      id: s.id,
      label: s.label,
      type: s.modelType,
      position: Fe(s.position),
      rotation: Fe(s.rotation),
      scale: Fe(s.scale),
      uniformScale: s.uniformScale,
      visible: s.visible,
      locked: s.locked,
      shadowEnabled: s.shadowEnabled ?? null
    })),
    cameras: o.cameras.map(s => ({
      id: s.id,
      label: s.label,
      position: Fe(s.position),
      lookAt: Fe(s.lookAt),
      lookAtTarget: s.lookAtTarget || null,
      cameraRotation: Fe(s.cameraRotation),
      fov: s.fov,
      zoom: s.zoom,
      visible: s.visible,
      locked: s.locked
    })),
    camPaths: (o.camPaths ?? []).map(s => ({
      id: s.id,
      label: s.label,
      pointsCount: s.points.length,
      points: s.points.slice(0, 64).map(r => ({
        position: Fe(r.position),
        in: Fe(r.in),
        out: Fe(r.out),
        tilt: r.tilt ?? null,
        fov: r.fov ?? null,
        speed: r.speed ?? null
      })),
      pointsTruncated: s.points.length > 64,
      duration: s.duration,
      visible: s.visible,
      lookAtTarget: s.lookAtTarget ?? null,
      lookAt: s.lookAt ? Fe(s.lookAt) : null,
      easing: s.easing ?? "linear",
      loopMode: s.loopMode ?? "once",
      closed: s.closed ?? !1,
      fovStart: s.fovStart ?? null,
      fovEnd: s.fovEnd ?? null,
      recordedRot: s.recorded && s.recorded.rot ? s.recorded.rot.length : 0,
      dsl: !!s.source
    })),
    timeline: (((n = o.camTimeline) == null ? void 0 : n.tracks) ?? []).map(s => ({
      id: s.id,
      label: s.label,
      muted: s.muted ?? !1,
      kind: s.kind === "anim" ? "anim" : s.targetId ? "object" : "camera",
      targetId: s.targetId ?? null,
      orient: s.orient ?? null,
      clips: s.clips.map(r => ({
        id: r.id,
        ref: r.pathId,
        start: r.start,
        duration: r.duration,
        enabled: r.enabled ?? !0
      }))
    })),
    customMotions: (o.customMotions ?? []).map(s => {
      const r = Vt(s.id, o.customMotions);
      return {
        id: s.id,
        label: s.label ?? null,
        durationMs: (r == null ? void 0 : r.defaultMs) ?? null,
        loop: (r == null ? void 0 : r.loop) ?? null,
        sourceChars: s.source.length
      };
    }),
    groups: o.characterGroups.map(s => ({
      id: s.id,
      label: s.label,
      memberIds: s.memberIds ?? s.characterIds,
      locked: s.locked ?? !0,
      pivot: s.pivot ? Fe(s.pivot) : null
    })),
    environment: {
      backgroundMode: o.environment.backgroundMode ?? "flat",
      panoramaUrl: o.environment.panoramaUrl || null,
      panoramaRotationY: o.environment.panoramaRotationY,
      panoramaRadius: o.environment.panoramaRadius,
      skyColor: o.environment.skyColor ?? "",
      showGround: o.environment.showGround ?? !0,
      groundOpacity: o.environment.groundOpacity ?? 0.4,
      groundHeight: o.environment.groundHeight ?? 0,
      sceneScale: o.environment.sceneScale ? Fe(o.environment.sceneScale) : null,
      sceneRotation: o.environment.sceneRotation ? Fe(o.environment.sceneRotation) : null,
      scenePosition: o.environment.scenePosition ? Fe(o.environment.scenePosition) : null
    },
    selectedIds: e
  };
}
function Jr(o, e, t = 6) {
  const n = [`- ${o}(${e.length}):`];
  for (const s of e.slice(0, t)) {
    const r = Sd(s.position);
    n.push(`  • [${s.id.slice(0, 8)}] "${s.label}" pos(${r.x},${r.y},${r.z})`);
  }
  return e.length > t && n.push(`  … ${e.length - t} more; use scene.get`), n;
}
function qg(o, e) {
  var a, l, d, u;
  const t = ["3D Director Stage scene:"];
  t.push(...Jr("characters", o.characters)), t.push(...Jr("props", o.props)), t.push(...Jr("cameras", o.cameras));
  const n = o.codeModels ?? [];
  t.push(`- codeModels(${n.length}):`);
  for (const h of n.slice(0, 6)) t.push(`  • [${h.id.slice(0, 8)}] "${h.label}" parts: ${h.parts.slice(0, 10).join(", ") || "(none)"}`);
  n.length > 6 && t.push(`  … ${n.length - 6} more; use scene.get`);
  const s = e[e.length - 1],
    r = o.characters.find(h => h.id === s) ?? o.characters[0];
  r && t.push(`- animTarget: "${r.label}" [${r.id.slice(0, 8)}]`), t.push(`- models: ${((a = o.models) == null ? void 0 : a.length) ?? 0}, camPaths: ${((l = o.camPaths) == null ? void 0 : l.length) ?? 0}, timelineTracks: ${((d = o.camTimeline) == null ? void 0 : d.tracks.length) ?? 0}, customMotions: ${((u = o.customMotions) == null ? void 0 : u.length) ?? 0}`), e.length && t.push(`- selected: ${e.map(h => h.slice(0, 20)).join(", ")}`), t.push("8-char ids are accepted only when unique. Use scene.get for exact state; scene.snapshot is the visual truth.");
  const i = t.join(`
`);
  return i.length > 5500 ? `${i.slice(0, 5460)}
…(editor_state truncated; use scene.get)` : i;
}
const Yg = o => structuredClone(o),
  Ee = o => typeof o == "number" && Number.isFinite(o) ? o : void 0,
  Ct = (o, e, t) => Math.min(t, Math.max(e, o)),
  me = o => typeof o == "string" ? o.trim() : "";
function Be(o, e) {
  if (!o || typeof o != "object") return e;
  const t = o,
    n = Ee(t.x),
    s = Ee(t.y),
    r = Ee(t.z);
  return n === void 0 || s === void 0 || r === void 0 ? e : {
    x: n,
    y: s,
    z: r
  };
}
function ei(o) {
  const e = Ee(o.rotationY);
  return e === void 0 ? Be(o.rotation) ?? {
    x: 0,
    y: 0,
    z: 0
  } : {
    x: 0,
    y: e,
    z: 0
  };
}
function Tt(o, e, t = "object") {
  if (!e.trim()) throw new $("INVALID_PARAMS", `${t} id is required`);
  const n = o.find(r => r.id === e);
  if (n) return n;
  const s = o.filter(r => r.id.startsWith(e));
  if (!s.length) throw new $("OBJECT_NOT_FOUND", `${t} not found: ${e}`);
  if (s.length > 1) {
    const r = s.map(i => `${i.id}${i.label ? ` (${i.label})` : ""}`);
    throw new $("AMBIGUOUS_ID", `${t} id prefix is ambiguous: ${e}`, r);
  }
  return s[0];
}
function Xg(o) {
  const e = Yg(o);
  return e.camPaths ?? (e.camPaths = []), e.models ?? (e.models = []), e.codeModels ?? (e.codeModels = []), e.customMotions ?? (e.customMotions = []), e.camTimeline ?? (e.camTimeline = {
    tracks: []
  }), {
    comp: e,
    created: [],
    affected: new Set(),
    animTrackByTarget: new Map(e.camTimeline.tracks.filter(t => t.kind === "anim" && t.targetId).map(t => [t.targetId, t.id]))
  };
}
function Mn(o, e) {
  const t = /^\$(\d+)$/.exec(e);
  if (!t) return e;
  const n = Number(t[1]);
  if (n >= o.created.length) throw new $("INVALID_REFERENCE", `$${n} must reference an earlier operation`);
  const s = o.created[n];
  if (!s) throw new $("INVALID_REFERENCE", `$${n} does not reference a creating operation`);
  return s;
}
function Wg(o) {
  const e = (t, n) => ({
    id: t.id,
    label: t.label,
    kind: n,
    entity: t
  });
  return [...o.comp.characters.map(t => e(t, "character")), ...o.comp.props.map(t => e(t, "prop")), ...(o.comp.models ?? []).map(t => e(t, "model")), ...(o.comp.codeModels ?? []).map(t => e(t, "codeModel")), ...(o.comp.camPaths ?? []).map(t => e(t, "camPath")), ...(o.comp.customMotions ?? []).map(t => e(t, "motion"))];
}
function Qt(o, e) {
  const t = me(o);
  if (!t) throw new $("INVALID_PARAMS", `${e} is required`);
  return t;
}
function Bn(o, e, t) {
  const n = Mn(o, Qt(e, "id")),
    s = Wg(o).filter(r => !t || t.includes(r.kind));
  return Tt(s, n, (t == null ? void 0 : t.join("/")) || "object").entity;
}
function Ql(o) {
  if (!Array.isArray(o)) throw new $("INVALID_PARAMS", "points must be an array of at least 2 vectors");
  const e = o.map((t, n) => {
    const s = Be(t);
    if (!s) throw new $("INVALID_PARAMS", `points[${n}] is not {x,y,z}`);
    return s;
  });
  if (e.length < 2) throw new $("INVALID_PARAMS", "points needs at least 2 waypoints");
  return Li(e);
}
const Qg = ["linear", "easeIn", "easeOut", "easeInOut", "smoothstep"];
function ti(o, e, t, n, s) {
  const r = o.comp.camTimeline,
    i = {
      ...ms(r.tracks.length),
      ...s
    };
  i.clips = [Vn(e.id, t, n)], o.comp.camPaths.push(e), r.tracks.push(i);
}
function Zg(o, e) {
  const t = o.comp;
  t.characters = t.characters.filter(n => n.id !== e), t.props = t.props.filter(n => n.id !== e), t.cameras = t.cameras.filter(n => n.id !== e), t.models = t.models.filter(n => n.id !== e), t.codeModels = t.codeModels.filter(n => n.id !== e), t.camPaths = t.camPaths.filter(n => n.id !== e), t.customMotions = t.customMotions.filter(n => n.id !== e), t.camTimeline.tracks = t.camTimeline.tracks.filter(n => n.targetId !== e).map(n => ({
    ...n,
    clips: n.clips.filter(s => s.pathId !== e)
  })).filter(n => n.clips.length > 0), t.characterGroups = t.characterGroups.map(n => {
    var s;
    return {
      ...n,
      characterIds: n.characterIds.filter(r => r !== e),
      memberIds: (s = n.memberIds) == null ? void 0 : s.filter(r => r !== e)
    };
  }).filter(n => (n.memberIds ?? n.characterIds).length >= 2);
}
function Jg(o, e, t) {
  var r;
  const n = o.comp,
    s = me(t.id);
  switch (e) {
    case "add_character":
      {
        const i = me(t.bodyType) || "mannequin";
        if (!Kn[i]) throw new $("INVALID_PARAMS", `unknown bodyType: ${i}`);
        const a = Be(t.position);
        if (!a) throw new $("INVALID_PARAMS", "add_character requires position {x,y,z}");
        const l = me(t.pose) || "stand";
        if (!ps[l]) throw new $("INVALID_PARAMS", `unknown pose: ${l}`);
        const d = Wo(n.characters.length, i);
        if (d.position = a, d.rotation = ei(t), d.pose = l, d.jointAngles = fs(l, i), me(t.label) && (d.label = me(t.label).slice(0, 40)), me(t.color)) {
          if (!/^#[0-9a-fA-F]{6}$/.test(me(t.color))) throw new $("INVALID_PARAMS", "color must be #RRGGBB");
          d.color = me(t.color);
        }
        return Ee(t.uniformScale) !== void 0 && (d.uniformScale = Ct(Ee(t.uniformScale), 0.2, 5)), n.characters.push(d), o.affected.add(d.id), {
          id: d.id
        };
      }
    case "add_prop":
      {
        const i = me(t.assetId);
        if (!cp.has(i)) throw new $("INVALID_PARAMS", `unknown prop assetId: ${i}`);
        const a = Be(t.position);
        if (!a) throw new $("INVALID_PARAMS", "add_prop requires position {x,y,z}");
        const l = od(i, n.props.length);
        return l.position = a, l.rotation = ei(t), Be(t.scale) && (l.scale = Be(t.scale)), Ee(t.uniformScale) !== void 0 && (l.uniformScale = Ct(Ee(t.uniformScale), 0.05, 50)), me(t.label) && (l.label = me(t.label).slice(0, 40)), n.props.push(l), o.affected.add(l.id), {
          id: l.id
        };
      }
    case "set_pose":
      {
        const i = Tt(n.characters, Mn(o, Qt(s, "id")), "character"),
          a = me(t.pose);
        if (!ps[a]) throw new $("INVALID_PARAMS", `unknown pose: ${a}`);
        i.pose = a, i.jointAngles = fs(a, i.bodyType), o.affected.add(i.id);
        return;
      }
    case "add_campath":
      {
        const i = me(t.preset);
        let a,
          l = {};
        if (i) {
          const f = Qi.find(w => w.id === i);
          if (!f) throw new $("INVALID_PARAMS", `unknown campath preset: ${i}`);
          const p = Be(t.center);
          if (!p) throw new $("INVALID_PARAMS", "preset campath requires center");
          const x = me(t.targetId) ? Bn(o, me(t.targetId), ["character", "prop"]).id : void 0,
            g = (Ee(t.startDeg) ?? 0) * Math.PI / 180,
            b = f.build({
              center: p,
              radius: Ct(Ee(t.radius) ?? 4, 1.5, 20),
              height: Ct(Ee(t.height) ?? 1.6, 0.3, 12),
              startDir: {
                x: Math.sin(g),
                y: 0,
                z: Math.cos(g)
              },
              targetId: x
            });
          ({
            points: a,
            ...l
          } = b);
        } else a = Ql(t.points);
        const d = Be(t.lookAt);
        d ? l = {
          ...l,
          lookAtTarget: Ne,
          lookAt: d
        } : me(t.targetId) && !i && (l = {
          ...l,
          lookAtTarget: Bn(o, me(t.targetId), ["character", "prop"]).id
        });
        const u = me(t.easing);
        if (u && !Qg.includes(u)) throw new $("INVALID_PARAMS", `bad easing: ${u}`);
        const h = Ct(Ee(t.duration) ?? l.duration ?? 6e3, 500, 12e4),
          m = {
            id: $e(),
            label: (me(t.label) || `运镜路径${n.camPaths.length + 1}`).slice(0, 40),
            points: a,
            visible: !0,
            loopMode: "once",
            ...l,
            duration: h,
            ...(u ? {
              easing: u
            } : {})
          };
        return ti(o, m, Ct(Ee(t.clipStart) ?? 0, 0, 6e5), h), o.affected.add(m.id), {
          id: m.id
        };
      }
    case "set_campath":
      {
        const i = typeof t.dsl == "string" ? t.dsl : "";
        if (!i.trim() || i.length > 4e3) throw new $("INVALID_PARAMS", "set_campath requires dsl (max 4000 chars)");
        const a = s ? Tt(n.camPaths, Mn(o, s), "camera path") : void 0,
          d = Kg(i, {
            resolveTarget: f => {
              try {
                const p = Bn(o, f, ["character", "prop", "codeModel", "model"]),
                  g = (n.characters.some(b => b.id === p.id) ? 1.1 : 0.5) * (p.uniformScale ?? 1);
                return {
                  id: p.id,
                  aim: {
                    x: p.position.x,
                    y: p.position.y + g,
                    z: p.position.z
                  }
                };
              } catch (p) {
                if (p instanceof $ && p.code !== "OBJECT_NOT_FOUND") throw p;
                return null;
              }
            }
          });
        if (!d.path) throw new $("DSL_INVALID", d.errors.map(f => `L${f.line}: ${f.message}`).join("; "));
        const u = d.warnings.map(f => `L${f.line}: ${f.message}`),
          h = (a == null ? void 0 : a.id) ?? $e(),
          m = {
            id: h,
            label: (me(t.label) || d.path.label || `运镜路径${n.camPaths.length + 1}`).slice(0, 40),
            points: d.path.points,
            duration: d.path.duration,
            visible: (a == null ? void 0 : a.visible) ?? !0,
            loopMode: d.path.loopMode,
            lookAtTarget: d.path.lookAtTarget,
            lookAt: d.path.lookAt,
            easing: d.path.easing,
            recorded: d.path.recorded,
            source: i
          };
        if (a) {
          const f = n.camPaths.findIndex(p => p.id === a.id);
          n.camPaths[f] = m, t.clipStart !== void 0 && u.push("clipStart is ignored when updating an existing path");
        } else ti(o, m, Ct(Ee(t.clipStart) ?? 0, 0, 6e5), m.duration);
        return o.affected.add(h), {
          id: h,
          warnings: u
        };
      }
    case "add_move_path":
      {
        const i = Bn(o, Qt(t.targetId, "targetId"), ["character", "prop"]),
          a = Ct(Ee(t.duration) ?? 4e3, 300, 12e4),
          l = me(t.orient) || "follow";
        if (l !== "follow" && l !== "keep") throw new $("INVALID_PARAMS", "orient must be follow or keep");
        const d = {
          id: $e(),
          label: (me(t.label) || `走位路径${n.camPaths.length + 1}`).slice(0, 40),
          points: Ql(t.points),
          duration: a,
          visible: !0,
          loopMode: "once"
        };
        return ti(o, d, Ct(Ee(t.clipStart) ?? 0, 0, 6e5), a, {
          targetId: i.id,
          orient: l
        }), o.affected.add(d.id), {
          id: d.id
        };
      }
    case "set_motion":
      {
        const i = typeof t.dsl == "string" ? t.dsl : "";
        if (!i.trim() || i.length > 8e3) throw new $("INVALID_PARAMS", "set_motion requires dsl (max 8000 chars)");
        const a = s ? Mn(o, s) : "";
        if (a && vi(a)) throw new $("INVALID_PARAMS", "built-in motions are read-only");
        const l = a ? Tt(n.customMotions, a, "custom motion") : void 0,
          d = (l == null ? void 0 : l.id) ?? $e(),
          u = cd(d, i);
        if (!u.motion) throw new $("DSL_INVALID", u.errors.map(f => `L${f.line}: ${f.message}`).join("; "));
        const h = {
            id: d,
            label: (r = me(t.label) || dd(i) || void 0) == null ? void 0 : r.slice(0, 40),
            source: i
          },
          m = n.customMotions.findIndex(f => f.id === d);
        return m < 0 ? n.customMotions.push(h) : n.customMotions[m] = h, o.affected.add(d), {
          id: d,
          warnings: u.warnings.map(f => `L${f.line} [${f.step}] ${f.joint}: ${f.action} ${f.requested} clamped to ${f.clamped}`)
        };
      }
    case "add_anim_clip":
      {
        const i = Tt(n.characters, Mn(o, Qt(t.targetId, "targetId")), "character"),
          a = Mn(o, Qt(t.animId, "animId")),
          l = Vt(a, n.customMotions);
        if (!l) throw new $("OBJECT_NOT_FOUND", `motion not found: ${a}`);
        const d = n.camTimeline;
        let u = d.tracks.find(m => m.id === o.animTrackByTarget.get(i.id));
        u || (u = {
          ...ms(d.tracks.length),
          id: $e(),
          kind: "anim",
          targetId: i.id
        }, d.tracks.push(u), o.animTrackByTarget.set(i.id, u.id));
        const h = Ee(t.duration) === void 0 ? l.defaultMs : Ct(Ee(t.duration), 100, 12e4);
        u.clips.push(Vn(a, Ee(t.start) ?? Ui(u), h)), o.affected.add(i.id);
        return;
      }
    case "set_environment":
      {
        let i = !1;
        const a = n.environment;
        if (me(t.skyColor)) {
          if (!/^#[0-9a-fA-F]{6}$/.test(me(t.skyColor))) throw new $("INVALID_PARAMS", "skyColor must be #RRGGBB");
          a.skyColor = me(t.skyColor), i = !0;
        }
        if (me(t.backgroundMode)) {
          if (!["flat", "panorama"].includes(me(t.backgroundMode))) throw new $("INVALID_PARAMS", "backgroundMode must be flat or panorama");
          a.backgroundMode = me(t.backgroundMode), i = !0;
        }
        if (typeof t.showGround == "boolean" && (a.showGround = t.showGround, i = !0), Ee(t.groundOpacity) !== void 0 && (a.groundOpacity = Ct(Ee(t.groundOpacity), 0, 1), i = !0), Ee(t.groundHeight) !== void 0 && (a.groundHeight = Ct(Ee(t.groundHeight), -2, 2), i = !0), !i) throw new $("INVALID_PARAMS", "set_environment has nothing to change");
        return;
      }
    case "set_camera":
      {
        const i = s ? Tt(n.cameras, Mn(o, s), "camera") : n.cameras[0];
        if (!i) throw new $("OBJECT_NOT_FOUND", "scene has no camera");
        let a = !1;
        if (Be(t.position) && (i.position = Be(t.position), a = !0), Be(t.lookAt) && (i.lookAt = Be(t.lookAt), i.lookAtTarget = Ne, a = !0), Ee(t.fov) !== void 0 && (i.fov = Ct(Ee(t.fov), 10, 120), a = !0), !a) throw new $("INVALID_PARAMS", "set_camera has nothing to change");
        o.affected.add(i.id);
        return;
      }
    case "set_transform":
      {
        const i = Bn(o, Qt(s, "id"), ["character", "prop", "model", "codeModel"]);
        let a = !1;
        if (Be(t.position) && (i.position = Be(t.position), a = !0), (Be(t.rotation) || Ee(t.rotationY) !== void 0) && (i.rotation = ei(t), a = !0), Be(t.scale) && (i.scale = Be(t.scale), a = !0), Ee(t.uniformScale) !== void 0) {
          if (Ee(t.uniformScale) <= 0) throw new $("INVALID_PARAMS", "uniformScale must be greater than 0");
          i.uniformScale = Ee(t.uniformScale), a = !0;
        }
        if (!a) throw new $("INVALID_PARAMS", "set_transform has nothing to change");
        o.affected.add(i.id);
        return;
      }
    case "set_part":
      {
        const i = Tt(n.codeModels, Mn(o, Qt(s, "id")), "code model"),
          a = Qt(t.part, "part");
        if (!i.parts.includes(a)) throw new $("OBJECT_NOT_FOUND", `part not found: ${a}`);
        const l = {
          ...(i.partOverrides ?? {})
        };
        if (t.reset === !0) delete l[a];else {
          const d = {};
          if (typeof t.visible == "boolean" && (d.visible = t.visible), Be(t.position) && (d.position = Be(t.position)), Be(t.rotation) && (d.rotation = Be(t.rotation)), Be(t.scale) && (d.scale = Be(t.scale)), !Object.keys(d).length) throw new $("INVALID_PARAMS", "set_part has nothing to change");
          l[a] = {
            ...l[a],
            ...d
          };
        }
        i.partOverrides = l, o.affected.add(i.id);
        return;
      }
    case "rename":
      {
        const i = me(t.label).slice(0, 40);
        if (!i) throw new $("INVALID_PARAMS", "rename requires label");
        const a = Bn(o, Qt(s, "id"), ["character", "prop", "codeModel", "camPath"]);
        a.label = i, o.affected.add(a.id);
        return;
      }
    case "remove":
      {
        const i = Bn(o, Qt(s, "id"));
        Zg(o, i.id), o.affected.add(i.id);
        return;
      }
    default:
      throw new $("UNKNOWN_OPERATION", `unknown operation type: ${e}`);
  }
}
function e0(o, e) {
  var s;
  if (!me(e.description)) throw new $("INVALID_PARAMS", "description is required");
  if (!Array.isArray(e.operations) || !e.operations.length || e.operations.length > 50) throw new $("INVALID_PARAMS", "operations must contain 1-50 items");
  const t = Xg(o),
    n = [];
  for (const [r, i] of e.operations.entries()) {
    const a = i && typeof i == "object" ? me(i.type) : "";
    try {
      if (!i || typeof i != "object" || !a) throw new $("INVALID_PARAMS", "operation must be an object with type");
      const l = Jg(t, a, i);
      t.created.push((l == null ? void 0 : l.id) ?? null), n.push({
        index: r,
        type: a,
        ok: !0,
        detail: "valid",
        ...(l != null && l.id ? {
          id: l.id
        } : {}),
        ...((s = l == null ? void 0 : l.warnings) != null && s.length ? {
          warnings: l.warnings
        } : {})
      });
    } catch (l) {
      t.created.push(null);
      const d = l instanceof $ ? l : new $("ACTION_FAILED", l instanceof Error ? l.message : String(l));
      return n.push({
        index: r,
        type: a || "?",
        ok: !1,
        code: d.code,
        detail: d.message,
        ...(d.candidates ? {
          candidates: d.candidates
        } : {})
      }), {
        ok: !1,
        validateOnly: !!e.validateOnly,
        applied: 0,
        failed: 1,
        rolledBack: !1,
        results: n,
        affectedIds: [],
        summary: $s(o),
        note: "Validation failed; the scene was not changed."
      };
    }
  }
  return {
    ok: !0,
    validateOnly: !!e.validateOnly,
    applied: e.validateOnly ? 0 : n.length,
    failed: 0,
    rolledBack: !1,
    results: n,
    affectedIds: [...t.affected],
    summary: $s(t.comp),
    ...(e.validateOnly ? {} : {
      nextComposition: t.comp
    })
  };
}
const dn = o => typeof o == "number" && Number.isFinite(o),
  kn = o => !!o && dn(o.x) && dn(o.y) && dn(o.z);
function t0(o) {
  var u, h, m, f;
  const e = [],
    t = [...o.characters.map(p => ({
      ...p,
      kind: "character"
    })), ...o.props.map(p => ({
      ...p,
      kind: "prop"
    })), ...o.cameras.map(p => ({
      ...p,
      kind: "camera"
    })), ...(o.models ?? []).map(p => ({
      ...p,
      kind: "model"
    })), ...(o.codeModels ?? []).map(p => ({
      ...p,
      kind: "codeModel"
    })), ...(o.camPaths ?? []).map(p => ({
      ...p,
      kind: "camPath"
    })), ...(o.customMotions ?? []).map(p => ({
      ...p,
      kind: "motion"
    })), ...o.characterGroups.map(p => ({
      ...p,
      kind: "group"
    })), ...(((u = o.camTimeline) == null ? void 0 : u.tracks) ?? []).map(p => ({
      ...p,
      kind: "track"
    })), ...(((h = o.camTimeline) == null ? void 0 : h.tracks.flatMap(p => p.clips.map(x => ({
      ...x,
      kind: "clip"
    })))) ?? [])],
    n = new Map();
  for (const p of t) n.set(p.id, [...(n.get(p.id) ?? []), p]);
  for (const [p, x] of n) x.length > 1 && e.push({
    code: "DUPLICATE_ID",
    severity: "error",
    detail: `id ${p} is used by ${x.map(g => g.kind).join(", ")}`,
    ids: [p]
  });
  const s = new Set([...o.characters, ...o.props].map(p => p.id)),
    r = new Set([...o.characters, ...o.props, ...(o.models ?? []), ...(o.codeModels ?? [])].map(p => p.id)),
    i = new Set(o.characters.map(p => p.id)),
    a = new Set((o.camPaths ?? []).map(p => p.id));
  for (const p of o.characterGroups) for (const x of Ge(p)) s.has(x) || e.push({
    code: "GROUP_MEMBER_INVALID",
    severity: "error",
    detail: `group ${p.id} references a missing or non-movable member ${x}`,
    ids: [p.id, x]
  });
  const l = [...o.characters, ...o.props, ...(o.models ?? []), ...(o.codeModels ?? [])];
  for (const p of l) !kn(p.position) || !kn(p.rotation) || !kn(p.scale) || !dn(p.uniformScale) ? e.push({
    code: "INVALID_TRANSFORM",
    severity: "error",
    detail: `${p.id} has a non-finite transform`,
    ids: [p.id]
  }) : (p.scale.x === 0 || p.scale.y === 0 || p.scale.z === 0 || p.uniformScale <= 0) && e.push({
    code: "INVALID_SCALE",
    severity: "error",
    detail: `${p.id} has a zero/negative scale`,
    ids: [p.id]
  });
  for (const p of o.cameras) (!kn(p.position) || !kn(p.lookAt) || !dn(p.fov) || p.fov < 10 || p.fov > 120) && e.push({
    code: "INVALID_CAMERA",
    severity: "error",
    detail: `camera ${p.id} has invalid position/lookAt/fov`,
    ids: [p.id]
  }), p.lookAtTarget && p.lookAtTarget !== Ne && !r.has(p.lookAtTarget) && e.push({
    code: "CAMERA_TARGET_MISSING",
    severity: "error",
    detail: `camera ${p.id} references missing look target ${p.lookAtTarget}`,
    ids: [p.id, p.lookAtTarget]
  });
  for (const p of o.camPaths ?? []) (!dn(p.duration) || p.duration <= 0) && e.push({
    code: "INVALID_PATH_DURATION",
    severity: "error",
    detail: `path ${p.id} has invalid duration`,
    ids: [p.id]
  }), p.points.length < 2 && e.push({
    code: "PATH_TOO_SHORT",
    severity: "error",
    detail: `path ${p.id} needs at least 2 points`,
    ids: [p.id]
  }), p.points.some(x => !kn(x.position) || !kn(x.in) || !kn(x.out)) && e.push({
    code: "INVALID_PATH_POINT",
    severity: "error",
    detail: `path ${p.id} has non-finite control points`,
    ids: [p.id]
  }), p.points.some(x => dn(x.position.y) && x.position.y < 0) && e.push({
    code: "PATH_UNDERGROUND",
    severity: "warning",
    detail: `path ${p.id} contains a point below y=0`,
    ids: [p.id]
  }), p.lookAtTarget && p.lookAtTarget !== Ne && !r.has(p.lookAtTarget) && e.push({
    code: "PATH_TARGET_MISSING",
    severity: "error",
    detail: `path ${p.id} references missing look target ${p.lookAtTarget}`,
    ids: [p.id, p.lookAtTarget]
  });
  for (const p of ((m = o.camTimeline) == null ? void 0 : m.tracks) ?? []) {
    const x = Ht(p);
    x === "anim" && (!p.targetId || !i.has(p.targetId)) && e.push({
      code: "INVALID_ANIM_TARGET",
      severity: "error",
      detail: `anim track ${p.id} has a missing/non-character target`,
      ids: [p.id, ...(p.targetId ? [p.targetId] : [])]
    }), x === "object" && p.targetId && !s.has(p.targetId) && e.push({
      code: "INVALID_OBJECT_TARGET",
      severity: "error",
      detail: `object track ${p.id} references a missing or non-movable target ${p.targetId}`,
      ids: [p.id, p.targetId]
    });
    const g = [...p.clips].sort((w, v) => w.start - v.start);
    for (const w of g) (!dn(w.start) || !dn(w.duration) || w.start < 0 || w.duration <= 0) && e.push({
      code: "INVALID_CLIP_TIMING",
      severity: "error",
      detail: `clip ${w.id} has invalid timing`,
      ids: [p.id, w.id]
    }), (x === "anim" ? !!Vt(w.pathId, o.customMotions) : a.has(w.pathId)) || e.push({
      code: "CLIP_REFERENCE_MISSING",
      severity: "error",
      detail: `clip ${w.id} references missing ${x === "anim" ? "motion" : "path"} ${w.pathId}`,
      ids: [p.id, w.id, w.pathId]
    });
    const b = g.filter(w => w.enabled !== !1);
    for (let w = 1; w < b.length; w += 1) {
      if (b[w].start >= b[w - 1].start + b[w - 1].duration) continue;
      const v = b[w].pathId === b[w - 1].pathId;
      e.push(v ? {
        code: "CLIP_DUPLICATE",
        severity: "error",
        detail: `clips ${b[w - 1].id} and ${b[w].id} on track ${p.id} overlap with the same source ${b[w].pathId}; remove the extra clip`,
        ids: [p.id, b[w - 1].id, b[w].id]
      } : {
        code: "CLIP_OVERLAP",
        severity: "warning",
        detail: `clips ${b[w - 1].id} and ${b[w].id} overlap on track ${p.id}`,
        ids: [p.id, b[w - 1].id, b[w].id]
      });
    }
  }
  const d = new Set((((f = o.camTimeline) == null ? void 0 : f.tracks) ?? []).flatMap(p => Ht(p) === "anim" ? [] : p.clips.map(x => x.pathId)));
  for (const p of o.camPaths ?? []) d.has(p.id) || e.push({
    code: "UNREFERENCED_PATH",
    severity: "warning",
    detail: `path ${p.id} (${p.label || "unnamed"}) is not referenced by any timeline clip; remove it if it is a leftover from a correction loop`,
    ids: [p.id]
  });
  return {
    ok: !0,
    clean: !e.some(p => p.severity === "error"),
    issues: e,
    summary: $s(o)
  };
}
function Td(o) {
  if (o == null || o === "auto" || o === "Auto") return null;
  if (typeof o == "number" && Number.isFinite(o) && o >= 0.25 && o <= 4) return o;
  if (typeof o == "string") {
    const e = /^(\d+(?:\.\d+)?):(\d+(?:\.\d+)?)$/.exec(o.trim());
    if (e) {
      const t = Number(e[1]) / Number(e[2]);
      if (t >= 0.25 && t <= 4) return t;
    }
  }
  throw new $("INVALID_PARAMS", "aspect must be auto, a ratio such as 16:9, or a number between 0.25 and 4");
}
function Pd(o) {
  return new Promise((e, t) => {
    const n = new Image();
    n.onload = () => e(n), n.onerror = () => t(new $("CAPTURE_FAILED", "captured JPEG could not be decoded")), n.src = o;
  });
}
async function Id(o) {
  const e = await Pd(o);
  return {
    width: e.naturalWidth,
    height: e.naturalHeight
  };
}
const Zl = 8,
  Jl = 3,
  n0 = 4,
  s0 = 960;
function o0(o, e) {
  if (!Array.isArray(o) || o.length === 0) throw new $("INVALID_PARAMS", "atTimes must be a non-empty array of timeline milliseconds");
  if (o.length > Zl) throw new $("INVALID_PARAMS", `atTimes supports at most ${Zl} entries per call`);
  return o.map(t => {
    if (typeof t != "number" || !Number.isFinite(t)) throw new $("INVALID_PARAMS", "atTimes entries must be finite numbers (milliseconds)");
    return Math.min(Math.max(0, Math.round(t)), e);
  });
}
async function r0(o, e, t) {
  if (!o) throw new $("ENGINE_NOT_READY", "the 3D editor viewport is not mounted");
  const n = Td(t.aspect),
    s = Gt(e.camTimeline);
  if (s <= 0) throw new $("INVALID_PARAMS", "atTimes requires a timeline with at least one clip; this scene's timeline is empty");
  const r = o0(t.atTimes, s);
  let i = null;
  if (t.cameraId && (i = Tt(e.cameras, t.cameraId, "camera")), o.hasCameraDriver) {
    const u = new Error("timeline preview or virtual camera is driving the viewport; stop playback first");
    throw u.code = "busy", u;
  }
  const a = {
      drive: (u, h, m) => o.driveObject(u, h, m),
      setDriven: u => o.setDrivenObjects(u),
      drivePose: (u, h, m) => o.drivePose(u, h, m),
      setPoseDriven: u => o.setPoseDrivenObjects(u)
    },
    l = [];
  let d = null;
  try {
    await o.waitForSceneReady(), d = nd(o.camera);
    const u = new Po(e.camTimeline, e.camPaths ?? [], h => o.getObjectCenter(h), o.camera.fov, null, a, e.customMotions);
    for (const h of r) {
      u.applyAt(h, o.camera);
      const m = o.captureCamera(i, n);
      if (!m) throw new $("CAPTURE_FAILED", "the viewport has no renderable size or returned an empty frame");
      const f = await Id(m);
      l.push({
        tMs: h,
        dataUrl: m,
        ...f
      });
    }
  } catch (u) {
    throw u instanceof $ ? u : new $("CAPTURE_FAILED", u instanceof Error ? u.message : String(u));
  } finally {
    o.clearDrivenObjects(), d && (sd(o.camera, d), o.retargetOrbitPivot());
  }
  return {
    frames: l,
    durationMs: s,
    view: i ? "camera" : "timeline",
    cameraId: (i == null ? void 0 : i.id) ?? null
  };
}
function i0(o, e = n0) {
  if (o.length === 0) return [];
  const t = Math.ceil(o.length / e),
    n = Math.floor(o.length / t),
    s = o.length % t,
    r = [];
  let i = 0;
  for (let a = 0; a < t; a += 1) {
    const l = n + (a < s ? 1 : 0);
    r.push(o.slice(i, i + l)), i += l;
  }
  return r;
}
async function a0(o) {
  const e = [];
  for (const t of i0(o)) {
    const n = Math.max(1, ...t.map(p => p.width)),
      s = Math.max(1, ...t.map(p => p.height)),
      r = Math.min(n, s0),
      i = Math.max(1, Math.round(r * (s / n))),
      a = t.length <= 2 ? t.length : 2,
      l = Math.ceil(t.length / a),
      d = Math.max(4, Math.round(r * 0.008)),
      u = document.createElement("canvas");
    u.width = a * r + (a + 1) * d, u.height = l * i + (l + 1) * d;
    const h = u.getContext("2d");
    if (!h) throw new $("CAPTURE_FAILED", "2d canvas context unavailable for timeline sheet composition; retry with layout:'separate'");
    h.fillStyle = "#3a3a3e", h.fillRect(0, 0, u.width, u.height);
    const m = Math.max(20, Math.round(r * 0.035)),
      f = [];
    for (const p of t) {
      const x = await Pd(p.dataUrl),
        g = f.length,
        b = Math.floor(g / a),
        w = g % a,
        v = d + w * (r + d),
        E = d + b * (i + d);
      h.drawImage(x, v, E, r, i);
      const T = `t=${p.tMs}ms`;
      h.font = `bold ${m}px system-ui, sans-serif`;
      const P = Math.round(m * 0.5),
        C = Math.round(m * 0.3),
        M = h.measureText(T).width;
      h.fillStyle = "rgba(20, 20, 24, 0.82)", h.fillRect(v, E, M + P * 2, m + C * 2), h.fillStyle = "#ffffff", h.textBaseline = "middle", h.fillText(T, v + P, E + C + m / 2), f.push({
        tMs: p.tMs,
        row: b,
        col: w
      });
    }
    e.push({
      dataUrl: u.toDataURL("image/jpeg", 0.9),
      width: u.width,
      height: u.height,
      cells: f
    });
  }
  return e;
}
async function l0(o, e, t) {
  if (!o) throw new $("ENGINE_NOT_READY", "the 3D editor viewport is not mounted");
  const n = Td(t.aspect);
  let s = null;
  t.cameraId && (s = Tt(e.cameras, t.cameraId, "camera"));
  let r = "";
  try {
    await o.waitForSceneReady(), r = o.captureCamera(s, n);
  } catch (a) {
    throw a instanceof $ ? a : new $("CAPTURE_FAILED", a instanceof Error ? a.message : String(a));
  }
  if (!r) throw new $("CAPTURE_FAILED", "the viewport has no renderable size or returned an empty frame");
  const i = await Id(r);
  return {
    dataUrl: r,
    ...i,
    view: s ? "camera" : "current",
    cameraId: (s == null ? void 0 : s.id) ?? null
  };
}
const ec = ["front", "back", "left", "right", "top", "three_quarter", "three_quarter_back"],
  tc = (o, e) => {
    if (!o || typeof o != "object") return e;
    const t = o;
    return [t.x, t.y, t.z].every(n => typeof n == "number" && Number.isFinite(n)) ? {
      x: t.x,
      y: t.y,
      z: t.z
    } : e;
  },
  c0 = o => Math.round(o * 1e3) / 1e3;
async function Ss(o) {
  return (await fetch(o)).blob();
}
function Ro(o, e = "handler_error") {
  const t = new Error(o);
  throw t.code = e, t;
}
function d0(o) {
  throw o instanceof $ && Ro(o.message, o.code), o;
}
function u0(o, e) {
  const t = e ?? {
      committed: o().store.present,
      revision: 0,
      writeBusy: !1,
      captureBusy: !1
    },
    n = (r, i) => {
      const a = r.historySnapshot().present;
      a !== t.committed && (t.committed = a, t.revision += 1, i == null || i.sync(a));
    },
    s = async r => {
      (t.writeBusy || t.captureBusy) && Ro("another scene write or capture is still running; retry after it settles", "busy"), t.writeBusy = !0;
      try {
        const {
          store: i,
          engine: a
        } = o();
        return n(i, a), await r(i, a);
      } finally {
        t.writeBusy = !1;
      }
    };
  return async ({
    method: r,
    args: i
  }) => {
    var d, u, h, m, f;
    const a = i ?? {},
      l = o();
    !t.writeBusy && !t.captureBusy && n(l.store, l.engine), (d = l.onActivity) == null || d.call(l, {
      method: r,
      modelId: typeof a.id == "string" ? a.id : void 0
    });
    try {
      switch (r) {
        case "scene.get":
          return Vg(t.committed, o().store.selectedIds, t.revision);
        case "scene.diagnostics":
          return t0(t.committed);
        case "scene.edit":
          return s((p, x) => {
            const g = e0(t.committed, {
              description: typeof a.description == "string" ? a.description : "",
              operations: Array.isArray(a.operations) ? a.operations : [],
              validateOnly: a.validateOnly === !0
            });
            g.ok && g.nextComposition && (t.committed = g.nextComposition, t.revision += 1, p.applyComposition(g.nextComposition), x == null || x.sync(g.nextComposition));
            const {
              nextComposition: b,
              ...w
            } = g;
            return {
              ...w,
              revision: t.revision
            };
          });
        case "scene.history":
          return s((p, x) => {
            const g = a.action === "redo" ? "redo" : a.action === "undo" ? "undo" : null;
            if (!g) throw new $("INVALID_PARAMS", "action must be undo or redo");
            const b = Math.min(20, Math.max(1, typeof a.steps == "number" && Number.isFinite(a.steps) ? Math.floor(a.steps) : 1)),
              w = p.stepHistory(g, b),
              v = p.historySnapshot();
            return t.committed = v.present, w > 0 && (t.revision += 1, x == null || x.sync(v.present)), {
              ok: !0,
              action: g,
              stepsTaken: w,
              canUndo: v.canUndo,
              canRedo: v.canRedo,
              undoDepth: v.undoDepth,
              redoDepth: v.redoDepth,
              summary: $s(v.present),
              revision: t.revision
            };
          });
        case "scene.snapshot":
          {
            (t.captureBusy || t.writeBusy) && Ro("another scene write or capture is still running", "busy");
            const p = a.layout;
            if (p !== void 0 && p !== "sheet" && p !== "separate") throw new $("INVALID_PARAMS", "layout must be 'sheet' (default) or 'separate'");
            if (p !== void 0 && a.atTimes === void 0) throw new $("INVALID_PARAMS", "layout only applies to atTimes timeline captures; a plain snapshot is already one full-resolution frame");
            if (p === "separate" && Array.isArray(a.atTimes) && a.atTimes.length > Jl) throw new $("INVALID_PARAMS", `layout:'separate' returns full-resolution single frames for close inspection of a few suspicious beats and allows at most ${Jl} atTimes per call; survey more beats with the default contact sheet first`);
            t.captureBusy = !0;
            const x = t.revision,
              g = t.committed;
            try {
              if (a.atTimes !== void 0) {
                const v = await r0(o().engine, g, {
                  atTimes: a.atTimes,
                  cameraId: typeof a.cameraId == "string" ? a.cameraId : void 0,
                  aspect: a.aspect
                });
                if (p === "separate") {
                  const T = [];
                  for (const P of v.frames) {
                    const C = await _s(await Ss(P.dataUrl), `scene-${x}-t${P.tMs}-${Date.now()}.jpg`);
                    if (!C) throw new $("UPLOAD_FAILED", "snapshot upload failed (host staging unavailable)");
                    T.push({
                      tMs: P.tMs,
                      path: C,
                      width: P.width,
                      height: P.height
                    });
                  }
                  return {
                    ok: !0,
                    frames: T,
                    durationMs: v.durationMs,
                    view: v.view,
                    cameraId: v.cameraId,
                    revision: x,
                    hint: "Full-resolution single frames for close inspection. Open EVERY returned JPEG with a media/vision tool; returned paths alone are not visual inspection."
                  };
                }
                const E = [];
                for (const T of await a0(v.frames)) {
                  const P = ((u = T.cells[0]) == null ? void 0 : u.tMs) ?? 0,
                    C = ((h = T.cells[T.cells.length - 1]) == null ? void 0 : h.tMs) ?? 0,
                    M = await _s(await Ss(T.dataUrl), `scene-${x}-sheet-t${P}-t${C}-${Date.now()}.jpg`);
                  if (!M) throw new $("UPLOAD_FAILED", "snapshot upload failed (host staging unavailable)");
                  E.push({
                    path: M,
                    width: T.width,
                    height: T.height,
                    cells: T.cells
                  });
                }
                return {
                  ok: !0,
                  sheets: E,
                  frameCount: v.frames.length,
                  durationMs: v.durationMs,
                  view: v.view,
                  cameraId: v.cameraId,
                  revision: x,
                  hint: "Each sheet is one JPEG whose labeled cells (t=…ms) are timeline beats in time order. Open EVERY sheet with a media/vision tool, review cells in order, and compare adjacent cells for continuity (sliding, teleports, pose pops). Cells are downscaled: re-capture any suspicious beat with layout:'separate' for full-resolution frames before judging fine detail."
                };
              }
              const b = await l0(o().engine, g, {
                  cameraId: typeof a.cameraId == "string" ? a.cameraId : void 0,
                  aspect: a.aspect
                }),
                w = await _s(await Ss(b.dataUrl), `scene-${x}-${Date.now()}.jpg`);
              if (!w) throw new $("UPLOAD_FAILED", "snapshot upload failed (host staging unavailable)");
              return {
                ok: !0,
                path: w,
                width: b.width,
                height: b.height,
                view: b.view,
                cameraId: b.cameraId,
                revision: x,
                hint: "Open this JPEG with a media/vision tool; returning a path does not mean it has been visually inspected."
              };
            } finally {
              t.captureBusy = !1;
            }
          }
        case "motion.read":
          {
            const p = typeof a.id == "string" ? a.id.trim() : "";
            if (!p) throw new $("INVALID_PARAMS", "id is required");
            const x = t.committed.customMotions ?? [],
              g = x.length ? (() => {
                try {
                  return Tt(x, p, "motion");
                } catch (w) {
                  if (vi(p)) return;
                  throw w;
                }
              })() : void 0,
              b = Vt((g == null ? void 0 : g.id) ?? p, x);
            if (!b) throw new $("OBJECT_NOT_FOUND", `motion not found: ${p}; built-ins: ${Qo.map(w => w.id).join(", ")}`);
            return {
              ok: !0,
              id: b.id,
              builtin: vi(b.id),
              label: (g == null ? void 0 : g.label) ?? b.label ?? null,
              loop: b.loop,
              cycleMs: b.cycleMs,
              defaultMs: b.defaultMs,
              source: b.source,
              warnings: b.warnings.map(w => `L${w.line} [${w.step}] ${w.joint}: ${w.action} ${w.requested} clamped to ${w.clamped}`)
            };
          }
        case "campath.read":
          {
            const p = typeof a.id == "string" ? a.id.trim() : "";
            if (!p) throw new $("INVALID_PARAMS", "id is required");
            const x = Tt(t.committed.camPaths ?? [], p, "camera path"),
              g = x.lookAtTarget === Ne;
            return {
              ok: !0,
              id: x.id,
              label: x.label,
              durationMs: x.duration,
              easing: x.easing ?? "linear",
              loopMode: x.loopMode ?? "once",
              lookAtTarget: x.lookAtTarget && !g ? x.lookAtTarget : null,
              lookAt: g || !x.lookAtTarget ? x.lookAt ?? null : null,
              points: x.points.length,
              recordedRot: x.recorded && x.recorded.rot ? x.recorded.rot.length : 0,
              source: x.source ?? null,
              ...(x.source ? {} : {
                waypoints: x.points.map(b => Sd(b.position))
              })
            };
          }
        case "model.generate":
          return s((p, x) => {
            const g = a.code;
            if (typeof g != "string" || !g.trim()) throw new $("INVALID_PARAMS", "code is required");
            let b;
            try {
              b = Fi(g);
            } catch (M) {
              throw M instanceof Zt ? new $("ACTION_FAILED", `[${M.phase}] ${M.message}`) : M;
            }
            const w = t.committed.codeModels ?? [],
              v = typeof a.id == "string" && a.id ? Tt(w, a.id, "code model") : void 0,
              E = (v == null ? void 0 : v.position) ?? tc(a.position) ?? {
                x: c0(w.length * (Math.max(b.bbox.size[0], 1) + 1.2)),
                y: 0,
                z: 0
              },
              T = {
                id: (v == null ? void 0 : v.id) ?? $e(),
                label: typeof a.label == "string" && a.label.trim() ? a.label.trim().slice(0, 40) : (v == null ? void 0 : v.label) ?? `AI模型${w.length + 1}`,
                code: g,
                parts: b.parts,
                partOverrides: v ? Object.fromEntries(Object.entries(v.partOverrides ?? {}).filter(([M]) => b.parts.includes(M))) : void 0,
                position: tc(a.position, E),
                rotation: (v == null ? void 0 : v.rotation) ?? {
                  x: 0,
                  y: 0,
                  z: 0
                },
                scale: (v == null ? void 0 : v.scale) ?? {
                  x: 1,
                  y: 1,
                  z: 1
                },
                uniformScale: (v == null ? void 0 : v.uniformScale) ?? 1,
                visible: !0,
                locked: !1,
                shadowEnabled: !0,
                referencePath: typeof a.referencePath == "string" && a.referencePath ? a.referencePath : v == null ? void 0 : v.referencePath
              },
              P = structuredClone(t.committed);
            P.codeModels ?? (P.codeModels = []);
            const C = P.codeModels.findIndex(M => M.id === T.id);
            return C < 0 ? P.codeModels.push(T) : P.codeModels[C] = T, t.committed = P, t.revision += 1, p.applyComposition(P), x == null || x.sync(P), x == null || x.focusObject(T.id), {
              ok: !0,
              id: T.id,
              label: T.label,
              replaced: !!v,
              parts: b.parts,
              partDetails: b.partDetails,
              bbox: b.bbox,
              stats: b.stats,
              warnings: b.warnings,
              revision: t.revision,
              hint: "Check partDetails against your layout spec (axes, contacts, symmetry), then call model.capture and inspect its images before claiming visual fidelity."
            };
          });
        case "model.capture":
          {
            const p = t.committed.codeModels ?? [],
              x = typeof a.id == "string" && a.id ? Tt(p, a.id, "code model") : p[0];
            if (!x) throw new $("OBJECT_NOT_FOUND", "code model not found");
            const b = (Array.isArray(a.views) ? a.views : ["front", "three_quarter", "left", "top"]).filter(T => ec.includes(T));
            if (!b.length) throw new $("INVALID_PARAMS", `views must include: ${ec.join(", ")}`);
            const w = typeof a.size == "number" ? Math.min(1280, Math.max(256, Math.floor(a.size))) : 768;
            if (a.layout === "separate") {
              if (b.length > 2) throw new $("INVALID_PARAMS", "layout:'separate' is for feeding model.compare only and allows at most 2 views per call; use the default grid contact sheet for multi-view visual review");
              const T = Ef(x.code, b, w, x.partOverrides),
                P = [];
              for (const C of T) {
                const M = await _s(await Ss(C.dataUrl), `codemodel-${x.id.slice(0, 8)}-${C.view}-${Date.now()}.jpg`);
                if (!M) throw new $("UPLOAD_FAILED", "capture upload failed");
                P.push({
                  view: C.view,
                  path: M
                });
              }
              return {
                ok: !0,
                id: x.id,
                captures: P,
                referencePath: x.referencePath ?? null
              };
            }
            const v = jf(x.code, b, w, x.partOverrides),
              E = await _s(await Ss(v.dataUrl), `codemodel-${x.id.slice(0, 8)}-sheet-${Date.now()}.jpg`);
            if (!E) throw new $("UPLOAD_FAILED", "capture upload failed");
            return {
              ok: !0,
              id: x.id,
              path: E,
              width: v.width,
              height: v.height,
              grid: v.cells,
              referencePath: x.referencePath ?? null,
              hint: "Single contact-sheet JPEG; every labeled cell is one canonical view. Open it with a media/vision tool and review EVERY cell — all cells must be self-consistent with the intended layout."
            };
          }
        case "model.compare":
          {
            const p = typeof a.renderPath == "string" ? a.renderPath : "",
              x = typeof a.referencePath == "string" ? a.referencePath : "";
            if (!p || !x) throw new $("INVALID_PARAMS", "renderPath and referencePath are required");
            const g = await Ac();
            if (!(g != null && g.ready)) throw new $("ACTION_FAILED", `python env not ready: ${(g == null ? void 0 : g.error) ?? "unavailable"}`);
            const b = await Mc({
              script: "gates/compare_render.py",
              args: ["--json"],
              inputPaths: [p, x],
              timeoutMs: 6e4
            });
            if (!(b != null && b.ok) || b.exitCode !== 0) throw new $("ACTION_FAILED", `compare failed: ${(b == null ? void 0 : b.stderr.slice(0, 800)) || (b == null ? void 0 : b.stdout.slice(0, 800))}`);
            try {
              return JSON.parse(b.stdout);
            } catch {
              throw new $("ACTION_FAILED", "compare returned non-JSON");
            }
          }
        default:
          Ro(`unknown method: ${r}`);
      }
    } catch (p) {
      d0(p);
    } finally {
      (f = (m = o()).onActivity) == null || f.call(m, null);
    }
  };
}
function h0(o, e, t) {
  const n = k.useRef({
    store: o,
    engine: e,
    onActivity: t
  });
  n.current = {
    store: o,
    engine: e,
    onActivity: t
  };
  const s = k.useRef({
    committed: o.present,
    revision: 0,
    writeBusy: !1,
    captureBusy: !1
  });
  !s.current.writeBusy && s.current.committed !== o.present && (s.current.committed = o.present, s.current.revision += 1), k.useEffect(() => {
    window.__dxStage = n.current;
    const a = vh(u0(() => n.current, s.current));
    return () => {
      if (window.__dxStage === n.current) window.__dxStage = null;
      a(), Ha(null);
    };
  }, []);
  const r = o.present,
    i = o.selectedIds;
  k.useEffect(() => {
    if (!_h()) return;
    const a = setTimeout(() => Ha(qg(r, i)), 500);
    return () => clearTimeout(a);
  }, [r, i]);
}
const Nd = "composition",
  Rd = 1,
  Dd = "view-state",
  Ld = 1,
  p0 = 600;
let nc = Promise.resolve();
function f0(o) {
  const e = nc.then(() => Cc(Nd, o));
  return nc = e.then(() => {}, () => {}), e;
}
async function m0(o) {
  const e = {
    schemaVersion: Rd,
    savedAt: Date.now(),
    composition: o
  };
  return f0(e);
}
async function g0() {
  const o = await Ec(Nd);
  return !o || o.schemaVersion !== Rd || !o.composition ? null : o.composition;
}
async function x0() {
  const o = await Ec(Dd);
  return !o || o.schemaVersion !== Ld || !o.view ? null : o.view;
}
function Ts(o) {
  const e = {
    schemaVersion: Ld,
    savedAt: Date.now(),
    view: o
  };
  Cc(Dd, e);
}
function b0(o, e, t) {
  return t || e !== o;
}
function w0() {
  let o = null,
    e = null,
    t = !1,
    n = Promise.resolve(!0);
  const s = i => (n = m0(i), n),
    r = () => {
      if (o = null, !e) return n;
      const i = e;
      return e = null, s(i);
    };
  return {
    save(i) {
      t || (e = i, o && clearTimeout(o), o = setTimeout(() => {
        r();
      }, p0));
    },
    saveNow(i) {
      return t ? Promise.resolve(!1) : (o && clearTimeout(o), o = null, e = null, s(i));
    },
    flush() {
      return t ? Promise.resolve(!1) : (o && clearTimeout(o), r());
    },
    dispose() {
      t = !0, o && clearTimeout(o), o = null, e = null;
    }
  };
}
const sc = new R(0, 1, 0),
  en = new R(),
  oc = new R(),
  ni = new ve(),
  ko = new R(),
  si = new R();
function rc(o) {
  en.set(0, 0, -1).applyQuaternion(o);
  const e = en.x,
    t = en.z;
  return e * e + t * t < 1e-6 ? null : Math.atan2(-e, -t);
}
class y0 {
  constructor(e) {
    S(this, "moveSpeed", 2.5);
    S(this, "rotationSmoothing", 12);
    S(this, "moveAccel", 10);
    S(this, "moveDecel", 20);
    S(this, "onFrame");
    S(this, "engine");
    S(this, "pose", {
      q: new ve(),
      joy: [0, 0],
      elev: 0,
      hasGyro: !1,
      received: !1
    });
    S(this, "yawOffset", new ve());
    S(this, "needRecenter", !0);
    S(this, "lastPoseT", -1 / 0);
    S(this, "_active", !1);
    S(this, "suspended", !1);
    S(this, "smoothedQ", new ve());
    S(this, "hasSmoothedQ", !1);
    S(this, "vel", new R());
    this.engine = e;
  }
  get active() {
    return this._active;
  }
  activate() {
    this._active || (this._active = !0, this.needRecenter = !0, this.lastPoseT = -1 / 0, this.pose.received = !1, this.pose.joy = [0, 0], this.pose.elev = 0, this.engine.setCamIndicatorsVisible(!1), this.attach());
  }
  deactivate() {
    this._active && (this._active = !1, this.engine.retargetOrbitPivot(), this.engine.setCameraDriver(null), this.engine.setCamIndicatorsVisible(!0));
  }
  attach() {
    this._active && (this.suspended = !1, this.hasSmoothedQ = !1, this.vel.set(0, 0, 0), this.engine.setCameraDriver(e => this.drive(e)));
  }
  suspend() {
    this.suspended = !0;
  }
  updatePose(e) {
    e.t <= this.lastPoseT && this.lastPoseT - e.t <= 2e3 || (this.lastPoseT = e.t, this.pose.q.set(e.q[0], e.q[1], e.q[2], e.q[3]), this.pose.joy = e.joy, this.pose.elev = e.elev, this.pose.hasGyro = e.gyro, this.pose.received = !0, this.needRecenter && e.gyro && (this.recenter(), this.needRecenter = !1));
  }
  setFov(e) {
    const t = this.engine.camera,
      n = ke.clamp(e, 10, 120);
    Math.abs(n - t.fov) < 0.001 || (t.fov = n, t.updateProjectionMatrix());
  }
  recenter() {
    const e = rc(this.engine.camera.quaternion) ?? 0,
      t = rc(this.pose.q) ?? 0;
    this.yawOffset.setFromAxisAngle(sc, e - t);
  }
  drive(e) {
    var d;
    if (this.suspended) return;
    const t = this.engine.camera,
      n = Math.min(e / 1e3, 0.1);
    this.pose.received && this.pose.hasGyro && (ni.copy(this.yawOffset).multiply(this.pose.q), !this.hasSmoothedQ || this.rotationSmoothing <= 0 ? (this.smoothedQ.copy(ni), this.hasSmoothedQ = !0) : this.smoothedQ.slerp(ni, 1 - Math.exp(-this.rotationSmoothing * n)), t.quaternion.copy(this.smoothedQ));
    const [s, r] = this.pose.joy;
    en.set(0, 0, -1).applyQuaternion(t.quaternion), en.y = 0, en.lengthSq() < 1e-6 && en.set(0, 0, -1), en.normalize(), oc.crossVectors(en, sc), ko.set(0, this.pose.elev * this.moveSpeed * 0.6, 0).addScaledVector(en, r * this.moveSpeed).addScaledVector(oc, s * this.moveSpeed);
    const i = ko.lengthSq() > 1e-8 ? this.moveAccel : this.moveDecel;
    si.subVectors(ko, this.vel);
    const a = si.length(),
      l = i * n;
    a <= l ? this.vel.copy(ko) : this.vel.addScaledVector(si, l / a), this.vel.lengthSq() > 1e-10 && t.position.addScaledVector(this.vel, n), (d = this.onFrame) == null || d.call(this, t, e);
  }
}
const v0 = 33,
  _0 = 5 * 6e4,
  An = o => Math.round(o * 1e4) / 1e4;
class k0 {
  constructor() {
    S(this, "onAutoStop");
    S(this, "samples", []);
    S(this, "t0", 0);
    S(this, "lastT", -1 / 0);
    S(this, "_recording", !1);
  }
  get recording() {
    return this._recording;
  }
  get elapsedMs() {
    return this._recording ? performance.now() - this.t0 : 0;
  }
  start() {
    this.samples = [], this.t0 = performance.now(), this.lastT = -1 / 0, this._recording = !0;
  }
  push(e) {
    var n;
    if (!this._recording) return;
    const t = performance.now() - this.t0;
    if (!(t - this.lastT < v0) && (this.lastT = t, this.samples.push({
      t: Math.round(t),
      p: [An(e.position.x), An(e.position.y), An(e.position.z)],
      q: [An(e.quaternion.x), An(e.quaternion.y), An(e.quaternion.z), An(e.quaternion.w)],
      fov: An(e.fov)
    }), t >= _0)) {
      const s = this.stop();
      s && ((n = this.onAutoStop) == null || n.call(this, s));
    }
  }
  stop() {
    if (!this._recording) return null;
    this._recording = !1;
    const e = this.samples;
    return this.samples = [], e.length < 2 ? null : {
      id: $e(),
      label: "",
      createdAt: Date.now(),
      duration: e[e.length - 1].t,
      sampleRate: 30,
      samples: e
    };
  }
}
const A0 = 0.05,
  M0 = 0.5 * (Math.PI / 180),
  E0 = 0.1,
  C0 = 0.2;
function Ji(o, e, t, n) {
  if (o <= 2) return Array.from({
    length: o
  }, (a, l) => l);
  const s = new Array(o).fill(!1);
  s[0] = s[o - 1] = !0;
  const r = [[0, o - 1]];
  for (; r.length;) {
    const [a, l] = r.pop(),
      d = e[l] - e[a];
    let u = 0,
      h = -1;
    for (let m = a + 1; m < l; m++) {
      const f = d > 1e-9 ? (e[m] - e[a]) / d : 0.5,
        p = t(a, l, m, f);
      p > u && (u = p, h = m);
    }
    h >= 0 && u > n && (s[h] = !0, r.push([a, h], [h, l]));
  }
  const i = [];
  for (let a = 0; a < o; a++) s[a] && i.push(a);
  return i;
}
function j0(o, e, t) {
  const n = new R();
  return Ji(o.length, t, (s, r, i, a) => (n.lerpVectors(o[s], o[r], a), n.distanceTo(o[i])), e);
}
const oi = o => ({
  x: o.x,
  y: o.y,
  z: o.z
});
function zd(o) {
  const e = o.samples.map(a => new R(a.p[0], a.p[1], a.p[2]));
  if (e.length === 0) return [];
  const t = j0(e, A0, o.samples.map(a => a.t)),
    n = t.map(a => e[a]),
    s = Math.max(1, o.duration),
    r = [],
    i = n.length;
  for (let a = 0; a < i; a++) {
    let l;
    if (i < 2) l = new R();else if (a === 0) l = new R().subVectors(n[1], n[0]).divideScalar(3);else if (a === i - 1) l = new R().subVectors(n[i - 1], n[i - 2]).divideScalar(3);else {
      l = new R().subVectors(n[a + 1], n[a - 1]).divideScalar(6);
      const d = Math.min(n[a].distanceTo(n[a - 1]), n[a].distanceTo(n[a + 1])) / 3;
      l.length() > d && l.setLength(d);
    }
    r.push({
      position: oi(n[a]),
      out: oi(l),
      in: oi(l.clone().negate()),
      tilt: 0,
      timeK: Math.min(1, o.samples[t[a]].t / s)
    });
  }
  return r;
}
const S0 = new ve(),
  T0 = new ve(),
  ic = new ve(),
  P0 = new ve();
function I0(o, e, t) {
  return Ji(e.length, o, (n, s, r, i) => (ic.slerpQuaternions(S0.fromArray(e[n]), T0.fromArray(e[s]), i), ic.angleTo(P0.fromArray(e[r]))), t);
}
function N0(o, e, t) {
  return Ji(e.length, o, (n, s, r, i) => Math.abs(e[r] - (e[n] + (e[s] - e[n]) * i)), t);
}
function R0(o) {
  const e = o.samples,
    t = e.length;
  if (t < 2) return null;
  const n = Math.max(1, o.duration),
    s = e.map(u => u.t),
    r = new Array(t);
  r[0] = [...e[0].q];
  for (let u = 1; u < t; u++) {
    const h = r[u - 1],
      m = e[u].q,
      f = h[0] * m[0] + h[1] * m[1] + h[2] * m[2] + h[3] * m[3];
    r[u] = f < 0 ? [-m[0], -m[1], -m[2], -m[3]] : [...m];
  }
  const i = u => Math.round(u * 1e6) / 1e6,
    a = I0(s, r, M0).map(u => ({
      k: i(Math.min(1, s[u] / n)),
      q: r[u]
    }));
  let l;
  const d = e.map(u => u.fov);
  return Math.max(...d) - Math.min(...d) >= C0 && (l = N0(s, d, E0).map(u => ({
    k: i(Math.min(1, s[u] / n)),
    fov: d[u]
  }))), {
    rot: a,
    ...(l ? {
      fov: l
    } : {})
  };
}
function D0(o, e) {
  const t = R0(o);
  return {
    id: $e(),
    label: o.label || Se("vc.path_prefix"),
    points: e ?? zd(o),
    duration: Math.max(100, Math.round(o.duration)),
    visible: !0,
    ...(t ? {
      recorded: t
    } : {})
  };
}
var Xs = {},
  L0 = function () {
    return typeof Promise == "function" && Promise.prototype && Promise.prototype.then;
  },
  Od = {},
  Nt = {};
let ea;
const z0 = [0, 26, 44, 70, 100, 134, 172, 196, 242, 292, 346, 404, 466, 532, 581, 655, 733, 815, 901, 991, 1085, 1156, 1258, 1364, 1474, 1588, 1706, 1828, 1921, 2051, 2185, 2323, 2465, 2611, 2761, 2876, 3034, 3196, 3362, 3532, 3706];
Nt.getSymbolSize = function (e) {
  if (!e) throw new Error('"version" cannot be null or undefined');
  if (e < 1 || e > 40) throw new Error('"version" should be in range from 1 to 40');
  return e * 4 + 17;
};
Nt.getSymbolTotalCodewords = function (e) {
  return z0[e];
};
Nt.getBCHDigit = function (o) {
  let e = 0;
  for (; o !== 0;) e++, o >>>= 1;
  return e;
};
Nt.setToSJISFunction = function (e) {
  if (typeof e != "function") throw new Error('"toSJISFunc" is not a valid function.');
  ea = e;
};
Nt.isKanjiModeEnabled = function () {
  return typeof ea < "u";
};
Nt.toSJIS = function (e) {
  return ea(e);
};
var tr = {};
(function (o) {
  o.L = {
    bit: 1
  }, o.M = {
    bit: 0
  }, o.Q = {
    bit: 3
  }, o.H = {
    bit: 2
  };
  function e(t) {
    if (typeof t != "string") throw new Error("Param is not a string");
    switch (t.toLowerCase()) {
      case "l":
      case "low":
        return o.L;
      case "m":
      case "medium":
        return o.M;
      case "q":
      case "quartile":
        return o.Q;
      case "h":
      case "high":
        return o.H;
      default:
        throw new Error("Unknown EC Level: " + t);
    }
  }
  o.isValid = function (n) {
    return n && typeof n.bit < "u" && n.bit >= 0 && n.bit < 4;
  }, o.from = function (n, s) {
    if (o.isValid(n)) return n;
    try {
      return e(n);
    } catch {
      return s;
    }
  };
})(tr);
function Hd() {
  this.buffer = [], this.length = 0;
}
Hd.prototype = {
  get: function (o) {
    const e = Math.floor(o / 8);
    return (this.buffer[e] >>> 7 - o % 8 & 1) === 1;
  },
  put: function (o, e) {
    for (let t = 0; t < e; t++) this.putBit((o >>> e - t - 1 & 1) === 1);
  },
  getLengthInBits: function () {
    return this.length;
  },
  putBit: function (o) {
    const e = Math.floor(this.length / 8);
    this.buffer.length <= e && this.buffer.push(0), o && (this.buffer[e] |= 128 >>> this.length % 8), this.length++;
  }
};
var O0 = Hd;
function Ws(o) {
  if (!o || o < 1) throw new Error("BitMatrix size must be defined and greater than 0");
  this.size = o, this.data = new Uint8Array(o * o), this.reservedBit = new Uint8Array(o * o);
}
Ws.prototype.set = function (o, e, t, n) {
  const s = o * this.size + e;
  this.data[s] = t, n && (this.reservedBit[s] = !0);
};
Ws.prototype.get = function (o, e) {
  return this.data[o * this.size + e];
};
Ws.prototype.xor = function (o, e, t) {
  this.data[o * this.size + e] ^= t;
};
Ws.prototype.isReserved = function (o, e) {
  return this.reservedBit[o * this.size + e];
};
var H0 = Ws,
  Fd = {};
(function (o) {
  const e = Nt.getSymbolSize;
  o.getRowColCoords = function (n) {
    if (n === 1) return [];
    const s = Math.floor(n / 7) + 2,
      r = e(n),
      i = r === 145 ? 26 : Math.ceil((r - 13) / (2 * s - 2)) * 2,
      a = [r - 7];
    for (let l = 1; l < s - 1; l++) a[l] = a[l - 1] - i;
    return a.push(6), a.reverse();
  }, o.getPositions = function (n) {
    const s = [],
      r = o.getRowColCoords(n),
      i = r.length;
    for (let a = 0; a < i; a++) for (let l = 0; l < i; l++) a === 0 && l === 0 || a === 0 && l === i - 1 || a === i - 1 && l === 0 || s.push([r[a], r[l]]);
    return s;
  };
})(Fd);
var Bd = {};
const F0 = Nt.getSymbolSize,
  ac = 7;
Bd.getPositions = function (e) {
  const t = F0(e);
  return [[0, 0], [t - ac, 0], [0, t - ac]];
};
var Ud = {};
(function (o) {
  o.Patterns = {
    PATTERN000: 0,
    PATTERN001: 1,
    PATTERN010: 2,
    PATTERN011: 3,
    PATTERN100: 4,
    PATTERN101: 5,
    PATTERN110: 6,
    PATTERN111: 7
  };
  const e = {
    N1: 3,
    N2: 3,
    N3: 40,
    N4: 10
  };
  o.isValid = function (s) {
    return s != null && s !== "" && !isNaN(s) && s >= 0 && s <= 7;
  }, o.from = function (s) {
    return o.isValid(s) ? parseInt(s, 10) : void 0;
  }, o.getPenaltyN1 = function (s) {
    const r = s.size;
    let i = 0,
      a = 0,
      l = 0,
      d = null,
      u = null;
    for (let h = 0; h < r; h++) {
      a = l = 0, d = u = null;
      for (let m = 0; m < r; m++) {
        let f = s.get(h, m);
        f === d ? a++ : (a >= 5 && (i += e.N1 + (a - 5)), d = f, a = 1), f = s.get(m, h), f === u ? l++ : (l >= 5 && (i += e.N1 + (l - 5)), u = f, l = 1);
      }
      a >= 5 && (i += e.N1 + (a - 5)), l >= 5 && (i += e.N1 + (l - 5));
    }
    return i;
  }, o.getPenaltyN2 = function (s) {
    const r = s.size;
    let i = 0;
    for (let a = 0; a < r - 1; a++) for (let l = 0; l < r - 1; l++) {
      const d = s.get(a, l) + s.get(a, l + 1) + s.get(a + 1, l) + s.get(a + 1, l + 1);
      (d === 4 || d === 0) && i++;
    }
    return i * e.N2;
  }, o.getPenaltyN3 = function (s) {
    const r = s.size;
    let i = 0,
      a = 0,
      l = 0;
    for (let d = 0; d < r; d++) {
      a = l = 0;
      for (let u = 0; u < r; u++) a = a << 1 & 2047 | s.get(d, u), u >= 10 && (a === 1488 || a === 93) && i++, l = l << 1 & 2047 | s.get(u, d), u >= 10 && (l === 1488 || l === 93) && i++;
    }
    return i * e.N3;
  }, o.getPenaltyN4 = function (s) {
    let r = 0;
    const i = s.data.length;
    for (let l = 0; l < i; l++) r += s.data[l];
    return Math.abs(Math.ceil(r * 100 / i / 5) - 10) * e.N4;
  };
  function t(n, s, r) {
    switch (n) {
      case o.Patterns.PATTERN000:
        return (s + r) % 2 === 0;
      case o.Patterns.PATTERN001:
        return s % 2 === 0;
      case o.Patterns.PATTERN010:
        return r % 3 === 0;
      case o.Patterns.PATTERN011:
        return (s + r) % 3 === 0;
      case o.Patterns.PATTERN100:
        return (Math.floor(s / 2) + Math.floor(r / 3)) % 2 === 0;
      case o.Patterns.PATTERN101:
        return s * r % 2 + s * r % 3 === 0;
      case o.Patterns.PATTERN110:
        return (s * r % 2 + s * r % 3) % 2 === 0;
      case o.Patterns.PATTERN111:
        return (s * r % 3 + (s + r) % 2) % 2 === 0;
      default:
        throw new Error("bad maskPattern:" + n);
    }
  }
  o.applyMask = function (s, r) {
    const i = r.size;
    for (let a = 0; a < i; a++) for (let l = 0; l < i; l++) r.isReserved(l, a) || r.xor(l, a, t(s, l, a));
  }, o.getBestMask = function (s, r) {
    const i = Object.keys(o.Patterns).length;
    let a = 0,
      l = 1 / 0;
    for (let d = 0; d < i; d++) {
      r(d), o.applyMask(d, s);
      const u = o.getPenaltyN1(s) + o.getPenaltyN2(s) + o.getPenaltyN3(s) + o.getPenaltyN4(s);
      o.applyMask(d, s), u < l && (l = u, a = d);
    }
    return a;
  };
})(Ud);
var nr = {};
const jn = tr,
  Ao = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 1, 2, 2, 4, 1, 2, 4, 4, 2, 4, 4, 4, 2, 4, 6, 5, 2, 4, 6, 6, 2, 5, 8, 8, 4, 5, 8, 8, 4, 5, 8, 11, 4, 8, 10, 11, 4, 9, 12, 16, 4, 9, 16, 16, 6, 10, 12, 18, 6, 10, 17, 16, 6, 11, 16, 19, 6, 13, 18, 21, 7, 14, 21, 25, 8, 16, 20, 25, 8, 17, 23, 25, 9, 17, 23, 34, 9, 18, 25, 30, 10, 20, 27, 32, 12, 21, 29, 35, 12, 23, 34, 37, 12, 25, 34, 40, 13, 26, 35, 42, 14, 28, 38, 45, 15, 29, 40, 48, 16, 31, 43, 51, 17, 33, 45, 54, 18, 35, 48, 57, 19, 37, 51, 60, 19, 38, 53, 63, 20, 40, 56, 66, 21, 43, 59, 70, 22, 45, 62, 74, 24, 47, 65, 77, 25, 49, 68, 81],
  Mo = [7, 10, 13, 17, 10, 16, 22, 28, 15, 26, 36, 44, 20, 36, 52, 64, 26, 48, 72, 88, 36, 64, 96, 112, 40, 72, 108, 130, 48, 88, 132, 156, 60, 110, 160, 192, 72, 130, 192, 224, 80, 150, 224, 264, 96, 176, 260, 308, 104, 198, 288, 352, 120, 216, 320, 384, 132, 240, 360, 432, 144, 280, 408, 480, 168, 308, 448, 532, 180, 338, 504, 588, 196, 364, 546, 650, 224, 416, 600, 700, 224, 442, 644, 750, 252, 476, 690, 816, 270, 504, 750, 900, 300, 560, 810, 960, 312, 588, 870, 1050, 336, 644, 952, 1110, 360, 700, 1020, 1200, 390, 728, 1050, 1260, 420, 784, 1140, 1350, 450, 812, 1200, 1440, 480, 868, 1290, 1530, 510, 924, 1350, 1620, 540, 980, 1440, 1710, 570, 1036, 1530, 1800, 570, 1064, 1590, 1890, 600, 1120, 1680, 1980, 630, 1204, 1770, 2100, 660, 1260, 1860, 2220, 720, 1316, 1950, 2310, 750, 1372, 2040, 2430];
nr.getBlocksCount = function (e, t) {
  switch (t) {
    case jn.L:
      return Ao[(e - 1) * 4 + 0];
    case jn.M:
      return Ao[(e - 1) * 4 + 1];
    case jn.Q:
      return Ao[(e - 1) * 4 + 2];
    case jn.H:
      return Ao[(e - 1) * 4 + 3];
    default:
      return;
  }
};
nr.getTotalCodewordsCount = function (e, t) {
  switch (t) {
    case jn.L:
      return Mo[(e - 1) * 4 + 0];
    case jn.M:
      return Mo[(e - 1) * 4 + 1];
    case jn.Q:
      return Mo[(e - 1) * 4 + 2];
    case jn.H:
      return Mo[(e - 1) * 4 + 3];
    default:
      return;
  }
};
var Gd = {},
  sr = {};
const Ls = new Uint8Array(512),
  $o = new Uint8Array(256);
(function () {
  let e = 1;
  for (let t = 0; t < 255; t++) Ls[t] = e, $o[e] = t, e <<= 1, e & 256 && (e ^= 285);
  for (let t = 255; t < 512; t++) Ls[t] = Ls[t - 255];
})();
sr.log = function (e) {
  if (e < 1) throw new Error("log(" + e + ")");
  return $o[e];
};
sr.exp = function (e) {
  return Ls[e];
};
sr.mul = function (e, t) {
  return e === 0 || t === 0 ? 0 : Ls[$o[e] + $o[t]];
};
(function (o) {
  const e = sr;
  o.mul = function (n, s) {
    const r = new Uint8Array(n.length + s.length - 1);
    for (let i = 0; i < n.length; i++) for (let a = 0; a < s.length; a++) r[i + a] ^= e.mul(n[i], s[a]);
    return r;
  }, o.mod = function (n, s) {
    let r = new Uint8Array(n);
    for (; r.length - s.length >= 0;) {
      const i = r[0];
      for (let l = 0; l < s.length; l++) r[l] ^= e.mul(s[l], i);
      let a = 0;
      for (; a < r.length && r[a] === 0;) a++;
      r = r.slice(a);
    }
    return r;
  }, o.generateECPolynomial = function (n) {
    let s = new Uint8Array([1]);
    for (let r = 0; r < n; r++) s = o.mul(s, new Uint8Array([1, e.exp(r)]));
    return s;
  };
})(Gd);
const $d = Gd;
function ta(o) {
  this.genPoly = void 0, this.degree = o, this.degree && this.initialize(this.degree);
}
ta.prototype.initialize = function (e) {
  this.degree = e, this.genPoly = $d.generateECPolynomial(this.degree);
};
ta.prototype.encode = function (e) {
  if (!this.genPoly) throw new Error("Encoder not initialized");
  const t = new Uint8Array(e.length + this.degree);
  t.set(e);
  const n = $d.mod(t, this.genPoly),
    s = this.degree - n.length;
  if (s > 0) {
    const r = new Uint8Array(this.degree);
    return r.set(n, s), r;
  }
  return n;
};
var B0 = ta,
  Kd = {},
  In = {},
  na = {};
na.isValid = function (e) {
  return !isNaN(e) && e >= 1 && e <= 40;
};
var tn = {};
const Vd = "[0-9]+",
  U0 = "[A-Z $%*+\\-./:]+";
let Ks = "(?:[u3000-u303F]|[u3040-u309F]|[u30A0-u30FF]|[uFF00-uFFEF]|[u4E00-u9FAF]|[u2605-u2606]|[u2190-u2195]|u203B|[u2010u2015u2018u2019u2025u2026u201Cu201Du2225u2260]|[u0391-u0451]|[u00A7u00A8u00B1u00B4u00D7u00F7])+";
Ks = Ks.replace(/u/g, "\\u");
const G0 = "(?:(?![A-Z0-9 $%*+\\-./:]|" + Ks + `)(?:.|[\r
]))+`;
tn.KANJI = new RegExp(Ks, "g");
tn.BYTE_KANJI = new RegExp("[^A-Z0-9 $%*+\\-./:]+", "g");
tn.BYTE = new RegExp(G0, "g");
tn.NUMERIC = new RegExp(Vd, "g");
tn.ALPHANUMERIC = new RegExp(U0, "g");
const $0 = new RegExp("^" + Ks + "$"),
  K0 = new RegExp("^" + Vd + "$"),
  V0 = new RegExp("^[A-Z0-9 $%*+\\-./:]+$");
tn.testKanji = function (e) {
  return $0.test(e);
};
tn.testNumeric = function (e) {
  return K0.test(e);
};
tn.testAlphanumeric = function (e) {
  return V0.test(e);
};
(function (o) {
  const e = na,
    t = tn;
  o.NUMERIC = {
    id: "Numeric",
    bit: 1,
    ccBits: [10, 12, 14]
  }, o.ALPHANUMERIC = {
    id: "Alphanumeric",
    bit: 2,
    ccBits: [9, 11, 13]
  }, o.BYTE = {
    id: "Byte",
    bit: 4,
    ccBits: [8, 16, 16]
  }, o.KANJI = {
    id: "Kanji",
    bit: 8,
    ccBits: [8, 10, 12]
  }, o.MIXED = {
    bit: -1
  }, o.getCharCountIndicator = function (r, i) {
    if (!r.ccBits) throw new Error("Invalid mode: " + r);
    if (!e.isValid(i)) throw new Error("Invalid version: " + i);
    return i >= 1 && i < 10 ? r.ccBits[0] : i < 27 ? r.ccBits[1] : r.ccBits[2];
  }, o.getBestModeForData = function (r) {
    return t.testNumeric(r) ? o.NUMERIC : t.testAlphanumeric(r) ? o.ALPHANUMERIC : t.testKanji(r) ? o.KANJI : o.BYTE;
  }, o.toString = function (r) {
    if (r && r.id) return r.id;
    throw new Error("Invalid mode");
  }, o.isValid = function (r) {
    return r && r.bit && r.ccBits;
  };
  function n(s) {
    if (typeof s != "string") throw new Error("Param is not a string");
    switch (s.toLowerCase()) {
      case "numeric":
        return o.NUMERIC;
      case "alphanumeric":
        return o.ALPHANUMERIC;
      case "kanji":
        return o.KANJI;
      case "byte":
        return o.BYTE;
      default:
        throw new Error("Unknown mode: " + s);
    }
  }
  o.from = function (r, i) {
    if (o.isValid(r)) return r;
    try {
      return n(r);
    } catch {
      return i;
    }
  };
})(In);
(function (o) {
  const e = Nt,
    t = nr,
    n = tr,
    s = In,
    r = na,
    i = 7973,
    a = e.getBCHDigit(i);
  function l(m, f, p) {
    for (let x = 1; x <= 40; x++) if (f <= o.getCapacity(x, p, m)) return x;
  }
  function d(m, f) {
    return s.getCharCountIndicator(m, f) + 4;
  }
  function u(m, f) {
    let p = 0;
    return m.forEach(function (x) {
      const g = d(x.mode, f);
      p += g + x.getBitsLength();
    }), p;
  }
  function h(m, f) {
    for (let p = 1; p <= 40; p++) if (u(m, p) <= o.getCapacity(p, f, s.MIXED)) return p;
  }
  o.from = function (f, p) {
    return r.isValid(f) ? parseInt(f, 10) : p;
  }, o.getCapacity = function (f, p, x) {
    if (!r.isValid(f)) throw new Error("Invalid QR Code version");
    typeof x > "u" && (x = s.BYTE);
    const g = e.getSymbolTotalCodewords(f),
      b = t.getTotalCodewordsCount(f, p),
      w = (g - b) * 8;
    if (x === s.MIXED) return w;
    const v = w - d(x, f);
    switch (x) {
      case s.NUMERIC:
        return Math.floor(v / 10 * 3);
      case s.ALPHANUMERIC:
        return Math.floor(v / 11 * 2);
      case s.KANJI:
        return Math.floor(v / 13);
      case s.BYTE:
      default:
        return Math.floor(v / 8);
    }
  }, o.getBestVersionForData = function (f, p) {
    let x;
    const g = n.from(p, n.M);
    if (Array.isArray(f)) {
      if (f.length > 1) return h(f, g);
      if (f.length === 0) return 1;
      x = f[0];
    } else x = f;
    return l(x.mode, x.getLength(), g);
  }, o.getEncodedBits = function (f) {
    if (!r.isValid(f) || f < 7) throw new Error("Invalid QR Code version");
    let p = f << 12;
    for (; e.getBCHDigit(p) - a >= 0;) p ^= i << e.getBCHDigit(p) - a;
    return f << 12 | p;
  };
})(Kd);
var qd = {};
const Mi = Nt,
  Yd = 1335,
  q0 = 21522,
  lc = Mi.getBCHDigit(Yd);
qd.getEncodedBits = function (e, t) {
  const n = e.bit << 3 | t;
  let s = n << 10;
  for (; Mi.getBCHDigit(s) - lc >= 0;) s ^= Yd << Mi.getBCHDigit(s) - lc;
  return (n << 10 | s) ^ q0;
};
var Xd = {};
const Y0 = In;
function gs(o) {
  this.mode = Y0.NUMERIC, this.data = o.toString();
}
gs.getBitsLength = function (e) {
  return 10 * Math.floor(e / 3) + (e % 3 ? e % 3 * 3 + 1 : 0);
};
gs.prototype.getLength = function () {
  return this.data.length;
};
gs.prototype.getBitsLength = function () {
  return gs.getBitsLength(this.data.length);
};
gs.prototype.write = function (e) {
  let t, n, s;
  for (t = 0; t + 3 <= this.data.length; t += 3) n = this.data.substr(t, 3), s = parseInt(n, 10), e.put(s, 10);
  const r = this.data.length - t;
  r > 0 && (n = this.data.substr(t), s = parseInt(n, 10), e.put(s, r * 3 + 1));
};
var X0 = gs;
const W0 = In,
  ri = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", " ", "$", "%", "*", "+", "-", ".", "/", ":"];
function xs(o) {
  this.mode = W0.ALPHANUMERIC, this.data = o;
}
xs.getBitsLength = function (e) {
  return 11 * Math.floor(e / 2) + 6 * (e % 2);
};
xs.prototype.getLength = function () {
  return this.data.length;
};
xs.prototype.getBitsLength = function () {
  return xs.getBitsLength(this.data.length);
};
xs.prototype.write = function (e) {
  let t;
  for (t = 0; t + 2 <= this.data.length; t += 2) {
    let n = ri.indexOf(this.data[t]) * 45;
    n += ri.indexOf(this.data[t + 1]), e.put(n, 11);
  }
  this.data.length % 2 && e.put(ri.indexOf(this.data[t]), 6);
};
var Q0 = xs;
const Z0 = In;
function bs(o) {
  this.mode = Z0.BYTE, typeof o == "string" ? this.data = new TextEncoder().encode(o) : this.data = new Uint8Array(o);
}
bs.getBitsLength = function (e) {
  return e * 8;
};
bs.prototype.getLength = function () {
  return this.data.length;
};
bs.prototype.getBitsLength = function () {
  return bs.getBitsLength(this.data.length);
};
bs.prototype.write = function (o) {
  for (let e = 0, t = this.data.length; e < t; e++) o.put(this.data[e], 8);
};
var J0 = bs;
const ex = In,
  tx = Nt;
function ws(o) {
  this.mode = ex.KANJI, this.data = o;
}
ws.getBitsLength = function (e) {
  return e * 13;
};
ws.prototype.getLength = function () {
  return this.data.length;
};
ws.prototype.getBitsLength = function () {
  return ws.getBitsLength(this.data.length);
};
ws.prototype.write = function (o) {
  let e;
  for (e = 0; e < this.data.length; e++) {
    let t = tx.toSJIS(this.data[e]);
    if (t >= 33088 && t <= 40956) t -= 33088;else if (t >= 57408 && t <= 60351) t -= 49472;else throw new Error("Invalid SJIS character: " + this.data[e] + `
Make sure your charset is UTF-8`);
    t = (t >>> 8 & 255) * 192 + (t & 255), o.put(t, 13);
  }
};
var nx = ws,
  Wd = {
    exports: {}
  };
(function (o) {
  var e = {
    single_source_shortest_paths: function (t, n, s) {
      var r = {},
        i = {};
      i[n] = 0;
      var a = e.PriorityQueue.make();
      a.push(n, 0);
      for (var l, d, u, h, m, f, p, x, g; !a.empty();) {
        l = a.pop(), d = l.value, h = l.cost, m = t[d] || {};
        for (u in m) m.hasOwnProperty(u) && (f = m[u], p = h + f, x = i[u], g = typeof i[u] > "u", (g || x > p) && (i[u] = p, a.push(u, p), r[u] = d));
      }
      if (typeof s < "u" && typeof i[s] > "u") {
        var b = ["Could not find a path from ", n, " to ", s, "."].join("");
        throw new Error(b);
      }
      return r;
    },
    extract_shortest_path_from_predecessor_list: function (t, n) {
      for (var s = [], r = n; r;) s.push(r), t[r], r = t[r];
      return s.reverse(), s;
    },
    find_path: function (t, n, s) {
      var r = e.single_source_shortest_paths(t, n, s);
      return e.extract_shortest_path_from_predecessor_list(r, s);
    },
    PriorityQueue: {
      make: function (t) {
        var n = e.PriorityQueue,
          s = {},
          r;
        t = t || {};
        for (r in n) n.hasOwnProperty(r) && (s[r] = n[r]);
        return s.queue = [], s.sorter = t.sorter || n.default_sorter, s;
      },
      default_sorter: function (t, n) {
        return t.cost - n.cost;
      },
      push: function (t, n) {
        var s = {
          value: t,
          cost: n
        };
        this.queue.push(s), this.queue.sort(this.sorter);
      },
      pop: function () {
        return this.queue.shift();
      },
      empty: function () {
        return this.queue.length === 0;
      }
    }
  };
  o.exports = e;
})(Wd);
var sx = Wd.exports;
(function (o) {
  const e = In,
    t = X0,
    n = Q0,
    s = J0,
    r = nx,
    i = tn,
    a = Nt,
    l = sx;
  function d(b) {
    return unescape(encodeURIComponent(b)).length;
  }
  function u(b, w, v) {
    const E = [];
    let T;
    for (; (T = b.exec(v)) !== null;) E.push({
      data: T[0],
      index: T.index,
      mode: w,
      length: T[0].length
    });
    return E;
  }
  function h(b) {
    const w = u(i.NUMERIC, e.NUMERIC, b),
      v = u(i.ALPHANUMERIC, e.ALPHANUMERIC, b);
    let E, T;
    return a.isKanjiModeEnabled() ? (E = u(i.BYTE, e.BYTE, b), T = u(i.KANJI, e.KANJI, b)) : (E = u(i.BYTE_KANJI, e.BYTE, b), T = []), w.concat(v, E, T).sort(function (C, M) {
      return C.index - M.index;
    }).map(function (C) {
      return {
        data: C.data,
        mode: C.mode,
        length: C.length
      };
    });
  }
  function m(b, w) {
    switch (w) {
      case e.NUMERIC:
        return t.getBitsLength(b);
      case e.ALPHANUMERIC:
        return n.getBitsLength(b);
      case e.KANJI:
        return r.getBitsLength(b);
      case e.BYTE:
        return s.getBitsLength(b);
    }
  }
  function f(b) {
    return b.reduce(function (w, v) {
      const E = w.length - 1 >= 0 ? w[w.length - 1] : null;
      return E && E.mode === v.mode ? (w[w.length - 1].data += v.data, w) : (w.push(v), w);
    }, []);
  }
  function p(b) {
    const w = [];
    for (let v = 0; v < b.length; v++) {
      const E = b[v];
      switch (E.mode) {
        case e.NUMERIC:
          w.push([E, {
            data: E.data,
            mode: e.ALPHANUMERIC,
            length: E.length
          }, {
            data: E.data,
            mode: e.BYTE,
            length: E.length
          }]);
          break;
        case e.ALPHANUMERIC:
          w.push([E, {
            data: E.data,
            mode: e.BYTE,
            length: E.length
          }]);
          break;
        case e.KANJI:
          w.push([E, {
            data: E.data,
            mode: e.BYTE,
            length: d(E.data)
          }]);
          break;
        case e.BYTE:
          w.push([{
            data: E.data,
            mode: e.BYTE,
            length: d(E.data)
          }]);
      }
    }
    return w;
  }
  function x(b, w) {
    const v = {},
      E = {
        start: {}
      };
    let T = ["start"];
    for (let P = 0; P < b.length; P++) {
      const C = b[P],
        M = [];
      for (let y = 0; y < C.length; y++) {
        const I = C[y],
          j = "" + P + y;
        M.push(j), v[j] = {
          node: I,
          lastCount: 0
        }, E[j] = {};
        for (let D = 0; D < T.length; D++) {
          const H = T[D];
          v[H] && v[H].node.mode === I.mode ? (E[H][j] = m(v[H].lastCount + I.length, I.mode) - m(v[H].lastCount, I.mode), v[H].lastCount += I.length) : (v[H] && (v[H].lastCount = I.length), E[H][j] = m(I.length, I.mode) + 4 + e.getCharCountIndicator(I.mode, w));
        }
      }
      T = M;
    }
    for (let P = 0; P < T.length; P++) E[T[P]].end = 0;
    return {
      map: E,
      table: v
    };
  }
  function g(b, w) {
    let v;
    const E = e.getBestModeForData(b);
    if (v = e.from(w, E), v !== e.BYTE && v.bit < E.bit) throw new Error('"' + b + '" cannot be encoded with mode ' + e.toString(v) + `.
 Suggested mode is: ` + e.toString(E));
    switch (v === e.KANJI && !a.isKanjiModeEnabled() && (v = e.BYTE), v) {
      case e.NUMERIC:
        return new t(b);
      case e.ALPHANUMERIC:
        return new n(b);
      case e.KANJI:
        return new r(b);
      case e.BYTE:
        return new s(b);
    }
  }
  o.fromArray = function (w) {
    return w.reduce(function (v, E) {
      return typeof E == "string" ? v.push(g(E, null)) : E.data && v.push(g(E.data, E.mode)), v;
    }, []);
  }, o.fromString = function (w, v) {
    const E = h(w, a.isKanjiModeEnabled()),
      T = p(E),
      P = x(T, v),
      C = l.find_path(P.map, "start", "end"),
      M = [];
    for (let y = 1; y < C.length - 1; y++) M.push(P.table[C[y]].node);
    return o.fromArray(f(M));
  }, o.rawSplit = function (w) {
    return o.fromArray(h(w, a.isKanjiModeEnabled()));
  };
})(Xd);
const or = Nt,
  ii = tr,
  ox = O0,
  rx = H0,
  ix = Fd,
  ax = Bd,
  Ei = Ud,
  Ci = nr,
  lx = B0,
  Ko = Kd,
  cx = qd,
  dx = In,
  ai = Xd;
function ux(o, e) {
  const t = o.size,
    n = ax.getPositions(e);
  for (let s = 0; s < n.length; s++) {
    const r = n[s][0],
      i = n[s][1];
    for (let a = -1; a <= 7; a++) if (!(r + a <= -1 || t <= r + a)) for (let l = -1; l <= 7; l++) i + l <= -1 || t <= i + l || (a >= 0 && a <= 6 && (l === 0 || l === 6) || l >= 0 && l <= 6 && (a === 0 || a === 6) || a >= 2 && a <= 4 && l >= 2 && l <= 4 ? o.set(r + a, i + l, !0, !0) : o.set(r + a, i + l, !1, !0));
  }
}
function hx(o) {
  const e = o.size;
  for (let t = 8; t < e - 8; t++) {
    const n = t % 2 === 0;
    o.set(t, 6, n, !0), o.set(6, t, n, !0);
  }
}
function px(o, e) {
  const t = ix.getPositions(e);
  for (let n = 0; n < t.length; n++) {
    const s = t[n][0],
      r = t[n][1];
    for (let i = -2; i <= 2; i++) for (let a = -2; a <= 2; a++) i === -2 || i === 2 || a === -2 || a === 2 || i === 0 && a === 0 ? o.set(s + i, r + a, !0, !0) : o.set(s + i, r + a, !1, !0);
  }
}
function fx(o, e) {
  const t = o.size,
    n = Ko.getEncodedBits(e);
  let s, r, i;
  for (let a = 0; a < 18; a++) s = Math.floor(a / 3), r = a % 3 + t - 8 - 3, i = (n >> a & 1) === 1, o.set(s, r, i, !0), o.set(r, s, i, !0);
}
function li(o, e, t) {
  const n = o.size,
    s = cx.getEncodedBits(e, t);
  let r, i;
  for (r = 0; r < 15; r++) i = (s >> r & 1) === 1, r < 6 ? o.set(r, 8, i, !0) : r < 8 ? o.set(r + 1, 8, i, !0) : o.set(n - 15 + r, 8, i, !0), r < 8 ? o.set(8, n - r - 1, i, !0) : r < 9 ? o.set(8, 15 - r - 1 + 1, i, !0) : o.set(8, 15 - r - 1, i, !0);
  o.set(n - 8, 8, 1, !0);
}
function mx(o, e) {
  const t = o.size;
  let n = -1,
    s = t - 1,
    r = 7,
    i = 0;
  for (let a = t - 1; a > 0; a -= 2) for (a === 6 && a--;;) {
    for (let l = 0; l < 2; l++) if (!o.isReserved(s, a - l)) {
      let d = !1;
      i < e.length && (d = (e[i] >>> r & 1) === 1), o.set(s, a - l, d), r--, r === -1 && (i++, r = 7);
    }
    if (s += n, s < 0 || t <= s) {
      s -= n, n = -n;
      break;
    }
  }
}
function gx(o, e, t) {
  const n = new ox();
  t.forEach(function (l) {
    n.put(l.mode.bit, 4), n.put(l.getLength(), dx.getCharCountIndicator(l.mode, o)), l.write(n);
  });
  const s = or.getSymbolTotalCodewords(o),
    r = Ci.getTotalCodewordsCount(o, e),
    i = (s - r) * 8;
  for (n.getLengthInBits() + 4 <= i && n.put(0, 4); n.getLengthInBits() % 8 !== 0;) n.putBit(0);
  const a = (i - n.getLengthInBits()) / 8;
  for (let l = 0; l < a; l++) n.put(l % 2 ? 17 : 236, 8);
  return xx(n, o, e);
}
function xx(o, e, t) {
  const n = or.getSymbolTotalCodewords(e),
    s = Ci.getTotalCodewordsCount(e, t),
    r = n - s,
    i = Ci.getBlocksCount(e, t),
    a = n % i,
    l = i - a,
    d = Math.floor(n / i),
    u = Math.floor(r / i),
    h = u + 1,
    m = d - u,
    f = new lx(m);
  let p = 0;
  const x = new Array(i),
    g = new Array(i);
  let b = 0;
  const w = new Uint8Array(o.buffer);
  for (let C = 0; C < i; C++) {
    const M = C < l ? u : h;
    x[C] = w.slice(p, p + M), g[C] = f.encode(x[C]), p += M, b = Math.max(b, M);
  }
  const v = new Uint8Array(n);
  let E = 0,
    T,
    P;
  for (T = 0; T < b; T++) for (P = 0; P < i; P++) T < x[P].length && (v[E++] = x[P][T]);
  for (T = 0; T < m; T++) for (P = 0; P < i; P++) v[E++] = g[P][T];
  return v;
}
function bx(o, e, t, n) {
  let s;
  if (Array.isArray(o)) s = ai.fromArray(o);else if (typeof o == "string") {
    let d = e;
    if (!d) {
      const u = ai.rawSplit(o);
      d = Ko.getBestVersionForData(u, t);
    }
    s = ai.fromString(o, d || 40);
  } else throw new Error("Invalid data");
  const r = Ko.getBestVersionForData(s, t);
  if (!r) throw new Error("The amount of data is too big to be stored in a QR Code");
  if (!e) e = r;else if (e < r) throw new Error(`
The chosen QR Code version cannot contain this amount of data.
Minimum version required to store current data is: ` + r + `.
`);
  const i = gx(e, t, s),
    a = or.getSymbolSize(e),
    l = new rx(a);
  return ux(l, e), hx(l), px(l, e), li(l, t, 0), e >= 7 && fx(l, e), mx(l, i), isNaN(n) && (n = Ei.getBestMask(l, li.bind(null, l, t))), Ei.applyMask(n, l), li(l, t, n), {
    modules: l,
    version: e,
    errorCorrectionLevel: t,
    maskPattern: n,
    segments: s
  };
}
Od.create = function (e, t) {
  if (typeof e > "u" || e === "") throw new Error("No input text");
  let n = ii.M,
    s,
    r;
  return typeof t < "u" && (n = ii.from(t.errorCorrectionLevel, ii.M), s = Ko.from(t.version), r = Ei.from(t.maskPattern), t.toSJISFunc && or.setToSJISFunction(t.toSJISFunc)), bx(e, s, n, r);
};
var Qd = {},
  sa = {};
(function (o) {
  function e(t) {
    if (typeof t == "number" && (t = t.toString()), typeof t != "string") throw new Error("Color should be defined as hex string");
    let n = t.slice().replace("#", "").split("");
    if (n.length < 3 || n.length === 5 || n.length > 8) throw new Error("Invalid hex color: " + t);
    (n.length === 3 || n.length === 4) && (n = Array.prototype.concat.apply([], n.map(function (r) {
      return [r, r];
    }))), n.length === 6 && n.push("F", "F");
    const s = parseInt(n.join(""), 16);
    return {
      r: s >> 24 & 255,
      g: s >> 16 & 255,
      b: s >> 8 & 255,
      a: s & 255,
      hex: "#" + n.slice(0, 6).join("")
    };
  }
  o.getOptions = function (n) {
    n || (n = {}), n.color || (n.color = {});
    const s = typeof n.margin > "u" || n.margin === null || n.margin < 0 ? 4 : n.margin,
      r = n.width && n.width >= 21 ? n.width : void 0,
      i = n.scale || 4;
    return {
      width: r,
      scale: r ? 4 : i,
      margin: s,
      color: {
        dark: e(n.color.dark || "#000000ff"),
        light: e(n.color.light || "#ffffffff")
      },
      type: n.type,
      rendererOpts: n.rendererOpts || {}
    };
  }, o.getScale = function (n, s) {
    return s.width && s.width >= n + s.margin * 2 ? s.width / (n + s.margin * 2) : s.scale;
  }, o.getImageWidth = function (n, s) {
    const r = o.getScale(n, s);
    return Math.floor((n + s.margin * 2) * r);
  }, o.qrToImageData = function (n, s, r) {
    const i = s.modules.size,
      a = s.modules.data,
      l = o.getScale(i, r),
      d = Math.floor((i + r.margin * 2) * l),
      u = r.margin * l,
      h = [r.color.light, r.color.dark];
    for (let m = 0; m < d; m++) for (let f = 0; f < d; f++) {
      let p = (m * d + f) * 4,
        x = r.color.light;
      if (m >= u && f >= u && m < d - u && f < d - u) {
        const g = Math.floor((m - u) / l),
          b = Math.floor((f - u) / l);
        x = h[a[g * i + b] ? 1 : 0];
      }
      n[p++] = x.r, n[p++] = x.g, n[p++] = x.b, n[p] = x.a;
    }
  };
})(sa);
(function (o) {
  const e = sa;
  function t(s, r, i) {
    s.clearRect(0, 0, r.width, r.height), r.style || (r.style = {}), r.height = i, r.width = i, r.style.height = i + "px", r.style.width = i + "px";
  }
  function n() {
    try {
      return document.createElement("canvas");
    } catch {
      throw new Error("You need to specify a canvas element");
    }
  }
  o.render = function (r, i, a) {
    let l = a,
      d = i;
    typeof l > "u" && (!i || !i.getContext) && (l = i, i = void 0), i || (d = n()), l = e.getOptions(l);
    const u = e.getImageWidth(r.modules.size, l),
      h = d.getContext("2d"),
      m = h.createImageData(u, u);
    return e.qrToImageData(m.data, r, l), t(h, d, u), h.putImageData(m, 0, 0), d;
  }, o.renderToDataURL = function (r, i, a) {
    let l = a;
    typeof l > "u" && (!i || !i.getContext) && (l = i, i = void 0), l || (l = {});
    const d = o.render(r, i, l),
      u = l.type || "image/png",
      h = l.rendererOpts || {};
    return d.toDataURL(u, h.quality);
  };
})(Qd);
var Zd = {};
const wx = sa;
function cc(o, e) {
  const t = o.a / 255,
    n = e + '="' + o.hex + '"';
  return t < 1 ? n + " " + e + '-opacity="' + t.toFixed(2).slice(1) + '"' : n;
}
function ci(o, e, t) {
  let n = o + e;
  return typeof t < "u" && (n += " " + t), n;
}
function yx(o, e, t) {
  let n = "",
    s = 0,
    r = !1,
    i = 0;
  for (let a = 0; a < o.length; a++) {
    const l = Math.floor(a % e),
      d = Math.floor(a / e);
    !l && !r && (r = !0), o[a] ? (i++, a > 0 && l > 0 && o[a - 1] || (n += r ? ci("M", l + t, 0.5 + d + t) : ci("m", s, 0), s = 0, r = !1), l + 1 < e && o[a + 1] || (n += ci("h", i), i = 0)) : s++;
  }
  return n;
}
Zd.render = function (e, t, n) {
  const s = wx.getOptions(t),
    r = e.modules.size,
    i = e.modules.data,
    a = r + s.margin * 2,
    l = s.color.light.a ? "<path " + cc(s.color.light, "fill") + ' d="M0 0h' + a + "v" + a + 'H0z"/>' : "",
    d = "<path " + cc(s.color.dark, "stroke") + ' d="' + yx(i, r, s.margin) + '"/>',
    u = 'viewBox="0 0 ' + a + " " + a + '"',
    m = '<svg xmlns="http://www.w3.org/2000/svg" ' + (s.width ? 'width="' + s.width + '" height="' + s.width + '" ' : "") + u + ' shape-rendering="crispEdges">' + l + d + `</svg>
`;
  return typeof n == "function" && n(null, m), m;
};
const vx = L0,
  ji = Od,
  Jd = Qd,
  _x = Zd;
function oa(o, e, t, n, s) {
  const r = [].slice.call(arguments, 1),
    i = r.length,
    a = typeof r[i - 1] == "function";
  if (!a && !vx()) throw new Error("Callback required as last argument");
  if (a) {
    if (i < 2) throw new Error("Too few arguments provided");
    i === 2 ? (s = t, t = e, e = n = void 0) : i === 3 && (e.getContext && typeof s > "u" ? (s = n, n = void 0) : (s = n, n = t, t = e, e = void 0));
  } else {
    if (i < 1) throw new Error("Too few arguments provided");
    return i === 1 ? (t = e, e = n = void 0) : i === 2 && !e.getContext && (n = t, t = e, e = void 0), new Promise(function (l, d) {
      try {
        const u = ji.create(t, n);
        l(o(u, e, n));
      } catch (u) {
        d(u);
      }
    });
  }
  try {
    const l = ji.create(t, n);
    s(null, o(l, e, n));
  } catch (l) {
    s(l);
  }
}
Xs.create = ji.create;
Xs.toCanvas = oa.bind(null, Jd.render);
Xs.toDataURL = oa.bind(null, Jd.renderToDataURL);
Xs.toString = oa.bind(null, function (o, e, t) {
  return _x.render(o, t);
});
async function kx(o, e = 220) {
  return Xs.toDataURL(o, {
    width: e,
    margin: 2,
    errorCorrectionLevel: "M",
    color: {
      dark: "#000000",
      light: "#ffffff"
    }
  });
}
const Ax = 4e4;
async function Mx(o) {
  if (!zs()) return null;
  o == null || o(Se("boot.preparing"));
  const e = { ready: true };
  if (!e.ready) throw new Error(e.error || Se("boot.python_failed"));
  o == null || o(Se("boot.starting"));
  const t = await Mc({
    script: "vcam/vcam_launcher.py",
    timeoutMs: Ax
  });
  if (!t) throw new Error(Se("boot.host_unsupported"));
  const n = t.stdout.trim().split(`
`).filter(Boolean).pop() ?? "";
  let s = null;
  try {
    s = JSON.parse(n);
  } catch {}
  if (!(s != null && s.ok) || !s.httpPort || !s.phoneBase) {
    const r = (s == null ? void 0 : s.error) || t.stderr.trim().slice(-300) || `exit ${t.exitCode}`;
    throw new Error(Se("boot.start_failed", {
      detail: r
    }));
  }
  return {
    lanIp: s.lanIp ?? "",
    httpPort: s.httpPort,
    httpsPort: s.httpsPort ?? 0,
    phoneBase: s.phoneBase,
    certMode: s.certMode === "trusted" ? "trusted" : "self-signed"
  };
}
const Ex = () => Se("vc.path_prefix");
function Cx({
  open: o,
  engine: e,
  store: t,
  onClose: n,
  onFlash: s,
  onTakeImported: r
}) {
  const i = pe(),
    [a, l] = k.useState("closed"),
    [d, u] = k.useState(!1),
    [h, m] = k.useState("-"),
    [f, p] = k.useState("-"),
    [x, g] = k.useState(null),
    [b, w] = k.useState(null),
    [v, E] = k.useState(!1),
    T = b ? v && b.alt ? b.alt : b.primary : null,
    [P, C] = k.useState(null),
    [M, y] = k.useState(null),
    [I, j] = k.useState(null),
    [D, H] = k.useState(50),
    [F, U] = k.useState(!1),
    [ne, ae] = k.useState(0),
    [He, ce] = k.useState([]),
    [Re, ot] = k.useState(null),
    [Ke, rt] = k.useState(0),
    De = k.useRef(null),
    dt = k.useRef(null),
    it = k.useRef(t);
  it.current = t;
  const Ue = k.useRef(e);
  Ue.current = e;
  const gt = () => (it.current.present.camPaths ?? []).filter(K => K.recorded != null).length,
    Je = gt(),
    ut = new Set((t.present.camPaths ?? []).map(K => K.id)),
    st = K => s == null ? void 0 : s(K),
    G = async () => {
      if (!T) return;
      let K = !1;
      try {
        await navigator.clipboard.writeText(T), K = !0;
      } catch {}
      if (!K) {
        const Z = document.createElement("textarea");
        Z.value = T, Z.setAttribute("readonly", ""), Z.style.cssText = "position:fixed;top:-9999px;opacity:0", document.body.appendChild(Z), Z.select();
        try {
          K = document.execCommand("copy");
        } catch {
          K = !1;
        }
        Z.remove();
      }
      st(K ? Se("vc.link_copied") : Se("vc.copy_failed"));
    },
    W = () => {
      var Z;
      const K = De.current;
      !K || !K.sock.isOpen || K.sock.send({
        type: "state",
        recording: K.recorder.recording,
        fov: Math.round(((Z = Ue.current) == null ? void 0 : Z.camera.fov) ?? 50),
        takeCount: gt()
      });
    },
    ee = k.useRef(W);
  ee.current = W;
  const de = K => {
      if (U(!1), !K) return;
      const Z = it.current;
      K.label = `${Ex()}${gt() + 1}`;
      const Ve = zd(K);
      if (Ve.length < 2) {
        st(Se("vc.too_few_samples"));
        return;
      }
      const lt = D0(K, Ve);
      Z.addCamPathClip(lt, null), ce(tt => [...tt, {
        id: lt.id,
        label: lt.label,
        durationMs: lt.duration
      }]), Z.select(null), r == null || r(), st(Se("vc.take_imported", {
        label: K.label,
        dur: Eo(K.duration)
      }));
    },
    se = () => {
      var Ve;
      const K = Ue.current,
        Z = dt.current;
      dt.current = null, ot(null), !(!K || !Z) && (K.setCamPathVizSuppressed(null), Math.abs(K.camera.fov - Z.fov0) > 0.001 && (K.camera.fov = Z.fov0, K.camera.updateProjectionMatrix()), (Ve = De.current) == null || Ve.ctrl.attach());
    },
    ht = K => {
      const Z = Ue.current,
        Ve = De.current;
      if (!Z || !Ve) return;
      if (Ve.recorder.recording) {
        st(Se("vc.stop_rec_first"));
        return;
      }
      se();
      const lt = (it.current.present.camPaths ?? []).find(xe => xe.id === K);
      if (!lt) {
        ce(xe => xe.filter(be => be.id !== K)), st(Se("vc.take_deleted"));
        return;
      }
      Ve.ctrl.suspend();
      const tt = new jd(lt, xe => Z.getObjectCenter(xe));
      tt.onEnd = () => Ye.current.stopPreview(), dt.current = {
        player: tt,
        fov0: Z.camera.fov
      }, Z.setCamPathVizSuppressed("*"), tt.seek(0), Z.setCameraDriver(xe => tt.tick(xe, Z.camera)), ot(K);
    },
    et = () => {
      const K = De.current;
      !K || K.recorder.recording || (se(), K.recorder.start(), U(!0));
    },
    xt = () => {
      const K = De.current;
      !K || !K.recorder.recording || de(K.recorder.stop());
    },
    at = K => {
      Re === K && se(), it.current.removeCamPath(K), ce(Z => Z.filter(Ve => Ve.id !== K));
    },
    Ye = k.useRef({
      startRecording: et,
      stopRecording: xt,
      commitTake: de,
      stopPreview: se
    });
  return Ye.current = {
    startRecording: et,
    stopRecording: xt,
    commitTake: de,
    stopPreview: se
  }, k.useEffect(() => {
    if (!o || !e) return;
    let K = !1,
      Z = null;
    return (async () => {
      let Ve;
      try {
        const Y = await Mx(ge => {
          K || C(ge);
        });
        if (K) return;
        Y && (Ve = `ws://127.0.0.1:${Y.httpPort}`, j(Y.certMode));
      } catch (Y) {
        K || (C(null), y(Y instanceof Error ? Y.message : String(Y)));
        return;
      }
      C(null);
      const lt = Fa(6),
        tt = Fa(16),
        xe = new Ah("desktop", lt, tt, Ve),
        be = new y0(e),
        Et = new k0(),
        Xe = new kh(Y => xe.send({
          type: "rtc",
          payload: Y
        }), Y => console.log(`[vcam-rtc][desktop] ${Y}`));
      De.current = {
        sock: xe,
        ctrl: be,
        recorder: Et,
        publisher: Xe
      }, be.onFrame = Y => Et.push(Y), Et.onAutoStop = Y => {
        Ye.current.commitTake(Y), ee.current();
      };
      let Ft = null;
      const N = () => {
          Ft && (clearTimeout(Ft), Ft = null);
        },
        Q = Y => {
          N(), console.log(`[vcam-rtc][desktop] 直连失败（${Y}），VCam 不可用`), xe.send({
            type: "rtc-failed"
          }), Xe.stop(), p("failed"), st(Se("vc.rtc_failed_flash"));
        },
        we = () => {
          N(), Ft = setTimeout(() => Q("10s 未连上"), 1e4);
        };
      Xe.onState = Y => {
        m(Y), Y === "connected" ? (N(), p("rtc")) : Y === "failed" && Q("ICE failed");
      }, xe.on("hello-ack", Y => {
        if (Y.lanIp) Xe.lanIp = Y.lanIp;else try {
          Xe.lanIp = new URL(Y.lanUrl).hostname;
        } catch {}
        Y.certMode && j(Y.certMode);
        const ge = `?locale=${Mh()}`,
          pt = `#s=${lt}&t=${tt}`,
          Rt = `${Y.lanUrl}/phone.html${ge}${pt}`;
        let ue = null;
        if (Y.lanIp) try {
          const qt = new URL(Y.lanUrl);
          qt.hostname !== Y.lanIp && (ue = `https://${Y.lanIp}:${qt.port}/phone.html${ge}${pt}`);
        } catch {}
        w({
          primary: Rt,
          alt: ue
        });
      }), xe.on("paired", () => {
        u(!0), be.activate(), Xe.start(e.renderer.domElement, 60), we(), setTimeout(() => ee.current(), 300);
      }), xe.on("peer-left", () => {
        u(!1), m("-"), p("-"), Xe.stop(), N(), Et.recording && Ye.current.commitTake(Et.stop()), Ye.current.stopPreview(), be.deactivate();
      }), Xe.onData = Y => {
        try {
          const ge = JSON.parse(Y);
          (ge == null ? void 0 : ge.type) === "pose" && be.updatePose(ge);
        } catch {}
      }, xe.on("fov", Y => {
        be.setFov(Y.value), H(Math.round(Y.value));
      }), xe.on("record", Y => {
        Y.action === "start" ? Ye.current.startRecording() : Ye.current.stopRecording(), ee.current();
      }), xe.on("rtc", Y => void Xe.handleSignal(Y.payload)), xe.on("debug-log", Y => {
        console.log(`[vcam][phone] ${Y.text}`), Eh(Y.text.startsWith("[phone-boot]") ? "error" : "debug", "VCam phone diagnostic", {
          text: Y.text
        });
      }), xe.onStatus(l), xe.connect(), Z = () => {
        Et.recording && Ye.current.commitTake(Et.stop()), N(), Ye.current.stopPreview(), be.deactivate(), Xe.stop(), xe.close();
      }, K && (Z(), Z = null, De.current = null);
    })(), () => {
      K = !0, Z == null || Z(), Z = null, De.current = null, u(!1), g(null), w(null), E(!1), m("-"), p("-"), U(!1), ce([]), l("closed"), C(null), y(null), j(null);
    };
  }, [o, e]), k.useEffect(() => {
    if (!T) {
      g(null);
      return;
    }
    let K = !1;
    return kx(T).then(Z => {
      K || g(Z);
    }).catch(() => {
      K || g(null);
    }), () => {
      K = !0;
    };
  }, [T]), k.useEffect(() => {
    d && ee.current();
  }, [d, F, D, Je]), k.useEffect(() => {
    if (!F) {
      ae(0);
      return;
    }
    const K = setInterval(() => {
      var Z;
      return ae(((Z = De.current) == null ? void 0 : Z.recorder.elapsedMs) ?? 0);
    }, 200);
    return () => clearInterval(K);
  }, [F]), k.useEffect(() => {
    if (!Re) {
      rt(0);
      return;
    }
    const K = setInterval(() => {
      var Z;
      return rt(((Z = dt.current) == null ? void 0 : Z.player.getProgress().elapsedMs) ?? 0);
    }, 100);
    return () => clearInterval(K);
  }, [Re]), o ? <div className="flex w-[300px] shrink-0 flex-col border-l border-border bg-[var(--sidebar)] text-popover-foreground"><div className="flex items-center justify-between border-b border-border px-4 py-2.5"><span className="text-[13px] font-semibold">{i("vc.title")}</span><button className="grid h-6 w-6 place-items-center rounded text-muted-foreground hover:bg-foreground/10 hover:text-foreground" title={i("vc.close_title")} onClick={n}>✕</button></div><div className="min-h-0 flex-1 overflow-y-auto p-4">{d ? <div className="flex flex-col gap-3"><div className="flex items-center gap-2 text-[12px]"><UiDc ok={!0}>{i("vc.phone_connected")}</UiDc><UiDc ok={f === "rtc"} fail={f === "failed"}>{i("vc.viewfinder")} {f === "rtc" ? "WebRTC ✓" : f === "failed" ? i("vc.direct_failed") : h}</UiDc><span className="ml-auto tabular-nums text-muted-foreground">FOV {D}</span></div>{f === "failed" && <div className="rounded-md bg-amber-500/10 px-3 py-2 text-[11px] leading-relaxed text-amber-400/90">{i("vc.rtc_failed_detail")}</div>}{F && <div className="flex items-center gap-2 rounded-md bg-red-600/15 px-3 py-2 text-[12px] text-red-400"><span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />{i("vc.recording")} {Eo(ne)}</div>}<div className="flex gap-2"><button className="btn-vcam" onClick={() => {
            F ? xt() : et();
          }}>{i(F ? "vc.stop_recording" : "vc.start_recording")}</button></div><p className="text-[11px] leading-relaxed text-muted-foreground/70">{i("vc.control_hint")}</p><p className="text-[11px] leading-relaxed text-muted-foreground/70">{i("vc.imported_hint", {
            count: Je
          })}</p>{He.some(K => ut.has(K.id)) && <div className="flex flex-col gap-1.5 border-t border-border pt-3"><span className="text-[11px] font-medium text-muted-foreground">{i("vc.session_takes")}</span>{He.filter(K => ut.has(K.id)).map(K => {
            const Z = Re === K.id;
            return <div key={K.id} className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[12px] ${Z ? "bg-primary/10" : "bg-muted/50"}`}><span className="min-w-0 flex-1 truncate">{K.label}</span><span className="tabular-nums text-[11px] text-muted-foreground">{Z ? `${Eo(Ke)} / ` : ""}{Eo(K.durationMs)}</span><button className="btn-vcam" onClick={() => Z ? se() : ht(K.id)}>{i(Z ? "vc.stop" : "vc.preview")}</button><button className="shrink-0 rounded-md border border-border px-2 py-1.5 text-[12px] text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-400" onClick={() => at(K.id)}>{i("common.delete")}</button></div>;
          })}<p className="text-[11px] leading-relaxed text-muted-foreground/60">{i("vc.preview_note")}</p></div>}</div> : <div className="flex min-h-full flex-col items-center gap-3">{M ? <><div className="grid h-[200px] w-[200px] place-items-center rounded-lg bg-muted px-4 text-center text-[12px] leading-relaxed text-red-400/90">{M}</div><p className="text-center text-[11px] text-muted-foreground/60">{i("vc.boot_retry_hint")}</p></> : <>{x ? <img src={x} alt={i("vc.qr_alt")} className="h-[200px] w-[200px] rounded-lg" /> : <div className="grid h-[200px] w-[200px] place-items-center rounded-lg bg-muted px-4 text-center text-[12px] leading-relaxed text-muted-foreground">{P ?? i(a === "open" ? "vc.generating_qr" : "vc.connecting_signal")}</div>}<p className="text-center text-[12px] leading-relaxed text-foreground">{i("vc.scan_hint_1")}</p><p className="text-center text-[12px] leading-relaxed text-muted-foreground">{i("vc.scan_hint_2")}</p>{T && <button className="w-[200px] truncate rounded-md border border-border px-2.5 py-1 text-[11px] text-muted-foreground hover:text-foreground" title={i("vc.copy_link_title")} onClick={() => void G()}>{T}</button>}{(b == null ? void 0 : b.alt) && <button className="mt-auto text-[11px] text-muted-foreground/60 underline-offset-2 hover:text-foreground hover:underline" onClick={() => E(K => !K)}>{i(v ? "vc.use_domain_url" : "vc.use_ip_url")}</button>}<p className={`text-center text-[11px] text-muted-foreground${b != null && b.alt ? "" : " mt-auto"}`}>{i(I === "trusted" && !v ? "vc.trusted_https_hint" : "vc.selfsigned_hint")}</p></>}</div>}</div></div> : null;
}
function UiDc({
  ok: o,
  fail: e,
  children: t
}) {
  return <span className={`rounded px-1.5 py-0.5 ${e ? "bg-amber-500/15 text-amber-400" : o ? "bg-green-500/15 text-green-400" : "bg-muted text-muted-foreground"}`}>{t}</span>;
}
function Eo(o) {
  const e = o / 1e3;
  return e >= 60 ? `${Math.floor(e / 60)}:${String(Math.floor(e % 60)).padStart(2, "0")}` : `${e.toFixed(1)}s`;
}
const di = o => ({
    drive: (e, t, n) => o.driveObject(e, t, n),
    setDriven: e => o.setDrivenObjects(e),
    drivePose: (e, t, n) => o.drivePose(e, t, n),
    setPoseDriven: e => o.setPoseDrivenObjects(e)
  }),
  ui = o => ({
    ...o,
    jointAngles: Kt(o.jointAngles),
    position: {
      ...o.position
    },
    rotation: {
      ...o.rotation
    },
    scale: {
      ...o.scale
    }
  });
function uc(o, e) {
  if (e.length < 2) return null;
  const t = new Set(e),
    n = o.characterGroups.find(s => Ge(s).length === t.size && Ge(s).every(r => t.has(r)));
  return n ? {
    id: n.id,
    pivot: n.pivot
  } : null;
}
function jx(o, e) {
  return e.length ? o.characterGroups.find(t => {
    const n = new Set(Ge(t));
    return e.every(s => n.has(s));
  }) ?? null : null;
}
function Sx({
  open: o,
  initialComposition: e,
  initialView: t,
  onClose: n,
  onSave: s
}) {
  var Ca;
  const r = tm(e),
    i = pe(),
    a = Vi(),
    l = k.useRef(null),
    d = k.useRef(null),
    [u, h] = k.useState(null),
    [m, f] = k.useState("translate"),
    [p, x] = k.useState((t == null ? void 0 : t.viewMode) ?? "director"),
    [g, b] = k.useState((t == null ? void 0 : t.cameraId) ?? null),
    [w, v] = k.useState(null),
    [E, T] = k.useState((t == null ? void 0 : t.aspect) ?? "Auto"),
    P = k.useRef(E);
  P.current = E;
  const [C, M] = k.useState(!1),
    [y, I] = k.useState(!1),
    [j, D] = k.useState(!1),
    [H, F] = k.useState(!1),
    U = k.useRef(null),
    [ne, ae] = k.useState(!1),
    [He, ce] = k.useState(!1),
    [Re, ot] = k.useState(!1),
    [Ke, rt] = k.useState(!1),
    [De, dt] = k.useState(!1),
    [it, Ue] = k.useState(!1),
    [gt, Je] = k.useState(!1),
    [ut, st] = k.useState(!1),
    [G, W] = k.useState(null),
    [ee, de] = k.useState(!1),
    [se, ht] = k.useState(null),
    [et, xt] = k.useState(!0),
    [at, Ye] = k.useState(!1),
    [K, Z] = k.useState(!1),
    [Ve, lt] = k.useState(!1),
    [tt, xe] = k.useState(null),
    [be, Et] = k.useState(!1),
    [Xe, Ft] = k.useState(null),
    [N, Q] = k.useState(0),
    [we, Y] = k.useState(null),
    ge = k.useRef(null),
    pt = k.useRef(null),
    Rt = k.useRef(null),
    ue = k.useRef(r);
  ue.current = r;
  const qt = k.useRef(i);
  qt.current = i;
  const qn = k.useRef(new Set()),
    kt = k.useRef([]);
  k.useEffect(() => {
    if (!o || !l.current) return;
    qn.current.clear();
    const _ = new yi(l.current, {
      onSelect: (A, L, B) => {
        Q(X => X + 1), ue.current.select(A, L, B);
      },
      onSelectMany: (A, L) => {
        Q(B => B + 1), ue.current.selectMany(A, L);
      },
      onTransform: (A, L, B) => {
        const X = ue.current,
          V = Os(A);
        if (V) {
          const te = L,
            ie = {};
          te.position && (ie.position = te.position), te.rotation && (ie.rotation = te.rotation), te.scale && (ie.scale = te.scale), Object.keys(ie).length && X.updateCodeModelPart(V.modelId, V.part, ie, B);
          return;
        }
        if (X.present.characters.some(te => te.id === A)) X.updateCharacter(A, L, B);else if (X.present.props.some(te => te.id === A)) X.updateProp(A, L, B);else if ((X.present.models ?? []).some(te => te.id === A)) X.updateModel(A, L, B);else if ((X.present.codeModels ?? []).some(te => te.id === A)) X.updateCodeModel(A, L, B);else if (X.present.cameras.some(te => te.id === A)) {
          const te = L,
            ie = {
              position: te.position
            };
          te.lookAt && (ie.lookAt = te.lookAt), X.updateCamera(A, ie, B);
        }
      },
      onTransformMany: (A, L, B) => ue.current.updateSelectionTransforms(A, L, B),
      onGroupPivotChange: (A, L) => ue.current.updateCharacterGroup(A, {
        pivot: L
      }),
      onJointRotate: (A, L, B) => {
        ue.current.updateCharacterPose(A, L, {
          history: B
        });
      },
      onCamPathEdit: (A, L, B, X) => {
        ue.current.updateCamPath(A, X != null && X.lookAt ? {
          points: L,
          lookAt: X.lookAt
        } : {
          points: L
        }, B);
      },
      onCamPathPointSelect: A => Ft(A),
      onCharLoadError: (A, L, B) => {
        const X = B || L;
        if (qn.current.has(X)) return;
        qn.current.add(X);
        const V = qt.current("dlg.char_model_failed", {
          name: L
        });
        vt(V, "error") || (v(V), setTimeout(() => v(null), 4e3));
      }
    });
    if (d.current = _, typeof window.__attachPossessMode == "function" && window.__attachPossessMode(_), h(_), _.onCodeModelError = (A, L) => {
      const B = qt.current("codemodel.build_failed", {
        msg: L.slice(0, 160)
      });
      vt(B, "error") || (v(B), setTimeout(() => v(null), 5e3));
    }, _.setTheme(a), _.sync(ue.current.present), _.setSelected(ue.current.selectedId, ue.current.selectedIds, uc(ue.current.present, ue.current.selectedIds)), (t == null ? void 0 : t.viewMode) === "camera") {
      const A = ue.current.present.cameras.find(L => L.id === t.cameraId) ?? ue.current.present.cameras[0];
      A ? (x("camera"), b(A.id), _.enterCameraView(A, {
        immediate: !0
      })) : (x("director"), b(null), _.setViewMode("director"));
    } else t && t.viewMode !== "director" && _.setViewMode(t.viewMode);
    return () => {
      _.dispose(), d.current = null, h(null), ge.current = null, pt.current = null, ht(null), xe(null), Et(!1), Ft(null), Y(null);
    };
  }, [o]), k.useEffect(() => {
    var _;
    (_ = d.current) == null || _.sync(r.present);
  }, [r.present]), k.useEffect(() => {
    var _;
    (_ = d.current) == null || _.setSelected(r.selectedId, r.selectedIds, uc(r.present, r.selectedIds));
  }, [r.selectedId, r.selectedIds, r.present.characterGroups]), k.useEffect(() => {
    var _;
    (_ = d.current) == null || _.setTheme(a);
  }, [a]);
  const bt = k.useRef(null);
  k.useEffect(() => {
    const _ = w0();
    bt.current = _;
    const A = () => {
        document.visibilityState === "hidden" && _.flush();
      },
      L = () => {
        _.flush();
      };
    return window.addEventListener("visibilitychange", A), window.addEventListener("pagehide", L), () => {
      window.removeEventListener("visibilitychange", A), window.removeEventListener("pagehide", L), _.flush(), _.dispose(), bt.current === _ && (bt.current = null);
    };
  }, []);
  const Yn = k.useRef(!1);
  k.useEffect(() => {
    var _;
    b0(e, r.present, Yn.current) && (Yn.current = !0, (_ = bt.current) == null || _.save(r.present));
  }, [r.present, e]), k.useEffect(() => {
    var _;
    (_ = d.current) == null || _.setMode(m);
  }, [m]), k.useEffect(() => {
    u == null || u.setSnapEnabled(j);
  }, [u, j]);
  const Nn = r.selectedIds.some(_ => r.present.characters.some(A => A.id === _) || r.present.props.some(A => A.id === _) || (r.present.models ?? []).some(A => A.id === _) || (r.present.codeModels ?? []).some(A => A.id === _) || Os(_) != null);
  k.useEffect(() => {
    if (!o) return;
    const _ = A => {
      var B, X;
      const L = (B = A.target) == null ? void 0 : B.tagName;
      if (!(L === "INPUT" || L === "TEXTAREA")) {
        if ((A.metaKey || A.ctrlKey) && A.key.toLowerCase() === "z") {
          A.preventDefault(), A.shiftKey ? r.redo() : r.undo();
          return;
        }
        if ((A.metaKey || A.ctrlKey) && A.key.toLowerCase() === "j") {
          A.preventDefault();
          const V = r.present.characters.find(ie => ie.id === r.selectedId);
          if (!V) {
            he(i("dlg.select_char_first"));
            return;
          }
          const te = JSON.stringify(V.jointAngles, null, 2);
          (X = navigator.clipboard) == null || X.writeText(te).then(() => he(i("dlg.pose_copied")), () => he(i("dlg.copy_failed")));
          return;
        }
        if ((A.metaKey || A.ctrlKey) && A.key.toLowerCase() === "c") {
          const V = r.present.characters.filter(te => r.selectedIds.includes(te.id));
          if (!V.length) return;
          A.preventDefault(), kt.current = V.map(ui), he(i("dlg.chars_copied", {
            n: V.length
          }));
          return;
        }
        if ((A.metaKey || A.ctrlKey) && A.key.toLowerCase() === "v") {
          if (!kt.current.length) return;
          A.preventDefault();
          const V = kt.current.map(te => ({
            ...ui(te),
            id: $e(),
            position: {
              ...te.position,
              x: te.position.x + 0.6
            }
          }));
          kt.current = V.map(ui), r.pasteCharacters(V);
          return;
        }
        if ((A.metaKey || A.ctrlKey) && !A.shiftKey && A.key.toLowerCase() === "g") {
          const V = r.selectedIds.filter(te => r.present.characters.some(ie => ie.id === te) || r.present.props.some(ie => ie.id === te));
          if (V.length < 2 || V.length !== r.selectedIds.length) return;
          A.preventDefault(), r.createCharacterGroup(V);
          return;
        }
        if (A.shiftKey && A.key.toLowerCase() === "g") {
          const V = jx(r.present, r.selectedIds);
          V && (A.preventDefault(), r.ungroupCharacterGroup(V.id));
          return;
        }
        if (!(A.metaKey || A.ctrlKey)) {
          if (!A.altKey && !A.shiftKey) {
            if (A.code === "Digit1" || A.code === "Numpad1") {
              f("translate");
              return;
            }
            if (A.code === "Digit2" || A.code === "Numpad2") {
              f("rotate");
              return;
            }
            if (A.code === "Digit3" || A.code === "Numpad3") {
              f("scale");
              return;
            }
          }
          if ((A.key === "x" || A.key === "X") && D(V => !V), A.key === "Delete" || A.key === "Backspace") {
            if (se) {
              Xe == null && r.selectedId === se && r.removeCamPath(se);
              return;
            }
            r.selectedIds.length > 1 ? r.removeMany(r.selectedIds) : r.selectedId && r.remove(r.selectedId);
          }
          A.key === "Escape" && r.select(null);
        }
      }
    };
    return window.addEventListener("keydown", _), () => window.removeEventListener("keydown", _);
  }, [o, r, se, Xe]), k.useEffect(() => {
    if (!se) return;
    const _ = A => {
      var X;
      const L = (X = A.target) == null ? void 0 : X.tagName;
      if (L === "INPUT" || L === "TEXTAREA") return;
      const B = d.current;
      if (B) {
        if (A.key === "Delete" || A.key === "Backspace") {
          if (Xe == null) return;
          B.camPathEditorDelete(), A.stopPropagation(), A.preventDefault();
        } else if (A.key === "Escape") {
          if (Xe == null && !B.camPathEditorLookAtSelected) return;
          B.camPathEditorSelectPoint(null), A.stopPropagation();
        }
      }
    };
    return window.addEventListener("keydown", _, {
      capture: !0
    }), () => window.removeEventListener("keydown", _, {
      capture: !0
    });
  }, [se, Xe]), k.useEffect(() => {
    if (!we) return;
    const _ = A => {
      var X, V, te, ie, At;
      const L = (X = A.target) == null ? void 0 : X.tagName;
      if (L === "INPUT" || L === "TEXTAREA") return;
      if (A.key === "Enter") {
        (V = d.current) == null || V.completeGroundDraw(), A.stopPropagation();
        return;
      }
      const B = A.key.toLowerCase();
      if (B === "q" || B === "e") {
        (te = d.current) == null || te.adjustGroundDrawHeight(B === "e" ? 0.25 : -0.25), A.stopPropagation();
        return;
      }
      A.key === "Escape" && ((ie = d.current) == null || ie.cancelGroundPick(), (At = d.current) == null || At.cancelGroundDraw(), A.stopPropagation());
    };
    return window.addEventListener("keydown", _, {
      capture: !0
    }), () => window.removeEventListener("keydown", _, {
      capture: !0
    });
  }, [we]);
  const ft = se ? (Ca = r.present.camPaths) == null ? void 0 : Ca.find(_ => _.id === se) : void 0,
    Rn = ft == null ? void 0 : ft.points,
    ra = !!(ft != null && ft.closed),
    ia = ft && ft.lookAtTarget === Ne && ft.lookAt ? ft.lookAt : null;
  k.useEffect(() => {
    if (!se) return;
    const _ = d.current;
    _ && (_.syncCamPathFromStore(se, Rn, ra, ia) || ht(null));
  }, [se, Rn, ra, ia]), k.useEffect(() => {
    var L;
    const _ = d.current;
    if (!_) return;
    const A = (L = r.present.camPaths) == null ? void 0 : L.find(B => B.id === r.selectedId);
    A && !ee && !(tt != null && tt.playing) && !be && p !== "camera" && !we ? se !== A.id && (_.enterCamPathEdit(A.id, A.points, !!A.closed), ht(A.id)) : se && ha.current();
  }, [r.selectedId, ee, tt == null ? void 0 : tt.playing, be, p, we, se, r.present.camPaths]), k.useEffect(() => {
    const _ = ge.current;
    if (!_) return;
    const A = d.current;
    if (!A) return;
    const L = r.present.camTimeline;
    if (!L || Gt(L) <= 0) {
      ca.current();
      return;
    }
    const B = _.player.getProgress(),
      X = new Po(L, r.present.camPaths ?? [], V => A.getObjectCenter(V), _.fov0, _.player, di(A), r.present.customMotions);
    X.onEnd = lr.current, X.seek(B.tMs), _.player = X, B.playing && (X.play(), X.seek(B.tMs), A.setCameraDriver(V => X.tick(V, A.camera)));
  }, [r.present.camTimeline, r.present.camPaths, r.present.customMotions]);
  const he = _ => {
      v(_), setTimeout(() => v(null), 2200);
    },
    nn = _ => {
      var L;
      const A = p === "camera";
      x(_), (L = d.current) == null || L.setViewMode(_, {
        keepPose: A
      }), b(null), Ts({
        viewMode: _,
        cameraId: null,
        aspect: P.current
      });
    },
    eu = _ => {
      T(_), Ts({
        viewMode: p,
        cameraId: g,
        aspect: _
      });
    };
  k.useEffect(() => {
    var _;
    p !== "camera" || !g || r.present.cameras.some(A => A.id === g) || (x("director"), b(null), (_ = d.current) == null || _.setViewMode("director"), Ts({
      viewMode: "director",
      cameraId: null,
      aspect: P.current
    }));
  }, [g, r.present.cameras, p]);
  const rr = _ => {
      var A;
      x("camera"), b(_.id), (A = d.current) == null || A.enterCameraView(_), Ts({
        viewMode: "camera",
        cameraId: _.id,
        aspect: P.current
      });
    },
    tu = () => {
      const _ = r.present.cameras[0];
      if (!_) {
        he(i("dlg.add_camera_first"));
        return;
      }
      rr(_);
    },
    nu = _ => {
      const A = d.current,
        L = Bo(r.present.cameras.length, _);
      if (!_ && A) {
        const B = A.currentViewAsCamera();
        L.position = {
          ...B.position
        }, L.lookAt = {
          ...B.lookAt
        }, L.fov = B.fov;
      }
      r.insertCamera(L), rr(L);
    },
    ir = _ => _.retargetOrbitPivot(),
    ar = _ => {
      _.setCameraDriver(null), _.setCamPathVizSuppressed(null), _.setCamIndicatorsVisible(!0), ir(_);
    },
    aa = () => {
      const _ = d.current;
      _ && ar(_), xe(A => A && {
        ...A,
        playing: !1
      });
    },
    lr = k.useRef(aa);
  lr.current = aa;
  const la = () => {
      const _ = d.current;
      if (!_) return null;
      let A = ge.current;
      if (!A) {
        const L = ue.current.present.camTimeline;
        if (!L || Gt(L) <= 0) return null;
        const B = new Po(L, ue.current.present.camPaths ?? [], X => _.getObjectCenter(X), _.camera.fov, null, di(_), ue.current.present.customMotions);
        B.onEnd = () => lr.current(), A = {
          player: B,
          fov0: _.camera.fov
        }, ge.current = A, xe({
          playing: !1
        });
      }
      return A;
    },
    Qs = () => {
      const _ = d.current,
        A = ge.current;
      ge.current = null, xe(null), !(!A || !_) && (ar(_), _.clearDrivenObjects(), Math.abs(_.camera.fov - A.fov0) > 0.001 && (_.camera.fov = A.fov0, _.camera.updateProjectionMatrix()));
    },
    ca = k.useRef(Qs);
  ca.current = Qs;
  const Zs = () => {
      const _ = d.current,
        A = ge.current;
      !_ || !A || !A.player.getProgress().playing || (A.player.pause(), ar(_), xe({
        playing: !1
      }));
    },
    su = () => {
      const _ = d.current;
      if (!_ || be) return;
      if (ee) {
        he(i("dlg.vcam_busy"));
        return;
      }
      const A = la();
      if (!A) {
        he(i("tl.no_clips"));
        return;
      }
      if (A.player.getProgress().playing) {
        Zs();
        return;
      }
      Xn(), ue.current.select(null), p === "camera" && nn("director");
      const L = A.player;
      L.play(), _.setCameraDriver(B => L.tick(B, _.camera)), _.setCamPathVizSuppressed("*"), _.setCamIndicatorsVisible(!1), xe({
        playing: !0
      });
    },
    ou = _ => {
      const A = d.current;
      if (!A || ee || be) return;
      const L = la();
      if (L) {
        if (L.player.getProgress().playing) {
          L.player.seek(_);
          return;
        }
        p === "camera" && nn("director"), L.player.applyAt(_, A.camera), ir(A);
      }
    },
    ru = () => {
      var A, L;
      const _ = ((A = pt.current) == null ? void 0 : A.player) ?? ((L = ge.current) == null ? void 0 : L.player);
      return _ ? _.getProgress() : null;
    },
    Js = () => {
      const _ = d.current;
      if (!_ || be) return;
      if (ee) {
        he(i("dlg.vcam_busy"));
        return;
      }
      if (!Io()) {
        he(i("tl.export_unsupported"));
        return;
      }
      const A = ue.current,
        L = A.present.camTimeline,
        B = Gt(L);
      if (!L || B <= 0) {
        he(i("tl.no_clips"));
        return;
      }
      Qs(), Xn(), A.select(null), p === "camera" && nn("director");
      const X = _.camera.fov,
        V = new Po(L, A.present.camPaths ?? [], Le => _.getObjectCenter(Le), X, null, di(_), A.present.customMotions),
        te = new Ng(),
        ie = () => {
          pt.current = null, _.setCameraDriver(null), _.endVideoCapture(), _.endCleanCapture(), _.setCamPathVizSuppressed(null), _.clearDrivenObjects(), Math.abs(_.camera.fov - X) > 0.001 && (_.camera.fov = X, _.camera.updateProjectionMatrix()), ir(_), Et(!1);
        };
      _.beginCleanCapture(), _.setCamPathVizSuppressed("*"), V.applyAt(0, _.camera);
      const At = P.current === "Auto" ? null : Si(P.current);
      try {
        const Le = _.beginVideoCapture(At);
        te.begin({
          canvas: Le,
          durationMs: B,
          fps: 30
        });
      } catch {
        ie(), he(i("tl.export_unsupported"));
        return;
      }
      pt.current = {
        exporter: te,
        player: V,
        cleanup: ie
      }, Et(!0), V.onEnd = async () => {
        try {
          const Le = await te.finish(),
            Bt = `${i("tl.panel_title")}${Le.ext}`;
          (await Th(Le.blob, Bt).catch(() => !1)) ? vt(i("tl.export_inserted")) || he(i("tl.export_inserted")) : (Rg(Le.blob, Bt), he(i("tl.export_done")));
        } catch {
          he(i("tl.export_failed"));
        }
        ie();
      }, V.play(), _.setCameraDriver(Le => {
        V.tick(Le, _.camera), te.onFrame(V.getProgress().tMs);
      });
    },
    da = k.useRef(Js);
  da.current = Js;
  const ua = () => {
      const _ = pt.current;
      _ && (_.exporter.cancel(), _.cleanup());
    },
    Xn = () => {
      const _ = d.current,
        A = se;
      ht(null), !(!_ || !A || _.camPathEditingId !== A) && _.exitCamPathEdit();
    },
    ha = k.useRef(Xn);
  ha.current = Xn;
  const iu = (_, A) => {
      const L = d.current;
      if (L) {
        if (A == null) {
          L.camPathEditorSelectPoint(null);
          return;
        }
        if (se !== _.id) {
          if (ee) {
            he(i("dlg.vcam_busy"));
            return;
          }
          if (be) return;
          Zs(), p === "camera" && nn("director"), r.select(_.id), L.enterCamPathEdit(_.id, _.points, !!_.closed), ht(_.id);
        }
        L.camPathEditorSelectPoint(A);
      }
    },
    au = (_, A, L, B) => {
      var ja;
      const X = d.current;
      if (!X) return;
      const V = ue.current,
        te = X.camera,
        ie = te.position.x - A.x,
        At = te.position.z - A.z,
        Le = Math.hypot(ie, At),
        Bt = Le > 0.001 ? {
          x: ie / Le,
          y: 0,
          z: At / Le
        } : {
          x: 0,
          y: 0,
          z: 1
        },
        no = {
          center: {
            x: A.x,
            y: A.y,
            z: A.z
          },
          radius: ke.clamp(Le, 2, 15),
          startDir: Bt,
          height: ke.clamp(te.position.y * 0.25, 1.2, 12),
          targetId: B
        },
        {
          points: so,
          ...oo
        } = _.build(no),
        Mu = {
          ...ml(((ja = V.present.camPaths) == null ? void 0 : ja.length) ?? 0, so),
          ...oo
        };
      V.addCamPathClip(Mu, L);
    },
    lu = (_, A) => {
      var te;
      const L = d.current;
      if (!L || _.length < 2) return;
      const B = ue.current,
        X = Li(_),
        V = ml(((te = B.present.camPaths) == null ? void 0 : te.length) ?? 0, X);
      B.addCamPathClip(V, A), L.enterCamPathEdit(V.id, V.points), ht(V.id), he(i("dlg.campath_created_hint"));
    },
    pa = (_, A) => {
      const L = d.current;
      if (!L) {
        A(null);
        return;
      }
      p === "camera" && nn("director"), Y(_), L.requestGroundPick(B => {
        Y(null), A(B);
      });
    },
    fa = (_, A) => {
      const L = d.current;
      if (!L || be) return;
      if (ee) {
        he(i("dlg.vcam_busy"));
        return;
      }
      Zs();
      const B = A ? Qi.find(ie => ie.id === A) : void 0;
      if (A && !B) return;
      se && Xn();
      const X = ue.current,
        V = X.selectedId,
        te = V && (X.present.characters.some(ie => ie.id === V) || X.present.props.some(ie => ie.id === V)) ? V : void 0;
      X.select(null), B ? pa(i("dlg.campath_pick_point"), ie => {
        ie && au(B, ie, _, te);
      }) : (p === "camera" && nn("director"), Y(i("dlg.campath_draw_hint")), L.requestGroundDraw(ie => {
        Y(null), ie && lu(ie, _);
      }));
    },
    cr = () => {
      const _ = ue.current,
        A = _.present.characters;
      return A.length === 0 ? null : A.find(L => L.id === _.selectedId) ?? A[0];
    },
    cu = _ => {
      if (be) return;
      Zs();
      const A = cr();
      if (!A) {
        he(i("tl.no_chars"));
        return;
      }
      ue.current.addAnimClip(_, A.id, null);
    },
    du = () => {
      be || Ye(_ => (_ || (M(!1), Z(!1), lt(!1), de(!1)), !_));
    },
    uu = () => {
      be || Z(_ => (_ || (M(!1), Ye(!1), lt(!1), de(!1)), !_));
    };
  k.useEffect(() => {
    et || (Ye(!1), Z(!1));
  }, [et]);
  const eo = _ => {
      pa(i("dlg.place_pick_point"), A => _(A ? {
        x: A.x,
        y: 0,
        z: A.z
      } : null));
    },
    hu = _ => {
      eo(A => {
        A && ue.current.addCharacter(_, A);
      });
    },
    pu = async _ => {
      var At;
      const A = ((At = _.name.split(".").pop()) == null ? void 0 : At.toLowerCase()) ?? "",
        L = _.name.replace(/\.(glb|gltf|ply|spz)$/i, "").trim(),
        B = A === "ply" || A === "spz";
      if (!(A === "glb" || A === "gltf") && !B) {
        const Le = qt.current("dlg.unsupported_format", {
          format: A.toUpperCase()
        });
        vt(Le, "error") || (v(Le), setTimeout(() => v(null), 4e3));
        return;
      }
      const V = await Ih(_, _.name),
        te = (V == null ? void 0 : V.url) ?? URL.createObjectURL(_),
        ie = !V;
      eo(Le => {
        var so, oo;
        if (!Le) {
          ie && URL.revokeObjectURL(te);
          return;
        }
        const Bt = ue.current,
          no = {
            id: $e(),
            label: L || (B ? `点云${((so = Bt.present.models) == null ? void 0 : so.length) ?? 1}` : `模型${((oo = Bt.present.models) == null ? void 0 : oo.length) ?? 1}`),
            modelUrl: te,
            modelName: _.name,
            modelType: B ? "pointcloud" : "mesh",
            position: Le,
            rotation: {
              x: 0,
              y: 0,
              z: 0
            },
            scale: {
              x: 1,
              y: 1,
              z: 1
            },
            uniformScale: 1,
            visible: !0,
            locked: !1,
            shadowEnabled: !B,
            pointSize: B ? 0.05 : void 0,
            pointColor: void 0
          };
        Bt.addModel(no);
      });
    },
    fu = (_, A, L, B) => {
      _ < 1 || A < 1 || eo(X => {
        if (!X) return;
        const V = ue.current,
          te = V.present.characters.length,
          ie = [];
        for (let At = 0; At < _; At++) for (let Le = 0; Le < A; Le++) {
          const Bt = Wo(te + ie.length, B);
          Bt.position = {
            x: X.x + (Le - (A - 1) / 2) * L,
            y: X.y,
            z: X.z + (At - (_ - 1) / 2) * L
          }, ie.push(Bt);
        }
        V.addCharacters(ie, `${qt.current("common.crowd_default")}${V.present.characterGroups.length + 1}(${_}x${A})`);
      });
    },
    dr = (_, A) => {
      _ && (r.updateEnv({
        panoramaUrl: _,
        panoramaSource: A,
        backgroundMode: "panorama"
      }), he(i("pp.panorama_selected")));
    },
    mu = async () => {
      if (zs()) {
        const A = await _c();
        A && dr(A.url, "upload");
        return;
      }
      const _ = document.createElement("input");
      _.type = "file", _.accept = "image/*", _.onchange = () => {
        var L;
        const A = (L = _.files) == null ? void 0 : L[0];
        A && dr(URL.createObjectURL(A), "upload");
      }, _.click();
    },
    gu = () => ae(!0),
    gn = k.useRef(null);
  k.useEffect(() => () => {
    gn.current && clearTimeout(gn.current);
  }, []);
  const xu = async _ => {
      const A = `请在 3D 导演台里用 model.generate 生成 3D 模型：${_.prompt || "按参考图尽可能忠实重建"}`;
      if (!(await fr(A, _.referencePaths))) {
        const X = i("aigen.no_host");
        vt(X, "error") || he(X);
        return;
      }
      rt(!0), gn.current && clearTimeout(gn.current), gn.current = setTimeout(() => rt(!1), 10 * 6e4);
      const B = i("aigen.sent");
      vt(B) || he(B);
    },
    xn = k.useRef(null),
    ma = k.useRef(null);
  k.useEffect(() => () => {
    xn.current && clearTimeout(xn.current);
  }, []);
  const bu = async _ => {
      if (!cr()) {
        he(i("tl.no_chars"));
        return;
      }
      const L = `请在 3D 导演台里用 scene.edit 的 set_motion 创作一个自定义角色动作并挂到目标角色的时间线：${_}`;
      if (!(await fr(L))) {
        const V = i("aigen.no_host");
        vt(V, "error") || he(V);
        return;
      }
      ma.current = ue.current.present.customMotions ?? null, Ue(!0), xn.current && clearTimeout(xn.current), xn.current = setTimeout(() => Ue(!1), 10 * 6e4);
      const X = i("aimotion.sent");
      vt(X) || he(X);
    },
    ga = r.present.customMotions;
  k.useEffect(() => {
    it && (ga ?? null) !== ma.current && (Ue(!1), xn.current && (clearTimeout(xn.current), xn.current = null));
  }, [ga, it]);
  const bn = k.useRef(null),
    xa = k.useRef(null);
  k.useEffect(() => () => {
    bn.current && clearTimeout(bn.current);
  }, []);
  const wu = async _ => {
      const A = `请在 3D 导演台里用 scene.edit 的 set_campath 撰写运镜 DSL，设计一段相机运镜并挂到时间线：${_}`;
      if (!(await fr(A))) {
        const X = i("aigen.no_host");
        vt(X, "error") || he(X);
        return;
      }
      xa.current = ue.current.present.camPaths ?? null, st(!0), bn.current && clearTimeout(bn.current), bn.current = setTimeout(() => st(!1), 10 * 6e4);
      const B = i("aipath.sent");
      vt(B) || he(B);
    },
    ba = r.present.camPaths;
  k.useEffect(() => {
    ut && (ba ?? null) !== xa.current && (st(!1), bn.current && (clearTimeout(bn.current), bn.current = null));
  }, [ba, ut]);
  const wa = k.useRef(null),
    ya = _ => {
      var A;
      _ === null && ((A = wa.current) == null ? void 0 : A.method) === "model.generate" && (rt(!1), gn.current && (clearTimeout(gn.current), gn.current = null)), wa.current = _, W(_);
    },
    va = k.useRef(ya);
  va.current = ya, h0(r, u, _ => va.current(_));
  const yu = async _ => {
      ce(!0);
      try {
        const {
          items: A
        } = await Eg(_);
        A.length && dr(A[0].url, "ai");
      } catch (A) {
        he((A == null ? void 0 : A.message) ?? i("pgen.failed"));
      } finally {
        ce(!1);
      }
    },
    to = async () => {
      const _ = d.current;
      if (!_) return;
      let A;
      if (p !== "camera") {
        const V = _.currentViewAsCamera();
        A = Bo(r.present.cameras.length), A.position = {
          ...V.position
        }, A.lookAt = {
          ...V.lookAt
        }, A.fov = V.fov, r.insertCamera(A), x("camera"), b(A.id), _.enterCameraView(A), Ts({
          viewMode: "camera",
          cameraId: A.id,
          aspect: P.current
        });
      } else A = r.present.cameras.find(V => V.id === r.selectedId) ?? r.present.cameras[0];
      if (!A) {
        he(i("dlg.add_camera_first"));
        return;
      }
      const L = E === "Auto" ? null : Si(E),
        B = _.captureCamera(A, L);
      if (!B) {
        he(i("dlg.capture_failed"));
        return;
      }
      const X = `${A.label || i("common.camera_default")}.jpg`;
      try {
        if (await Ph(B, X)) {
          vt(i("dlg.output_done")) || he(i("dlg.output_done"));
          return;
        }
      } catch (V) {
        he((V == null ? void 0 : V.message) ?? i("dlg.output_failed"));
        return;
      }
      Ix(B, X), he(i("dlg.downloaded"));
    },
    vu = () => M(_ => !_),
    _a = k.useRef(to);
  _a.current = to;
  const ka = k.useRef(async () => {});
  ka.current = async () => {
    pt.current || (await _a.current(), Gt(ue.current.present.camTimeline) > 0 && da.current());
  }, k.useEffect(() => Ch(() => ka.current()), []);
  const [_u, ku] = k.useState(() => jh());
  k.useEffect(() => {
    let _ = !1;
    return Sh().then(A => {
      _ || ku(A);
    }), () => {
      _ = !0;
    };
  }, []);
  const Aa = {
      editingId: se,
      selectedPointIdx: Xe,
      onSelectPoint: iu,
      onUpdatePoint: (_, A, L) => {
        var B;
        return (B = d.current) == null ? void 0 : B.camPathEditorUpdatePoint(_, A, L);
      }
    },
    Ma = () => {
      ee || (p === "camera" && nn("director"), Xn(), Qs(), ua(), Ye(!1), Z(!1), de(!0));
    };
  if (!o) return null;
  const Au = {
      session: tt,
      onPlayPause: su,
      onSeek: ou,
      getProgress: ru,
      onTogglePathPicker: du,
      pathPickerOpen: at,
      onToggleAnimPicker: uu,
      animPickerOpen: K,
      onOpenVCam: Ma,
      onExport: Js,
      onCancelExport: ua,
      exporting: be,
      exportSupported: Io() != null
    };
  window.__dxPlayback = { toggle: su, pause: Zs, seekMs: ou, progress: ru };
  window.__dxAspect = { get: () => E, set: eu };
  const
    ur = be ? i("tl.export_hint") : Io() == null ? i("tl.export_unsupported") : Gt(r.present.camTimeline) <= 0 ? i("tl.no_clips") : null,
    Ea = _ => `grid h-9 w-9 place-items-center rounded-[10px] transition-colors ${_ ? "bg-foreground text-background" : "text-muted-foreground hover:bg-foreground/10 hover:text-foreground"}`;
  return <div ref={Rt} className="fixed inset-0 z-50 flex flex-col bg-background"><header className="relative flex h-12 shrink-0 items-center border-b border-border bg-[var(--sidebar)] px-4"><button type="button" disabled={C} className={`flex h-8 items-center gap-1.5 rounded-[8px] px-2.5 text-[13px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${y ? "bg-foreground text-background" : "text-muted-foreground hover:bg-foreground/10 hover:text-foreground"}`} title={i(y ? "tree.collapse" : "tree.expand")} aria-label={i(y ? "tree.collapse" : "tree.expand")} aria-expanded={y} onClick={() => I(_ => !_)}>{y ? <UiYd size={16} /> : <UiVd size={16} />}<span>{i("tree.title")}</span></button><div className="ml-2 flex rounded-[12px] border border-border bg-muted p-0.5">{["director", "camera"].map(_ => {
          const A = _ === "camera" ? p === "camera" : p !== "camera";
          return <button key={_} className={`px-4 py-1 text-[13px] rounded-[10px] transition-colors ${A ? "bg-foreground text-background font-medium" : "text-muted-foreground hover:text-foreground"}`} onClick={() => {
            if (ee) {
              he(i("dlg.vcam_busy"));
              return;
            }
            _ === "camera" ? tu() : nn("director");
          }}>{i(_ === "director" ? "dlg.director_view" : "dlg.camera_view")}</button>;
        })}</div><div className="flex-1" /><div className="flex items-center gap-1.5"><button className={Ea(ee)} title={i("dlg.vcam_open_title")} onClick={() => ee ? de(!1) : Ma()}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="7" y="2.5" width="10" height="19" rx="2.2" /><path d="M11 18.5h2" /><path d="M2.5 9.5v5M4.5 12h-2" opacity=".7" /><path d="M21.5 9.5v5M19.5 12h2" opacity=".7" /></svg></button><div className="mx-1 h-5 w-px bg-border" /><div className="relative" ref={U}><button className={Ea(H)} title={i("dlg.shortcuts")} onClick={() => F(_ => !_)}><UiBm size={18} /></button>{H && <Tx containerRef={U} onClose={() => F(!1)} />}</div><div className="mx-1 h-5 w-px bg-border" /><button disabled={!r.canUndo} className="grid h-9 w-9 place-items-center rounded-[10px] text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent" title={i("dlg.undo")} onClick={() => r.undo()}><UiIm size={18} /></button><button disabled={!r.canRedo} className="grid h-9 w-9 place-items-center rounded-[10px] text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent" title={i("dlg.redo")} onClick={() => r.redo()}><UiAm size={18} /></button><div className="mx-1 h-5 w-px bg-border" /><button disabled={be} className="h-8 shrink-0 rounded-[8px] bg-muted px-2.5 text-[13px] font-medium text-foreground transition-colors hover:bg-muted/80 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-muted" data-run-action={!0} onClick={to}>{i("dlg.export_image")}</button><div className="group relative shrink-0"><button disabled={ur != null} className="h-8 rounded-[8px] bg-muted px-2.5 text-[13px] font-medium text-foreground transition-colors hover:bg-muted/80 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-muted" onClick={Js}>{i("tl.export")}</button>{ur && <div className="pointer-events-none absolute right-0 top-full z-50 mt-2 whitespace-nowrap rounded-md border border-border bg-popover px-2 py-1 text-[11px] text-popover-foreground opacity-0 transition-opacity group-hover:opacity-100">{ur}</div>}</div>{_u && <button disabled={be} className="h-8 shrink-0 rounded-[8px] bg-muted px-2.5 text-[13px] font-medium text-foreground transition-colors hover:bg-muted/80 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-muted" onClick={() => {
          var _;
          (_ = bt.current) == null || _.flush(), jc();
        }}>{i("dlg.exit_editing")}</button>}</div></header><div className="flex min-h-0 flex-1">{!C && <UiWm comp={r.present} store={r} expanded={y} onToggleExpanded={() => I(_ => !_)} onEnterCamera={_ => {
        p === "camera" && rr(_);
      }} />}<div className="flex min-w-0 flex-1 flex-col"><div className="relative min-h-0 flex-1 bg-background"><div ref={l} className="absolute inset-0" />{r.present.environment.referenceImageUrl && r.present.environment.showReferenceImage !== !1 && <img src={r.present.environment.referenceImageUrl} alt="" className="pointer-events-none absolute left-[4%] top-[4%] z-10 h-[92%] w-[92%] object-contain" style={{
            opacity: r.present.environment.referenceImageOpacity ?? 0.32
          }} />}{E !== "Auto" && <Px aspect={E} />}{r.present.environment.referenceImageUrl && <div className="absolute left-4 top-4 z-20 flex items-center gap-2 rounded-[10px] border border-border bg-popover/90 px-2.5 py-1.5 text-[10.5px] text-muted-foreground"><button className={r.present.environment.showReferenceImage !== !1 ? "text-foreground" : "opacity-55"} onClick={() => r.updateEnv({
              showReferenceImage: r.present.environment.showReferenceImage === !1
            })}>{r.present.environment.showReferenceImage === !1 ? "显示参考" : "参考叠图"}</button><input aria-label="参考图透明度" type="range" min={0.05} max={0.8} step={0.01} value={r.present.environment.referenceImageOpacity ?? 0.32} onChange={_ => r.updateEnv({
              referenceImageOpacity: Number(_.target.value)
            }, !1)} onPointerUp={() => r.commitTransientUpdate()} className="w-20 accent-current" /><button title="移除参考叠图" onClick={() => r.updateEnv({
              referenceImageUrl: "",
              showReferenceImage: !1
            })}>×</button></div>}{G && <div className="absolute left-1/2 top-4 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full border border-border bg-popover/95 px-3.5 py-1.5 text-[12px] text-popover-foreground"><span className="block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent opacity-60" />{i("aigen.agent_working", {
              method: G.method
            })}</div>}<div className="absolute right-4 top-4 z-20"><Og engine={u} onSelect={_ => {
              var A;
              return (A = d.current) == null ? void 0 : A.applyAxisView(_);
            }} onReset={() => nn("director")} /></div>{Nn && !we && !w && <div className="absolute bottom-24 left-1/2 z-20 -translate-x-1/2 rounded-[14px] border border-border bg-popover/95 p-1.5 text-popover-foreground"><div className="px-2 pb-1.5 pt-0.5 text-center text-[11px] text-muted-foreground">{i("tool.shortcut_hint")}</div><div className="flex items-center gap-1">{[["translate", "tool.move", "1"], ["rotate", "tool.rotate", "2"], ["scale", "tool.scale", "3"]].map(([_, A, L]) => <button key={_} type="button" className={`flex h-8 items-center gap-2 rounded-[9px] px-3 text-[12px] font-medium transition-colors ${m === _ ? "bg-foreground text-background" : "text-muted-foreground hover:bg-foreground/10 hover:text-foreground"}`} onClick={() => f(_)}><span>{i(A)}</span><kbd className="text-[11px] opacity-70">{L}</kbd></button>)}</div></div>}{we && !w && (() => {
            const _ = we.split(/[；;，,]/).map(A => A.trim()).filter(Boolean);
            return _.length > 1 ? <div className="absolute bottom-24 left-1/2 flex -translate-x-1/2 items-center gap-2 opacity-30">{_.map((A, L) => <div key={L} className="whitespace-nowrap rounded-xl border border-border bg-popover px-3 py-1.5 text-[12px] text-popover-foreground">{A}</div>)}</div> : <div className="absolute bottom-24 left-1/2 -translate-x-1/2 rounded-xl border border-border bg-popover px-3 py-1.5 text-[12px] text-popover-foreground">{we}</div>;
          })()}{w && <div className="absolute bottom-24 left-1/2 -translate-x-1/2 rounded-xl border border-border bg-popover px-3 py-1.5 text-[12px] text-popover-foreground">{w}</div>}<UiXg mode={m} onMode={f} onPanoramaUpload={mu} onPanoramaAi={gu} panoBusy={He} onScreenshot={to} onFullscreen={vu} fullscreen={C} onAspect={eu} aspect={E} onAddCamera={nu} timelineOpen={et} onToggleTimeline={() => xt(_ => !_)} propPickerOpen={Ve} onTogglePropPicker={() => {
            de(!1), Ye(!1), Z(!1), lt(_ => (_ || M(!1), !_));
          }} /></div><UiLg open={et} engine={u} store={r} ctl={Au} camPathCtl={Aa} canvasSelectionRevision={N} /></div>{ee ? <Cx open={ee} engine={u} store={r} onClose={() => de(!1)} onFlash={he} onTakeImported={() => xt(!0)} /> : !C && <Wm comp={r.present} store={r} engine={u} snapEnabled={j} onToggleSnap={() => D(_ => !_)} camPathCtl={Aa} camPathPicker={{
        open: at,
        onManual: () => fa(null),
        onPickPreset: _ => fa(null, _),
        onAiGenerate: () => {
          be || Je(!0);
        },
        onReuse: _ => {
          if (be) return;
          const A = {
            ...JSON.parse(JSON.stringify(_)),
            id: $e()
          };
          r.addCamPathClip(A, null);
        },
        onRemove: _ => {
          be || r.remove(_);
        },
        aiBusy: ut,
        onClose: () => Ye(!1)
      }} animPicker={{
        open: K,
        onPick: cu,
        onAiGenerate: () => {
          if (!be) {
            if (!cr()) {
              he(i("tl.no_chars"));
              return;
            }
            dt(!0);
          }
        },
        aiBusy: it,
        onRemoveCustom: _ => {
          be || r.removeMotion(_);
        },
        onClose: () => Z(!1)
      }} propPicker={{
        open: Ve,
        onPick: _ => eo(A => {
          A && r.addProp(_, A);
        }),
        onPickCharacter: hu,
        onUploadCharacter: pu,
        onAddCrowd: fu,
        onAiGenerate: () => ot(!0),
        aiBusy: Ke,
        onClose: () => lt(!1)
      }} />}</div><UiJg open={ne} onClose={() => ae(!1)} onSubmit={yu} /><Sg open={Re} onClose={() => ot(!1)} onSubmit={xu} /><$l open={De} title={i("aimotion.title")} placeholder={i("aimotion.placeholder")} onClose={() => dt(!1)} onSubmit={bu} /><$l open={gt} title={i("aipath.title")} placeholder={i("aipath.placeholder")} onClose={() => Je(!1)} onSubmit={wu} /></div>;
}
function Tx({
  containerRef: o,
  onClose: e
}) {
  const t = pe();
  k.useEffect(() => {
    const s = r => {
      o.current && !o.current.contains(r.target) && e();
    };
    return document.addEventListener("mousedown", s), () => document.removeEventListener("mousedown", s);
  }, [o, e]);
  const n = [{
    labelKey: "sc.viewport_nav",
    keys: ["WASD", "Q / E"]
  }, {
    labelKey: "sc.outliner_range",
    keys: ["Shift+Click", "Ctrl+Shift+Click"]
  }, {
    labelKey: "sc.marquee",
    keys: ["Shift+Drag", "Ctrl+Alt+Drag"]
  }, {
    labelKey: "sc.group_create",
    keys: ["Ctrl+G"]
  }, {
    labelKey: "sc.group_ungroup",
    keys: ["Shift+G", "Ctrl+Shift+G"]
  }, {
    labelKey: "sc.group_pivot",
    keys: ["Alt+MMB"]
  }, {
    labelKey: "sc.modes",
    keys: ["1", "2", "3"]
  }, {
    labelKey: "sc.snap",
    keys: ["X"]
  }, {
    labelKey: "sc.copy_paste",
    keys: ["Ctrl+C", "Ctrl+V"]
  }, {
    labelKey: "sc.delete",
    keys: ["Delete"]
  }, {
    labelKey: "sc.undo_redo",
    keys: ["Ctrl+Z", "Ctrl+Shift+Z"]
  }, {
    labelKey: "sc.deselect",
    keys: ["Esc"]
  }, {
    labelKey: "sc.focus",
    keys: ["F"]
  }, {
    labelKey: "sc.playhead",
    keys: ["C", "J / K"]
  }, {
    labelKey: "sc.lens",
    keys: ["[ / ]"]
  }];
  return <div className="absolute right-[-150px] top-full z-50 mt-2 w-[560px] max-w-[calc(100vw-24px)] rounded-[16px] border border-border bg-popover p-5"><div className="mb-4 text-[15px] font-semibold text-foreground">{t("dlg.shortcuts")}</div><div className="flex flex-col gap-3">{n.map(s => <div key={s.labelKey} className="flex items-center justify-between gap-3"><span className="whitespace-nowrap text-[13px] text-muted-foreground">{t(s.labelKey)}</span><div className="flex shrink-0 items-center gap-1.5">{s.keys.map((r, i) => <span key={r} className="flex items-center gap-1.5">{i > 0 && <span className="text-[12px] text-muted-foreground">/</span>}<kbd className="rounded-[10px] border border-border bg-muted px-2 py-0.5 text-[12px] font-medium text-foreground">{r}</kbd></span>)}</div></div>)}</div></div>;
}
function Px({
  aspect: o
}) {
  const e = k.useRef(null),
    [t, n] = k.useState(null);
  return k.useEffect(() => {
    const s = e.current;
    if (!s) return;
    const r = Si(o),
      i = () => {
        const l = s.clientWidth,
          d = s.clientHeight,
          u = 0.92;
        let h = l * u,
          m = h / r;
        m > d * u && (m = d * u, h = m * r), n({
          w: Math.round(h),
          h: Math.round(m)
        });
      };
    i();
    const a = new ResizeObserver(i);
    return a.observe(s), () => a.disconnect();
  }, [o]), <div ref={e} className="pointer-events-none absolute inset-0 z-[15] overflow-hidden">{t && (() => {
      const s = `calc(50% - ${t.h / 2}px)`,
        r = `calc(50% - ${t.w / 2}px)`,
        i = {
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          background: "rgba(0,0,0,0.42)"
        };
      return <><div className="absolute left-0 right-0 top-0" style={{
          height: s,
          ...i
        }} /><div className="absolute bottom-0 left-0 right-0" style={{
          height: s,
          ...i
        }} /><div className="absolute left-0" style={{
          top: s,
          height: t.h,
          width: r,
          ...i
        }} /><div className="absolute right-0" style={{
          top: s,
          height: t.h,
          width: r,
          ...i
        }} /><div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{
          width: t.w,
          height: t.h,
          outline: "1px solid rgba(255,255,255,0.55)"
        }}><div className="absolute inset-0 opacity-[0.18]"><div className="absolute left-1/3 top-0 bottom-0 w-px bg-white" /><div className="absolute left-2/3 top-0 bottom-0 w-px bg-white" /><div className="absolute top-1/3 left-0 right-0 h-px bg-white" /><div className="absolute top-2/3 left-0 right-0 h-px bg-white" /></div></div></>;
    })()}</div>;
}
function Si(o) {
  const e = /^(\d+(?:\.\d+)?):(\d+(?:\.\d+)?)$/.exec(String(o || ""));
  return e ? Number(e[1]) / Number(e[2]) : 16 / 9;
}
function Ix(o, e) {
  const t = document.createElement("a");
  t.href = o, t.download = e, document.body.appendChild(t), t.click(), t.remove();
}
function Nx({
  open: o,
  reason: e,
  onClose: t
}) {
  const n = pe(),
    s = k.useRef(null);
  if (k.useEffect(() => {
    var l;
    if (!o) return;
    const i = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    (l = s.current) == null || l.focus();
    const a = d => {
      var u;
      d.key === "Escape" ? (d.preventDefault(), t()) : d.key === "Tab" && (d.preventDefault(), (u = s.current) == null || u.focus());
    };
    return document.addEventListener("keydown", a), () => {
      document.removeEventListener("keydown", a), i != null && i.isConnected && i.focus();
    };
  }, [o, t]), !o) return null;
  const r = e === "win-non-ascii-path" ? "dlg.gpu_disabled_path" : e === "auto-crash" || e === "renderer-fallback" ? "dlg.gpu_disabled_auto" : e === "unknown" ? "dlg.gpu_disabled_unknown" : "dlg.gpu_disabled_message";
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4" role="presentation" onMouseDown={t}><div className="w-[460px] max-w-full rounded-2xl border border-border bg-popover p-6 text-foreground shadow-2xl" role="alertdialog" aria-modal="true" aria-labelledby="gpu-warning-title" aria-describedby="gpu-warning-description" onMouseDown={i => i.stopPropagation()}><div className="mb-4 flex items-start gap-3"><div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-amber-500/15 text-amber-500"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10.3 2.9 1.8 17a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 2.9a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg></div><div><h2 id="gpu-warning-title" className="text-[16px] font-semibold">{n("dlg.gpu_disabled_title")}</h2><p id="gpu-warning-description" className="mt-2 text-[13px] leading-6 text-muted-foreground">{n(r)}</p></div></div><div className="flex justify-end"><button ref={s} type="button" className="rounded-lg bg-foreground px-4 py-2 text-[13px] font-medium text-background transition-opacity hover:opacity-85" onClick={t}>{n("dlg.gpu_disabled_ack")}</button></div></div></div>;
}
function Rx() {
  const [o, e] = k.useState(null),
    [t, n] = k.useState(null),
    [s, r] = k.useState(null);
  return k.useEffect(() => {
    let i = !0;
    return (async () => {
      await Nh();
      const [a, l] = await Promise.all([g0(), x0()]);
      if (!i) return;
      const d = Rh();
      e(a ?? Rf()), n(l ?? {
        viewMode: "director",
        cameraId: null
      }), r(d.disabled ? d : null);
    })(), () => {
      i = !1;
    };
  }, []), !o || !t ? <div className="h-full w-full bg-background" /> : <UiYm><Dh><div className="flex h-full w-full items-center justify-center bg-background">{(s == null ? void 0 : s.disabled) === !0 ? <Nx open={!0} reason={s.reason} onClose={jc} /> : <Sx open={!0} initialComposition={o} initialView={t} onSave={i => {
          e(i);
        }} />}</div></Dh></UiYm>;
}
Lh.createRoot(document.getElementById("root")).render(<zh.StrictMode><Rx /></zh.StrictMode>);
