import { useRef } from 'react';

import { setupMeter } from '@/components/performance/setupMeter';
import PerformanceStage from '@/components/performance/PerformanceStage';
import ScrollStory from '@/components/story/ScrollStory';
import { PERF_BACKGROUND, PERF_CHAPTERS, PERF_NEXT } from '@/config/performance';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useScrollTimeline } from '@/hooks/useScrollTimeline';

// Sección Performance: una página lenta que se optimiza con el scroll, de 38 a 100. La última
// sección: su salida lleva a Contacto. Ver config/performance.js.
function Performance() {
  const mobile = !useMediaQuery('(min-width: 768px)');
  const motion = !useMediaQuery('(prefers-reduced-motion: reduce)');
  const stage = useRef(null);

  useScrollTimeline(stage, motion, setupMeter);

  return (
    <ScrollStory
      background={PERF_BACKGROUND}
      chapters={PERF_CHAPTERS}
      next={PERF_NEXT}
      compact={mobile}
      stage={<PerformanceStage stageRef={stage} />}
    />
  );
}

export default Performance;
