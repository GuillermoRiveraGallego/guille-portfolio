import { IOT_ALERT, IOT_CHART, IOT_FLOW, IOT_KINDS, IOT_SENSORS, IOT_WORLD } from '@/config/iot';
import { cn } from '@/lib/utils';

// Escenario de la sección IoT: un diagrama vertical (planta → broker MQTT → dashboard) que recorre
// una cámara. La página escribe --cam-y / --cam-s en `stageRef` según el scroll; los tramos se
// encienden con data-at (data-state, ver hooks/useScrollTimeline) y los valores en vivo los
// escribe useLiveSensors en [data-live], [data-feed] y [data-chart].

const mono = 'font-mono tracking-normal';
const card =
  'absolute inset-x-0 rounded-2xl bg-white/80 shadow-[0_30px_60px_-36px_rgb(15_20_30/0.4)] ring-1 ring-black/8 backdrop-blur-sm';
const caption = 'text-[10px] tracking-[0.22em] text-foreground/55 uppercase';
// Rojo de alerta: el único color de la sección, solo cuando algo se sale de lo normal.
const ALERT = '#e5484d';

const block = name => ({ top: IOT_WORLD[name].top, height: IOT_WORLD[name].height });

// Conexión vertical entre dos bloques: una línea y paquetes que bajan cuando está activa.
function Link({ from, to, at, children }) {
  return (
    <div
      data-at={at}
      className="group/link absolute left-1/2 w-px"
      style={{ top: from, height: to - from }}
    >
      <span className="absolute inset-0 origin-top scale-y-0 bg-foreground/30 transition-transform duration-700 group-data-[state=current]/link:scale-y-100" />
      {[0, 0.45, 0.9].map(delay => (
        <span
          key={delay}
          className="absolute left-1/2 size-2 -translate-1/2 rounded-full bg-foreground opacity-0 group-data-[state=current]/link:animate-travel-y motion-reduce:hidden"
          style={{ animationDelay: `${delay}s` }}
        />
      ))}
      {children}
    </div>
  );
}

function Sensor({ sensor }) {
  const kind = IOT_KINDS[sensor.kind];
  const alerting = sensor.id === IOT_CHART.sensor;

  return (
    <div
      data-at={sensor.at}
      className="group/sensor absolute"
      style={{ left: `${sensor.x}%`, top: `${sensor.y}%` }}
    >
      <div
        data-at={alerting ? IOT_ALERT.at : undefined}
        className="group/alert relative size-3 -translate-1/2"
        style={{ '--alert': ALERT }}
      >
        <span className="absolute -inset-1.5 rounded-full bg-foreground/25 opacity-0 group-data-[state=current]/sensor:animate-ping group-data-[state=current]/sensor:opacity-100 group-data-[state=current]/alert:bg-(--alert) motion-reduce:animate-none!" />
        <span className="absolute inset-0 rounded-full bg-foreground/15 ring-4 ring-white transition-colors duration-500 group-data-[state=current]/sensor:bg-foreground group-data-[state=current]/alert:bg-(--alert)" />
        <span
          className={cn(
            mono,
            'absolute top-1/2 left-5 -translate-y-1/2 rounded-full bg-white px-2 py-0.5 text-[11px] whitespace-nowrap shadow-[0_6px_16px_-8px_rgb(15_20_30/0.5)] ring-1 ring-black/8 transition-[opacity,translate,color] duration-500',
            'translate-x-1 opacity-0 group-data-[state=current]/sensor:translate-x-0 group-data-[state=current]/sensor:opacity-100 group-data-[state=current]/alert:text-(--alert)'
          )}
        >
          <span data-live={sensor.id}>—</span> {kind.unit}
        </span>
      </div>
    </div>
  );
}

