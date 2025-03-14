// Importar Firebase
import { auth, db } from "./firebase-config.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import { doc, updateDoc, getDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

// Elementos del DOM
const welcomeMessage = document.getElementById("welcome-message");
const tqcBalance = document.getElementById("tqc-balance");
const tasksContainer = document.getElementById("tasks-container");

// Detectar usuario autenticado
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

                // Verificar si el usuario regresó de una tarea completada
                checkReturnedVisit();

                // Cargar tareas desde Firestore
                cargarTareas();
            } else {
                console.warn("⚠️ No se encontraron datos del usuario en Firestore.");
            }
        } catch (error) {
            console.error("❌ Error obteniendo datos del usuario:", error);
        }
    } else {
        console.warn("⚠️ No hay usuario autenticado.");
        alert("No has iniciado sesión.");
        window.location.href = "registro.html"; // Redirigir si no hay sesión
    }
});
// Función para cargar tareas
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

        // Mostrar las tareas en la página
        tasksArray.forEach(task => {
            const taskElement = document.createElement("div");
            taskElement.classList.add("task-item");

            const taskLink = document.createElement("a");
            taskLink.href = task.enlace;
            taskLink.textContent = `DALE TU APOYO A ${task.nombre}`;
            taskLink.target = "_blank";
            taskLink.classList.add("linkvertise"); // Asegura que el script detecte el enlace

            taskElement.appendChild(taskLink);
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


// Guardar en localStorage la tarea visitada
function handleTaskClick(task) {
    localStorage.setItem("lastVisitedTask", JSON.stringify(task));
}

// Verificar si el usuario regresó de una tarea completada
async function checkReturnedVisit() {
    const storedTask = localStorage.getItem("lastVisitedTask");

    if (storedTask) {
        const task = JSON.parse(storedTask);
        localStorage.removeItem("lastVisitedTask"); // Limpiar para evitar múltiples reclamos

        try {
            const user = auth.currentUser;
            if (!user) {
                console.warn("⚠️ No hay usuario autenticado.");
                return;
            }

            const userRef = doc(db, "usuarios", user.uid);
            const userDoc = await getDoc(userRef);

            if (userDoc.exists()) {
                const userData = userDoc.data();
                const newTqc = (userData.tqc || 0) + task.tqc;

                await updateDoc(userRef, { tqc: newTqc });

                // Actualizar UI
                tqcBalance.textContent = `Tienes (${newTqc}) TqC`;
                alert(`✅ ¡Visita verificada! Ganaste ${task.tqc} TqC por apoyar a ${task.nombre}.`);
            }
        } catch (error) {
            console.error("❌ Error verificando la visita:", error);
        }
    }
}

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

        // Mostrar las tareas en la página
        tasksArray.forEach(task => {
            const taskElement = document.createElement("div");
            taskElement.classList.add("task-item");

            const taskLink = document.createElement("a");
            taskLink.href = task.enlace;
            taskLink.textContent = `DALE TU APOYO A ${task.nombre}`;
            taskLink.target = "_blank";
            taskLink.addEventListener("click", () => handleTaskClick(task));

            taskElement.appendChild(taskLink);
            tasksContainer.appendChild(taskElement);
        });
    } catch (error) {
        console.error("❌ Error cargando tareas:", error);
    }
}

// Cargar tareas al iniciar
document.addEventListener("DOMContentLoaded", cargarTareas);
