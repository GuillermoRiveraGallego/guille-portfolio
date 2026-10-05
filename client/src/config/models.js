// Rutas de los modelos 3D servidos desde client/public/models. Van bajo la base de Vite
// (BASE_URL, acaba en "/"), así funcionan igual en local que publicadas en un subdirectorio.
const base = import.meta.env.BASE_URL;

export const MODELS = {
  florCristal: `${base}models/flor_cristal2.glb`,
  florNatural: `${base}models/flor_natural.glb`,
  florInteractiva: `${base}models/flor_interactiva.glb`,
  motorcycle: `${base}models/yzfr-125-v1.glb`,
};