// Planta de la oficina con los sensores.
function Plan() {
  return (
    <div className={cn(card, 'p-5')} style={block('plan')}>
      <div className="flex items-baseline justify-between">
        <p className={caption}>Oficina · Planta 1</p>
        <p className={cn(mono, 'text-[10px] text-foreground/45')}>{IOT_SENSORS.length} sensores</p>
      </div>
      <div className="relative mt-4 h-[226px]">
        <svg viewBox="0 0 500 226" className="absolute inset-0 h-full w-full" aria-hidden>
          <g fill="none" stroke="#14161c" strokeOpacity="0.7">
            <rect x="2" y="2" width="496" height="222" rx="4" strokeWidth="3" />
            <path
              d="M160 2v60M160 92v40M300 2v80M2 132h120M150 132h150M300 112v112M300 132h40M380 132h118"
              strokeWidth="1.6"
            />
          </g>
          <g
            fontSize="9"
            letterSpacing="2"
            fill="#14161c"
            fillOpacity="0.4"
            fontFamily="ui-sans-serif, sans-serif"
          >
            <text x="16" y="24">
              SALA 1
            </text>
            <text x="176" y="24">
              SALA 2
            </text>
            <text x="316" y="24">
              OPEN SPACE
            </text>
            <text x="16" y="152">
              COCINA
            </text>
            <text x="176" y="152">
              REUNIÓN
            </text>
          </g>
        </svg>
        {IOT_SENSORS.map(sensor => (
          <Sensor key={sensor.id} sensor={sensor} />
        ))}
      </div>
    </div>
  );
}

