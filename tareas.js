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

        tasksArray.forEach(task => {
            const taskElement = document.createElement("div");
            taskElement.classList.add("task-item");

            const taskLink = document.createElement("a");
            taskLink.href = task.enlace;
            taskLink.textContent = `DALE TU APOYO A ${task.nombre}`;
            taskLink.target = "_blank";
            taskElement.appendChild(taskLink);

            const verifyButton = document.createElement("button");
            verifyButton.textContent = "Verificar Visita";
            verifyButton.addEventListener("click", () => verificarVisita(task));
            taskElement.appendChild(verifyButton);

            tasksContainer.appendChild(taskElement);
        });

        // 🔥 FORZAR LINKVERTISE 🔥
        if (window.linkvertise) {
            window.linkvertise(1306833, { whitelist: [], blacklist: [""] });
        }
    } catch (error) {
        console.error("❌ Error cargando tareas:", error);
    }
}

// Verificar la visita al enlace
async function verificarVisita(task) {
    try {
        alert(`¡Visita verificada! Ganaste ${task.tqc} TqC por apoyar a ${task.nombre}.`);

        const userRef = doc(db, "usuarios", auth.currentUser.uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
            const userData = userDoc.data();
            const newTqc = (userData.tqc || 0) + task.tqc;

            await updateDoc(userRef, {
                tqc: newTqc
            });

            tqcBalance.textContent = `Tienes (${newTqc}) TqC`;
        }
    } catch (error) {
        console.error("❌ Error verificando la visita:", error);
    }
}
