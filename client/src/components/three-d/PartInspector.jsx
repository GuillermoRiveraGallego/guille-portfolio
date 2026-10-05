import { formatCount } from '@/lib/format';
import { cn } from '@/lib/utils';

// Ficha de la pieza inspeccionada: todo sale del modelo (geometría y materiales de esa pieza).
function PartInspector({ part, focused, onFocus, onBack }) {
  if (!part) return null;
  const { stats } = part;

  return (
    <aside
      className="pointer-events-auto fixed bottom-10 left-6 z-9 w-[min(20rem,calc(100vw-3rem))] animate-section-in text-[0.68rem] tracking-[0.08em] tabular-nums motion-reduce:animate-none md:bottom-16 md:left-[11vw]"
      aria-label={`${part.label} details`}
    >
      <p className="text-[0.62rem] tracking-[0.22em] text-foreground/50 uppercase">Inspect</p>
      <h2 className="mt-3 text-[1.9rem] leading-none font-normal tracking-[-0.03em] uppercase">
        {part.label}
      </h2>
      <div className="mt-6 h-px w-16 bg-foreground/40" />

      <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5">
        <dt className="text-foreground/45">Mesh</dt>
        <dd className="text-right text-foreground/75">
          {stats.meshes} {stats.meshes === 1 ? 'primitive' : 'primitives'}
        </dd>
        <dt className="text-foreground/45">Triangles</dt>
        <dd className="text-right text-foreground/75">{formatCount(stats.triangles)}</dd>
        <dt className="text-foreground/45">Vertices</dt>
        <dd className="text-right text-foreground/75">{formatCount(stats.vertices)}</dd>
      </dl>

      <ul className="mt-5 space-y-2">
        {stats.materials.map(material => (
          <li key={material.name} className="border-t border-foreground/10 pt-2">
            <span className="text-foreground/75">{material.name}</span>
            <span className="block text-foreground/45">
              {material.type} PBR · Metal {material.metalness.toFixed(2)} · Rough{' '}
              {material.roughness.toFixed(2)}
              {material.clearcoat > 0 && ` · Clearcoat ${material.clearcoat.toFixed(2)}`}
              {material.transmission > 0 && ` · Transmission ${material.transmission.toFixed(2)}`}
              {material.maps.length > 0 && ` · ${material.maps.join(', ')} map`}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-7 flex gap-6 text-[0.62rem] tracking-[0.22em] uppercase">
        <button
          type="button"
          onClick={onBack}
          className="text-foreground/60 transition-colors hover:text-foreground"
        >
          ← Back to bike
        </button>
        <button
          type="button"
          onClick={onFocus}
          className={cn(
            'text-foreground transition-opacity hover:opacity-70',
            focused && 'pointer-events-none opacity-0'
          )}
        >
          [ Focus ]
        </button>
      </div>
    </aside>
  );
}

export default PartInspector;