// Broker MQTT: recibe lo que publican los sensores y lo reparte a quien se suscribe.
function Broker() {
  return (
    <div className="absolute inset-x-0" style={block('broker')}>
      <div className="flex h-full items-center gap-5">
        <div
          data-at={IOT_FLOW.publish}
          className="group/broker relative grid size-[150px] shrink-0 place-items-center rounded-full bg-foreground text-background shadow-[0_30px_60px_-30px_rgb(15_20_30/0.6)]"
        >
          <span className="absolute -inset-3 rounded-full border border-dashed border-foreground/30 group-data-[state=current]/broker:animate-[spin_14s_linear_infinite] motion-reduce:animate-none!" />
          <div className="text-center">
            <p className="text-[1.35rem] tracking-[-0.03em]">MQTT</p>
            <p className="mt-0.5 text-[9px] tracking-[0.24em] text-background/60 uppercase">
              broker
            </p>
          </div>
        </div>
        <div
          data-at={IOT_FLOW.publish}
          className="flex-1 rounded-2xl bg-white/80 px-4 py-3 ring-1 ring-black/8 transition-opacity duration-700 data-[state=pending]:opacity-30"
        >
          <p className={caption}>Mensajes</p>
          <ul className={cn(mono, 'mt-2 space-y-1 text-[10.5px] text-foreground/45')}>
            {[0, 1, 2, 3].map(i => (
              <li
                key={i}
                data-feed
                className="truncate first:text-foreground"
                style={{ opacity: 1 - i * 0.2 }}
              />
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

const KPIS = ['temp-1', 'co2-2', 'hum-3', 'occ-4'];
const thresholdY =
  150 * (1 - (IOT_CHART.threshold - IOT_CHART.min) / (IOT_CHART.max - IOT_CHART.min));

// Dashboard en tiempo real: cifras, la gráfica de CO₂ y la alerta.
function Dashboard() {
  return (
    <div
      data-at={IOT_FLOW.dashboard}
      className={cn(card, 'p-5 transition-opacity duration-700 data-[state=pending]:opacity-60')}
      style={block('dashboard')}
    >
      <div className="flex items-center justify-between">
        <p className={caption}>Oficina — en vivo</p>
        <span className="flex items-center gap-1.5 text-[10px] tracking-[0.18em] text-foreground/55 uppercase">
          <span
            className="size-1.5 animate-pulse rounded-full motion-reduce:animate-none"
            style={{ backgroundColor: ALERT }}
          />
          Live
        </span>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2">
        {KPIS.map(id => {
          const sensor = IOT_SENSORS.find(entry => entry.id === id);
          const kind = IOT_KINDS[sensor.kind];
          return (
            <div
              key={id}
              data-at={id === IOT_CHART.sensor ? IOT_ALERT.at : undefined}
              className="rounded-xl bg-foreground/[0.04] px-3 py-2.5 transition-colors duration-500 data-[state=current]:bg-(--alert)/12 data-[state=current]:text-(--alert)"
              style={{ '--alert': ALERT }}
            >
              <p className="text-[9px] tracking-[0.16em] uppercase opacity-60">{kind.label}</p>
              <p className="mt-1 text-[1.35rem] leading-none tracking-[-0.03em] tabular-nums">
                <span data-live={id}>—</span>
                <span className="ml-1 text-[10px] tracking-normal opacity-60">{kind.unit}</span>
              </p>
            </div>
          );
        })}
      </div>

      <div className="relative mt-4">
        <p className={cn(caption, 'mb-2')}>CO₂ · Sala 2 · últimos 45 s</p>
        <svg viewBox="0 0 500 150" className="h-[150px] w-full overflow-visible" aria-hidden>
          <defs>
            <linearGradient id="iot-area" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#14161c" stopOpacity="0.16" />
              <stop offset="1" stopColor="#14161c" stopOpacity="0" />
            </linearGradient>
          </defs>
          <line
            x1="0"
            x2="500"
            y1={thresholdY}
            y2={thresholdY}
            stroke={ALERT}
            strokeDasharray="4 4"
            strokeOpacity="0.7"
          />
          <text x="498" y={thresholdY - 6} textAnchor="end" fontSize="9" fill={ALERT}>
            umbral 1.000 ppm
          </text>
          <polyline
            data-chart="raw"
            fill="none"
            stroke="#14161c"
            strokeOpacity="0.28"
            strokeWidth="1"
          />
          <g
            data-at={IOT_FLOW.smooth}
            className="opacity-0 transition-opacity duration-700 data-[state=current]:opacity-100"
          >
            <polygon data-chart="area" fill="url(#iot-area)" />
            <polyline
              data-chart="smooth"
              fill="none"
              stroke="#14161c"
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
          </g>
        </svg>
      </div>

      {/* Alerta: entra cuando el CO₂ supera el umbral */}
      <div
        data-alert
        data-at={IOT_ALERT.at}
        className="absolute inset-x-5 bottom-5 flex translate-y-3 items-center gap-3 rounded-xl px-4 py-3 text-[12px] text-white opacity-0 shadow-[0_20px_40px_-20px_rgb(229_72_77/0.8)] transition-[opacity,translate] duration-500 data-[state=current]:translate-y-0 data-[state=current]:opacity-100"
        style={{ backgroundColor: ALERT }}
      >
        <span className="relative flex size-2">
          <span className="absolute inset-0 animate-ping rounded-full bg-white motion-reduce:hidden" />
          <span className="relative size-2 rounded-full bg-white" />
        </span>
        <span>CO₂ alto en Sala 2 · ventilación activada automáticamente</span>
      </div>
    </div>
  );
}

function IotStage({ stageRef }) {
  return (
    <div
      ref={stageRef}
      // En móvil el escenario empieza a media pantalla: se funde arriba en vez de cortarse.
      className="relative h-full w-full overflow-hidden mask-[linear-gradient(transparent,black_14%)] md:mask-none"
      style={{ '--cam-y': 0, '--cam-s': 0.72 }}
      aria-hidden
    >
      <div
        className="absolute top-1/2 left-1/2"
        style={{
          width: IOT_WORLD.width,
          height: IOT_WORLD.height,
          transform:
            'translate(-50%, -50%) scale(var(--cam-s)) translateY(calc(var(--cam-y) * -1px))',
        }}
      >
        {/* Rejilla de puntos: se mueve con la cámara y da sensación de profundidad */}
        <div className="absolute -inset-[700px] bg-[radial-gradient(circle,rgb(20_22_28/0.13)_1px,transparent_1.2px)] bg-size-[24px_24px]" />

        <Plan />
        <Link
          from={IOT_WORLD.plan.top + IOT_WORLD.plan.height}
          to={IOT_WORLD.broker.top}
          at={IOT_FLOW.publish}
        >
          <span className="absolute top-1/2 left-4 -translate-y-1/2 text-[10px] tracking-[0.22em] whitespace-nowrap text-foreground/55 uppercase">
            publish
          </span>
        </Link>
        <Broker />
        <Link
          from={IOT_WORLD.broker.top + IOT_WORLD.broker.height}
          to={IOT_WORLD.dashboard.top}
          at={IOT_FLOW.subscribe}
        >
          <span className="absolute top-1/2 left-4 -translate-y-1/2 text-[10px] tracking-[0.22em] whitespace-nowrap text-foreground/55 uppercase">
            subscribe
          </span>
          <span
            className={cn(
              mono,
              'absolute top-1/2 right-5 -translate-y-1/2 rounded-full bg-white px-2.5 py-1 text-[10px] whitespace-nowrap text-foreground/70 ring-1 ring-black/10'
            )}
          >
            Node.js · WebSocket
          </span>
        </Link>
        <Dashboard />
      </div>
    </div>
  );
}

export default IotStage;
