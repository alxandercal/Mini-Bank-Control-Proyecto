import {
    doc,
    getDoc,
    setDoc,
    addDoc,
    collection,
    runTransaction,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js"

import { auth, db } from "./firebase-config.js"
import {
    observeAuth,
    logoutUser
} from "./auth.js"

const depositForm = document.getElementById("depositForm")
const depositAmountInput = document.getElementById("depositAmount")
const depositBtn = document.getElementById("depositBtn")
const depositAlert = document.getElementById("depositAlert")
const depositSuccess = document.getElementById("depositSuccess")

const depositClientName = document.getElementById("depositClientName")
const depositAccountNumber = document.getElementById("depositAccountNumber")
const depositClabe = document.getElementById("depositClabe")
const depositAccountInput = document.getElementById("depositAccount")
const logoutBtn = document.getElementById("logoutBtn")

let currentUser = null
let currentClient = null

const formatMoney = value => {
    const number = Number(value) || 0

    return number.toLocaleString("es-MX", {
        style: "currency",
        currency: "MXN"
    })
}

const showError = message => {
    depositAlert.textContent = message
    depositAlert.classList.remove("d-none")

    depositSuccess.classList.add("d-none")
    depositSuccess.innerHTML = ""
}

const showSuccess = message => {
    depositSuccess.innerHTML = message
    depositSuccess.classList.remove("d-none")

    depositAlert.classList.add("d-none")
    depositAlert.textContent = ""
}

const hideMessages = () => {
    depositAlert.classList.add("d-none")
    depositAlert.textContent = ""

    depositSuccess.classList.add("d-none")
    depositSuccess.innerHTML = ""
}

const setDepositButtonReady = () => {
    depositBtn.disabled = false
    depositBtn.innerHTML = `
        <i class="bi bi-cash-coin me-2"></i>
        Confirmar depósito
    `
}

const setDepositButtonLoading = text => {
    depositBtn.disabled = true
    depositBtn.innerHTML = `
        <span class="spinner-border spinner-border-sm me-2"></span>
        ${text}
    `
}

const generateAccountNumber = uid => {
    let base = ""

    for (let i = 0; i < uid.length; i++) {
        base += uid.charCodeAt(i)
    }

    return base.replace(/\D/g, "").slice(0, 10).padEnd(10, "0")
}

const generateClabe = accountNumber => {
    return `002180${accountNumber}`.padEnd(18, "0").slice(0, 18)
}

const getCachedClient = () => {
    try {
        const savedClient = localStorage.getItem("argentariaClient")
        return savedClient ? JSON.parse(savedClient) : null
    } catch (error) {
        localStorage.removeItem("argentariaClient")
        return null
    }
}

const saveCachedClient = client => {
    localStorage.setItem("argentariaClient", JSON.stringify({
        id: client.id || "",
        name: client.name || "Cliente Argentaria",
        email: client.email || "",
        accountNumber: client.accountNumber || "",
        clabe: client.clabe || "",
        state: client.state || "Active"
    }))
}

const renderClientAccount = client => {
    depositClientName.textContent = client.name || "Cliente Argentaria"
    depositAccountNumber.textContent = client.accountNumber
    depositClabe.textContent = client.clabe
    depositAccountInput.value = client.accountNumber

    saveCachedClient(client)
    setDepositButtonReady()
}

const cachedClient = getCachedClient()

if (cachedClient?.accountNumber && cachedClient?.clabe) {
    renderClientAccount(cachedClient)
}

const getUserName = async user => {
    const userSnap = await getDoc(doc(db, "users", user.uid))

    if (userSnap.exists()) {
        const data = userSnap.data()
        return data.name || data.fullName || user.email || "Cliente Argentaria"
    }

    return user.displayName || user.email || "Cliente Argentaria"
}

const loadOrCreateClientAccount = async user => {
    const clientRef = doc(db, "clientes", user.uid)
    const clientSnap = await getDoc(clientRef)

    const userName = await getUserName(user)

    if (clientSnap.exists()) {
        const clientData = clientSnap.data()

        const accountNumber =
            clientData.accountNumber || generateAccountNumber(user.uid)

        const clabe =
            clientData.clabe || generateClabe(accountNumber)

        await setDoc(
            clientRef,
            {
                name: clientData.name || userName,
                email: clientData.email || user.email || "",
                accountNumber,
                clabe,
                state: clientData.state || "Active",
                balance: Number(clientData.balance || 0),
                updatedAt: serverTimestamp()
            },
            { merge: true }
        )

        return {
            id: user.uid,
            ...clientData,
            name: clientData.name || userName,
            email: clientData.email || user.email || "",
            accountNumber,
            clabe,
            state: clientData.state || "Active",
            balance: Number(clientData.balance || 0)
        }
    }

    const accountNumber = generateAccountNumber(user.uid)
    const clabe = generateClabe(accountNumber)

    const newClient = {
        id: user.uid,
        name: userName,
        email: user.email || "",
        accountNumber,
        clabe,
        balance: 0,
        state: "Active",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    }

    await setDoc(clientRef, newClient)

    return newClient
}

const depositToMyAccount = async amount => {
    if (!currentUser) {
        throw new Error("No hay una sesión activa")
    }

    const numericAmount = Number(amount)

    if (isNaN(numericAmount) || numericAmount <= 0) {
        throw new Error("Ingresa una cantidad válida")
    }

    const clientRef = doc(db, "clientes", currentUser.uid)

    const result = await runTransaction(db, async transaction => {
        const snap = await transaction.get(clientRef)

        if (!snap.exists()) {
            throw new Error("No se encontró tu cuenta")
        }

        const data = snap.data()

        if (data.state !== "Active") {
            throw new Error("Tu cuenta está bloqueada o inactiva")
        }

        const currentBalance = Number(data.balance || 0)
        const newBalance = currentBalance + numericAmount

        transaction.update(clientRef, {
            balance: newBalance,
            updatedAt: serverTimestamp()
        })

        return {
            previousBalance: currentBalance,
            newBalance,
            accountNumber: data.accountNumber,
            clabe: data.clabe,
            clientName: data.name || currentClient?.name || "Cliente Argentaria"
        }
    })

    await addDoc(collection(db, "movimientos"), {
        userId: currentUser.uid,
        clientId: currentUser.uid,
        type: "deposito",
        tipo: "Depósito",
        amount: numericAmount,
        monto: numericAmount,
        accountNumber: result.accountNumber,
        cuentaOrigen: "Depósito externo",
        cuentaDestino: result.accountNumber,
        clabe: result.clabe,
        concepto: "Depósito a cuenta propia",
        previousBalance: result.previousBalance,
        newBalance: result.newBalance,
        performedBy: "cliente",
        createdAt: serverTimestamp(),
        fecha: serverTimestamp()
    })

    return result
}

observeAuth(async user => {
    if (!user) {
        localStorage.removeItem("argentariaClient")
        window.location.href = "login.html"
        return
    }

    currentUser = user

    try {
        currentClient = await loadOrCreateClientAccount(user)
        renderClientAccount(currentClient)
    } catch (error) {
        console.error(error)
        showError("No se pudo cargar tu cuenta bancaria")

        depositBtn.disabled = true
        depositBtn.innerHTML = "Cuenta no disponible"
    }
})

depositForm?.addEventListener("submit", async e => {
    e.preventDefault()

    hideMessages()

    const amount = depositAmountInput.value.trim()

    try {
        setDepositButtonLoading("Procesando depósito...")

        const result = await depositToMyAccount(amount)

        if (currentClient) {
            currentClient.balance = result.newBalance
        }

        showSuccess(`
            <i class="bi bi-check-circle-fill me-2"></i>
            Depósito realizado correctamente.<br>
            <strong>Titular:</strong> ${result.clientName}<br>
            <strong>Cuenta:</strong> ${result.accountNumber}<br>
            <strong>CLABE:</strong> ${result.clabe}<br>
            <strong>Monto depositado:</strong> ${formatMoney(amount)}<br>
            <strong>Nuevo saldo:</strong> ${formatMoney(result.newBalance)}
        `)

        depositForm.reset()

    } catch (error) {
        console.error(error)
        showError(error.message || "No se pudo realizar el depósito")
    } finally {
        setDepositButtonReady()
    }
})

logoutBtn?.addEventListener("click", async e => {
    e.preventDefault()

    localStorage.removeItem("argentariaClient")
    await logoutUser()
    window.location.href = "login.html"
})