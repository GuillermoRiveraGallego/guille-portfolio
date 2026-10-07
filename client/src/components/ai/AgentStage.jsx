import { AI_LAYOUT, AI_LOG, AI_RESULT, AI_STATUS, AI_TOOLS } from '@/config/aiAgents';
import { cn } from '@/lib/utils';

// Escenario de la sección AI & MCP: el agente en el centro, las herramientas del servidor MCP en
// órbita y una consola con lo que va pasando. Todo se enciende con data-at / data-until (estado
// en data-state, ver hooks/useScrollTimeline); el prompt lo escribe la página en [data-typed].
// Sin canvas: divs con transform y opacity, más una lámina en SVG para el resultado.

const mono = 'font-mono tracking-normal';

// Ángulo (rad) de cada herramienta: la primera arriba y en el sentido de las agujas del reloj.
const angleOf = i => (i / AI_TOOLS.length) * Math.PI * 2 - Math.PI / 2;

function ToolNode({ tool, index }) {
  const angle = angleOf(index);
  const called = tool.at !== undefined;

  return (
    <>
      {/* Conexión con el agente: se traza al llamar a la herramienta y lleva el paquete */}
      <div
        className="absolute top-1/2 left-1/2 h-px w-1/2 origin-left"
        style={{ transform: `rotate(${angle}rad)` }}
      >
        {called && (
          <div
            data-at={tool.at}
            data-until={tool.until}
            className="group/beam absolute inset-y-0 right-[16%] left-[42%]"
          >
            <span className="absolute inset-0 origin-left scale-x-0 bg-linear-to-r from-foreground/10 to-foreground/70 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-data-[state=current]/beam:scale-x-100 group-data-[state=done]/beam:scale-x-100 group-data-[state=done]/beam:opacity-30" />
            <span className="absolute top-1/2 size-1.5 -translate-1/2 rounded-full bg-foreground opacity-0 shadow-[0_0_12px_2px_rgb(255_255_255/0.6)] group-data-[state=current]/beam:animate-travel motion-reduce:hidden" />
          </div>
        )}
      </div>

      <span
        data-at={tool.at}
        data-until={tool.until}
        className={cn(
          mono,
          'absolute -translate-1/2 rounded-full bg-background/80 px-2 py-1 text-[8.5px] whitespace-nowrap text-foreground/45 ring-1 ring-foreground/15 backdrop-blur transition-[color,background-color,box-shadow,scale] duration-500 md:px-2.5 md:text-[10.5px]',
          'data-[state=current]:scale-110 data-[state=current]:bg-foreground data-[state=current]:text-background data-[state=current]:shadow-[0_0_28px_4px_rgb(160_175_255/0.35)]',
          'data-[state=done]:text-foreground/85 data-[state=done]:ring-foreground/35'
        )}
        style={{
          left: `${50 + 50 * Math.cos(angle)}%`,
          top: `${50 + 50 * Math.sin(angle)}%`,
        }}
      >
        {tool.name}
      </span>
    </>
  );
}

// El agente: un núcleo con un halo que gira y su estado actual.
function Core() {
  return (
    <div
      data-at={2.8}
      data-until={4.8}
      className="group/core absolute inset-[31%] transition-transform duration-700 data-[state=current]:scale-110"
    >
      <div className="absolute -inset-[18%] animate-[spin_9s_linear_infinite] rounded-full bg-[conic-gradient(from_0deg,#7c8cff,#4fd1c5,#c084fc,#f0abfc,#7c8cff)] opacity-45 blur-2xl transition-opacity duration-700 group-data-[state=current]/core:opacity-80 motion-reduce:animate-none" />
      <div className="absolute inset-0 animate-[spin_5s_linear_infinite] rounded-full bg-[conic-gradient(from_0deg,rgb(255_255_255/0.9),transparent_35%,rgb(255_255_255/0.35)_60%,transparent_80%)] p-px motion-reduce:animate-none">
        <div className="h-full w-full rounded-full bg-[#101318]" />
      </div>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <p className="text-[0.9rem] tracking-[-0.02em] md:text-[1.3rem]">Agente</p>
          <p className="relative mt-1 h-3 w-28 text-[7.5px] tracking-[0.2em] text-foreground/55 uppercase md:h-4 md:text-[9px]">
            {AI_STATUS.map(status => (
              <span
                key={status.text}
                data-at={status.at}
                data-until={status.until}
                className="absolute inset-0 transition-opacity duration-300 not-data-[state=current]:opacity-0"
              >
                {status.text}
              </span>
            ))}
          </p>
        </div>
      </div>
    </div>
  );
}

const LOG_STYLE = {
  plan: { prefix: '·', className: 'text-foreground/55' },
  call: { prefix: '→', className: 'text-foreground/90' },
  result: { prefix: '←', className: 'text-foreground/50' },
  done: { prefix: '✓', className: 'text-foreground' },
};

