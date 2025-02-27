import { auth, db } from './firebase-config.js';
import { getDoc, setDoc, doc } from 'https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js';

// Referencias a los elementos del DOM
const welcomeMessage = document.getElementById("welcome-message");
const tqcBalance = document.getElementById("tqc-balance");
const walletInput = document.getElementById("wallet-address");
const saveWalletBtn = document.getElementById("save-wallet");
const continueTasksBtn = document.getElementById("continue-tasks");

// Cargar datos del usuario
auth.onAuthStateChanged(async (user) => {
    if (user) {
        const userRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
            const userData = userDoc.data();
            welcomeMessage.textContent = `Bienvenido, ${userData.nombre || user.email}`;
            tqcBalance.textContent = `Tienes ${userData.tqc || 0} TqC`;
            if (userData.wallet) {
                walletInput.value = userData.wallet;
                continueTasksBtn.style.display = "block";
            }
        }
    } else {
        window.location.href = "registro.html"; // Redirige si no hay sesión
    }
});

// Guardar wallet en Firebase
saveWalletBtn.addEventListener("click", async () => {
    const user = auth.currentUser;
    if (user && walletInput.value.trim() !== "") {
        const userRef = doc(db, "users", user.uid);
        await setDoc(userRef, { wallet: walletInput.value.trim() }, { merge: true });
        continueTasksBtn.style.display = "block";
        alert("Wallet guardada correctamente");
    }
});
