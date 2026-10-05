import { useState } from 'react';

import { extensionLabel, formatBytes, formatCount, formatInteger } from '@/lib/format';
import { cn } from '@/lib/utils';

// Capa técnica secundaria: datos reales del modelo y métricas del renderer en vivo, detrás de un
// botón discreto para no competir con la moto. Las métricas (`data-metric`) las escribe la página
// directamente en el DOM cada medio segundo; `panelRef` es el contenedor donde las busca.
function Row({ label, children }) {
  return (
    <div className="flex justify-between gap-6 border-t border-foreground/15 py-1.5">
      <span className="text-foreground/55">{label}</span>
      <span className="text-right text-foreground/85">{children}</span>
    </div>
  );
}

const Metric = ({ name }) => <span data-metric={name}>—</span>;

function StatsPanel({ stats, fileSize, readyIn, panelRef, hidden }) {
  const [open, setOpen] = useState(false);

  const textures = stats?.textures.map(texture => `${texture.width}×${texture.height}`).join(' · ');

  return (
    <div
      className={cn(
        'fixed right-6 bottom-8 z-9 flex flex-col items-end text-[0.62rem] tracking-[0.12em] tabular-nums transition-opacity duration-500 md:right-[4vw] md:bottom-12 md:text-[0.74rem]',
        hidden && 'pointer-events-none opacity-0'
      )}
    >
      <div
        ref={panelRef}
        id="three-d-stats"
        className={cn(
          'mb-4 w-[min(19rem,calc(100vw-3rem))] bg-background/75 px-4 pt-3 pb-2 backdrop-blur-md transition-[opacity,translate] duration-500 md:w-[22rem]',
          open ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-2 opacity-0'
        )}
        aria-hidden={!open}
      >
        {stats && (
          <>
            <p className="mb-2 tracking-[0.22em] text-foreground/55 uppercase">Modelo</p>
            <Row label="Piezas">{stats.parts}</Row>
            <Row label="Triángulos">{formatCount(stats.triangles)}</Row>
            <Row label="Mallas · Materiales">
              {stats.meshes} · {stats.materials.length}
            </Row>
            <Row label="Texturas">
              {stats.textures.length} en escena{textures ? ` (${textures})` : ''} ·{' '}
              {stats.fileImages} en el archivo
            </Row>
            <Row label="GLB">
              {[fileSize && formatBytes(fileSize), ...stats.extensions.map(extensionLabel)]
                .filter(Boolean)
                .join(' · ')}
            </Row>
          </>
        )}
        <p className="mt-4 mb-2 tracking-[0.22em] text-foreground/55 uppercase">En ejecución</p>
        <Row label="Draw calls">
          <Metric name="calls" />
        </Row>
        <Row label="Triángulos / frame">
          <Metric name="triangles" />
        </Row>
        <Row label="Fotogramas por segundo">
          <Metric name="fps" />
        </Row>
        <Row label="Geometrías · texturas en GPU">
          <Metric name="memory" />
        </Row>
        <Row label="Lista en">{readyIn ? `${formatInteger(readyIn)} ms` : '—'}</Row>
      </div>

      <button
        type="button"
        onClick={() => setOpen(value => !value)}
        aria-expanded={open}
        aria-controls="three-d-stats"
        className="tracking-[0.22em] text-foreground/60 uppercase transition-colors hover:text-foreground"
      >
        {open ? 'Cerrar datos' : 'Datos técnicos'}
      </button>
    </div>
  );
}

export default StatsPanel;
