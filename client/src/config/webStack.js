// Guion de la sección Web (prototipo): una aplicación que se abre en capas con el scroll.
// PRODUCT → FRONTEND → API → BACKEND → DATA, una petición que atraviesa todas y la aplicación que
// se vuelve a cerrar. Copy provisional.
//
// Línea de tiempo `t` = pantallas de scroll recorridas (scrollY / alto), como en /3d. Cada
// capítulo ocupa `screens` pantallas (1 por defecto) y su texto se queda fijo mientras dura.
// Posiciones: intro 0, product 1, frontend 2, api 3, backend 4, data 5, request 6-7, full stack 8,
// selected work 9.

// Fondo claro, misma familia que el resto del portfolio.
export const WEB_BACKGROUND = { top: '#e4e6eb', bottom: '#f4f5f7' };

export const WEB_CHAPTERS = [
  {
    id: 'intro',
    kicker: '01 — WEB',
    title: ['Desarrollo', 'aplicaciones completas.'],
    line: 'De la interfaz a la infraestructura.',
    meta: 'React · Node.js · APIs · Datos',
  },
  { id: 'product', label: 'Producto', title: ['Lo que ve', 'el usuario.'] },
  {
    id: 'frontend',
    number: '01',
    label: 'Frontend',
    title: ['La interfaz', 'es solo la superficie.'],
    meta: 'React · TypeScript · Vite',
  },
  {
    id: 'api',
    number: '02',
    label: 'API',
    title: ['Conectar', 'los dos mundos.'],
    meta: 'REST · JSON · HTTP',
  },
  {
    id: 'backend',
    number: '03',
    label: 'Backend',
    title: ['Donde vive', 'la lógica.'],
    meta: 'Node.js · Express',
  },
  {
    id: 'data',
    number: '04',
    label: 'Datos',
    title: ['Detrás de cada', 'interacción.'],
    meta: 'MongoDB · Modelado de datos · Consultas',
  },
  {
    id: 'request',
    label: 'Una petición',
    title: ['Un clic.', 'Todas las capas.'],
    screens: 2,
    // Registro de la petición: cada paso se marca cuando el paquete llega a esa capa (ver
    // STACK_TIMELINE.request y REQUEST_PHASES).
    steps: [
      { label: 'Clic · Abrir proyecto', at: 6.05 },
      { label: 'GET /api/projects/24', at: 6.2 },
      { label: 'Autenticar · Validar', at: 6.45 },
      { label: 'projects.findOne({ id: 24 })', at: 6.65 },
      { label: '200 OK · JSON', at: 6.9 },
      { label: 'Interfaz actualizada', at: 7.25 },
    ],
  },
  {
    id: 'fullstack',
    kicker: 'Full stack',
    title: ['De la base de datos', 'a la interfaz.'],
    meta: 'Una sola aplicación',
  },
  {
    id: 'work',
    kicker: 'Proyectos',
    // Placeholder: aquí irán los proyectos reales.
    work: ['Proyecto 01', 'Proyecto 02'],
    nav: true,
  },
];

// Capas de la aplicación, de delante (la UI) hacia atrás.
export const STACK_LAYERS = ['product', 'frontend', 'api', 'backend', 'data'];

// Curvas sobre la línea de tiempo [[t, valor], ...] (transición suave entre claves):
// - tilt: 0 = la aplicación de frente (producto); 1 = vista en perspectiva para ver las capas.
// - reveal: cuánto se ha separado cada capa de la UI (0 = pegada y oculta, 1 = en su sitio).
//   Al final vuelven en orden inverso: DATA → BACKEND → API → FRONTEND → producto.
// - request: recorrido de la petición, 0 → 0.5 baja hasta DATA, 0.5 → 1 vuelve a la UI.
export const STACK_TIMELINE = {
  tilt: [
    [0.7, 0],
    [2, 1],
    [7.6, 1],
    [8.35, 0],
  ],
  reveal: {
    frontend: [
      [1.5, 0],
      [2.15, 1],
      [7.65, 1],
      [8.2, 0],
    ],
    api: [
      [2.5, 0],
      [3.15, 1],
      [7.55, 1],
      [8.1, 0],
    ],
    backend: [
      [3.5, 0],
      [4.15, 1],
      [7.45, 1],
      [8, 0],
    ],
    data: [
      [4.5, 0],
      [5.15, 1],
      [7.35, 1],
      [7.9, 0],
    ],
  },
  request: [
    [6.05, 0],
    [7.2, 1],
  ],
};

// Qué está pasando según el recorrido de la petición (0..1) y en qué capa está el paquete.
export const REQUEST_PHASES = [
  { until: 0.02, phase: 'idle' },
  { until: 0.25, phase: 'request' }, // UI → API
  { until: 0.4, phase: 'backend' },
  { until: 0.6, phase: 'data' },
  { until: 0.98, phase: 'response' }, // vuelve hacia la UI
  { until: Infinity, phase: 'done' }, // la UI muestra el proyecto
];

// Separación entre láminas (px) y su tamaño, por dispositivo. En móvil menos profundidad y sin
// giro en Z: las capas se separan casi en vertical.
export const STACK_LAYOUT = {
  desktop: { width: 420, height: 270, gap: 142, rotateX: 56, rotateZ: -32, perspective: 1900 },
  mobile: { width: 290, height: 186, gap: 84, rotateX: 50, rotateZ: -14, perspective: 1300 },
};
