import Chapter from '@/components/three-d/Chapter';
import ScrollSteps from '@/components/three-d/ScrollSteps';
import SectionNav from '@/components/three-d/SectionNav';
import { usePageTheme } from '@/hooks/usePageTheme';

// Estructura común de las secciones contadas con el scroll (como /3d y /web): un escenario fijo
// (sticky) a la derecha del texto en desktop y en la mitad de abajo en móvil, y los capítulos
// pasando por encima. Cada capítulo puede llevar `steps` (ScrollSteps), `nav` (salida a `next`) y
// contenido propio con `renderExtra(chapter)`.
function ScrollStory({ background, dark, chapters, next, compact, stage, renderExtra }) {
  usePageTheme(background.bottom, dark);

  return (
    <div className="relative" style={{ backgroundColor: background.bottom }}>
      <div
        className="sticky top-0 h-lvh w-full overflow-hidden"
        style={{ background: `linear-gradient(${background.top}, ${background.bottom})` }}
      >
        <div className="absolute inset-x-0 top-[46%] bottom-0 md:inset-y-0 md:right-0 md:left-[40%]">
          {stage}
        </div>
      </div>

      <div className="pointer-events-none relative -mt-[100lvh]">
        {chapters.map((chapter, index) => (
          <Chapter key={chapter.id} chapter={chapter}>
            {index === 0 && (
              <p className="mt-7 text-[0.62rem] tracking-[0.22em] text-foreground/55 uppercase md:text-[0.78rem]">
                Desliza ↓
              </p>
            )}
            {chapter.steps && (
              <ScrollSteps steps={chapter.steps} checklist={chapter.checklist} compact={compact} />
            )}
            {renderExtra?.(chapter)}
            {chapter.nav && <SectionNav next={next} />}
          </Chapter>
        ))}
      </div>
    </div>
  );
}

export default ScrollStory;
