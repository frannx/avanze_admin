import { db } from "/firebase.js";
import {
    collection,
    onSnapshot,
    updateDoc,
    doc
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

// ========================================
// REFERENCIAS DEL DOM
// ========================================
const reqRef = collection(db, "requerimientos");
const tbody = document.querySelector('.adr-requerimientos-table tbody');
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearch');
const btnFiltrar = document.getElementById('btnFiltrar');
const filtrosPanel = document.getElementById('filtrosPanel');
const modalDetalles = document.getElementById('modalDetalles');
const modalOverlay = modalDetalles.querySelector('.adr-modal-overlay');
const btnCerrarModal = document.getElementById('btnCerrarModal');
const btnRegresar = document.getElementById('btnRegresar');
const notificacion = document.getElementById('notificacion');

// Variables globales
let todosLosRequerimientos = [];
let requerimientoActual = null;

// ========================================
// BOTÓN REGRESAR
// ========================================
//btnRegresar.addEventListener('click', () => {
//    window.history.back();
//});

// ========================================
// CARGAR DATOS DESDE FIRESTORE
// ========================================
onSnapshot(reqRef, (snapshot) => {
    todosLosRequerimientos = [];
    tbody.innerHTML = "";
    
    snapshot.forEach((docu) => {
        const data = docu.data();
        todosLosRequerimientos.push({
            id: docu.id,
            ...data
        });
        
        const fila = document.createElement("tr");
        fila.dataset.id = docu.id;
        fila.style.cursor = "pointer";

        fila.innerHTML = `
            <td data-label="ID">${docu.id.slice(0, 6).toUpperCase()}</td>
            <td data-label="FECHA">${data.fecha || ""}</td>
            <td data-label="ÁREA">${data.area || ""}</td>
            <td data-label="TIPO">${data.tipo || ""}</td>
            <td data-label="MONTO">S/ ${parseFloat(data.monto || 0).toLocaleString("es-PE", { minimumFractionDigits: 2 })}</td>
            <td data-label="ESTADO">
                <span class="adr-estado-badge adr-estado-${(data.estado || "PENDIENTE").toLowerCase().replace(" ", "-")}">
                    ${data.estado || "PENDIENTE"}
                </span>
            </td>
            <td data-label="ACCIONES">
                <button class="adr-btn-ver-detalles">
                    <i class="fas fa-eye"></i>
                    Ver Detalles
                </button>
            </td>
        `;

        // Click en la fila para abrir detalles
        fila.addEventListener('click', (e) => {
            if (!e.target.closest('.adr-btn-ver-detalles')) {
                abrirModalDetalles(docu.id);
            }
        });

        // Click en el botón para abrir detalles
        fila.querySelector('.adr-btn-ver-detalles').addEventListener('click', (e) => {
            e.stopPropagation();
            abrirModalDetalles(docu.id);
        });

        tbody.appendChild(fila);
    });
});

// ========================================
// BÚSQUEDA
// ========================================
searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase().trim();
    
    if (searchTerm.length > 0) {
        clearSearchBtn.style.display = 'flex';
        filtrarRequerimientos(searchTerm);
    } else {
        clearSearchBtn.style.display = 'none';
        mostrarTodasLasFilas();
    }
});

clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearSearchBtn.style.display = 'none';
    mostrarTodasLasFilas();
});

function filtrarRequerimientos(searchTerm) {
    const filas = tbody.querySelectorAll('tr');
    
    filas.forEach(fila => {
        const texto = fila.textContent.toLowerCase();
        if (texto.includes(searchTerm)) {
            fila.style.display = '';
        } else {
            fila.style.display = 'none';
        }
    });
}

function mostrarTodasLasFilas() {
    const filas = tbody.querySelectorAll('tr');
    filas.forEach(fila => {
        fila.style.display = '';
    });
}

// ========================================
// PANEL DE FILTROS
// ========================================
btnFiltrar.addEventListener('click', () => {
    filtrosPanel.classList.toggle('active');
    btnFiltrar.classList.toggle('active');
});

// Aplicar Filtros
document.querySelector('.adr-btn-aplicar-filtros').addEventListener('click', () => {
    const filtros = {
        fechaDesde: document.getElementById('filtroFechaDesde').value,
        fechaHasta: document.getElementById('filtroFechaHasta').value,
        area: document.getElementById('filtroArea').value.toLowerCase(),
        tipo: document.getElementById('filtroTipo').value.toLowerCase(),
        montoMin: parseFloat(document.getElementById('filtroMontoMin').value) || 0,
        montoMax: parseFloat(document.getElementById('filtroMontoMax').value) || Infinity,
        estado: document.getElementById('filtroEstado').value
    };

    const filas = tbody.querySelectorAll('tr');
    let contadorVisibles = 0;

    filas.forEach(fila => {
        let mostrar = true;

        // Filtro por fecha
        if (filtros.fechaDesde || filtros.fechaHasta) {
            const fechaCelda = fila.querySelector('[data-label="FECHA"]').textContent.trim();
            const [dia, mes, año] = fechaCelda.split('/');
            const fechaFila = new Date(`${año}-${mes}-${dia}`);

            if (filtros.fechaDesde) {
                const fechaDesde = new Date(filtros.fechaDesde);
                if (fechaFila < fechaDesde) mostrar = false;
            }

            if (filtros.fechaHasta) {
                const fechaHasta = new Date(filtros.fechaHasta);
                if (fechaFila > fechaHasta) mostrar = false;
            }
        }

        // Filtro por área
        if (filtros.area) {
            const areaCelda = fila.querySelector('[data-label="ÁREA"]').textContent.toLowerCase();
            if (!areaCelda.includes(filtros.area)) mostrar = false;
        }

        // Filtro por tipo
        if (filtros.tipo) {
            const tipoCelda = fila.querySelector('[data-label="TIPO"]').textContent.toLowerCase();
            if (!tipoCelda.includes(filtros.tipo)) mostrar = false;
        }

        // Filtro por monto
        const montoCelda = fila.querySelector('[data-label="MONTO"]').textContent.replace('S/', '').replace(',', '').trim();
        const monto = parseFloat(montoCelda) || 0;
        
        if (monto < filtros.montoMin || monto > filtros.montoMax) {
            mostrar = false;
        }

        // Filtro por estado
        if (filtros.estado) {
            const estadoCelda = fila.querySelector('.adr-estado-badge').textContent.trim();
            if (estadoCelda !== filtros.estado) mostrar = false;
        }

        fila.style.display = mostrar ? '' : 'none';
        if (mostrar) contadorVisibles++;
    });

    mostrarNotificacion(`Mostrando ${contadorVisibles} requerimiento(s)`);
});

