import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { PATHS } from '@/router/paths';

function NotFound() {
  return (
    <section className="flex min-h-svh flex-col items-center justify-center gap-4 p-10">
      <h1 className="text-3xl font-bold">404 - Página no encontrada</h1>
      <Button render={<Link to={PATHS.home} />} nativeButton={false} variant="outline">
        Volver al inicio
      </Button>
    </section>
  );
}

export default NotFound;
