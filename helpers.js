// ----------------------------------------------------------------------------- //
// --- helpers.js — small helper functions used variously throughout the app --- //
// ----------------------------------------------------------------------------- //

import {
    remove, 
    set, 
    get } from 'https://www.gstatic.com/firebasejs/10.7.2/firebase-database.js'

import * as app from './index.js'
import * as render from './render.js'

export { 
    noTasksYet, 
    resetInvoice, 
    showSpinner, 
    taskExists, 
    isFormComplete, 
    enableButtons, 
    setTheme, 
    initTheme, 
    setModalHeight }

const noTasksYet = () => {
    // Make sure everything is empty
    app.appState.liveTasks = []
    app.appState.invoiceTotal = 0
    // Render stuff
    app.ulTasks.innerHTML = `
        <li class="li-invoice-task li-empty">
            <p class="p-empty">No tasks yet</p>
            <p class="p-empty">£ 0</p>
        </li>
    `
    enableButtons([app.btnSendInvoice, app.btnReset], false)
    render.renderInvoiceTotal()
}

const resetInvoice = () => {
    // Reset all the stuff
    app.appState.liveTasks = []
    app.appState.invoiceTotal = []
    // Remove current tasks from firebase, will trigger re-render
    remove(tasks)
    // Reset form and remove warning class if present
    app.formTaskInput.reset()
    const formEls = [...app.formTaskInput.elements]
    formEls.forEach(el => {
        if (el.classList.contains('warning')) el.classList.remove('warning')
    })
    enableButtons([app.btnReset], false)
}

const showSpinner = (el, doShow) => {
    doShow ? el.classList.add('spinner') : el.classList.remove('spinner')
}

const taskExists = task => {
    return app.appState.liveTasks.map(task => task[0]).includes(task.name)
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
    // const app.themePrefs = ref(db, '/app.themePrefs/theme')
    set(app.themePrefs, theme)
}

// This only gets called once when the app loads, checks for existing theme preference
// in firebase, loads it if present, else creates it on first run
const initTheme = () => {
    get(app.themePrefs).then(snapshot => {
        if (snapshot.exists()) {
            const theme = snapshot.val()
            app.appState.currentTheme = theme
            // Make sure the toggle switch has the correct orientation when app loads
            theme === 'light' ? app.toggleDarkMode.checked = false : app.toggleDarkMode.checked = true
        } else {
            setTheme('light')
            initTheme()
        }
    })
}

// Set modal height relative to the main div container height, called before showing
// a modal to keep everything lined up
const setModalHeight = (modal) => {
    const h = document.getElementById('div-container').offsetHeight - 40
    modal.style = `height: ${h}px !important;`
}