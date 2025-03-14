import { auth, db, googleProvider } from "./firebase-config.js";
import { 
    getAuth, signInWithPopup, createUserWithEmailAndPassword, onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import { 
    doc, getDoc, setDoc, updateDoc 
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

// 📌 Función para guardar el usuario en Firestore (evita duplicados)
const saveUserToFirestore = async (user, additionalData = {}) => {
    if (!user) return;

    try {
        const userRef = doc(db, "usuarios", user.uid);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
            // 🔹 Crear usuario solo si NO existe en Firestore
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
            console.log("ℹ️ El usuario ya existe en Firestore.");
        }
    } catch (error) {
        console.error("❌ Error al guardar en Firestore:", error);
    }
};

// 📌 Detectar si el usuario ya está autenticado al cargar la página
onAuthStateChanged(auth, async (user) => {
    if (user) {
        console.log("✅ Usuario autenticado:", user);

        // Guarda el usuario solo si no existe en Firestore
        await saveUserToFirestore(user);

        // 🔹 Redirigir automáticamente si ya está logueado
        if (window.location.pathname.includes("registro.html")) {
            window.location.replace("home.html");
        }
    } else {
        console.log("⚠️ No hay usuario autenticado.");
    }
});

// 📌 Registro con Google
document.getElementById("google-login").addEventListener("click", async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        await saveUserToFirestore(result.user);
        alert("Inicio de sesión con Google exitoso.");
        window.location.replace("home.html");
    } catch (error) {
        console.error("❌ Error con Google:", error);
        alert("Error: " + error.message);
    }
});

// 📌 Registro manual con email y contraseña
document.getElementById("register-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    
    const nombre = document.getElementById("nombre").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const telefono = document.getElementById("telefono").value;

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await saveUserToFirestore(userCredential.user, { nombre, telefono });
        alert("Registro exitoso.");
        window.location.replace("home.html");
    } catch (error) {
        console.error("❌ Error en el registro:", error);
        alert("Error: " + error.message);
    }
});

