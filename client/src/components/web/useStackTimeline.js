import { useEffect } from 'react';

import { REQUEST_PHASES, STACK_TIMELINE } from '@/config/webStack';
import { damp, evaluateKeys } from '@/three/utils/timeline';

// Lo que tarda en alcanzar al scroll (amortiguación): suave pero sin quedarse atrás.
const SCROLL_LAMBDA = 6;
const EPSILON = 0.0005;

// Controlador de scroll de la sección Web. Lee el scroll y escribe en `rootRef` variables CSS que
// mueven las capas (sin estado de React por frame):
// --tilt (0..1), --r1..--r4 (separación de frontend, api, backend, data), --packet (posición de
// la petición, 0 = UI … 4 = DATA) y --packet-on; además data-phase con la fase de la petición
// (ver REQUEST_PHASES), que cambia la UI con CSS. Con `motion` false no amortigua: cada posición
// de scroll es un estado estático.
export function useStackTimeline(rootRef, motion) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const layers = Object.values(STACK_TIMELINE.reveal);
    let current = window.scrollY / window.innerHeight;
    let target = current;
    let last = performance.now();
    let frame = null;
    let phase = null;

    const write = t => {
      root.style.setProperty('--tilt', evaluateKeys(STACK_TIMELINE.tilt, t).toFixed(4));
      layers.forEach((keys, i) => {
        root.style.setProperty(`--r${i + 1}`, evaluateKeys(keys, t).toFixed(4));
      });

      // Petición: baja de la UI (0) a DATA (4) en la primera mitad y vuelve en la segunda.
      const request = evaluateKeys(STACK_TIMELINE.request, t);
      const packet = request < 0.5 ? (request / 0.5) * 4 : (1 - (request - 0.5) / 0.5) * 4;
      root.style.setProperty('--packet', packet.toFixed(4));
      root.style.setProperty('--packet-on', request > 0.005 && request < 0.995 ? '1' : '0');

      const next = REQUEST_PHASES.find(entry => request < entry.until).phase;
      if (next !== phase) {
        phase = next;
        root.dataset.phase = phase;
        // Atajos para la UI: el botón espera la respuesta / el proyecto ya está abierto.
        root.dataset.loading = String(phase !== 'idle' && phase !== 'done');
        root.dataset.opened = String(phase === 'done');
      }
    };

    const tick = now => {
      frame = null;
      const dt = Math.min((now - last) / 1000, 1 / 20);
      last = now;
      current = motion ? damp(current, target, SCROLL_LAMBDA, dt) : target;
      if (Math.abs(current - target) < EPSILON) current = target;
      write(current);
      if (current !== target) frame = requestAnimationFrame(tick);
    };

    const onScroll = () => {
      target = window.scrollY / window.innerHeight;
      if (frame === null) {
        last = performance.now();
        frame = requestAnimationFrame(tick);
      }
    };

    write(current);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, [rootRef, motion]);
}
