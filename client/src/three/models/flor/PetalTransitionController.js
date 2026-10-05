import { MathUtils, Matrix4, Quaternion, Vector3 } from 'three';

import { playTransitionSound } from '@/lib/transitionSounds';
import { getPetalLayering } from '@/three/models/flor/petalLayering';
import { fbm1D } from '@/three/utils/noise';
import { Spring } from '@/three/utils/spring';

// Transición principal: el pétalo pulsado se despega, sale de la flor por su propio lado, cae
// como un pétalo real y termina pasando pegado a la cámara. Cuando la cubre avisa para cambiar de
// ruta detrás. Primero separación, después caída: durante el escape no hay gravedad, así que el
// pétalo nunca atraviesa a sus vecinos.
//
// IDLE / HOVER        → la flor en reposo (el hover lo anima FlowerRig).
// PEELING             → la punta se levanta con la base aún unida (PetalController 'peeling').
// ESCAPING            → suelto, se aleja en su dirección de escape sin gravedad.
// RELEASED            → ya está fuera del volumen de la flor: el escape cede ante la gravedad.
// FALLING             → física completa: gravedad + resistencia del aire + flutter.
// APPROACHING_CAMERA  → la simulación se mezcla poco a poco con una trayectoria hacia la cámara.
// COVERING_CAMERA     → el pétalo llena el viewport: es la máscara de la transición.
// NAVIGATING          → ya se ha entregado el frame y se está cambiando de ruta.
// COMPLETE            → la escena se ha desmontado.
export const TRANSITION_STATE = {
  idle: 'idle',
  hover: 'hover',
  peeling: 'peeling',
  escaping: 'escaping',
  released: 'released',
  falling: 'falling',
  approaching: 'approaching_camera',
  covering: 'covering_camera',
  navigating: 'navigating',
  complete: 'complete',
};

const S = TRANSITION_STATE;

// Duraciones (s). El escape dura entre escapeMin y escapeMax: termina cuando el pétalo está fuera
// de la flor, no por tiempo. Total hasta cubrir la cámara ≈ 1.9 s (+ ~0.8 s de revelado DOM).
const TIMING = {
  peel: 0.15,
  escapeMin: 0.3,
  escapeMax: 0.85,
  blend: 0.45, // escape → gravedad
  approachDelay: 0.5, // desde que sale de la flor hasta que la cámara empieza a atraerlo
  approach: 0.85,
  reducedPeel: 0.16,
};

// Peel (rad, ejes locales del pétalo): la punta se levanta un poco hacia el lado libre de la normal
// y la torsión aparta del vecino de delante el lado que este tapa (signos según petalLayering).
const PEEL = { lift: 0.04, twist: 0.16 };

// Escape: velocidad en radios del pétalo por segundo (depende del tamaño del pétalo, no de la
// pantalla). La dirección es su eje base → punta mezclado con la radial desde el centro de la
// flor, más un poco hacia su lado libre. Durante el escape sigue inclinándose unos grados.
const ESCAPE = {
  speed: 4.5,
  response: 14, // rapidez con la que alcanza esa velocidad (sin tirón al soltarse)
  axis: 0.6, // peso del eje propio frente a la radial desde el centro
  side: 0.3,
  normal: 0.25,
  lift: 0.12,
  twist: 0.1,
  air: 0.6, // pequeña influencia del aire, en radios / s²
  // Ajuste artístico: si al salir (a `reach` radios, escape + inercia) acabaría fuera de la zona
  // libre de la pantalla, la dirección se desvía hacia su lado libre (pasa por delante del vecino
  // que tiene detrás, sin atravesarlo) y un poco hacia la cámara. Se usa el desvío mínimo.
  reach: 3,
  detourNormal: 0.5,
  detourSteps: 8,
};

// Fuera de la flor = su esfera envolvente separada de la de cada otro pétalo al menos este margin
// (fracción de su radio). Las esferas son conservadoras: un pétalo es casi plano.
const CLEARANCE = { margin: 0.15 };

