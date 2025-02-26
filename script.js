// Importar Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, updateProfile, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import { getFirestore, collection, setDoc, doc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

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

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore();
const googleProvider = new GoogleAuthProvider();

// Redirigir si el usuario ya está autenticado
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("✅ Usuario autenticado. Redirigiendo a home...");
    window.location.replace("https://fedezam.github.io/trueque/home.html");
  } else {
    console.log("🔴 Usuario NO autenticado.");
  }
});

// Registro con correo y contraseña
document.getElementById("register-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const nombre = document.getElementById("nombre").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const telefono = document.getElementById("telefono").value;

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await updateProfile(user, { displayName: nombre });

    await setDoc(doc(db, "usuarios", user.uid), {
      nombre,
      email,
      telefono
    }, { merge: true });

    alert("Registro exitoso.");
    window.location.replace("https://fedezam.github.io/trueque/home.html");
  } catch (error) {
    alert("Error: " + error.message);
  }
});

// Registro e inicio de sesión con Google
document.getElementById("google-login").addEventListener("click", async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    await setDoc(doc(db, "usuarios", user.uid), {
      nombre: user.displayName || "Usuario sin nombre",
      email: user.email,
      telefono: ""
    }, { merge: true });

    alert("Inicio de sesión con Google exitoso.");
    window.location.replace("https://fedezam.github.io/trueque/home.html");
  } catch (error) {
    alert("Error: " + error.message);
  }
});

