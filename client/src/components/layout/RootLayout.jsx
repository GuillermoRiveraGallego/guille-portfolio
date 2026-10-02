import { Outlet } from 'react-router-dom';

import Navbar from '@/components/layout/Navbar';

function RootLayout() {
  return (
    <div className="relative min-h-svh">
      <Navbar />
      <main>
        <Outlet />
      </main>
    </div>
  );
}

export default RootLayout;