// Limpiar Filtros
document.querySelector('.adr-btn-limpiar-filtros').addEventListener('click', () => {
    document.getElementById('filtroFechaDesde').value = '';
    document.getElementById('filtroFechaHasta').value = '';
    document.getElementById('filtroArea').value = '';
    document.getElementById('filtroTipo').value = '';
    document.getElementById('filtroMontoMin').value = '';
    document.getElementById('filtroMontoMax').value = '';
    document.getElementById('filtroEstado').value = '';
    
    mostrarTodasLasFilas();
    mostrarNotificacion('Filtros limpiados');
});

// ========================================
// MODAL DE DETALLES
// ========================================
function abrirModalDetalles(requerimientoId) {
    const req = todosLosRequerimientos.find(r => r.id === requerimientoId);
    
    if (!req) {
        mostrarNotificacion('Requerimiento no encontrado', 'error');
        return;
    }

    requerimientoActual = req;

    // Llenar datos del modal
    document.getElementById('modalId').textContent = req.id.slice(0, 8).toUpperCase();
    document.getElementById('modalFecha').textContent = req.fecha || '-';
    document.getElementById('modalArea').textContent = req.area || '-';
    document.getElementById('modalTipo').textContent = req.tipo || '-';
    document.getElementById('modalMonto').textContent = `S/ ${parseFloat(req.monto || 0).toLocaleString("es-PE", { minimumFractionDigits: 2 })}`;
    document.getElementById('modalEstado').textContent = req.estado || 'PENDIENTE';
    document.getElementById('modalDescripcion').textContent = req.descripcion || 'Sin descripción';
    
    // Cargar comentario existente (si lo hay)
    document.getElementById('modalComentario').value = req.comentarioAdmin || '';

    modalDetalles.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function cerrarModal() {
    modalDetalles.classList.remove('active');
    document.body.style.overflow = '';
    requerimientoActual = null;
}

btnCerrarModal.addEventListener('click', cerrarModal);
modalOverlay.addEventListener('click', cerrarModal);

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalDetalles.classList.contains('active')) {
        cerrarModal();
    }
});

// ========================================
// CAMBIAR ESTADO
// ========================================
document.querySelectorAll('.adr-estado-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
        if (!requerimientoActual) return;

        const nuevoEstado = btn.dataset.estado;
        
        try {
            await updateDoc(doc(db, "requerimientos", requerimientoActual.id), {
                estado: nuevoEstado
            });

            document.getElementById('modalEstado').textContent = nuevoEstado;
            mostrarNotificacion(`Estado cambiado a: ${nuevoEstado}`);
            
            // Actualizar el estado visual del botón
            document.querySelectorAll('.adr-estado-btn').forEach(b => {
                b.style.opacity = '0.6';
            });
            btn.style.opacity = '1';
            
        } catch (error) {
            console.error("Error al cambiar estado:", error);
            mostrarNotificacion('Error al cambiar el estado', 'error');
        }
    });
});

// ========================================
// GUARDAR COMENTARIO
// ========================================
document.getElementById('btnGuardarComentario').addEventListener('click', async () => {
    if (!requerimientoActual) return;

    const comentario = document.getElementById('modalComentario').value.trim();

    try {
        await updateDoc(doc(db, "requerimientos", requerimientoActual.id), {
            comentarioAdmin: comentario,
            fechaComentario: new Date().toISOString()
        });

        mostrarNotificacion('Comentario guardado exitosamente');
        
    } catch (error) {
        console.error("Error al guardar comentario:", error);
        mostrarNotificacion('Error al guardar el comentario', 'error');
    }
});

// ========================================
// NOTIFICACIONES
// ========================================
function mostrarNotificacion(mensaje, tipo = 'success') {
    const notifText = notificacion.querySelector('span');
    const notifIcon = notificacion.querySelector('i');
    
    notifText.textContent = mensaje;
    
    // Cambiar estilo según el tipo
    if (tipo === 'error') {
        notificacion.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
        notifIcon.className = 'fas fa-exclamation-circle';
    } else {
        notificacion.style.background = 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)';
        notifIcon.className = 'fas fa-check-circle';
    }
    
    notificacion.classList.add('show');

    setTimeout(() => {
        notificacion.classList.remove('show');
    }, 3000);
}

// ========================================
// INICIALIZACIÓN
// ========================================
console.log('✅ Panel de Administrador - Requerimientos cargado');