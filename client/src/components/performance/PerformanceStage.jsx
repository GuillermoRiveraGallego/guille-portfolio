import {
  PERF_AXIS,
  PERF_MEASURED,
  PERF_METRICS,
  PERF_PERFECT,
  PERF_REQUESTS,
} from '@/config/performance';
import { cn } from '@/lib/utils';

// Escenario de la sección Performance: la puntuación en un anillo que pasa de rojo a verde, las
// métricas principales y la cascada de red de la página. Lo continuo (cifras, anillo, barras,
// barrido de la medición) lo escribe setupMeter; lo discreto (notas de cada mejora, el 100) se
// enciende con data-at (ver hooks/useScrollTimeline).

const mono = 'font-mono tracking-normal';
const caption =
  'text-[8.5px] tracking-[0.22em] text-foreground/55 uppercase md:text-[10px] tabular-nums';

// Tono de cada tipo de petición: misma tinta, distinta intensidad.
const TYPE = {
  doc: 'bg-foreground',
  css: 'bg-foreground/55',
  js: 'bg-foreground/80',
  img: 'bg-foreground/30',
  font: 'bg-foreground/45',
};
const TICKS = Array.from({ length: PERF_AXIS / 1000 + 1 }, (_, i) => i);
const SPARKS = Array.from({ length: 14 }, (_, i) => (i / 14) * 360);

// Puntuación: anillo, cifra y un halo del mismo color; al llegar a 100, chispas.
function Score() {
  return (
    <div className="relative size-[118px] shrink-0 md:size-[230px]">
      <div className="absolute inset-[8%] rounded-full bg-(--score-color) opacity-25 blur-2xl transition-colors md:blur-3xl" />

      <div data-at={PERF_PERFECT} className="group/perfect absolute inset-0">
        <span className="absolute inset-0 rounded-full ring-2 ring-(--score-color) opacity-0 group-data-[state=current]/perfect:animate-[ping_1.4s_cubic-bezier(0,0,0.2,1)_2] motion-reduce:hidden" />
        {SPARKS.map(angle => (
          // Radio del anillo: el % de translateX es del propio ancho (medio anillo).
          <span
            key={angle}
            className="absolute top-1/2 left-1/2 h-1.5 w-1/2 origin-left -translate-y-1/2 opacity-0 group-data-[state=current]/perfect:animate-burst motion-reduce:hidden"
            style={{ '--angle': `${angle}deg`, '--from': '0%', '--to': '55%' }}
          >
            <span className="absolute right-0 size-1.5 rounded-full bg-(--score-color)" />
          </span>
        ))}
      </div>

      <svg viewBox="0 0 120 120" className="absolute inset-0 -rotate-90" aria-hidden>
        <circle
          cx="60"
          cy="60"
          r="52"
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.08"
          strokeWidth="7"
        />
        <circle
          data-ring
          cx="60"
          cy="60"
          r="52"
          fill="none"
          stroke="var(--score-color)"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={2 * Math.PI * 52}
          strokeDashoffset={2 * Math.PI * 52}
        />
      </svg>

      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <p
            data-score
            className="text-[2.6rem] leading-none tracking-[-0.05em] tabular-nums md:text-[4.8rem]"
          >
            —
          </p>
          <p className={cn(caption, 'mt-1 md:mt-2')}>Performance</p>
        </div>
      </div>
    </div>
  );
}

