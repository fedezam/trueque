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
const TIEMPO_VIDA_MS = 5 * 24 * 60 * 60 * 1000; // 5 días en ms

onAuthStateChanged(auth, async (user) => {
  if (!user || !user.uid) {
    alert("No has iniciado sesión.");
    window.location.href = "registro.html";
    return;
  }

  try {
    comercioDocRef = doc(db, "comercios", user.uid);
    const comercioSnap = await getDoc(comercioDocRef);

    if (!comercioSnap.exists()) {
      alert("Este comercio no tiene datos registrados.");
      return;
    }

    const data = comercioSnap.data();
    welcomeMessage.textContent = `Bienvenido, ${data.nombre || "Comercio"}`;
    comercioInfo.textContent = `📍 ${data.localidad}, ${data.provincia}`;

    tareasExistentes = (data.tasks || []).filter((t) => {
      const ts = t.timestamp?.toMillis ? t.timestamp.toMillis() : t.timestamp;
      return Date.now() - ts < TIEMPO_VIDA_MS;
    });

    mostrarCamposTareas(tareasExistentes);
  } catch (err) {
    console.error("Error al cargar datos del comercio:", err);
  }
});

function mostrarCamposTareas(tareasActivas) {
  camposContainer.innerHTML = "";

  // Mostrar tareas activas como texto (no editables)
  tareasActivas.forEach((tarea, idx) => {
    const p = document.createElement("p");
    p.innerHTML = `✅ Tarea ${idx + 1}: <a href="${tarea.link}" target="_blank">${tarea.link}</a> (vigente)`;
    camposContainer.appendChild(p);
  });

  // Mostrar inputs vacíos para nuevas tareas
  const espaciosLibres = MAX_TAREAS - tareasActivas.length;
  for (let i = 0; i < espaciosLibres; i++) {
    const input = document.createElement("input");
    input.type = "url";
    input.placeholder = `Nuevo link (${i + 1})`;
    input.classList.add("link-input");
    camposContainer.appendChild(input);
  }
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const inputs = document.querySelectorAll(".link-input");
  const nuevasTareas = [];

  inputs.forEach((input) => {
    const link = input.value.trim();
    if (link) {
      nuevasTareas.push({
        id: `tarea-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        link,
        recompensa: null,
        timestamp: Date.now()
      });
    }
  });

  if (nuevasTareas.length === 0) {
    estadoGuardado.textContent = "❗ Ingresá al menos un nuevo link válido.";
    return;
  }

  const nuevasTasksFinales = [...tareasExistentes, ...nuevasTareas].slice(0, MAX_TAREAS);

  try {
    await updateDoc(comercioDocRef, { tasks: nuevasTasksFinales });
    estadoGuardado.textContent = "✅ Nuevas tareas guardadas correctamente.";
    location.reload();
  } catch (err) {
    console.error("Error al guardar nuevas tareas:", err);
    estadoGuardado.textContent = "❌ Error al guardar nuevas tareas.";
  }
});

// Cerrar sesión
document.getElementById("cerrar-sesion").addEventListener("click", async () => {
  try {
    await signOut(auth);
    window.location.href = "registro.html";
  } catch (err) {
    console.error("Error al cerrar sesión:", err);
  }
});
