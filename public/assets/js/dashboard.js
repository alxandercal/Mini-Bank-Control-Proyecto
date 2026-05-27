//dashboard.js

import { observeAuth, getCurrentUserProfile, logoutUser, showAlert, hideAlert, setButtonLoading, getFirebaseErrorMessage } from "./auth.js"
import { depositToAccount, formatMoney } from "./deposit.js"

// constantes del modal de deposito
const depositOpenBtn = document.getElementById("depositOpenBtn")
const depositModal = document.getElementById("depositModal")
const depositCloseBtn = document.getElementById("depositCloseBtn")
const depositCancelBtn = document.getElementById("depositCancelBtn")
const depositForm = document.getElementById("depositForm")
const depositAccountInput = document.getElementById("depositAccount")
const depositAmountInput = document.getElementById("depositAmount")
const depositBtn = document.getElementById("depositBtn")
const depositSuccess = document.getElementById("depositSuccess")

// funciones del modal de deposito

const openDepositModal = () => {
    hideAlert("depositAlert")
    depositSuccess.classList.add("d-none")
    depositSuccess.textContent = ""
    depositForm.reset()
    depositModal.classList.add("is-open")
    depositAccountInput.focus()
}

const closeDepositModal = () => {
    depositModal.classList.remove("is-open")
}

const renderDepositSuccess = (result) => {
    depositSuccess.innerHTML = `
        <i class="bi bi-check-circle-fill me-2"></i>
        Deposito exitoso a <strong>${result.clientName}</strong><br>
        Cuenta: <strong>${result.accountNumber}</strong><br>
        Monto depositado: <strong>${formatMoney(result.amount)}</strong><br>
        Nuevo saldo: <strong>${formatMoney(result.newBalance)}</strong>
    `
    depositSuccess.classList.remove("d-none")
}

// terminan funciones del modal de deposito

observeAuth(async (user) => {
    if (!user) {
        window.location.href = "./login.html"
        return
    }

    try {
        const profile = await getCurrentUserProfile(user.uid)
        console.log("profile =>", profile)
    } catch (error) {
        console.log(error)
    }
})

// abrir / cerrar modal
depositOpenBtn?.addEventListener("click", openDepositModal)
depositCloseBtn?.addEventListener("click", closeDepositModal)
depositCancelBtn?.addEventListener("click", closeDepositModal)

// cerrar modal al hacer click fuera
depositModal?.addEventListener("click", (e) => {
    if (e.target === depositModal) closeDepositModal()
})

// submit del formulario de deposito
depositForm?.addEventListener("submit", async (e) => {
    e.preventDefault()

    hideAlert("depositAlert")
    depositSuccess.classList.add("d-none")
    depositSuccess.textContent = ""

    const accountNumber = depositAccountInput.value.trim()
    const amount = depositAmountInput.value.trim()

    // validaciones de front
    if (!accountNumber || !amount) {
        showAlert("depositAlert", "todos los datos son obligatorios")
        return
    }

    if (accountNumber.length !== 10) {
        showAlert("depositAlert", "el numero de cuenta debe tener 10 digitos")
        return
    }

    if (Number(amount) <= 0) {
        showAlert("depositAlert", "la cantidad debe ser mayor a 0")
        return
    }

    try {
        setButtonLoading(
            depositBtn,
            true,
            '<i class="bi bi-currency-dollar me-2"></i>Depositar',
            'Procesando...'
        )

        const result = await depositToAccount({
            accountNumber,
            amount,
            performedBy: "dashboard"
        })

        renderDepositSuccess(result)
        depositForm.reset()

    } catch (error) {
        console.log(error)
        const message = error?.message || getFirebaseErrorMessage(error)
        showAlert("depositAlert", message)
    } finally {
        setButtonLoading(
            depositBtn,
            false,
            '<i class="bi bi-currency-dollar me-2"></i>Depositar'
        )
    }
})
// logout
const logoutBtn = document.querySelector('a[data-action="logout"]')

logoutBtn?.addEventListener("click", async (e) => {
    e.preventDefault()
    await logoutUser()
    window.location.href = "./login.html"
})