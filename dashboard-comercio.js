import { verificarSesion } from './verificar-sesion.js';
verificarSesion();

import { auth, db } from "./firebase-config.js";
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import {
  doc,
  getDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

const welcomeMessage = document.getElementById("welcome-message");
const comercioInfo = document.getElementById("comercio-info");
const form = document.getElementById("tareas-form");
const camposContainer = document.getElementById("campos-tareas");
const estadoGuardado = document.getElementById("estado-guardado");

let comercioDocRef = null;
let tareasExistentes = [];
const MAX_TAREAS = 10;
const TIEMPO_VIDA_MS = 5 * 24 * 60 * 60 * 1000;
const RECOMPENSA_PREDETERMINADA = 1;

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("No has iniciado sesión.");
    window.location.href = "login.html";
    return;
  }

  comercioDocRef = doc(db, "comercios", user.uid);
  const snap = await getDoc(comercioDocRef);

  if (!snap.exists()) {
    alert("Comercio no registrado.");
    return;
  }

  const data = snap.data();
  welcomeMessage.textContent = `Bienvenido, ${data.nombre || "Comercio"}`;
  comercioInfo.textContent = `📍 ${data.localidad}, ${data.provincia}`;

  tareasExistentes = (data.tasks || []).filter((t) => {
    const ts = t.timestamp?.toMillis ? t.timestamp.toMillis() : t.timestamp;
    return Date.now() - ts < TIEMPO_VIDA_MS;
  });

  mostrarCamposTareas(tareasExistentes);
});

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
    input.classList.add("link-input");

    if (i === 0) {
      input.placeholder = "🔗 Ingresá el perfil de tu comercio en Google Maps";
      const desc = document.createElement("p");
      desc.textContent = "💡 Consejo: Añadí aquí tu link de Google Maps para que tus clientes te encuentren más fácilmente y mejorar tu visibilidad local.";
      desc.style.fontStyle = "italic";
      desc.style.fontSize = "0.9em";
      camposContainer.appendChild(desc);
    } else {
      input.placeholder = `Nuevo link (${i + 1})`;
    }

    camposContainer.appendChild(input);
  }
}

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
    location.reload();
  } catch (err) {
    console.error("Error al guardar tareas:", err);
    estadoGuardado.textContent = "❌ Error al guardar tareas.";
  }
});

document.getElementById("cerrar-sesion").addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "registro.html";
});
