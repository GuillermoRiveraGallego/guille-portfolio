import { NavLink } from 'react-router-dom';

import { cn } from '@/lib/utils';
import { NAV_LINKS } from '@/router/navigation';

function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-10 flex items-center justify-end px-6 py-5 md:px-10">
      <nav className="flex gap-6">
        {NAV_LINKS.map(({ label, to }) => (
          <NavLink
            key={to}
            to={to}
            end
            className={({ isActive }) =>
              cn(
                'text-sm text-muted-foreground transition-colors hover:text-foreground',
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
