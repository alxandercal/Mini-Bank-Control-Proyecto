import {
    doc,
    getDoc,
    updateDoc,
    addDoc,
    collection,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js"

import { auth, db } from "./firebase.js"
import {
    observeAuth,
    getCurrentUserProfile,
    logoutUser,
    showAlert,
    hideAlert,
    setButtonLoading,
    getFirebaseErrorMessage
} from "./auth.js"
import { depositToAccount, formatMoney } from "./deposit.js"

const logoutBtn = document.getElementById("logoutBtn")
const withdrawBtn = document.getElementById("withdrawBtn")
const balanceText = document.getElementById("balanceText")

const depositOpenBtn = document.getElementById("depositOpenBtn")
const depositNavBtn = document.getElementById("depositNavBtn")
const depositModal = document.getElementById("depositModal")
const depositCloseBtn = document.getElementById("depositCloseBtn")
const depositCancelBtn = document.getElementById("depositCancelBtn")
const depositForm = document.getElementById("depositForm")
const depositAccountInput = document.getElementById("depositAccount")
const depositAmountInput = document.getElementById("depositAmount")
const depositBtn = document.getElementById("depositBtn")
const depositSuccess = document.getElementById("depositSuccess")

const money = new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN"
})

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

const openDepositModal = () => {
    hideAlert("depositAlert")

    if (depositSuccess) {
        depositSuccess.classList.add("d-none")
        depositSuccess.textContent = ""
    }

    depositForm?.reset()
    depositModal?.classList.add("is-open")
    depositAccountInput?.focus()
}

const closeDepositModal = () => {
    depositModal?.classList.remove("is-open")
}

const renderDepositSuccess = (result) => {
    if (!depositSuccess) return

    depositSuccess.innerHTML = `
        <i class="bi bi-check-circle-fill me-2"></i>
        Depósito exitoso a <strong>${result.clientName}</strong><br>
        Cuenta: <strong>${result.accountNumber}</strong><br>
        Monto depositado: <strong>${formatMoney(result.amount)}</strong><br>
        Nuevo saldo: <strong>${formatMoney(result.newBalance)}</strong>
    `

    depositSuccess.classList.remove("d-none")
}

depositOpenBtn?.addEventListener("click", openDepositModal)
depositNavBtn?.addEventListener("click", e => {
    e.preventDefault()
    openDepositModal()
})

depositCloseBtn?.addEventListener("click", closeDepositModal)
depositCancelBtn?.addEventListener("click", closeDepositModal)

depositModal?.addEventListener("click", e => {
    if (e.target === depositModal) {
        closeDepositModal()
    }
})

depositForm?.addEventListener("submit", async e => {
    e.preventDefault()

    hideAlert("depositAlert")

    if (depositSuccess) {
        depositSuccess.classList.add("d-none")
        depositSuccess.textContent = ""
    }

    const accountNumber = depositAccountInput.value.trim()
    const amount = depositAmountInput.value.trim()

    if (!accountNumber || !amount) {
        showAlert("depositAlert", "Todos los datos son obligatorios")
        return
    }

    if (accountNumber.length !== 10) {
        showAlert("depositAlert", "El número de cuenta debe tener 10 dígitos")
        return
    }

    if (Number(amount) <= 0) {
        showAlert("depositAlert", "La cantidad debe ser mayor a 0")
        return
    }

    try {
        setButtonLoading(
            depositBtn,
            true,
            '<i class="bi bi-currency-dollar me-2"></i>Depositar',
            "Procesando..."
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

async function retirarDinero() {
    const amount = Number(prompt("Ingresa el monto a retirar"))

    if (!amount || amount <= 0) {
        alert("Ingresa un monto válido")
        return
    }

    const user = auth.currentUser

    if (!user) {
        alert("No hay sesión iniciada")
        window.location.href = "login.html"
        return
    }

    const clientRef = doc(db, "clientes", user.uid)
    const clientSnap = await getDoc(clientRef)

    if (!clientSnap.exists()) {
        alert("No se encontró la cuenta del cliente")
        return
    }

    const clientData = clientSnap.data()
    const currentBalance = Number(clientData.balance || 0)

    if (amount > currentBalance) {
        alert("Saldo insuficiente")
        return
    }

    const newBalance = currentBalance - amount

    await updateDoc(clientRef, {
        balance: newBalance,
        updatedAt: serverTimestamp()
    })

    await addDoc(collection(db, "movimientos"), {
        userId: user.uid,
        type: "retiro",
        amount,
        previousBalance: currentBalance,
        newBalance,
        createdAt: serverTimestamp()
    })

    if (balanceText) {
        balanceText.textContent = money.format(newBalance)
    }

    alert("Retiro realizado correctamente")
}

withdrawBtn?.addEventListener("click", async () => {
    try {
        await retirarDinero()
    } catch (error) {
        console.error("Error al retirar dinero", error)
        alert("Error al retirar dinero")
    }
})

logoutBtn?.addEventListener("click", async e => {
    e.preventDefault()

    try {
        await logoutUser()
        window.location.href = "./login.html"
    } catch (error) {
        console.error("Error al cerrar sesión", error)
    }
})