import { useLayoutEffect } from 'react';
import { useThree } from '@react-three/fiber';

// Desplaza el encuadre de la cámara sin mover la escena ni encoger el canvas: el modelo se ve
// a un lado de la pantalla con el mismo tamaño, y el raycasting sigue funcionando porque el
// desplazamiento va en la matriz de proyección.
// `x` / `y` son fracciones de la pantalla (x > 0 → derecha, y > 0 → abajo).
function ViewOffset({ x = 0, y = 0 }) {
  const camera = useThree(state => state.camera);
  const { width, height } = useThree(state => state.size);

  useLayoutEffect(() => {
    camera.setViewOffset(width, height, -x * width, -y * height, width, height);
    return () => camera.clearViewOffset();
  }, [camera, width, height, x, y]);

  return null;
}

export default ViewOffset;
