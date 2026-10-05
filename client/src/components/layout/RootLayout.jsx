import { Outlet } from 'react-router-dom';

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
    </PetalTransitionProvider>
  );
}

export default RootLayout;
