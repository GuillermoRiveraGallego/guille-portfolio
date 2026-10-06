import { useRef } from 'react';

import Chapter from '@/components/three-d/Chapter';
import ScrollSteps from '@/components/three-d/ScrollSteps';
import SectionNav from '@/components/three-d/SectionNav';
import StackStage from '@/components/web/StackStage';
import { useStackTimeline } from '@/components/web/useStackTimeline';
import { SECTIONS } from '@/config/sections';
import { WEB_BACKGROUND, WEB_CHAPTERS } from '@/config/webStack';
import { useMediaQuery } from '@/hooks/useMediaQuery';

// Sección Web (prototipo): una aplicación que se abre en capas con el scroll para enseñar que
// detrás de la interfaz hay frontend, API, backend y datos, y se vuelve a cerrar al final.
// Igual que /3d: el escenario es fijo (sticky) y los capítulos pasan por encima; todo depende de
// la posición del scroll, así que es reversible. Ver config/webStack.js.
function WebStack() {
  const mobile = !useMediaQuery('(min-width: 768px)');
  const motion = !useMediaQuery('(prefers-reduced-motion: reduce)');
  const stage = useRef(null);

  useStackTimeline(stage, motion);

  return (
    <div className="relative" style={{ backgroundColor: WEB_BACKGROUND.bottom }}>
      {/* Escenario: a la derecha del texto en desktop, en la mitad de abajo en móvil */}
      <div
        className="sticky top-0 h-lvh w-full overflow-hidden"
        style={{ background: `linear-gradient(${WEB_BACKGROUND.top}, ${WEB_BACKGROUND.bottom})` }}
      >
        <div className="absolute inset-x-0 top-[50%] bottom-0 md:inset-y-0 md:right-0 md:left-[40%]">
          <StackStage stageRef={stage} mobile={mobile} />
        </div>
      </div>

      <div className="pointer-events-none relative -mt-[100lvh]">
        {WEB_CHAPTERS.map(chapter => (
          <Chapter key={chapter.id} chapter={chapter}>
            {chapter.steps && <ScrollSteps steps={chapter.steps} checklist compact={mobile} />}
            {chapter.work && (
              <ul className="mt-10 space-y-3 text-[1.4rem] tracking-[-0.02em] text-foreground/40 md:text-[2rem]">
                {chapter.work.map(name => (
                  <li key={name} className="border-t border-foreground/15 pt-3">
                    {name}
                  </li>
                ))}
              </ul>
            )}
            {chapter.nav && <SectionNav next={SECTIONS.threeD} />}
          </Chapter>
        ))}
      </div>
    </div>
  );
}

export default WebStack;
