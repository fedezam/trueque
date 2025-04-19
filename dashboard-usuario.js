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

onAuthStateChanged(auth, async (user) => {
  if (!user || !user.uid) {
    alert("No has iniciado sesión.");
    window.location.href = "registro.html";
    return;
  }

  try {
    const userRef = doc(db, "usuarios", user.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      alert("Usuario no encontrado.");
      return;
    }

    const userData = userDoc.data();
    welcomeMessage.textContent = `Bienvenido, ${userData.nombre || "Usuario"} ${userData.apellido || ""}`;
    tipoTexto.textContent = `Estás usando la plataforma como: ${tipoCuenta || "usuario"}`;
    tqcBalance.textContent = `Tienes (${userData.tqc || 0}) TqC`;

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

async function cargarComercios(tareasCompletadas, localidadUsuario) {
  try {
    const comerciosSnap = await getDocs(collection(db, "comercios"));
    container.innerHTML = "";

    comerciosSnap.forEach((docSnap) => {
      const comercio = docSnap.data();

      // Filtra por localidad y tareas ya completadas
      if (
        comercio.localidad === localidadUsuario &&
        !tareasCompletadas.includes(comercio.uid)
      ) {
        const card = document.createElement("div");
        card.classList.add("tarea-card");
        card.innerHTML = `
          <h3>${comercio.nombre}</h3>
          <p>📍 ${comercio.localidad}, ${comercio.provincia}</p>
          <p>🏷️ Rubro: ${comercio.rubro || "No especificado"}</p>
          <p>🪙 Recompensa: 1 TqC</p>
          <button>Realizar tarea</button>
        `;
        container.appendChild(card);
      }
    });

    if (container.innerHTML === "") {
      container.innerHTML = "<p>🚫 No hay tareas disponibles en tu localidad por ahora.</p>";
    }
  } catch (err) {
    console.error("Error al cargar tareas:", err);
    container.innerHTML = "<p>Error al mostrar tareas disponibles.</p>";
  }
}

// Cerrar sesión
document.getElementById("cerrar-sesion").addEventListener("click", async () => {
  try {
    await signOut(auth);
    window.location.href = "registro.html";
  } catch (err) {
    console.error("Error al cerrar sesión:", err);
  }
});