// Consola: el prompt (lo escribe la página) y el registro; las líneas antiguas suben y se pierden.
function Console({ className }) {
  return (
    <div
      className={cn(
        mono,
        'flex flex-col overflow-hidden rounded-xl bg-white/[0.035] text-[8.5px] leading-[1.75] ring-1 ring-white/10 backdrop-blur-md md:text-[10.5px]',
        className
      )}
    >
      <div className="hidden items-center gap-1.5 border-b border-white/8 px-3 py-2 md:flex">
        <span className="size-1.5 rounded-full bg-foreground/25" />
        <span className="size-1.5 rounded-full bg-foreground/25" />
        <span className="size-1.5 rounded-full bg-foreground/25" />
        <span className="ml-2 text-foreground/40">agent · atbim-mcp (revit)</span>
      </div>
      <div className="flex flex-1 flex-col justify-end overflow-hidden px-3 py-2 mask-[linear-gradient(transparent,black_45%)]">
        <p className="shrink-0 text-foreground">
          <span className="text-foreground/45">› </span>
          <span data-typed />
          <span className="ml-px inline-block h-[1.1em] w-[0.5em] translate-y-[0.2em] animate-caret bg-foreground/80" />
        </p>
        {AI_LOG.map(entry => (
          <p
            key={entry.text}
            data-at={entry.at}
            className={cn(
              'shrink-0 truncate data-[state=pending]:hidden',
              LOG_STYLE[entry.kind].className
            )}
          >
            <span className="text-foreground/40">{LOG_STYLE[entry.kind].prefix} </span>
            {entry.text}
          </p>
        ))}
      </div>
    </div>
  );
}

// Etiquetas de diámetro sobre las tuberías de la lámina (x, y en el viewBox del plano).
const TAGS = [
  [62, 52, 'Ø50'],
  [128, 52, 'Ø40'],
  [212, 40, 'Ø32'],
  [96, 112, 'Ø50'],
  [176, 98, 'Ø25'],
  [236, 128, 'Ø40'],
  [50, 150, 'Ø32'],
  [150, 152, 'Ø25'],
];

// Resultado: la lámina M-201 con la planta y las etiquetas que acaba de colocar el agente.
function ResultSheet() {
  return (
    <div
      data-at={AI_RESULT[0]}
      data-until={AI_RESULT[1]}
      className="group/sheet absolute inset-y-0 -inset-x-[18%] grid place-items-center opacity-0 transition-[opacity,scale] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] not-data-[state=current]:pointer-events-none not-data-[state=current]:scale-95 data-[state=current]:opacity-100"
    >
      <div className="w-[min(440px,86%)] rounded-[3px] bg-[#f3f4f6] p-2.5 text-[#14161c] shadow-[0_40px_120px_-20px_rgb(124_140_255/0.45)] md:p-3.5">
        <div className="border border-[#14161c]/70 p-2">
          <svg viewBox="0 0 300 190" className="w-full" aria-hidden>
            <g fill="none" stroke="#14161c">
              <rect x="10" y="10" width="280" height="170" strokeWidth="3" />
              <path
                d="M110 10v70M110 110v70M200 10v60M200 100v80M10 80h70M140 80h60M230 100h60"
                strokeWidth="1.6"
              />
            </g>
            {/* Tuberías */}
            <g fill="none" stroke="#3b5bdb" strokeWidth="1.4" strokeLinecap="round">
              <path d="M24 64h250M60 64v100M140 64v90h120M220 64V30M250 64v80" />
              <path d="M24 64h250" strokeDasharray="3 3" stroke="#14161c" strokeOpacity="0.25" />
            </g>
            {TAGS.map(([x, y, text], i) => (
              <g
                key={`${x}-${y}`}
                className="origin-center scale-0 transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] [transform-box:fill-box] group-data-[state=current]/sheet:scale-100"
                style={{ transitionDelay: `${250 + i * 70}ms` }}
              >
                <rect x={x - 13} y={y - 7} width="26" height="14" rx="7" fill="#14161c" />
                <text
                  x={x}
                  y={y + 3}
                  textAnchor="middle"
                  fontSize="8"
                  fill="#f3f4f6"
                  fontFamily="ui-monospace, monospace"
                >
                  {text}
                </text>
              </g>
            ))}
          </svg>
          <div className="mt-2 flex items-end justify-between border-t border-[#14161c]/70 pt-1.5 text-[8px] tracking-[0.14em] uppercase md:text-[9.5px]">
            <span>Fontanería · Planta 2</span>
            <span className="text-[13px] tracking-[-0.02em] md:text-[16px]">M-201</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function AgentStage({ stageRef, mobile }) {
  const layout = mobile ? AI_LAYOUT.mobile : AI_LAYOUT.desktop;

  return (
    <div
      ref={stageRef}
      className="flex h-full w-full flex-col items-center justify-center gap-7 md:gap-14"
      aria-hidden
    >
      <div className="relative">
        <div
          data-at={AI_RESULT[0]}
          data-until={AI_RESULT[1]}
          className="relative transition-[opacity,scale] duration-700 data-[state=current]:scale-90 data-[state=current]:opacity-15"
          style={{ width: layout.orbit, height: layout.orbit }}
        >
          {/* Órbitas */}
          <div className="absolute inset-0 animate-[spin_80s_linear_infinite] rounded-full border border-dashed border-foreground/15 motion-reduce:animate-none" />
          <div className="absolute inset-[16%] animate-[spin_50s_linear_infinite_reverse] rounded-full border border-dashed border-foreground/10 motion-reduce:animate-none" />

          {AI_TOOLS.map((tool, index) => (
            <ToolNode key={tool.name} tool={tool} index={index} />
          ))}
          <Core />
        </div>
        <ResultSheet />
      </div>

      <Console className={layout.console} />
    </div>
  );
}

export default AgentStage;
