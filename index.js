
// TODO: Dark mode toggle
// Tweak colour scheme and shadow tints
// ajo label hints for toggle

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js'
import { getDatabase, ref, onValue, push, remove, set, get } from 'https://www.gstatic.com/firebasejs/10.7.2/firebase-database.js'
// import { v4 as uuidv4 } from 'https://jspm.dev/uuid'

// Init firebase
const cfg = {
    databaseURL: 'https://invoice-creator-a9ba5-default-rtdb.europe-west1.firebasedatabase.app/'
}

const app = initializeApp(cfg)
const db = getDatabase(app)
const tasks = ref(db, 'tasks')
const invoices = ref(db, 'invoices')
const themePrefs = ref(db, '/themePrefs/theme')

// Grab the DOM elements we need
const formTaskInput = document.querySelectorAll('#frm-task-input')[0]
const ulTasks = document.getElementById('ul-invoice-tasks')
const btnSendInvoice = document.getElementById('btn-send-invoice')
const btnReset = document.getElementById('btn-reset')
const modalHistory = document.getElementById('modal-invoice-history')
const modalSingleInvoiceView = document.getElementById('modal-single-invoice-view')
const modalConfirm = document.getElementById('modal-confirm')
const toggleDarkMode = document.getElementById('toggle-dark-mode')

// We'll maintain a local array of current tasks, so we can check if tasks already exists.
// This means we don't need to read from the db every time we add a new task
let liveTasks = []
let invoiceTotal = 0
let currentTheme = null

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
            resetInvoice()
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
        },
        invoiceView: () => {
            showModal(modalSingleInvoiceView, true, e.target.dataset.key)
        }

    }
    const type = e.target.dataset.type
    if (type) handleClick[type]()
})

modalSingleInvoiceView.addEventListener('click', e => {
    const handleClick = {
        close: () => {
            showModal(modalSingleInvoiceView, false)
        },
        back: () => {
            showModal(modalHistory, true)
        }
    }
    const type = e.target.dataset.type
    if (type) handleClick[type]()
})

modalConfirm.addEventListener('click', e => {
    const handleClick = {
        close: () => {
            showModal(modalConfirm, false)
        }
    }
    const type = e.target.dataset.type
    if (type) handleClick[type]()
})


// Stop confirm dialog from closing on cancel, as there is code we need to run when the user
// clicks the 'Back' btn. This code won't run if the user 'escapes' the dialog.
modalConfirm.addEventListener('cancel', e => {
    e.preventDefault()
})

toggleDarkMode.addEventListener('change', () => {
    currentTheme === 'light' ? setTheme('dark') : setTheme('light')
})

// ----------------------- //
// --- EVENT HANDLERS  --- //
// ------------------—---- //

// Here is where we add the task
const handleFormSubmit = form => {
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
    const newInvoiceTasks = liveTasks.map(task => task)
    const newInvoiceTotal = invoiceTotal
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

// --------------------—----- //
// --- FIREBASE FUNCTIONS --- //
// ------------------—------- //

// Render the task list 
onValue(tasks, snapshot => {
    snapshot.exists() ? renderTasks(snapshot.val()) : noTasksYet()
})

// Toggle dark mode when darkmode value changed
onValue(themePrefs, snapshot => {
    if (snapshot.exists()) { 
        currentTheme = snapshot.val() 
        document.documentElement.className = currentTheme
    }
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

const showModal = (modal, doShow, key) => {
    // These functions will be called before the modal displays
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
    
    // These functions can be called when a modal is closed
    const cleanUp = {
        'modal-confirm': () => {
            resetInvoice()
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

// ------------------------ //
// --- HELPER FUNCTIONS --- //
// ------------------—----- //
const noTasksYet = () => {
    liveTasks = []
    ulTasks.innerHTML = `
        <li class="li-invoice-task li-empty">
            <p>No tasks yet</p>
            <p class="p-task-price">£ 0</p>
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

const showSpinner = (el, doShow) => {
    doShow ? el.classList.add('spinner') : el.classList.remove('spinner')
}

const renderinvoiceTotal = () => {
    document.getElementById('p-invoice-footer-total').innerHTML = `<span class="spn-primary">£</span> ${invoiceTotal}`
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

const setTheme = theme => {
    set(themePrefs, theme)
}

const initTheme = () => {
    get(themePrefs).then(snapshot => {
        if (snapshot.exists()) {
            currentTheme = snapshot.val()
            console.log(snapshot.val())
            setTheme(currentTheme)
            currentTheme === 'light' ? toggleDarkMode.checked = false : toggleDarkMode.checked = true
        } else {
            setThemeInDB('light')
            initTheme()
        }
    })
}

// Showtime
initTheme()