import { auth, db } from "./firebase-config.js";
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

const welcomeMessage = document.getElementById("welcome-message");
const tipoTexto = document.getElementById("tipo-cuenta-texto");
const tqcBalance = document.getElementById("tqc-balance");
const container = document.getElementById("comercios-container");
const avisoTiempo = document.getElementById("aviso-tiempo");

const TIEMPO_ESPERA_MS = 5 * 60 * 60 * 1000; // 5 horas
const tipoCuenta = localStorage.getItem("tipoCuenta");

let usuarioActual = null;

onAuthStateChanged(auth, async (user) => {
  if (!user || !user.uid) {
    alert("No has iniciado sesión.");
    window.location.href = "registro.html";
    return;
  }

  try {
    usuarioActual = user;
    const userRef = doc(db, "usuarios", user.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      alert("Usuario no encontrado.");
      return;
    }

    const userData = userDoc.data();
    welcomeMessage.textContent = `Bienvenido, ${userData.nombre || "Usuario"} ${userData.apellido || ""}`;
    tipoTexto.textContent = `Estás usando la plataforma como: ${tipoCuenta || "usuario"}`;

    // Sumamos todos los TqC ganados por comercio
    const totalTqc = Object.values(userData.tqcPorComercio || {}).reduce((sum, val) => sum + val, 0);
    tqcBalance.textContent = `Tienes (${totalTqc}) TqC`;

    const ultimaTarea = userData.timestampUltimaTarea?.toMillis() || 0;
    const tiempoTranscurrido = Date.now() - ultimaTarea;
    const tiempoRestante = TIEMPO_ESPERA_MS - tiempoTranscurrido;
    const tareasCompletadas = userData.tareasCompletadas || [];
    const localidadUsuario = userData.localidad || null;

    if (tiempoTranscurrido >= TIEMPO_ESPERA_MS) {
      await updateDoc(userRef, { tareasCompletadas: [] });
      avisoTiempo.textContent = "✅ Podés recibir nuevas tareas ahora.";
      cargarComercios([], localidadUsuario);
    } else {
      const horas = Math.floor(tiempoRestante / (1000 * 60 * 60));
      const minutos = Math.floor((tiempoRestante % (1000 * 60 * 60)) / (1000 * 60));
      avisoTiempo.textContent = `⏳ Volvé en ${horas}h ${minutos}m para nuevas tareas.`;
      cargarComercios(tareasCompletadas, localidadUsuario);
    }
  } catch (err) {
    console.error("Error al obtener datos del usuario:", err);
  }
});

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
            comercioNombre: comercio.nombre,
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

container.addEventListener("click", async (e) => {
  if (e.target.classList.contains("btn-tarea")) {
    const link = e.target.dataset.link;
    const recompensa = parseInt(e.target.dataset.recompensa);
    const comercioUid = e.target.dataset.comercio;
    const tareaId = e.target.dataset.tarea;

    if (!link || !comercioUid || !tareaId || isNaN(recompensa)) return;

    window.open(link, "_blank");
    alert("Se abrió la tarea. Esperá 30 segundos para obtener la recompensa...");

    setTimeout(async () => {
      const userRef = doc(db, "usuarios", usuarioActual.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        const tareas = data.tareasCompletadas || [];
        const tqcPorComercio = data.tqcPorComercio || {};

        const yaHecha = tareas.some(t => t.comercioUid === comercioUid && t.tareaId === tareaId);
        if (yaHecha) return alert("Ya realizaste esta tarea.");

        const saldoActual = tqcPorComercio[comercioUid] || 0;
        const nuevoSaldo = saldoActual + recompensa;

        tareas.push({ comercioUid, tareaId });

        await updateDoc(userRef, {
          [`tqcPorComercio.${comercioUid}`]: nuevoSaldo,
          tareasCompletadas: tareas,
          timestampUltimaTarea: new Date()
        });

        alert(`✅ ¡Ganaste ${recompensa} TqC! Tu nuevo saldo en este comercio es ${nuevoSaldo}`);
        location.reload();
      }
    }, 30000);
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

