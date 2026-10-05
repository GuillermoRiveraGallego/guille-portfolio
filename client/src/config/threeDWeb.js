// Fondo de la sección (dentro de la escena y, mientras carga, en CSS): la misma familia de grises
// que la home, un punto más frío. `haze`: tono al que se funden las piezas no enfocadas.
export const BACKGROUND = { top: '#9fa4ae', bottom: '#e1e3e8', haze: '#c3c7cf' };

// Guion de la sección 3D Web. Cada capítulo ocupa una pantalla de scroll: la línea de tiempo `t`
// vale el índice del capítulo cuando su texto está centrado (t = scrollY / alto de pantalla).
// `data`: qué datos reales del modelo enseña (los calcula three/motorcycle/modelStats.js).
export const CHAPTERS = [
  {
    id: 'intro',
    kicker: '02 — 3D WEB',
    title: ['Objects become', 'experiences.'],
    line: 'Three.js · WebGL · Blender · GLB',
  },
  {
    id: 'model',
    number: '01',
    label: 'Model',
    title: ['From geometry', 'to browser.'],
    data: 'model',
  },
  {
    id: 'optimize',
    number: '02',
    label: 'Optimize',
    title: ['Every polygon', 'has a cost.'],
    data: 'optimize',
  },
  {
    id: 'interact',
    number: '03',
    label: 'Interact',
    title: ['3D should', 'respond.'],
    data: 'interact',
  },
  {
    id: 'experience',
    number: '04',
    label: 'Experience',
    title: ['Objects become', 'interfaces.'],
    data: 'experience',
  },
  { id: 'pipeline', kicker: 'Pipeline', title: ['From Blender', 'to the browser.'] },
  { id: 'blender', label: 'Blender', line: 'The complete model, part by part.', data: 'blender' },
  { id: 'glb', label: 'GLB', line: 'One file. A scene graph.', data: 'glb' },
  {
    id: 'optimization',
    label: 'Optimization',
    line: 'Geometry and textures, compressed.',
    data: 'file',
  },
  {
    id: 'three',
    label: 'Three.js',
    line: 'Lights, materials, camera. Every frame.',
    data: 'runtime',
  },
  { id: 'web', label: 'Web', line: 'An interactive experience.', data: 'web' },
];

// Capítulos en los que se ve el control Realistic → Technical.
export const TECHNICAL_CHAPTERS = ['optimize', 'interact', 'experience'];

// Curvas sobre la línea de tiempo [[t, valor], ...]:
// - explode: 0 montada → 1 despiece completo. Se monta otra vez para empezar el pipeline desde la
//   moto completa (Blender), se abre a medias para enseñar la estructura (GLB) y se cierra al final.
// - technical: el pipeline pasa por la vista técnica en "Optimization"; fuera de ahí manda el
//   control del usuario.
export const TIMELINE = {
  explode: [
    [0.6, 0],
    [3.4, 1],
    [5.15, 1],
    [5.9, 0],
    [6.6, 0],
    [7.2, 0.55],
    // De perfil (vista técnica) se abre menos: las piezas se solaparían con el texto.
    [7.9, 0.3],
    [8.4, 0.3],
    [9.2, 0],
  ],
  technical: [
    [7.4, 0],
    [7.9, 1],
    [8.5, 1],
    [9, 0],
  ],
  // A partir de este despiece se puede pasar el cursor por las piezas e inspeccionarlas.
  interactiveFrom: 0.55,
};

// Planos de cámara, uno por capítulo: azimut (rad desde el frontal, negativo = lado derecho de la
// moto, el del escape), elevación (rad) y distancia (en radios de la moto). Entre capítulos se
// interpolan con suavidad; la cámara además se amortigua, así que nunca hay cortes.
export const SHOTS = [
  { az: -0.62, el: 0.1, dist: 2.95 }, // hero
  { az: -0.9, el: 0.16, dist: 3.05 }, // model: 3/4
  { az: -1.2, el: 0.22, dist: 3.4 }, // optimize
  { az: -0.72, el: 0.3, dist: 3.95 }, // interact: despiece
  { az: -0.5, el: 0.24, dist: 3.95 }, // experience
  { az: -0.9, el: 0.18, dist: 3.6 }, // pipeline
  { az: -0.62, el: 0.1, dist: 2.95 }, // blender
  { az: -1, el: 0.32, dist: 3.7 }, // glb
  { az: -Math.PI / 2, el: 0.06, dist: 4.1 }, // optimization: perfil técnico
  { az: -0.8, el: 0.18, dist: 3.05 }, // three.js
  { az: -0.62, el: 0.1, dist: 2.95 }, // web
];

// Con prefers-reduced-motion la cámara no viaja: un único plano que encuadra también el despiece.
export const REDUCED_MOTION_SHOT = { az: -0.7, el: 0.2, dist: 4 };
