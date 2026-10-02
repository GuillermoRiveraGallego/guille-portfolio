import { useMemo, useState } from 'react';
import { useCursor, useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { Euler, Quaternion } from 'three';

import { MODELS } from '@/config/models';

// Ángulos en radianes sobre el eje Y local de cada pétalo (+ abre hacia fuera, - cierra hacia el centro).
const PETAL_CLOSED = -1.15;
const PETAL_HOVER = 0.35;
const PETAL_BREATH = 0.03;

// Cuánto gira la cabeza siguiendo al puntero.
const HEAD_FOLLOW = { x: 0.35, y: 0.5 };

// Velocidad de amortiguado: más alto = responde antes.
const DAMPING = 6;

const tmpEuler = new Euler();
const tmpQuat = new Quaternion();

// Rotación final = rotación original del GLB * desplazamiento local (x, y, z).
function targetFromBase(base, x, y, z) {
  return tmpQuat.setFromEuler(tmpEuler.set(x, y, z)).premultiply(base);
}

// El GLB no trae animaciones: está montado con pivotes en la base de cada pieza
// (Cabeza_Flor, Petalo_N, Estambre_NN) para animarlo desde código.
function FlorInteractiva(props) {
  const { scene } = useGLTF(MODELS.florInteractiva);
  const [isOpen, setIsOpen] = useState(true);
  const [hoveredPetal, setHoveredPetal] = useState(null);

  useCursor(hoveredPetal !== null);

  // Se clona para que cada montaje parta de las rotaciones originales y no de las ya animadas.
  const rig = useMemo(() => {
    const root = scene.clone(true);
    const withBase = node => ({ node, base: node.quaternion.clone() });

    return {
      root,
      head: withBase(root.getObjectByName('Cabeza_Flor')),
      petals: Array.from({ length: 5 }, (_, i) =>
        withBase(root.getObjectByName(`Petalo_${i + 1}`))
      ),
      stamens: Array.from({ length: 10 }, (_, i) =>
        withBase(root.getObjectByName(`Estambre_${String(i + 1).padStart(2, '0')}`))
      ),
    };
  }, [scene]);

  useFrame(({ clock, pointer }, delta) => {
    const t = clock.elapsedTime;
    const k = 1 - Math.exp(-DAMPING * delta);

    const { head, petals, stamens } = rig;

    head.node.quaternion.slerp(
      targetFromBase(
        head.base,
        -pointer.y * HEAD_FOLLOW.x,
        pointer.x * HEAD_FOLLOW.y,
        Math.sin(t * 0.6) * 0.04
      ),
      k
    );

    petals.forEach(({ node, base }, i) => {
      const open = isOpen ? 0 : PETAL_CLOSED;
      const hover = isOpen && hoveredPetal === node.name ? PETAL_HOVER : 0;
      const breath = Math.sin(t * 1.2 + i * 1.3) * PETAL_BREATH;
      node.quaternion.slerp(targetFromBase(base, 0, open + hover + breath, 0), k);
    });

    stamens.forEach(({ node, base }, i) => {
      const wobble = Math.sin(t * 2.2 + i) * 0.05;
      node.quaternion.slerp(targetFromBase(base, wobble, wobble * 0.6, 0), k);
    });
  });

  const handlePointerOver = event => {
    event.stopPropagation();
    if (event.object.name.startsWith('Petalo_')) setHoveredPetal(event.object.name);
  };

  const handlePointerOut = event => {
    if (event.object.name === hoveredPetal) setHoveredPetal(null);
  };

  const handleClick = event => {
    event.stopPropagation();
    // Si el puntero se ha movido es que se estaba orbitando la cámara, no haciendo clic.
    if (event.delta > 4) return;
    setIsOpen(open => !open);
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
