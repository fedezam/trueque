
import { auth, db, googleProvider } from './firebase-config.js';
import { createUserWithEmailAndPassword, signInWithPopup } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import { setDoc, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

const form = document.getElementById('register-form');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirm-password');
const mostrarCheckbox = document.getElementById('mostrar-contrasena');
const googleLoginBtn = document.getElementById('google-login');

mostrarCheckbox.addEventListener('change', () => {
  const type = mostrarCheckbox.checked ? 'text' : 'password';
  passwordInput.type = type;
  confirmPasswordInput.type = type;
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const nombre = document.getElementById('nombre').value.trim();
  const email = document.getElementById('email').value.trim().toLowerCase();
  const password = passwordInput.value.trim();
  const confirmPassword = confirmPasswordInput.value.trim();
  const telefono = document.getElementById('telefono').value.trim();
  const tipo = document.querySelector('input[name="tipo"]:checked')?.value;
  const referidoPor = document.getElementById('referidoPor').value.trim();

  if (password !== confirmPassword) return alert('Las contraseñas no coinciden.');
  if (!/^(?=.*[A-Z])(?=.*[!@#$%]).{6,}$/.test(password)) return alert('La contraseña no cumple con los requisitos.');

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const user = cred.user;

    const userDocRef = doc(db, tipo === 'comercio' ? 'comercios' : 'usuarios', user.uid);
    await setDoc(userDocRef, {
      nombre,
      email,
      telefono,
      tipo,
      referidoPor,
      creado: new Date().toISOString()
    });

    alert('¡Registro exitoso!');
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      alert('Este correo ya está registrado.');
    } else {
      console.error(error);
      alert('Ocurrió un error al registrarte.');
    }
  }
});

googleLoginBtn.addEventListener('click', async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    const tipo = prompt('¿Qué tipo de cuenta estás creando? (usuario/comercio)').toLowerCase();
    if (!['usuario', 'comercio'].includes(tipo)) {
      alert('Tipo inválido.');
      return;
    }

    const docRef = doc(db, tipo === 'comercio' ? 'comercios' : 'usuarios', user.uid);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      await setDoc(docRef, {
        nombre: user.displayName || '',
        email: user.email,
        tipo,
        creado: new Date().toISOString()
      });
    }

    alert('Sesión iniciada correctamente');
  } catch (error) {
    console.error(error);
    alert('Ocurrió un error con Google');
  }
});
