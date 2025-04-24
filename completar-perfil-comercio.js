import { auth, db } from './firebase-config.js';
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDoc
} from 'https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js';

import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js';

const form = document.getElementById("comercio-form");
const provinciasSelect = document.getElementById("provincia");
const localidadesSelect = document.getElementById("localidad");

// Cargar provincias y localidades
fetch('localidades.json')
  .then(res => res.json())
  .then(data => {
    const localidades = data.localidades_censales;
    const provincias = [...new Set(localidades.map(loc => loc.provincia.nombre))];
    provincias.sort().forEach(prov => {
      const option = document.createElement('option');
      option.value = prov;
      option.textContent = prov;
      provinciasSelect.appendChild(option);
    });

    provinciasSelect.addEventListener('change', () => {
      const seleccion = provinciasSelect.value;
      localidadesSelect.innerHTML = '<option value="">Seleccioná una localidad</option>';
      localidades
        .filter(loc => loc.provincia.nombre === seleccion)
        .sort((a, b) => a.nombre.localeCompare(b.nombre))
        .forEach(loc => {
          const option = document.createElement('option');
          option.value = loc.nombre;
          option.textContent = loc.nombre;
          localidadesSelect.appendChild(option);
        });
    });
  });

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("Debés iniciar sesión.");
    window.location.href = "login.html";
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const comercioData = {
      uidDueño: user.uid,
      nombre: document.getElementById("nombreComercio").value.trim(),
      direccion: document.getElementById("direccion").value.trim(),
      telefono: document.getElementById("telefonoComercio").value.trim(),
      rubro: document.getElementById("rubro").value.trim(),
      provincia: provinciasSelect.value,
      localidad: localidadesSelect.value,
      facebook: document.getElementById("facebook").value.trim(),
      instagram: document.getElementById("instagram").value.trim(),
      descripcion: document.getElementById("descripcion").value.trim(),
      creadoEn: new Date().toISOString(),
      tasks: [],
    };

    try {
      const docRef = await addDoc(collection(db, "comercios"), comercioData);

      // Actualizar lista de comercios en perfil del dueño
      const userRef = doc(db, "usuarios", user.uid);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.exists() ? userSnap.data() : {};

      const comercios = userData.comercios || [];
      comercios.push(docRef.id);
      await updateDoc(userRef, { comercios });

      alert("Comercio registrado correctamente.");
      window.location.href = "dashboard-comercio.html?id=" + docRef.id;

    } catch (err) {
      console.error("Error registrando el comercio:", err);
      alert("Hubo un problema al registrar el comercio.");
    }
  });
});
