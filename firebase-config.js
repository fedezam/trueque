// firebase-config.js

// ✅ Importaciones desde CDN oficiales, versión fija
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

// 🔒 Configuración protegida (NO incluimos ni exponemos nada innecesario)
const firebaseConfig = {
  apiKey: "AIzaSyAgIPuOIfvYp191JZI9cKLRkKXfGwdaCxM", // Pública pero protegida por reglas de Firestore
  authDomain: "trueque-28b33.firebaseapp.com",
  projectId: "trueque-28b33",
  storageBucket: "trueque-28b33.appspot.com",
  messagingSenderId: "6430433157",
  appId: "1:6430433157:web:1e6cf47ee1ed80b127eeec"
  // 🚫 No incluyo measurementId porque no usamos Analytics y evita seguimiento extra
};

// ✅ Inicializamos app y servicios mínimos
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// 🌍 Idioma del dispositivo
auth.useDeviceLanguage();

// 🚫 Seguridad extra: no exportamos más de lo necesario
export { auth, db, googleProvider };
