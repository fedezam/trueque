// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyA",
    authDomain: "true",
    projectId: "truequ",
    storageBucket: "truequ",
    messagingSenderId: "6430",
    appId: "1:6430433157:web:1e6cf",
    measurementId: "G-JMDR"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Exporta las instancias
export { app, auth, db, googleProvider };
