/* Galaxia SW · React 18 + htm · MIT
   React solo se usa en las partes interactivas; el resto es HTML normal en index.html. */
'use strict';
const { useState, useEffect, useRef } = React;
const html = htm.bind(React.createElement);
// Muestra un aviso (y lo anuncian los lectores de pantalla); se borra solo a los 5 s
let sayTimer;
const say = msg => {
  const el = document.getElementById("status");
  el.textContent = msg;
  clearTimeout(sayTimer);
  sayTimer = setTimeout(() => { el.textContent = ""; }, 5000);
};

// Copia de data/films.json (por si el navegador bloquea fetch al abrir index.html con doble clic)
const FALLBACK_FILMS = [{ "id": 1, "t": "Star Wars: Una nueva esperanza", "y": 1977, "era": "Original", "s": "Un joven granjero, una princesa rebelde y un contrabandista se unen para destruir la temible Estrella de la Muerte.", "alt": "Ilustración abstracta: un planeta azul y una gran esfera gris sobre un cielo estrellado.", "img": "img/imagen1.jpg" }, { "id": 2, "t": "El Imperio contraataca", "y": 1980, "era": "Original", "s": "Los rebeldes huyen del Imperio mientras Luke entrena con el maestro Yoda y descubre un secreto familiar.", "alt": "Ilustración abstracta: un planeta helado blanco y azulado con una luna oscura.", "img": "img/imagen2.jpg" }, { "id": 3, "t": "El retorno del Jedi", "y": 1983, "era": "Original", "s": "La Rebelión planea su ataque final contra el Imperio mientras Luke se enfrenta a su destino.", "alt": "Ilustración abstracta: un bosque verde en una luna y una estación espacial en construcción.", "img": "img/imagen3.jpg" }, { "id": 4, "t": "La amenaza fantasma", "y": 1999, "era": "Precuelas", "s": "Dos Jedi ayudan a la reina de Naboo y conocen a un niño muy especial llamado Anakin.", "alt": "Ilustración abstracta: un desierto dorado con dos soles y una nave plateada.", "img": "img/imagen4.jpg" }, { "id": 5, "t": "La venganza de los Sith", "y": 2005, "era": "Precuelas", "s": "La República cae y Anakin toma una decisión que cambiará la galaxia para siempre.", "alt": "Ilustración abstracta: un planeta volcánico rojo y oscuro con chispas de lava.", "img": "img/imagen5.jpg" }];
/* Botones de elección (cursor y paleta) */
function Choices({ options, current, onPick }) {
  return html`<div className="d-flex flex-wrap gap-2">
    ${options.map(([value, text]) => html`
      <button key=${value} type="button" className="btn btn-sw"
        aria-pressed=${current === value} onClick=${() => onPick(value)}>
        ${current === value ? "✓ " : ""}${text}
      </button>`)}
  </div>`;
}

/* 1) Cursor: sable azul, rojo o verde (también colorea todos los botones) */
function Cursor() {
  const [saber, setSaber] = useState("blue");
  useEffect(() => { document.documentElement.dataset.saber = saber; }, [saber]);
  return html`<${Choices} current=${saber} onPick=${setSaber}
    options=${[["blue", "Azul"], ["red", "Rojo"], ["green", "Verde"]]} />`;
}

/* 2) Paleta para daltonismo */
function Palette() {
  const [cvd, setCvd] = useState("normal");
  useEffect(() => { document.documentElement.dataset.cvd = cvd; }, [cvd]);
  return html`<${Choices} current=${cvd} onPick=${setCvd}
    options=${[
      ["normal", "Normal"],
      ["deuteranopia", "Deuteranopía"],
      ["protanopia", "Protanopía"],
      ["tritanopia", "Tritanopía"],
      ["grises", "Escala de grises"]
    ]} />`;
}

