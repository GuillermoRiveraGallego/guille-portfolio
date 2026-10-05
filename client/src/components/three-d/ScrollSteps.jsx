import { useEffect, useRef } from 'react';

import { cn } from '@/lib/utils';

// Pasos que avanzan con el scroll (`step.at` en pantallas, la misma línea de tiempo que la
// escena), así que son reversibles. Dos variantes:
// - checklist: ○ → ✓ según se cumplen (WEB: Model, Lighting, Camera...);
// - stages: resalta el paso actual (OPTIMIZE: Geometry → Materials → ...).
// El estado se escribe en atributos del DOM desde el listener de scroll: sin estado de React.
function ScrollSteps({ steps, checklist }) {
  const items = useRef([]);

  useEffect(() => {
    const update = () => {
      const t = window.scrollY / window.innerHeight;
      const current = steps.findLastIndex(step => t >= step.at);
      items.current.forEach((item, i) => {
        if (!item) return;
        item.dataset.state = i < current ? 'done' : i === current ? 'current' : 'pending';
      });
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [steps]);

  return (
    <ol
      className={cn(
        'mt-8 text-[0.62rem] tracking-[0.2em] uppercase tabular-nums md:mt-10 md:text-[0.76rem]',
        checklist ? 'max-w-[15rem] space-y-1 md:max-w-[18rem]' : 'flex flex-wrap gap-x-4 gap-y-1'
      )}
    >
      {steps.map((step, i) => (
        <li
          key={step.label}
          ref={element => {
            items.current[i] = element;
          }}
          data-state="pending"
          className={cn(
            'group transition-colors duration-500',
            checklist
              ? 'flex justify-between border-t border-foreground/15 py-1.5 text-foreground/35 data-[state=current]:text-foreground/85 data-[state=done]:text-foreground/85 md:py-2'
              : 'text-foreground/35 data-[state=current]:text-foreground data-[state=done]:text-foreground/55'
          )}
        >
          <span>{step.label}</span>
          {checklist && (
            <span aria-hidden>
              <span className="group-data-[state=pending]:hidden">✓</span>
              <span className="hidden group-data-[state=pending]:inline">○</span>
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}

export default ScrollSteps;
