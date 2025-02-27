import { auth, db, googleProvider } from "./firebase-config.js";
import { 
    createUserWithEmailAndPassword, signInWithPopup, 
    updateProfile, onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import { collection, setDoc, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

// Función para guardar los datos en Firestore
const saveUserToFirestore = async (user, additionalData = {}) => {
    try {
        const userRef = doc(db, "usuarios", user.uid);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
            await setDoc(userRef, {
                uid: user.uid,
                nombre: user.displayName || additionalData.nombre || "Usuario",
                email: user.email,
                telefono: additionalData.telefono || "",
                foto: user.photoURL || "",
                tqc: 0
            });
            console.log("✅ Usuario guardado en Firestore.");
        }
    } catch (error) {
        console.error("❌ Error guardando usuario en Firestore:", error);
    }
};

// Función para iniciar sesión con Google
const loginWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        
        await saveUserToFirestore(user);
        alert("Inicio de sesión con Google exitoso.");
        window.location.replace("home.html");
    } catch (error) {
        console.error("❌ Error al iniciar sesión con Google:", error);
        alert("Error: " + error.message);
    }
};

// Evento del botón de Google
document.getElementById("google-login")?.addEventListener("click", loginWithGoogle);

// Verifica el estado de autenticación
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("✅ Usuario autenticado:", user);
        window.location.replace("home.html");
    }
});

