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
  mobileScale: 0.62,
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
// Si no hay `dir`, sale en dirección radial desde el centro de la moto.
export const MOTORCYCLE_PARTS = {
  // Carrocería y elementos exteriores.
  Windscreen: { order: 0, dir: [0, 0.6, 1], distance: 38 },
  FrontFairing: { order: 0, dir: [0, 0.25, 1], distance: 40, mobile: true },
  SideFairing_L: { order: 0 },
  SideFairing_R: { order: 0 },
  LowerFairing_L: { order: 0, dir: [1, -0.5, 0.1] },
  LowerFairing_R: { order: 0, dir: [-1, -0.5, 0.1] },
  RearFairing: { order: 0, dir: [0, 0.5, -1], distance: 34 },
  FrameCover: { order: 0, dir: [0, 1, 0], distance: 22 },
  Mirror_L: { order: 0, dir: [1, 0.6, 0.4], distance: 32 },
  Mirror_R: { order: 0, dir: [-1, 0.6, 0.4], distance: 32 },
  Headlight: { order: 0, dir: [0, 0.1, 1], distance: 50 },
  FrontIndicators: { order: 0, dir: [0, 0.35, 1], distance: 46 },
  TailLight: { order: 0, dir: [0, 0.35, -1], distance: 44 },
  RearIndicators: { order: 0, dir: [0, 0.1, -1], distance: 50 },
  LicensePlate: { order: 0, dir: [0, -0.2, -1], distance: 52 },
  PassengerSeat: { order: 0, dir: [0, 1, -0.6], distance: 34 },

  // Depósito, asiento, mandos y guardabarros.
  FuelTank: { order: 1, dir: [0, 1, 0.15], distance: 40, mobile: true },
  Seat: { order: 1, dir: [0, 1, -0.2], distance: 30, mobile: true },
  Handlebar: { order: 1, dir: [0, 1, 0.3], distance: 26 },
  InstrumentCluster: { order: 1, dir: [0, 1, 0.6], distance: 42 },
  FrontFender: { order: 1, dir: [0, -0.3, 1], distance: 22 },
  RearFender: { order: 1, dir: [0, 0.6, -1], distance: 24 },
  PassengerFootrests: { order: 1, dir: [0, -0.4, -1], distance: 22 },
  FootControls_L: { order: 1 },
  FootControls_R: { order: 1 },
  SideStand: { order: 1, dir: [1, -1, 0], distance: 20 },

  // Ruedas, suspensiones, frenos y escape.
  FrontWheel: { order: 2, dir: [0, -0.15, 1], distance: 54, mobile: true },
  FrontBrakeCaliper: { order: 2, dir: [0.4, -0.1, 1], distance: 34 },
  FrontFork: { order: 2, dir: [0, 0.25, 1], distance: 26, mobile: true },
  RearWheel: { order: 2, dir: [0, -0.15, -1], distance: 54, mobile: true },
  RearBrakeCaliper: { order: 2, dir: [-0.4, -0.1, -1], distance: 36 },
  Swingarm: { order: 2, dir: [0, -0.4, -1], distance: 24, mobile: true },
  RearShock: { order: 2, dir: [0, 0.6, -0.3], distance: 16 },
  Exhaust: { order: 2, dir: [-1, -0.3, -0.5], distance: 38, mobile: true },
  Cables: { order: 2, dir: [0, 1, 0], distance: 12 },

  // Núcleo: el motor baja un poco y el chasis se queda como referencia.
  Engine: { order: 3, dir: [0, -1, 0], distance: 20, mobile: true },
  Chassis: { order: 3, distance: 0, mobile: true },
};

// Materiales que sí son vidrio: conservan la transmisión del GLB (ver motorcycleMaterials.js).
export const GLASS_MATERIAL = /glass/i;

// "FootControls_L" → "Foot controls L": el nombre visible sale del nodo, no se inventa.
export function partLabel(name) {
  return name
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s+(\w)/g, (_, char) => ` ${char.toLowerCase()}`)
    .replace(/ ([lr])$/, (_, side) => ` ${side.toUpperCase()}`);
}
