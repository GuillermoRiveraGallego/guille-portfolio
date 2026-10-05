import { Raycaster, Vector2 } from 'three';

// Píxeles de movimiento a partir de los que un clic se considera arrastre.
const DRAG_THRESHOLD = 6;

// Puntero sobre el canvas de la moto: arrastre limitado (lo aplica CameraDirector), hover por
// raycasting contra los proxies de las piezas y clic/tap para inspeccionar. El hover se resuelve
// en el frame y solo si el puntero se ha movido; el clic, en el momento.
export class MotorcycleInteraction {
  constructor({ rig, director, camera, isInteractive, onSelect }) {
    Object.assign(this, { rig, director, camera, isInteractive, onSelect });
    this.raycaster = new Raycaster();
    this.pointer = new Vector2();
    this.hasPointer = false; // ratón dentro del canvas (en táctil no hay hover ni parallax)
    this.dirty = false;
    this.down = false;
    this.moved = false;
    this.start = { x: 0, y: 0 };
    this.last = { x: 0, y: 0 };

    this.handleMove = this.handleMove.bind(this);
    this.handleDown = this.handleDown.bind(this);
    this.handleUp = this.handleUp.bind(this);
    this.handleLeave = this.handleLeave.bind(this);
  }

  attach(element) {
    this.element = element;
    // En táctil el scroll vertical tiene que seguir funcionando: solo el gesto horizontal gira.
    element.style.touchAction = 'pan-y';
    element.addEventListener('pointermove', this.handleMove);
    element.addEventListener('pointerdown', this.handleDown);
    element.addEventListener('pointerleave', this.handleLeave);
    window.addEventListener('pointerup', this.handleUp);
  }

  detach() {
    const { element } = this;
    if (!element) return;
    element.removeEventListener('pointermove', this.handleMove);
    element.removeEventListener('pointerdown', this.handleDown);
    element.removeEventListener('pointerleave', this.handleLeave);
    window.removeEventListener('pointerup', this.handleUp);
    element.style.cursor = '';
  }

  toNdc(event) {
    const rect = this.element.getBoundingClientRect();
    this.pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );
  }

  pick() {
    if (!this.isInteractive()) return null;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    return this.rig.pick(this.raycaster);
  }

  handleMove(event) {
    this.toNdc(event);
    this.hasPointer = event.pointerType === 'mouse';
    this.dirty = true;
    if (!this.down) return;
    this.director.dragBy(event.clientX - this.last.x, event.clientY - this.last.y);
    this.last = { x: event.clientX, y: event.clientY };
    if (Math.hypot(event.clientX - this.start.x, event.clientY - this.start.y) > DRAG_THRESHOLD) {
      this.moved = true;
    }
  }

  handleDown(event) {
    this.down = true;
    this.moved = false;
    this.start = { x: event.clientX, y: event.clientY };
    this.last = { ...this.start };
    this.director.drag.active = true;
  }

  handleUp(event) {
    const isClick = this.down && !this.moved;
    this.down = false;
    this.director.drag.active = false;
    if (!isClick || event.target !== this.element) return;
    this.toNdc(event);
    const part = this.pick();
    if (part) this.onSelect(part);
  }

  handleLeave() {
    this.hasPointer = false;
    this.down = false;
    this.director.drag.active = false;
    this.dirty = true;
  }

  // Hover: devuelve la pieza bajo el cursor si ha cambiado (undefined si no hay cambios).
  updateHover() {
    if (!this.dirty || this.down) {
      if (this.rig.hovered && !this.isInteractive()) return this.setHovered(null);
      return undefined;
    }
    this.dirty = false;
    const part = this.hasPointer ? this.pick() : null;
    return part === this.rig.hovered ? undefined : this.setHovered(part);
  }

  setHovered(part) {
    this.rig.setHovered(part);
    this.element.style.cursor = part ? 'pointer' : '';
    return part;
  }
}
