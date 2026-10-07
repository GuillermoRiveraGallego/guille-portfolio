import { MathUtils } from 'three';

import { AI_PROMPT, AI_TYPING } from '@/config/aiAgents';

// El prompt se escribe con el scroll (y se borra al volver): solo se toca el DOM si cambia.
export function setupPrompt(root) {
  const typed = root.querySelector('[data-typed]');
  let shown = -1;
  return t => {
    const progress = MathUtils.clamp((t - AI_TYPING[0]) / (AI_TYPING[1] - AI_TYPING[0]), 0, 1);
    const count = Math.round(progress * AI_PROMPT.length);
    if (count === shown) return;
    shown = count;
    typed.textContent = AI_PROMPT.slice(0, count);
  };
}
