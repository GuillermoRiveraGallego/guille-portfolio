// Cifras en castellano: coma decimal y punto de miles.
const decimal = (value, digits) => value.toFixed(digits).replace('.', ',');

export const formatDecimal = value => decimal(value, 2);

export const formatInteger = value => value.toLocaleString('es-ES', { useGrouping: 'always' });

// Formato compacto de cifras técnicas: 18432 → "18,4 mil", 1200424 → "1,20 M".
export function formatCount(value) {
  if (value >= 1e6) return `${decimal(value / 1e6, 2)} M`;
  if (value >= 1e4) return `${decimal(value / 1e3, 1)} mil`;
  return formatInteger(value);
}

export function formatBytes(bytes) {
  if (bytes >= 1048576) return `${decimal(bytes / 1048576, 1)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

// Nombres legibles de las extensiones glTF.
const EXTENSIONS = {
  KHR_draco_mesh_compression: 'Draco',
  EXT_texture_webp: 'WebP',
  EXT_meshopt_compression: 'Meshopt',
  KHR_texture_basisu: 'KTX2',
  KHR_materials_clearcoat: 'Clearcoat',
  KHR_materials_transmission: 'Transmisión',
  KHR_materials_specular: 'Specular',
};

export const extensionLabel = name => EXTENSIONS[name] ?? name;