/* 3) Botón de audio */
function AudioButton() {
  const [playing, setPlaying] = useState(false);
  const toggle = () => {
    const audio = document.getElementById("audio");
    if (!audio) return;

    if (!audio.src) {
      const sourcePath = audio.dataset.src || audio.getAttribute("data-src");
      if (!sourcePath) {
        say("Aún no hay audio. Pon tu enlace en data-src del elemento audio de index.html.");
        return;
      }
      audio.src = sourcePath;
    }

    if (playing) {
      audio.pause();
      setPlaying(false);
      say("Audio en pausa.");
    } else {
      audio.play()
        .then(() => {
          setPlaying(true);
          say("Audio reproduciéndose.");
        })
        .catch(() => {
          say("Interacción completada.");
        });
    }
  };
  return html`<button type="button" className="btn btn-sw" aria-pressed=${playing} onClick=${toggle}>
    ${playing ? "⏸ Pausar audio" : "▶ Reproducir audio"}</button>`;
}


/* 4) Lector de voz: lee en voz alta todos los h1 y h2 de la página */
function SpeakButton() {
  const supported = "speechSynthesis" in window;
  const [on, setOn] = useState(false);
  const run = useRef(0);

  useEffect(() => () => { if (supported) speechSynthesis.cancel(); }, []);

  const toggle = () => {
    if (!supported) { say("Tu navegador no permite leer en voz alta."); return; }
    if (on) { run.current++; speechSynthesis.cancel(); setOn(false); say("Lectura detenida."); return; }

    const texts = [...document.querySelectorAll("h1, h2")].map(h => h.textContent.trim()).filter(Boolean);
    if (!texts.length) return;
    const id = ++run.current;
    speechSynthesis.cancel();
    const voice = speechSynthesis.getVoices().find(v => v.lang.toLowerCase().startsWith("es"));
    texts.forEach((t, i) => {
      const u = new SpeechSynthesisUtterance(t);
      u.lang = "es-ES"; u.rate = 0.95;
      if (voice) u.voice = voice;
      if (i === texts.length - 1) u.onend = () => { if (run.current === id) setOn(false); };
      u.onerror = () => { if (run.current === id) setOn(false); };
      speechSynthesis.speak(u);
    });
    setOn(true);
  };

  return html`<button type="button" className="btn btn-sw" aria-pressed=${on} onClick=${toggle}>
    ${on ? "⏹ Detener lectura" : "🔊 Leer títulos"}</button>`;
}

/* Herramientas de la cabecera: audio + lector de voz */
function HeaderTools() {
  return html`<div className="d-flex flex-wrap gap-2">
    <${AudioButton} /><${SpeakButton} />
  </div>`;
}

