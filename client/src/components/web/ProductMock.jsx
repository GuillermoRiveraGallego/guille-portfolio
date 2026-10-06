import { cn } from '@/lib/utils';

// Aplicación ficticia de la demo: un gestor de proyectos sencillo. Es la capa PRODUCT, lo que ve
// el usuario. Reacciona a la petición de la demo con CSS, leyendo los atributos que escribe el
// controlador en el escenario (group/stack): data-loading (el botón espera la respuesta) y
// data-opened (llegó la respuesta y se abre la ficha del proyecto 24).
const PROJECTS = [
  { id: 21, name: 'Northwind Portal', status: 'Activo', progress: 72 },
  { id: 22, name: 'Lumen Analytics', status: 'Revisión', progress: 40 },
  { id: 24, name: 'Harbor Retail', status: 'Activo', progress: 58, target: true },
  { id: 27, name: 'Atlas CRM', status: 'Borrador', progress: 15 },
];

function ProductMock() {
  return (
    <div className="flex h-full w-full overflow-hidden rounded-[10px] bg-white text-[9px] text-neutral-800 shadow-[0_30px_60px_-30px_rgb(15_20_30/0.35)] ring-1 ring-black/5">
      <aside className="flex w-[88px] shrink-0 flex-col gap-2.5 border-r border-black/5 bg-neutral-50 px-3 py-3.5">
        <span className="text-[10px] font-semibold tracking-tight">Atlas</span>
        <nav className="mt-2 flex flex-col gap-1.5 text-neutral-500">
          <span className="font-medium text-neutral-900">Proyectos</span>
          <span>Tareas</span>
          <span>Equipo</span>
          <span>Informes</span>
        </nav>
      </aside>

      <main className="relative flex-1 px-4 py-3.5">
        <header className="flex items-center justify-between">
          <h3 className="text-[12px] font-medium tracking-tight">Proyectos</h3>
          <span className="h-4 w-20 rounded-full bg-neutral-100" />
        </header>

        <ul className="mt-3 divide-y divide-black/5">
          {PROJECTS.map(project => (
            <li
              key={project.id}
              className={cn(
                'grid grid-cols-[1fr_auto_44px_auto] items-center gap-2.5 py-2',
                project.target && '-mx-1.5 rounded-md bg-neutral-50 px-1.5'
              )}
            >
              <span className="truncate">
                <span className="text-neutral-400 tabular-nums">#{project.id}</span> {project.name}
              </span>
              <span className="rounded-full bg-neutral-100 px-1.5 py-px text-[8px] text-neutral-500">
                {project.status}
              </span>
              <span className="h-[3px] rounded-full bg-neutral-100">
                <span
                  className="block h-full rounded-full bg-neutral-800"
                  style={{ width: `${project.progress}%` }}
                />
              </span>
              {project.target ? (
                <span className="relative rounded bg-neutral-900 px-1.5 py-0.5 text-[8px] text-white transition-colors duration-300 group-data-[loading=true]/stack:bg-neutral-500">
                  <span className="group-data-[loading=true]/stack:invisible">Abrir proyecto</span>
                  <span className="invisible absolute inset-0 grid place-items-center group-data-[loading=true]/stack:visible">
                    Cargando…
                  </span>
                </span>
              ) : (
                <span className="w-[58px]" />
              )}
            </li>
          ))}
        </ul>

        {/* Ficha del proyecto: llega con la respuesta de la API */}
        <section className="absolute inset-y-0 right-0 w-[48%] translate-x-full border-l border-black/5 bg-white px-3.5 py-3.5 opacity-0 transition-[translate,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-data-[opened=true]/stack:translate-x-0 group-data-[opened=true]/stack:opacity-100">
          <p className="text-neutral-400 tabular-nums">#24</p>
          <h4 className="mt-0.5 text-[12px] font-medium tracking-tight">Harbor Retail</h4>
          <p className="mt-2 inline-block rounded-full bg-neutral-100 px-1.5 py-px text-[8px] text-neutral-500">
            Activo
          </p>
          <dl className="mt-3 grid grid-cols-2 gap-y-1.5 text-neutral-500">
            <dt>Tareas</dt>
            <dd className="text-right text-neutral-800 tabular-nums">12</dd>
            <dt>Miembros</dt>
            <dd className="text-right text-neutral-800 tabular-nums">4</dd>
            <dt>Progreso</dt>
            <dd className="text-right text-neutral-800 tabular-nums">58%</dd>
          </dl>
          <span className="mt-3 block h-[3px] rounded-full bg-neutral-100">
            <span className="block h-full w-[58%] rounded-full bg-neutral-800" />
          </span>
        </section>
      </main>
    </div>
  );
}

export default ProductMock;