function Metrics() {
  return (
    <dl
      data-at={PERF_MEASURED}
      className="grid flex-1 grid-cols-2 gap-x-4 gap-y-3 transition-opacity duration-500 data-[state=pending]:opacity-40 md:gap-x-8 md:gap-y-6"
    >
      {PERF_METRICS.map(metric => (
        <div key={metric.id} className="border-t border-foreground/15 pt-1.5 md:pt-2.5">
          <dt className={caption}>{metric.label}</dt>
          <dd className="mt-0.5 text-[1.25rem] leading-none tracking-[-0.04em] tabular-nums md:mt-1.5 md:text-[2.3rem]">
            <span data-metric={metric.id}>—</span>
            {metric.unit && (
              <span className="ml-1 text-[0.6rem] tracking-normal text-foreground/55 md:text-[0.85rem]">
                {metric.unit}
              </span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

// Cascada de red: una fila por petición. Las barras (posición y ancho) las mueve setupMeter;
// la nota de cada una aparece cuando se aplica su mejora.
function Waterfall() {
  return (
    <div className="rounded-2xl bg-white/75 p-3 shadow-[0_30px_60px_-40px_rgb(15_20_30/0.45)] ring-1 ring-black/8 md:p-5">
      <div className="flex items-baseline justify-between">
        <p className={caption}>Red · {PERF_REQUESTS.length} peticiones</p>
        <p className={cn(caption, 'normal-case tracking-normal')}>
          <span data-lcp-label>LCP</span>
        </p>
      </div>

      <div className="mt-2 grid grid-cols-[64px_1fr] gap-x-2 md:mt-4 md:grid-cols-[96px_1fr] md:gap-x-4">
        <div className="pt-4 md:pt-5">
          {PERF_REQUESTS.map(request => (
            <p
              key={request.name}
              className={cn(
                mono,
                'flex h-[17px] items-center truncate text-[8px] text-foreground/60 md:h-[26px] md:text-[10.5px]',
                request.lcp && 'text-foreground'
              )}
            >
              {request.name}
            </p>
          ))}
        </div>

        <div className="relative">
          {/* Eje en segundos */}
          <div className="relative h-4 md:h-5">
            {TICKS.map(second => (
              <span
                key={second}
                className={cn(
                  mono,
                  'absolute top-0 -translate-x-1/2 text-[7.5px] text-foreground/40 md:text-[9px]'
                )}
                style={{ left: `${((second * 1000) / PERF_AXIS) * 100}%` }}
              >
                {second}s
              </span>
            ))}
          </div>

          <div className="relative">
            {TICKS.map(second => (
              <span
                key={second}
                className="absolute inset-y-0 w-px bg-foreground/8"
                style={{ left: `${((second * 1000) / PERF_AXIS) * 100}%` }}
              />
            ))}

            <div data-reveal className="relative" style={{ clipPath: 'inset(0 100% 0 0)' }}>
              {PERF_REQUESTS.map((request, i) => (
                <div key={request.name} className="relative h-[17px] md:h-[26px]">
                  <div
                    data-bar={i}
                    className={cn(
                      'absolute top-1/2 h-[6px] -translate-y-1/2 rounded-full md:h-[9px]',
                      TYPE[request.type],
                      request.lcp && 'outline-2 outline-offset-2 outline-(--score-color)'
                    )}
                  >
                    <span
                      data-at={request.at}
                      className={cn(
                        mono,
                        'absolute top-1/2 left-[calc(100%+6px)] z-10 -translate-y-1/2 rounded-full bg-foreground px-1.5 py-px text-[7px] whitespace-nowrap text-background transition-[opacity,scale] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] md:text-[9px]',
                        'scale-50 opacity-0 data-[state=current]:scale-100 data-[state=current]:opacity-100'
                      )}
                    >
                      {request.note}
                    </span>
                  </div>
                </div>
              ))}

              {/* Marcador de LCP: se mueve hacia la izquierda con cada mejora */}
              <span
                data-lcp
                className="absolute -inset-y-1 w-0.5 -translate-x-1/2 rounded-full bg-(--score-color)"
              />
            </div>

            {/* Barrido de la medición */}
            <span
              data-scan
              className="absolute -inset-y-2 w-px bg-foreground opacity-0 shadow-[0_0_14px_3px_rgb(20_22_28/0.35)]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function PerformanceStage({ stageRef }) {
  return (
    <div
      ref={stageRef}
      className="grid h-full w-full place-items-center px-6 md:px-[4vw]"
      style={{ '--score-hue': 4, '--score-color': 'hsl(var(--score-hue) 72% 46%)' }}
      aria-hidden
    >
      <div className="w-full max-w-[600px]">
        <div className="flex items-center gap-5 md:gap-10">
          <Score />
          <Metrics />
        </div>
        <div className="mt-4 md:mt-10">
          <Waterfall />
        </div>
      </div>
    </div>
  );
}

export default PerformanceStage;
