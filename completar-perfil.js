document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("completar-perfil-form");

  // Obtener datos del localStorage si existen
  const datosPrevios = {
    nombre: localStorage.getItem("nombre"),
    apellido: localStorage.getItem("apellido"),
    telefono: localStorage.getItem("telefono"),
    email: localStorage.getItem("email"), // Si querés mostrarlo en algún lado
  };

  // Llenar los campos si hay datos previos
  if (datosPrevios.nombre) document.getElementById("nombre").value = datosPrevios.nombre;
  if (datosPrevios.apellido) document.getElementById("apellido").value = datosPrevios.apellido;
  if (datosPrevios.telefono) document.getElementById("telefono").value = datosPrevios.telefono;

  // Acá podés cargar provincias/localidades si tenés una función para eso
  // cargarProvincias(); cargarLocalidades();

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    // Acá iría el código para guardar el resto del perfil en Firestore
    // Por ejemplo:
    const perfil = {
      nombre: document.getElementById("nombre").value,
      apellido: document.getElementById("apellido").value,
      telefono: document.getElementById("telefono").value,
      edad: document.getElementById("edad").value,
      provincia: document.getElementById("provincia").value,
      localidad: document.getElementById("localidad").value,
      formacionAcademica: document.getElementById("formacion-academica").value,
      trabajo: document.getElementById("trabajo").value,
      estadoCivil: document.getElementById("ecivil").value,
      hijos: document.getElementById("hijos").value,
    };

    // Guardar en Firestore...
    // firebase.firestore().collection(...).doc(...).set(perfil)

    alert("Perfil guardado correctamente");
    window.location.href = "dashboard.html"; // o donde quieras redirigir
  });
});

