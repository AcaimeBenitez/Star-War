
"use strict";

const menu = document.querySelector(".sidebar");
const botonMenu = document.querySelector("#mobile-menu-toggle");

botonMenu.addEventListener("click", () => {
    const abierto = menu.classList.toggle("is-open");

    botonMenu.setAttribute("aria-expanded", abierto);

    botonMenu.textContent = abierto
        ? "✕ Cerrar menú"
        : "☰ Menú y ajustes";
});
