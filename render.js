// -------------------------------------------------------------------------------------- //
// --- render.js — functions relating to putting things on the screen, html or modals --- //
// -------------------------------------------------------------------------------------- //

import { get, ref } from 'https://www.gstatic.com/firebasejs/10.7.2/firebase-database.js'

import * as app from './index.js'
import * as helpers from './helpers.js'

export { 
    renderTasks, 
    renderInvoiceTotal, 
    renderInvoiceHistory, 
    renderSingleInvoice, 
    showModal }

// Render the live tasks list on the main app page
const renderTasks = tasks => {
    app.appState.liveTasks = []
    app.appState.invoiceTotal = 0
    
    const html = Object.keys(tasks).map(key => {
        const { name, price } = tasks[key]
        app.appState.liveTasks.push([name, price]) // Keep local tasklist in sync with DB
        app.appState.invoiceTotal += price
        return `
            <li class="li-invoice-task">
                <p>${name}</p>
                <button class="btn-remove-task" data-type="taskDelete" data-key="${key}">REMOVE</button>
                <p>
                    <span class="spn-primary">£</span>
                    ${price}
                </p>
            </li>
        `
    }).join('')

    app.ulTasks.innerHTML = html
   
    helpers.enableButtons([app.btnSendInvoice, app.btnReset], true)
    renderInvoiceTotal()
}

const renderInvoiceTotal = () => {
    document.getElementById('p-invoice-footer-total').innerHTML = `<span class="spn-primary">£</span> ${app.appState.invoiceTotal}`
}

// Using 'get' to perform a single read of the invoices data, 
// preventing it from rendering in the background if we use 
// 'onValue'. Called when the history modal is displayed, or
// when an invoices is removed from the db
const renderInvoiceHistory = () => {
    const ulInvoiceHistory = document.getElementById('ul-invoice-history')
    helpers.showSpinner(app.modalHistory, true)
    get(app.invoices).then(snapshot => {
        if (snapshot.exists()) {
            helpers.showSpinner(app.modalHistory, false)
            const invoiceHistory = snapshot.val()
            ulInvoiceHistory.innerHTML = Object.keys(invoiceHistory).map((key, index, arr) => {
                const { date, tasks, total } = invoiceHistory[key]
                const isLastIter = ((index + 1) === arr.length)
                return `
                    <li class="li-invoice-history">
                        <p>Date: <span class="spn-highlight">${date}</span></p>
                        <p>Tasks: <span class="spn-highlight">${tasks.length}</span></p>
                        <p>Total: £<span class="spn-highlight">${total}</span></p>
                        <button class="btn-invoice-history" data-type="invoiceDelete" data-key=${key}>
                            <i class='bx bx-x bx-md'></i>
                        </button>
                        <button class="btn-invoice-history" data-type="invoiceView" data-key=${key}>
                            <i class='bx bx-show-alt bx-md'></i>
                        </button>
                    </li>
                    ${isLastIter ? '' : '<div class="div-modal-divider"></div>'}
                `
            }).join('')
        } else {
            helpers.showSpinner(app.modalHistory, false)
            ulInvoiceHistory.innerHTML = `
                <li>
                    <p class="p-no-history">No history...time to do some work 😅 !</p>
                </li>
            `
        }
    }).catch(error => {
        console.error(error)
    })
}

// Render one invoice into the Single Invoice View modal 
const renderSingleInvoice = invoiceId => {
    if (invoiceId) {
        helpers.showSpinner(app.modalSingleInvoiceView, true)

        get(ref(app.db, `invoices/${invoiceId}/`)).then(snapshot => {
            helpers.showSpinner(app.modalSingleInvoiceView, false)
            const { date, tasks, total } = snapshot.val()
            document.getElementById('sec-modal-invoice').innerHTML = `
            
            <h3 class="h3-single-invoice">Sent on: ${date}</h3>
            <div class="div-invoice-header">
                <h2 class="h2-invoice">TASK</h2>
                <h2 class="h2-invoice">COST</h2>
            </div>
            <ul class="ul-modal overflow-thin-scrollbar" id="ul-invoice-tasks">
                ${tasks.map(task => {
                    const [ name, price ] = task 
                    return `
                        <li class="li-invoice-task">
                            <p>${name}</p>
                            <p class="p-task-price">
                                <span class="spn-primary">£</span>
                                ${price}
                            </p>
                        </li>`
                    }).join('')
                }
            </ul>
            <div class="div-invoice-footer" id="div-invoice-footer">
                <div class="div-footer">
                    <h2 class="h2-invoice">STATUS</h2>
                    <h2 class="h2-invoice">TOTAL AMOUNT</h2>
                </div>
                <div class="div-footer">
                    <p class="p-paid">PAID</p>
                    <p class="p-invoice-footer-total" id="p-invoice-footer-total">
                        <span class="spn-primary">£</span> 
                        ${total}
                    </p>
                </div>
            </div>
            `
        })
    }
}

// Used to show modals and also to run any extra code that we might 
// want to execute before displaying the modal, i.e. render a single invoice
// also has ability to run code when we close a modal, if we wish
const showModal = (modal, doShow, key) => {
    // These functions will be called before the modal displays
    const getReadyToShow = {
        'modal-invoice-history': () => {
            renderInvoiceHistory()
            helpers.setModalHeight(modal)
        },
        'modal-single-invoice-view': () => {
            renderSingleInvoice(key)
            helpers.setModalHeight(modal)
        },
        'modal-confirm': () => {
            const h = document.getElementById('hdr-modal-confirm')
            const btn = document.getElementById('btn-modal-confirm-close')
            h.textContent = ''
            helpers.enableButtons([btn], false)
            helpers.showSpinner(h, true)
            setTimeout(() => {
                helpers.showSpinner(h, false)
                h.textContent = 'Invoice sent 💸'
                helpers.enableButtons([btn], true)
            }, 2000)
        }

    }
    
    // These functions can be called when a modal is closed
    const cleanUp = {
        'modal-confirm': () => {
            helpers.resetInvoice()
        }
    }
    
    // are we showing (doShow = true) or not?
    if (doShow) {
        // If we specified any setup code for the modal, run it now
        if (Object.keys(getReadyToShow).includes(modal.id)) getReadyToShow[modal.id]()
        document.querySelectorAll('dialog').forEach(dialog => dialog.close())
        modal.showModal()
    } else {
        // If there's any cleanup code to run, do so
        if (Object.keys(cleanUp).includes(modal.id)) cleanUp[modal.id]()
        modal.close()
    }
}