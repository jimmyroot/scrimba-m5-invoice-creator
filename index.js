// ---------------------------------------------------------------------------------- //
// --- index.js — app initialization, event listeners, DOM elements, FB listeners --- //
// ---------------------------------------------------------------------------------- //


import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js'

import { 
    getDatabase, 
    ref, 
    onValue } from 'https://www.gstatic.com/firebasejs/10.7.2/firebase-database.js'

import { 
    handleFormSubmit, 
    handleSendInvoice } from './handlers.js'
    
import { 
    renderTasks, 
    renderInvoiceHistory, 
    showModal } from './render.js'
    
import { 
    removeTaskFromDB, 
    removeInvoiceFromDB } from './firebase.js'
    
import { 
    noTasksYet, 
    resetInvoice,
    isFormComplete, 
    enableButtons, 
    setTheme, 
    initTheme } from './helpers.js'

export { 
    appState, 
    db, 
    tasks, 
    invoices, 
    themePrefs, 
    formTaskInput, 
    ulTasks, 
    btnSendInvoice, 
    btnReset,
    toggleDarkMode, 
    modalConfirm, 
    modalHistory, 
    modalSingleInvoiceView }

// Init firebase
const cfg = {
    databaseURL: 'https://invoice-creator-a9ba5-default-rtdb.europe-west1.firebasedatabase.app'
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

// I learned that an object import/export is better than let/const, we can manipulate the 
// attributes without separate getter functions. This object contains a local liveTasks array 
// (so we don't have to read from the db each time to check for duplicates),
// the running total of the live invoice and the current theme preference


let appState = {
    liveTasks: [],
    invoiceTotal: 0,
    currentTheme: null,
}

// ----------------------- //
// --- EVENT LISTENERS --- //
// ----------------------- //

// For submitting new tasks
formTaskInput.addEventListener('submit', e => {
    e.preventDefault()
    const form = e.target
    // Check if task input field contains something, then submit the form
    if (isFormComplete(form)) handleFormSubmit(form)
})

// Listen for changes to inputs to remove validation/warning class
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

// For the buttons on the main app, at the bottom
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


// Stop confirm dialog from closing if user presses Esc, as there is code we need
// to run when the user clicks the 'Back' btn. This code won't run if the user 
// presses Esc to close it
modalConfirm.addEventListener('cancel', e => {
    e.preventDefault()
})

// The delay here is so that the theme change syncs up with the toggle switch
// animation
toggleDarkMode.addEventListener('change', () => {
    setTimeout( () => {
        appState.currentTheme === 'light' ? setTheme('dark') : setTheme('light')
    }, 200)
    
})

// -------------------------- //
// --- FIREBASE LISTENERS --- //
// -------------------------- //

// Render the task list 
onValue(tasks, snapshot => {
    snapshot.exists() ? renderTasks(snapshot.val()) : noTasksYet()
})

// Toggle dark mode when darkmode value changed
onValue(themePrefs, snapshot => {
    if (snapshot.exists()) { 
        appState.currentTheme = snapshot.val() 
        document.documentElement.className = appState.currentTheme
    }
})

// Only run this once, when the app first loads
onValue(themePrefs, snapshot => {
    if (snapshot.exists()) initTheme()
}, {
    onlyOnce: true
})