// -------------------------------------------------------------------------------- //
// --- handlers.js — event handlers called mostly from index.js event listeners --- //
// -------------------------------------------------------------------------------- //

import { push } from 'https://www.gstatic.com/firebasejs/10.7.2/firebase-database.js'

import * as app from './index.js'
import * as render from './render.js'
import * as helpers from './helpers.js'

export { 
    handleFormSubmit, 
    handleSendInvoice }

const handleFormSubmit = form => {
    // Form stuff
    const data = new FormData(form)
    const task = {
        name: data.get('name'),
        price: +(data.get('price'))
    }
    // Make sure there's no duplicate then push
    if (!helpers.taskExists(task)) {
        push(app.tasks, task)
        app.formTaskInput.reset()
    } else {
        // Show warning if duplicate task
        const ipt = document.getElementById('ipt-task-name')
        const btn = document.getElementById('btn-add-task')
        ipt.value = "Duplicate task!"
        ipt.classList.add('warning')
        helpers.enableButtons([btn], false)
        setTimeout(() => {
            ipt.value = ''
            ipt.classList.remove('warning')
            helpers.enableButtons([btn], true)
        }, 1500)
    }
}

// Called when send invoice button clicked, create an invoice obj and store it in fb
const handleSendInvoice = () => {

    // I guess we could do some checking here to prevent submission of duplicate invoices, but leaving that alone for now :-)
    const newInvoiceTasks = app.appState.liveTasks.map(task => task)
    const newInvoiceTotal = app.appState.invoiceTotal
    const newInvoiceDate = new Date().toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })

    const newInvoice = {
        tasks: newInvoiceTasks,
        total: newInvoiceTotal,
        date: newInvoiceDate
    }
    
    push(app.invoices, newInvoice)
    render.showModal(app.modalConfirm, true)
    // Show a modal
}