// Página de cada sección de los pétalos. Por defecto la genérica (pages/Section); las que tienen
// experiencia propia, la suya. La home las precarga al pulsar el pétalo, antes de cambiar de ruta.
const SECTION_PAGES = {
  web: () => import('@/pages/WebStack'),
  threeD: () => import('@/pages/ThreeDWeb'),
  ai: () => import('@/pages/AiMcp'),
  iot: () => import('@/pages/IotLive'),
  performance: () => import('@/pages/Performance'),
};

export const loadSectionPage = id => (SECTION_PAGES[id] ?? (() => import('@/pages/Section')))();
