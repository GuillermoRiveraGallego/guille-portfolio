import { useEffect, useMemo, useRef } from 'react';
import { ContactShadows, useGLTF } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';

import { MODELS } from '@/config/models';
import { BACKGROUND, TIMELINE } from '@/config/threeDWeb';
import GradientBackground from '@/three/lighting/GradientBackground';
import StudioEnvironment from '@/three/lighting/StudioEnvironment';
import { CameraDirector } from '@/three/motorcycle/CameraDirector';
import { MotorcycleInteraction } from '@/three/motorcycle/MotorcycleInteraction';
import { MotorcycleRig } from '@/three/motorcycle/MotorcycleRig';
import { damp, evaluateKeys } from '@/three/utils/timeline';

// Iluminación de fotografía de producto (unidades del modelo: cm). Key suave desde el lado de la
// cámara, fill muy bajo en el contrario y rim detrás para separar la silueta del fondo. El entorno
// de estudio solo aporta reflejos.
const LIGHTS = {
  environment: 0.55,
  key: { position: [-140, 320, 300], intensity: 2.2 },
  fill: { position: [320, 140, 120], intensity: 0.45 },
  rim: { position: [90, 260, -360], intensity: 2.6 },
  // La luz entra poco a poco al llegar a la sección.
  rampLambda: 1.2,
  // Luz neutra de estudio (CREATE / OPTIMIZE, ver TIMELINE.lighting): las direccionales bajan y
  // el entorno sube, una iluminación plana como la de un visor de modelado.
  neutral: { directional: 0.22, environment: 1.6 },
};

// Rejilla de suelo (cm): muy sutil, solo mientras se "construye" el asset.
const GRID = { size: 440, divisions: 22, color: '#6f747e', opacity: 0.28 };

// Amortiguación del scroll: el desmontaje sigue al scroll sin ser mecánico.
const SCROLL_LAMBDA = { motion: 4, reduced: 30 };
const TECHNICAL_LAMBDA = 3.5;
const METRICS_INTERVAL = 0.5;

const tmpCenter = new Vector3();

