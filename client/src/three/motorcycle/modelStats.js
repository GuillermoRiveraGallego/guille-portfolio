// Datos reales del modelo para la narrativa y el inspector: se calculan de la geometría y los
// materiales cargados, nunca se escriben a mano.

const MAPS = {
  map: 'Base color',
  normalMap: 'Normal',
  roughnessMap: 'Roughness',
  metalnessMap: 'Metalness',
  emissiveMap: 'Emissive',
  aoMap: 'AO',
};

export function meshTriangles(geometry) {
  const count = geometry.index ? geometry.index.count : geometry.attributes.position.count;
  return Math.round(count / 3);
}

// Material tal y como lo usa three (ya con la corrección de transmisión).
function describeMaterial(material) {
  return {
    name: material.name,
    type: material.isMeshPhysicalMaterial
      ? 'Physical'
      : material.isMeshStandardMaterial
        ? 'Standard'
        : material.type,
    metalness: material.metalness,
    roughness: material.roughness,
    clearcoat: material.clearcoat ?? 0,
    transmission: material.transmission ?? 0,
    maps: Object.keys(MAPS)
      .filter(key => material[key])
      .map(key => MAPS[key]),
  };
}

// Geometría y materiales de un nodo y sus hijos.
export function describeObject(object) {
  let triangles = 0;
  let vertices = 0;
  let meshes = 0;
  const materials = new Map();

  object.traverse(child => {
    if (!child.isMesh || child.userData.helper) return;
    meshes++;
    triangles += meshTriangles(child.geometry);
    vertices += child.geometry.attributes.position.count;
    const list = Array.isArray(child.material) ? child.material : [child.material];
    for (const material of list) {
      if (!materials.has(material.name)) materials.set(material.name, describeMaterial(material));
    }
  });

  return { triangles, vertices, meshes, materials: [...materials.values()] };
}

// Resumen de toda la moto + el archivo GLB (`json`: el JSON del glTF tal como lo leyó el loader).
export function describeModel(root, parts, json, interactiveCount) {
  const model = describeObject(root);
  const textures = [];
  root.traverse(child => {
    if (!child.isMesh) return;
    for (const key of Object.keys(MAPS)) {
      const texture = child.material[key];
      if (texture && !textures.some(entry => entry.uuid === texture.uuid)) {
        textures.push({
          uuid: texture.uuid,
          name: texture.name || key,
          width: texture.image?.width ?? 0,
          height: texture.image?.height ?? 0,
        });
      }
    }
  });

  let nodes = 0;
  root.traverse(() => nodes++);

  return {
    ...model,
    parts: parts.length,
    interactive: interactiveCount,
    nodes,
    hierarchy: root.children.map(child => child.name),
    textures,
    // Imágenes que lleva el archivo (pueden no usarse en la moto que se muestra).
    fileImages: json?.images?.length ?? 0,
    extensions: json?.extensionsUsed ?? [],
  };
}

// Tamaño del archivo tal y como lo sirve el servidor (null si no lo indica).
export async function fetchFileSize(url) {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    const length = Number(response.headers.get('content-length'));
    return Number.isFinite(length) && length > 0 ? length : null;
  } catch {
    return null;
  }
}
