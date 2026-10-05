// Ayudas visuales de desarrollo. Nunca llegan a producción: import.meta.env.DEV es false en el
// build y el código que depende de ellas se elimina.
// Transición de los pétalos: abrir la home con ?debug-petals.
export const DEBUG_PETALS =
  import.meta.env.DEV && new URLSearchParams(window.location.search).has('debug-petals');
