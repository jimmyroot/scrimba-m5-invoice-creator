// TODO: Implement history modal
// TODO: Style everything
// TODO: Dark mode toggle
// TODO: Message if duplicate task entered
// TODO: Clear inputs
// TODO: Fix button states

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js'
import { getDatabase, ref, onValue, push, remove } from 'https://www.gstatic.com/firebasejs/10.7.2/firebase-database.js'
// import { v4 as uuidv4 } from 'https://jspm.dev/uuid'

// Init firebase
const cfg = {
    databaseURL: 'https://invoice-creator-a9ba5-default-rtdb.europe-west1.firebasedatabase.app/'
}

const app = initializeApp(cfg)
const db = getDatabase(app)
const tasks = ref(db, 'tasks')
const invoices = ref(db, 'invoices')

// Grab the DOM elements we need
const formTaskInput = document.querySelectorAll('#frm-task-input')[0]
const ulTasks = document.getElementById('ul-invoice-tasks')
const btnSendInvoice = document.getElementById('btn-send-invoice')
const modalHistory = document.getElementById('modal-invoice-history')

// We'll maintain a local array of current tasks, so we can check if tasks already exists.
// This means we don't need to check the db every time we add a new task
let liveTasks = []
let newInvoiceTotal = 0

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
        }
    }
    const type = e.target.dataset.type
    if (type) handleClick[type]()
})

// ----------------------- //
// --- EVENT HANDLERS  --- //
// ------------------—---- //

const handleFormSubmit = form => {
    console.log(form)
    const data = new FormData(form)

    const task = {
        name: data.get('name'),
        price: +(data.get('price'))
    }
    
    // Object.fromEntries(new FormData(form))
    if (!taskExists(task)) pushTaskToDB(task)
}

const handleSendInvoice = () => {
    const invoice = {
        tasks: [],
        total: 0,
        date: [date],
        
    }
}

// --------------------—----- //
// --- FIREBASE FUNCTIONS --- //
// ------------------—------- //

onValue(tasks, snapshot => {
    snapshot.exists() ? renderTasks(snapshot.val()) : noTasksYet()
})

const pushTaskToDB = task => {
    push(tasks, task)
}

const pushInvoiceToDB = invoice => {
    
}

const removeTaskFromDB = key => {
    const taskRef = ref(db, `tasks/${key}`)
    remove(taskRef)
}

// ------------------------ //
// --- RENDER FUNCTIONS --- //
// ------------------—----- //

const renderTasks = tasks => {
    liveTasks = []
    newInvoiceTotal = 0

    const html = Object.keys(tasks).map(key => {
        const { name, price } = tasks[key]
        liveTasks.push([name, price]) // Keep local tasklist in sync with DB
        newInvoiceTotal += price
        return `
            <li class="li-invoice-task">
                <p>${name}</p>
                <button class="btn-remove-task" data-type="taskDelete" data-key="${key}">REMOVE</button>
                <p class="p-task-price"><span>£</span>${price}</p>
            </li>
        `
    }).join('')

    ulTasks.innerHTML = html
    renderNewInvoiceTotal()
    
}

const renderInvoiceHistory = () => {

}

const showModal = (modal, doShow) => {
    
    // These functions will be called before the modal displays
    const getReadyToShow = {
        'modal-invoice-history': () => {
            console.log('rendering history')
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
    renderNewInvoiceTotal()
}

// const getInvoiceTotal = liveTasks => {
//     if (liveTasks.length > 0) {
//         const totalDue = liveTasks.reduce((total, task) => total + task[1], 0)
//         return totalDue
//     } else {
//         return `0`
//     }
// }

const renderNewInvoiceTotal = () => {
    document.getElementById('p-invoice-footer-total').innerHTML = `£${newInvoiceTotal}`
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

// Showtime