// Estado compartido entre la página (DOM) y la escena 3D de la sección 3D Web. La página escribe
// (scroll, control técnico, pieza seleccionada) y la escena lo lee cada frame: nada de esto pasa
// por el estado de React, que solo se usa para lo que cambia la interfaz.
export class ExperienceStore {
  constructor() {
    this.timeline = 0; // pantallas de scroll recorridas (ver config/threeDWeb.js)
    this.technical = 0; // control Realistic → Technical (0..1)
    this.selected = null; // pieza inspeccionada
    this.focused = false; // cámara enfocada en la pieza
  }

  setTimeline(value) {
    this.timeline = value;
  }

  setTechnical(value) {
    this.technical = value;
  }

  select(part, focused = false) {
    this.selected = part;
    this.focused = Boolean(part && focused);
  }
}
