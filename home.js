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
    if (user) {
        try {
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
                console.error("❌ No se encontraron datos del usuario en Firestore.");
            }
        } catch (error) {
            console.error("❌ Error obteniendo datos del usuario:", error);
        }
    } else {
        alert("No has iniciado sesión.");
        window.location.href = "registro.html"; // Redirige si no hay sesión
    }
});

// Guardar dirección de wallet en Firestore
saveWalletButton.addEventListener("click", async () => {
    const user = auth.currentUser;
    if (user && walletInput.value.trim() !== "") {
        try {
            const userRef = doc(db, "usuarios", user.uid);
            await updateDoc(userRef, { wallet: walletInput.value.trim() });
            alert("✅ Wallet guardada correctamente.");
            continueButton.style.display = "block";
        } catch (error) {
            console.error("❌ Error al guardar la wallet:", error);
            alert("Error al guardar la wallet.");
        }
    } else {
        alert("Ingresa una dirección de wallet válida.");
    }
});
