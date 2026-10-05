import { extensionLabel, formatBytes, formatCount } from '@/lib/format';

// Datos reales de un capítulo en una sola línea discreta (ver CHAPTERS[].facts). Son secundarios:
// el detalle completo y las métricas en vivo están en el panel Stats. Todo sale del modelo cargado.
const COMPRESSION = ['KHR_draco_mesh_compression', 'EXT_texture_webp', 'EXT_meshopt_compression'];

function ChapterData({ type, stats, fileSize, mobile }) {
  if (!type || !stats) return null;

  const facts = {
    create: [
      `${stats.parts} piezas`,
      `${stats.materials.length} materiales`,
      'Jerarquía con nombres',
    ],
    optimize: [
      `${formatCount(stats.triangles)} triángulos`,
      fileSize && `${formatBytes(fileSize)} GLB`,
      ...stats.extensions.filter(name => COMPRESSION.includes(name)).map(extensionLabel),
    ],
    interact: mobile
      ? [`${stats.interactive} piezas`, 'Toca para inspeccionar', 'Arrastra para girar']
      : [
          `${stats.interactive} piezas`,
          'Pasa el cursor',
          'Haz clic para inspeccionar',
          'Arrastra para girar',
        ],
  }[type].filter(Boolean);

  return (
    <p className="mt-8 border-t border-foreground/15 pt-3 text-[0.62rem] tracking-[0.18em] text-foreground/55 uppercase tabular-nums md:mt-10 md:text-[0.74rem]">
      {facts.join(' · ')}
    </p>
  );
}

export default ChapterData;
