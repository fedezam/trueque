import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAgIPuOIfvYp191JZI9cKLRkKXfGwdaCxM",
    authDomain: "trueque-28b33.firebaseapp.com",
    projectId: "trueque-28b33",
    storageBucket: "trueque-28b33.appspot.com",  // 🔹 Corregido
    messagingSenderId: "6430433157",
    appId: "1:6430433157:web:1e6cf47ee1ed80b127eeec",
    measurementId: "G-JMDRX032BS"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Exporta las instancias para que otros archivos las usen
export { app, auth, db, googleProvider };

