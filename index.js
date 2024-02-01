// TODO: Implement history modal
// TODO: Style everything
// TODO: Dark mode toggle
// TODO: Message if duplicate task entered
// TODO: Clear inputs
// TODO: Fix button states

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js'
import { getDatabase, ref, onValue, push, remove, child, get } from 'https://www.gstatic.com/firebasejs/10.7.2/firebase-database.js'
// import { v4 as uuidv4 } from 'https://jspm.dev/uuid'

// Init firebase
const cfg = {
    databaseURL: 'https://invoice-creator-a9ba5-default-rtdb.europe-west1.firebasedatabase.app/'
}

const app = initializeApp(cfg)
const db = getDatabase(app)
const tasks = ref(db, 'tasks')
const invoices = ref(db, 'invoices')
const userPrefs = ref(db, 'userPrefs')

// Grab the DOM elements we need
const formTaskInput = document.querySelectorAll('#frm-task-input')[0]
const ulTasks = document.getElementById('ul-invoice-tasks')
const btnSendInvoice = document.getElementById('btn-send-invoice')
const btnReset = document.getElementById('btn-reset')
const modalHistory = document.getElementById('modal-invoice-history')

// We'll maintain a local array of current tasks, so we can check if tasks already exists.
// This means we don't need to check the db every time we add a new task
let liveTasks = []
let invoiceTotal = 0

// ----------------------- //
// --- EVENT LISTENERS --- //
// ----------------------- //

formTaskInput.addEventListener('submit', e => {
    e.preventDefault()
    const form = e.target
    // Check if task input field contains something, then submit the form
    if (isFormComplete(form)) handleFormSubmit(form)
})

formTaskInput.addEventListener('input', e => {        
    const input = e.target
    if (input.classList.contains('warning')) input.classList.remove('warning')
    if (input.value) enableButtons([btnReset], true)
})

ulTasks.addEventListener('click', e => {
    const handleClick = {
        taskDelete: () => {
            removeTaskFromDB(e.target.dataset.key)
        }
    }

    const type = e.target.dataset.type
    if (type) handleClick[type]()
})

btnSendInvoice.addEventListener('click', () => {
    handleSendInvoice()
})

document.getElementById('div-ctl-panel').addEventListener('click', e => {
    const handleClick = {
        history: () => {
            showModal(modalHistory, true)
        },
        reset: () => {
            
        }
    }

    const type = e.target.dataset.type
    if (type) handleClick[type]()
})

modalHistory.addEventListener('click', e => {
    const handleClick = {
        close: () => {
            showModal(modalHistory, false)
        },
        invoiceDelete: () => {
            removeInvoiceFromDB(e.target.dataset.key)
        }
    }
    const type = e.target.dataset.type
    if (type) handleClick[type]()
})

document.getElementById('btn-reset').addEventListener('click', () => {
    resetInvoice()
})

// ----------------------- //
// --- EVENT HANDLERS  --- //
// ------------------—---- //

// Here is where we add the task
const handleFormSubmit = form => {
    console.log(form)
    const data = new FormData(form)

    const task = {
        name: data.get('name'),
        price: +(data.get('price'))
    }
    
    // Make sure there's no duplicate then push
    if (!taskExists(task)) push(tasks, task)
    formTaskInput.reset()
}

// Called when send invoice button clicked, create an invoice obj and store it in fb
const handleSendInvoice = () => {

    // I guess we could do some checking here to prevent submission of duplicate invoices, but leaving that alone for now :-)
    const newInvoiceTasks = liveTasks.map(task => task[0])
    const newInvoiceTotal = invoiceTotal
    const newInvoiceDate = new Date().toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })

    const newInvoice = {
        tasks: newInvoiceTasks,
        total: newInvoiceTotal,
        date: newInvoiceDate
    }

    push(invoices, newInvoice)
    resetInvoice()
    // Show a modal
}

// --------------------—----- //
// --- FIREBASE FUNCTIONS --- //
// ------------------—------- //

// Render the task list 
onValue(tasks, snapshot => {
    snapshot.exists() ? renderTasks(snapshot.val()) : noTasksYet()
})

// Toggle dark mode when darkmode value changed
onValue(userPrefs, snapshot => {
    if (snapshot.exists()) console.log('dark mode toggle')
})

