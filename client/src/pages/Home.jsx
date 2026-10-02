import { Bounds, Center, OrbitControls } from '@react-three/drei';

import SceneCanvas from '@/three/canvas/SceneCanvas';
import GradientBackground from '@/three/lighting/GradientBackground';
import StudioEnvironment from '@/three/lighting/StudioEnvironment';
import FlorInteractiva from '@/three/models/FlorInteractiva';

function Home() {
  return (
    <section className="relative h-svh w-full">
      <SceneCanvas>
        <GradientBackground />
        <StudioEnvironment />

        <Bounds fit clip observe margin={1.2}>
          <Center>
            <FlorInteractiva />
          </Center>
        </Bounds>

        {/* La cabeza sigue al puntero: la cámara se queda por delante para que el gesto se lea bien */}
        <OrbitControls
          makeDefault
          enablePan={false}
          minAzimuthAngle={-Math.PI / 3}
          maxAzimuthAngle={Math.PI / 3}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={(Math.PI * 3) / 4}
        />
      </SceneCanvas>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between px-6 pb-10 md:px-10">
        <p className="text-sm text-muted-foreground">Portfolio</p>
        <p className="text-xs text-muted-foreground">
          Pasa por los pétalos · clic para abrir o cerrar
        </p>
      </div>
    </section>
  );
}

export default Home;
