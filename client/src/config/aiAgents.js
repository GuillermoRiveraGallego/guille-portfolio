// Guion de la sección AI & MCP: un agente que recibe una frase, la planifica y la ejecuta llamando
// a herramientas reales de un servidor MCP (Revit). Copy provisional.
//
// Línea de tiempo `t` = pantallas de scroll recorridas, como en /3d y /web. Posiciones:
// intro 0, prompt 1, plan 2, mcp 3-4, resultado 5, final 6. Los elementos del escenario se
// encienden con data-at / data-until (ver hooks/useScrollTimeline).

// Fondo oscuro: la única sección en negativo del portfolio.
export const AI_BACKGROUND = { top: '#0b0d11', bottom: '#15181e' };

export const AI_PROMPT = 'Etiqueta las tuberías de la planta 2 y monta la lámina de fontanería.';

// Tramo de la línea de tiempo en el que se escribe el prompt.
export const AI_TYPING = [0.6, 1.3];

export const AI_CHAPTERS = [
  {
    id: 'intro',
    kicker: '03 — AI & MCP',
    title: ['De la conversación', 'a la acción.'],
    line: 'Conecto modelos de lenguaje con herramientas reales.',
    meta: 'MCP · Agentes · LLMs · Tool use',
  },
  {
    id: 'prompt',
    number: '01',
    label: 'Lenguaje',
    title: ['Todo empieza', 'con una frase.'],
    line: 'Sin menús ni formularios: el usuario describe lo que necesita.',
  },
  {
    id: 'plan',
    number: '02',
    label: 'Razonar',
    title: ['Entender', 'antes de actuar.'],
    meta: 'Planificación · Contexto · Restricciones',
  },
  {
    id: 'mcp',
    number: '03',
    label: 'MCP',
    title: ['Un protocolo.', 'Cualquier herramienta.'],
    meta: 'Model Context Protocol · JSON-RPC',
    screens: 2,
    checklist: true,
    // Cada paso coincide con la llamada que se ve en el escenario (AI_TOOLS[].at).
    steps: [
      { label: 'search_elements', at: 2.9 },
      { label: 'get_untagged_elements', at: 3.2 },
      { label: 'place_tags', at: 3.5 },
      { label: 'create_sheet', at: 3.85 },
      { label: 'place_view', at: 4.15 },
      { label: 'export_sheet_pdf', at: 4.45 },
    ],
  },
  {
    id: 'result',
    number: '04',
    label: 'Resultado',
    title: ['El modelo', 'responde.'],
    line: '38 tuberías etiquetadas y una lámina lista para revisar.',
  },
  {
    id: 'final',
    kicker: 'Agentes con herramientas',
    title: ['Lenguaje natural.', 'Acciones reales.'],
    meta: 'LLM → MCP → Revit → Plano',
    nav: true,
  },
];

// Herramientas del servidor MCP alrededor del agente, en el sentido de las agujas del reloj desde
// arriba. Las que tienen `at` se llaman en la demo (de `at` a `until`); las demás solo están ahí.
export const AI_TOOLS = [
  { name: 'search_elements', at: 2.9, until: 3.2 },
  { name: 'get_untagged_elements', at: 3.2, until: 3.5 },
  { name: 'place_tags', at: 3.5, until: 3.85 },
  { name: 'create_dimensions' },
  { name: 'create_sheet', at: 3.85, until: 4.15 },
  { name: 'place_view', at: 4.15, until: 4.45 },
  { name: 'export_sheet_pdf', at: 4.45, until: 4.8 },
  { name: 'get_levels' },
];

// Registro de la consola: lo que pasa, línea a línea. `at` en la línea de tiempo.
// kind: plan (razonamiento), call (petición a la herramienta), result (respuesta), done (final).
export const AI_LOG = [
  { kind: 'plan', text: '1 · Buscar la vista de la planta 2', at: 1.7 },
  { kind: 'plan', text: '2 · Encontrar tuberías sin etiqueta', at: 1.85 },
  { kind: 'plan', text: '3 · Etiquetar por diámetro', at: 2 },
  { kind: 'plan', text: '4 · Componer y exportar la lámina', at: 2.15 },
  { kind: 'call', text: 'search_elements({ view: "P2 · Fontanería" })', at: 2.9 },
  { kind: 'result', text: '1 vista · 214 elementos', at: 3.05 },
  { kind: 'call', text: 'get_untagged_elements({ category: "Pipes" })', at: 3.2 },
  { kind: 'result', text: '38 tuberías sin etiqueta', at: 3.35 },
  { kind: 'call', text: 'place_tags({ ids: [38], tag: "Ø diámetro" })', at: 3.5 },
  { kind: 'result', text: '38 etiquetas colocadas', at: 3.7 },
  { kind: 'call', text: 'create_sheet({ number: "M-201" })', at: 3.85 },
  { kind: 'call', text: 'place_view({ sheet: "M-201", view: "P2" })', at: 4.15 },
  { kind: 'call', text: 'export_sheet_pdf({ sheet: "M-201" })', at: 4.45 },
  { kind: 'result', text: 'M-201.pdf · 1 lámina', at: 4.65 },
  { kind: 'done', text: 'Listo. 38 tuberías etiquetadas, lámina M-201 exportada.', at: 4.85 },
];

// Estado del agente que se lee en el núcleo, de `at` a `until`.
export const AI_STATUS = [
  { text: 'En espera', at: -Infinity, until: 0.6 },
  { text: 'Leyendo', at: 0.6, until: 1.6 },
  { text: 'Planificando', at: 1.6, until: 2.8 },
  { text: 'Usando herramientas', at: 2.8, until: 4.8 },
  { text: 'Hecho', at: 4.8, until: Infinity },
];

// Tramo en el que la lámina de resultado ocupa el escenario (el agente se retira detrás).
export const AI_RESULT = [4.85, 5.8];

// Tamaño de la órbita (px) y de la consola por dispositivo.
export const AI_LAYOUT = {
  desktop: { orbit: 'min(430px, 34vw, 54vh)', console: 'h-[168px] w-[min(440px,48vw)]' },
  mobile: { orbit: 'min(240px, 64vw, 28vh)', console: 'h-[64px] w-[calc(100vw-3rem)]' },
};
