//deposit.js
import {
    collection,
    query,
    where,
    getDocs,
    doc,
    getDoc,
    runTransaction,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js"

import { db } from "./firebase-config.js"

// busca un cliente por su numero de cuenta
export async function findClientByAccountNumber(accountNumber) {
    const clientesRef = collection(db, "clientes")
    const q = query(clientesRef, where("accountNumber", "==", accountNumber))
    const snap = await getDocs(q)

    if (snap.empty) return null

    const docSnap = snap.docs[0]
    return {
        id: docSnap.id,
        data: docSnap.data()
    }
}

// deposita dinero en la cuenta del cliente
// se usa una transaccion para que dos depositos al mismo tiempo no se pisen
export async function depositToAccount({ accountNumber, amount }) {

    if (!accountNumber) {
        throw new Error("debes ingresar un numero de cuenta")
    }

    const numericAmount = Number(amount)

    if (isNaN(numericAmount) || numericAmount <= 0) {
        throw new Error("la cantidad debe ser mayor a 0")
    }

    const client = await findClientByAccountNumber(accountNumber)

    if (!client) {
        throw new Error("no se encontro ninguna cuenta con ese numero")
    }

    const clientRef = doc(db, "clientes", client.id)

    const result = await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(clientRef)

        if (!snap.exists()) {
            throw new Error("la cuenta dejo de existir")
        }

        const currentBalance = Number(snap.data().balance) || 0
        const newBalance = currentBalance + numericAmount

        transaction.update(clientRef, {
            balance: newBalance,
            updatedAt: serverTimestamp()
        })

        return { currentBalance, newBalance }
    })

    return {
        accountNumber,
        previousBalance: result.currentBalance,
        newBalance: result.newBalance,
        amount: numericAmount
    }
}

// formatea un numero como moneda mexicana
export function formatMoney(value) {
    const number = Number(value) || 0
    return number.toLocaleString("es-MX", {
        style: "currency",
        currency: "MXN"
    })
}