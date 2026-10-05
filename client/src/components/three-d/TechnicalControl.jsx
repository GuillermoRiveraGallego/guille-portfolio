import { useRef } from 'react';

import { cn } from '@/lib/utils';

// Control Realistic → Technical: el mismo modelo pasa de materiales PBR a material simplificado y
// a geometría (arcilla + malla). Es un input range nativo (accesible con teclado) con estilo
// mínimo; escribe directamente en el store de la escena, sin estado de React.
const STAGES = [
  [0.33, 'PBR materials'],
  [0.7, 'Simplified materials'],
  [1.01, 'Geometry'],
];

const stageOf = value => STAGES.find(([limit]) => value < limit)[1];

function TechnicalControl({ store, visible }) {
  const stage = useRef(null);

  const handleInput = event => {
    const value = Number(event.target.value);
    store.setTechnical(value);
    stage.current.textContent = stageOf(value);
  };

  return (
    <div
      className={cn(
        'fixed right-6 bottom-8 z-9 w-[min(21rem,calc(100vw-3rem))] text-[0.62rem] tracking-[0.2em] text-foreground/60 uppercase transition-opacity duration-500 md:right-[4vw] md:bottom-12',
        visible ? 'opacity-100' : 'pointer-events-none opacity-0'
      )}
    >
      <label className="flex items-center gap-3">
        <span>Realistic</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          defaultValue={store.technical}
          onChange={handleInput}
          aria-label="Realistic to technical view"
          className="h-4 min-w-0 flex-1 cursor-pointer appearance-none bg-transparent [&::-moz-range-thumb]:size-2.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-foreground [&::-moz-range-track]:h-px [&::-moz-range-track]:bg-foreground/30 [&::-webkit-slider-runnable-track]:h-px [&::-webkit-slider-runnable-track]:bg-foreground/30 [&::-webkit-slider-thumb]:-mt-[4.5px] [&::-webkit-slider-thumb]:size-2.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-foreground"
        />
        <span>Technical</span>
      </label>
      <p ref={stage} className="mt-2 text-right text-foreground/40">
        {stageOf(store.technical)}
      </p>
    </div>
  );
}

export default TechnicalControl;
