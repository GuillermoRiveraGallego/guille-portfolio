import { useRef } from 'react';

import IotStage from '@/components/iot/IotStage';
import { setupCamera } from '@/components/iot/setupCamera';
import { useLiveSensors } from '@/components/iot/useLiveSensors';
import ScrollStory from '@/components/story/ScrollStory';
import { IOT_BACKGROUND, IOT_CHAPTERS } from '@/config/iot';
import { SECTIONS } from '@/config/sections';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useScrollTimeline } from '@/hooks/useScrollTimeline';

// Sección IoT: el viaje de un dato desde un sensor hasta un dashboard en tiempo real, con lecturas
// simuladas que se actualizan solas. Ver config/iot.js.
function IotLive() {
  const mobile = !useMediaQuery('(min-width: 768px)');
  const motion = !useMediaQuery('(prefers-reduced-motion: reduce)');
  const stage = useRef(null);

  useScrollTimeline(stage, motion, setupCamera);
  useLiveSensors(stage, motion);

  return (
    <ScrollStory
      background={IOT_BACKGROUND}
      chapters={IOT_CHAPTERS}
      next={SECTIONS.performance}
      compact={mobile}
      stage={<IotStage stageRef={stage} />}
    />
  );
}

export default IotLive;
