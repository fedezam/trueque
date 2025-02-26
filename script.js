// Importa los módulos de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { 
    getAuth, createUserWithEmailAndPassword, signInWithPopup, 
    GoogleAuthProvider, updateProfile, onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAgIPuOIfvYp191JZI9cKLRkKXfGwdaCxM",
    authDomain: "trueque-28b33.firebaseapp.com",
    projectId: "trueque-28b33",
    storageBucket: "trueque-28b33.firebasestorage.app",
    messagingSenderId: "6430433157",
    appId: "1:6430433157:web:1e6cf47ee1ed80b127eeec",
    measurementId: "G-JMDRX032BS"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore();
const googleProvider = new GoogleAuthProvider();

// Redirige si el usuario ya está autenticado
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("✅ Usuario autenticado. Redirigiendo a home...");
        window.location.replace("https://fedezam.github.io/trueque/home.html");
    } else {
        console.log("🔴 Usuario NO autenticado. Se queda en registro.");
    }
});

// Función para registrar usuario con email y contraseña
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
            telefono
        });

        alert("Registro exitoso.");
        window.location.replace("https://fedezam.github.io/trueque/home.html");
    } catch (error) {
        alert("Error: " + error.message);
    }
};

// Función para autenticación con Google
const loginWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        alert("Inicio de sesión con Google exitoso.");
        window.location.replace("https://fedezam.github.io/trueque/home.html");
    } catch (error) {
        alert("Error: " + error.message);
    }
};

// Eventos de los botones
document.getElementById("register-form").addEventListener("submit", registerUser);
document.getElementById("google-login").addEventListener("click", loginWithGoogle);