// Física en unidades de H por segundo (H = alto visible de la pantalla a la distancia de la flor):
// el recorrido en pantalla no depende de la escala del modelo ni del encuadre.
// Velocidad terminal vertical = gravity / drag.vertical ≈ 0.4 H/s: cae despacio, como un pétalo.
const PHYSICS = {
  gravity: 1.15,
  drag: { vertical: 2.8, horizontal: 1.6 },
  drift: -0.38, // corriente hacia el hueco libre del hero (izquierda de la flor)
  // Colchón de aire que lo mantiene en la zona libre de la pantalla (ver `safeArea`): empieza a
  // actuar `soft` (NDC) antes del límite, como un muelle (`stiffness`) que además frena la
  // velocidad hacia fuera (`damping`). Actúa también durante el escape para que la inercia no lo
  // saque del viewport.
  safeArea: { soft: 0.15, stiffness: 22, damping: 7 },
};

// Flutter: vaivén lateral con inclinación alternante; en los extremos del vaivén el pétalo planea
// y frena la caída. Frecuencia y fuerzas se modulan con ruido para que nunca se repita.
const FLUTTER = {
  frequency: 1.25, // Hz
  sway: 2.2,
  glide: 2,
  depth: 0.3,
  roll: 0.55, // rad
  pitch: 0.3,
  yaw: 1.3,
};

// Acercamiento. El pétalo no llega centrado: apunta a `offset` (NDC, hacia el lado por el que
// viene) y solo corrige hasta `offsetKeep` de ese desvío; además llega inclinado (`tilt`, rad)
// para que su borde entre primero y la pantalla se cubra de forma irregular.
// `fill` < 1 hace que el pétalo sobre por los bordes del viewport; `angle` gira el pétalo sobre el
// eje de la cámara para que su lado ancho cubra el lado ancho de la pantalla. `maxScale` es la
// corrección de escala permitida si no puede acercarse más sin cortarse con el near plane.
const COVER = {
  fill: 0.8,
  angle: 0.35,
  spin: 0.35,
  offset: { x: 0.3, y: 0.18 },
  offsetKeep: 0.4,
  tilt: 0.55,
  tiltKeep: 0.3,
  maxScale: 1.4,
  shake: 0.004,
  defocus: 7,
  whooshAt: 0.55,
};

const SPIN_SPRING = { stiffness: 38, damping: 5 };

// Zona de la pantalla (NDC) por la que puede moverse el pétalo antes del acercamiento.
const DEFAULT_SAFE_AREA = { left: -1, right: 1, bottom: -1, top: 1 };

const WORLD_UP = new Vector3(0, 1, 0);
const X_AXIS = new Vector3(1, 0, 0);
const Y_AXIS = new Vector3(0, 1, 0);
const tmpVec = new Vector3();
const tmpAcc = new Vector3();
const tmpEscape = new Vector3();
const tmpPos = new Vector3();
const tmpNdc = new Vector3();
const tmpX = new Vector3();
const tmpY = new Vector3();
const tmpNormal = new Vector3();
const tmpCenter = new Vector3();
const tmpBase = new Vector3();
const tmpDetour = new Vector3();
const tmpProbe = new Vector3();
const tmpMatrix = new Matrix4();
const tmpQuat = new Quaternion();
const qRoll = new Quaternion();
const qPitch = new Quaternion();
const qYaw = new Quaternion();
const qLocal = new Quaternion();

