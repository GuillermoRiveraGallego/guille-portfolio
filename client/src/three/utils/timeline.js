import { MathUtils } from 'three';

// Utilidades para animaciones dirigidas por una línea de tiempo continua (p. ej. el scroll).

export const smoothstep = (a, b, x) => {
  const t = MathUtils.clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

export const easeInOutCubic = t => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

// Amortiguación exponencial independiente del frame rate: `lambda` alto = responde antes.
export const damp = (current, target, lambda, dt) =>
  MathUtils.lerp(current, target, 1 - Math.exp(-lambda * dt));

// Valor en `t` de una curva definida por claves [[t, valor], ...] ordenadas, con transición suave
// entre claves. Antes de la primera / después de la última se mantiene el valor extremo.
export function evaluateKeys(keys, t) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [t1, v1] = keys[i];
    if (t <= t1) {
      const [t0, v0] = keys[i - 1];
      return MathUtils.lerp(v0, v1, smoothstep(t0, t1, t));
    }
  }
  return keys[keys.length - 1][1];
}
