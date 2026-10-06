import { useEffect, useRef } from 'react';

import { cn } from '@/lib/utils';

// Aparece (opacidad + 20 px) la primera vez que entra en pantalla. Escribe data-visible en el DOM:
// sin estado de React. Con reduced motion se ve directamente.
function Reveal({ as: Tag = 'div', className, delay = 0, children }) {
  const ref = useRef(null);

  useEffect(() => {
    const element = ref.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        element.dataset.visible = 'true';
        observer.disconnect();
      },
      { rootMargin: '0px 0px -12% 0px' }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      data-visible="false"
      style={{ transitionDelay: `${delay}ms` }}
      className={cn(
        'translate-y-5 opacity-0 transition-[opacity,translate] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] data-[visible=true]:translate-y-0 data-[visible=true]:opacity-100 motion-reduce:translate-y-0 motion-reduce:opacity-100',
        className
      )}
    >
      {children}
    </Tag>
  );
}

export default Reveal;
