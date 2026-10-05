import { useEffect, useRef } from 'react';

// Nombre de la pieza bajo el cursor. Sigue al puntero escribiendo estilos directamente (sin
// estado de React por cada movimiento). `labelRef` lo usa la página para cambiar el texto.
function HoverLabel({ labelRef }) {
  const container = useRef(null);

  useEffect(() => {
    const onMove = event => {
      container.current.style.transform = `translate(${event.clientX + 18}px, ${event.clientY + 14}px)`;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  return (
    <div ref={container} className="pointer-events-none fixed top-0 left-0 z-9" aria-hidden>
      <span
        ref={labelRef}
        className="block text-[0.62rem] tracking-[0.22em] whitespace-nowrap text-foreground/70 uppercase opacity-0 transition-opacity duration-300"
      />
    </div>
  );
}

export default HoverLabel;
