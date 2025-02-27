// Importar configuración centralizada de Firebase
import { auth, db, googleProvider } from "./firebase-config.js";
import { 
    createUserWithEmailAndPassword, signInWithPopup, 
    updateProfile, onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

// Verifica si el usuario está logueado y lo redirige
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("✅ Usuario autenticado. Redirigiendo a home...");
        window.location.replace("home.html");
    }
});

// Función para registrar usuario
const registerUser = async (e) => {
    e.preventDefault();
    const nombre = document.getElementById("nombre").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const telefono = document.getElementById("telefono").value;

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await updateProfile(user, { displayName: nombre });

        await addDoc(collection(db, "usuarios"), {
            uid: user.uid,
            nombre,
            email,
            telefono,
            tqc: 0 // Inicializamos en 0
        });

        alert("Registro exitoso.");
        window.location.replace("home.html");
    } catch (error) {
        alert("Error: " + error.message);
    }
};

// Función para autenticación con Google
const loginWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        alert("Inicio de sesión con Google exitoso.");
        window.location.replace("home.html");
    } catch (error) {
        alert("Error: " + error.message);
    }
};

// Eventos de botones
document.getElementById("register-form").addEventListener("submit", registerUser);
document.getElementById("google-login").addEventListener("click", loginWithGoogle);