// Delete a task from db
const removeTaskFromDB = key => {
    const taskRef = ref(db, `tasks/${key}`)
    remove(taskRef)
}

const removeInvoiceFromDB = key => {
    const invoiceRef = ref(db, `invoices/${key}`)
    remove(invoiceRef)
    renderInvoiceHistory()
}

// ------------------------ //
// --- RENDER FUNCTIONS --- //
// ------------------—----- //

const renderTasks = tasks => {
    liveTasks = []
    invoiceTotal = 0

    const html = Object.keys(tasks).map(key => {
        const { name, price } = tasks[key]
        liveTasks.push([name, price]) // Keep local tasklist in sync with DB
        invoiceTotal += price
        return `
            <li class="li-invoice-task">
                <p>${name}</p>
                <button class="btn-remove-task" data-type="taskDelete" data-key="${key}">REMOVE</button>
                <p class="p-task-price"><span>£</span>${price}</p>
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
    get(invoices).then(snapshot => {
        if (snapshot.exists()) {
            const invoiceHistory = snapshot.val()
            ulInvoiceHistory.innerHTML = Object.keys(invoiceHistory).map(key => {
                const { date, tasks, total } = invoiceHistory[key]
                return `
                    <li>
                        <p>Invoice Date: ${date}</p>
                        <p>Tasks done: ${
                            tasks.map(task => task).join(', ')
                        }</p>
                        <p>Invoice amount: ${total} </p>
                        <button data-type="invoiceDelete" data-key=${key}>Delete</button>
                    </li>
                `
            }).join('')
        } else {
            ulInvoiceHistory.innerHTML = `
                <li>
                    <p>No history...you haven't done much work!</p>
                </li>
            `
        }
    }).catch(error => {
        console.error(error)
    })
}

const showModal = (modal, doShow) => {
    // These functions will be called before the modal displays
    const getReadyToShow = {
        'modal-invoice-history': () => {
            renderInvoiceHistory()
        }
    }
    
    // These functions will be called when a given modal is closed
    const cleanUp = {
    }
    
    // are we showing (doShow = true) or not? 
    if (doShow) {
        // If we specified any setup code for the modal, run it now
        if (Object.keys(getReadyToShow).includes(modal.id)) getReadyToShow[modal.id]()
        modal.showModal()
    } else {
        // If there's any cleanup code to run, do so
        if (Object.keys(cleanUp).includes(modal.id)) cleanUp[modal.id]()
        modal.close()
    }
}

// ------------------------ //
// --- HELPER FUNCTIONS --- //
// ------------------—----- //

const noTasksYet = () => {
    liveTasks = []
    ulTasks.innerHTML = `
        <li class="li-invoice-task li-empty">
            <p>No tasks yet</p>
            <p class="p-task-price">£0</p>
        </li>
    `
    enableButtons([btnSendInvoice, btnReset], false)
    renderinvoiceTotal()
}

const resetInvoice = () => {
    // Reset all the stuff
    
    invoiceTotal = 0
    renderinvoiceTotal()    
    // Remove current tasks from firebase, will trigger re-render
    remove(tasks)
    // Reset form and remove warning class if present
    formTaskInput.reset()
    const formEls = [...formTaskInput.elements]
    formEls.forEach(el => {
        if (el.classList.contains('warning')) el.classList.remove('warning')
    })
    enableButtons([btnReset], false)
}

const renderinvoiceTotal = () => {
    document.getElementById('p-invoice-footer-total').innerHTML = `£${invoiceTotal}`
}

const taskExists = task => {
    return liveTasks.map(task => task[0]).includes(task.name)
}

const isFormComplete = form => {
    // Create an array of form elements filtered by if they have a value (i.e. are empty)
    const emptyInputs = [...form.elements].filter(element => !Boolean(element.value))
    // If there are empty elements, add warning class to them and return false
    if (emptyInputs.length > 0) {
        emptyInputs.forEach(input => input.classList.add('warning'))
        return false
    }
    // If there were no empty inputs return true
    return true
}

const enableButtons = (buttons, doEnable) => {
    if (buttons.length > 0) buttons.forEach(button => button.disabled = !doEnable)
}

// Showtime