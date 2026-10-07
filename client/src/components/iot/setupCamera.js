import { IOT_FIT, IOT_SHOTS } from '@/config/iot';
import { evaluateKeys } from '@/three/utils/timeline';

// Planos de la cámara como curvas sobre la línea de tiempo (un plano por pantalla).
const CAMERA_Y = IOT_SHOTS.map((shot, i) => [i, shot.y]);
const CAMERA_S = IOT_SHOTS.map((shot, i) => [i, shot.s]);

// Cámara: encuadre y zoom según el scroll. Si el escenario no tiene el hueco que necesita el plano
// más cercano (móvil, pantallas bajas) se reduce todo en proporción.
export function setupCamera(root) {
  let viewport = '';
  let fit = 1;
  return t => {
    const size = `${window.innerWidth}x${window.innerHeight}`;
    if (size !== viewport) {
      viewport = size;
      fit = Math.min(1, root.clientWidth / IOT_FIT.width, root.clientHeight / IOT_FIT.height);
    }
    root.style.setProperty('--cam-y', evaluateKeys(CAMERA_Y, t).toFixed(1));
    root.style.setProperty('--cam-s', (evaluateKeys(CAMERA_S, t) * fit).toFixed(4));
  };
}
