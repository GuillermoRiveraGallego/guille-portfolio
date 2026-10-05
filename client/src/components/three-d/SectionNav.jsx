import { Link } from 'react-router-dom';

import { SECTIONS } from '@/config/sections';
import { PATHS } from '@/router/paths';

// Salida de la sección: siguiente sección del portfolio o vuelta a la flor.
function SectionNav() {
  const next = SECTIONS.ai;

  return (
    <nav className="pointer-events-auto mt-12 flex flex-col gap-4 text-[0.65rem] tracking-[0.22em] uppercase">
      <Link to={next.path} className="text-foreground transition-opacity hover:opacity-60">
        Next — {next.number} {next.title} →
      </Link>
      <Link to={PATHS.home} className="text-foreground/55 transition-colors hover:text-foreground">
        ← Back to flower
      </Link>
    </nav>
  );
}

export default SectionNav;
