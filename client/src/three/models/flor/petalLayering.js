import { Raycaster, Vector3 } from 'three';

// Cómo se solapa cada pétalo con sus vecinos. Los pétalos de esta flor están imbricados (cada uno
// tiene un vecino por delante y otro por detrás), así que para despegarse sin atravesarlos no
// puede salir simplemente hacia delante ni hacia atrás: tiene que inclinarse (torsión) y escapar
// hacia el lado libre. Esto se mide sobre la geometría real con rayos a lo largo de la normal de
// la flor, no se escribe a mano.
//
// Resultado por pétalo (cada valor en [-1, 1], en los ejes locales del pétalo):
// - normal: > 0 si puede salir hacia delante (+Z), < 0 si solo hacia atrás, 0 si está entre dos.
// - freeSide: > 0 si el lado +Y local es el libre (su vecino queda detrás) y el -Y está tapado
//   por un vecino de delante. Sirve para dos cosas: escapar hacia ese lado y la torsión del peel
//   (girar sobre +X local levanta el lado +Y y baja el -Y, apartándolo del vecino de delante).

const SAMPLES = 48;
// Distancia máxima (unidades del modelo) para considerar que dos superficies se solapan.
const REACH = 0.02;

const raycaster = new Raycaster();
const tmpPoint = new Vector3();
const tmpOrigin = new Vector3();

// Los resultados dependen solo del modelo: se guardan por nombre de pétalo entre montajes.
const cache = new Map();

export function getPetalLayering(name) {
  return cache.get(name);
}

// `petal`: PetalController; `neighbors`: sus dos vecinos; `normal`: normal de la flor en el mundo.
// Coste: SAMPLES rayos contra dos mallas (~10-30 ms): se llama en ratos libres, no al hacer clic.
export function analyzePetalLayering(petal, neighbors, normal) {
  const cached = cache.get(petal.name);
  if (cached) return cached;

  const { node } = petal;
  const position = node.geometry.attributes.position;
  const step = Math.max(1, Math.floor(position.count / SAMPLES));
  const meshes = neighbors.map(neighbor => neighbor.node);
  node.updateWorldMatrix(true, false);
  for (const mesh of meshes) mesh.updateWorldMatrix(true, false);

  // Votos por lado (+Y / -Y): vecino por delante (+1) o por detrás (-1) en ese punto.
  const votes = { positive: { front: 0, back: 0 }, negative: { front: 0, back: 0 } };
  raycaster.far = REACH * 2;

  for (let i = 0; i < position.count; i += step) {
    tmpPoint.fromBufferAttribute(position, i);
    const side = tmpPoint.y >= 0 ? votes.positive : votes.negative;
    tmpPoint.applyMatrix4(node.matrixWorld);
    raycaster.set(tmpOrigin.copy(tmpPoint).addScaledVector(normal, -REACH), normal);

    const hit = raycaster.intersectObjects(meshes, false)[0];
    if (!hit) continue;
    if (hit.distance > REACH) side.front++;
    else side.back++;
  }

  const bias = ({ front, back }) => (front + back === 0 ? 0 : (back - front) / (front + back));
  const positive = bias(votes.positive);
  const negative = bias(votes.negative);
  const front = votes.positive.front + votes.negative.front;
  const back = votes.positive.back + votes.negative.back;

  const result = {
    // Solo hacia delante/atrás si nada lo tapa por ese lado.
    normal: front === 0 ? 1 : back === 0 ? -1 : 0,
    freeSide: (positive - negative) / 2,
    votes,
  };
  cache.set(petal.name, result);
  return result;
}
