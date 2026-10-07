import { useEffect } from 'react';

import { IOT_ALERT, IOT_CHART, IOT_KINDS, IOT_SENSORS, IOT_TICK } from '@/config/iot';

const CHART = { width: 500, height: 150 };
// Peso de la lectura nueva en la media móvil exponencial (la línea "suavizada").
const EMA = 0.22;
// Cuánto se acerca cada lectura a su valor objetivo: deriva lenta, como un sensor real, salvo el
// pico de la alerta, que tiene que verse subir en pocos segundos.
const PULL = { normal: 0.14, alert: 0.4 };

// Ruido aproximadamente normal (suma de uniformes): menos saltos bruscos que Math.random.
const noise = () => Math.random() + Math.random() + Math.random() - 1.5;

const format = (value, digits) =>
  value.toLocaleString('es-ES', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
    useGrouping: 'always',
  });

const slug = text => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, '-');

const toPoints = series =>
  series
    .map((value, i) => {
      const x = (i / (series.length - 1)) * CHART.width;
      const level = (value - IOT_CHART.min) / (IOT_CHART.max - IOT_CHART.min);
      return `${x.toFixed(1)},${(CHART.height * (1 - level)).toFixed(1)}`;
    })
    .join(' ');

// Simulación de los sensores de la sección IoT. Cada IOT_TICK ms genera lecturas nuevas y las
// escribe directamente en el DOM de `rootRef` (sin estado de React):
// - [data-live="<sensor>"]: el valor actual (en la planta y en el dashboard);
// - [data-feed]: los últimos mensajes MQTT que pasan por el broker;
// - [data-chart=raw|smooth|area]: la gráfica de CO₂ (cruda, suavizada y su área).
// El CO₂ de la Sala 2 sube por encima del umbral cuando el elemento [data-alert] está activo
// (lo enciende el scroll). Con `live` false se pinta un único estado, sin intervalo.
export function useLiveSensors(rootRef, live) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const sensors = IOT_SENSORS.map(sensor => ({
      ...sensor,
      kind: IOT_KINDS[sensor.kind],
      topic: `oficina/${slug(sensor.room)}/${sensor.kind}`,
      value: IOT_KINDS[sensor.kind].base,
      nodes: root.querySelectorAll(`[data-live="${sensor.id}"]`),
    }));
    const charted = sensors.find(sensor => sensor.id === IOT_CHART.sensor);
    const alert = root.querySelector('[data-alert]');
    const feed = [...root.querySelectorAll('[data-feed]')];
    const lines = Object.fromEntries(
      ['raw', 'smooth', 'area'].map(name => [name, root.querySelector(`[data-chart=${name}]`)])
    );
    const series = Array.from(
      { length: IOT_CHART.samples },
      () => charted.kind.base + noise() * charted.kind.noise * 2
    );
    let messages = [];

    const step = () => {
      const alerting = alert && alert.dataset.state !== 'pending';

      for (const sensor of sensors) {
        const { base, noise: amount, digits } = sensor.kind;
        const spiking = sensor === charted && alerting;
        const target = spiking ? IOT_ALERT.peak : base;
        sensor.value +=
          (target - sensor.value) * (spiking ? PULL.alert : PULL.normal) + noise() * amount * 2;
        const text = format(sensor.value, digits);
        for (const node of sensor.nodes) node.textContent = text;
      }

      // Gráfica: la serie cruda y su media móvil.
      series.push(charted.value);
      series.shift();
      let average = series[0];
      const smooth = series.map(value => (average += (value - average) * EMA));
      lines.raw?.setAttribute('points', toPoints(series));
      const smoothPoints = toPoints(smooth);
      lines.smooth?.setAttribute('points', smoothPoints);
      lines.area?.setAttribute(
        'points',
        `0,${CHART.height} ${smoothPoints} ${CHART.width},${CHART.height}`
      );

      // Broker: el mensaje nuevo entra arriba y los anteriores bajan.
      const sensor = sensors[Math.floor(Math.random() * sensors.length)];
      messages = [
        `${sensor.topic}  ${format(sensor.value, sensor.kind.digits)}`,
        ...messages,
      ].slice(0, feed.length);
      feed.forEach((node, i) => (node.textContent = messages[i] ?? ''));
    };

    // Unas cuantas lecturas de arranque para que el broker no empiece vacío.
    for (let i = 0; i < feed.length; i++) step();
    if (!live) return undefined;
    const interval = setInterval(step, IOT_TICK);
    return () => clearInterval(interval);
  }, [rootRef, live]);
}
