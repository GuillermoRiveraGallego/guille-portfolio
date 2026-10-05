import { PATHS } from '@/router/paths';

// Secciones del portfolio. Cada una nace de un pétalo de la flor (config/petals.js).
// `label` es el texto corto que sustituye a "Rivera." en el título del hero al pasar por el pétalo;
// `number` y `title` se ven en el hero al pasar por el pétalo y en la cabecera de la sección.
export const SECTIONS = {
  web: {
    id: 'web',
    number: '01',
    label: 'Web',
    title: 'Web Development',
    tags: ['React', 'Node.js', 'Express', 'APIs', 'MongoDB'],
    path: PATHS.web,
  },
  threeD: {
    id: 'threeD',
    number: '02',
    label: '3D',
    title: '3D Web',
    tags: ['Three.js', 'WebGL', 'GLB', 'Blender'],
    path: PATHS.threeD,
  },
  ai: {
    id: 'ai',
    number: '03',
    label: 'AI',
    title: 'AI & MCP',
    tags: ['MCP', 'Agents', 'LLMs', 'Tool Use'],
    path: PATHS.ai,
  },
  bim: {
    id: 'bim',
    number: '04',
    label: 'BIM',
    title: 'BIM & Digital Twins',
    tags: ['BIM', 'Revit', 'ACC', 'Three.js', 'Data'],
    path: PATHS.bim,
  },
  performance: {
    id: 'performance',
    number: '05',
    label: 'Performance',
    title: 'Performance',
    tags: ['Optimization', 'Web Performance', 'Deployment'],
    path: PATHS.performance,
  },
};
