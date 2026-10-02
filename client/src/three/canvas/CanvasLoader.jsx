import { Html, useProgress } from '@react-three/drei';

function CanvasLoader() {
  const { progress } = useProgress();

  return (
    <Html center>
      <span className="text-xs tracking-widest text-muted-foreground tabular-nums">
        {Math.round(progress)}%
      </span>
    </Html>
  );
}

export default CanvasLoader;
