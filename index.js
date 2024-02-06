import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js'

import { 
    getDatabase,
    ref, 
    onValue } from 'https://www.gstatic.com/firebasejs/10.7.2/firebase-database.js'

import { 
    removeInvoiceFromDB,
    removeTaskFromDB } from './firebase.js'
        
import { 
    renderTasks,
    showModal } from './render.js'
            
import {
    noTasksYet, 
    resetInvoice, 
    isFormComplete,
    enableButtons,
    setTheme,
    initTheme } from './helpers.js'

import { 
    handleFormSubmit,
    handleSendInvoice } from './handlers.js'

export { 
    app,
    db,
    tasks,
    invoices,
    themePrefs,
    formTaskInput,
    ulTasks,
    btnSendInvoice,
    btnReset,
    modalHistory,
    modalSingleInvoiceView,
    modalConfirm,
    toggleDarkMode, 
    invoiceTotal, 
    liveTasks, 
    currentTheme,
    setCurrentTheme,
    resetLocalTasks,
    incrementTotal,
    setHeight
}
    
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
    setTimeout(() => {
        currentTheme === 'light' ? setTheme('dark') : setTheme('light')
    }, 200)
})



// ---------------------—---------------- //
// --- SETTERS FOR EXPORTED VARIABLES --- //
// -------------------------------------- //

const setCurrentTheme = theme => {
    currentTheme = theme
}

const incrementTotal = qty => {
    invoiceTotal += qty
}

const resetLocalTasks = () => {
    liveTasks = []
    invoiceTotal = 0
}

const setHeight = (el, height) => {
    console.log(el)
    
    el.style = `height: ${height}px !important;`
}

// -------------------------- //
// --- FIREBASE LISTENERS --- //
// --------------------—----- //

// App is mostly driven by the following listeners

onValue(tasks, snapshot => {
    snapshot.exists() ? renderTasks(snapshot.val()) : noTasksYet()
})

// Toggle dark mode when themePref value changes
onValue(themePrefs, snapshot => {
    if (snapshot.exists()) { 
        currentTheme = snapshot.val() 
        document.documentElement.className = currentTheme
    }
})

// Load the theme when the app starts
onValue(themePrefs, snapshot => {
    if (snapshot.exists()) initTheme()
}, {
    onlyOnce: true
})