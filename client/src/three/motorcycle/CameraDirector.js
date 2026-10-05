import { MathUtils, Vector3 } from 'three';

import { REDUCED_MOTION_SHOT, SHOTS } from '@/config/threeDWeb';
import { damp, smoothstep } from '@/three/utils/timeline';

// Lentitud de la cámara (lambda de la amortiguación): movimientos lentos y elegantes.
const SMOOTHING = { motion: 1.9, reduced: 40 };
// Entrada: la cámara llega desde un poco más lejos y girada unos grados, como un plano de producto.
const INTRO = { duration: 2.6, az: 0.2, el: 0.03, dist: 0.12 };
// Arrastre: grados máximos (rad) y cuánto gira por píxel. Al soltar vuelve despacio a su plano.
const DRAG = { az: 0.5, el: 0.14, mobileAz: 0.25, speed: 0.005, returnLambda: 0.7 };
// Parallax del cursor (rad): profundidad, no seguimiento.
const PARALLAX = { az: 0.03, el: 0.014, lambda: 2.5 };
// Foco en una pieza: distancia en radios de la pieza (con un mínimo en radios de la moto).
const FOCUS = { distance: 6, min: 0.55, el: 0.16 };
// En vertical los planos (pensados para pantallas apaisadas) se alejan para que la moto quepa a lo
// ancho: distancia × MOBILE_FIT / aspect (nunca más cerca que en desktop).
const MOBILE_FIT = 0.85;

const tmpTarget = new Vector3();

// Dirección de cámara: planos por capítulo (SHOTS) interpolados con la línea de tiempo, foco en
// piezas, arrastre limitado y parallax. Nunca cortes ni movimientos rápidos.
export class CameraDirector {
  constructor(camera, { center, radius, motion, mobile }) {
    this.camera = camera;
    this.center = center;
    this.radius = radius;
    this.motion = motion;
    this.mobile = mobile;

    const first = motion ? SHOTS[0] : REDUCED_MOTION_SHOT;
    this.az = first.az + (motion ? INTRO.az : 0);
    this.el = first.el;
    this.dist = first.dist * radius * (motion ? 1 + INTRO.dist : 1);
    this.target = center.clone();

    this.drag = { az: 0, el: 0, active: false };
    this.parallax = { x: 0, y: 0 };
    this.introTime = 0;
  }

  dragBy(dx, dy) {
    const maxAz = this.mobile ? DRAG.mobileAz : DRAG.az;
    this.drag.az = MathUtils.clamp(this.drag.az - dx * DRAG.speed, -maxAz, maxAz);
    this.drag.el = MathUtils.clamp(this.drag.el + dy * DRAG.speed * 0.6, -DRAG.el, DRAG.el);
  }

  // Plano en la posición `t` de la línea de tiempo.
  shotAt(t) {
    if (!this.motion) return REDUCED_MOTION_SHOT;
    const i = MathUtils.clamp(Math.floor(t), 0, SHOTS.length - 1);
    const a = SHOTS[i];
    const b = SHOTS[Math.min(i + 1, SHOTS.length - 1)];
    const f = smoothstep(0, 1, t - i);
    this.shot ??= { az: 0, el: 0, dist: 0 };
    this.shot.az = MathUtils.lerp(a.az, b.az, f);
    this.shot.el = MathUtils.lerp(a.el, b.el, f);
    this.shot.dist = MathUtils.lerp(a.dist, b.dist, f);
    return this.shot;
  }

  // `focus`: { center, radius } de la pieza enfocada o null. `pointer`: NDC del cursor o null.
  update(dt, t, focus, pointer) {
    const shot = this.shotAt(t);
    const lambda = this.motion ? SMOOTHING.motion : SMOOTHING.reduced;

    this.introTime += dt;
    const intro = this.motion ? 1 - smoothstep(0, INTRO.duration, this.introTime) : 0;

    if (!this.drag.active) {
      this.drag.az = damp(this.drag.az, 0, DRAG.returnLambda, dt);
      this.drag.el = damp(this.drag.el, 0, DRAG.returnLambda, dt);
    }
    const parallaxOn = this.motion && !this.mobile && pointer;
    this.parallax.x = damp(this.parallax.x, parallaxOn ? pointer.x : 0, PARALLAX.lambda, dt);
    this.parallax.y = damp(this.parallax.y, parallaxOn ? pointer.y : 0, PARALLAX.lambda, dt);

    const targetAz = shot.az + intro * INTRO.az;
    let targetEl = shot.el + intro * INTRO.el;
    let targetDist = shot.dist * this.radius * (1 + intro * INTRO.dist);
    if (focus) {
      tmpTarget.copy(focus.center);
      targetEl = FOCUS.el;
      targetDist = Math.max(focus.radius * FOCUS.distance, this.radius * FOCUS.min);
    } else {
      tmpTarget.copy(this.center);
    }
    if (this.mobile) targetDist *= Math.max(1, MOBILE_FIT / this.camera.aspect);

    this.az = damp(this.az, targetAz, lambda, dt);
    this.el = damp(this.el, targetEl, lambda, dt);
    this.dist = damp(this.dist, targetDist, lambda, dt);
    this.target.x = damp(this.target.x, tmpTarget.x, lambda, dt);
    this.target.y = damp(this.target.y, tmpTarget.y, lambda, dt);
    this.target.z = damp(this.target.z, tmpTarget.z, lambda, dt);

    const az = this.az + this.drag.az + this.parallax.x * PARALLAX.az;
    const el = this.el + this.drag.el + this.parallax.y * PARALLAX.el;
    this.camera.position.set(
      this.target.x + Math.sin(az) * Math.cos(el) * this.dist,
      this.target.y + Math.sin(el) * this.dist,
      this.target.z + Math.cos(az) * Math.cos(el) * this.dist
    );
    this.camera.lookAt(this.target);
  }
}
