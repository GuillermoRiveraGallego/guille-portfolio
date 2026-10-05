import { useState } from 'react';

import { cn } from '@/lib/utils';

// Cambia de texto con un fundido cruzado: el anterior sale mientras entra el nuevo, los dos en
// la misma celda del grid para que no salte el layout.
function SwapText({ text, className }) {
  const [state, setState] = useState({ current: text, previous: null, key: 0 });

  if (state.current !== text) {
    setState(prev => ({ current: text, previous: prev.current, key: prev.key + 1 }));
  }

  const hasChanged = state.key > 0;

  return (
    <span className={cn('inline-grid', className)}>
      {state.previous && (
        <span key={`out-${state.key}`} aria-hidden className="animate-swap-out [grid-area:1/1]">
          {state.previous}
        </span>
      )}
      <span
        key={`in-${state.key}`}
        className={cn('[grid-area:1/1]', hasChanged && 'animate-swap-in')}
      >
        {state.current}
      </span>
    </span>
  );
}

export default SwapText;
