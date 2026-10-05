import {
  Box3,
  BoxGeometry,
  Color,
  Mesh,
  MeshBasicMaterial,
  Quaternion,
  Sphere,
  Vector3,
} from 'three';

import { EXPLODE, MOTORCYCLE, MOTORCYCLE_PARTS, partLabel } from '@/config/motorcycle';
import { createSharedUniforms, preparePartMaterial } from '@/three/motorcycle/motorcycleMaterials';
import { describeModel, describeObject } from '@/three/motorcycle/modelStats';
import { damp, easeInOutCubic, smoothstep } from '@/three/utils/timeline';
import { Spring } from '@/three/utils/spring';

// Separación extra (cm) de la pieza bajo el cursor, en su dirección de despiece.
const HOVER_OFFSET = 1.4;
// Presencia de las demás piezas: inspeccionando una / con la cámara enfocada en ella.
const DIM = { inspect: 0.3, focus: 0.85 };
const HIGHLIGHT = { hover: 0.55, selected: 0.75 };
// Opacidad máxima de la malla técnica. En móvil menos: la moto ocupa pocos píxeles, la malla
// queda muy apretada y con más opacidad se satura hasta verse negra.
const WIRE_OPACITY = { desktop: 0.2, mobile: 0.1 };

const UP = new Vector3(0, 1, 0);
const tmpBox = new Box3();
const tmpVec = new Vector3();
const tmpAxis = new Vector3();
const tmpQuat = new Quaternion();
const tmpWeights = new Vector3();

