import { auth, db, googleProvider } from './firebase-config.js';
import {
  signInWithEmailAndPassword,
  signInWithPopup,
} from 'https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js';

import {
  getDoc,
  doc
} from 'https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js';

// Mostrar contraseña
document.getElementById('mostrar-contrasena')?.addEventListener('change', (e) => {
  const tipo = e.target.checked ? 'text' : 'password';
  document.getElementById('password').type = tipo;
});

const form = document.getElementById('login-form');
const googleLoginBtn = document.getElementById('google-login');

// Iniciar sesión con email/contraseña
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    const user = result.user;

    // Buscar tipo de cuenta
    const usuarioSnap = await getDoc(doc(db, "usuarios", user.uid));
    const comercioSnap = await getDoc(doc(db, "comercios", user.uid));
    
    if (usuarioSnap.exists()) {
      localStorage.setItem('tipoCuenta', 'usuario');
      window.location.href = "dashboard-usuario.html";
    } else if (comercioSnap.exists()) {
      localStorage.setItem('tipoCuenta', 'comercio');
      window.location.href = "dashboard-comercio.html";
    } else {
      alert("Tipo de cuenta no reconocido.");
    }

  } catch (error) {
    console.error(error);
    alert("Error al iniciar sesión. Verificá tus credenciales.");
  }
});

// Iniciar sesión con Google
googleLoginBtn.addEventListener('click', async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Buscar tipo de cuenta
    const usuarioSnap = await getDoc(doc(db, "usuarios", user.uid));
    const comercioSnap = await getDoc(doc(db, "comercios", user.uid));
    
    if (usuarioSnap.exists()) {
      localStorage.setItem('tipoCuenta', 'usuario');
      window.location.href = "dashboard-usuario.html";
    } else if (comercioSnap.exists()) {
      localStorage.setItem('tipoCuenta', 'comercio');
      window.location.href = "dashboard-comercio.html";
    } else {
      alert("Tu cuenta de Google no está registrada.");
      window.location.href = "registro.html";
    }

  } catch (error) {
    console.error(error);
    alert("Error al iniciar sesión con Google.");
  }
});
