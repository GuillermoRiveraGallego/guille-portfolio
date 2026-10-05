// Formato compacto de cifras técnicas: 18432 → "18.4k", 1200424 → "1.20M".
export function formatCount(value) {
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e4) return `${(value / 1e3).toFixed(1)}k`;
  return value.toLocaleString('en-US');
}

export function formatBytes(bytes) {
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

// Nombres legibles de las extensiones glTF.
const EXTENSIONS = {
  KHR_draco_mesh_compression: 'Draco',
  EXT_texture_webp: 'WebP',
  EXT_meshopt_compression: 'Meshopt',
  KHR_texture_basisu: 'KTX2',
  KHR_materials_clearcoat: 'Clearcoat',
  KHR_materials_transmission: 'Transmission',
  KHR_materials_specular: 'Specular',
};

export const extensionLabel = name => EXTENSIONS[name] ?? name;
