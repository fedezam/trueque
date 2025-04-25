import { auth } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js';

export function verificarSesion() {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      alert("Debés iniciar sesión para acceder.");
      window.location.href = "inicio.html";
    }
  });
}
