import {
    doc,
    getDoc,
    updateDoc,
    addDoc,
    collection,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js"

import { auth, db } from "./firebase.js"
import { logoutUser, showAlert, hideAlert, setButtonLoading } from "./auth.js"

const form = document.getElementById("retirarForm")
const amountInput = document.getElementById("amount")
const retirarBtn = document.getElementById("retirarBtn")
const logoutBtn = document.getElementById("logoutBtn")

form?.addEventListener("submit", async e => {
    e.preventDefault()

    hideAlert("retirarAlert")
    hideAlert("retirarSuccess")

    const amount = Number(amountInput.value)

    if (!amount || amount <= 0) {
        showAlert("retirarAlert", "Ingresa un monto válido")
        return
    }

    try {
        setButtonLoading(
            retirarBtn,
            true,
            '<i class="bi bi-cash-stack me-2"></i> Retirar dinero',
            "Procesando retiro..."
        )

        const user = auth.currentUser

        if (!user) {
            window.location.href = "login.html"
            return
        }

        const clientRef = doc(db, "clientes", user.uid)
        const clientSnap = await getDoc(clientRef)

        if (!clientSnap.exists()) {
            showAlert("retirarAlert", "No se encontró la cuenta del cliente")
            return
        }

        const clientData = clientSnap.data()
        const currentBalance = Number(clientData.balance || 0)

        if (amount > currentBalance) {
            showAlert("retirarAlert", "Saldo insuficiente")
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

        amountInput.value = ""
        showAlert("retirarSuccess", "Retiro realizado correctamente")

    } catch (error) {
        console.error(error)
        showAlert("retirarAlert", "Error al retirar dinero")
    } finally {
        setButtonLoading(
            retirarBtn,
            false,
            '<i class="bi bi-cash-stack me-2"></i> Retirar dinero'
        )
    }
})

logoutBtn?.addEventListener("click", async e => {
    e.preventDefault()
    await logoutUser()
    window.location.href = "login.html"
})