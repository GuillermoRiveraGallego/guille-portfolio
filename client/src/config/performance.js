import { PATHS } from '@/router/paths';

// Guion de la sección Performance: una página lenta que se optimiza delante del usuario. Cada
// capítulo aplica una mejora y la puntuación, las métricas y la cascada de red cambian con el
// scroll (reversible). Cifras ilustrativas de un caso típico, no una medición de esta web.
//
// Línea de tiempo `t` = pantallas de scroll recorridas. Posiciones: intro 0, medir 1, código 2,
// assets 3, render 4, desplegar 5, final 6.

export const PERF_BACKGROUND = { top: '#e4e6eb', bottom: '#f4f5f7' };

// Destino del cierre: la última sección lleva a Contacto.
export const PERF_NEXT = { path: PATHS.contact, title: 'Contacto' };

export const PERF_CHAPTERS = [
  {
    id: 'intro',
    kicker: '05 — PERFORMANCE',
    title: ['Rápido', 'no es un extra.'],
    line: 'Mido, optimizo y despliego para que la web cargue al instante.',
    meta: 'Optimización · Web Performance · Despliegue',
  },
  {
    id: 'measure',
    number: '01',
    label: 'Medir',
    title: ['Primero,', 'medir.'],
    line: 'Sin datos, optimizar es adivinar.',
    meta: 'Lighthouse · Core Web Vitals · DevTools',
  },
  {
    id: 'code',
    number: '02',
    label: 'Código',
    title: ['Solo lo que', 'hace falta.'],
    line: 'En esta web, three.js solo se descarga en las páginas que lo usan.',
    meta: 'Code splitting · Lazy loading · Tree shaking',
  },
  {
    id: 'assets',
    number: '03',
    label: 'Assets',
    title: ['Menos bytes,', 'el mismo detalle.'],
    meta: 'AVIF · WebP · Draco · Dimensiones fijas',
  },
  {
    id: 'render',
    number: '04',
    label: 'Render',
    title: ['Sin bloquear', 'el hilo principal.'],
    meta: 'CSS crítico · Preload · Scripts diferidos',
  },
  {
    id: 'deploy',
    number: '05',
    label: 'Desplegar',
    title: ['Cerca', 'del usuario.'],
    meta: 'CDN · Caché · Brotli · CI/CD',
  },
  {
    id: 'final',
    kicker: 'Resultado',
    title: ['De 38', 'a 100.'],
    line: 'La misma web. Sin esperas.',
    meta: 'Medir → Reducir → Priorizar → Desplegar',
    nav: true,
  },
];

// Momento (t) en que se aplica cada mejora: las curvas y la cascada cambian alrededor de él.
const STEP = { measure: 1, code: 2, assets: 3, render: 4, deploy: 5 };

// Construye una curva [[t, valor], ...] que mantiene cada valor y cambia en torno a cada paso.
const curve = (start, changes) => {
  const keys = [[STEP.measure - 0.45, start]];
  let value = start;
  for (const [step, next] of changes) {
    keys.push([STEP[step] - 0.3, value], [STEP[step] + 0.2, next]);
    value = next;
  }
  return keys;
};

// Puntuación: la medición arranca en 0 y cuenta hasta 38, como Lighthouse; después sube con cada
// mejora. `metrics`: valor mostrado (con su formato) y cuándo cambia.
export const PERF_SCORE = [
  [0.55, 0],
  [1.15, 38],
  ...curve(38, [
    ['code', 61],
    ['assets', 78],
    ['render', 91],
    ['deploy', 100],
  ]).slice(1),
];

export const PERF_METRICS = [
  {
    id: 'lcp',
    label: 'LCP',
    unit: 's',
    digits: 1,
    keys: curve(4.8, [
      ['code', 3.6],
      ['assets', 2.1],
      ['render', 1.3],
      ['deploy', 0.9],
    ]),
  },
  {
    id: 'tbt',
    label: 'TBT',
    unit: 'ms',
    digits: 0,
    keys: curve(870, [
      ['code', 310],
      ['assets', 280],
      ['render', 60],
      ['deploy', 40],
    ]),
  },
  {
    id: 'cls',
    label: 'CLS',
    unit: '',
    digits: 2,
    keys: curve(0.24, [
      ['assets', 0.06],
      ['render', 0.01],
    ]),
  },
  {
    id: 'weight',
    label: 'Peso',
    unit: 'MB',
    digits: 2,
    keys: curve(3.9, [
      ['code', 2.2],
      ['assets', 0.62],
      ['deploy', 0.41],
    ]),
  },
];

// Eje de la cascada (ms).
export const PERF_AXIS = 5000;

// Peticiones de la página: inicio y duración (ms) antes y después de la mejora que les toca
// (`step`), con la nota que aparece al aplicarla. `deferred`: deja de bloquear la carga y se
// atenúa. `lcp`: el elemento que marca el LCP.
export const PERF_REQUESTS = [
  {
    name: 'index.html',
    type: 'doc',
    before: [0, 600],
    after: [0, 120],
    step: 'deploy',
    note: 'CDN',
  },
  {
    name: 'styles.css',
    type: 'css',
    before: [600, 700],
    after: [130, 160],
    step: 'render',
    note: 'crítico',
  },
  {
    name: 'vendor.js',
    type: 'js',
    before: [650, 1900],
    after: [140, 420],
    step: 'code',
    note: 'tree shaking',
  },
  {
    name: 'three.js',
    type: 'js',
    before: [700, 1700],
    after: [1500, 600],
    step: 'code',
    note: 'lazy',
    deferred: true,
  },
  {
    name: 'hero.jpg',
    type: 'img',
    before: [1300, 2400],
    after: [300, 500],
    step: 'assets',
    note: 'AVIF',
    lcp: true,
  },
  {
    name: 'font.woff2',
    type: 'font',
    before: [1400, 900],
    after: [150, 250],
    step: 'render',
    note: 'preload',
  },
  {
    name: 'model.glb',
    type: 'img',
    before: [1800, 2900],
    after: [1100, 700],
    step: 'assets',
    note: 'Draco',
  },
  {
    name: 'analytics.js',
    type: 'js',
    before: [500, 1100],
    after: [1700, 300],
    step: 'render',
    note: 'defer',
    deferred: true,
  },
].map(request => ({ ...request, at: STEP[request.step] }));

// Momento en que se alcanza el 100 (celebración del anillo).
export const PERF_PERFECT = STEP.deploy + 0.2;

// La cascada aparece al medir.
export const PERF_MEASURED = 0.55;
