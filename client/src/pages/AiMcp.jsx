import { useRef } from 'react';

import AgentStage from '@/components/ai/AgentStage';
import { setupPrompt } from '@/components/ai/setupPrompt';
import ScrollStory from '@/components/story/ScrollStory';
import { AI_BACKGROUND, AI_CHAPTERS } from '@/config/aiAgents';
import { SECTIONS } from '@/config/sections';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useScrollTimeline } from '@/hooks/useScrollTimeline';

// Sección AI & MCP: un agente convierte una frase en llamadas a herramientas de un servidor MCP
// (Revit) y devuelve un plano. En negativo, para distinguirla del resto. Ver config/aiAgents.js.
function AiMcp() {
  const mobile = !useMediaQuery('(min-width: 768px)');
  const motion = !useMediaQuery('(prefers-reduced-motion: reduce)');
  const stage = useRef(null);

  useScrollTimeline(stage, motion, setupPrompt);

  return (
    <ScrollStory
      background={AI_BACKGROUND}
      dark
      chapters={AI_CHAPTERS}
      next={SECTIONS.iot}
      compact={mobile}
      stage={<AgentStage stageRef={stage} mobile={mobile} />}
    />
  );
}

export default AiMcp;
