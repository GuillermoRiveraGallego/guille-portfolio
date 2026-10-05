// Estructura del GLB de la moto (client/public/models/yzfr-125-v1.glb). Los nombres son los de los
// nodos del modelo, que es el contrato con el código: si se renombra una pieza en Blender, se
// renombra aquí. Unidades del modelo: centímetros, Y arriba, el frontal mira a +Z, +X es el lado
// izquierdo de la moto. Cada pieza tiene el origen en su centro.
export const MOTORCYCLE = {
  // Moto separada por piezas. El GLB todavía incluye dos copias antiguas de una sola pieza
  // (Moto_original_respaldo, Yamaha_YZF-R125_2011) que no se usan.
  root: 'Motorcycle_Web',
  // Fragmentos sin identificar del modelo: se quedan fijos con el chasis y no son interactivos.
  staticGroups: ['ReviewRequired'],
};

// Distancia de despiece por defecto (cm) según la capa de la pieza: lo exterior sale primero y más
// lejos, el núcleo apenas se mueve. En móvil se multiplica por `mobileScale`.
export const EXPLODE = {
  distance: [36, 28, 26, 18],
  mobileScale: 0.45,
  // Inclinación al separarse (rad), alejándose del centro.
  tilt: 0.06,
  // Ventana de cada capa dentro del progreso 0..1: empieza en order * stagger y dura `span`.
  stagger: 0.17,
  span: 0.49,
  // Peso de cada eje en la dirección radial automática (x lateral, y vertical, z longitudinal).
  // El lateral pesa más para que en la vista de 3/4 se vea la separación.
  radialWeights: [2, 0.8, 0.7],
};

// Piezas que se despiezan como una unidad (un nodo con sus hijos). `order`: capa (0 = exterior).
// `dir`: dirección artística [x, y, z] si la radial no basta; `distance` en cm.
// `mobile`: interactiva también en móvil (allí hay menos piezas seleccionables).
// `label`: nombre visible en castellano (traducción del nombre del nodo).
// Si no hay `dir`, sale en dirección radial desde el centro de la moto.
export const MOTORCYCLE_PARTS = {
  // Carrocería y elementos exteriores.
  Windscreen: { label: 'Cúpula', order: 0, dir: [0, 0.6, 1], distance: 38 },
  FrontFairing: {
    label: 'Carenado frontal',
    order: 0,
    dir: [0, 0.25, 1],
    distance: 40,
    mobile: true,
  },
  SideFairing_L: { label: 'Carenado lateral izq.', order: 0 },
  SideFairing_R: { label: 'Carenado lateral der.', order: 0 },
  LowerFairing_L: { label: 'Carenado inferior izq.', order: 0, dir: [1, -0.5, 0.1] },
  LowerFairing_R: { label: 'Carenado inferior der.', order: 0, dir: [-1, -0.5, 0.1] },
  RearFairing: { label: 'Colín', order: 0, dir: [0, 0.5, -1], distance: 34 },
  FrameCover: { label: 'Tapa del chasis', order: 0, dir: [0, 1, 0], distance: 22 },
  Mirror_L: { label: 'Retrovisor izq.', order: 0, dir: [1, 0.6, 0.4], distance: 32 },
  Mirror_R: { label: 'Retrovisor der.', order: 0, dir: [-1, 0.6, 0.4], distance: 32 },
  Headlight: { label: 'Faro', order: 0, dir: [0, 0.1, 1], distance: 50 },
  FrontIndicators: { label: 'Intermitentes delanteros', order: 0, dir: [0, 0.35, 1], distance: 46 },
  TailLight: { label: 'Piloto trasero', order: 0, dir: [0, 0.35, -1], distance: 44 },
  RearIndicators: { label: 'Intermitentes traseros', order: 0, dir: [0, 0.1, -1], distance: 50 },
  LicensePlate: { label: 'Matrícula', order: 0, dir: [0, -0.2, -1], distance: 52 },
  PassengerSeat: { label: 'Asiento del pasajero', order: 0, dir: [0, 1, -0.6], distance: 34 },

  // Depósito, asiento, mandos y guardabarros.
  FuelTank: { label: 'Depósito', order: 1, dir: [0, 1, 0.15], distance: 40, mobile: true },
  Seat: { label: 'Asiento', order: 1, dir: [0, 1, -0.2], distance: 30, mobile: true },
  Handlebar: { label: 'Manillar', order: 1, dir: [0, 1, 0.3], distance: 26 },
  InstrumentCluster: { label: 'Cuadro de instrumentos', order: 1, dir: [0, 1, 0.6], distance: 42 },
  FrontFender: { label: 'Guardabarros delantero', order: 1, dir: [0, -0.3, 1], distance: 22 },
  RearFender: { label: 'Guardabarros trasero', order: 1, dir: [0, 0.6, -1], distance: 24 },
  PassengerFootrests: {
    label: 'Estriberas del pasajero',
    order: 1,
    dir: [0, -0.4, -1],
    distance: 22,
  },
  FootControls_L: { label: 'Estribera izq.', order: 1 },
  FootControls_R: { label: 'Estribera der.', order: 1 },
  SideStand: { label: 'Pata de cabra', order: 1, dir: [1, -1, 0], distance: 20 },

  // Ruedas, suspensiones, frenos y escape.
  FrontWheel: {
    label: 'Rueda delantera',
    order: 2,
    dir: [0, -0.15, 1],
    distance: 54,
    mobile: true,
  },
  FrontBrakeCaliper: {
    label: 'Pinza de freno delantera',
    order: 2,
    dir: [0.4, -0.1, 1],
    distance: 34,
  },
  FrontFork: { label: 'Horquilla', order: 2, dir: [0, 0.25, 1], distance: 26, mobile: true },
  RearWheel: { label: 'Rueda trasera', order: 2, dir: [0, -0.15, -1], distance: 54, mobile: true },
  RearBrakeCaliper: {
    label: 'Pinza de freno trasera',
    order: 2,
    dir: [-0.4, -0.1, -1],
    distance: 36,
  },
  Swingarm: { label: 'Basculante', order: 2, dir: [0, -0.4, -1], distance: 24, mobile: true },
  RearShock: { label: 'Amortiguador trasero', order: 2, dir: [0, 0.6, -0.3], distance: 16 },
  Exhaust: { label: 'Escape', order: 2, dir: [-1, -0.3, -0.5], distance: 38, mobile: true },
  Cables: { label: 'Cables', order: 2, dir: [0, 1, 0], distance: 12 },

  // Núcleo: el motor baja un poco y el chasis se queda como referencia.
  Engine: { label: 'Motor', order: 3, dir: [0, -1, 0], distance: 20, mobile: true },
  Chassis: { label: 'Chasis', order: 3, distance: 0, mobile: true },
};

// Materiales que sí son vidrio: conservan la transmisión del GLB (ver motorcycleMaterials.js).
export const GLASS_MATERIAL = /glass/i;

// Nombre visible por defecto si una pieza no tiene `label`: sale del nodo
// ("FootControls_L" → "Foot controls L").
export function partLabel(name) {
  return name
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s+(\w)/g, (_, char) => ` ${char.toLowerCase()}`)
    .replace(/ ([lr])$/, (_, side) => ` ${side.toUpperCase()}`);
}
