import { useMemo, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';

import { MODELS } from '@/config/models';
import { fbm1D } from '@/three/utils/noise';

// Cada cuánto aparece (s, desde que empezó el anterior) y cuánto tarda en cruzar.
const INTERVAL = [12, 25];
const DURATION = [13, 17];
const FIRST_DELAY = [5, 10];

// Zona de paso en coordenadas de pantalla (NDC -1..1): franja a la derecha de la flor, lejos del
// texto y por debajo del header. Entra por el borde derecho y sale por abajo, siempre fuera del
// viewport, cayendo en diagonal como empujado por una corriente suave.
const LANE = { xStart: 1.16, xEnd: [0.7, 0.92], minX: 0.64, yStart: [0.35, 0.7], yEnd: -1.3 };

// Distancia extra detrás de la flor: se ve más pequeño y en segundo plano.
const BEHIND = [0.14, 0.26];
const SCALE = 0.8;

const random = ([min, max]) => min + Math.random() * (max - min);
const tmpDir = new Vector3();

// Pétalo suelto que cruza la escena muy de vez en cuando, como algo accidental del entorno.
// Reutiliza la geometría y el material de un pétalo del propio GLB. Solo hay uno, siempre.
function DriftingPetal() {
  const { nodes } = useGLTF(MODELS.florInteractiva);
  const source = nodes.Petalo_3;
  const group = useRef();

  // La geometría tiene el pivote en la base: se centra para que rote sobre sí mismo.
  const center = useMemo(() => {
    source.geometry.computeBoundingBox();
    return source.geometry.boundingBox.getCenter(new Vector3()).negate();
  }, [source]);

  const flight = useRef(null);

  useFrame(({ clock, camera }) => {
    const t = clock.elapsedTime;
    const petal = group.current;
    if (!petal) return;

    if (!flight.current) {
      flight.current = { active: false, nextAt: t + random(FIRST_DELAY) };
    }
    const f = flight.current;

    if (!f.active) {
      petal.visible = false;
      if (t < f.nextAt) return;
      Object.assign(f, {
        active: true,
        start: t,
        duration: random(DURATION),
        xEnd: random(LANE.xEnd),
        yStart: random(LANE.yStart),
        behind: random(BEHIND),
        seed: Math.random() * 100,
        spin: random([0.25, 0.45]) * (Math.random() < 0.5 ? -1 : 1),
      });
      f.nextAt = t + Math.max(f.duration + 2, random(INTERVAL));
    }

    const elapsed = t - f.start;
    const p = elapsed / f.duration;
    if (p >= 1) {
      f.active = false;
      petal.visible = false;
      return;
    }

    // Caída con aire irregular: deriva lateral con ruido + vaivén de hoja (péndulo) acoplado al giro.
    const gust = fbm1D(elapsed * 0.22, f.seed) * 0.07;
    const sway = Math.sin(elapsed * 1.05 + f.seed) * 0.025;
    // El avance lateral pierde fuerza (la corriente lo deja caer); la caída es casi constante.
    const lateral = 1 - (1 - p) * (1 - p);
    const x = Math.max(LANE.minX, LANE.xStart + (f.xEnd - LANE.xStart) * lateral + gust + sway);
    const y = f.yStart + (LANE.yEnd - f.yStart) * p + fbm1D(elapsed * 0.3, f.seed + 5) * 0.03;

    // De pantalla a mundo: rayo desde la cámara a una distancia algo mayor que la de la flor.
    tmpDir.set(x, y, 0.5).unproject(camera).sub(camera.position).normalize();
    petal.position
      .copy(camera.position)
      .addScaledVector(tmpDir, camera.position.length() + f.behind);

    petal.rotation.set(
      elapsed * f.spin + fbm1D(elapsed * 0.15, f.seed + 9) * 1.2,
      elapsed * f.spin * 0.6 + fbm1D(elapsed * 0.12, f.seed + 17) * 1.5,
      Math.sin(elapsed * 1.05 + f.seed) * 0.5
    );
    petal.visible = true;
  });

  return (
    <group ref={group} visible={false} scale={SCALE}>
      <mesh geometry={source.geometry} material={source.material} position={center} />
    </group>
  );
}

export default DriftingPetal;
