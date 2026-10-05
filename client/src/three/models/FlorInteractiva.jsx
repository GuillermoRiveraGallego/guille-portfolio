import { useEffect, useMemo, useRef, useState } from 'react';
import { useCursor, useGLTF } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';

import { DEBUG_PETALS } from '@/config/debug';
import { MODELS } from '@/config/models';
import { PETAL_SECTIONS } from '@/config/petals';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { AirTracker } from '@/three/interaction/AirTracker';
import { FlowerRig } from '@/three/models/flor/FlowerRig';
import { PetalTransitionController } from '@/three/models/flor/PetalTransitionController';
import { PetalTransitionDebug } from '@/three/models/flor/PetalTransitionDebug';

const headScreen = new Vector3();

// Cuándo medir cómo se solapan los pétalos (ver petalLayering): cuesta unos ms por pétalo, así
// que se hace en ratos libres del navegador después de montar, no al hacer clic.
const LAYERING_DELAY = 800;
const whenIdle = callback =>
  window.requestIdleCallback
    ? window.requestIdleCallback(callback, { timeout: 1000 })
    : window.setTimeout(callback, 16);
const cancelIdle = id =>
  window.cancelIdleCallback ? window.cancelIdleCallback(id) : window.clearTimeout(id);

// El GLB no trae animaciones: está montado con pivotes en la base de cada pieza
// (Cabeza_Flor, Petalo_N, Estambre_NN). Toda la animación vive en FlowerRig / PetalController;
// este componente solo conecta el rig con React (eventos y frame loop).
// `onPetalHover(section | null)` avisa de qué sección (config/petals.js) está bajo el puntero.
// `onPetalStart(section)`: clic en un pétalo, empieza la transición (se despega, sale y cae).
// `safeArea`: zona libre de la pantalla en NDC por la que puede caer el pétalo (sin texto).
// `onPetalSelect(section, mask)`: el pétalo cubre la cámara; es el momento de cambiar de ruta.
// `mask.canvas` es el canvas con ese frame ya pintado (null con reduced motion) y `mask.blur`
// el desenfoque que lleva aplicado.
function FlorInteractiva({ onPetalHover, onPetalStart, onPetalSelect, safeArea, ...props }) {
  const { scene } = useGLTF(MODELS.florInteractiva);
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const camera = useThree(state => state.camera);
  const gl = useThree(state => state.gl);
  const r3fScene = useThree(state => state.scene);
  const [hoveredPetal, setHoveredPetal] = useState(null);

  useCursor(hoveredPetal !== null);

  // Se clona dentro del rig para que cada montaje parta de las transformaciones originales.
  const rig = useMemo(() => new FlowerRig(scene), [scene]);
  const airTracker = useMemo(() => new AirTracker(), []);
  const transition = useMemo(() => new PetalTransitionController(rig), [rig]);

  useEffect(() => {
    rig.setHoveredPetal(hoveredPetal);
  }, [rig, hoveredPetal]);

  useEffect(() => () => transition.dispose(), [transition]);

  useEffect(() => {
    if (!transition.busy) transition.configure({ camera, safeArea });
  }, [transition, camera, safeArea]);

  useEffect(() => {
    let pending = [...rig.petals];
    let idleId = null;
    const next = () => {
      const petal = pending.shift();
      if (!petal) return;
      rig.analyzeLayering(petal.name);
      idleId = whenIdle(next);
    };
    const timeout = window.setTimeout(() => (idleId = whenIdle(next)), LAYERING_DELAY);
    return () => {
      pending = [];
      window.clearTimeout(timeout);
      if (idleId !== null) cancelIdle(idleId);
    };
  }, [rig]);

  const debugRef = useRef(null);
  useEffect(() => {
    if (!DEBUG_PETALS) return;
    const debug = new PetalTransitionDebug(r3fScene, rig, transition);
    debugRef.current = debug;
    return () => {
      debug.dispose();
      debugRef.current = null;
    };
  }, [r3fScene, rig, transition]);

  useFrame(({ clock, pointer, size, scene }, delta) => {
    // Posición de la cabeza en pantalla: el aire solo se mueve cerca de la flor.
    rig.head.getWorldPosition(headScreen).project(camera);
    const air = airTracker.update(pointer, headScreen, size.width / size.height, delta);

    rig.update(delta, clock.elapsedTime, air, !reducedMotion);
    transition.update(delta);
    debugRef.current?.update();

    if (transition.takeCover()) {
      // Se pinta ya este frame para que el canvas tenga exactamente el pétalo tapando la cámara.
      if (transition.motion) gl.render(scene, camera);
      onPetalSelect(transition.section, {
        canvas: transition.motion ? gl.domElement : null,
        blur: transition.blur,
      });
    }
  });

  // Durante la transición se ignora el puntero: el título se queda con la sección elegida.
  const handlePointerOver = event => {
    event.stopPropagation();
    const section = PETAL_SECTIONS[event.object.name];
    if (!section || transition.busy) return;
    setHoveredPetal(event.object.name);
    transition.setHovered(true);
    onPetalHover?.(section);
  };

  const handlePointerOut = event => {
    if (event.object.name !== hoveredPetal || transition.busy) return;
    setHoveredPetal(null);
    transition.setHovered(false);
    onPetalHover?.(null);
  };

  const handleClick = event => {
    const section = PETAL_SECTIONS[event.object.name];
    // Si el puntero se ha movido es un arrastre, no un clic.
    if (!section || !onPetalSelect || transition.busy || event.delta > 4) return;
    event.stopPropagation();
    const started = transition.start(rig.getPetal(event.object.name), section, {
      camera,
      motion: !reducedMotion,
      canvas: isDesktop ? gl.domElement : null,
      safeArea,
    });
    if (!started) return;
    // En táctil no hay hover: el título también tiene que mostrar la sección pulsada.
    onPetalHover?.(section);
    onPetalStart?.(section);
  };

  return (
    <primitive
      object={rig.root}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
      {...props}
    />
  );
}

useGLTF.preload(MODELS.florInteractiva);

export default FlorInteractiva;
