# Dossier · Mario Guido (elBanano / TERRORRR)

Aplicación web de **scouting de ajedrez** del jugador Mario Guido — **elBanano** en
Lichess, **TERRORRR** en Chess.com — preparada para Michael Perez.

Sitio estático, responsive y accesible, con **tableros de ajedrez jugables**, gráficos de
repertorio, plan de juego y **datos reales que se actualizan automáticamente** desde las
APIs públicas de Chess.com y Lichess.

> Todo el contenido procede de **866 partidas reales** de Chess.com (API pública, 2019–2026).
> Los PGN reproducen las jugadas originales sin alterar.

---

## ✨ Características

- **12 secciones** de análisis: resumen, datos, estilo, repertorios, fortalezas, debilidades,
  plan de juego, partidas modelo, entrenamiento, tarjeta rápida y ejercicios FEN.
- **Motor de ajedrez propio** (JS, sin dependencias) que reproduce cualquier PGN jugada a jugada.
- **12 tableros interactivos** (6 partidas modelo comentadas + 6 recientes automáticas) con
  navegación, resaltado del último movimiento, giro de tablero y notas del entrenador.
- **Datos en vivo**: KPIs, resultado global, % de derrotas por tiempo y gráficos de repertorio
  recalculados desde las partidas reales.
- **Dashboard premium**: header fijo, sidebar responsive, buscador global, tema claro/oscuro
  con persistencia, botón «volver arriba» y animaciones suaves.
- **100% responsive** (móvil, tablet, iPad, laptop, desktop) sin scroll horizontal.
- **Accesibilidad**: navegación por teclado, `aria-*`, `prefers-reduced-motion`, foco visible.
- **SEO**: meta tags, Open Graph, Twitter Card, JSON-LD, `sitemap.xml`, `robots.txt`, manifest.
- **Carga diferida** de los tableros para un arranque rápido (mejor Lighthouse).

---

## 📁 Estructura

```
.
├── index.html                 # App principal (contenido + datos en vivo)
├── assets/
│   ├── css/styles.css         # Estilos (dashboard, temas, responsive)
│   ├── js/app.js              # Motor de ajedrez + tableros + UI
│   └── img/
│       ├── favicon.svg
│       └── og-image.svg
├── update-dossier.js          # Descarga partidas y actualiza los datos del HTML
├── actualizar.bat             # Ejecuta el actualizador con doble clic (Windows)
├── manifest.webmanifest
├── robots.txt · sitemap.xml
├── netlify.toml               # Configuración de despliegue
└── package.json
```

---

## 🔄 Actualización automática de datos

`update-dossier.js` descarga las partidas de Chess.com y el perfil de Lichess, recalcula todas
las estadísticas y las inyecta en `index.html` (entre los marcadores `DATA_START`/`DATA_END`).

```bash
node update-dossier.js      # o:  npm run update  ·  o doble clic en actualizar.bat
```

En Windows hay una **tarea programada** (`Dossier Mario Guido - Actualizar diario`) que lo ejecuta
cada día a las 20:00 y mantiene la versión local siempre al día.

**Limitaciones declaradas:**
- Lichess **bloquea la descarga de partidas individuales** (404/429): de Lichess solo se leen
  rating y estadísticas de perfil. Los tableros nuevos provienen de **Chess.com**.
- Los datos en vivo dentro de la web se refrescan al ejecutar el actualizador (una página estática
  no puede llamar a APIs externas por seguridad del navegador).

---

## 🚀 Desarrollo local

```bash
# Servir el sitio en local (elige uno):
python -m http.server 4178          # http://127.0.0.1:4178
npx --yes serve .                   # o con Node
```

Abrir `index.html` directamente también funciona (los recursos usan rutas relativas).

---

## 🌐 Despliegue en Netlify

Sitio **estático sin build** (`netlify.toml` → `publish = "."`). Netlify aplica compresión
Brotli/gzip y CDN global automáticamente.

1. En [Netlify](https://app.netlify.com) → **Add new site → Import from Git**.
2. Conecta este repositorio de GitHub.
3. Build command: *(vacío)* · Publish directory: `.`
4. Cada `git push` a `main` genera un deploy automático.

---

## 📊 Fuentes

- Chess.com · [TERRORRR](https://www.chess.com/member/TERRORRR)
- Lichess · [elBanano](https://lichess.org/@/elBanano)

## Licencia

MIT — uso personal de estudio.
