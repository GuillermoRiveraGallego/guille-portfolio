import { useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

// Un capítulo de la narrativa: número, título, una idea y una línea de tecnologías. Ocupa
// `chapter.screens` pantallas de scroll; mientras dura, el texto se queda fijo (sticky) y la moto
// cambia detrás. Aparece (opacidad + 20 px) cuando cruza el centro de la pantalla; `onActive(id)`
// avisa del capítulo visible y `hidden` lo oculta mientras se inspecciona una pieza. El contenido
// va a la izquierda en desktop y arriba en móvil, fuera de la moto.
function Chapter({ chapter, onActive, hidden, children }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const screens = chapter.screens ?? 1;

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting);
        if (entry.isIntersecting) onActive?.(chapter.id);
      },
      // Activo mientras alguna parte del capítulo ocupa la franja central de la pantalla.
      { rootMargin: '-45% 0px -45% 0px' }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [chapter.id, onActive]);

  const show = visible && !hidden;

  return (
    <section ref={ref} style={{ height: `${screens * 100}svh` }}>
      <div className="sticky top-0 flex h-svh items-start px-6 pt-28 md:items-center md:px-[11vw] md:pt-0">
        <div
          className={cn(
            'max-w-sm transition-[opacity,translate] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:translate-y-0 md:max-w-md',
            show ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'
          )}
        >
          {(chapter.kicker || chapter.label) && (
            <p className="text-[0.65rem] tracking-[0.22em] text-foreground/60 uppercase tabular-nums md:text-[0.8rem]">
              {chapter.kicker ?? [chapter.number, chapter.label].filter(Boolean).join(' — ')}
            </p>
          )}
          {chapter.title && (
            <h2 className="mt-5 text-[2.3rem] leading-[1.02] font-normal tracking-[-0.035em] md:text-[clamp(3.4rem,5.4vw,5.4rem)]">
              {chapter.title.map(line => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </h2>
          )}
          {chapter.line && (
            <p className="mt-5 text-[0.95rem] leading-[1.7] text-foreground/70 md:mt-7 md:text-[1.2rem]">
              {chapter.line}
            </p>
          )}
          {chapter.meta && (
            <p className="mt-4 text-[0.68rem] tracking-[0.16em] text-foreground/55 uppercase md:mt-5 md:text-[0.8rem]">
              {chapter.meta}
            </p>
          )}
          {children}
        </div>
      </div>
    </section>
  );
}

export default Chapter;
