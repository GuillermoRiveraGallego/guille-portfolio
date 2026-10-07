import { Link } from 'react-router-dom';

import { SECTIONS } from '@/config/sections';
import { PATHS } from '@/router/paths';

// Salida de la sección: siguiente sección del portfolio (o cualquier destino con `path` y `title`)
// o vuelta a la flor.
function SectionNav({ next = SECTIONS.ai }) {
  return (
    <nav className="pointer-events-auto mt-12 flex flex-col gap-4 text-[0.65rem] tracking-[0.22em] uppercase md:gap-5 md:text-[0.82rem]">
      <Link to={next.path} className="text-foreground transition-opacity hover:opacity-60">
        Siguiente — {[next.number, next.title].filter(Boolean).join(' ')} →
      </Link>
      <Link to={PATHS.home} className="text-foreground/55 transition-colors hover:text-foreground">
        ← Volver a la flor
      </Link>
    </nav>
  );
}

export default SectionNav;
