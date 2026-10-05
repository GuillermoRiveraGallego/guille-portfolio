// Sonidos de la transición del pétalo: desprendimiento y aire al pasar junto a la cámara.
// Preparado pero desactivado. Para activarlo: poner los audios en client/public/sounds, rellenar
// `src` y cambiar ENABLED a true. Tienen que ser extremadamente sutiles (volumen bajo).
const ENABLED = false;

const SOUNDS = {
  detach: { src: null, volume: 0.12 },
  whoosh: { src: null, volume: 0.18 },
};

const cache = new Map();

export function playTransitionSound(name) {
  const sound = SOUNDS[name];
  if (!ENABLED || !sound?.src) return;

  let audio = cache.get(name);
  if (!audio) {
    audio = new Audio(sound.src);
    audio.volume = sound.volume;
    cache.set(name, audio);
  }
  audio.currentTime = 0;
  // El navegador puede bloquear el audio: nunca debe romper la transición.
  audio.play().catch(() => {});
}
