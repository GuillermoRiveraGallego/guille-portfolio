import SwapText from '@/components/hero/SwapText';

// Bloque de texto del hero. La segunda línea del título muestra la sección del pétalo bajo el
// puntero y vuelve a "Rivera." al salir.
function HeroIntro({ activeSection }) {
  return (
    <div className="max-w-md">
      <h1 className="text-[2.5rem] leading-[1.02] font-normal tracking-[-0.035em] md:text-[clamp(3rem,4.6vw,4.5rem)]">
        <span className="block">Guillermo</span>
        <span className="block">
          <SwapText text={`${activeSection?.label ?? 'Rivera'}.`} />
        </span>
      </h1>

      <p className="mt-5 text-[0.95rem] leading-[1.75] text-foreground/65 md:mt-10">
        Desarrollo experiencias digitales
        <br />
        entre código, diseño y 3D.
      </p>

      <div className="mt-8 text-foreground/55 md:mt-24">
        <p className="text-[0.65rem] tracking-[0.22em] tabular-nums">01 — EXPLORA</p>
        <p className="mt-3 text-[0.8rem] leading-relaxed">Toca un pétalo para descubrir</p>
        <span aria-hidden className="mt-3 block text-[0.8rem]">
          ↓
        </span>
      </div>
    </div>
  );
}

export default HeroIntro;
