import { useProgress } from '@react-three/drei';

// Overlay DOM fuera del <Canvas> (no <Html> de drei): desmontar un <Html> al resolverse el
// Suspense provoca errores de React 19. useProgress funciona fuera del Canvas.
function CanvasLoader() {
  const { active, progress } = useProgress();

  if (!active) return null;

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <span className="text-xs tracking-widest text-muted-foreground tabular-nums">
        {Math.round(progress)}%
      </span>
    </div>
  );
}

export default CanvasLoader;
