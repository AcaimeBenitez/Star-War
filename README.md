# Galaxia SW

Página accesible sobre 5 películas de Star Wars (React 18 + Bootstrap 5.3).

## Estructura
```
index.html          página principal
css/styles.css      estilos propios (tras Bootstrap)
js/app.js           aplicación React
data/films.json     datos de las películas
vendor/             React, ReactDOM, Bootstrap y htm (funciona sin internet)
img/                ilustraciones de películas, sables y casco de fondo
licenses/           licencias de terceros
LICENSE, NOTICE.md  licencia propia y avisos
package.json        dependencias y scripts de auditoría
```

## Usar
- Abre `index.html` con doble clic, o ejecuta `npm install && npm start` (http://localhost:3000).
- Audio: pon la URL en `data-src` de `<audio id="audio">` en `index.html`.
- Vídeo: en `index.html`, sección Vídeo, descomenta el `<iframe>` y pon tu enlace.
- Películas: edita `data/films.json` (y la copia `FALLBACK_FILMS` de `js/app.js`).
- Cambia `accesibilidad@tudominio.com` en el pie por tu correo.

## Auditorías (con `npm start` activo)
`npm run audit:axe` y `npm run audit:lighthouse`.