const random = (min, max) => min + Math.random() * (max - min);
const smoothstep = (a, b, x) => {
  const t = MathUtils.clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const sign = (value, fallback) => (value === 0 ? fallback : Math.sign(value));
// Cuánto se sale un punto en NDC de la zona libre (0 si está dentro).
const outside = (ndc, { left, right, bottom, top }) =>
  Math.max(0, left - ndc.x, ndc.x - right) + Math.max(0, bottom - ndc.y, ndc.y - top);

export class PetalTransitionController {
  constructor(rig) {
    this.rig = rig;
    this.state = S.idle;

    // Simulación del centro del pétalo (no del pivote) para que gire sobre sí mismo.
    this.position = new Vector3();
    this.velocity = new Vector3();
    this.localCenter = new Vector3();
    this.startQuaternion = new Quaternion();
    this.quaternion = new Quaternion();
    this.baseScale = new Vector3(1, 1, 1);

    this.escape = { center: new Vector3(), direction: new Vector3(), radius: 0 };
    // Esferas envolventes del resto de pétalos: el volumen de la flor que hay que abandonar.
    this.obstacles = [];
    this.clearance = 0;

    this.coverDepth = 0;
    this.coverScale = 1;
    this.coverQuaternion = new Quaternion();
    this.coverOffset = { x: 0, y: 0 };
    this.offsetDirection = new Vector3();

    // Base de la cámara al soltarse: la cámara no se mueve durante la caída.
    this.right = new Vector3();
    this.up = new Vector3();
    this.back = new Vector3();

    this.shake = new Vector3();
    this.roll = new Spring(SPIN_SPRING);
    this.pitch = new Spring(SPIN_SPRING);

    this.blur = 0;
    this.coverReady = false;
  }

  get busy() {
    return this.state !== S.idle && this.state !== S.hover;
  }

  setHovered(hovered) {
    if (!this.busy) this.state = hovered ? S.hover : S.idle;
  }

  // Esfera envolvente del pétalo en el mundo. `out`: { center, radius }.
  sphereOf(petal, out) {
    const { node } = petal;
    const { geometry } = node;
    if (!geometry.boundingSphere) geometry.computeBoundingSphere();
    node.updateWorldMatrix(true, false);
    out.center.copy(geometry.boundingSphere.center).applyMatrix4(node.matrixWorld);
    out.radius = geometry.boundingSphere.radius * node.getWorldScale(tmpVec).x;
    return out;
  }

  // Dirección de escape de un pétalo todavía en la flor (también la usa el modo debug).
  // `out`: { center, direction, radius } en el mundo.
  escapeFor(petal, out) {
    const { node } = petal;
    this.sphereOf(petal, out);

    const layering = this.rig.analyzeLayering(petal.name);
    const normal = this.rig.getNormal(tmpNormal);

    // Radial desde el centro de la flor, en el plano de la flor: hacia fuera.
    const radial = tmpPos.copy(out.center).sub(this.rig.getCenter(tmpCenter));
    radial.addScaledVector(normal, -radial.dot(normal)).normalize();
    // Eje base → punta: ya sigue el cono que forman los pétalos.
    const axis = tmpX.copy(X_AXIS).transformDirection(node.matrixWorld);
    const side = tmpY.copy(Y_AXIS).transformDirection(node.matrixWorld);

    out.direction
      .copy(axis)
      .multiplyScalar(ESCAPE.axis)
      .addScaledVector(radial, 1 - ESCAPE.axis)
      .addScaledVector(side, ESCAPE.side * layering.freeSide)
      .addScaledVector(normal, ESCAPE.normal * layering.normal)
      .normalize();

    if (this.camera) {
      tmpDetour
        .copy(side)
        .multiplyScalar(sign(layering.freeSide, 1))
        .addScaledVector(normal, ESCAPE.detourNormal);
      this.keepInView(out, tmpDetour);
    }
    return out;
  }

  // Desvía `out.direction` hacia `detour` lo justo para que el final del escape no salga de la
  // zona libre de la pantalla (o salga lo menos posible).
  keepInView(out, detour) {
    const area = this.shrunkSafeArea();
    tmpBase.copy(out.direction);
    let best = 0;
    let bestOutside = Infinity;
    for (let i = 0; i <= ESCAPE.detourSteps; i++) {
      const s = i / ESCAPE.detourSteps;
      out.direction
        .copy(tmpBase)
        .multiplyScalar(1 - s)
        .addScaledVector(detour, s)
        .normalize();
      tmpProbe
        .copy(out.center)
        .addScaledVector(out.direction, out.radius * ESCAPE.reach)
        .project(this.camera);
      const miss = outside(tmpProbe, area);
      if (miss < bestOutside - 1e-4) {
        best = s;
        bestOutside = miss;
      }
      if (miss === 0) break;
    }
    out.direction
      .copy(tmpBase)
      .multiplyScalar(1 - best)
      .addScaledVector(detour, best)
      .normalize();
  }

  // Zona libre descontando la franja suave del colchón de aire.
  shrunkSafeArea() {
    const { left, right, bottom, top } = this.safeArea;
    const { soft } = PHYSICS.safeArea;
    return { left: left + soft, right: right - soft, bottom: bottom + soft, top: top - soft };
  }

  // Cámara y zona libre de la pantalla: hacen falta antes del clic para que el modo debug
  // muestre las direcciones de escape ya ajustadas.
  configure({ camera, safeArea = DEFAULT_SAFE_AREA }) {
    this.camera = camera;
    this.safeArea = safeArea;
  }

  // `motion` false (prefers-reduced-motion): peel mínimo y directamente a la máscara.
  // `canvas`: si se pasa, se desenfoca con CSS cuando el pétalo está pegado a la cámara (solo
  // desktop; en móvil no hay desenfoque). `safeArea`: zona libre de la pantalla en NDC
  // ({ left, right, bottom, top }) para no pasar por encima del texto ni salir del viewport.
  start(petal, section, { camera, motion, canvas, safeArea = DEFAULT_SAFE_AREA }) {
    if (this.busy || !petal) return false;

    this.configure({ camera, safeArea });
    Object.assign(this, { petal, section, motion, canvas });
    this.state = S.peeling;
    this.time = 0;
    this.clearAt = null;
    this.approachAt = null;

    // Variación controlada en cada ejecución.
    this.seed = Math.random() * 100;
    this.variation = random(0.85, 1.15);
    this.phase = Math.random() * Math.PI * 2;
    this.spinSign = Math.random() < 0.5 ? -1 : 1;
    this.yaw = 0;
    this.yawVelocity = random(-0.6, 0.6);
    for (const spring of [this.roll, this.pitch]) spring.value = spring.velocity = 0;
    this.whooshed = false;
    this.blur = 0;

    this.escapeFor(petal, this.escape);
    this.layering = getPetalLayering(petal.name);
    // Hacia delante salvo que solo esté libre por detrás (lift > 0 baja la punta).
    this.liftSign = this.layering.normal < 0 ? 1 : -1;
    this.rig.beginPeel(petal.name, {
      lift: PEEL.lift * this.liftSign,
      twist: PEEL.twist * this.layering.freeSide,
    });
    playTransitionSound('detach');
    return true;
  }

  update(dt) {
    if (!this.busy) return;
    const step = Math.min(dt, 1 / 30);
    this.time += step;

    switch (this.state) {
      case S.peeling:
        if (this.time < (this.motion ? TIMING.peel : TIMING.reducedPeel)) return;
        if (this.motion) this.beginEscape();
        else this.reachCover();
        return;
      case S.escaping:
      case S.released:
      case S.falling:
      case S.approaching:
        this.simulate(step, this.escapeWeight());
        this.updatePhase();
        this.approach();
        return;
      default:
    }
  }

  // Devuelve true una sola vez, en el frame en que el pétalo cubre la cámara.
  takeCover() {
    if (!this.coverReady) return false;
    this.coverReady = false;
    this.state = S.navigating;
    return true;
  }

  // Fin del peel: el pétalo deja de pertenecer a la flor. Se lleva a la raíz de la escena
  // conservando su transformación en el mundo (es el mismo mesh, no una copia).
  beginEscape() {
    const { node } = this.petal;
    const camera = this.camera;

    // El volumen de la flor (resto de pétalos) se mide justo antes de soltarlo.
    this.obstacles = this.rig.petals
      .filter(other => other !== this.petal)
      .map(other => this.sphereOf(other, { center: new Vector3(), radius: 0 }));
    // Dirección final desde la pose del peel.
    this.escapeFor(this.petal, this.escape);

    this.rig.releasePetal(this.petal.name);
    let root = node;
    while (root.parent) root = root.parent;
    root.attach(node);
    node.updateMatrixWorld();

    const { geometry } = node;
    if (!geometry.boundingBox) geometry.computeBoundingBox();
    geometry.boundingBox.getCenter(this.localCenter);
    this.baseScale.copy(node.scale);
    this.position.copy(this.localCenter).applyMatrix4(node.matrixWorld);
    this.startQuaternion.copy(node.quaternion);
    this.velocity.set(0, 0, 0);

    camera.updateMatrixWorld();
    this.right.setFromMatrixColumn(camera.matrixWorld, 0).normalize();
    this.up.setFromMatrixColumn(camera.matrixWorld, 1).normalize();
    this.back.setFromMatrixColumn(camera.matrixWorld, 2).normalize();
    this.tanHalf = Math.tan(MathUtils.degToRad(camera.fov / 2)) / camera.zoom;
    this.H = 2 * this.position.distanceTo(camera.position) * this.tanHalf;

    this.escapeAt = this.time;
    this.state = S.escaping;
  }

  // 1 durante el escape; tras salir de la flor cede ante la gravedad con una curva suave
  // (100/0 → 70/30 → 30/70 → 0/100).
  escapeWeight() {
    if (this.clearAt === null) return 1;
    return 1 - smoothstep(0, TIMING.blend, this.time - this.clearAt);
  }

  updatePhase() {
    if (this.state === S.escaping) {
      // Distancia mínima entre su esfera y la de cada otro pétalo (negativa = aún dentro).
      this.clearance = Infinity;
      for (const other of this.obstacles) {
        const gap = this.position.distanceTo(other.center) - other.radius - this.escape.radius;
        this.clearance = Math.min(this.clearance, gap);
      }
      const elapsed = this.time - this.escapeAt;
      const clear = this.clearance >= CLEARANCE.margin * this.escape.radius;
      if ((elapsed >= TIMING.escapeMin && clear) || elapsed >= TIMING.escapeMax) {
        this.clearAt = this.time;
        this.state = S.released;
      }
    } else if (this.state === S.released && this.time - this.clearAt >= TIMING.blend) {
      this.state = S.falling;
    }
  }

  // velocity += fuerzas * dt; position += velocity * dt. Mezcla dos conjuntos de fuerzas con el
  // peso del escape `w`: el escape (velocidad hacia fuera, sin gravedad) y la caída (gravedad,
  // resistencia, flutter, ruido). Así no hay corte entre fases y conserva la inercia hacia fuera.
  simulate(dt, w) {
    const H = this.H;
    const k = this.variation;
    const seed = this.seed;
    const t = this.time - this.escapeAt;
    const r = this.escape.radius;

    // Escape: tiende a su velocidad de salida + un soplo de aire mínimo.
    tmpEscape
      .copy(this.escape.direction)
      .multiplyScalar(ESCAPE.speed * r)
      .sub(this.velocity)
      .multiplyScalar(ESCAPE.response)
      .addScaledVector(this.right, fbm1D(t * 1.3, seed + 5) * ESCAPE.air * r)
      .addScaledVector(this.up, fbm1D(t * 1.1, seed + 13) * ESCAPE.air * r);

    // Caída.
    this.phase += dt * Math.PI * 2 * FLUTTER.frequency * k * (1 + 0.3 * fbm1D(t * 0.7, seed));
    const sin = Math.sin(this.phase);
    tmpAcc.set(0, (-PHYSICS.gravity + FLUTTER.glide * (sin * sin - 0.5)) * H, 0);
    tmpAcc.addScaledVector(
      this.right,
      (FLUTTER.sway * k * Math.cos(this.phase) + PHYSICS.drift) * H
    );
    tmpAcc.addScaledVector(this.back, FLUTTER.depth * fbm1D(t * 1.1, seed + 3) * H);
    tmpAcc.x -= PHYSICS.drag.horizontal * this.velocity.x;
    tmpAcc.y -= PHYSICS.drag.vertical * this.velocity.y;
    tmpAcc.z -= PHYSICS.drag.horizontal * this.velocity.z;

    this.velocity.addScaledVector(tmpEscape, dt * w).addScaledVector(tmpAcc, dt * (1 - w));
    // Durante el escape el colchón es más suave: la dirección ya viene ajustada a la pantalla
    // y no debe empujarlo de vuelta contra la flor.
    this.velocity.addScaledVector(this.safeAreaForce(tmpAcc.set(0, 0, 0)), dt * (1 - 0.75 * w));
    this.position.addScaledVector(this.velocity, dt);

    // Orientación: durante el escape solo sigue el peel unos grados; el flutter entra con la
    // caída. La inclinación va por delante del vaivén (como una hoja) y se mueve con muelles,
    // así tiene inercia; el giro sobre sí mismo es un par con ruido y amortiguación.
    const fall = 1 - w;
    const roll = this.roll.update(dt, FLUTTER.roll * k * Math.sin(this.phase + 0.6) * fall);
    const pitch = this.pitch.update(dt, FLUTTER.pitch * fbm1D(t * 0.9, seed + 7) * fall);
    this.yawVelocity +=
      (FLUTTER.yaw * fbm1D(t * 0.6, seed + 11) * fall - this.yawVelocity * 1.2) * dt;
    this.yaw += this.yawVelocity * dt * fall;

    const peel = 1 - Math.exp(-t * 4);
    qLocal.setFromAxisAngle(Y_AXIS, ESCAPE.lift * this.liftSign * peel);
    tmpQuat.setFromAxisAngle(X_AXIS, ESCAPE.twist * this.layering.freeSide * peel);
    qLocal.multiply(tmpQuat);

    this.quaternion
      .copy(qRoll.setFromAxisAngle(this.back, roll))
      .multiply(qPitch.setFromAxisAngle(this.right, pitch))
      .multiply(qYaw.setFromAxisAngle(WORLD_UP, this.yaw))
      .multiply(this.startQuaternion)
      .multiply(qLocal);
  }

  // Trayectoria dirigida: si el pétalo se acerca al texto o a los bordes, el aire lo devuelve a
  // la zona libre. Devuelve la aceleración en `acc`.
  safeAreaForce(acc) {
    const { left, right, bottom, top } = this.safeArea;
    const { soft, stiffness, damping } = PHYSICS.safeArea;
    tmpNdc.copy(this.position).project(this.camera);

    // Cuánto ha entrado en la franja suave de cada borde (> 0) y en qué sentido empujar.
    const push = (value, min, max) =>
      value < min + soft ? min + soft - value : value > max - soft ? max - soft - value : 0;
    const axes = [
      [this.right, push(tmpNdc.x, left, right)],
      [this.up, push(tmpNdc.y, bottom, top)],
    ];
    for (const [axis, depth] of axes) {
      if (depth === 0) continue;
      // Solo se frena la velocidad que va hacia el borde, no la que ya vuelve.
      const outward = Math.min(0, this.velocity.dot(axis) * Math.sign(depth));
      acc.addScaledVector(axis, depth * stiffness * this.H - outward * damping * Math.sign(depth));
    }
    return acc;
  }

  // Al empezar el acercamiento: a qué punto descentrado va y a qué profundidad tiene que llegar
  // para llenar el viewport por cercanía real.
  beginApproach() {
    const camera = this.camera;
    tmpNdc.copy(this.position).project(camera);
    const sx = sign(tmpNdc.x, this.spinSign);
    const sy = sign(tmpNdc.y, -1);
    this.coverOffset.x = sx * COVER.offset.x;
    this.coverOffset.y = sy * COVER.offset.y;
    this.offsetDirection
      .copy(this.right)
      .multiplyScalar(this.coverOffset.x)
      .addScaledVector(this.up, this.coverOffset.y)
      .normalize();

    // Medio viewport a profundidad d = d * tanHalf * (aspect, 1); con el desvío final el pétalo
    // tiene que cubrir además ese desplazamiento.
    const { geometry } = this.petal.node;
    const radius = (geometry.boundingBox.max.x - geometry.boundingBox.min.x) * 0.5;
    const ox = Math.abs(this.coverOffset.x) * COVER.offsetKeep;
    const oy = Math.abs(this.coverOffset.y) * COVER.offsetKeep;
    const reach = Math.hypot(camera.aspect * (1 + ox), 1 + oy) * this.tanHalf;
    const distance = (radius * this.baseScale.x * COVER.fill) / reach;
    const minDistance = camera.near * 4;
    this.coverDepth = Math.max(distance, minDistance);
    this.coverScale = Math.min(this.coverDepth / distance, COVER.maxScale);

    // Cara cóncava (+Z local) hacia la cámara, como ya está en la flor: sin volteos al acercarse.
    const z = this.back;
    tmpX.copy(camera.aspect >= 1 ? this.right : this.up);
    tmpX.applyAxisAngle(z, COVER.angle * this.spinSign);
    tmpY.crossVectors(z, tmpX);
    this.coverQuaternion.setFromRotationMatrix(tmpMatrix.makeBasis(tmpX, tmpY, z));
  }

  // Mezcla la simulación con la trayectoria hacia la cámara y aplica el resultado al mesh.
  approach() {
    const u =
      this.clearAt === null
        ? 0
        : MathUtils.clamp(
            (this.time - this.clearAt - TIMING.approachDelay) / TIMING.approach,
            0,
            1
          );
    if (u > 0 && this.approachAt === null) {
      this.approachAt = this.time;
      this.state = S.approaching;
      this.beginApproach();
    }
    if (!this.whooshed && u >= COVER.whooshAt) {
      this.whooshed = true;
      playTransitionSound('whoosh');
    }

    // La mezcla se hace en pantalla + profundidad, no en el mundo: en pantalla el pétalo se curva
    // suavemente hacia su punto descentrado y en profundidad sigue una cúbica, casi nada al
    // principio y aceleración final hacia la cámara. La perspectiva hace el resto: el tamaño en
    // pantalla crece con 1 / distancia.
    const camera = this.camera;
    const pull = u * u * u;
    const toTarget = smoothstep(0, 1, u);
    const settle = 1 - (1 - COVER.offsetKeep) * smoothstep(0.6, 1, u);
    const depth = MathUtils.lerp(
      -tmpVec.copy(this.position).sub(camera.position).dot(this.back),
      this.coverDepth,
      pull
    );
    tmpNdc.copy(this.position).project(camera);
    tmpNdc.set(
      MathUtils.lerp(tmpNdc.x, this.coverOffset.x * settle, toTarget),
      MathUtils.lerp(tmpNdc.y, this.coverOffset.y * settle, toTarget),
      0.5
    );
    const ray = tmpPos.copy(tmpNdc).unproject(camera).sub(camera.position);
    tmpPos.multiplyScalar(depth / -ray.dot(this.back)).add(camera.position);

    if (u > 0) {
      // El flutter se apaga al orientarse hacia la cámara, pero sigue girando un poco y llega
      // inclinado: el borde que mira al centro de la pantalla es el que entra primero.
      const tilt = COVER.tilt * (1 - (1 - COVER.tiltKeep) * smoothstep(0.6, 1, u));
      tmpVec.crossVectors(this.back, this.offsetDirection).normalize();
      tmpQuat
        .setFromAxisAngle(tmpVec, tilt)
        .multiply(qYaw.setFromAxisAngle(this.back, COVER.spin * u * this.spinSign))
        .multiply(this.coverQuaternion);
      this.quaternion.slerp(tmpQuat, smoothstep(0.1, 1, u));
    }

    const scale = MathUtils.lerp(1, this.coverScale, pull);
    const { node } = this.petal;
    node.quaternion.copy(this.quaternion);
    node.scale.copy(this.baseScale).multiplyScalar(scale);
    node.position
      .copy(this.localCenter)
      .multiply(node.scale)
      .applyQuaternion(this.quaternion)
      .negate()
      .add(tmpPos);

    // Desenfoque: el pétalo pasa demasiado cerca para estar enfocado.
    if (this.canvas) {
      this.blur = COVER.defocus * smoothstep(0.8, 1, u);
      this.canvas.style.filter = this.blur > 0.05 ? `blur(${this.blur.toFixed(2)}px)` : '';
    }

    // Micro reacción de la cámara al paso del pétalo (unos píxeles) que vuelve a cero.
    const shake = COVER.shake * this.H * Math.sin(Math.PI * smoothstep(0.82, 1, u));
    tmpVec
      .copy(this.right)
      .multiplyScalar(shake * this.spinSign)
      .addScaledVector(this.up, shake * 0.5);
    this.camera.position.sub(this.shake).add(tmpVec);
    this.shake.copy(tmpVec);

    if (u >= 1) this.reachCover();
  }

  reachCover() {
    this.state = S.covering;
    this.coverReady = true;
  }

  // Al desmontar la escena: deja la cámara y el canvas como estaban.
  dispose() {
    if (this.camera) this.camera.position.sub(this.shake);
    this.shake.set(0, 0, 0);
    if (this.canvas) this.canvas.style.filter = '';
    if (this.busy) this.state = S.complete;
  }
}
