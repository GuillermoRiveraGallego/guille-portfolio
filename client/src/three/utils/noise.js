// Ruido 1D suave y barato para movimientos orgánicos. A diferencia de un seno, no se repite:
// combina valores pseudoaleatorios interpolados con varias octavas (fbm).

function hash(n) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
  return x - Math.floor(x);
}

// Ruido de valor en [-1, 1] con interpolación suave (continuo en posición y velocidad).
export function noise1D(x, seed = 0) {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  const a = hash(i + seed * 57.3);
  const b = hash(i + 1 + seed * 57.3);
  return (a + (b - a) * u) * 2 - 1;
}

// Varias octavas: base lenta + detalles más rápidos y pequeños. Resultado aprox. en [-1, 1].
export function fbm1D(x, seed = 0, octaves = 3) {
  let value = 0;
  let amplitude = 0.5;
  let frequency = 1;
  let total = 0;

  for (let o = 0; o < octaves; o++) {
    value += noise1D(x * frequency, seed + o * 13.7) * amplitude;
    total += amplitude;
    amplitude *= 0.5;
    frequency *= 2.03;
  }

  return value / total;
}
