/* Galaxia SW · React 18 + htm · MIT
   React solo se usa en las partes interactivas; el resto es HTML normal en index.html. */
'use strict';
const { useState, useEffect, useRef } = React;
const html = htm.bind(React.createElement);
const say = msg => { document.getElementById("status").textContent = msg; };

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

/* 1) Cursor: sable azul o rojo (también colorea todos los botones) */
function Cursor() {
  const [saber, setSaber] = useState("blue");
  useEffect(() => { document.documentElement.dataset.saber = saber; }, [saber]);
  return html`<${Choices} current=${saber} onPick=${setSaber}
    options=${[["blue", "Azul"], ["red", "Rojo"]]} />`;
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
                  <img src=${f.img} alt=${f.alt} width="400" height="225" loading="lazy" />
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

const mount = (id, C) => ReactDOM.createRoot(document.getElementById(id)).render(React.createElement(C));
mount("audio-root", HeaderTools);
mount("cursor-root", Cursor);
mount("palette-root", Palette);
mount("films-root", Films);