import { push } from 'https://www.gstatic.com/firebasejs/10.7.2/firebase-database.js'

import { 
    appState, 
    tasks, 
    invoices, 
    formTaskInput,  
    modalConfirm } from './index.js'
         
import { showModal } from './render.js'
         
import { 
    taskExists,
    enableButtons } from './helpers.js'

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
    if (!taskExists(task)) {
        push(tasks, task)
        formTaskInput.reset()
    } else {
        const ipt = document.getElementById('ipt-task-name')
        const btn = document.getElementById('btn-add-task')
        ipt.value = "Duplicate task!"
        ipt.classList.add('warning')
        enableButtons([btn], false)
        setTimeout(() => {
            ipt.value = ''
            ipt.classList.remove('warning')
            enableButtons([btn], true)
        }, 1500)
    }
}

// Called when send invoice button clicked, create an invoice obj and store it in fb
const handleSendInvoice = () => {

    // I guess we could do some checking here to prevent submission of duplicate invoices, but leaving that alone for now :-)
    const newInvoiceTasks = appState.liveTasks.map(task => task)
    const newInvoiceTotal = appState.invoiceTotal
    const newInvoiceDate = new Date().toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })

    const newInvoice = {
        tasks: newInvoiceTasks,
        total: newInvoiceTotal,
        date: newInvoiceDate
    }
    
    push(invoices, newInvoice)
    showModal(modalConfirm, true)
    // Show a modal
}