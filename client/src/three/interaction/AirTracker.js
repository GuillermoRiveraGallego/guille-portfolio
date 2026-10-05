import { MathUtils } from 'three';

// Velocidad del puntero (pantallas/s) por debajo de la cual no se mueve el aire y a partir de la
// cual el efecto es máximo. Un movimiento lento prácticamente no afecta.
const SPEED = { min: 0.8, max: 5 };

// Radio de influencia alrededor de la flor, en unidades de pantalla (alto = 2).
const RADIUS = 0.45;

// Convierte el movimiento del cursor en una "ráfaga de aire" junto a un punto de la pantalla
// (la cabeza de la flor). No apunta al cursor: solo transmite su velocidad, atenuada por la
// distancia, para que parezca que se ha movido el aire alrededor.
export class AirTracker {
  constructor() {
    this.prevX = null;
    this.prevY = null;
    this.air = { dirX: 0, dirY: 0, strength: 0 };
  }

  // pointer / center en NDC (-1..1). aspect = ancho / alto para medir en espacio uniforme.
  update(pointer, center, aspect, dt) {
    const air = this.air;
    air.strength = 0;

    if (this.prevX === null || dt <= 0) {
      this.prevX = pointer.x;
      this.prevY = pointer.y;
      return air;
    }

    const dx = (pointer.x - this.prevX) * aspect;
    const dy = pointer.y - this.prevY;
    this.prevX = pointer.x;
    this.prevY = pointer.y;

    const distance = Math.hypot(dx, dy);
    // Un salto grande en un frame es el cursor entrando al canvas desde fuera, no un gesto.
    if (distance === 0 || distance > 0.5) return air;

    // NDC mide 2 por pantalla: se divide entre 2 para obtener pantallas/s.
    const speed = distance / dt / 2;
    const fromCenter = Math.hypot((pointer.x - center.x) * aspect, pointer.y - center.y);
    const falloff = Math.exp(-((fromCenter / RADIUS) ** 2));

    air.dirX = dx / distance;
    air.dirY = dy / distance;
    air.strength = MathUtils.smoothstep(speed, SPEED.min, SPEED.max) * falloff;
    return air;
  }
}
