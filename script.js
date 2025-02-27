// Importar configuración centralizada de Firebase
import { auth, db, googleProvider } from "./firebase-config.js";
import { 
    createUserWithEmailAndPassword, signInWithPopup, 
    updateProfile, onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import { collection, addDoc, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

// Función para guardar los datos del usuario en Firestore
const saveUserToFirestore = async (user, additionalData = {}) => {
    const userRef = doc(db, "usuarios", user.uid); // Referencia al documento del usuario
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
        // Si el usuario no existe en Firestore, lo guardamos
        await setDoc(userRef, {
            uid: user.uid,
            nombre: user.displayName || additionalData.nombre || "Usuario",
            email: user.email,
            telefono: additionalData.telefono || "",
            foto: user.photoURL || "",
            tqc: 0 // Inicializamos en 0
        });
        console.log("Usuario guardado en Firestore.");
    } else {
        console.log("El usuario ya existe en Firestore.");
    }
};

// Función para actualizar el mensaje de bienvenida
const updateWelcomeMessage = async (user) => {
    const welcomeMessage = document.getElementById("welcome-message");
    if (user) {
        // Obtener los datos del usuario desde Firestore
        const userRef = doc(db, "usuarios", user.uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
            const userData = userDoc.data();
            welcomeMessage.textContent = `Bienvenido, ${userData.nombre}`;
        } else {
            welcomeMessage.textContent = "Bienvenido, Usuario";
        }
    } else {
        welcomeMessage.textContent = "Bienvenido";
    }
};

// Verifica si el usuario está logueado y lo redirige
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("✅ Usuario autenticado.");
        saveUserToFirestore(user); // Guarda el usuario en Firestore (si no existe)
        updateWelcomeMessage(user); // Actualiza el mensaje de bienvenida
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

        // Guardar datos en Firestore
        await saveUserToFirestore(user, { nombre, telefono });

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
        const user = result.user;

        // Guardar datos en Firestore
        await saveUserToFirestore(user);

        alert("Inicio de sesión con Google exitoso.");
        window.location.replace("home.html");
    } catch (error) {
        alert("Error: " + error.message);
    }
};

// Eventos de botones
document.getElementById("register-form").addEventListener("submit", registerUser);
document.getElementById("google-login").addEventListener("click", loginWithGoogle);
