import { Environment, Lightformer } from '@react-three/drei';

// Entorno de estudio generado en local con Lightformers (sin descargar HDRIs).
// Los materiales de cristal (transmission) dependen de él para tener reflejos.
function StudioEnvironment() {
  return (
    <Environment resolution={256}>
      <Lightformer form="rect" intensity={3} position={[0, 5, -2]} scale={[10, 3, 1]} />
      <Lightformer
        form="rect"
        intensity={2}
        position={[-5, 1, 1]}
        rotation-y={Math.PI / 2}
        scale={[8, 2, 1]}
      />
      <Lightformer
        form="rect"
        intensity={2}
        position={[5, 1, 1]}
        rotation-y={-Math.PI / 2}
        scale={[8, 2, 1]}
      />
      <Lightformer form="ring" intensity={1.5} position={[0, 0, 5]} scale={3} />
    </Environment>
  );
}

export default StudioEnvironment;
