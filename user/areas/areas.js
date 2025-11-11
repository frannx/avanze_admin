        import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
        import { 
            getFirestore, 
            collection, 
            query, 
            where, 
            onSnapshot,
            addDoc,
            doc,
            updateDoc,
            deleteDoc,
            serverTimestamp
        } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

        const firebaseConfig = {
            apiKey: "AIzaSyD-V6hfGyOETDNxJf8Stb9DujbxQTIM76c",
            authDomain: "web-requerimientos.firebaseapp.com",
            projectId: "web-requerimientos",
            storageBucket: "web-requerimientos.firebasestorage.app",
            messagingSenderId: "707688130249",
            appId: "1:707688130249:web:c46b6252c46083b6e9cf18",
            measurementId: "G-TV2C27SXD3"
        };

        const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
        const db = getFirestore(app);

        window.db = db;
        window.firestore = {
            collection,
            query,
            where,
            onSnapshot,
            addDoc,
            doc,
            updateDoc,
            deleteDoc,
            serverTimestamp
        };
        const areasMap = {
            "catastro-planeamiento": "Subgerencia de Catastro, Planeamiento y Control Urbano",
            "maquinarias": "Subgerencia de Maquinarias",
            "supervision-obras": "Subgerencia de Supervisión y Ejecución de Obras",
            "medio-ambiente": "Subgerencia de Medio Ambiente, Ecología, Saneamiento y Salubridad",
            "mercados-cementerios": "Subgerencia de Mercados y Cementerios",
            "transporte-transito": "Subgerencia de Transporte, Tránsito y Circulación Vial",
            "seguridad-ciudadana": "Subgerencia de Seguridad Ciudadana",
            "educacion-cultura": "Subgerencia de Educación, Cultura, Deportes y Recreación",
            "defensoria-nino": "Subgerencia de Defensoría Municipal del Niño y Adolescente",
            "discapacidad": "Subgerencia Municipal Persona con Discapacidad",
            "participacion-vecinal": "Subgerencia de Participación Vecinal y Organizaciones Sociales",
            "turismo-pymes": "Subgerencia de Desarrollo Turístico y Promoción Empresarial PYMES",
            "proyectos-agropecuarios": "Subgerencia de Proyectos Agropecuarios",
            "vaso-de-leche": "Programa del Vaso de Leche",
            "pan-tbc": "Programa PAN-TBC",
            "agua-alcantarillado": "Unidad de Agua y Alcantarillado",
            "agencias-municipales": "Agencias Municipales",
            "abastecimiento": "Subgerencia de Abastecimiento",
            "contabilidad": "Subgerencia de Contabilidad",
            "tesoreria": "Subgerencia de Tesorería",
            "personal": "Subgerencia de Personal",
            "control-patrimonial": "Subgerencia de Control Patrimonial",
            "recaudacion-control": "Subgerencia de Recaudación y Control",
            "fiscalizacion-tributaria": "Subgerencia de Fiscalización Tributaria",
            "ejecucion-coactiva": "Subgerencia de Ejecución Coactiva",
            "comercializacion": "Subgerencia de Comercialización, Comercio Ambulatorio y Feria",
            "asesoria-juridica": "Oficina de Asesoría Jurídica",
            "planeamiento-presupuesto": "Oficina de Planeamiento, Presupuesto y Racionalización",
            "tecnologia": "Oficina de Tecnología",
            "secretaria-general": "Oficina de Secretaría General",
            "tramite-documentario": "Unidad Trámite Documentario",
            "archivo-central": "Unidad de Archivo Central",
            "orientacion-ciudadania": "Unidad de Orientación a la Ciudadanía"
        };

        let todosLosRequerimientos = [];
        let requerimientosFiltrados = [];
        let currentArea = "";
        let editingReqId = null;
        let currentReqIndex = 0;

        function normalizeText(text = "") {
            return text.toString().toLowerCase().normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim();
        }

        // INICIALIZAR
        document.addEventListener("DOMContentLoaded", () => {
            const urlParams = new URLSearchParams(window.location.search);
            const areaParam = urlParams.get("area");
            const areaNameEl = document.getElementById("areaName");

            if (!areaParam) {
                areaNameEl.textContent = "Área no encontrada";
                document.getElementById("noData").style.display = "block";
                return;
            }

            currentArea = areasMap[areaParam] || areaParam;
            areaNameEl.textContent = currentArea;

            loadRequerimientos();
            setupEventListeners();
        });

        // CARGAR REQUERIMIENTOS
        function loadRequerimientos() {
            const requerimientosRef = window.firestore.collection(window.db, "requerimientos");
            
            window.firestore.onSnapshot(requerimientosRef, (snapshot) => {
                todosLosRequerimientos = [];
                
                snapshot.forEach(doc => {
                    const data = doc.data();
                    const areaNormalizada = normalizeText(data.area || "");
                    const nombreBuscado = normalizeText(currentArea);
                    
                    if (areaNormalizada.includes(nombreBuscado) || nombreBuscado.includes(areaNormalizada)) {
                        todosLosRequerimientos.push({
                            id: doc.id,
                            ...data
                        });
                    }
                });

                requerimientosFiltrados = [...todosLosRequerimientos];
                renderRequerimientos();
            });
        }

        // RENDERIZAR
        function renderRequerimientos() {
            const grid = document.getElementById("requirementsGrid");
            const noData = document.getElementById("noData");

            if (requerimientosFiltrados.length === 0) {
                grid.style.display = "none";
                noData.style.display = "block";
                return;
            }

            grid.style.display = "grid";
            noData.style.display = "none";
            grid.innerHTML = "";

            requerimientosFiltrados.forEach((req, index) => {
                const card = createReqCard(req, index);
                grid.appendChild(card);
            });
        }

        function createReqCard(req, index) {
            const titulo = req.descripcion || "Sin descripción";
            const tipo = (req.tipo || "No especificado").toUpperCase();
            const estado = (req.estado || "PENDIENTE").toUpperCase();
            const monto = Number(req.monto || 0);
            const fecha = req.fecha || "-";

            const statusClass = estado.includes("PENDIENTE") ? "pending" 
                : estado.includes("PROCESO") ? "process" 
                : "completed";

            const iconType = tipo.includes("BIEN") ? "fa-box" 
                : tipo.includes("SERVICIO") ? "fa-tools" 
                : "fa-hard-hat";

            const card = document.createElement("div");
            card.className = "area-req-card";
            card.innerHTML = `
                <div class="area-req-header">
                    <div class="area-req-type">
                        <i class="fas fa-briefcase"></i>
                        <span>${tipo}</span>
                    </div>
                    <div class="area-req-status ${statusClass}">
                        <i class="fas fa-circle"></i>
                        <span>${estado}</span>
                    </div>
                </div>
                <div class="area-req-body">
                    <div class="area-req-icon-wrapper">
                        <div class="area-req-icon">
                            <i class="fas ${iconType}"></i>
                        </div>
                    </div>
                    <h3 class="area-req-title">${titulo}</h3>
                </div>
                <div class="area-req-info">
                    <span class="area-req-budget">S/. ${monto.toLocaleString("es-PE", {minimumFractionDigits: 2})}</span>
                    <span class="area-req-date">
                        <i class="fas fa-calendar"></i> ${fecha}
                    </span>
                </div>
            `;

            card.addEventListener("click", () => openDetailModal(index));
            return card;
        }

        // EVENT LISTENERS
        function setupEventListeners() {
            // Botón de retroceso
            document.getElementById("backBtn").addEventListener("click", () => {
                window.history.back();
            });

            // Búsqueda
            document.getElementById("searchInput").addEventListener("input", (e) => {
                const searchTerm = normalizeText(e.target.value);
                requerimientosFiltrados = todosLosRequerimientos.filter(req => {
                    const descripcion = normalizeText(req.descripcion || "");
                    const tipo = normalizeText(req.tipo || "");
                    return descripcion.includes(searchTerm) || tipo.includes(searchTerm);
                });
                renderRequerimientos();
            });

            // Crear nuevo requerimiento
            document.getElementById("createBtn").addEventListener("click", () => {
                editingReqId = null;
                document.getElementById("modalFormTitle").textContent = "Crear Nuevo Requerimiento";
                document.getElementById("requirementForm").reset();
                document.getElementById("formFecha").value = new Date().toISOString().split('T')[0];
                document.getElementById("createModal").classList.add("active");
            });

            // Cerrar modales
            document.getElementById("closeCreateModal").addEventListener("click", () => {
                document.getElementById("createModal").classList.remove("active");
            });

            document.getElementById("closeDetailModal").addEventListener("click", () => {
                document.getElementById("detailModal").classList.remove("active");
            });

            document.getElementById("cancelFormBtn").addEventListener("click", () => {
                document.getElementById("createModal").classList.remove("active");
            });

            // Guardar formulario
            document.getElementById("saveFormBtn").addEventListener("click", saveRequerimiento);

            // Acciones del detalle
            document.getElementById("viewStatusBtn").addEventListener("click", () => {
                const estado = document.getElementById("detailEstado").textContent;
                alert(`Estado actual: ${estado}`);
            });

            document.getElementById("editBtn").addEventListener("click", editRequerimiento);
            document.getElementById("deleteBtn").addEventListener("click", deleteRequerimiento);

            // Cerrar modales al hacer click fuera
            document.getElementById("createModal").addEventListener("click", (e) => {
                if (e.target.id === "createModal") {
                    e.target.classList.remove("active");
                }
            });

            document.getElementById("detailModal").addEventListener("click", (e) => {
                if (e.target.id === "detailModal") {
                    e.target.classList.remove("active");
                }
            });
        }

        // ABRIR DETALLE
        function openDetailModal(index) {
            currentReqIndex = index;
            const req = requerimientosFiltrados[index];
            
            if (!req) return;

            document.getElementById("detailTitle").textContent = req.descripcion || "Sin descripción";
            document.getElementById("detailFecha").textContent = req.fecha || "-";
            document.getElementById("detailTipo").textContent = (req.tipo || "No especificado").toUpperCase();
            document.getElementById("detailEstado").textContent = (req.estado || "PENDIENTE").toUpperCase();
            document.getElementById("detailMonto").textContent = `S/. ${Number(req.monto || 0).toLocaleString("es-PE", {minimumFractionDigits: 2})}`;
            document.getElementById("detailDescripcion").textContent = req.descripcion || "Sin descripción";
            document.getElementById("detailArea").textContent = req.area || "Sin área";

            // Cargar comentarios
            loadComments(req.id);

            document.getElementById("detailModal").classList.add("active");
        }

        // CARGAR COMENTARIOS
        function loadComments(reqId) {
            const container = document.getElementById("commentsContainer");
            
            const comentariosRef = window.firestore.collection(window.db, "comentarios");
            const q = window.firestore.query(comentariosRef, 
                window.firestore.where("requerimientoId", "==", reqId)
            );

            window.firestore.onSnapshot(q, (snapshot) => {
                if (snapshot.empty) {
                    container.innerHTML = `
                        <div class="no-comments">
                            <i class="fas fa-comment-slash"></i>
                            <p>No hay comentarios</p>
                        </div>
                    `;
                    return;
                }

                container.innerHTML = "";
                snapshot.forEach(doc => {
                    const comment = doc.data();
                    const commentEl = createCommentElement(doc.id, comment);
                    container.appendChild(commentEl);
                });
            });
        }

        function createCommentElement(commentId, comment) {
            const div = document.createElement("div");
            div.className = "comment-item";
            
            const fecha = comment.fecha ? new Date(comment.fecha.seconds * 1000).toLocaleDateString() : "-";
            
            div.innerHTML = `
                <div class="comment-header">
                    <span class="comment-author">${comment.autor || "Administrador"}</span>
                    <button class="comment-delete" data-id="${commentId}">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <p class="comment-text">${comment.texto || ""}</p>
                <span class="comment-date">${fecha}</span>
            `;

            div.querySelector(".comment-delete").addEventListener("click", async (e) => {
                e.stopPropagation();
                if (confirm("¿Eliminar este comentario?")) {
                    try {
                        const docRef = window.firestore.doc(window.db, "comentarios", commentId);
                        await window.firestore.deleteDoc(docRef);
                    } catch (error) {
                        console.error("Error al eliminar comentario:", error);
                        alert("Error al eliminar el comentario");
                    }
                }
            });

            return div;
        }

        // GUARDAR REQUERIMIENTO
        async function saveRequerimiento() {
            const fecha = document.getElementById("formFecha").value;
            const tipo = document.getElementById("formTipo").value;
            const monto = document.getElementById("formMonto").value;
            const descripcion = document.getElementById("formDescripcion").value;

            if (!fecha || !tipo || !monto || !descripcion) {
                alert("Por favor completa todos los campos");
                return;
            }

            const data = {
                fecha,
                tipo,
                monto: parseFloat(monto),
                descripcion,
                area: currentArea,
                estado: "PENDIENTE"
            };

            try {
                if (editingReqId) {
                    // EDITAR
                    const docRef = window.firestore.doc(window.db, "requerimientos", editingReqId);
                    await window.firestore.updateDoc(docRef, data);
                    alert("Requerimiento actualizado exitosamente");
                } else {
                    // CREAR
                    data.fechaCreacion = window.firestore.serverTimestamp();
                    await window.firestore.addDoc(
                        window.firestore.collection(window.db, "requerimientos"),
                        data
                    );
                    alert("Requerimiento creado exitosamente");
                }

                document.getElementById("createModal").classList.remove("active");
                document.getElementById("requirementForm").reset();
            } catch (error) {
                console.error("Error:", error);
                alert("Error al guardar el requerimiento");
            }
        }

        // EDITAR REQUERIMIENTO
        function editRequerimiento() {
            const req = requerimientosFiltrados[currentReqIndex];
            if (!req) return;

            editingReqId = req.id;
            document.getElementById("modalFormTitle").textContent = "Editar Requerimiento";
            document.getElementById("formFecha").value = req.fecha || "";
            document.getElementById("formTipo").value = req.tipo || "";
            document.getElementById("formMonto").value = req.monto || "";
            document.getElementById("formDescripcion").value = req.descripcion || "";

            document.getElementById("detailModal").classList.remove("active");
            document.getElementById("createModal").classList.add("active");
        }

        // ELIMINAR REQUERIMIENTO
        async function deleteRequerimiento() {
            const req = requerimientosFiltrados[currentReqIndex];
            if (!req) return;

            if (!confirm("¿Estás seguro de eliminar este requerimiento?")) return;

            try {
                const docRef = window.firestore.doc(window.db, "requerimientos", req.id);
                await window.firestore.deleteDoc(docRef);
                
                document.getElementById("detailModal").classList.remove("active");
                alert("Requerimiento eliminado exitosamente");
            } catch (error) {
                console.error("Error:", error);
                alert("Error al eliminar el requerimiento");
            }
        }