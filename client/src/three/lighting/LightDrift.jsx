import { useFrame } from '@react-three/fiber';

import { fbm1D } from '@/three/utils/noise';

// Variación de la luz como nubes pasando por delante de una ventana: ±3% en ciclos de ~15-30 s.
// Si llega a notarse como pulsación, bajar AMOUNT.
const AMOUNT = 0.03;
const SPEED = 1 / 22;

// Modula scene.environmentIntensity (la única fuente de luz de la escena). Es un uniform: no
// cuesta nada y no regenera el entorno. El fondo no se ve afectado.
function LightDrift({ base = 1 }) {
  useFrame(({ scene, clock }) => {
    scene.environmentIntensity = base * (1 + fbm1D(clock.elapsedTime * SPEED, 3.3, 2) * AMOUNT);
  });

  return null;
}

export default LightDrift;
