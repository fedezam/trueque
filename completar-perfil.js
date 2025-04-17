
import { auth, db } from './firebase-config.js';
import {
  doc,
  updateDoc
} from 'https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js';

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("completar-perfil-form");

  // Obtener datos previos del localStorage
  const datosPrevios = {
    nombre: localStorage.getItem("nombre") || "",
    apellido: localStorage.getItem("apellido") || "",
    telefono: localStorage.getItem("telefono") || "",
    email: localStorage.getItem("email") || "", // Solo por si se necesita
  };

  // Cargar datos previos en los campos
  document.getElementById("nombre").value = datosPrevios.nombre;
  document.getElementById("apellido").value = datosPrevios.apellido;
  document.getElementById("telefono").value = datosPrevios.telefono;

  // Acá podrías cargar provincias/localidades si lo necesitás
  // cargarProvincias(); cargarLocalidades();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const perfil = {
      nombre: document.getElementById("nombre").value.trim(),
      apellido: document.getElementById("apellido").value.trim(),
      telefono: document.getElementById("telefono").value.trim(),
      edad: document.getElementById("edad").value.trim(),
      provincia: document.getElementById("provincia").value.trim(),
      localidad: document.getElementById("localidad").value.trim(),
      formacionAcademica: document.getElementById("formacion-academica").value.trim(),
      trabajo: document.getElementById("trabajo").value.trim(),
      estadoCivil: document.getElementById("ecivil").value.trim(),
      hijos: document.getElementById("hijos").value.trim(),
      completadoPerfil: true // Marcamos el perfil como completo
    };

    try {
      const user = auth.currentUser;
      if (!user) {
        alert("No se detectó sesión activa.");
        return;
      }

      // Determinar colección: usuarios o comercios (opcional)
      const coleccion = localStorage.getItem("tipoCuenta") || "usuarios"; // fallback

      const docRef = doc(db, coleccion, user.uid);
      await updateDoc(docRef, perfil);

      // Borrar localStorage (opcional)
      localStorage.removeItem("nombre");
      localStorage.removeItem("apellido");
      localStorage.removeItem("telefono");
      localStorage.removeItem("email");
      localStorage.removeItem("tipoCuenta");

      alert("Perfil guardado correctamente.");
      window.location.href = "dashboard.html";

    } catch (error) {
      console.error("Error al guardar perfil:", error);
      alert("Ocurrió un error al guardar el perfil.");
    }
  });
});