// Moto como objetos Three (sin React): se construye una vez y se actualiza cada frame.
// Nunca toca las transformaciones originales del GLB: guarda la pose montada de cada pieza y
// calcula la desmontada; cada frame la pose es una interpolación entre las dos.
export class MotorcycleRig {
  constructor(gltf, { mobile, motion, haze }) {
    this.mobile = mobile;
    this.motion = motion;

    // Solo la moto por piezas; las copias antiguas del GLB no se clonan ni llegan a la GPU.
    this.root = gltf.scene.getObjectByName(MOTORCYCLE.root).clone(true);
    this.root.position.set(0, 0, 0);
    this.root.updateMatrixWorld(true);

    this.uniforms = createSharedUniforms(new Color(haze));
    this.bounds = new Box3().setFromObject(this.root);
    this.center = this.bounds.getCenter(new Vector3());
    this.sphere = this.bounds.getBoundingSphere(new Sphere());

    this.parts = Object.entries(MOTORCYCLE_PARTS)
      .map(([name, config]) => this.createPart(name, config))
      .filter(Boolean);
    this.interactiveParts = this.parts.filter(part => part.interactive);
    this.proxies = this.interactiveParts.map(part => part.proxy);

    // Piezas estáticas: mismos materiales preparados (modo técnico), sin interacción.
    for (const name of MOTORCYCLE.staticGroups) {
      const node = this.root.getObjectByName(name);
      if (node) this.prepareMaterials(node, { uHighlight: { value: 0 }, uDim: { value: 0 } });
    }

    this.wireMaterial = new MeshBasicMaterial({
      color: '#2e3440',
      wireframe: true,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    this.wireMeshes = null;

    this.hovered = null;
    this.selected = null;
    this.focused = false;
    this.stats = describeModel(
      this.root,
      this.parts,
      gltf.parser?.json,
      this.interactiveParts.length
    );
  }

  createPart(name, config) {
    const node = this.root.getObjectByName(name);
    if (!node) {
      if (import.meta.env.DEV)
        console.warn(`[MotorcycleRig] No existe la pieza "${name}" en el GLB`);
      return null;
    }

    // Caja de la pieza en el mundo (montada) y su centro respecto al nodo.
    tmpBox.setFromObject(node);
    const center = tmpBox.getCenter(new Vector3());
    const size = tmpBox.getSize(new Vector3());
    const radius = size.length() / 2;
    const worldPosition = node.getWorldPosition(new Vector3());

    // Dirección de despiece: la artística si existe; si no, radial desde el centro de la moto con
    // los ejes ponderados. Los padres de las piezas solo tienen traslación, así que la dirección en
    // el mundo vale también en el espacio del padre.
    const direction = new Vector3();
    if (config.dir) direction.fromArray(config.dir);
    else {
      direction
        .subVectors(center, this.center)
        .multiply(tmpWeights.fromArray(EXPLODE.radialWeights));
    }
    if (direction.lengthSq() < 1e-6) direction.set(0, 1, 0);
    direction.normalize();

    const order = config.order ?? 0;
    const distance =
      (config.distance ?? EXPLODE.distance[order]) * (this.mobile ? EXPLODE.mobileScale : 1);

    const assembledPosition = node.position.clone();
    const assembledQuaternion = node.quaternion.clone();
    const explodedPosition = assembledPosition.clone().addScaledVector(direction, distance);
    const explodedQuaternion = assembledQuaternion.clone();
    if (this.motion && distance > 0) {
      tmpAxis.crossVectors(UP, direction);
      if (tmpAxis.lengthSq() < 1e-4) tmpAxis.set(1, 0, 0);
      explodedQuaternion.premultiply(
        tmpQuat.setFromAxisAngle(tmpAxis.normalize(), config.tilt ?? EXPLODE.tilt)
      );
    }

    const start = order * EXPLODE.stagger;
    const partUniforms = { uHighlight: { value: 0 }, uDim: { value: 0 } };

    const part = {
      name,
      label: config.label ?? partLabel(name),
      node,
      order,
      direction,
      distance,
      window: [start, Math.min(1, start + EXPLODE.span)],
      center,
      localCenter: center.clone().sub(worldPosition),
      radius,
      assembledPosition,
      assembledQuaternion,
      explodedPosition,
      explodedQuaternion,
      uniforms: partUniforms,
      hover: new Spring({ stiffness: 120, damping: 16 }),
      interactive: !this.mobile || Boolean(config.mobile),
      progress: 0,
    };

    this.prepareMaterials(node, partUniforms);
    part.stats = describeObject(node);

    // Proxy de raycasting: una caja invisible con la forma de la pieza. Hacer raycast contra
    // ~40 cajas es instantáneo; contra 1.2 M de triángulos costaría varios ms en cada movimiento.
    if (part.interactive) {
      const proxy = new Mesh(MotorcycleRig.proxyGeometry, MotorcycleRig.proxyMaterial);
      proxy.scale.copy(size).max(tmpVec.setScalar(2));
      proxy.position.copy(part.localCenter);
      proxy.userData.part = part;
      proxy.userData.helper = true;
      proxy.userData.volume = proxy.scale.x * proxy.scale.y * proxy.scale.z;
      node.add(proxy);
      part.proxy = proxy;
    }
    return part;
  }

  prepareMaterials(node, partUniforms) {
    const clones = new Map();
    const prepare = material => {
      if (!clones.has(material)) {
        clones.set(
          material,
          preparePartMaterial(material, this.uniforms, partUniforms, {
            glassTransmission: !this.mobile,
          })
        );
      }
      return clones.get(material);
    };
    node.traverse(child => {
      if (!child.isMesh) return;
      child.material = Array.isArray(child.material)
        ? child.material.map(prepare)
        : prepare(child.material);
    });
  }

  // Pieza bajo el rayo. Entre las cajas que toca, gana la más pequeña cerca de la primera: así las
  // piezas pequeñas (pinzas de freno, intermitentes) se pueden seleccionar aunque estén dentro de
  // la caja de una grande.
  pick(raycaster) {
    const hits = raycaster.intersectObjects(this.proxies, false);
    if (!hits.length) return null;
    const near = hits[0].distance + this.sphere.radius * 0.12;
    let best = hits[0];
    for (const hit of hits) {
      if (hit.distance > near) break;
      if (hit.object.userData.volume < best.object.userData.volume) best = hit;
    }
    return best.object.userData.part;
  }

  setHovered(part) {
    this.hovered = part;
  }

  setSelected(part, focused) {
    this.selected = part;
    this.focused = Boolean(part && focused);
  }

  // Centro actual de una pieza en el mundo (se mueve con el despiece).
  getPartCenter(part, target) {
    return target.copy(part.localCenter).applyMatrix4(part.node.matrixWorld);
  }

  // La malla técnica se crea la primera vez que hace falta: three genera los índices de las
  // líneas de cada geometría al dibujarla, y no tiene sentido pagarlo si nadie la ve.
  ensureWireframe() {
    if (this.wireMeshes) return;
    this.wireMeshes = [];
    this.root.traverse(child => {
      if (!child.isMesh || child.userData.helper) return;
      const wire = new Mesh(child.geometry, this.wireMaterial);
      wire.userData.helper = true;
      wire.raycast = () => {};
      child.add(wire);
      this.wireMeshes.push(wire);
    });
  }

  // `explosion` 0..1 y `technical` 0..1 ya amortiguados; `dt` en segundos.
  update(dt, explosion, technical) {
    const { selected, focused, hovered } = this;

    for (const part of this.parts) {
      const [start, end] = part.window;
      const local = this.motion ? easeInOutCubic(smoothstep(start, end, explosion)) : explosion;
      part.progress = local;

      const isHovered = part === hovered && !selected;
      const offset = part.hover.update(dt, isHovered ? HOVER_OFFSET : 0);

      part.node.position
        .lerpVectors(part.assembledPosition, part.explodedPosition, local)
        .addScaledVector(part.direction, offset);
      part.node.quaternion.slerpQuaternions(
        part.assembledQuaternion,
        part.explodedQuaternion,
        local
      );

      const highlight = part === selected ? HIGHLIGHT.selected : isHovered ? HIGHLIGHT.hover : 0;
      const dim = selected && part !== selected ? (focused ? DIM.focus : DIM.inspect) : 0;
      part.uniforms.uHighlight.value = damp(part.uniforms.uHighlight.value, highlight, 8, dt);
      part.uniforms.uDim.value = damp(part.uniforms.uDim.value, dim, 5, dt);
    }

    this.uniforms.uTechnical.value = technical;

    // La malla solo existe (y solo cuesta) cuando se ve: se crea al entrar en modo técnico.
    const wire =
      smoothstep(0.55, 1, technical) * (this.mobile ? WIRE_OPACITY.mobile : WIRE_OPACITY.desktop);
    if (wire > 0.001) this.ensureWireframe();
    if (this.wireMeshes) {
      this.wireMaterial.opacity = wire;
      for (const mesh of this.wireMeshes) mesh.visible = wire > 0.001;
    }
  }

  dispose() {
    this.root.traverse(child => {
      if (!child.isMesh || child.userData.helper) return;
      const list = Array.isArray(child.material) ? child.material : [child.material];
      for (const material of list) material.dispose();
    });
    this.wireMaterial.dispose();
  }
}

// Compartidos por todos los proxies (y por todos los montajes).
MotorcycleRig.proxyGeometry = new BoxGeometry(1, 1, 1);
MotorcycleRig.proxyMaterial = new MeshBasicMaterial({ visible: false });
