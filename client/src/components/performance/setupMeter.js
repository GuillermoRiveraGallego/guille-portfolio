import { MathUtils } from 'three';

import {
  PERF_AXIS,
  PERF_MEASURED,
  PERF_METRICS,
  PERF_REQUESTS,
  PERF_SCORE,
} from '@/config/performance';
import { evaluateKeys, smoothstep } from '@/three/utils/timeline';

// Circunferencia del anillo (r = 52 en el viewBox de PerformanceStage).
const RING = 2 * Math.PI * 52;
// Tono del anillo según la puntuación, con los saltos de Lighthouse (rojo < 50 ≤ naranja < 90 ≤
// verde) pero suavizados.
const HUE = [
  [0, 4],
  [45, 14],
  [55, 30],
  [85, 40],
  [92, 135],
  [100, 148],
];
// Tramo de la línea de tiempo en el que la medición barre la cascada.
const SCAN = [PERF_MEASURED, PERF_MEASURED + 0.6];

const format = (value, digits) =>
  value.toLocaleString('es-ES', { minimumFractionDigits: digits, maximumFractionDigits: digits });

function hueOf(score) {
  const i = HUE.findIndex(([at]) => score <= at);
  if (i <= 0) return HUE[0][1];
  const [s0, h0] = HUE[i - 1];
  const [s1, h1] = HUE[i];
  return MathUtils.lerp(h0, h1, (score - s0) / (s1 - s0));
}

// Escribe en el escenario de Performance lo que cambia de forma continua con el scroll: la
// puntuación y su anillo, las métricas, las barras de la cascada, el marcador de LCP y el barrido
// de la medición, que va descubriendo la cascada. Los textos solo se tocan si cambian.
export function setupMeter(root) {
  const query = selector => root.querySelector(selector);
  const score = query('[data-score]');
  const ring = query('[data-ring]');
  const scan = query('[data-scan]');
  const reveal = query('[data-reveal]');
  const lcp = query('[data-lcp]');
  const lcpLabel = query('[data-lcp-label]');
  const metrics = PERF_METRICS.map(metric => ({
    ...metric,
    node: query(`[data-metric="${metric.id}"]`),
  }));
  const bars = PERF_REQUESTS.map((request, i) => ({
    ...request,
    node: query(`[data-bar="${i}"]`),
  }));
  const texts = new Map();

  const setText = (node, text) => {
    if (!node || texts.get(node) === text) return;
    texts.set(node, text);
    node.textContent = text;
  };

  return t => {
    const measured = t >= PERF_MEASURED;
    const value = evaluateKeys(PERF_SCORE, t);
    const hue = hueOf(value).toFixed(1);
    root.style.setProperty('--score-hue', hue);
    ring.style.strokeDashoffset = (RING * (1 - value / 100)).toFixed(2);
    setText(score, measured ? String(Math.round(value)) : '—');

    for (const metric of metrics) {
      const current = evaluateKeys(metric.keys, t);
      setText(metric.node, measured ? format(current, metric.digits) : '—');
      if (metric.id === 'lcp') {
        lcp.style.left = `${Math.min((current * 1000) / PERF_AXIS, 1) * 100}%`;
        setText(lcpLabel, `LCP ${format(current, 1)} s`);
      }
    }

    for (const bar of bars) {
      const progress = smoothstep(bar.at - 0.3, bar.at + 0.2, t);
      const start = MathUtils.lerp(bar.before[0], bar.after[0], progress);
      const duration = MathUtils.lerp(bar.before[1], bar.after[1], progress);
      bar.node.style.left = `${(start / PERF_AXIS) * 100}%`;
      bar.node.style.width = `${(duration / PERF_AXIS) * 100}%`;
      if (bar.deferred) bar.node.style.opacity = (1 - progress * 0.65).toFixed(3);
    }

    const sweep = MathUtils.clamp((t - SCAN[0]) / (SCAN[1] - SCAN[0]), 0, 1);
    scan.style.left = `${sweep * 100}%`;
    scan.style.opacity = sweep > 0 && sweep < 1 ? '1' : '0';
    // La cascada se descubre detrás del barrido, como si se fuera midiendo.
    reveal.style.clipPath = `inset(0 ${((1 - sweep) * 100).toFixed(2)}% 0 0)`;
  };
}
