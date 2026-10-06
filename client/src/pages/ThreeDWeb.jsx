import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import Chapter from '@/components/three-d/Chapter';
import ChapterData from '@/components/three-d/ChapterData';
import HoverLabel from '@/components/three-d/HoverLabel';
import PartInspector from '@/components/three-d/PartInspector';
import ScrollSteps from '@/components/three-d/ScrollSteps';
import SectionNav from '@/components/three-d/SectionNav';
import StatsPanel from '@/components/three-d/StatsPanel';
import TechnicalControl from '@/components/three-d/TechnicalControl';
import { MODELS } from '@/config/models';
import { BACKGROUND, CASE_STUDY_URL, CHAPTERS, TECHNICAL_CONTROL } from '@/config/threeDWeb';
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
  mobile: { offset: { x: 0, y: 0.2 }, dpr: [1, 1.5] },
};
const CAMERA = { fov: 30, near: 2, far: 6000, position: [0, 80, 600] };

// Sección 3D Web: el pipeline completo (Create → Optimize → Web → Interact) contado con la moto.
// La moto va en un canvas fijo y la narrativa por encima; el scroll mueve la línea de tiempo
// (vista técnica, luz, cámara, despiece) y todo es reversible. Ver config/threeDWeb.js.
function ThreeDWeb() {
  const mobile = !useMediaQuery('(min-width: 768px)');
  const motion = !useMediaQuery('(prefers-reduced-motion: reduce)');
  const layout = mobile ? LAYOUT.mobile : LAYOUT.desktop;

  const store = useMemo(() => new ExperienceStore(), []);
  const [stats, setStats] = useState(null);
  const [fileSize, setFileSize] = useState(null);
  const [readyIn, setReadyIn] = useState(null);
  const [technicalVisible, setTechnicalVisible] = useState(false);
  const [selected, setSelected] = useState(null);
  const [focused, setFocused] = useState(false);
  const mountedAt = useRef(0);
  const hoverLabel = useRef(null);
  const statsPanel = useRef(null);

  useEffect(() => {
    mountedAt.current = performance.now();
    fetchFileSize(MODELS.motorcycle).then(setFileSize);
  }, []);

  // Fondo de la página del mismo gris que el final de la escena: al rebotar el scroll (móvil, Mac)
  // asomaría el blanco del body como una franja por debajo de la moto.
  useEffect(() => {
    const targets = [document.documentElement, document.body];
    const previous = targets.map(element => element.style.backgroundColor);
    for (const element of targets) element.style.backgroundColor = BACKGROUND.bottom;
    return () => targets.forEach((element, i) => (element.style.backgroundColor = previous[i]));
  }, []);

  // Scroll → línea de tiempo (pantallas recorridas). La escena la amortigua.
  useEffect(() => {
    const onScroll = () => {
      const t = window.scrollY / window.innerHeight;
      store.setTimeline(t);
      // Solo re-renderiza al cruzar el tramo (React ignora el mismo valor).
      setTechnicalVisible(t >= TECHNICAL_CONTROL[0] && t <= TECHNICAL_CONTROL[1]);
    };
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
    for (const node of statsPanel.current?.querySelectorAll('[data-metric]') ?? []) {
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
    <div className="relative" style={{ backgroundColor: BACKGROUND.bottom }}>
      {/* El canvas ocupa el alto máximo de la pantalla (lvh): en móvil, al esconderse la barra del
          navegador, no queda una franja por debajo. Detrás lleva el mismo degradado que la escena
          (visible mientras carga), así un redondeo de medio píxel tampoco se nota. */}
      <div
        className="sticky top-0 h-lvh w-full"
        style={{ background: `linear-gradient(${BACKGROUND.top}, ${BACKGROUND.bottom})` }}
      >
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

      {/* Narrativa: capítulos encima del canvas, sin bloquear el arrastre */}
      <div className="pointer-events-none relative -mt-[100lvh]">
        {CHAPTERS.map((chapter, index) => (
          <Chapter key={chapter.id} chapter={chapter} hidden={Boolean(selected)}>
            {index === 0 && (
              <p className="mt-7 text-[0.62rem] tracking-[0.22em] text-foreground/55 uppercase md:text-[0.78rem]">
                Desliza ↓
              </p>
            )}
            {chapter.steps && <ScrollSteps steps={chapter.steps} checklist={chapter.checklist} />}
            <ChapterData type={chapter.facts} stats={stats} fileSize={fileSize} mobile={mobile} />
            {chapter.caseStudy && (
              <a
                href={CASE_STUDY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="pointer-events-auto mt-6 inline-block text-[0.62rem] tracking-[0.22em] text-foreground uppercase transition-opacity hover:opacity-60 md:text-[0.78rem]"
              >
                Leer el caso real ↗
              </a>
            )}
            {chapter.nav && <SectionNav />}
          </Chapter>
        ))}
      </div>

      <TechnicalControl store={store} visible={technicalVisible && !selected} />
      <StatsPanel
        stats={stats}
        fileSize={fileSize}
        readyIn={readyIn}
        panelRef={statsPanel}
        hidden={Boolean(selected)}
      />
      {!mobile && <HoverLabel labelRef={hoverLabel} />}
      <PartInspector part={selected} focused={focused} onFocus={handleFocus} onBack={handleBack} />
    </div>
  );
}

export default ThreeDWeb;
