import { auth, db } from './firebase-config.js';
import { doc, setDoc, getDoc } from 'https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js';

const form = document.getElementById('perfil-form');

// Obtener el usuario actual
const user = auth.currentUser;

if (user) {
  // Traer los datos del usuario desde Firestore
  const docRef = doc(db, `${user.providerData[0].providerId}s`, user.uid);
  getDoc(docRef).then((docSnap) => {
    if (docSnap.exists()) {
      const datos = docSnap.data();
      document.getElementById('email').value = datos.email; // Mostrar el email
    }
  });
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const nombre = document.getElementById('nombre').value.trim();
  const telefono = document.getElementById('telefono').value.trim();
  const edad = document.getElementById('edad').value.trim();
  const provincia = document.getElementById('provincia').value.trim();
  const localidad = document.getElementById('localidad').value.trim();
  const redes = document.getElementById('redes').value.trim();
  const formacion = document.getElementById('formacion').value.trim();
  const trabajo = document.getElementById('trabajo').value.trim();

  if (!nombre || !telefono || !edad || !provincia || !localidad) {
    alert('Por favor, completa todos los campos obligatorios.');
    return;
  }

  try {
    const docRef = doc(db, `${user.providerData[0].providerId}s`, user.uid);
    await setDoc(docRef, {
      nombre,
      telefono,
      edad,
      provincia,
      localidad,
      redes,
      formacion,
      trabajo,
      completadoPerfil: true, // Marcamos que ya completó el perfil
    }, { merge: true });

    alert('Perfil completado con éxito.');
    window.location.href = 'dashboard-usuario.html'; // Redirigir al dashboard del usuario
  } catch (error) {
    console.error('Error al actualizar el perfil:', error);
    alert('Hubo un problema al guardar tu perfil.');
  }
});
