import { Link } from 'react-router-dom';

import Reveal from '@/components/about/Reveal';
import Timeline from '@/components/about/Timeline';
import { ABOUT_INTRO, OFFSCREEN, PRINCIPLES, TIMELINE } from '@/config/about';
import { cn } from '@/lib/utils';
import { PATHS } from '@/router/paths';

const ENTER = 'animate-section-in motion-reduce:animate-none';
const delay = ms => ({ animationDelay: `${ms}ms` });
const kicker =
  'text-[0.65rem] tracking-[0.22em] text-foreground/55 uppercase tabular-nums md:text-[0.8rem]';

// Sobre mí: quién soy y cómo trabajo (las tecnologías ya las cuentan las secciones). Página corta y
// editorial, sin 3D: apertura, recorrido, principios y una nota personal con salida a Contacto.
function About() {
  return (
    <div className="bg-linear-to-b from-[#e4e6eb] via-[#f4f5f7] to-[#f4f5f7] px-6 md:px-[11vw]">
      {/* Apertura */}
      <section className="flex min-h-svh flex-col justify-center pt-28 pb-16">
        <p className={cn(ENTER, kicker)} style={delay(80)}>
          {ABOUT_INTRO.kicker}
        </p>
        <h1
          className={cn(
            ENTER,
            'mt-5 text-[3rem] leading-[0.98] font-normal tracking-[-0.045em] md:text-[clamp(4.5rem,8vw,8rem)]'
          )}
          style={delay(160)}
        >
          {ABOUT_INTRO.title.map(line => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </h1>
        <p
          className={cn(ENTER, 'mt-4 text-[1rem] text-foreground/50 md:text-[1.3rem]')}
          style={delay(240)}
        >
          {ABOUT_INTRO.aside}
        </p>
        <div
          className={cn(
            ENTER,
            'mt-12 max-w-lg space-y-4 text-[0.95rem] leading-[1.75] text-foreground/70 md:mt-16 md:ml-[38%] md:text-[1.15rem]'
          )}
          style={delay(340)}
        >
          {ABOUT_INTRO.lines.map(line => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </section>

      {/* Recorrido */}
      <section className="py-24 md:py-36">
        <Reveal as="p" className={cn(kicker, 'mb-14 md:mb-20')}>
          Recorrido
        </Reveal>
        <Timeline items={TIMELINE} />
      </section>

      {/* Cómo trabajo */}
      <section className="py-24 md:py-36">
        <Reveal as="p" className={cn(kicker, 'mb-10 md:mb-14')}>
          Cómo trabajo
        </Reveal>
        <ol>
          {PRINCIPLES.map((principle, i) => (
            <Reveal
              as="li"
              key={principle}
              delay={i * 60}
              className="flex items-baseline gap-5 border-t border-foreground/15 py-6 md:gap-10 md:py-9"
            >
              <span className="text-[0.65rem] tracking-[0.22em] text-foreground/45 tabular-nums md:text-[0.8rem]">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="text-[1.6rem] leading-tight tracking-[-0.03em] md:text-[clamp(2.2rem,4vw,3.8rem)]">
                {principle}
              </span>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* Fuera de la pantalla + salida */}
      <section className="flex min-h-[80svh] flex-col justify-center pt-16 pb-28 md:pb-36">
        <Reveal as="p" className={kicker}>
          {OFFSCREEN.kicker}
        </Reveal>
        <Reveal
          as="p"
          delay={80}
          className="mt-6 max-w-xl text-[1.3rem] leading-snug tracking-[-0.02em] text-foreground/80 md:text-[2rem]"
        >
          {OFFSCREEN.text}
        </Reveal>
        <Reveal delay={160} className="mt-16 md:mt-24">
          <Link
            to={PATHS.contact}
            className="group inline-flex items-baseline gap-4 text-[2.2rem] tracking-[-0.04em] md:text-[clamp(3rem,6vw,5.5rem)]"
          >
            ¿Hablamos?
            <span className="transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-3">
              →
            </span>
          </Link>
        </Reveal>
      </section>
    </div>
  );
}

export default About;
