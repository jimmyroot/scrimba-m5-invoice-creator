import { 
    remove,
    set,
    get } from 'https://www.gstatic.com/firebasejs/10.7.2/firebase-database.js'

import { 
    tasks,
    themePrefs,
    formTaskInput,
    ulTasks,
    btnSendInvoice,
    btnReset,
    toggleDarkMode, 
    invoiceTotal, 
    liveTasks, 
    currentTheme,
    setCurrentTheme,
    resetLocalTasks
} from './index.js'

export { 
    noTasksYet, 
    resetInvoice, 
    showSpinner,
    renderinvoiceTotal,
    taskExists,
    isFormComplete,
    enableButtons,
    setTheme,
    initTheme 
}

// Call this from onValue if there is no snapshot (empty tasklist)
const noTasksYet = () => {
    resetLocalTasks()
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
    resetLocalTasks()
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

// Enable or disable all buttons passed in the 'buttons' array
const enableButtons = (buttons, doEnable) => {
    if (buttons.length > 0) buttons.forEach(button => button.disabled = !doEnable)
}

const setTheme = theme => {
    set(themePrefs, theme)
}

// Called when app starts, check if there's a theme preference in firebase and if so, load it
// If not, create one and recurse to make sure it's valid and theme gets set
const initTheme = () => {
    get(themePrefs).then(snapshot => {
        if (snapshot.exists()) {
            setCurrentTheme(snapshot.val())
            setTheme(currentTheme)
            currentTheme === 'light' ? toggleDarkMode.checked = false : toggleDarkMode.checked = true
        } else {
            setThemeInDB('light')
            initTheme()
        }
    })
}