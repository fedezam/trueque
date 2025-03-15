// Importar Firebase correctamente
import { auth, db } from "./firebase-config.js";
import { 
    onAuthStateChanged, 
    getAuth 
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";

import { 
    collection, 
    doc, 
    getDoc, 
    getDocs, 
    updateDoc 
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

// Elementos del DOM
const welcomeMessage = document.getElementById("welcome-message");
const tqcBalance = document.getElementById("tqc-balance");
const tasksContainer = document.getElementById("tasks-container");

// Detectar usuario autenticado
onAuthStateChanged(auth, async (user) => {
    if (user) {
        try {
            console.log("🔍 Usuario autenticado:", user);
            const userRef = doc(db, "usuarios", user.uid);
            const userDoc = await getDoc(userRef);

            if (userDoc.exists()) {
                const userData = userDoc.data();
                welcomeMessage.textContent = `Bienvenido, ${userData.nombre || 'Usuario'}`;
                tqcBalance.textContent = `Tienes (${userData.tqc || 0}) TqC`;

                // Cargar las tareas
                cargarTareas();
            }
        } catch (error) {
            console.error("❌ Error obteniendo datos del usuario:", error);
        }
    } else {
        alert("No has iniciado sesión.");
        window.location.href = "registro.html";
    }
});

// Cargar tareas desde Firestore
async function cargarTareas() {
    try {
        const tasksRef = collection(db, "clientes");
        const tasksSnapshot = await getDocs(tasksRef);

        let tasksArray = [];
        tasksSnapshot.forEach((doc) => {
            const clientData = doc.data();
            if (clientData.enlace) {
                tasksArray.push({
                    nombre: clientData.nombre,
                    enlace: clientData.enlace,
                    tqc: clientData.asignedTQC
                });
            }
        });

        // Mostrar solo 3 tareas aleatorias
        tasksArray = tasksArray.sort(() => Math.random() - 0.5).slice(0, 3);

        tasksContainer.innerHTML = ""; // Limpiar contenedor antes de agregar nuevas tareas

        tasksArray.forEach(task => {
            tasksContainer.innerHTML += `
                <div class="task-item">
                    <a href="${task.enlace}" target="_blank" onclick="marcarVisita('${task.nombre}', '${task.tqc}')">
                        📌 DALE TU APOYO A ${task.nombre}
                    </a>
                </div>
            `;
        });

        recargarLinkvertise(); // 🔥 Recargar script de Linkvertise
    } catch (error) {
        console.error("❌ Error cargando tareas:", error);
    }
}

// 🔥 RECARGAR EL SCRIPT DE LINKVERTISE 🔥
function recargarLinkvertise() {
    const script = document.createElement("script");
    script.src = "https://publisher.linkvertise.com/cdn/linkvertise.js";
    document.body.appendChild(script);
}

// Verificar la visita al enlace
async function marcarVisita(nombre, tqc) {
    try {
        alert(`¡Visita verificada! Ganaste ${tqc} TqC por apoyar a ${nombre}.`);

        const userRef = doc(db, "usuarios", auth.currentUser.uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
            const userData = userDoc.data();
            const newTqc = (userData.tqc || 0) + tqc;

            await updateDoc(userRef, {
                tqc: newTqc
            });

            tqcBalance.textContent = `Tienes (${newTqc}) TqC`;
        }
    } catch (error) {
        console.error("❌ Error verificando la visita:", error);
    }
}
