import { useGLTF } from '@react-three/drei';

import { MODELS } from '@/config/models';

// Usa los materiales del propio GLB (KHR_materials_transmission, volume, dispersion...).
function FlorCristal(props) {
  const { scene } = useGLTF(MODELS.florCristal);

  return <primitive object={scene} {...props} />;
}

useGLTF.preload(MODELS.florCristal);

export default FlorCristal;
