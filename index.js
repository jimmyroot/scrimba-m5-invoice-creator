// TODO 1: Set up CSS file
// TODO 2: Get basic HTML written

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js'
import { getDatabase, ref, onValue, push, remove, set } from 'https://www.gstatic.com/firebasejs/10.7.2/firebase-database.js'
// import { v4 as uuidv4 } from 'https://jspm.dev/uuid'

const cfg = {
    databaseURL: 'https://invoice-creator-a9ba5-default-rtdb.europe-west1.firebasedatabase.app/'
}

const app = initializeApp(cfg)
const db = getDatabase(app)
const tasks = ref(db, 'tasks')
const invoices = ref(db, 'invoices')

onValue(tasks, snapshot => {
    snapshot.exists() ? renderTasks(snapshot.val()) : noTasksYet()
})

const renderTasks = val => {
    console.log('rendering')
}

const noTasksYet = () => {
    return
}

const pushTaskToDB = task => {
    push(tasks, task)
}

const pushInvoiceToDB = invoice => {

}

let task = {
    name: 'Wash car',
    // uuid: uuidv4()
}

pushTaskToDB(task)