// Importar módulos de Firebase
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

                // Cargar las tareas de la base de datos
                cargarTareas();
            } else {
                console.warn("⚠️ No se encontraron datos del usuario en Firestore.");
            }
        } catch (error) {
            console.error("❌ Error obteniendo datos del usuario:", error);
        }
    } else {
        console.warn("⚠️ No hay usuario autenticado o falta UID.");
        alert("No has iniciado sesión.");
        window.location.href = "registro.html"; // Redirige si no hay sesión
    }
});

// Cargar tareas desde Firestore
async function cargarTareas() {
    try {
        const tasksRef = collection(db, "clientes");
        const tasksSnapshot = await getDocs(tasksRef);

        console.log("📂 Documentos obtenidos de 'clientes':", tasksSnapshot.docs.length);

        let tasksArray = [];
        tasksSnapshot.forEach((doc) => {
            const clientData = doc.data();
            console.log("📄 Datos del documento:", clientData);

            if (clientData.enlace) { // Verifica que el campo "enlace" exista
                tasksArray.push({
                    nombre: clientData.nombre,
                    enlace: clientData.enlace,
                    tqc: clientData.asignedTQC // Usa el campo correcto
                });
            }
        });

        console.log("📋 Tareas filtradas:", tasksArray);

        // Mostrar solo 5 tareas aleatorias
        tasksArray = tasksArray.sort(() => Math.random() - 0.5).slice(0, 5);

        // Mostrar las tareas en la página
        tasksArray.forEach(task => {
            const taskElement = document.createElement("div");
            taskElement.classList.add("task-item");

            // Crear el enlace
            const taskLink = document.createElement("a");
            taskLink.href = task.enlace;
            taskLink.textContent = `DALE TU APOYO A ESTE COMERCIO: ${task.nombre}`;
            taskLink.target = "_blank";
            taskElement.appendChild(taskLink);

            // Agregar un botón para verificar la visita
            const verifyButton = document.createElement("button");
            verifyButton.textContent = "Verificar Visita";
            verifyButton.addEventListener("click", () => verificarVisita(task));
            taskElement.appendChild(verifyButton);

            tasksContainer.appendChild(taskElement);
        });
    } catch (error) {
        console.error("❌ Error cargando tareas:", error);
    }
}

// Verificar la visita al enlace
async function verificarVisita(task) {
    try {
        // Mostrar mensaje de éxito
        alert(`¡Visita verificada! Ganaste ${task.tqc} TqC por apoyar a ${task.nombre}.`);

        // Actualizar los TqC del usuario en Firestore
        const userRef = doc(db, "usuarios", auth.currentUser.uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
            const userData = userDoc.data();
            const newTqc = (userData.tqc || 0) + task.tqc; // Sumar la recompensa

            await updateDoc(userRef, {
                tqc: newTqc
            });

            console.log(`TqC actualizados: ${newTqc}`);
            tqcBalance.textContent = `Tienes (${newTqc}) TqC`; // Actualizar el balance en la UI
        }
    } catch (error) {
        console.error("❌ Error verificando la visita:", error);
    }
}
