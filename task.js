// Importar módulos de Firebase
import { auth, db } from "./firebase-config.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import { doc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

const walletInput = document.getElementById("wallet-address");
const saveWalletButton = document.getElementById("save-wallet");
const continueButton = document.getElementById("continue-tasks");
const welcomeMessage = document.getElementById("welcome-message");
const tqcBalance = document.getElementById("tqc-balance");

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
                
                if (userData.wallet) {
                    walletInput.value = userData.wallet;
                    continueButton.style.display = "block";
                }
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

    async function cargarComercios() {
        const container = document.getElementById("comercios-container");
        const comerciosSnapshot = await getDocs(collection(db, "clientes"));
        container.innerHTML = "";
        comerciosSnapshot.forEach(docSnap => {
            let data = docSnap.data();
            let comercioDiv = document.createElement("div");
            comercioDiv.classList.add("comercio");
            
            comercioDiv.innerHTML = `
                <img src="assets/${data.nombre.toLowerCase().replace(/\s+/g, '-')}.jpg" alt="${data.nombre}">
                <h2>${data.nombre}</h2>
                <p>TQC: ${data.asignedTQC}</p>
                <button onclick="visitarComercio(this, '${data.enlace}', ${data.asignedTQC})">Visitar</button>
            `;
            
            container.appendChild(comercioDiv);
        });
    }
});

window.visitarComercio = function(button, link, tqcGanado) {
    button.disabled = true;
    button.textContent = "Esperando... 30s";
    let tiempoRestante = 30;

    let cuentaRegresiva = setInterval(() => {
        tiempoRestante--;
        button.textContent = `Esperando... ${tiempoRestante}s`;
        if (tiempoRestante <= 0) {
            clearInterval(cuentaRegresiva);
            button.textContent = "VERIFICA TU TAREA";
            button.onclick = () => verificarTarea(button, tqcGanado);
            button.disabled = false;
        }
    }, 1000);

    window.open(link, "_blank");
}

async function verificarTarea(button, tqcGanado) {
    const userRef = doc(db, "usuarios", auth.currentUser.uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
        let tqcActual = userSnap.data().tqc || 0;
        await updateDoc(userRef, { tqc: tqcActual + tqcGanado });
        document.getElementById("tqc-balance").textContent = `Tienes ${tqcActual + tqcGanado} TqC`;
        button.textContent = "Tarea Completada";
        button.disabled = true;
    }
}
