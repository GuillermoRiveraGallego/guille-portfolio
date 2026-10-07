import { Outlet, ScrollRestoration } from 'react-router-dom';

import Navbar from '@/components/layout/Navbar';
import PetalTransitionProvider from '@/components/transition/PetalTransitionProvider';

function RootLayout() {
  return (
    <PetalTransitionProvider>
      <div className="relative min-h-svh">
        <Navbar />
        <main>
          <Outlet />
        </main>
      </div>
      {/* Cada página nueva empieza arriba (las secciones son largas y se cuentan con el scroll);
          al volver atrás o adelante se recupera la posición en la que estaba. */}
      <ScrollRestoration />
    </PetalTransitionProvider>
  );
}

export default RootLayout;
