import { useEffect, useRef } from 'react';

import Reveal from '@/components/about/Reveal';

// Recorrido: una línea fina que se dibuja con el scroll (reversible) y los hitos que aparecen al
// pasar. El progreso se escribe como variable CSS (--progress) en requestAnimationFrame, sin
// estado de React.
function Timeline({ items }) {
  const ref = useRef(null);

  useEffect(() => {
    const element = ref.current;
    let frame = null;
    const update = () => {
      frame = null;
      const rect = element.getBoundingClientRect();
      // 0 cuando el inicio de la lista llega al 70% de la pantalla, 1 cuando el final pasa por él.
      const anchor = window.innerHeight * 0.7;
      const progress = Math.min(1, Math.max(0, (anchor - rect.top) / rect.height));
      element.style.setProperty('--progress', progress.toFixed(4));
    };
    const onScroll = () => {
      if (frame === null) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <ol ref={ref} className="relative pl-8 md:pl-14" style={{ '--progress': 0 }}>
      {/* Guía tenue y la línea que se dibuja encima */}
      <span aria-hidden className="absolute top-2 bottom-2 left-0 w-px bg-foreground/10" />
      <span
        aria-hidden
        className="absolute top-2 bottom-2 left-0 w-px origin-top bg-foreground/70 motion-reduce:transform-none!"
        style={{ transform: 'scaleY(var(--progress))' }}
      />

      {items.map(item => (
        <Reveal
          as="li"
          key={item.period + item.place}
          className="relative pb-16 last:pb-0 md:pb-24"
        >
          <span
            aria-hidden
            className="absolute top-[0.55em] -left-8 size-[7px] -translate-x-[3px] rounded-full bg-foreground md:-left-14"
          />
          <p className="text-[0.65rem] tracking-[0.22em] text-foreground/55 uppercase tabular-nums md:text-[0.8rem]">
            {item.period}
          </p>
          <h3 className="mt-3 text-[1.7rem] leading-tight font-normal tracking-[-0.03em] md:text-[2.6rem]">
            {item.place}
          </h3>
          <p className="mt-3 max-w-md text-[0.95rem] leading-[1.7] text-foreground/65 md:text-[1.1rem]">
            {item.text}
          </p>
        </Reveal>
      ))}
    </ol>
  );
}

export default Timeline;
