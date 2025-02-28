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
        
        let tasksArray = [];
        tasksSnapshot.forEach((doc) => {
            const clientData = doc.data();
            if (clientData.enlaces && clientData.enlaces.length > 0) {
                // Añadir enlaces aleatorios de la lista de cada comercio
                tasksArray.push({ nombre: clientData.nombre, enlaces: clientData.enlaces, tqc: clientData.tqc });
            }
        });

        // Mostrar solo 5 tareas aleatorias
        tasksArray = tasksArray.sort(() => Math.random() - 0.5).slice(0, 5);

        // Mostrar las tareas en la página
        tasksArray.forEach(task => {
            const taskElement = document.createElement("div");
            taskElement.classList.add("task-item");

            task.enlaces.forEach((enlace, index) => {
                const taskLink = document.createElement("a");
                taskLink.href = enlace;
                taskLink.textContent = `DALE TU APOYO A ESTE COMERCIO ${task.nombre} - Enlace ${index + 1}`;
                taskLink.target = "_blank";
                taskElement.appendChild(taskLink);

                // Agregar un botón para verificar la visita
                const verifyButton = document.createElement("button");
                verifyButton.textContent = "Verificar Visita";
                verifyButton.addEventListener("click", () => verificarVisita(task, enlace));
                taskElement.appendChild(verifyButton);
            });

            tasksContainer.appendChild(taskElement);
        });
    } catch (error) {
        console.error("❌ Error cargando tareas:", error);
    }
}

// Verificar la visita al enlace
async function verificarVisita(task, enlace) {
    // Aquí iría la lógica para verificar la visita, dependiendo del sistema del acortador
    // De momento, asumimos que la visita es exitosa
    alert("¡Visita verificada! Ganaste " + task.tqc + " TqC por esta tarea.");
    // Actualizar los TqC del usuario
    const userRef = doc(db, "usuarios", auth.currentUser.uid);
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
        const userData = userDoc.data();
        await updateDoc(userRef, {
            tqc: userData.tqc + task.tqc
        });
        console.log(`TqC actualizados: ${userData.tqc + task.tqc}`);
        tqcBalance.textContent = `Tienes (${userData.tqc + task.tqc}) TqC`;
    }
}
