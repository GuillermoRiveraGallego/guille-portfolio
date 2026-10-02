import { useEffect, useMemo } from 'react';
import { CanvasTexture, SRGBColorSpace } from 'three';

// Fondo degradado vertical como scene.background. Va dentro de la escena (no en CSS)
// para que el cristal lo refracte a través de transmission.
function GradientBackground({ top = '#a9adb8', bottom = '#e3e5ea' }) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 512;

    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, top);
    gradient.addColorStop(1, bottom);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const tex = new CanvasTexture(canvas);
    tex.colorSpace = SRGBColorSpace;
    return tex;
  }, [top, bottom]);

  useEffect(() => () => texture.dispose(), [texture]);

  return <primitive attach="background" object={texture} />;
}

export default GradientBackground;
