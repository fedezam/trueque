import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import { collection, getDocs, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
    let currentUser;

    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            window.location.href = "registro.html";
        } else {
            currentUser = user;
            document.getElementById("welcome-message").textContent = `Bienvenido, ${user.displayName || 'Usuario'}`;
            cargarComercios();
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
