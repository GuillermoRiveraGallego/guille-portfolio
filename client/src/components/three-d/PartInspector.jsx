import { formatCount, formatDecimal } from '@/lib/format';
import { cn } from '@/lib/utils';

// Ficha de la pieza inspeccionada: todo sale del modelo (geometría y materiales de esa pieza).
function PartInspector({ part, focused, onFocus, onBack }) {
  if (!part) return null;
  const { stats } = part;

  return (
    <aside
      className="pointer-events-auto fixed bottom-10 left-6 z-9 w-[min(20rem,calc(100vw-3rem))] animate-section-in text-[0.68rem] md:w-[26rem] md:text-[0.85rem] tracking-[0.08em] tabular-nums motion-reduce:animate-none md:bottom-16 md:left-[11vw]"
      aria-label={`Ficha de ${part.label}`}
    >
      <p className="text-[0.62rem] tracking-[0.22em] text-foreground/60 uppercase md:text-[0.78rem]">
        Inspeccionar
      </p>
      <h2 className="mt-3 text-[1.9rem] leading-none font-normal tracking-[-0.03em] uppercase md:text-[2.6rem]">
        {part.label}
      </h2>
      <div className="mt-6 h-px w-16 bg-foreground/40" />

      <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5">
        <dt className="text-foreground/55">Malla</dt>
        <dd className="text-right text-foreground/85">
          {stats.meshes} {stats.meshes === 1 ? 'primitiva' : 'primitivas'}
        </dd>
        <dt className="text-foreground/55">Triángulos</dt>
        <dd className="text-right text-foreground/85">{formatCount(stats.triangles)}</dd>
        <dt className="text-foreground/55">Vértices</dt>
        <dd className="text-right text-foreground/85">{formatCount(stats.vertices)}</dd>
      </dl>

      <ul className="mt-5 space-y-2">
        {stats.materials.map(material => (
          <li key={material.name} className="border-t border-foreground/10 pt-2">
            <span className="text-foreground/75">{material.name}</span>
            <span className="block text-foreground/55">
              {material.type} PBR · Metal {formatDecimal(material.metalness)} · Rugosidad{' '}
              {formatDecimal(material.roughness)}
              {material.clearcoat > 0 && ` · Clearcoat ${formatDecimal(material.clearcoat)}`}
              {material.transmission > 0 &&
                ` · Transmisión ${formatDecimal(material.transmission)}`}
              {material.maps.length > 0 && ` · Mapas: ${material.maps.join(', ')}`}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-7 flex gap-6 text-[0.62rem] tracking-[0.22em] uppercase md:text-[0.8rem]">
        <button
          type="button"
          onClick={onBack}
          className="text-foreground/60 transition-colors hover:text-foreground"
        >
          ← Volver a la moto
        </button>
        <button
          type="button"
          onClick={onFocus}
          className={cn(
            'text-foreground transition-opacity hover:opacity-70',
            focused && 'pointer-events-none opacity-0'
          )}
        >
          [ Enfocar ]
        </button>
      </div>
    </aside>
  );
}

export default PartInspector;
