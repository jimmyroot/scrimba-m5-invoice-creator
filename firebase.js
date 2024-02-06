// ------------------------------------------------------------------------- //
// --- firebase.js — some small helper functions for firebase db actions --- //
// ------------------------------------------------------------------------- //

import { 
    ref, 
    remove } from 'https://www.gstatic.com/firebasejs/10.7.2/firebase-database.js'
    
import { db } from './index.js'

import { renderInvoiceHistory } from './render.js'

export { 
    removeTaskFromDB,
    removeInvoiceFromDB }

const removeTaskFromDB = key => {
    const taskRef = ref(db, `tasks/${key}`)
    remove(taskRef)
}

const removeInvoiceFromDB = key => {
    const invoiceRef = ref(db, `invoices/${key}`)
    remove(invoiceRef)
    renderInvoiceHistory()
}