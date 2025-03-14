
import { auth, db, googleProvider } from "./firebase-config.js";
import { 
    getAuth, signInWithPopup, createUserWithEmailAndPassword, onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import { 
    doc, getDoc, setDoc, updateDoc 
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

// 📌 Función para guardar el usuario en Firestore
const saveUserToFirestore = async (user, additionalData = {}) => {
    if (!user) return;

    try {
        const userRef = doc(db, "usuarios", user.uid);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
            // 🔹 Crear un nuevo usuario en Firestore
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
            // 🔹 Si el usuario ya existe, actualiza la información relevante
            await updateDoc(userRef, {
                nombre: user.displayName || userDoc.data().nombre,
                email: user.email,
                foto: user.photoURL || userDoc.data().foto,
                telefono: additionalData.telefono || userDoc.data().telefono
            });
            console.log("ℹ️ Usuario actualizado en Firestore.");
        }
    } catch (error) {
        console.error("❌ Error al guardar en Firestore:", error);
    }
};

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

// 📌 Detectar cambios en la autenticación
onAuthStateChanged(auth, async (user) => {
    if (user) {
        console.log("✅ Usuario autenticado:", user);
        await saveUserToFirestore(user);
    }
});
