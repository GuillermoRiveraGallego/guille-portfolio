import { formatCount, formatDecimal } from '@/lib/format';
import { cn } from '@/lib/utils';

// Materiales visibles en la ficha; el resto se resume ("+2 más") para que nunca crezca encima de
// la moto.
const MAX_MATERIALS = 3;

// Ficha de la pieza inspeccionada: todo sale del modelo (geometría y materiales de esa pieza).
// Sin recuadro, como el resto de textos de la sección, y compacta: una línea por material. En
// desktop va abajo en la columna del texto; en móvil arriba (donde estaba el capítulo, que se
// oculta) para dejar la mitad de abajo a la moto.
function PartInspector({ part, focused, onFocus, onBack }) {
  if (!part) return null;
  const { stats } = part;
  const materials = stats.materials.slice(0, MAX_MATERIALS);
  const hidden = stats.materials.length - materials.length;

  const figures = [
    ['Malla', `${stats.meshes} ${stats.meshes === 1 ? 'primitiva' : 'primitivas'}`],
    ['Triángulos', formatCount(stats.triangles)],
    ['Vértices', formatCount(stats.vertices)],
  ];

  return (
    <aside
      className="pointer-events-auto fixed inset-x-6 top-24 z-9 animate-section-in text-[0.66rem] tracking-[0.08em] tabular-nums motion-reduce:animate-none md:inset-x-auto md:top-auto md:bottom-16 md:left-[11vw] md:w-[24rem] md:text-[0.82rem]"
      aria-label={`Ficha de ${part.label}`}
    >
      <p className="text-[0.62rem] tracking-[0.22em] text-foreground/60 uppercase md:text-[0.78rem]">
        Inspeccionar
      </p>
      <h2 className="mt-2 text-[1.7rem] leading-none font-normal tracking-[-0.03em] uppercase md:mt-3 md:text-[2.6rem]">
        {part.label}
      </h2>

      <dl className="mt-4 grid grid-cols-3 gap-x-4 border-t border-foreground/20 pt-3 md:mt-6">
        {figures.map(([label, value]) => (
          <div key={label}>
            <dt className="text-foreground/55">{label}</dt>
            <dd className="mt-0.5 text-foreground/90">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-4 border-t border-foreground/20 pt-3">
        <p className="text-foreground/55">Materiales PBR</p>
        <ul className="mt-1 space-y-0.5">
          {materials.map(material => (
            <li key={material.name} className="truncate text-foreground/90">
              {material.name}
              <span className="text-foreground/55">
                {' '}
                · Metal {formatDecimal(material.metalness)} · Rug.{' '}
                {formatDecimal(material.roughness)}
                {material.clearcoat > 0 && ` · Clearcoat ${formatDecimal(material.clearcoat)}`}
              </span>
            </li>
          ))}
          {hidden > 0 && <li className="text-foreground/55">+{hidden} más</li>}
        </ul>
      </div>

      <div className="mt-5 flex gap-6 text-[0.62rem] tracking-[0.22em] uppercase md:mt-7 md:text-[0.8rem]">
        <button
          type="button"
          onClick={onBack}
          className="text-foreground/70 transition-colors hover:text-foreground"
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
