import { db } from "./firebase-config.js";
import { observeAuth, logoutUser } from "./auth.js";
import { collection, query, onSnapshot } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

// Elementos de la interfaz de usuario (DOM)
const tablaMovimientos = document.getElementById("tablaMovimientos");
const totalMovimientosText = document.getElementById("totalMovimientosText");
const logoutBtn = document.getElementById("logoutBtn");
const filterForm = document.getElementById("filterForm");
const filterCuenta = document.getElementById("filterCuenta");
const filterTipo = document.getElementById("filterTipo");
const filterFecha = document.getElementById("filterFecha");
const btnLimpiarFiltros = document.getElementById("btnLimpiarFiltros");

// Memoria volátil para los filtros en tiempo de ejecución
let todosLosMovimientos = [];

// Formateador de moneda mexicana
const money = new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN"
});

// Manejo del Cierre de Sesión
logoutBtn?.addEventListener("click", async e => {
    e.preventDefault();
    await logoutUser();
    window.location.href = "login.html";
});

// Observador del estado de autenticación de Firebase
observeAuth(user => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    // Consulta en tiempo real a la colección global de movimientos
    const q = query(collection(db, "movimientos"));

    onSnapshot(q, snapshot => {
        todosLosMovimientos = [];
        const cuentasDetectadas = new Set();

        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            todosLosMovimientos.push({
                id: docSnap.id,
                ...data
            });

            if (data.cuentaOrigen) cuentasDetectadas.add(data.cuentaOrigen);
        });

        // Ordenar cronológicamente (más recientes primero)
        todosLosMovimientos.sort((a, b) => {
            const fechaA = a.fecha || a.createdAt;
            const fechaB = b.fecha || b.createdAt;
            const timeA = fechaA?.toDate ? fechaA.toDate().getTime() : 0;
            const timeB = fechaB?.toDate ? fechaB.toDate().getTime() : 0;
            return timeB - timeA;
        });

        actualizarSelectorCuentas(cuentasDetectadas);
        renderizarTabla(todosLosMovimientos);
    }, error => {
        console.error("Error al cargar movimientos:", error);
        tablaMovimientos.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-4 text-danger">
                    <i class="bi bi-exclamation-triangle-fill me-2"></i> Error al cargar datos desde la base de datos.
                </td>
            </tr>
        `;
    });
});

// Rellena el selector de cuentas dinámicamente
function actualizarSelectorCuentas(cuentasSet) {
    const valorGuardado = filterCuenta.value;
    filterCuenta.innerHTML = '<option value="todos">Todas las cuentas</option>';
    cuentasSet.forEach(cuenta => {
        const opt = document.createElement("option");
        opt.value = cuenta;
        opt.textContent = cuenta;
        if (cuenta === valorGuardado) opt.selected = true;
        filterCuenta.appendChild(opt);
    });
}

// Renderiza las filas de la tabla según los datos provistos
function renderizarTabla(lista) {
    if (lista.length === 0) {
        tablaMovimientos.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-5 text-muted">
                    <i class="bi bi-hourglass-split d-block fs-2 mb-2"></i>
                    No se encontraron movimientos con los criterios seleccionados.
                </td>
            </tr>
        `;
        totalMovimientosText.innerText = "Mostrando 0 movimientos";
        return;
    }

    let htmlRows = "";

    lista.forEach(movimiento => {
        const fecha = movimiento.fecha || movimiento.createdAt;
        let fechaFormateada = "Reciente";
        let horaFormateada = "";
        let inputFechaIso = "";

        if (fecha?.toDate) {
            const dateObj = fecha.toDate();
            fechaFormateada = dateObj.toLocaleDateString("es-MX", {
                day: "2-digit",
                month: "short",
                year: "numeric"
            });
            horaFormateada = dateObj.toLocaleTimeString("es-MX", {
                hour: "2-digit",
                minute: "2-digit"
            });
            
            const yyyy = dateObj.getFullYear();
            const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
            const dd = String(dateObj.getDate()).padStart(2, '0');
            inputFechaIso = `${yyyy}-${mm}-${dd}`;
        }

        movimiento.fechaIsoString = inputFechaIso;

        const tipo = movimiento.tipo || movimiento.type || "Movimiento";
        const monto = Number(movimiento.monto || movimiento.amount || 0);

        let badgeClass = "bg-primary-subtle text-primary border-primary-subtle";
        let montoClass = "text-danger";
        let signo = "-";

        const tipoLower = tipo.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        if (tipoLower === "deposito") {
            badgeClass = "bg-success-subtle text-success border-success-subtle";
            montoClass = "text-success";
            signo = "+";
        } else if (tipoLower === "retiro") {
            badgeClass = "bg-danger-subtle text-danger border-danger-subtle";
            montoClass = "text-danger";
            signo = "-";
        } else if (tipoLower === "transferencia") {
            badgeClass = "bg-warning-subtle text-warning border-warning-subtle";
            montoClass = "text-danger";
            signo = "-";
        }

        htmlRows += `
            <tr>
                <td class="ps-4">
                    <div class="fw-semibold">${fechaFormateada}</div>
                    <small class="text-muted">${horaFormateada}</small>
                </td>
                <td class="text-monospace text-muted small">
                    #${movimiento.id.substring(0, 7).toUpperCase()}
                </td>
                <td>
                    <div class="fw-semibold">${movimiento.concepto || "Sin concepto"}</div>
                    <small class="text-muted">
                        ${movimiento.cuentaOrigen || "N/A"} ${movimiento.cuentaDestino ? `➔ ${movimiento.cuentaDestino}` : ''}
                    </small>
                </td>
                <td>
                    <span class="badge ${badgeClass} border rounded-pill px-3">
                        ${tipo}
                    </span>
                </td>
                <td class="text-end pe-4 fw-bold ${montoClass}">
                    ${signo}${money.format(monto)}
                </td>
            </tr>
        `;
    });

    tablaMovimientos.innerHTML = htmlRows;
    totalMovimientosText.innerText = `Mostrando ${lista.length} ${lista.length === 1 ? "movimiento" : "movimientos"}`;
}

// Escucha del Formulario de Filtros
filterForm?.addEventListener("submit", (e) => {
    e.preventDefault();

    const cuentaSel = filterCuenta.value;
    const tipoSel = filterTipo.value;
    const fechaSel = filterFecha.value;

    const resultadosFiltrados = todosLosMovimientos.filter(mov => {
        if (cuentaSel !== "todos" && mov.cuentaOrigen !== cuentaSel && mov.cuentaDestino !== cuentaSel) {
            return false;
        }

        if (tipoSel !== "todos") {
            const tipoMovClean = (mov.tipo || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            if (tipoMovClean !== tipoSel) return false;
        }

        if (fechaSel && mov.fechaIsoString !== fechaSel) {
            return false;
        }

        return true;
    });

    renderizarTabla(resultadosFiltrados);
});

// Resetear Filtros
btnLimpiarFiltros?.addEventListener("click", () => {
    filterForm.reset();
    renderizarTabla(todosLosMovimientos);
});