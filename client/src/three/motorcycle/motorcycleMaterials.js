import { GLASS_MATERIAL } from '@/config/motorcycle';

// Materiales de la moto. Se conservan los del GLB y se les añade, sin cambiar su aspecto por
// defecto, un pequeño bloque al final del shader para:
// - uTechnical (compartido): realistic (0) → material simplificado → técnico/arcilla (1);
// - uHighlight (por pieza): realce muy leve al pasar el cursor o al inspeccionar;
// - uDim (por pieza): la pieza se funde con el fondo cuando otra está enfocada (sin desaparecer).
// Se clonan por pieza para que cada una tenga sus uniforms; three reutiliza el mismo programa
// para clones con los mismos parámetros, así que no hay más compilaciones.

const TECHNICAL_CHUNK = /* glsl */ `
  {
    vec3 baseColor = gl_FragColor.rgb;
    float luma = dot(baseColor, vec3(0.299, 0.587, 0.114));
    vec3 simplified = mix(baseColor, vec3(luma) * 0.92 + 0.06, 0.7);

    vec3 n = normalize(normal);
    float facing = clamp(abs(dot(n, normalize(vViewPosition))), 0.0, 1.0);
    float rim = pow(1.0 - facing, 2.5);
    float light = dot(n, normalize(vec3(0.35, 0.8, 0.5))) * 0.5 + 0.5;
    vec3 clay = vec3(0.79, 0.8, 0.83) * (0.5 + 0.5 * light) + rim * 0.16;

    float simplify = smoothstep(0.0, 0.5, uTechnical);
    float technical = smoothstep(0.4, 1.0, uTechnical);
    vec3 color = mix(mix(baseColor, simplified, simplify), clay, technical);

    color += uHighlight * (0.035 + rim * 0.22);
    color = mix(color, uHaze, uDim * 0.72);

    gl_FragColor.rgb = color;
    gl_FragColor.a = mix(gl_FragColor.a, 1.0, technical * 0.85);
  }
`;

// Uniforms compartidos por toda la moto.
export function createSharedUniforms(haze) {
  return { uTechnical: { value: 0 }, uHaze: { value: haze } };
}

// Clona y prepara el material de una pieza. `partUniforms`: { uHighlight, uDim } de la pieza.
// `glassTransmission`: false en móvil, donde los vidrios usan solo su transparencia.
export function preparePartMaterial(
  source,
  shared,
  partUniforms,
  { glassTransmission = true } = {}
) {
  const material = source.clone();

  // En el GLB casi todos los materiales opacos (chasis, neumáticos, cromo...) vienen con
  // transmission = 1, un resto de la exportación: los haría parecer vidrio oscuro. Solo los vidrios
  // la conservan. Cualquier material con transmisión obliga a three a renderizar otra vez la
  // escena detrás de él en cada frame (por eso en móvil tampoco la llevan los vidrios: ya son
  // transparentes por su alpha).
  const isGlass = GLASS_MATERIAL.test(material.name);
  if (material.transmission > 0 && (!isGlass || !glassTransmission)) material.transmission = 0;

  // Para que la malla técnica (wireframe) se dibuje encima sin z-fighting.
  material.polygonOffset = true;
  material.polygonOffsetFactor = 1;
  material.polygonOffsetUnits = 1;

  material.onBeforeCompile = shader => {
    Object.assign(shader.uniforms, shared, partUniforms);
    shader.fragmentShader = shader.fragmentShader
      .replace(
        'void main() {',
        'uniform float uTechnical;\nuniform float uHighlight;\nuniform float uDim;\nuniform vec3 uHaze;\nvoid main() {'
      )
      .replace(
        '#include <dithering_fragment>',
        `${TECHNICAL_CHUNK}\n#include <dithering_fragment>`
      );
  };
  // Mismo programa para todos los clones del mismo tipo de material.
  material.customProgramCacheKey = () => 'motorcycle-technical';
  return material;
}
