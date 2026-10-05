import { extensionLabel, formatBytes, formatCount } from '@/lib/format';

// Datos reales de cada capítulo (ver CHAPTERS[].data). `stats` sale del modelo cargado; las
// métricas en vivo (`data-metric`) las rellena la página sin re-renderizar.
function Row({ label, children }) {
  return (
    <div className="flex justify-between gap-6 border-t border-foreground/10 py-1.5">
      <span className="text-foreground/45">{label}</span>
      <span className="text-right text-foreground/75">{children}</span>
    </div>
  );
}

function Metric({ name }) {
  return <span data-metric={name}>—</span>;
}

function ChapterData({ type, stats, fileSize, readyIn, mobile }) {
  if (!type || !stats) return null;
  const textures = stats.textures.map(texture => `${texture.width}×${texture.height}`).join(' · ');

  const rows = {
    model: [
      ['Parts', stats.parts],
      ['Nodes', stats.nodes],
      ['Format', ['GLB', ...stats.extensions.map(extensionLabel)].join(' · ')],
    ],
    optimize: [
      ['Triangles', formatCount(stats.triangles)],
      ['Meshes', stats.meshes],
      ['Materials', stats.materials.length],
    ],
    interact: [
      ['Interactive parts', stats.interactive],
      ['Raycast targets', `${stats.interactive} proxy boxes`],
      ['Instead of', `${formatCount(stats.triangles)} triangles`],
    ],
    experience: [
      [mobile ? 'Tap' : 'Click', 'Inspect a part'],
      ['Drag', 'Turn the bike'],
      ['Realistic → Technical', 'Same model'],
    ],
    blender: [
      ['Named objects', stats.parts],
      ['Origins', 'At each part center'],
      ['Units', 'Centimeters · Y up'],
    ],
    glb: [
      ['Scene graph', `${stats.hierarchy.length} top-level nodes`],
      ['Extensions', stats.extensions.map(extensionLabel).join(' · ')],
    ],
    file: [
      ['File', fileSize ? formatBytes(fileSize) : '—'],
      ['Geometry', `${formatCount(stats.triangles)} triangles · Draco`],
      [
        'Textures',
        `${stats.textures.length} in scene${textures ? ` (${textures})` : ''} · ${stats.fileImages} in file`,
      ],
    ],
    runtime: [
      ['Draw calls', <Metric key="calls" name="calls" />],
      ['Triangles / frame', <Metric key="triangles" name="triangles" />],
      ['Frame rate', <Metric key="fps" name="fps" />],
      ['GPU geometries · textures', <Metric key="memory" name="memory" />],
    ],
    web: [['Ready in', readyIn ? `${readyIn.toLocaleString('en-US')} ms` : '—']],
  }[type];

  return (
    <div className="mt-10 max-w-xs text-[0.68rem] tracking-[0.08em] tabular-nums">
      {rows.map(([label, value]) => (
        <Row key={label} label={label}>
          {value}
        </Row>
      ))}
      {type === 'glb' && (
        <p className="mt-4 leading-relaxed text-foreground/45">{stats.hierarchy.join(' · ')}</p>
      )}
    </div>
  );
}

export default ChapterData;
