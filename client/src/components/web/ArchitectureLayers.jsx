import { cn } from '@/lib/utils';

// Contenido de las capas que hay detrás de la aplicación. Son ilustraciones abstractas (nombres,
// rutas y registros de ejemplo), no código real. Cada capa se resalta cuando la petición de la
// demo pasa por ella (data-phase del escenario, group/stack).

const mono = 'font-mono text-[8.5px] tracking-normal';

// Lámina común: casi opaca (cada capa se lee sola, sin mezclarse con las de detrás), con su nombre
// fuera, a la izquierda.
export function Plate({ label, highlight, className, children }) {
  return (
    <div
      className={cn(
        'relative h-full w-full rounded-[10px] bg-[#f7f8fa]/88 shadow-[0_24px_40px_-28px_rgb(15_20_30/0.3)] ring-1 ring-black/10 transition-[background-color,box-shadow] duration-500',
        highlight,
        className
      )}
    >
      {/* Nombre de la capa: a la izquierda en desktop; en móvil encima (a la izquierda no cabe) */}
      <span className="absolute bottom-[calc(100%+4px)] left-1 text-[9px] tracking-[0.24em] whitespace-nowrap text-foreground/60 uppercase md:top-1/2 md:right-[calc(100%+18px)] md:bottom-auto md:left-auto md:-translate-y-1/2 md:text-[10px]">
        {label}
      </span>
      {children}
    </div>
  );
}

function Box({ name, className, children }) {
  return (
    <div className={cn('rounded-[5px] px-2 py-1.5 ring-1 ring-black/12', className)}>
      <span className={cn(mono, 'text-foreground/60')}>{name}</span>
      {children}
    </div>
  );
}

// FRONTEND: el árbol de componentes que pinta la UI.
export function FrontendLayer() {
  return (
    <div className="flex h-full flex-col gap-2 p-4">
      <Box name="<App />" className="flex flex-1 flex-col gap-2">
        <Box name="<Router path='/projects/:id' />" className="flex flex-1 gap-2">
          <Box name="<Sidebar />" className="w-1/4" />
          <Box name="<ProjectsPage />" className="flex flex-1 flex-col gap-1.5">
            <Box name="<ProjectList />" className="flex-1" />
            <Box name="<ProjectDetail />" className="flex-1" />
          </Box>
        </Box>
      </Box>
      <p className={cn(mono, 'text-foreground/55')}>useProjects() · estado · rutas</p>
    </div>
  );
}

const ENDPOINTS = [
  ['GET', '/api/projects'],
  ['GET', '/api/projects/:id', true],
  ['POST', '/api/projects'],
  ['PATCH', '/api/projects/:id'],
];

// API: los endpoints REST; el de la demo se marca mientras viaja la petición.
export function ApiLayer() {
  return (
    <div className="flex h-full flex-col justify-center gap-1.5 px-6">
      {ENDPOINTS.map(([method, path, active]) => (
        <p
          key={method + path}
          className={cn(
            mono,
            'grid grid-cols-[44px_1fr] rounded px-2 py-1 text-foreground/60 transition-colors duration-500',
            active &&
              'group-data-[phase=request]/stack:bg-foreground group-data-[phase=request]/stack:text-background group-data-[phase=response]/stack:bg-foreground group-data-[phase=response]/stack:text-background'
          )}
        >
          <span>{method}</span>
          <span>{path}</span>
        </p>
      ))}
      <p className={cn(mono, 'mt-1 px-2 text-foreground/45')}>application/json</p>
    </div>
  );
}

const PIPELINE = ['request', 'auth', 'validate', 'controller', 'service', 'response'];
const RESPONSIBILITIES = [
  ['Autenticación', 'bottom-[calc(100%+10px)] left-4'],
  ['Lógica de negocio', 'bottom-[calc(100%+10px)] right-4'],
  ['Validación', 'top-[calc(100%+10px)] left-4'],
  ['Servicios', 'top-[calc(100%+10px)] right-4'],
];

// BACKEND: Express. El recorrido de una petición por los middlewares y las responsabilidades de la
// capa como palabras alrededor.
export function BackendLayer() {
  return (
    <div className="flex h-full flex-col justify-center gap-3 px-5">
      <div className="flex flex-wrap items-center gap-1">
        {PIPELINE.map((step, i) => (
          <span key={step} className="flex items-center gap-1">
            <span
              className={cn(
                mono,
                'rounded px-1.5 py-0.5 text-foreground/65 ring-1 ring-black/12 transition-colors duration-500 group-data-[phase=backend]/stack:bg-foreground/90 group-data-[phase=backend]/stack:text-background'
              )}
            >
              {step}
            </span>
            {i < PIPELINE.length - 1 && <span className="text-foreground/30">→</span>}
          </span>
        ))}
      </div>
      <p className={cn(mono, 'text-foreground/55')}>
        router.get(&apos;/projects/:id&apos;, auth, validate, getProject)
      </p>
      {RESPONSIBILITIES.map(([word, position]) => (
        <span
          key={word}
          className={cn(
            'absolute text-[9px] tracking-[0.22em] text-foreground/45 uppercase',
            position
          )}
        >
          {word}
        </span>
      ))}
    </div>
  );
}

const DOCUMENTS = [
  { id: 21, name: 'Northwind Portal', status: 'active' },
  { id: 24, name: 'Harbor Retail', status: 'active', target: true },
  { id: 27, name: 'Atlas CRM', status: 'draft' },
];

// DATA: la colección y algunos registros abstractos; el de la demo se marca al consultarlo.
export function DataLayer() {
  return (
    <div className="flex h-full flex-col justify-center gap-1.5 px-6">
      <p className={cn(mono, 'mb-1 text-foreground/55')}>db.projects</p>
      {DOCUMENTS.map(document => (
        <p
          key={document.id}
          className={cn(
            mono,
            'rounded px-2 py-1 text-foreground/55 ring-1 ring-black/8 transition-colors duration-500',
            document.target &&
              'group-data-[phase=data]/stack:bg-foreground group-data-[phase=data]/stack:text-background'
          )}
        >
          {`{ id: ${document.id}, name: "${document.name}", status: "${document.status}" }`}
        </p>
      ))}
    </div>
  );
}
