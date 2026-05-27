import { db } from "./assets/js/firebase-config.js"; 
import { collection, addDoc, serverTimestamp, onSnapshot } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

const transferForm = document.getElementById('transferForm');        
const alertContainer = document.getElementById('alertContainer');
const btnTransferir = document.getElementById('btnTransferir');
const cuentaOrigenSelect = document.getElementById('cuentaOrigen');

// Escucha en tiempo real todos los movimientos de la base de datos
onSnapshot(collection(db, "movimientos"), (snapshot) => {
    const saldosCuentas = {};

    // 1. Recorrer el historial completo para extraer qué cuentas existen y calcular sus saldos reales
    snapshot.forEach((doc) => {
        const data = doc.data();
        const monto = parseFloat(data.monto) || 0;
        const tipo = data.tipo ? data.tipo.toLowerCase() : "";
        const cuenta = data.cuentaOrigen; // Nombre o número de cuenta registrado

        if (!cuenta) return;

        // Si la cuenta no ha sido registrada en el mapa, la inicializamos en cero
        if (saldosCuentas[cuenta] === undefined) {
            saldosCuentas[cuenta] = 0;
        }

        // Sumar o restar según la naturaleza del movimiento detectado
        if (tipo === "depósito" || tipo === "deposito") {
            saldosCuentas[cuenta] += monto;
        } else if (tipo === "retiro" || tipo === "transferencia") {
            saldosCuentas[cuenta] -= monto;
        }
    });

    // Guardar la cuenta que el usuario tenía seleccionada previamente para no romper su experiencia al actualizarse
    const cuentaSeleccionadaPreviamente = cuentaOrigenSelect.value;

    // 2. Limpiar el selector y construir las opciones basándonos EXCLUSIVAMENTE en los datos reales detectados
    cuentaOrigenSelect.innerHTML = "";

    const listaCuentasDetectadas = Object.keys(saldosCuentas);

    if (listaCuentasDetectadas.length === 0) {
        cuentaOrigenSelect.innerHTML = `<option value="" disabled selected>No se encontraron transacciones previas para rastrear saldos</option>`;
        return;
    }

    // Añadir la opción por defecto constructiva
    const defaultOption = document.createElement('option');
    defaultOption.value = "";
    defaultOption.disabled = true;
    defaultOption.selected = !cuentaSeleccionadaPreviamente;
    defaultOption.textContent = "Seleccionar la cuenta origen";
    cuentaOrigenSelect.appendChild(defaultOption);

    // Insertar dinámicamente las cuentas calculadas con su saldo real
    listaCuentasDetectadas.forEach((nombreCuenta) => {
        const option = document.createElement('option');
        option.value = nombreCuenta;
        option.textContent = `${nombreCuenta} - Saldo: $${saldosCuentas[nombreCuenta].toFixed(2)}`;
                
        // Mantener la selección si ya la había marcado
        if (nombreCuenta === cuentaSeleccionadaPreviamente) {
            option.selected = true;
        }
                
        // Guardar el saldo numérico en un atributo personalizado para usarlo en las validaciones de envío
        option.dataset.saldo = saldosCuentas[nombreCuenta];
        cuentaOrigenSelect.appendChild(option);
    });
});

    // Controlar el envío del formulario con validación basada en el saldo real renderizado
transferForm.addEventListener('submit', async (e) => {
    e.preventDefault(); 

    const origen = cuentaOrigenSelect.value;
    const destino = document.getElementById('cuentaDestino').value;
    const monto = parseFloat(document.getElementById('montoTransferir').value);
    const concepto = document.getElementById('conceptoTransferencia').value;

    // Obtener el saldo desde el atributo "data-saldo" de la opción seleccionada actualmente
    const opcionSeleccionada = cuentaOrigenSelect.options[cuentaOrigenSelect.selectedIndex];
    const saldoDisponible = parseFloat(opcionSeleccionada.dataset.saldo) || 0;

    if (monto > saldoDisponible) {
        alertContainer.innerHTML = `
            <div class="alert alert-danger alert-dismissible fade show rounded-3" role="alert">
                <i class="bi bi-exclamation-triangle-fill me-2"></i> <strong>Saldo insuficiente:</strong> Intentas transferir $${monto.toFixed(2)} pero tu cuenta seleccionada solo dispone de $${saldoDisponible.toFixed(2)}.
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
        return;
    }

    btnTransferir.disabled = true;
    btnTransferir.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Procesando...`;

    try {
        await addDoc(collection(db, "movimientos"), {
            cuentaOrigen: origen,
            cuentaDestino: destino,
            monto: monto,
            concepto: concepto,
            tipo: "Transferencia",
            fecha: serverTimestamp()
        });

        alertContainer.innerHTML = `
            <div class="alert alert-success alert-dismissible fade show rounded-3" role="alert">
                <i class="bi bi-check-circle-fill me-2"></i> ¡Transferencia realizada con éxito! Se ha guardado en tu historial.
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;

        transferForm.reset();

    } catch (error) {
        console.error("Error al guardar la transferencia: ", error);
        alertContainer.innerHTML = `
            <div class="alert alert-danger alert-dismissible fade show rounded-3" role="alert">
                <i class="bi bi-exclamation-triangle-fill me-2"></i> Error al procesar la transferencia. Inténtalo de nuevo.
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
    } finally {
        btnTransferir.disabled = false;
        btnTransferir.innerHTML = `<i class="bi bi-arrow-left-right me-2"></i> Ejecutar Transferencia`;
    }
});


        