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
const cerrarSesionBtn = document.getElementById("cerrar-sesion");

// Variables de control
let usuarioActual = null;
let tareaEnCurso = false;
const TIEMPO_ESPERA_MS = 5 * 60 * 60 * 1000; // 5 horas

// Verificar sesión y cargar datos
verificarSesion().then(async ({ user, tipoCuenta, data }) => {
  usuarioActual = user;

  welcomeMessage.textContent = `Bienvenido, ${data.nombre || "Usuario"} ${data.apellido || ""}`;
  tipoTexto.textContent = `Estás usando la plataforma como: ${tipoCuenta}`;
  
  const totalTqc = Object.values(data.tqcPorComercio || {}).reduce((sum, val) => sum + val, 0);
  tqcBalance.textContent = `Tienes (${totalTqc}) TqC`;

  const ultimaTarea = data.timestampUltimaTarea?.toMillis?.() || data.timestampUltimaTarea || 0;
  const tiempoTranscurrido = Date.now() - ultimaTarea;
  const tiempoRestante = TIEMPO_ESPERA_MS - tiempoTranscurrido;
  const tareasCompletadas = data.tareasCompletadas || [];
  const localidadUsuario = data.localidad || null;

  if (tiempoTranscurrido >= TIEMPO_ESPERA_MS) {
    await updateDoc(doc(db, "usuarios", user.uid), { tareasCompletadas: [] });
    avisoTiempo.textContent = "✅ Podés recibir nuevas tareas ahora.";
    cargarTareas([], localidadUsuario);
  } else {
    const horas = Math.floor(tiempoRestante / (1000 * 60 * 60));
    const minutos = Math.floor((tiempoRestante % (1000 * 60 * 60)) / (1000 * 60));
    avisoTiempo.textContent = `⏳ Volvé en ${horas}h ${minutos}m para nuevas tareas.`;
    cargarTareas(tareasCompletadas, localidadUsuario);
  }
}).catch(() => {
  // Si falla la verificación, la función ya redirige a inicio
});

// Función para cargar tareas disponibles
async function cargarTareas(tareasCompletadas = [], localidadUsuario) {
  try {
    container.innerHTML = "";
    const comerciosSnap = await getDocs(collection(db, "comercios"));
    const tareasDisponibles = [];

    comerciosSnap.forEach((docSnap) => {
      const comercio = docSnap.data();
      const comercioUid = docSnap.id;

      if (comercio.localidad === localidadUsuario && Array.isArray(comercio.tasks)) {
        const nuevasTareas = comercio.tasks.filter(tarea =>
          !tareasCompletadas.some(tc => tc.comercioUid === comercioUid && tc.tareaId === tarea.id)
        );
        nuevasTareas.forEach(tarea => {
          tareasDisponibles.push({
            ...tarea,
            comercioUid,
            comercioNombre: comercio.nombre,
            localidad: comercio.localidad,
            provincia: comercio.provincia,
            rubro: comercio.rubro || "No especificado"
          });
        });
      }
    });

    // Mostrar máximo 5 tareas aleatorias
    const seleccionadas = tareasDisponibles.sort(() => 0.5 - Math.random()).slice(0, 5);

    if (seleccionadas.length === 0) {
      container.innerHTML = "<p>🚫 No hay tareas disponibles en tu localidad en este momento.</p>";
      return;
    }

    seleccionadas.forEach((tarea) => {
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
    container.innerHTML = "<p>❌ Error al mostrar tareas. Intenta más tarde.</p>";
  }
}

// Manejar clicks en las tareas
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

  // Desactivar todos los botones temporalmente
  document.querySelectorAll(".btn-tarea").forEach(btn => {
    btn.disabled = true;
    if (btn !== button) {
      btn.textContent = "⏳ Espera para realizar otra tarea";
    }
  });

  // Abrir nueva pestaña con el link
  window.open(link, "_blank");

  let tiempoRestante = 60; // 60 segundos de espera
  const intervalo = setInterval(() => {
    button.textContent = `⏳ Espera ${tiempoRestante}s...`;
    tiempoRestante--;
    if (tiempoRestante < 0) clearInterval(intervalo);
  }, 1000);

  setTimeout(async () => {
    try {
      const userRef = doc(db, "usuarios", usuarioActual.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        const tareas = data.tareasCompletadas || [];
        const tqcPorComercio = data.tqcPorComercio || {};

        const yaHecha = tareas.some(t => t.comercioUid === comercioUid && t.tareaId === tareaId);
        if (yaHecha) {
          tareaEnCurso = false;
          clearInterval(intervalo);
          button.textContent = "Realizar tarea";
          return;
        }

        const nuevoSaldo = (tqcPorComercio[comercioUid] || 0) + recompensa;
        tareas.push({ comercioUid, tareaId });

        await updateDoc(userRef, {
          [`tqcPorComercio.${comercioUid}`]: nuevoSaldo,
          tareasCompletadas: tareas,
          timestampUltimaTarea: new Date()
        });

        // Actualizar balance
        const nuevoTotal = Object.values(tqcPorComercio).reduce((acc, val) => acc + val, 0) + recompensa;
        tqcBalance.textContent = `Tienes (${nuevoTotal}) TqC`;

        // Remover tarea visualmente
        const card = button.closest(".tarea-card");
        if (card) {
          card.style.backgroundColor = "#d4edda";
          card.innerHTML = "<p>✅ Tarea completada. ¡Buen trabajo!</p>";
          setTimeout(() => card.remove(), 2000);
        }
      }

    } catch (err) {
      console.error("Error al procesar tarea:", err);
      alert("Ocurrió un error al completar la tarea. Intenta nuevamente.");
    } finally {
      clearInterval(intervalo);
      tareaEnCurso = false;
      document.querySelectorAll(".btn-tarea").forEach(btn => {
        btn.disabled = false;
        btn.textContent = "Realizar tarea";
      });
    }
  }, 60000); // Fin de 1 minuto
});

// Cerrar sesión
cerrarSesionBtn.addEventListener("click", async () => {
  try {
    await signOut(auth);
    window.location.href = "registro.html";
  } catch (err) {
    console.error("Error al cerrar sesión:", err);
    alert("No se pudo cerrar la sesión correctamente.");
  }
});

