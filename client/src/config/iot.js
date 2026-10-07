// Guion de la sección IoT: un dato que nace en un sensor, viaja por MQTT, se procesa y acaba en un
// dashboard en tiempo real. Copy provisional; los valores son simulados (ver useLiveSensors).
//
// Línea de tiempo `t` = pantallas de scroll recorridas. Posiciones: intro 0, capturar 1,
// transmitir 2, procesar 3, visualizar 4-5, final 6. La cámara recorre el diagrama (planta →
// broker → dashboard) con un plano por pantalla (IOT_SHOTS).

export const IOT_BACKGROUND = { top: '#dfe2e7', bottom: '#f2f3f5' };

export const IOT_CHAPTERS = [
  {
    id: 'intro',
    kicker: '04 — IOT',
    title: ['Datos', 'que se mueven.'],
    line: 'Conecto el mundo físico con interfaces en tiempo real.',
    meta: 'Sensores · MQTT · Tiempo real · Dashboards',
  },
  {
    id: 'capture',
    number: '01',
    label: 'Capturar',
    title: ['Todo empieza', 'en el mundo físico.'],
    meta: 'Temperatura · CO₂ · Humedad · Presencia',
  },
  {
    id: 'transmit',
    number: '02',
    label: 'Transmitir',
    title: ['Mensajes pequeños.', 'Muchos.'],
    line: 'Cada sensor publica en su tema; quien lo necesita, se suscribe.',
    meta: 'MQTT · Pub/Sub · QoS',
  },
  {
    id: 'process',
    number: '03',
    label: 'Procesar',
    title: ['Del ruido', 'a la señal.'],
    meta: 'Node.js · WebSockets · Series temporales',
    steps: [
      { label: 'Validar', at: 2.75 },
      { label: 'Suavizar', at: 3 },
      { label: 'Agregar', at: 3.2 },
      { label: 'Umbrales', at: 3.4 },
    ],
  },
  {
    id: 'visualize',
    number: '04',
    label: 'Visualizar',
    title: ['Lo que pasa,', 'mientras pasa.'],
    line: 'Y cuando algo se sale de lo normal, avisa.',
    meta: 'React · Gráficas en vivo · Alertas',
    screens: 2,
  },
  {
    id: 'final',
    kicker: 'Del sensor a la decisión',
    title: ['Del sensor', 'a la pantalla.'],
    meta: 'Sensor → MQTT → Node.js → React',
    nav: true,
  },
];

// Sensores de la planta: posición en el plano (% del ancho / alto), magnitud y cuándo se
// encienden. `base` y `noise`: valor típico y cuánto varía en la simulación.
export const IOT_SENSORS = [
  { id: 'temp-1', room: 'Sala 1', kind: 'temp', x: 18, y: 30, at: 0.85 },
  { id: 'co2-2', room: 'Sala 2', kind: 'co2', x: 50, y: 26, at: 0.95 },
  { id: 'hum-3', room: 'Open space', kind: 'hum', x: 80, y: 34, at: 1.05 },
  { id: 'occ-4', room: 'Open space', kind: 'occ', x: 70, y: 74, at: 1.15 },
  { id: 'temp-5', room: 'Cocina', kind: 'temp', x: 22, y: 76, at: 1.25 },
  { id: 'co2-6', room: 'Reunión', kind: 'co2', x: 42, y: 84, at: 1.35 },
];

export const IOT_KINDS = {
  temp: { label: 'Temperatura', unit: '°C', base: 22.4, noise: 0.15, digits: 1 },
  co2: { label: 'CO₂', unit: 'ppm', base: 720, noise: 18, digits: 0 },
  hum: { label: 'Humedad', unit: '%', base: 46, noise: 0.6, digits: 0 },
  occ: { label: 'Ocupación', unit: 'pers.', base: 14, noise: 0.8, digits: 0 },
};

// Sensor de la gráfica y de la alerta (CO₂ de la Sala 2): a partir de IOT_ALERT sube por encima
// del umbral.
export const IOT_CHART = { sensor: 'co2-2', samples: 48, threshold: 1000, min: 500, max: 1300 };
export const IOT_ALERT = { at: 4.55, peak: 1180 };

// Cuándo se activa cada tramo del diagrama.
export const IOT_FLOW = {
  publish: 1.75, // planta → broker
  subscribe: 2.45, // broker → servidor → dashboard
  smooth: 3, // la gráfica suavizada aparece sobre la cruda
  dashboard: 3.6,
};

// Diagrama en px (el "mundo" que recorre la cámara): ancho y bloques con su `top` y alto.
export const IOT_WORLD = {
  width: 540,
  height: 1040,
  plan: { top: 0, height: 300 },
  broker: { top: 420, height: 150 },
  dashboard: { top: 690, height: 350 },
};

// Planos de la cámara, uno por pantalla: `y` = centro del encuadre respecto al centro del mundo
// (px), `s` = zoom. Entre pantallas se interpolan con suavidad.
export const IOT_SHOTS = [
  { y: 0, s: 0.72 }, // intro: todo el recorrido
  { y: -370, s: 1.2 }, // capturar: la planta
  { y: -150, s: 0.95 }, // transmitir: planta → broker
  { y: 160, s: 1 }, // procesar: broker → dashboard
  { y: 345, s: 1.15 }, // visualizar
  { y: 345, s: 1.15 }, // visualizar: alerta
  { y: 0, s: 0.72 }, // final
];

// Hueco mínimo (px) que necesita el plano más cercano: si el escenario es más pequeño (móvil,
// pantallas bajas) todo el diagrama se reduce en proporción.
export const IOT_FIT = { width: 660, height: 760 };

// Cada cuánto llega una lectura nueva (ms).
export const IOT_TICK = 900;
