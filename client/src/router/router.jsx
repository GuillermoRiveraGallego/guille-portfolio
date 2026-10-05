import { createBrowserRouter } from 'react-router-dom';

import { routes } from '@/router/routes';

// La app vive bajo la base de Vite (/guille-portfolio/ en GitHub Pages): las rutas de PATHS son
// relativas a ella.
export const router = createBrowserRouter(routes, { basename: import.meta.env.BASE_URL });
