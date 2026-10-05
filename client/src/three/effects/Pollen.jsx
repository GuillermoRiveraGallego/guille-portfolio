import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { BufferAttribute, BufferGeometry, Vector3 } from 'three';

// Volumen alrededor de la flor (que está centrada en el origen), en unidades del modelo.
// En z va desde delante de la flor (cerca de cámara) hasta bastante detrás.
const VOLUME = { x: [-0.24, 0.2], y: [-0.15, 0.15], z: [-0.32, 0.2] };

// Tamaño de la mota en unidades del mundo y opacidad máxima. Si se ven, bajar OPACITY.
const SIZE = 0.0011;
const OPACITY = 0.32;

// Distancia (unidades) a partir del plano de la flor en la que una mota queda totalmente
// desenfocada.
const FOCUS_RANGE = 0.18;

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uPixelScale;
  uniform float uFocus;
  uniform float uFocusRange;
  uniform float uSize;
  uniform vec3 uMin;
  uniform vec3 uMax;

  attribute vec3 aSeed;

  varying float vBlur;
  varying float vFade;

  void main() {
    vec3 range = uMax - uMin;

    // Deriva muy lenta (casi siempre ligeramente hacia arriba, como polvo en aire templado)
    // más dos ondulaciones por eje con frecuencias distintas para que la trayectoria sea irregular.
    vec3 drift = vec3(0.0016, 0.0024, 0.0008) * (aSeed - 0.35) * uTime;
    vec3 wobble = vec3(
      sin(uTime * (0.11 + aSeed.x * 0.07) + aSeed.y * 6.28) + 0.5 * sin(uTime * 0.23 + aSeed.z * 9.0),
      sin(uTime * (0.09 + aSeed.y * 0.06) + aSeed.z * 6.28) + 0.5 * sin(uTime * 0.19 + aSeed.x * 7.0),
      sin(uTime * (0.07 + aSeed.z * 0.05) + aSeed.x * 6.28)
    ) * 0.006;

    // Se envuelve dentro del volumen; vFade lo oculta cerca de los bordes para que no aparezca de golpe.
    vec3 p = uMin + mod(position - uMin + drift, range) + wobble;
    vec3 edge = min(p - uMin, uMax - p) / range;
    vFade = smoothstep(0.0, 0.12, min(min(edge.x, edge.y), edge.z));

    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    float depth = -mvPosition.z;

    // Desenfoque según la distancia al plano de la flor: las cercanas crecen y se difuminan.
    vBlur = clamp(abs(depth - uFocus) / uFocusRange, 0.0, 1.0);

    gl_PointSize = uSize * (1.0 + vBlur * 2.5) * uPixelScale / depth;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uOpacity;

  varying float vBlur;
  varying float vFade;

  void main() {
    float r = length(gl_PointCoord - 0.5) * 2.0;
    // Enfocada: disco con borde suave. Desenfocada: mancha gaussiana más tenue (la luz se reparte).
    float softness = mix(0.45, 1.0, vBlur);
    float disc = 1.0 - smoothstep(1.0 - softness, 1.0, r);
    float alpha = disc * uOpacity * mix(1.0, 0.3, vBlur) * vFade;
    if (alpha < 0.002) discard;
    gl_FragColor = vec4(1.0, 0.98, 0.94, alpha);
  }
`;

function createGeometry(count) {
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    positions[i * 3] = VOLUME.x[0] + Math.random() * (VOLUME.x[1] - VOLUME.x[0]);
    positions[i * 3 + 1] = VOLUME.y[0] + Math.random() * (VOLUME.y[1] - VOLUME.y[0]);
    positions[i * 3 + 2] = VOLUME.z[0] + Math.random() * (VOLUME.z[1] - VOLUME.z[0]);
    seeds[i * 3] = Math.random();
    seeds[i * 3 + 1] = Math.random();
    seeds[i * 3 + 2] = Math.random();
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  geometry.setAttribute('aSeed', new BufferAttribute(seeds, 3));
  return geometry;
}

// Polvo / polen suspendido. Un único Points: todo el movimiento ocurre en el shader, la CPU
// solo actualiza tres uniforms por frame. `animated = false` (reduced motion) las deja quietas.
function Pollen({ count = 18, animated = true }) {
  const material = useRef();
  const geometry = useMemo(() => createGeometry(count), [count]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPixelScale: { value: 1 },
      uFocus: { value: 0.3 },
      uFocusRange: { value: FOCUS_RANGE },
      uSize: { value: SIZE },
      uOpacity: { value: OPACITY },
      uMin: { value: new Vector3(VOLUME.x[0], VOLUME.y[0], VOLUME.z[0]) },
      uMax: { value: new Vector3(VOLUME.x[1], VOLUME.y[1], VOLUME.z[1]) },
    }),
    []
  );

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame(({ clock, camera, size, viewport }) => {
    const u = material.current?.uniforms;
    if (!u) return;
    if (animated) u.uTime.value = clock.elapsedTime;
    // Píxeles por unidad a distancia 1: depende del alto del canvas, el DPR y el FOV.
    u.uPixelScale.value =
      (size.height * viewport.dpr) / (2 * Math.tan((camera.fov * Math.PI) / 360));
    // El plano de enfoque es la flor (origen).
    u.uFocus.value = camera.position.length();
  });

  return (
    <points geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={material}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </points>
  );
}

export default Pollen;