// Contenido 3D de la sección: no conoce la interfaz. Lee `store` (estado compartido que escribe
// la página: scroll, control técnico, pieza seleccionada) y avisa con callbacks:
// onReady(stats), onHover(part | null), onSelect(part), onMetrics({ fps, calls, ... }).
function MotorcycleScene({ store, mobile, motion, onReady, onHover, onSelect, onMetrics }) {
  const gltf = useGLTF(MODELS.motorcycle);
  const camera = useThree(state => state.camera);
  const canvas = useThree(state => state.gl.domElement);

  const rig = useMemo(
    () => new MotorcycleRig(gltf, { mobile, motion, haze: BACKGROUND.haze }),
    [gltf, mobile, motion]
  );
  const director = useMemo(
    () =>
      new CameraDirector(camera, {
        center: rig.center,
        radius: rig.sphere.radius,
        motion,
        mobile,
      }),
    [camera, rig, motion, mobile]
  );
  const local = useRef({
    timeline: store.timeline,
    explosion: 0,
    technical: 0,
    light: motion ? 0 : 1,
  });
  const metrics = useRef({ frames: 0, elapsed: 0 });
  const grid = useRef(null);
  const keyLight = useRef(null);
  const fillLight = useRef(null);
  const rimLight = useRef(null);
  const shadow = useRef(null);

  // Callbacks siempre actuales sin volver a crear la interacción.
  const callbacks = useRef({ onHover, onSelect, onMetrics });
  useEffect(() => {
    callbacks.current = { onHover, onSelect, onMetrics };
  });

  useEffect(() => {
    onReady?.(rig.stats);
    return () => rig.dispose();
  }, [rig, onReady]);

  const interactionRef = useRef(null);
  useEffect(() => {
    const interaction = new MotorcycleInteraction({
      rig,
      director,
      camera,
      // Hover y clic en las piezas desde el paso "Raycasting" de WEB hasta el cierre (o si ya hay
      // una pieza abierta).
      isInteractive: () => {
        const [from, to] = TIMELINE.interactive;
        const t = local.current.timeline;
        return (t >= from && t <= to) || Boolean(store.selected);
      },
      onSelect: part => callbacks.current.onSelect?.(part),
    });
    interaction.attach(canvas);
    interactionRef.current = interaction;
    return () => {
      interaction.detach();
      interactionRef.current = null;
    };
  }, [rig, director, camera, store, canvas]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 20);
    const s = local.current;
    const selected = store.selected;

    // Scroll → línea de tiempo → despiece / modo técnico. Con una pieza seleccionada el scroll está
    // bloqueado y el despiece se queda donde estaba.
    s.timeline = damp(
      s.timeline,
      store.timeline,
      motion ? SCROLL_LAMBDA.motion : SCROLL_LAMBDA.reduced,
      dt
    );
    if (!selected) s.explosion = evaluateKeys(TIMELINE.explode, s.timeline);
    const technical = Math.max(store.technical, evaluateKeys(TIMELINE.technical, s.timeline));
    s.technical = damp(s.technical, technical, TECHNICAL_LAMBDA, dt);

    const interaction = interactionRef.current;
    const hovered = interaction?.updateHover();
    if (hovered !== undefined) callbacks.current.onHover?.(hovered);

    rig.setSelected(selected, store.focused);
    rig.update(dt, s.explosion, s.technical);

    const focus =
      selected && store.focused
        ? { center: rig.getPartCenter(selected, tmpCenter), radius: selected.radius }
        : null;
    director.update(dt, s.timeline, focus, interaction?.hasPointer ? interaction.pointer : null);

    // Entrada de la luz y paso de luz neutra (modelado) a luz de producto (WEB).
    s.light = damp(s.light, 1, LIGHTS.rampLambda, dt);
    const studio = evaluateKeys(TIMELINE.lighting, s.timeline);
    const directional =
      s.light * (LIGHTS.neutral.directional + (1 - LIGHTS.neutral.directional) * studio);
    state.scene.environmentIntensity =
      LIGHTS.environment * s.light * (1 + (LIGHTS.neutral.environment - 1) * (1 - studio));
    if (keyLight.current) keyLight.current.intensity = LIGHTS.key.intensity * directional;
    if (fillLight.current) fillLight.current.intensity = LIGHTS.fill.intensity * directional;
    if (rimLight.current) rimLight.current.intensity = LIGHTS.rim.intensity * directional;

    const gridOpacity = evaluateKeys(TIMELINE.grid, s.timeline) * GRID.opacity * s.light;
    if (grid.current) {
      grid.current.material.opacity = gridOpacity;
      grid.current.visible = gridOpacity > 0.002;
    }

    // La sombra es de la moto montada (se pinta solo al principio): se desvanece al desmontarla.
    shadow.current?.traverse(child => {
      if (child.isMesh) child.material.opacity = 0.42 * (1 - s.explosion * 0.8) * s.light;
    });

    // Métricas reales del renderer: lo que se dibujó en el frame anterior.
    const m = metrics.current;
    m.frames++;
    m.elapsed += delta;
    if (m.elapsed >= METRICS_INTERVAL) {
      const { render, memory } = state.gl.info;
      callbacks.current.onMetrics?.({
        fps: Math.round(m.frames / m.elapsed),
        calls: render.calls,
        triangles: render.triangles,
        geometries: memory.geometries,
        textures: memory.textures,
      });
      m.frames = 0;
      m.elapsed = 0;
    }
  });

  return (
    <>
      <GradientBackground top={BACKGROUND.top} bottom={BACKGROUND.bottom} />
      <StudioEnvironment />
      <directionalLight ref={keyLight} position={LIGHTS.key.position} intensity={0} />
      <directionalLight ref={fillLight} position={LIGHTS.fill.position} intensity={0} />
      <directionalLight ref={rimLight} position={LIGHTS.rim.position} intensity={0} />

      <primitive object={rig.root} />
      <gridHelper
        ref={grid}
        args={[GRID.size, GRID.divisions, GRID.color, GRID.color]}
        visible={false}
        material-transparent
        material-depthWrite={false}
        material-opacity={0}
      />

      {/* Sombra de contacto estática (se pinta en los primeros frames); en móvil no hay */}
      {!mobile && (
        <ContactShadows ref={shadow} frames={40} scale={360} far={90} blur={2.6} resolution={512} />
      )}
    </>
  );
}

useGLTF.preload(MODELS.motorcycle);

export default MotorcycleScene;
