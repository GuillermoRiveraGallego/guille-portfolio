import { createContext, useContext } from 'react';

// `cover(mask)` tapa la pantalla con el pétalo (ver TransitionVeil) y devuelve una promesa que se
// resuelve cuando ya se puede cambiar de ruta. La retirada empieza sola al cambiar la URL.
export const PetalTransitionContext = createContext({ cover: () => Promise.resolve() });

export function usePetalTransition() {
  return useContext(PetalTransitionContext);
}
