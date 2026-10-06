import {
  ApiLayer,
  BackendLayer,
  DataLayer,
  FrontendLayer,
  Plate,
} from '@/components/web/ArchitectureLayers';
import ProductMock from '@/components/web/ProductMock';
import { STACK_LAYOUT } from '@/config/webStack';

// Escenario 3D en CSS: la aplicación como un objeto hecho de láminas. Todas comparten posición y
// cada una se separa hacia atrás (translateZ) según su variable --rN; el giro del conjunto (--tilt)
// pasa de la vista de frente (producto) a una perspectiva en la que se ven las capas apiladas.
// Las variables las escribe useStackTimeline en `stageRef` (ver config/webStack.js). Sin
// Three.js: son unos pocos elementos con transform y opacity, que compone la GPU.
const LAYERS = [
  { key: 'frontend', label: 'Frontend', Content: FrontendLayer, phase: 'response' },
  { key: 'api', label: 'API', Content: ApiLayer, phase: 'request' },
  { key: 'backend', label: 'Backend', Content: BackendLayer, phase: 'backend' },
  { key: 'data', label: 'Datos', Content: DataLayer, phase: 'data' },
];

// Resalte de la capa por la que pasa la petición.
const HIGHLIGHT = {
  response:
    'group-data-[phase=response]/stack:bg-white group-data-[phase=response]/stack:ring-black/25',
  request:
    'group-data-[phase=request]/stack:bg-white group-data-[phase=request]/stack:ring-black/25',
  backend:
    'group-data-[phase=backend]/stack:bg-white group-data-[phase=backend]/stack:ring-black/25',
  data: 'group-data-[phase=data]/stack:bg-white group-data-[phase=data]/stack:ring-black/25',
};

// Profundidad de la capa más separada: sirve para centrar el conjunto y para el hilo de la petición.
const DEPTH = 'max(var(--r1), var(--r2) * 2, var(--r3) * 3, var(--r4) * 4)';

function StackStage({ stageRef, mobile }) {
  const layout = mobile ? STACK_LAYOUT.mobile : STACK_LAYOUT.desktop;

  return (
    <div
      ref={stageRef}
      data-phase="idle"
      className="group/stack grid h-full w-full place-items-center"
      style={{
        '--gap': `${layout.gap}px`,
        '--tilt': 0,
        '--r1': 0,
        '--r2': 0,
        '--r3': 0,
        '--r4': 0,
        '--packet': 0,
        '--packet-on': 0,
        perspective: `${layout.perspective}px`,
      }}
      aria-hidden
    >
      <div
        className="relative"
        style={{
          width: layout.width,
          height: layout.height,
          transformStyle: 'preserve-3d',
          transform: `rotateX(calc(var(--tilt) * ${layout.rotateX}deg)) rotateZ(calc(var(--tilt) * ${layout.rotateZ}deg)) translateZ(calc(${DEPTH} * var(--gap) / 2))`,
        }}
      >
        {/* Capas de detrás, de la más profunda a la más cercana */}
        {[...LAYERS].reverse().map(({ key, label, Content, phase }) => {
          const index = LAYERS.findIndex(layer => layer.key === key) + 1;
          return (
            <div
              key={key}
              className="absolute inset-0"
              style={{
                transform: `translateZ(calc(var(--r${index}) * ${index} * var(--gap) * -1))`,
                opacity: `calc(var(--r${index}) * 1.6)`,
              }}
            >
              <Plate label={label} highlight={HIGHLIGHT[phase]}>
                <Content />
              </Plate>
            </div>
          );
        })}

        {/* Hilo por el que viaja la petición y el paquete */}
        <div
          className="absolute top-1/2 left-[calc(100%+26px)] w-px origin-top bg-foreground/25"
          style={{
            height: `calc(${DEPTH} * var(--gap))`,
            transform: 'rotateX(-90deg)',
            opacity: 'calc(var(--tilt) * 1.4)',
          }}
        />
        <div
          className="absolute top-1/2 left-[calc(100%+26px)] size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground shadow-[0_0_0_5px_rgb(20_22_28/0.12)]"
          style={{
            transform: 'translateZ(calc(var(--packet) * var(--gap) * -1))',
            opacity: 'var(--packet-on)',
          }}
        />

        {/* La aplicación: siempre delante */}
        <div className="absolute inset-0" style={{ transform: 'translateZ(1px)' }}>
          <ProductMock />
        </div>
      </div>
    </div>
  );
}

export default StackStage;
