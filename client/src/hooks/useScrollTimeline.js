import { useEffect } from 'react';

import { damp } from '@/three/utils/timeline';

// Lo que tarda en alcanzar al scroll (amortiguación): suave pero sin quedarse atrás.
const SCROLL_LAMBDA = 6;
const EPSILON = 0.0005;

const stateAt = (t, at, until) => (t < at ? 'pending' : t < until ? 'current' : 'done');

// Línea de tiempo de scroll para escenarios en CSS (sin Three.js). `t` = pantallas recorridas
// (scrollY / alto), como en /3d y /web, amortiguado salvo con reduced motion.
// - Marcas: todo elemento dentro de `rootRef` con data-at (y opcionalmente data-until) recibe
//   data-state = pending | current | done según `t`. Así la mayoría de cambios son clases de
//   Tailwind (`data-[state=current]:...`) y no hay estado de React por frame.
// - `setup(root)` (opcional, estable: definido fuera del componente) devuelve `write(t)` para lo
//   que se interpola de forma continua (variables CSS, cifras, barras).
export function useScrollTimeline(rootRef, motion, setup) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const write = setup?.(root);
    const marks = [...root.querySelectorAll('[data-at]')].map(element => ({
      element,
      at: Number(element.dataset.at),
      until: element.dataset.until ? Number(element.dataset.until) : Infinity,
      state: null,
    }));

    let current = window.scrollY / window.innerHeight;
    let target = current;
    let last = performance.now();
    let frame = null;

    const apply = t => {
      write?.(t);
      for (const mark of marks) {
        const state = stateAt(t, mark.at, mark.until);
        if (state !== mark.state) {
          mark.state = state;
          mark.element.dataset.state = state;
        }
      }
    };

    const tick = now => {
      frame = null;
      const dt = Math.min((now - last) / 1000, 1 / 20);
      last = now;
      current = motion ? damp(current, target, SCROLL_LAMBDA, dt) : target;
      if (Math.abs(current - target) < EPSILON) current = target;
      apply(current);
      if (current !== target) frame = requestAnimationFrame(tick);
    };

    const onScroll = () => {
      target = window.scrollY / window.innerHeight;
      if (frame === null) {
        last = performance.now();
        frame = requestAnimationFrame(tick);
      }
    };

    apply(current);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, [rootRef, motion, setup]);
}
