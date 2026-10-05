// Fondo de la sección (dentro de la escena y, mientras carga, en CSS): la misma familia de grises
// que la home, un punto más frío. `haze`: tono al que se funden las piezas no enfocadas.
export const BACKGROUND = { top: '#9fa4ae', bottom: '#e1e3e8', haze: '#c3c7cf' };

// Enlace al caso real de optimización (gemelo digital de la oficina de ATBIM).
export const CASE_STUDY_URL =
  'https://www.atbim.com/es/blog/como-optimizamos-el-gemelo-digital-de-nuestra-oficina-para-web-y-movil-parte-2';

// Guion de la sección 3D Web: el propio pipeline, contado con la moto.
// CREATE → OPTIMIZE → WEB → INTERACT, entre una entrada y un cierre.
//
// La línea de tiempo `t` es el número de pantallas de scroll recorridas (scrollY / alto). Cada
// capítulo ocupa `screens` pantallas (1 por defecto) y su texto se queda fijo mientras dura; el
// capítulo empieza en la suma de los anteriores: intro 0, create 1, optimize 2-3, web 4,
// interact 5-6, final 7. Las curvas de TIMELINE y los planos de SHOTS usan esas posiciones.
//
// `meta`: tecnologías en una línea. `facts`: datos reales del modelo en una línea discreta (los
// calcula three/motorcycle/modelStats.js). `steps`: pasos que se marcan con el scroll (`at` = t).
export const CHAPTERS = [
  {
    id: 'intro',
    kicker: '02 — 3D WEB',
    title: ['Del modelo', 'a la experiencia.'],
    line: 'Creo, optimizo y desarrollo experiencias 3D para la web.',
    meta: 'Blender · GLB · Three.js · WebGL',
  },
  {
    id: 'create',
    number: '01',
    label: 'Crear',
    title: ['Construir', 'el asset.'],
    line: 'Creación y preparación de assets 3D.',
    meta: 'Blender · Geometría · Materiales · PBR',
    facts: 'create',
  },
  {
    id: 'optimize',
    number: '02',
    label: 'Optimizar',
    title: ['El 3D pesa.', 'La web no debería.'],
    meta: 'Geometría · Texturas · Draco · WebP · Memoria GPU · Draw calls',
    facts: 'optimize',
    caseStudy: true,
    screens: 2,
    // La moto pasa por cada paso (ver TIMELINE.technical).
    steps: [
      { label: 'Geometría', at: 1.6 },
      { label: 'Materiales', at: 2.45 },
      { label: 'Compresión', at: 2.8 },
      { label: 'Lista para web', at: 3.15 },
    ],
  },
  {
    id: 'web',
    number: '03',
    label: 'Web',
    title: ['Hacer el 3D', 'interactivo.'],
    meta: 'Three.js · WebGL',
    // Cada paso ocurre de verdad en la escena: la luz entra, cambia el plano, se activa el
    // raycasting (ver TIMELINE.lighting / interactive y SHOTS).
    checklist: true,
    steps: [
      { label: 'Modelo', at: 3.5 },
      { label: 'Iluminación', at: 3.85 },
      { label: 'Cámara', at: 4 },
      { label: 'Raycasting', at: 4.15 },
      { label: 'Interacción', at: 4.3 },
    ],
  },
  {
    id: 'interact',
    number: '04',
    label: 'Interactuar',
    title: ['No es solo', 'para mirarla.'],
    line: 'Explórala.',
    facts: 'interact',
    screens: 2,
  },
  {
    id: 'final',
    kicker: 'De Blender al navegador',
    title: ['Del modelo', 'a la experiencia.'],
    meta: 'Blender → GLB → Three.js → Web',
    nav: true,
  },
];

// Tramo de la línea de tiempo en el que se ve el control Realistic → Technical: INTERACT, ya con
// su texto en sitio (CREATE y OPTIMIZE recorren esa transición con el scroll; aquí la maneja el
// usuario).
export const TECHNICAL_CONTROL = [4.95, 6.6];

// Curvas sobre la línea de tiempo [[t, valor], ...] (transición suave entre claves):
// - technical: CREATE lleva la moto de final → materiales → geometría; OPTIMIZE empieza en la
//   geometría y vuelve a materiales y a "web ready". Fuera de ahí manda el control del usuario.
// - lighting: 1 = luz de producto (key/fill/rim). CREATE y OPTIMIZE usan luz neutra de estudio,
//   como un visor de modelado; en WEB entra la iluminación.
// - grid: rejilla de suelo muy sutil mientras se "construye" el asset.
// - explode: el despiece es el clímax de INTERACT y la moto se vuelve a montar para el cierre.
// - interactive: ventana [desde, hasta] con hover/clic sobre las piezas (empieza en WEB, con la
//   moto aún montada: es el paso "Raycasting").
export const TIMELINE = {
  technical: [
    [0.55, 0],
    [1, 0.5],
    [1.45, 1],
    [2.3, 1],
    [2.6, 0.5],
    [2.95, 0.5],
    [3.25, 0],
  ],
  lighting: [
    [0.55, 1],
    [1.05, 0],
    [3.7, 0],
    [3.95, 1],
  ],
  grid: [
    [0.6, 0],
    [1.05, 1],
    [2.7, 1],
    [3.2, 0],
  ],
  explode: [
    [4.75, 0],
    [6.15, 1],
    [6.5, 1],
    [7, 0],
  ],
  interactive: [4.15, 6.75],
};

// Planos de cámara, uno por pantalla (índice = t): azimut (rad desde el frontal, negativo = lado
// derecho de la moto, el del escape), elevación (rad) y distancia (en radios de la moto). Entre
// pantallas se interpolan con suavidad y la cámara se amortigua: nunca hay cortes.
export const SHOTS = [
  { az: -0.62, el: 0.1, dist: 2.95 }, // intro: 3/4, producto
  { az: -1.05, el: 0.24, dist: 3.15 }, // create: algo más alto, como al modelar
  { az: -Math.PI / 2, el: 0.06, dist: 5.1 }, // optimize: perfil técnico (geometría)
  { az: -1.2, el: 0.14, dist: 4.1 }, // optimize: materiales → web ready
  { az: -0.75, el: 0.12, dist: 2.95 }, // web: el plano cambia con la luz
  { az: -0.72, el: 0.26, dist: 3.6 }, // interact: empieza el despiece
  { az: -0.6, el: 0.3, dist: 3.95 }, // interact: despiece completo
  { az: -0.62, el: 0.1, dist: 2.95 }, // final: montada otra vez
];

// Con prefers-reduced-motion la cámara no viaja: un único plano que encuadra también el despiece.
export const REDUCED_MOTION_SHOT = { az: -0.7, el: 0.2, dist: 4 };