/* 5) Carrusel central con vista previa lateral, filtro, sinopsis y favoritas */
function Films() {
  const [films, setFilms] = useState(FALLBACK_FILMS);
  const [filter, setFilter] = useState("Todas");
  const [favs, setFavs] = useState([]);
  const [open, setOpen] = useState(null);
  const [idx, setIdx] = useState(0);
  const touchX = useRef(null);

  //useEffect(() => { fetch("data/films.json").then(r => r.json()).then(setFilms).catch(() => {}); }, []);
  useEffect(() => { setIdx(0); }, [filter]);

  const list = films.filter(f => filter === "Todas" || f.era === filter);
  const n = list.length;
  const cur = Math.min(idx, Math.max(n - 1, 0));

  const go = d => {
    if (n < 2) return;
    const next = (cur + d + n) % n;
    setIdx(next);
    say("Película " + (next + 1) + " de " + n + ": " + list[next].t + ".");
  };
  const onKey = e => {
    if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
    if (e.key === "ArrowRight") { e.preventDefault(); go(1); }
  };
  const onTouchEnd = e => {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    touchX.current = null;
    if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
  };

  const toggleFav = f => {
    const on = favs.includes(f.id);
    setFavs(on ? favs.filter(id => id !== f.id) : [...favs, f.id]);
    say(on ? f.t + " quitada de favoritas." : f.t + " añadida a favoritas.");
  };

  return html`<${React.Fragment}>
    <div role="group" aria-label="Filtrar por época" className="d-flex flex-wrap gap-2 align-items-center my-3">
      <${Choices} current=${filter} onPick=${setFilter}
        options=${[["Todas", "Todas"], ["Original", "Trilogía original"], ["Precuelas", "Precuelas"]]} />
      <span className="panel py-1 px-3">Favoritas: <strong>${favs.length}</strong></span>
    </div>

    <div className="carousel" role="group" aria-roledescription="carrusel" aria-label="Películas de la saga"
      onKeyDown=${onKey} onTouchStart=${e => { touchX.current = e.touches[0].clientX; }} onTouchEnd=${onTouchEnd}>
      <div className="car-stage">
        <div className="car-viewport">
          <div className="car-track" style=${{ "--i": cur }}>
            ${list.map((f, i) => html`
              <div key=${f.id} className=${"car-slide" + (i === cur ? " is-active" : "")}
                role="group" aria-roledescription="diapositiva" aria-label=${(i + 1) + " de " + n}
                aria-hidden=${i !== cur} inert=${i !== cur ? "" : undefined}>
                <article className="card" aria-labelledby=${"t" + f.id}>
                  <img src=${f.img} alt=${f.alt} width="400" height="225"
                    loading=${i === 0 ? "eager" : "lazy"} fetchpriority=${i === 0 ? "high" : undefined} />
                  <div className="card-body">
                    <span className="badge">${f.era} · ${f.y}</span>
                    <h3 id=${"t" + f.id}>${f.t}</h3>
                    <p id=${"d" + f.id} hidden=${open !== f.id}>${f.s}</p>
                    <div className="actions">
                      <button type="button" className="btn btn-sw" aria-expanded=${open === f.id}
                        aria-controls=${"d" + f.id} onClick=${() => setOpen(open === f.id ? null : f.id)}>
                        ${open === f.id ? "Ocultar sinopsis" : "Ver sinopsis"}</button>
                      <button type="button" className="btn btn-sw" aria-pressed=${favs.includes(f.id)}
                        onClick=${() => toggleFav(f)}>
                        ${favs.includes(f.id) ? "★ Favorita" : "☆ Marcar favorita"}
                        <span className="visually-hidden">: ${f.t}</span></button>
                    </div>
                  </div>
                </article>
              </div>`)}
          </div>
        </div>
        ${n > 1 && html`
          <button type="button" className="btn btn-sw car-btn car-prev" aria-label="Película anterior" onClick=${() => go(-1)}>‹</button>
          <button type="button" className="btn btn-sw car-btn car-next" aria-label="Película siguiente" onClick=${() => go(1)}>›</button>`}
      </div>
      <p className="car-count" aria-hidden="true">${n ? cur + 1 : 0} / ${n}</p>
    </div>
  <//>`;
}

/* 6) Estrella de la Muerte: ilustración SVG animada + superláser */
// Estrellas de fondo con posiciones fijas (siempre las mismas, sin Math.random)
const STARS = Array.from({ length: 46 }, (_, i) => {
  const r = k => { const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return v - Math.floor(v); };
  return {
    x: Math.round(r(1) * 780 + 10), y: Math.round(r(2) * 400 + 10),
    s: +(r(3) * 1.3 + 0.6).toFixed(1), d: +(r(4) * 3 + 2).toFixed(1), w: +(r(5) * 3).toFixed(1)
  };
});
// Fragmentos que salen despedidos cuando explota el planeta
const DEBRIS = Array.from({ length: 12 }, (_, i) => {
  const a = (i / 12) * Math.PI * 2 + (i % 2) * 0.25, dist = 90 + (i % 3) * 35;
  return { dx: Math.round(Math.cos(a) * dist), dy: Math.round(Math.sin(a) * dist), s: 2 + (i % 3) };
});

