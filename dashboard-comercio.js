// Importar verificación de sesión y Firebase
import { verificarSesion } from './verificar-sesion.js';
import { auth, db } from './firebase-config.js';
import {
  onAuthStateChanged,
  signOut
} from 'https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js';
import {
  doc,
  getDoc,
  updateDoc
} from 'https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js';

// Elementos del DOM
const welcomeMessage = document.getElementById('welcome-message');
const infoComercio = document.getElementById('info-comercio');
const formTareas = document.getElementById('tareas-form');
const camposContainer = document.getElementById('campos-tareas');
const estadoGuardado = document.getElementById('estado-guardado');

const MAX_TAREAS = 10; // Máximo de tareas activas
const TIEMPO_VIDA_MS = 5 * 24 * 60 * 60 * 1000; // 5 días en milisegundos
const RECOMPENSA_PREDETERMINADA = 1; // Recompensa fija por tarea
let comercioDocRef = null;
let tareasExistentes = [];

verificarSesion(); // Verificar sesión apenas carga

// Manejar estado del usuario autenticado
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("Debés iniciar sesión.");
    return window.location.href = 'login.html';
  }

  comercioDocRef = doc(db, "comercios", user.uid);

  try {
    const snap = await getDoc(comercioDocRef);

    if (!snap.exists()) {
      alert("Datos del comercio no encontrados.");
      return window.location.href = 'completar-perfil-comercio.html';
    }

    const data = snap.data();
    welcomeMessage.textContent = `Bienvenido, ${data.nombreComercio || "Tu Comercio"}`;
    infoComercio.textContent = `📍 ${data.localidad || ""}, ${data.provincia || ""} | Rubro: ${data.rubro || "Sin rubro definido"}`;

    tareasExistentes = (data.tasks || []).filter((t) => {
      const ts = t.timestamp?.toMillis ? t.timestamp.toMillis() : t.timestamp;
      return Date.now() - ts < TIEMPO_VIDA_MS;
    });

    mostrarCamposTareas(tareasExistentes);

  } catch (err) {
    console.error("Error al cargar datos del comercio:", err);
    alert("Ocurrió un error. Por favor, intenta nuevamente.");
  }
});

// Mostrar tareas actuales + campos nuevos
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
formTareas.addEventListener("submit", async (e) => {
  e.preventDefault();
  const inputs = document.querySelectorAll(".link-input");
  const nuevasTareas = [];

  inputs.forEach(input => {
    const url = input.value.trim();
    if (url) {
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
  });

  if (nuevasTareas.length === 0) {
    estadoGuardado.textContent = "❗ Debes ingresar al menos un link válido.";
    return;
  }

  try {
    const nuevas = [...tareasExistentes, ...nuevasTareas].slice(0, MAX_TAREAS);
    await updateDoc(comercioDocRef, { tasks: nuevas });
    estadoGuardado.textContent = "✅ Tareas guardadas exitosamente.";
    setTimeout(() => location.reload(), 1500);
  } catch (err) {
    console.error("Error al guardar tareas:", err);
    estadoGuardado.textContent = "❌ Error al guardar tareas. Intentalo de nuevo.";
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

