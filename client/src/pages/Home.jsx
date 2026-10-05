import { useState } from 'react';
import { Bounds, Center } from '@react-three/drei';
import { useNavigate } from 'react-router-dom';

import HeroIntro from '@/components/hero/HeroIntro';
import { usePetalTransition } from '@/components/transition/petalTransitionContext';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';
import { loadSectionPage } from '@/router/sectionPages';
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
// `petalArea`: zona de la pantalla (NDC, -1..1) por la que cae el pétalo pulsado sin pasar por
// encima del texto del hero (a la izquierda en desktop, arriba en móvil) ni salirse del viewport.
const LAYOUT = {
  desktop: {
    offset: { x: 0.17, y: 0.2 },
    margin: 0.8,
    dpr: [1, 2],
    pollen: 18,
    petal: true,
    petalArea: { left: -0.25, right: 0.85, bottom: -0.72, top: 0.92 },
  },
  mobile: {
    offset: { x: 0, y: 0.33 },
    margin: 0.6,
    dpr: [1, 1.5],
    pollen: 10,
    petal: false,
    petalArea: { left: -0.8, right: 0.8, bottom: -0.78, top: 0 },
  },
};

// Giro fijo de la flor (rad): la gira hacia un lado para que se vea de tres cuartos y no de frente.
const FLOWER_ROTATION = [0.12, -0.6, 0];

// La página de la sección (y su modelo 3D si lo tiene) se descarga en cuanto se pulsa un pétalo:
// cuando el pétalo tapa la cámara (~2 s después) ya está lista y el cambio de ruta es inmediato.

function Home() {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const [activeSection, setActiveSection] = useState(null);
  const [leaving, setLeaving] = useState(false);
  const navigate = useNavigate();
  const { cover } = usePetalTransition();
  const layout = isDesktop ? LAYOUT.desktop : LAYOUT.mobile;

  const handlePetalStart = section => {
    setLeaving(true);
    loadSectionPage(section.id);
  };

  // El pétalo cubre la cámara: la capa de transición toma el relevo y se cambia de ruta detrás.
  const handlePetalSelect = (section, mask) => {
    cover(mask).then(() => navigate(section.path));
  };

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
              <FlorInteractiva
                onPetalHover={setActiveSection}
                onPetalStart={handlePetalStart}
                onPetalSelect={handlePetalSelect}
                safeArea={layout.petalArea}
              />
            </group>
          </Center>
        </Bounds>

        {/* Atmósfera: fuera de Bounds para no alterar el encuadre de la flor */}
        <Pollen count={layout.pollen} animated={!reducedMotion} />
        {layout.petal && !reducedMotion && <DriftingPetal />}
        {!reducedMotion && <LightDrift />}
      </SceneCanvas>

      {/* Al salir, el texto se retira cuando el pétalo empieza a acercarse: pasa por delante */}
      <div
        className={cn(
          'pointer-events-none absolute inset-0 flex items-start px-6 pt-24 transition-opacity md:items-center md:pt-0 md:pl-[11vw]',
          leaving &&
            'opacity-0 delay-1200 duration-500 motion-reduce:delay-0 motion-reduce:duration-150'
        )}
      >
        <HeroIntro activeSection={activeSection} />
      </div>
    </section>
  );
}

export default Home;
