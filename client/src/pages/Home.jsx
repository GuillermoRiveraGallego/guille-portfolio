import { useState } from 'react';
import { Bounds, Center } from '@react-three/drei';

import HeroIntro from '@/components/hero/HeroIntro';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import SceneCanvas from '@/three/canvas/SceneCanvas';
import ViewOffset from '@/three/canvas/ViewOffset';
import DriftingPetal from '@/three/effects/DriftingPetal';
import Pollen from '@/three/effects/Pollen';
import GradientBackground from '@/three/lighting/GradientBackground';
import LightDrift from '@/three/lighting/LightDrift';
import StudioEnvironment from '@/three/lighting/StudioEnvironment';
import FlorInteractiva from '@/three/models/FlorInteractiva';

// Encuadre y calidad por dispositivo. `offset`: desplazamiento de la flor respecto al centro de la
// pantalla (desktop: ~67% del ancho, composición 40 / 60). `margin`: holgura de Bounds; en móvil es
// menor porque en pantallas estrechas Bounds la encogería mucho (el tallo sale por abajo).
// En móvil se limita el DPR, hay menos polen y no aparece el pétalo suelto.
const LAYOUT = {
  desktop: { offset: { x: 0.17, y: 0.2 }, margin: 0.8, dpr: [1, 2], pollen: 18, petal: true },
  mobile: { offset: { x: 0, y: 0.33 }, margin: 0.6, dpr: [1, 1.5], pollen: 10, petal: false },
};

// Giro fijo de la flor (rad): la gira hacia un lado para que se vea de tres cuartos y no de frente.
const FLOWER_ROTATION = [0.12, -0.6, 0];

function Home() {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const [activeSection, setActiveSection] = useState(null);
  const layout = isDesktop ? LAYOUT.desktop : LAYOUT.mobile;

  return (
    <section className="relative h-svh w-full overflow-hidden">
      <SceneCanvas dpr={layout.dpr}>
        <GradientBackground />
        <StudioEnvironment />
        <ViewOffset {...layout.offset} />

        {/* key: al cambiar de layout se vuelve a montar para reencuadrar con el nuevo margen */}
        <Bounds key={isDesktop ? 'desktop' : 'mobile'} fit clip observe margin={layout.margin}>
          <Center>
            <group rotation={FLOWER_ROTATION}>
              <FlorInteractiva onPetalHover={setActiveSection} />
            </group>
          </Center>
        </Bounds>

        {/* Atmósfera: fuera de Bounds para no alterar el encuadre de la flor */}
        <Pollen count={layout.pollen} animated={!reducedMotion} />
        {layout.petal && !reducedMotion && <DriftingPetal />}
        {!reducedMotion && <LightDrift />}
      </SceneCanvas>

      <div className="pointer-events-none absolute inset-0 flex items-start px-6 pt-24 md:items-center md:pt-0 md:pl-[11vw]">
        <HeroIntro activeSection={activeSection} />
      </div>
    </section>
  );
}

export default Home;
