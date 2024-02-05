import { get, ref } from  'https://www.gstatic.com/firebasejs/10.7.2/firebase-database.js'

import { 
    liveTasks,
    ulTasks, 
    btnSendInvoice, 
    btnReset, 
    resetLocalTasks, 
    incrementTotal,
    modalHistory,
    modalSingleInvoiceView,
    db,
    invoices } from "./index.js"

import { 
    enableButtons, 
    renderinvoiceTotal,
    showSpinner,
    resetInvoice } from "./helpers.js"

export { 
    renderTasks, 
    renderInvoiceHistory, 
    showModal, 
    renderSingleInvoice }

// Render tasks in the live invoice view
const renderTasks = tasks => {
    resetLocalTasks()

    const html = Object.keys(tasks).map(key => {
        const { name, price } = tasks[key]
        liveTasks.push([name, price]) // Keep local tasklist in sync with DB
        incrementTotal(price)
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

    ulTasks.innerHTML = html
   
    enableButtons([btnSendInvoice, btnReset], true)
    renderinvoiceTotal()
}

// Using 'get' to perform a single read of the invoices data, preventing it from rendering in the background
// if we use 'onValue'. Called when modal displayed, or when an invoices is removed from the db
const renderInvoiceHistory = () => {
    const ulInvoiceHistory = document.getElementById('ul-invoice-history')
    showSpinner(modalHistory, true)
    get(invoices).then(snapshot => {
        if (snapshot.exists()) {
            showSpinner(modalHistory, false)
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
            showSpinner(modalHistory, false)
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

// Renders one invoice into the single invoice view modal
const renderSingleInvoice = invoiceId => {
    if (invoiceId) {
        showSpinner(modalSingleInvoiceView, true)

        get(ref(db, `invoices/${invoiceId}/`)).then(snapshot => {
            showSpinner(modalSingleInvoiceView, false)
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

// Show/hide modals and do any set-up, pre-rendering or clean-up afterwards
const showModal = (modal, doShow, key) => {

    // If we need to do anything before modal shows, do it below
    const getReadyToShow = {
        'modal-invoice-history': () => {
            renderInvoiceHistory()
            // Adjust height of modal to keep things neat ^_^
            modalHistory.style.height = document.getElementById('div-container').offsetHeight - 40
        },
        'modal-single-invoice-view': () => {
            modalSingleInvoiceView.style.height = document.getElementById('div-container').offsetHeight - 40
            renderSingleInvoice(key)
        },
        'modal-confirm': () => {
            const h = document.getElementById('hdr-modal-confirm')
            const btn = document.getElementById('btn-modal-confirm-close')
            h.textContent = ''
            enableButtons([btn], false)
            h.classList.add('spinner')
            setTimeout(() => {
                h.classList.remove('spinner')
                h.textContent = 'Invoice sent 💸'
                enableButtons([btn], true)
            }, 2000)
        }

    }
    
    // If we need to clean anything up after we're done with a modal, we can do that here
    const cleanUp = {
        'modal-confirm': () => {
            resetInvoice()
        }
    }
    
    // Show the modal and run the above set-up/clean-up code if specified
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