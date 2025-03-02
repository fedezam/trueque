import { auth, db } from "./firebase-config.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import { collection, getDocs, doc, getDoc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

const welcomeMessage = document.getElementById("welcome-message");
const tqcBalance = document.getElementById("tqc-balance");
const container = document.getElementById("comercios-container");
const avisoTiempo = document.createElement("p");
avisoTiempo.id = "aviso-tiempo";
container.before(avisoTiempo);

const TIEMPO_ESPERA_MS = 5 * 60 * 60 * 1000; // 5 horas en milisegundos

// Detectar usuario autenticado y cargar datos
onAuthStateChanged(auth, async (user) => {
    if (user && user.uid) {
        try {
            console.log("🔍 Usuario autenticado:", user);
            if (!db) throw new Error("Firestore no está inicializado correctamente.");
            
            const userRef = doc(db, "usuarios", user.uid);
            const userDoc = await getDoc(userRef);
            
            if (userDoc.exists()) {
                const userData = userDoc.data();
                welcomeMessage.textContent = `Bienvenido, ${userData.nombre || 'Usuario'}`;
                tqcBalance.textContent = `Tienes (${userData.tqc || 0}) TqC`;
                
                const ultimaTarea = userData.timestampUltimaTarea?.toMillis() || 0;
                const tiempoTranscurrido = Date.now() - ultimaTarea;
                const tiempoRestante = TIEMPO_ESPERA_MS - tiempoTranscurrido;
                
                if (tiempoTranscurrido >= TIEMPO_ESPERA_MS) {
                    await updateDoc(userRef, { tareasCompletadas: [] }); // Resetear tareas completadas
                    avisoTiempo.textContent = "Puedes recibir nuevas tareas ahora.";
                    cargarComercios([]);
                } else {
                    const horas = Math.floor(tiempoRestante / (1000 * 60 * 60));
                    const minutos = Math.floor((tiempoRestante % (1000 * 60 * 60)) / (1000 * 60));
                    avisoTiempo.textContent = `Vuelve en ${horas}h ${minutos}m para recibir nuevas tareas.`;
                    cargarComercios(userData.tareasCompletadas || []);
                }
            } else {
                console.warn("⚠️ No se encontraron datos del usuario en Firestore.");
                cargarComercios([]);
            }
        } catch (error) {
            console.error("❌ Error obteniendo datos del usuario:", error);
        }
    } else {
        console.warn("⚠️ No hay usuario autenticado o falta UID.");
        alert("No has iniciado sesión.");
        window.location.href = "registro.html";
    }
});
