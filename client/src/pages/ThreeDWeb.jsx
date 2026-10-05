import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import Chapter from '@/components/three-d/Chapter';
import ChapterData from '@/components/three-d/ChapterData';
import HoverLabel from '@/components/three-d/HoverLabel';
import PartInspector from '@/components/three-d/PartInspector';
import SectionNav from '@/components/three-d/SectionNav';
import TechnicalControl from '@/components/three-d/TechnicalControl';
import { MODELS } from '@/config/models';
import { BACKGROUND, CHAPTERS, TECHNICAL_CHAPTERS } from '@/config/threeDWeb';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { formatCount } from '@/lib/format';
import SceneCanvas from '@/three/canvas/SceneCanvas';
import ViewOffset from '@/three/canvas/ViewOffset';
import { ExperienceStore } from '@/three/motorcycle/ExperienceStore';
import { fetchFileSize } from '@/three/motorcycle/modelStats';
import MotorcycleScene from '@/three/motorcycle/MotorcycleScene';

// Composición por dispositivo: en desktop la moto a la derecha del texto; en móvil debajo.
// La cámara (fov, near/far en cm) la dirige CameraDirector.
const LAYOUT = {
  desktop: { offset: { x: 0.15, y: 0.02 }, dpr: [1, 1.75] },
  mobile: { offset: { x: 0, y: 0.17 }, dpr: [1, 1.5] },
};
const CAMERA = { fov: 30, near: 2, far: 6000, position: [0, 80, 600] };

// Sección 3D Web: la moto en un canvas fijo y la narrativa por encima, una pantalla por capítulo.
// El scroll mueve la línea de tiempo (despiece, cámara, modo técnico) y es reversible.
function ThreeDWeb() {
  const mobile = !useMediaQuery('(min-width: 768px)');
  const motion = !useMediaQuery('(prefers-reduced-motion: reduce)');
  const layout = mobile ? LAYOUT.mobile : LAYOUT.desktop;

  const store = useMemo(() => new ExperienceStore(), []);
  const [stats, setStats] = useState(null);
  const [fileSize, setFileSize] = useState(null);
  const [readyIn, setReadyIn] = useState(null);
  const [activeChapter, setActiveChapter] = useState(CHAPTERS[0].id);
  const [selected, setSelected] = useState(null);
  const [focused, setFocused] = useState(false);
  const mountedAt = useRef(0);
  const hoverLabel = useRef(null);
  const metricsRoot = useRef(null);

  useEffect(() => {
    mountedAt.current = performance.now();
    fetchFileSize(MODELS.motorcycle).then(setFileSize);
  }, []);

  // Scroll → línea de tiempo (pantallas recorridas). La escena la amortigua.
  useEffect(() => {
    const onScroll = () => store.setTimeline(window.scrollY / window.innerHeight);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [store]);

  const handleReady = useCallback(modelStats => {
    setStats(modelStats);
    setReadyIn(Math.round(performance.now() - mountedAt.current));
  }, []);

  const handleHover = useCallback(part => {
    const label = hoverLabel.current;
    if (!label) return;
    if (part) label.textContent = part.label;
    label.style.opacity = part ? '1' : '0';
  }, []);

  const handleSelect = useCallback(
    part => {
      store.select(part, false);
      setSelected(part);
      setFocused(false);
      handleHover(null);
    },
    [store, handleHover]
  );

  const handleFocus = useCallback(() => {
    store.select(store.selected, true);
    setFocused(true);
  }, [store]);

  const handleBack = useCallback(() => {
    store.select(null);
    setSelected(null);
    setFocused(false);
  }, [store]);

  // Métricas del renderer: se escriben en el DOM directamente, sin re-renderizar la página.
  const handleMetrics = useCallback(({ fps, calls, triangles, geometries, textures }) => {
    const values = {
      fps: `${fps} fps`,
      calls,
      triangles: formatCount(triangles),
      memory: `${geometries} · ${textures}`,
    };
    for (const node of metricsRoot.current?.querySelectorAll('[data-metric]') ?? []) {
      node.textContent = values[node.dataset.metric];
    }
  }, []);

  // Inspeccionando: el scroll se bloquea (el despiece se queda donde estaba) y Esc vuelve.
  useEffect(() => {
    if (!selected) return;
    const { documentElement } = document;
    const previous = documentElement.style.overflow;
    documentElement.style.overflow = 'hidden';
    const onKey = event => event.key === 'Escape' && handleBack();
    window.addEventListener('keydown', onKey);
    return () => {
      documentElement.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [selected, handleBack]);

  return (
    <div
      className="relative"
      style={{ background: `linear-gradient(${BACKGROUND.top}, ${BACKGROUND.bottom}) fixed` }}
    >
      <div className="sticky top-0 h-svh w-full">
        <SceneCanvas dpr={layout.dpr} camera={CAMERA}>
          <ViewOffset {...layout.offset} />
          <MotorcycleScene
            store={store}
            mobile={mobile}
            motion={motion}
            onReady={handleReady}
            onHover={handleHover}
            onSelect={handleSelect}
            onMetrics={handleMetrics}
          />
        </SceneCanvas>
      </div>

      {/* Narrativa: una pantalla por capítulo encima del canvas, sin bloquear el arrastre */}
      <div ref={metricsRoot} className="pointer-events-none relative -mt-[100svh]">
        {CHAPTERS.map((chapter, index) => (
          <Chapter
            key={chapter.id}
            chapter={chapter}
            onActive={setActiveChapter}
            hidden={Boolean(selected)}
          >
            {index === 0 && (
              <p className="mt-16 text-[0.62rem] tracking-[0.22em] text-foreground/45 uppercase">
                Scroll ↓
              </p>
            )}
            <ChapterData
              type={chapter.data}
              stats={stats}
              fileSize={fileSize}
              readyIn={readyIn}
              mobile={mobile}
            />
            {chapter.id === 'web' && <SectionNav />}
          </Chapter>
        ))}
      </div>

      <TechnicalControl
        store={store}
        visible={TECHNICAL_CHAPTERS.includes(activeChapter) && !selected}
      />
      {!mobile && <HoverLabel labelRef={hoverLabel} />}
      <PartInspector part={selected} focused={focused} onFocus={handleFocus} onBack={handleBack} />
    </div>
  );
}

export default ThreeDWeb;
