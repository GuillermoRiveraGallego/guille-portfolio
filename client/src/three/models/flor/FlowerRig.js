import { Euler, Group, Quaternion, Vector3 } from 'three';

import { PETAL_SECTIONS } from '@/config/petals';
import { PetalController } from '@/three/models/flor/PetalController';
import { fbm1D } from '@/three/utils/noise';
import { Spring } from '@/three/utils/spring';

// Balanceo del tallo desde su base (radianes). Ciclos de ~15-25 s: en 2 s casi no se nota,
// en 10 s se percibe que la flor está viva.
const STEM_SWAY = { side: 0.008, depth: 0.005, speed: 0.055 };

// La cabeza acompaña al tallo con este retraso (s), como si tuviera inercia propia.
const HEAD_LAG = 0.9;
const HEAD_IDLE = 0.006;

// Respuesta de la cabeza a las ráfagas del cursor.
const HEAD_AIR = 0.12;

const STAMEN_IDLE = { amount: 0.022, speed: 0.35 };

const tmpEuler = new Euler();
const tmpQuat = new Quaternion();

// Ángulos del tallo en un instante: suma de ruido lento, nunca exactamente periódica.
function stemAngles(t) {
  const s = t * STEM_SWAY.speed;
  return {
    side: fbm1D(s, 11.3) * STEM_SWAY.side,
    depth: fbm1D(s * 0.83, 27.9) * STEM_SWAY.depth,
  };
}

// Vértice más bajo del tallo: pivote del balanceo.
function findStemBase(stem) {
  const positions = stem.geometry.attributes.position;
  const base = new Vector3(0, Infinity, 0);
  for (let i = 0; i < positions.count; i++) {
    const y = positions.getY(i);
    if (y < base.y) base.set(positions.getX(i), y, positions.getZ(i));
  }
  return base;
}

// Estado y animación de la flor como objetos Three (sin React): se construye una vez y se
// actualiza cada frame desde useFrame, sin setState ni objetos nuevos por frame.
export class FlowerRig {
  constructor(scene) {
    this.root = scene.clone(true);

    // Se inserta un grupo pivote en la base del tallo para que balancee toda la flor desde ahí.
    const flower = this.root.getObjectByName('Flor');
    const stemBase = findStemBase(this.root.getObjectByName('Tallo'));
    this.sway = new Group();
    this.sway.name = 'Balanceo';
    this.sway.position.copy(stemBase);
    flower.parent.add(this.sway);
    flower.position.sub(stemBase);
    this.sway.add(flower);

    this.head = this.root.getObjectByName('Cabeza_Flor');
    this.headBase = this.head.quaternion.clone();
    // Más blanda que los pétalos: la cabeza pesa más y responde más despacio.
    const headSpring = () => new Spring({ stiffness: 45, damping: 8 });
    this.headSprings = { x: headSpring(), y: headSpring(), z: headSpring() };

    this.petals = Object.keys(PETAL_SECTIONS).map(
      (name, i) => new PetalController(this.root.getObjectByName(name), i)
    );
    this.petalsByName = new Map(this.petals.map(petal => [petal.name, petal]));

    this.stamens = Array.from({ length: 10 }, (_, i) => {
      const node = this.root.getObjectByName(`Estambre_${String(i + 1).padStart(2, '0')}`);
      return { node, base: node.quaternion.clone(), seed: i * 3.7 + 0.5 };
    });

    this.hovered = null;
  }

  getPetal(name) {
    return this.petalsByName.get(name);
  }

  // El pétalo bajo el cursor se separa; sus dos vecinos reaccionan de forma casi imperceptible.
  setHoveredPetal(name) {
    this.hovered = name;
    const index = this.petals.findIndex(petal => petal.name === name);
    const count = this.petals.length;

    this.petals.forEach((petal, i) => {
      const isNeighbor =
        index >= 0 && (i === (index + 1) % count || i === (index - 1 + count) % count);
      petal.setHover(i === index, isNeighbor);
    });
  }

  // `air`: ráfaga del cursor ya atenuada por velocidad y distancia ({ dirX, dirY, strength }).
  // `motion`: false con prefers-reduced-motion (sin idle ni aire, solo el hover).
  update(dt, time, air, motion) {
    // Tallo.
    const stem = motion ? stemAngles(time) : { side: 0, depth: 0 };
    this.sway.rotation.set(stem.depth, 0, stem.side);

    // Cabeza: su orientación absoluta es la del tallo hace HEAD_LAG segundos (retraso), más un
    // pequeño ruido propio y las ráfagas del cursor.
    let targetX = 0;
    let targetZ = 0;
    let targetY = 0;
    if (motion) {
      const lagged = stemAngles(time - HEAD_LAG);
      targetX = lagged.depth - stem.depth + fbm1D(time * 0.09, 41.2) * HEAD_IDLE;
      targetZ = lagged.side - stem.side + fbm1D(time * 0.08, 53.8) * HEAD_IDLE;
      targetY = fbm1D(time * 0.07, 67.1) * HEAD_IDLE;

      if (air.strength > 0) {
        const kick = air.strength * HEAD_AIR * dt * 60;
        this.headSprings.y.kick(air.dirX * kick);
        this.headSprings.x.kick(-air.dirY * kick);
        this.headSprings.z.kick(-air.dirX * kick * 0.5);
      }
    }

    this.head.quaternion
      .copy(this.headBase)
      .multiply(
        tmpQuat.setFromEuler(
          tmpEuler.set(
            this.headSprings.x.update(dt, targetX),
            this.headSprings.y.update(dt, targetY),
            this.headSprings.z.update(dt, targetZ)
          )
        )
      );

    // Pétalos.
    for (const petal of this.petals) {
      if (motion) petal.applyAir(air.dirX, air.dirY, air.strength, dt);
      petal.update(dt, time, motion);
    }

    // Estambres: temblor mínimo, cada uno con su ruido.
    for (const { node, base, seed } of this.stamens) {
      const wobbleX = motion ? fbm1D(time * STAMEN_IDLE.speed, seed) * STAMEN_IDLE.amount : 0;
      const wobbleY = motion ? fbm1D(time * STAMEN_IDLE.speed, seed + 9.1) * STAMEN_IDLE.amount : 0;
      node.quaternion.copy(base).multiply(tmpQuat.setFromEuler(tmpEuler.set(wobbleX, wobbleY, 0)));
    }
  }
}
