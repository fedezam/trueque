// Importamos los módulos de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { firebaseConfig } from "./firebase.config.js";

// Inicializamos Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// 📌 Función para guardar el usuario en Firestore
const saveUserToFirestore = async (user, additionalData = {}) => {
    if (!user) return;
    
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
        } else {
            console.log("ℹ️ El usuario ya existía en Firestore.");
        }
    } catch (error) {
        console.error("❌ Error al guardar en Firestore:", error);
    }
};

// 📌 Registro con Google
const loginWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;

        await saveUserToFirestore(user);
        alert("Inicio de sesión con Google exitoso.");
        
        window.location.replace("home.html");
    } catch (error) {
        console.error("❌ Error con Google:", error);
        alert("Error: " + error.message);
    }
};

// 📌 Registro manual con email y contraseña
document.getElementById("register-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    
    const nombre = document.getElementById("nombre").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const telefono = document.getElementById("telefono").value;

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await saveUserToFirestore(user, { nombre, telefono });
        alert("Registro exitoso.");
        
        window.location.replace("home.html");
    } catch (error) {
        console.error("❌ Error en el registro:", error);
        alert("Error: " + error.message);
    }
});

// 📌 Detectar cambios en la autenticación
onAuthStateChanged(auth, async (user) => {
    if (user) {
        console.log("✅ Usuario autenticado:", user);
        await saveUserToFirestore(user);
    }
});

// 📌 Evento para el botón de Google
document.getElementById("google-login").addEventListener("click", loginWithGoogle);
