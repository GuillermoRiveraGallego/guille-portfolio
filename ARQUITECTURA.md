# Arquitectura y forma de trabajo

Este documento recoge cómo organizamos los proyectos. Está sacado de `remodec/metro7-workflow`, que es
la referencia. Este portfolio lo amplía con Three.js. Si vas a añadir algo nuevo, sigue estas reglas
antes de inventar otra estructura.

---

## 1. Estructura general del repositorio

La raíz del repo tiene las herramientas comunes y, cuando hay backend, el servidor. El frontend vive
siempre en `client/` con su propio `package.json`.

```
proyecto/
├── .husky/               # hooks de git (commit-msg → commitlint, pre-commit → lint del client)
├── client/               # frontend Vite + React (paquete independiente)
├── index.js              # backend Express (solo si el proyecto lo necesita)
├── package.json          # scripts globales + tooling (husky, commitlint, prettier, concurrently)
├── .prettierrc
├── commitlint.config.js
└── .gitignore
```

- **Gestor de paquetes: pnpm**, fijado con `devEngines.packageManager` en el `package.json` raíz
  (`onFail: "download"`). Hay un lockfile por paquete (raíz y `client/`).
- **ESM en todo el proyecto**: `"type": "module"` en ambos `package.json`.
- **JavaScript, no TypeScript**: archivos `.js` / `.jsx`. Los alias se declaran en `jsconfig.json`.
- Los scripts de la raíz delegan en el client con `pnpm --dir client <script>`. Con backend se usa
  `concurrently` para levantar los dos a la vez (`pnpm dev` ⇒ `dev:server` + `dev:client`).

### Backend (cuando lo haya), según metro7

- Express 5 en `index.js` con `helmet()`, `cors()` y `express.json()`.
- Todas las rutas van bajo el prefijo `/api`, empezando por `GET /api/health`.
- Puerto `5000`, `nodemon` en desarrollo (`dev:server`), `node index.js` en `start`.
- El frontend no conoce la URL del backend: Vite hace de proxy de `/api` → `http://localhost:5000`.

> En este portfolio todavía **no hay backend**. Si hace falta (formulario de contacto, CMS...), se
> añade siguiendo exactamente lo de arriba.

---

## 2. Frontend (`client/`)

### Stack

| Pieza             | Elección                                                          |
| ----------------- | ----------------------------------------------------------------- |
| Bundler           | Vite                                                              |
| UI                | React 19 (`StrictMode`)                                           |
| Estilos           | Tailwind CSS v4 vía `@tailwindcss/vite` (sin `tailwind.config`)   |
| Componentes       | shadcn/ui, estilo `base-nova`, primitivas de `@base-ui/react`     |
| Iconos            | `lucide-react`                                                    |
| Tipografía        | `@fontsource-variable/geist`                                      |
| Clases            | paquete `cn` (re-exportado desde `@/lib/utils`) + `cva` variantes |
| Routing           | `react-router-dom` con `createBrowserRouter` (data router)        |
| Datos de servidor | TanStack Query + instancia de Axios (cuando hay API)              |
| 3D                | `three` + `@react-three/fiber` + `@react-three/drei` (portfolio)  |

### Estructura de `src/`

```
client/src/
├── main.jsx              # punto de entrada: providers + RouterProvider
├── index.css             # Tailwind + tokens de shadcn (variables CSS, modo .dark)
├── components/
│   ├── ui/               # componentes shadcn (generados, se tocan lo mínimo)
│   └── layout/           # layout común a las rutas (RootLayout, Navbar...)
├── config/               # constantes de la app (p. ej. rutas de modelos 3D)
├── lib/                  # utilidades puras (utils.js → cn)
├── pages/                # una página por ruta
├── router/
│   ├── paths.js          # URLs como constantes (PATHS)
│   ├── navigation.js     # enlaces del menú
│   ├── routes.jsx        # árbol de rutas
│   └── router.jsx        # createBrowserRouter(routes)
├── services/             # (con API) api.js: axios.create({ baseURL: '/api' })
├── hooks/                # (cuando haga falta) hooks propios, alias @/hooks
└── three/                # todo lo que vive dentro de un <Canvas> (ver sección 4)
```

### Reglas

