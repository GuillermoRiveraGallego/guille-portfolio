import { Euler, Quaternion, Vector3 } from 'three';

import { fbm1D } from '@/three/utils/noise';
import { Spring } from '@/three/utils/spring';

// Pose de hover (radianes en ejes locales: Y + abre hacia fuera; desplazamiento en unidades del
// modelo, un pétalo mide ~0.05). Los vecinos reciben una fracción mínima.
const HOVER = { lift: 0.1, twist: 0.04, push: 0.0012 };
const NEIGHBOR_HOVER = 0.12;

// Movimiento idle propio de cada pétalo: muy pequeño y lento, distinto en cada uno.
const IDLE = { lift: 0.014, twist: 0.006, speed: 0.13 };

// Respuesta del pétalo a las ráfagas del cursor.
const AIR = { lift: 0.3, twist: 0.12 };

const SPRING = { stiffness: 70, damping: 11 };

// Peel (clic): la punta empieza a levantarse mientras la base sigue unida (el pivote del GLB está
// en la base), con una torsión que aparta el lado tapado por el vecino de delante, y se separa un
// poco del centro. Muy sutil y con muelles rígidos para que ocurra en ~150 ms.
// `lift` y `twist` llegan ya con signo desde PetalTransitionController (según petalLayering).
const PEEL = { push: 0.002, tremble: 0.008, trembleSpeed: 14 };
const PEEL_SPRING = { stiffness: 190, damping: 15 };

const tmpEuler = new Euler();
const tmpQuat = new Quaternion();

// Estados del pétalo:
// - attached: en la flor (idle, hover y aire).
// - peeling: se despega por la punta, todavía unido a la flor por la base.
// - detached: ya no pertenece a la flor; PetalTransitionController mueve `node` y aquí no se toca.
export const PETAL_MODE = {
  attached: 'attached',
  peeling: 'peeling',
  detached: 'detached',
};

export class PetalController {
  constructor(node, index) {
    this.node = node;
    this.name = node.name;
    this.index = index;
    this.mode = PETAL_MODE.attached;

    this.baseQuaternion = node.quaternion.clone();
    this.basePosition = node.position.clone();

    // Eje X local (base → punta) en el espacio del padre, y su proyección 2D (la flor mira a
    // cámara) para saber cómo le afecta una ráfaga según su dirección.
    this.outward = new Vector3(1, 0, 0).applyQuaternion(this.baseQuaternion);
    const len = Math.hypot(this.outward.x, this.outward.y) || 1;
    this.outward2D = { x: this.outward.x / len, y: this.outward.y / len };

    this.seed = index * 7.31 + 1.7;
    this.hoverAmount = 0;

    this.springs = {
      lift: new Spring(SPRING),
      twist: new Spring(SPRING),
      push: new Spring(SPRING),
    };
  }

  // 1 = pétalo bajo el cursor, NEIGHBOR_HOVER = vecino, 0 = reposo.
  setHover(isHovered, isNeighbor) {
    this.hoverAmount = isHovered ? 1 : isNeighbor ? NEIGHBOR_HOVER : 0;
  }

  // Ráfaga de aire en coordenadas de pantalla (dirección normalizada * intensidad).
  applyAir(dirX, dirY, strength, dt) {
    if (this.mode !== PETAL_MODE.attached || strength <= 0) return;
    // Empuja más a los pétalos alineados con la ráfaga y los gira según el componente lateral.
    const along = dirX * this.outward2D.x + dirY * this.outward2D.y;
    const across = dirX * this.outward2D.y - dirY * this.outward2D.x;
    const variation = 0.75 + ((this.index * 0.37) % 0.5);
    this.springs.lift.kick(along * strength * AIR.lift * variation * dt * 60);
    this.springs.twist.kick(across * strength * AIR.twist * variation * dt * 60);
  }

  // `pose`: { lift, twist } en radianes (ejes locales, como el hover).
  peel(pose) {
    this.mode = PETAL_MODE.peeling;
    this.peelPose = pose;
    for (const spring of Object.values(this.springs)) {
      spring.stiffness = PEEL_SPRING.stiffness;
      spring.damping = PEEL_SPRING.damping;
    }
  }

  release() {
    this.mode = PETAL_MODE.detached;
  }

  update(dt, time, motion) {
    switch (this.mode) {
      case PETAL_MODE.detached:
        return;
      case PETAL_MODE.peeling:
        this.updatePeeling(dt, time, motion);
        return;
      case PETAL_MODE.attached:
      default:
        this.updateAttached(dt, time, motion);
    }
  }

  updatePeeling(dt, time, motion) {
    const tremble = motion ? fbm1D(time * PEEL.trembleSpeed, this.seed + 21) * PEEL.tremble : 0;
    this.applyPose(
      this.springs.lift.update(dt, this.peelPose.lift + tremble),
      this.springs.twist.update(dt, this.peelPose.twist + tremble * 0.5),
      this.springs.push.update(dt, PEEL.push)
    );
  }

  updateAttached(dt, time, motion) {
    const t = time * IDLE.speed;
    const idleLift = motion ? fbm1D(t, this.seed) * IDLE.lift : 0;
    const idleTwist = motion ? fbm1D(t * 0.8, this.seed + 3.1) * IDLE.twist : 0;

    const lift = this.springs.lift.update(dt, this.hoverAmount * HOVER.lift + idleLift);
    const twist = this.springs.twist.update(dt, this.hoverAmount * HOVER.twist + idleTwist);
    const push = this.springs.push.update(dt, this.hoverAmount * HOVER.push);
    this.applyPose(lift, twist, push);
  }

  applyPose(lift, twist, push) {
    this.node.quaternion
      .copy(this.baseQuaternion)
      .multiply(tmpQuat.setFromEuler(tmpEuler.set(twist, lift, 0)));
    this.node.position.copy(this.basePosition).addScaledVector(this.outward, push);
  }
}
