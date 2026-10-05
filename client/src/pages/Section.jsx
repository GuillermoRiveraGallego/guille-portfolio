import { useMatches } from 'react-router-dom';

import { SECTIONS } from '@/config/sections';
import { cn } from '@/lib/utils';

// Entrada escalonada (ms): primero número y título, después el contenido secundario. Están
// pensados para que el contenido suba mientras se retira el pétalo de la transición; si se entra
// directamente por URL aparece con la misma entrada. Con reduced motion no hay animación.
const DELAY = { number: 140, title: 200, tags: 300, body: 400 };
const ENTER = 'animate-section-in motion-reduce:animate-none';
const delay = ms => ({ animationDelay: `${ms}ms` });

// Página común a las secciones de los pétalos. La ruta dice cuál es en `handle.section`.
function Section() {
  const matches = useMatches();
  const section = SECTIONS[matches.at(-1)?.handle?.section];
  if (!section) return null;

  return (
    <section className="flex min-h-svh flex-col justify-center px-6 py-32 md:px-[11vw]">
      <p
        className={cn(ENTER, 'text-[0.65rem] tracking-[0.22em] text-foreground/55 tabular-nums')}
        style={delay(DELAY.number)}
      >
        {section.number}
      </p>
      <h1
        className={cn(
          ENTER,
          'mt-4 text-[2.5rem] leading-[1.02] font-normal tracking-[-0.035em] uppercase md:text-[clamp(3rem,5.5vw,5.5rem)]'
        )}
        style={delay(DELAY.title)}
      >
        {section.title}
      </h1>
      <p className={cn(ENTER, 'mt-6 text-[0.95rem] text-foreground/65')} style={delay(DELAY.tags)}>
        {section.tags.join(' / ')}
      </p>
      <p className={cn(ENTER, 'mt-16 text-[0.8rem] text-foreground/55')} style={delay(DELAY.body)}>
        Próximamente.
      </p>
    </section>
  );
}

export default Section;
