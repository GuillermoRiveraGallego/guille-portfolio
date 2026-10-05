// Página de cada sección de los pétalos. Por defecto la genérica (pages/Section); las que tienen
// experiencia propia, la suya. La home las precarga al pulsar el pétalo, antes de cambiar de ruta.
const SECTION_PAGES = {
  threeD: () => import('@/pages/ThreeDWeb'),
};

export const loadSectionPage = id => (SECTION_PAGES[id] ?? (() => import('@/pages/Section')))();
