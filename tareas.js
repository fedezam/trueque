function recargarLinkvertise() {
    const script = document.createElement("script");
    script.src = "https://publisher.linkvertise.com/cdn/linkvertise.js";
    document.body.appendChild(script);
}

// Llamamos a la función después de cargar las tareas
async function cargarTareas() {
    // ... Código para obtener tareas ...
    
    tasksContainer.innerHTML = ""; 
    tasksArray.forEach(task => {
        tasksContainer.innerHTML += `
            <div class="task-item">
                <a href="${task.enlace}" target="_blank" onclick="marcarVisita('${task.id}')">
                    📌 ${task.nombre}
                </a>
            </div>
        `;
    });

    recargarLinkvertise(); // 🔹 Recargar el script de Linkvertise
    verificarTareasCompletadas();
}