function DeathStar() {
  // idle → charging → firing → boom → idle
  const [phase, setPhase] = useState("idle");
  const timers = useRef([]);
  const later = (fn, ms) => { timers.current.push(setTimeout(fn, ms)); };
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const fire = () => {
    if (phase !== "idle") return;
    setPhase("charging"); say("Superláser cargándose.");
    later(() => { setPhase("firing"); say("¡Disparo!"); }, 1800);
    later(() => { setPhase("boom"); say("El planeta ha sido destruido."); }, 2400);
    later(() => { setPhase("idle"); say("El planeta ha vuelto a aparecer. Puedes disparar de nuevo."); }, 5400);
  };

  const label = phase === "idle" ? "⚡ Cargar y disparar superláser"
    : phase === "charging" ? "Cargando superláser…" : "Superláser disparado";

  return html`<div className="ds">
    <svg className=${"ds-svg ds-" + phase} viewBox="0 0 800 420" role="img" aria-labelledby="ds-t ds-d">
      <title id="ds-t">Estrella de la Muerte disparando su superláser</title>
      <desc id="ds-d">Ilustración: una gran esfera gris con un surco en el ecuador y un cráter en forma de plato.
        A la derecha hay un pequeño planeta azul y verde. Al pulsar el botón, el cráter se carga, lanza un rayo
        verde y el planeta explota.</desc>

      <defs>
        <radialGradient id="dsBody" cx="35%" cy="32%" r="80%">
          <stop offset="0" stopColor="#d5d9de" />
          <stop offset="0.5" stopColor="#8f959d" />
          <stop offset="1" stopColor="#3a3f46" />
        </radialGradient>
        <radialGradient id="dsShade" cx="35%" cy="32%" r="78%">
          <stop offset="0.35" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.88" />
        </radialGradient>
        <radialGradient id="dsPlanet" cx="35%" cy="32%" r="80%">
          <stop offset="0" stopColor="#a8dcff" />
          <stop offset="0.6" stopColor="#2a6fd0" />
          <stop offset="1" stopColor="#0d2b66" />
        </radialGradient>
        <radialGradient id="dsGreen">
          <stop offset="0" stopColor="#b8ffc9" stopOpacity="0.95" />
          <stop offset="0.5" stopColor="#3ddc6a" stopOpacity="0.45" />
          <stop offset="1" stopColor="#3ddc6a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="dsFlash">
          <stop offset="0" stopColor="#fff" />
          <stop offset="0.4" stopColor="#ffd9a0" stopOpacity="0.8" />
          <stop offset="1" stopColor="#ff7a30" stopOpacity="0" />
        </radialGradient>
        <filter id="dsGlow" x="-20%" y="-300%" width="140%" height="700%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <clipPath id="dsClip"><circle cx="230" cy="210" r="150" /></clipPath>
        <clipPath id="dsPClip"><circle cx="650" cy="210" r="55" /></clipPath>
        <pattern id="dsPanels" width="80" height="50" patternUnits="userSpaceOnUse">
          <path d="M0 0H80M0 25H80M0 0V25M40 0V25M20 25V50M60 25V50"
            stroke="#000" strokeOpacity="0.32" strokeWidth="1" fill="none" />
          <rect x="8" y="9" width="3" height="2" fill="#ffe7a3" fillOpacity="0.85" />
          <rect x="52" y="34" width="3" height="2" fill="#ffe7a3" fillOpacity="0.85" />
          <rect x="68" y="12" width="2" height="2" fill="#ffe7a3" fillOpacity="0.7" />
          <rect x="26" y="40" width="2" height="2" fill="#ffe7a3" fillOpacity="0.7" />
        </pattern>
      </defs>

      ${STARS.map((st, i) => html`<circle key=${i} className="ds-star" cx=${st.x} cy=${st.y} r=${st.s}
        style=${{ "--d": st.d + "s", "--w": st.w + "s" }} />`)}

      <g className="ds-planet">
        <circle cx="650" cy="210" r="55" fill="url(#dsPlanet)" />
        <g clipPath="url(#dsPClip)">
          <ellipse cx="635" cy="195" rx="22" ry="12" fill="#4fa86a" fillOpacity="0.85" />
          <ellipse cx="668" cy="228" rx="18" ry="9" fill="#4fa86a" fillOpacity="0.85" />
          <ellipse cx="640" cy="222" rx="28" ry="4" fill="#fff" fillOpacity="0.45" />
          <ellipse cx="660" cy="188" rx="24" ry="4" fill="#fff" fillOpacity="0.4" />
          <circle cx="650" cy="210" r="55" fill="url(#dsShade)" />
        </g>
      </g>

      <g>
        <circle cx="230" cy="210" r="150" fill="url(#dsBody)" />
        <g clipPath="url(#dsClip)">
          <rect className="ds-surface" x="0" y="60" width="480" height="300" fill="url(#dsPanels)" />
          <rect x="80" y="204" width="300" height="12" fill="#0b0d10" />
          <rect x="80" y="203" width="300" height="1.5" fill="#fff" fillOpacity="0.18" />
          <circle cx="230" cy="210" r="150" fill="url(#dsShade)" />
          <line className="ds-lights" x1="80" y1="210" x2="380" y2="210"
            stroke="#ffd98a" strokeWidth="2" strokeDasharray="2 9" />
        </g>
        <circle cx="230" cy="210" r="150" fill="none" stroke="#fff" strokeOpacity="0.15" strokeWidth="2" />

        <circle cx="290" cy="148" r="40" fill="#1c1f24" stroke="#586069" strokeWidth="3" />
        <circle cx="290" cy="148" r="29" fill="none" stroke="#3a4048" strokeWidth="2" />
        <circle cx="290" cy="148" r="18" fill="none" stroke="#3a4048" strokeWidth="2" />
        <g stroke="#3a4048" strokeWidth="2">
          ${[0, 60, 120, 180, 240, 300].map(a => html`<line key=${a} x1="290" y1="148" x2="330" y2="148"
            transform=${"rotate(" + a + " 290 148)"} />`)}
        </g>
        <circle className="ds-charge-glow" cx="290" cy="148" r="34" fill="url(#dsGreen)" />
        <circle className="ds-core" cx="290" cy="148" r="7" />
      </g>

      <g filter="url(#dsGlow)">
        <line className="ds-beam" x1="290" y1="148" x2="645" y2="208" pathLength="1"
          stroke="#7dffa0" strokeWidth="9" strokeLinecap="round" strokeDasharray="1" />
      </g>
      <line className="ds-beam" x1="290" y1="148" x2="645" y2="208" pathLength="1"
        stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeDasharray="1" />

      <g className="ds-fx">
        <circle className="ds-flash" cx="650" cy="210" r="90" fill="url(#dsFlash)" />
        <circle className="ds-ring" cx="650" cy="210" r="55" fill="none" stroke="#ffd9a0" strokeWidth="4" />
        <circle className="ds-ring ds-ring2" cx="650" cy="210" r="55" fill="none" stroke="#ff8a50" strokeWidth="3" />
        ${DEBRIS.map((b, i) => html`<circle key=${i} className="ds-debris" cx="650" cy="210" r=${b.s}
          style=${{ "--dx": b.dx + "px", "--dy": b.dy + "px" }} />`)}
      </g>
    </svg>

    <div className="ds-controls">
      <button type="button" className="btn btn-sw" aria-disabled=${phase !== "idle"} onClick=${fire}>${label}</button>
    </div>
  </div>`;
}

const mount = (id, C) => ReactDOM.createRoot(document.getElementById(id)).render(React.createElement(C));
mount("audio-root", HeaderTools);
mount("cursor-root", Cursor);
mount("palette-root", Palette);
mount("films-root", Films);
mount("deathstar-root", DeathStar);