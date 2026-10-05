import {
  ArrowHelper,
  Box3,
  Box3Helper,
  Color,
  Group,
  Mesh,
  MeshBasicMaterial,
  SphereGeometry,
  Vector3,
} from 'three';

// Ayuda visual de desarrollo para la transición de los pétalos (solo con DEBUG_PETALS):
// - punto amarillo: centro de la flor; caja: volumen de la cabeza;
// - esferas de alambre: esfera envolvente de cada pétalo (el volumen que hay que abandonar);
// - flechas: dirección de escape de cada pétalo (la del pulsado en rojo, fijada al soltarse);
// - punto rojo: centro del pétalo pulsado; etiqueta abajo a la izquierda: estado y holgura.
// Nada de esto participa en el raycasting ni se crea en producción.

const COLORS = { center: '#facc15', sphere: '#38bdf8', arrow: '#22c55e', active: '#ef4444' };
const ARROW_LENGTH = 2.2; // en radios de pétalo

const noRaycast = () => {};
const onTop = material => Object.assign(material, { depthTest: false, transparent: true });

export class PetalTransitionDebug {
  constructor(scene, rig, transition) {
    this.rig = rig;
    this.transition = transition;
    this.group = new Group();
    this.group.name = 'PetalTransitionDebug';
    this.group.renderOrder = 999;
    scene.add(this.group);

    const dot = color =>
      new Mesh(new SphereGeometry(1, 12, 8), onTop(new MeshBasicMaterial({ color })));
    this.centerDot = dot(COLORS.center);
    this.petalDot = dot(COLORS.active);
    this.group.add(this.centerDot, this.petalDot);

    this.headBox = new Box3();
    this.boxHelper = new Box3Helper(this.headBox, new Color(COLORS.center));
    onTop(this.boxHelper.material);
    this.group.add(this.boxHelper);

    this.petals = rig.petals.map(petal => {
      const sphere = new Mesh(
        new SphereGeometry(1, 16, 10),
        onTop(new MeshBasicMaterial({ color: COLORS.sphere, wireframe: true, opacity: 0.35 }))
      );
      const arrow = new ArrowHelper(new Vector3(1, 0, 0), new Vector3(), 1, COLORS.arrow);
      onTop(arrow.line.material);
      onTop(arrow.cone.material);
      this.group.add(sphere, arrow);
      return { petal, sphere, arrow, escape: { center: new Vector3(), direction: new Vector3() } };
    });

    this.group.traverse(object => {
      object.raycast = noRaycast;
      object.renderOrder = 999;
    });

    this.label = document.createElement('pre');
    Object.assign(this.label.style, {
      position: 'fixed',
      left: '12px',
      bottom: '12px',
      zIndex: 50,
      margin: 0,
      padding: '8px 10px',
      font: '11px/1.5 ui-monospace, monospace',
      color: '#fff',
      background: 'rgb(0 0 0 / 0.7)',
      pointerEvents: 'none',
    });
    document.body.appendChild(this.label);
  }

  update() {
    const { rig, transition } = this;
    const active = transition.busy ? transition.petal : null;

    rig.getCenter(this.centerDot.position);
    this.headBox.setFromObject(rig.head);
    const unit = transition.escape.radius || 0.03;
    this.centerDot.scale.setScalar(unit * 0.06);

    for (const entry of this.petals) {
      const { petal, sphere, arrow, escape } = entry;
      const isActive = petal === active;
      const detached = isActive && transition.state !== 'peeling';

      // El pulsado conserva la flecha del momento en que se soltó; el resto, la actual.
      if (isActive) {
        escape.center.copy(transition.escape.center);
        escape.direction.copy(transition.escape.direction);
        escape.radius = transition.escape.radius;
      } else {
        transition.escapeFor(petal, escape);
      }

      sphere.visible = !detached;
      sphere.position.copy(escape.center);
      sphere.scale.setScalar(escape.radius);
      arrow.position.copy(escape.center);
      arrow.setDirection(escape.direction);
      arrow.setLength(escape.radius * ARROW_LENGTH, escape.radius * 0.5, escape.radius * 0.3);
      arrow.setColor(isActive ? COLORS.active : COLORS.arrow);
    }

    this.petalDot.visible = Boolean(active);
    if (active) {
      this.petalDot.position.copy(transition.position);
      this.petalDot.scale.setScalar(unit * 0.08);
    }

    const clearance =
      transition.state === 'escaping' || transition.state === 'released'
        ? `\nholgura   ${(transition.clearance / unit).toFixed(2)} radios`
        : '';
    // Velocidad y recorrido en radios del pétalo (desde su centro al soltarse).
    const motion =
      active && transition.state !== 'peeling'
        ? `\nvelocidad ${(transition.velocity.length() / unit).toFixed(2)} radios/s` +
          `\nrecorrido ${(transition.position.distanceTo(transition.escape.center) / unit).toFixed(2)} radios`
        : '';
    this.label.textContent = `pétalo    ${active?.name ?? '-'}\nestado    ${transition.state}${clearance}${motion}`;
  }

  dispose() {
    this.group.removeFromParent();
    this.group.traverse(object => {
      object.geometry?.dispose();
      object.material?.dispose();
    });
    this.label.remove();
  }
}
