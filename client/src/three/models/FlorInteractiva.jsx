import { useEffect, useMemo, useState } from 'react';
import { useCursor, useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';

import { MODELS } from '@/config/models';
import { PETAL_SECTIONS } from '@/config/petals';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { AirTracker } from '@/three/interaction/AirTracker';
import { FlowerRig } from '@/three/models/flor/FlowerRig';

const headScreen = new Vector3();

// El GLB no trae animaciones: está montado con pivotes en la base de cada pieza
// (Cabeza_Flor, Petalo_N, Estambre_NN). Toda la animación vive en FlowerRig / PetalController;
// este componente solo conecta el rig con React (eventos y frame loop).
// `onPetalHover(section | null)` avisa de qué sección (config/petals.js) está bajo el puntero.
// `onPetalSelect(section)` queda preparado para cuando cada pétalo lleve a su sección.
function FlorInteractiva({ onPetalHover, onPetalSelect, ...props }) {
  const { scene } = useGLTF(MODELS.florInteractiva);
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const [hoveredPetal, setHoveredPetal] = useState(null);

  useCursor(hoveredPetal !== null);

  // Se clona dentro del rig para que cada montaje parta de las transformaciones originales.
  const rig = useMemo(() => new FlowerRig(scene), [scene]);
  const airTracker = useMemo(() => new AirTracker(), []);

  useEffect(() => {
    rig.setHoveredPetal(hoveredPetal);
  }, [rig, hoveredPetal]);

  useFrame(({ clock, pointer, camera, size }, delta) => {
    // Posición de la cabeza en pantalla: el aire solo se mueve cerca de la flor.
    rig.head.getWorldPosition(headScreen).project(camera);
    const air = airTracker.update(pointer, headScreen, size.width / size.height, delta);

    rig.update(delta, clock.elapsedTime, air, !reducedMotion);
  });

  const handlePointerOver = event => {
    event.stopPropagation();
    const section = PETAL_SECTIONS[event.object.name];
    if (!section) return;
    setHoveredPetal(event.object.name);
    onPetalHover?.(section);
  };

  const handlePointerOut = event => {
    if (event.object.name !== hoveredPetal) return;
    setHoveredPetal(null);
    onPetalHover?.(null);
  };

  const handleClick = event => {
    const section = PETAL_SECTIONS[event.object.name];
    // Si el puntero se ha movido es que se estaba orbitando la cámara, no haciendo clic.
    if (!section || !onPetalSelect || event.delta > 4) return;
    event.stopPropagation();
    // Aquí empezará la animación de clic: rig.getPetal(name) da el PetalController de ese pétalo.
    onPetalSelect(section);
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
