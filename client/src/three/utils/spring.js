// Muelle amortiguado de un eje. Sirve para que las transiciones (hover, perturbaciones del aire)
// tengan inercia y un pequeño rebote físico en vez de una interpolación lineal.
export class Spring {
  constructor({ stiffness = 70, damping = 11, value = 0 } = {}) {
    this.stiffness = stiffness;
    this.damping = damping;
    this.value = value;
    this.velocity = 0;
  }

  // Impulso instantáneo (p. ej. una ráfaga de aire).
  kick(amount) {
    this.velocity += amount;
  }

  update(dt, target) {
    // Euler semiimplícito con dt limitado: estable aunque haya caídas de FPS o cambio de pestaña.
    const step = Math.min(dt, 1 / 30);
    const force = -this.stiffness * (this.value - target) - this.damping * this.velocity;
    this.velocity += force * step;
    this.value += this.velocity * step;
    return this.value;
  }
}
