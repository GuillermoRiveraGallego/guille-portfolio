import { useEffect, useRef, useState } from 'react';

import { CONTACT } from '@/config/contact';
import { cn } from '@/lib/utils';

// Entrada escalonada (ms), como en las secciones.
const DELAY = { kicker: 80, title: 160, line: 260, email: 340, links: 420, portrait: 0 };
const ENTER = 'animate-section-in motion-reduce:animate-none';
const delay = ms => ({ animationDelay: `${ms}ms` });

// Cuánto tiempo se muestra "Copiado" tras copiar el email.
const COPIED_MS = 1800;

// Contacto: tipografía protagonista y el retrato como presencia secundaria, a un lado.
function Contact() {
  const [copied, setCopied] = useState(false);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(CONTACT.email);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), COPIED_MS);
    } catch {
      // Sin permiso de portapapeles: el enlace mailto sigue funcionando.
    }
  };

  return (
    <section className="relative isolate flex min-h-svh overflow-hidden bg-linear-to-b from-[#e4e6eb] to-[#f4f5f7]">
      {/* Retrato: en color y nítido, pero secundario. En desktop a la derecha, más pequeño que el
          texto y un poco por detrás de él; en móvil, una miniatura sobre el titular. */}
      <figure
        className={cn(
          ENTER,
          'pointer-events-none absolute -z-10 m-0 select-none',
          'top-24 right-6 w-[34vw] max-w-36',
          'md:top-1/2 md:right-[9vw] md:w-[24vw] md:max-w-[22rem] md:-translate-y-1/2'
        )}
        style={delay(DELAY.portrait)}
      >
        <img
          src={CONTACT.portrait}
          alt="Guillermo Rivera"
          className="aspect-4/5 w-full rounded-[3px] object-cover object-top shadow-[0_40px_80px_-40px_rgb(20_24_32/0.45)] saturate-[0.9]"
        />
        <figcaption className="mt-3 hidden text-[0.7rem] tracking-[0.18em] text-foreground/55 uppercase md:block">
          Guillermo Rivera · Desarrollador
        </figcaption>
      </figure>

      <div className="flex w-full flex-col justify-end px-6 pt-32 pb-16 md:justify-center md:px-[11vw] md:pb-0">
        <p
          className={cn(
            ENTER,
            'text-[0.65rem] tracking-[0.22em] text-foreground/60 uppercase md:text-[0.8rem]'
          )}
          style={delay(DELAY.kicker)}
        >
          Contacto
        </p>

        <h1
          className={cn(
            ENTER,
            'mt-5 text-[3.4rem] leading-[0.95] font-normal tracking-[-0.045em] md:text-[clamp(5rem,9vw,9rem)]'
          )}
          style={delay(DELAY.title)}
        >
          Hablemos.
        </h1>

        <p
          className={cn(
            ENTER,
            'mt-6 max-w-sm text-[0.95rem] leading-[1.7] text-foreground/70 md:mt-8 md:text-[1.2rem]'
          )}
          style={delay(DELAY.line)}
        >
          ¿Tienes un proyecto, una idea o una oportunidad? Escríbeme.
        </p>

        <div
          className={cn(ENTER, 'mt-10 flex flex-wrap items-baseline gap-x-6 gap-y-3 md:mt-14')}
          style={delay(DELAY.email)}
        >
          <a
            href={`mailto:${CONTACT.email}`}
            className="group relative text-[1.05rem] tracking-[-0.02em] break-all md:text-[clamp(1.6rem,2.4vw,2.2rem)] md:break-normal"
          >
            {CONTACT.email}
            <span className="absolute -bottom-1 left-0 h-px w-full origin-left bg-foreground/40 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-x-0" />
            <span className="absolute -bottom-1 left-0 h-px w-full origin-right scale-x-0 bg-foreground transition-transform delay-150 duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:origin-left group-hover:scale-x-100" />
          </a>
          <button
            type="button"
            onClick={copyEmail}
            className="text-[0.62rem] tracking-[0.22em] text-foreground/55 uppercase transition-colors hover:text-foreground md:text-[0.75rem]"
            aria-live="polite"
          >
            {copied ? 'Copiado ✓' : 'Copiar'}
          </button>
        </div>

        <ul
          className={cn(
            ENTER,
            'mt-12 flex gap-8 text-[0.65rem] tracking-[0.22em] uppercase md:mt-16 md:text-[0.8rem]'
          )}
          style={delay(DELAY.links)}
        >
          {CONTACT.links.map(link => (
            <li key={link.label}>
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground/60 transition-colors hover:text-foreground"
              >
                {link.label} ↗
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default Contact;
