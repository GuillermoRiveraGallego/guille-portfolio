import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { ACESFilmicToneMapping } from 'three';

import { cn } from '@/lib/utils';
import CanvasLoader from '@/three/canvas/CanvasLoader';

// Canvas base de todas las escenas: fija renderer, cámara y Suspense para que cada página
// solo tenga que declarar su contenido 3D.
function SceneCanvas({ children, className, camera, dpr = [1, 2] }) {
  return (
    <div className={cn('relative h-full w-full', className)}>
      <Canvas
        dpr={dpr}
        camera={{ position: [0, 0, 1], fov: 35, near: 0.01, far: 100, ...camera }}
        gl={{ antialias: true, toneMapping: ACESFilmicToneMapping }}
      >
        <Suspense fallback={null}>{children}</Suspense>
      </Canvas>
      <CanvasLoader />
    </div>
  );
}

export default SceneCanvas;
