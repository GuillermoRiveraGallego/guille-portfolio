// Capa DOM que continúa la transición del pétalo después del cambio de ruta. El canvas de la flor
// se desmonta con la página, así que el frame en el que el pétalo tapa la cámara se copia aquí:
// esta capa sigue el movimiento (crece, se desenfoca) y se retira con un barrido de arriba abajo,
// como el pétalo pasando junto a la cámara, con la nueva sección ya renderizada detrás.
//
// Fases: idle → hold (snapshot) | wipe-in → covered (reduced motion) → reveal → idle.
// Todo se anima en un único requestAnimationFrame escribiendo estilos, sin estado de React.

// Tiempos en segundos.
const HOLD = { min: 0.12, timeout: 3, grow: 0.06, blur: 3 };
const REVEAL = { duration: 0.7, grow: 0.45, blur: 16, travel: 5 };
const WIPE = { in: 0.22, out: 0.32 };
// Borde del barrido (% del alto) y escala inicial: el blur difumina los bordes de la capa y con un
// poco de escala quedan fuera de la pantalla.
const SOFT_EDGE = 35;
const EDGE_SCALE = 1.04;
// El snapshot va desenfocado: con la mitad de resolución basta y la copia es más barata.
const SNAPSHOT_RESOLUTION = 0.5;

const easeInOut = t => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

export class TransitionVeil {
  constructor(layer, canvas) {
    this.layer = layer;
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
    this.phase = 'idle';
    this.frame = null;
    this.tick = this.tick.bind(this);
  }

  // Tapa la pantalla. Con `canvas` copia ese frame (el pétalo pegado a la cámara) y resuelve al
  // momento; sin él (reduced motion) hace un barrido del color del pétalo y resuelve al cubrir.
  cover({ canvas: source, blur = 0 } = {}) {
    this.snapshot = Boolean(source);
    this.blurStart = blur;
    this.revealBlur = blur > 0 ? REVEAL.blur : REVEAL.blur * 0.4;
    this.revealRequested = false;
    this.start = performance.now();
    this.layer.style.visibility = 'visible';

    if (this.snapshot) {
      this.canvas.width = Math.round(source.width * SNAPSHOT_RESOLUTION);
      this.canvas.height = Math.round(source.height * SNAPSHOT_RESOLUTION);
      this.context.drawImage(source, 0, 0, this.canvas.width, this.canvas.height);
      this.canvas.style.display = '';
      this.layer.style.backgroundColor = '';
      this.phase = 'hold';
      this.renderHold(0);
      this.run();
      return Promise.resolve();
    }

    this.canvas.style.display = 'none';
    this.layer.style.backgroundColor = 'var(--petal)';
    this.phase = 'wipe-in';
    this.setMask(`linear-gradient(to bottom, #000 ${-SOFT_EDGE}%, transparent 0%)`);
    this.run();
    return new Promise(resolve => {
      this.onCovered = resolve;
    });
  }

  // La nueva ruta ya está montada: en cuanto haya pasado el mínimo de cobertura, se retira.
  reveal() {
    if (this.phase === 'idle' || this.phase === 'reveal') return;
    this.revealRequested = true;
  }

  run() {
    if (this.frame === null) this.frame = requestAnimationFrame(this.tick);
  }

  tick(now) {
    this.frame = null;
    const t = (now - this.start) / 1000;

    switch (this.phase) {
      case 'wipe-in': {
        const p = easeInOut(Math.min(t / WIPE.in, 1));
        const edge = -SOFT_EDGE + (100 + SOFT_EDGE) * p;
        this.setMask(`linear-gradient(to bottom, #000 ${edge}%, transparent ${edge + SOFT_EDGE}%)`);
        if (p >= 1) {
          this.setMask('');
          this.phase = 'covered';
          this.start = now;
          this.onCovered?.();
        }
        break;
      }
      case 'hold':
      case 'covered':
        if (this.snapshot) this.renderHold(t);
        if ((this.revealRequested && t >= HOLD.min) || t > HOLD.timeout) {
          this.phase = 'reveal';
          this.start = now;
        }
        break;
      case 'reveal': {
        const p = Math.min(t / (this.snapshot ? REVEAL.duration : WIPE.out), 1);
        this.renderReveal(p);
        if (p >= 1) {
          this.hide();
          return;
        }
        break;
      }
      default:
        return;
    }
    this.run();
  }

  // Mientras se monta la nueva ruta el pétalo sigue acercándose, cada vez más despacio.
  renderHold(t) {
    const settle = 1 - Math.exp(-t * 5);
    this.scale = EDGE_SCALE + HOLD.grow * settle;
    this.blur = this.blurStart + HOLD.blur * settle;
    this.layer.style.transform = `scale(${this.scale})`;
    this.layer.style.filter = `blur(${this.blur.toFixed(2)}px)`;
  }

  // El pétalo atraviesa la cámara: acelera (escala y desplazamiento con ease-in) y la nueva
  // sección aparece por arriba con un borde suave.
  renderReveal(p) {
    const edge = -SOFT_EDGE + (100 + SOFT_EDGE) * easeInOut(p);
    this.setMask(`linear-gradient(to bottom, transparent ${edge}%, #000 ${edge + SOFT_EDGE}%)`);
    if (!this.snapshot) return;

    const accel = p * p;
    this.layer.style.transform = `translateY(${REVEAL.travel * accel}vh) scale(${
      this.scale + REVEAL.grow * accel
    })`;
    this.layer.style.filter = `blur(${(this.blur + this.revealBlur * p).toFixed(2)}px)`;
  }

  setMask(value) {
    this.layer.style.maskImage = value;
    this.layer.style.webkitMaskImage = value;
  }

  hide() {
    this.phase = 'idle';
    this.layer.style.visibility = 'hidden';
    this.layer.style.transform = '';
    this.layer.style.filter = '';
    this.layer.style.backgroundColor = '';
    this.setMask('');
    // Libera la memoria del snapshot.
    this.canvas.width = 0;
    this.canvas.height = 0;
  }

  dispose() {
    if (this.frame !== null) cancelAnimationFrame(this.frame);
    this.frame = null;
  }
}
