// dashboard-usuario.js
// Dashboard para usuarios normales (NO comercios)

import { verificarSesion } from './verificar-sesion.js';
import { auth, db } from './firebase-config.js';
import {
  signOut
} from 'https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js';
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc
} from 'https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js';

// Elementos del DOM
const welcomeMessage = document.getElementById("welcome-message");
const tipoTexto = document.getElementById("tipo-cuenta-texto");
const tqcBalance = document.getElementById("tqc-balance");
const container = document.getElementById("comercios-container");
const avisoTiempo = document.getElementById("aviso-tiempo");

const TIEMPO_ESPERA_MS = 5 * 60 * 60 * 1000; // 5 horas
let usuarioActual = null;
let tareaEnCurso = false;

// Verificar sesión antes de cargar la página
verificarSesion().then(async ({ user, tipoCuenta, data }) => {
  if (tipoCuenta !== "usuario") {
    console.warn("Tipo de cuenta incorrecto, redirigiendo...");
    window.location.href = "dashboard-comercio.html";
    return;
  }

  usuarioActual = user;

  welcomeMessage.textContent = `Bienvenido, ${data.nombre || "Usuario"} ${data.apellido || ""}`;
  tipoTexto.textContent = `Estás usando la plataforma como: ${tipoCuenta}`;

  const totalTqc = Object.values(data.tqcPorComercio || {}).reduce((sum, val) => sum + val, 0);
  tqcBalance.textContent = `Tienes (${totalTqc}) TqC`;

  const ultimaTarea = data.timestampUltimaTarea?.toMillis?.() || data.timestampUltimaTarea || 0;
  const tiempoTranscurrido = Date.now() - ultimaTarea;
  const tareasCompletadas = data.tareasCompletadas || [];
  const localidadUsuario = data.localidad || null;

  if (tiempoTranscurrido >= TIEMPO_ESPERA_MS) {
    await updateDoc(doc(db, "usuarios", user.uid), { tareasCompletadas: [] });
    avisoTiempo.textContent = "✅ Podés recibir nuevas tareas ahora.";
    cargarComercios([], localidadUsuario);
  } else {
    const horas = Math.floor(tiempoTranscurrido / (1000 * 60 * 60));
    const minutos = Math.floor((tiempoTranscurrido % (1000 * 60 * 60)) / (1000 * 60));
    avisoTiempo.textContent = `⏳ Volvé en ${horas}h ${minutos}m para nuevas tareas.`;
    cargarComercios(tareasCompletadas, localidadUsuario);
  }

}).catch(() => {
  // Ya redirige adentro de verificarSesion, no hacemos nada extra aquí
});

// Función para cargar las tareas disponibles
async function cargarComercios(tareasCompletadas = [], localidadUsuario) {
  try {
    const comerciosSnap = await getDocs(collection(db, "comercios"));
    container.innerHTML = "";

    const tareasDisponibles = [];

    comerciosSnap.forEach((docSnap) => {
      const comercio = docSnap.data();
      const comercioUid = docSnap.id;

      if (comercio.localidad === localidadUsuario && Array.isArray(comercio.tasks)) {
        const tareasValidas = comercio.tasks.filter(tarea =>
          !tareasCompletadas.some(tc => tc.comercioUid === comercioUid && tc.tareaId === tarea.id)
        );

        tareasValidas.forEach(tarea => {
          tareasDisponibles.push({
            ...tarea,
            comercioUid,
            comercioNombre: comercio.nombreComercio,
            localidad: comercio.localidad,
            provincia: comercio.provincia,
            rubro: comercio.rubro || "No especificado"
          });
        });
      }
    });

    const aleatorias = tareasDisponibles.sort(() => 0.5 - Math.random()).slice(0, 5);

    if (aleatorias.length === 0) {
      container.innerHTML = "<p>🚫 No hay tareas disponibles en tu localidad por ahora.</p>";
      return;
    }

    aleatorias.forEach((tarea) => {
      const card = document.createElement("div");
      card.classList.add("tarea-card");
      card.innerHTML = `
        <h3>${tarea.comercioNombre}</h3>
        <p>📍 ${tarea.localidad}, ${tarea.provincia}</p>
        <p>🏷️ Rubro: ${tarea.rubro}</p>
        <p>🪙 Recompensa: ${tarea.recompensa} TqC</p>
        <button class="btn-tarea"
          data-link="${tarea.link}"
          data-recompensa="${tarea.recompensa}"
          data-comercio="${tarea.comercioUid}"
          data-tarea="${tarea.id}">
          Realizar tarea
        </button>
      `;
      container.appendChild(card);
    });

  } catch (err) {
    console.error("Error al cargar tareas:", err);
    container.innerHTML = "<p>Error al mostrar tareas disponibles.</p>";
  }
}

// Manejo de click en botones de tareas
container.addEventListener("click", async (e) => {
  if (!e.target.classList.contains("btn-tarea") || tareaEnCurso) return;

  tareaEnCurso = true;

  const button = e.target;
  const link = button.dataset.link;
  const recompensa = parseInt(button.dataset.recompensa);
  const comercioUid = button.dataset.comercio;
  const tareaId = button.dataset.tarea;

  if (!link || !comercioUid || !tareaId || isNaN(recompensa)) {
    tareaEnCurso = false;
    return;
  }

  window.open(link, "_blank");

  const botones = document.querySelectorAll(".btn-tarea");
  botones.forEach(btn => {
    btn.disabled = true;
    if (btn !== button) {
      btn.textContent = "⏳ Espera antes de hacer otra tarea";
    }
  });

  let tiempoRestante = 60;
  const originalText = button.textContent;
  const intervalo = setInterval(() => {
    button.textContent = `⏳ Espera ${tiempoRestante}s`;
    tiempoRestante--;
    if (tiempoRestante < 0) clearInterval(intervalo);
  }, 1000);

  setTimeout(async () => {
    const userRef = doc(db, "usuarios", usuarioActual.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const data = userSnap.data();
      const tareas = data.tareasCompletadas || [];
      const tqcPorComercio = data.tqcPorComercio || {};

      if (!tareas.some(t => t.comercioUid === comercioUid && t.tareaId === tareaId)) {
        const nuevoSaldo = (tqcPorComercio[comercioUid] || 0) + recompensa;
        tareas.push({ comercioUid, tareaId });

        await updateDoc(userRef, {
          [`tqcPorComercio.${comercioUid}`]: nuevoSaldo,
          tareasCompletadas: tareas,
          timestampUltimaTarea: new Date()
        });

        tqcBalance.textContent = `Tienes (${Object.values(tqcPorComercio).reduce((sum, val) => sum + val, recompensa)}) TqC`;

        const card = button.closest(".tarea-card");
        if (card) {
          card.style.backgroundColor = "#d4edda";
          card.innerHTML = "<p>✅ Tarea completada. ¡Felicitaciones!</p>";
          setTimeout(() => card.remove(), 2000);
        }
      }
    }

    document.querySelectorAll(".btn-tarea").forEach(btn => {
      btn.disabled = false;
      btn.textContent = "Realizar tarea";
    });

    clearInterval(intervalo);
    tareaEnCurso = false;

  }, 60000);
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

