import { useGLTF } from '@react-three/drei';

import { MODELS } from '@/config/models';

// Usa los materiales del propio GLB (texturas, sheen, specular...).
function FlorNatural(props) {
  const { scene } = useGLTF(MODELS.florNatural);

  return <primitive object={scene} {...props} />;
}

useGLTF.preload(MODELS.florNatural);

export default FlorNatural;
