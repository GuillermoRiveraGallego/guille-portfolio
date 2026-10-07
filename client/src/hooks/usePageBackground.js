import { useEffect } from 'react';

// Fondo del documento mientras la página está montada: al rebotar el scroll (móvil, Mac) no asoma
// el blanco del body.
export function usePageBackground(background) {
  useEffect(() => {
    const targets = [document.documentElement, document.body];
    const previous = targets.map(element => element.style.backgroundColor);
    for (const element of targets) element.style.backgroundColor = background;
    return () => {
      targets.forEach((element, i) => (element.style.backgroundColor = previous[i]));
    };
  }, [background]);
}
