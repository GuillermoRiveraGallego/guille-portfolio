import { Link, NavLink } from 'react-router-dom';

import { cn } from '@/lib/utils';
import { NAV_LINKS } from '@/router/navigation';
import { PATHS } from '@/router/paths';

function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-10 flex items-center justify-between px-6 py-7 text-[0.7rem] tracking-[0.14em] md:px-[3.5vw]">
      <Link to={PATHS.home} className="text-foreground/80 tabular-nums">
        GR — 2026
      </Link>

      <nav className="flex gap-8 md:gap-12">
        {NAV_LINKS.map(({ label, to }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'text-foreground/55 transition-colors hover:text-foreground',
                isActive && 'text-foreground'
              )
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}

export default Navbar;
