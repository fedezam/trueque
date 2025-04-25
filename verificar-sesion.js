import { auth, db } from './firebase-config.js';
import {
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js';
import {
  doc,
  getDoc
} from 'https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js';

export function verificarSesion() {
  onAuthStateChanged(auth, async (user) => {
    if (!user || !user.uid) {
      window.location.href = "inicio.html";
      return;
    }

    const tipoCuenta = localStorage.getItem("tipoCuenta");
    if (!tipoCuenta || (tipoCuenta !== "usuario" && tipoCuenta !== "comercio")) {
      window.location.href = "inicio.html";
      return;
    }

    const coleccion = tipoCuenta === "usuario" ? "usuarios" : "comercios";
    const docRef = doc(db, coleccion, user.uid);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      window.location.href = "inicio.html";
      return;
    }

    const data = docSnap.data();
    if (!data.completadoPerfil) {
      const destino = tipoCuenta === "usuario"
        ? "completar-perfil-usuario.html"
        : "completar-perfil-comercio.html";
      window.location.href = destino;
    }
  });
}