- **Imports absolutos con `@/`** (alias a `src/`, definido en `vite.config.js` y `jsconfig.json`).
  Nada de `../../`. El único import relativo permitido es `./index.css` en `main.jsx`.
- **Orden de imports**: primero los paquetes externos, una línea en blanco, después los internos
  `@/...` y por último el CSS.
- **Componentes**: `function Nombre() {}` y `export default Nombre;` al final del archivo. Un
  componente por archivo, en PascalCase (`Home.jsx`, `NotFound.jsx`).
- **Módulos que no son componentes**: export con nombre (`export const router`, `export const PATHS`).
- **Páginas** en `pages/`: solo componen piezas, la lógica va en componentes, hooks o servicios.
  Siempre existe `NotFound.jsx` para la ruta `*`.
- **shadcn**: los componentes se añaden con el CLI a `components/ui/`. En ESLint esa carpeta tiene
  desactivada `react-refresh/only-export-components` porque exportan variantes junto al componente.
- **Peticiones HTTP**: siempre a través de `services/api.js` (Axios) y consumidas con TanStack Query.
  El `QueryClientProvider` envuelve al `RouterProvider` en `main.jsx`.
- **Estilos**: clases de Tailwind y tokens de shadcn (`bg-background`, `text-muted-foreground`...),
  sin colores sueltos. Las clases condicionales se combinan con `cn()`.
- Los comentarios van en **castellano** y explican el _porqué_, no el qué.

### Routing

- Las rutas se definen como **objetos** (no `<Routes>` en JSX) y se pasan a `createBrowserRouter`.
- `paths.js` es la única fuente de verdad de las URLs: `<Link to={PATHS.about}>`, nunca `"/sobre-mi"`.
- Un **layout raíz** (`RootLayout` con `<Outlet />`) envuelve todas las páginas.
- Las páginas se cargan con **`lazy`** de React Router para separar el código por ruta. Así three.js
  (~1 MB) solo se descarga en las páginas con escena 3D.

**Añadir una página nueva:**

1. Crear `src/pages/Proyectos.jsx`.
2. Añadir la URL en `router/paths.js` → `projects: '/proyectos'`.
3. Añadir la ruta en `router/routes.jsx` → `{ path: PATHS.projects, lazy: lazyPage(() => import('@/pages/Proyectos')) }`.
4. Si aparece en el menú, añadirla a `router/navigation.js`.

---

## 3. Calidad de código y git

### Formato y lint

- **Prettier** (raíz) con: `semi`, `singleQuote`, `printWidth: 100`, `tabWidth: 2`,
  `trailingComma: "es5"`, `bracketSpacing`, `arrowParens: "avoid"` (`x => x`, no `(x) => x`).
  Comandos: `pnpm format` / `pnpm format:check`.
- **ESLint** (flat config en `client/eslint.config.js`): `@eslint/js` recommended + `react-hooks` +
  `react-refresh` (vite), con globals de navegador e ignorando `dist`.

### Hooks (Husky)

- `pre-commit` → `pnpm --dir client lint`. No se puede hacer commit con errores de lint.
- `commit-msg` → `commitlint` con `@commitlint/config-conventional`.

### Commits y ramas

- **Conventional Commits** en inglés, en minúscula e imperativo:
  `chore: configure React Router`, `feat: add projects page`, `fix: ...`.
- **Un commit por paso lógico.** Por ejemplo, en metro7 el setup se hizo así: init frontend →
  shadcn → router → query/axios → backend → proxy → calidad de código → limpieza.
- Se trabaja en **ramas `tipo/descripcion`** (`chore/project-setup`, `feat/home-scene`) y se integra
  en `main` con **Pull Request**. Nada de commits directos a `main`.
- Se borra el código de plantilla que no se usa (p. ej. `App.jsx` de Vite) en su propio commit.

### `.gitignore`

`node_modules/`, `.env` y `.env.*`, `*.log`, `dist/`, `.DS_Store`, `Thumbs.db`. Los secretos van en
`.env` y no se suben nunca.

---

## 4. Three.js (específico de este proyecto)

Usamos **React Three Fiber** (R3F) para escribir la escena en JSX y **drei** para los helpers. Todo el
código que se renderiza dentro de un `<Canvas>` va en `src/three/`, separado de la UI normal.

