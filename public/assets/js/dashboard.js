import {
    doc,
    getDoc,
    updateDoc,
    addDoc,
    collection,
    serverTimestamp,
    onSnapshot,
    query,
    where
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js"

import { auth, db } from "./firebase-config.js"
import {
    observeAuth,
    getCurrentUserProfile,
    logoutUser
} from "./auth.js"

const logoutBtn = document.getElementById("logoutBtn")
const withdrawBtn = document.getElementById("withdrawBtn")
const balanceText = document.getElementById("balanceText")
const depositText = document.getElementById("depositText")
const withdrawText = document.getElementById("withdrawText")

const depositOpenBtn = document.getElementById("depositOpenBtn")
const depositNavBtn = document.getElementById("depositNavBtn")

const money = new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN"
})

const formatMoney = value => money.format(Number(value) || 0)

const saveDashboardCache = data => {
    localStorage.setItem("argentariaDashboard", JSON.stringify(data))
}

const getDashboardCache = () => {
    try {
        const saved = localStorage.getItem("argentariaDashboard")
        return saved ? JSON.parse(saved) : null
    } catch (error) {
        localStorage.removeItem("argentariaDashboard")
        return null
    }
}

const renderDashboard = data => {
    if (balanceText) balanceText.textContent = formatMoney(data.balance)
    if (depositText) depositText.textContent = formatMoney(data.totalDepositos)
    if (withdrawText) withdrawText.textContent = formatMoney(data.totalRetiros)
}

const cachedDashboard = getDashboardCache()

if (cachedDashboard) {
    renderDashboard(cachedDashboard)
}

observeAuth(async user => {
    if (!user) {
        localStorage.removeItem("argentariaDashboard")
        window.location.href = "./login.html"
        return
    }

    try {
        const profile = await getCurrentUserProfile(user.uid)
        console.log("profile =>", profile)
    } catch (error) {
        console.log(error)
    }

    const currentDashboard = {
        balance: cachedDashboard?.balance || 0,
        totalDepositos: cachedDashboard?.totalDepositos || 0,
        totalRetiros: cachedDashboard?.totalRetiros || 0
    }

    const clientRef = doc(db, "clientes", user.uid)

    onSnapshot(clientRef, snap => {
        if (!snap.exists()) {
            currentDashboard.balance = 0
            renderDashboard(currentDashboard)
            saveDashboardCache(currentDashboard)
            return
        }

        const data = snap.data()
        currentDashboard.balance = Number(data.balance || 0)

        renderDashboard(currentDashboard)
        saveDashboardCache(currentDashboard)
    })

    const movimientosQuery = query(
        collection(db, "movimientos"),
        where("userId", "==", user.uid)
    )

    onSnapshot(movimientosQuery, snap => {
        let totalDepositos = 0
        let totalRetiros = 0

        snap.forEach(docSnap => {
            const data = docSnap.data()
            const amount = Number(data.amount || data.monto || 0)
            const type = data.type || data.tipo || ""

            if (
                type === "deposito" ||
                type === "deposit" ||
                type === "Depósito"
            ) {
                totalDepositos += amount
            }

            if (
                type === "retiro" ||
                type === "Retiro" ||
                type === "transferencia" ||
                type === "Transferencia"
            ) {
                totalRetiros += amount
            }
        })

        currentDashboard.totalDepositos = totalDepositos
        currentDashboard.totalRetiros = totalRetiros

        renderDashboard(currentDashboard)
        saveDashboardCache(currentDashboard)
    })
})

depositOpenBtn?.addEventListener("click", () => {
    window.location.href = "depositar.html"
})

depositNavBtn?.addEventListener("click", e => {
    e.preventDefault()
    window.location.href = "depositar.html"
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
        clientId: user.uid,
        type: "retiro",
        tipo: "Retiro",
        amount,
        monto: amount,
        accountNumber: clientData.accountNumber || "",
        cuentaOrigen: clientData.accountNumber || "",
        cuentaDestino: "Retiro de efectivo",
        concepto: "Retiro de efectivo",
        previousBalance: currentBalance,
        newBalance,
        createdAt: serverTimestamp(),
        fecha: serverTimestamp()
    })

    const cached = getDashboardCache() || {
        balance: 0,
        totalDepositos: 0,
        totalRetiros: 0
    }

    cached.balance = newBalance
    cached.totalRetiros = Number(cached.totalRetiros || 0) + amount

    saveDashboardCache(cached)
    renderDashboard(cached)

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
        localStorage.removeItem("argentariaDashboard")
        localStorage.removeItem("argentariaClient")

        await logoutUser()
        window.location.href = "./login.html"
    } catch (error) {
        console.error("Error al cerrar sesión", error)
    }
})