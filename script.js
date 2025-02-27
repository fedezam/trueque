// Importamos los módulos de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { firebaseConfig } from "./firebase.config.js";

// Inicializamos Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// 📌 Función para guardar el usuario en Firestore
const saveUserToFirestore = async (user, additionalData = {}) => {
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
        console.log("ℹ️ El usuario ya existe en Firestore.");
    }
};

// 📌 Función para registrar con Google
const loginWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;

        await saveUserToFirestore(user);  // 🔴 Esperamos que Firestore guarde el usuario antes de redirigir
        alert("Inicio de sesión con Google exitoso.");
        
        window.location.replace("home.html");  // 🔴 Redirigimos solo después de guardar
    } catch (error) {
        alert("Error: " + error.message);
    }
};

// 📌 Detectar cambios en la autenticación
onAuthStateChanged(auth, async (user) => {
    if (user) {
        console.log("✅ Usuario autenticado:", user);
        await saveUserToFirestore(user);  // 🔴 Aseguramos que Firestore tenga los datos
    }
});

// 📌 Evento para el botón de Google
document.getElementById("google-login").addEventListener("click", loginWithGoogle);

// 📌 Evento para el formulario de registro manual
document.getElementById("register-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    
    const nombre = document.getElementById("nombre").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const telefono = document.getElementById("telefono").value;

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await saveUserToFirestore(user, { nombre, telefono });  // 🔴 Guardamos los datos adicionales
        alert("Registro exitoso.");
        
        window.location.replace("home.html");  // 🔴 Redirigimos solo después de guardar
    } catch (error) {
        alert("Error: " + error.message);
    }
});