```
src/three/
├── canvas/
│   ├── SceneCanvas.jsx       # <Canvas> base: dpr, cámara, tone mapping, <Suspense>
│   └── CanvasLoader.jsx      # % de carga (useProgress) mientras llegan los assets
├── lighting/
│   ├── StudioEnvironment.jsx # entorno de reflejos con Lightformers (sin HDRI externo)
│   └── GradientBackground.jsx# fondo degradado dentro de la escena
└── models/
    ├── FlorCristal.jsx       # un componente por modelo GLB
    ├── FlorNatural.jsx
    └── FlorInteractiva.jsx   # modelo con pivotes, animado e interactivo desde código
```

### Reglas 3D

- **Las páginas no crean `<Canvas>` a mano**: usan `SceneCanvas` y solo declaran el contenido. Así
  la configuración del renderer está en un único sitio.
- **Modelos**:
  - Los `.glb` van en `client/public/models/` y su ruta se declara en `src/config/models.js`
    (`MODELS.florCristal`). Nunca se escribe la ruta suelta dentro de un componente.
  - Un componente por modelo en `three/models/`, cargado con `useGLTF` y con
    `useGLTF.preload(...)` al final del archivo.
  - Se respetan los **materiales del GLB** (transmission, volume, ior, dispersion, clearcoat...) en
    lugar de recrearlos en código. Si hace falta tocar un material, se hace en el componente del
    modelo y nunca en la página.
- **Modelos interactivos** (p. ej. `FlorInteractiva`):
  - El GLB se exporta con una pieza por nodo y el **pivote en la base** de cada pieza que se mueve
    (`Cabeza_Flor`, `Petalo_N`, `Estambre_NN`). Los nombres de los nodos son el contrato con el código.
  - Se clona la escena (`scene.clone(true)`) y se guarda la rotación original de cada nodo. Cada
    frame se calcula `original * desplazamiento` y se interpola con `slerp` amortiguado por `delta`,
    para que no dependa de los FPS.
  - Los parámetros de animación (ángulos, velocidades) van como constantes al principio del archivo.
  - Eventos de R3F (`onPointerOver`, `onClick`) sobre el `<primitive>`. En `onClick` se ignora el clic
    si `event.delta` es grande, porque en ese caso el usuario estaba orbitando la cámara.
  - Si el modelo reacciona al puntero, la cámara no rota sola y su órbita se limita a la parte
    frontal.
- **Iluminación/entorno**: los materiales de cristal necesitan un `Environment` para tener reflejos.
  Usamos `Lightformer`s locales para no depender de HDRIs de un CDN. Además, el fondo tiene que estar
  **dentro de la escena** (`scene.background`), porque si se pone en CSS el cristal no lo refracta.
- **Encuadre**: `<Bounds fit clip observe>` + `<Center>` en vez de poner a mano la posición de la
  cámara, para que cualquier modelo se encuadre solo sea cual sea su escala.
- **Controles**: `OrbitControls` con `makeDefault` (lo necesita `Bounds`).
- **Rendimiento**:
  - `dpr={[1, 2]}` para limitar el pixel ratio en pantallas de alta densidad.
  - Las páginas 3D siempre se cargan con lazy route (three no va en el bundle inicial).
  - Cualquier recurso creado a mano (`CanvasTexture`, geometrías, materiales) se crea en `useMemo` y
    se libera con `dispose()` en el cleanup de `useEffect`.
  - Los GLB son pesados (~7 MB). Si crecen, se comprimen con `gltf-transform` (Draco/Meshopt +
    texturas KTX2) antes de subirlos.
- **UI sobre la escena**: el HTML (títulos, textos) va en un `div` absoluto encima del canvas con
  `pointer-events-none`, para no bloquear los controles. `<Html>` de drei solo se usa para cosas
  ancladas a un punto 3D.

---

## 5. Comandos

```bash
pnpm install                 # en la raíz (instala husky)
pnpm --dir client install    # dependencias del frontend

pnpm dev          # servidor de desarrollo (Vite)
pnpm build        # build de producción en client/dist
pnpm preview      # sirve la build
pnpm lint         # ESLint del client
pnpm format       # Prettier en todo el repo
```
