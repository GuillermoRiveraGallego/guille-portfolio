import { useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

// Un capítulo de la narrativa: ocupa una pantalla y aparece (opacidad + 20 px) cuando está en el
// centro. `onActive(id)` avisa del capítulo visible; `hidden` lo oculta mientras se inspecciona
// una pieza. El contenido va a la izquierda en desktop y arriba en móvil, fuera de la moto.
function Chapter({ chapter, onActive, hidden, children }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting);
        if (entry.isIntersecting) onActive?.(chapter.id);
      },
      // Activo cuando cruza la franja central de la pantalla.
      { rootMargin: '-45% 0px -45% 0px' }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [chapter.id, onActive]);

  const show = visible && !hidden;

  return (
    <section
      ref={ref}
      className="flex h-svh items-start px-6 pt-28 md:items-center md:px-[11vw] md:pt-0"
    >
      <div
        className={cn(
          'max-w-sm transition-[opacity,translate] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:translate-y-0',
          show ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'
        )}
      >
        {(chapter.kicker || chapter.label) && (
          <p className="text-[0.65rem] tracking-[0.22em] text-foreground/55 uppercase tabular-nums">
            {chapter.kicker ?? [chapter.number, chapter.label].filter(Boolean).join(' — ')}
          </p>
        )}
        {chapter.title && (
          <h2 className="mt-5 text-[2.3rem] leading-[1.02] font-normal tracking-[-0.035em] md:text-[clamp(2.8rem,4.4vw,4.3rem)]">
            {chapter.title.map(line => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h2>
        )}
        {chapter.line && (
          <p className="mt-5 text-[0.95rem] leading-[1.7] text-foreground/65">{chapter.line}</p>
        )}
        {children}
      </div>
    </section>
  );
}

export default Chapter;
