// dashboard-comercio.js
// Dashboard para comercios (usuarios que gestionan tareas de marketing)

import { verificarSesion } from './verificar-sesion.js';
import { auth, db } from './firebase-config.js';
import {
  signOut
} from 'https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js';
import {
  doc,
  getDoc,
  updateDoc
} from 'https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js';

// Elementos del DOM
const welcomeMessage = document.getElementById("welcome-message");
const comercioInfo = document.getElementById("comercio-info");
const form = document.getElementById("tareas-form");
const camposContainer = document.getElementById("campos-tareas");
const estadoGuardado = document.getElementById("estado-guardado");

const MAX_TAREAS = 10;
const TIEMPO_VIDA_MS = 5 * 24 * 60 * 60 * 1000; // 5 días
const RECOMPENSA_PREDETERMINADA = 1;

let comercioDocRef = null;
let tareasExistentes = [];

// Verificar sesión antes de cargar la página
verificarSesion().then(async ({ user, tipoCuenta, data }) => {
  if (tipoCuenta !== "comercio") {
    console.warn("Tipo de cuenta incorrecto, redirigiendo...");
    window.location.href = "dashboard-usuario.html";
    return;
  }

  comercioDocRef = doc(db, "comercios", user.uid);

  welcomeMessage.textContent = `Bienvenido, ${data.nombre || "Comercio"}`;
  comercioInfo.textContent = `📍 ${data.localidad}, ${data.provincia}`;

  tareasExistentes = (data.tasks || []).filter((tarea) => {
    const ts = tarea.timestamp?.toMillis ? tarea.timestamp.toMillis() : tarea.timestamp;
    return Date.now() - ts < TIEMPO_VIDA_MS;
  });

  mostrarCamposTareas(tareasExistentes);

}).catch(() => {
  // No hacemos nada, ya redirige internamente si no hay sesión
});

// Función para mostrar los campos de tareas
function mostrarCamposTareas(tareasActivas) {
  camposContainer.innerHTML = "";

  tareasActivas.forEach((tarea, i) => {
    const p = document.createElement("p");
    p.innerHTML = `✅ Tarea ${i + 1}: <a href="${tarea.link}" target="_blank">${tarea.link}</a> (${tarea.recompensa} TqC)`;
    camposContainer.appendChild(p);
  });

  const espaciosLibres = MAX_TAREAS - tareasActivas.length;
  for (let i = 0; i < espaciosLibres; i++) {
    const input = document.createElement("input");
    input.type = "url";
    input.placeholder = `Nuevo link (${i + 1})`;
    input.classList.add("link-input");
    camposContainer.appendChild(input);
  }
}

// Guardar nuevas tareas
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const inputs = document.querySelectorAll(".link-input");

  const nuevasTareas = [];

  for (const input of inputs) {
    const url = input.value.trim();
    if (!url) continue;

    const tareaId = `tarea-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const landingLink = `https://fedezam.github.io/trueque/landing.html?uid=${comercioDocRef.id}&tarea=${tareaId}&goto=${encodeURIComponent(url)}`;

    nuevasTareas.push({
      id: tareaId,
      link: landingLink,
      linkOriginal: url,
      recompensa: RECOMPENSA_PREDETERMINADA,
      timestamp: Date.now()
    });
  }

  if (nuevasTareas.length === 0) {
    estadoGuardado.textContent = "❗ Ingresá al menos un nuevo link válido.";
    return;
  }

  try {
    const nuevas = [...tareasExistentes, ...nuevasTareas].slice(0, MAX_TAREAS);
    await updateDoc(comercioDocRef, { tasks: nuevas });
    estadoGuardado.textContent = "✅ Tareas guardadas correctamente.";
    setTimeout(() => window.location.reload(), 1000);
  } catch (err) {
    console.error("Error al guardar tareas:", err);
    estadoGuardado.textContent = "❌ Error al guardar tareas.";
  }
});

// Cerrar sesión
document.getElementById("cerrar-sesion")?.addEventListener("click", async () => {
  try {
    await signOut(auth);
    window.location.href = "registro.html";
  } catch (err) {
    console.error("Error al cerrar sesión:", err);
  }
});


