import { useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';

import { PetalTransitionContext } from '@/components/transition/petalTransitionContext';
import { TransitionVeil } from '@/components/transition/TransitionVeil';

// Vive en el layout raíz para sobrevivir al cambio de ruta: la escena 3D se desmonta, pero el
// pétalo que tapa la cámara tiene que seguir hasta que aparece la nueva sección.
// Va por debajo de la navbar (z-10), que se mantiene fija entre páginas.
function PetalTransitionProvider({ children }) {
  const { pathname } = useLocation();
  const layerRef = useRef(null);
  const canvasRef = useRef(null);
  const veilRef = useRef(null);

  useEffect(() => {
    const veil = new TransitionVeil(layerRef.current, canvasRef.current);
    veilRef.current = veil;
    return () => veil.dispose();
  }, []);

  useEffect(() => {
    veilRef.current?.reveal();
  }, [pathname]);

  const value = useMemo(
    () => ({ cover: mask => veilRef.current?.cover(mask) ?? Promise.resolve() }),
    []
  );

  return (
    <PetalTransitionContext.Provider value={value}>
      {children}
      <div
        ref={layerRef}
        aria-hidden
        className="pointer-events-none invisible fixed inset-0 z-9 will-change-transform"
      >
        <canvas ref={canvasRef} className="block h-full w-full" />
      </div>
    </PetalTransitionContext.Provider>
  );
}

export default PetalTransitionProvider;
