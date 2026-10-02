import RootLayout from '@/components/layout/RootLayout';
import NotFound from '@/pages/NotFound';
import { PATHS } from '@/router/paths';

// Las páginas se cargan en diferido: three.js solo se descarga al visitar una página 3D.
const lazyPage = importPage => async () => {
  const { default: Component } = await importPage();
  return { Component };
};

export const routes = [
  {
    path: PATHS.home,
    element: <RootLayout />,
    errorElement: <NotFound />,
    children: [
      { index: true, lazy: lazyPage(() => import('@/pages/Home')) },
      { path: PATHS.about, lazy: lazyPage(() => import('@/pages/About')) },
      { path: '*', element: <NotFound /> },
    ],
  },
];
