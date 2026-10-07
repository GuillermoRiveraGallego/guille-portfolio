import { useEffect } from 'react';

// Fondo del documento (y modo oscuro) mientras la página está montada. El fondo evita que al
// rebotar el scroll (móvil, Mac) asome el blanco del body; `dark` activa los tokens de .dark en
// toda la app, también en la barra de navegación, que queda fuera de la página.
export function usePageTheme(background, dark = false) {
  useEffect(() => {
    const { documentElement: html, body } = document;
    const targets = [html, body];
    const previous = targets.map(element => element.style.backgroundColor);
    const wasDark = html.classList.contains('dark');
    for (const element of targets) element.style.backgroundColor = background;
    html.classList.toggle('dark', dark);
    return () => {
      targets.forEach((element, i) => (element.style.backgroundColor = previous[i]));
      html.classList.toggle('dark', wasDark);
    };
  }, [background, dark]);
}
