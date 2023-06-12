const express = require("express")
const app = express()
const mongoConnector = require("./lib/mongoConnector")
const moment = require("moment")
require('dotenv').config()
const bodyParser = require("body-parser")
const emailCheck = require('deep-email-validator')
const rateLimit = require("express-rate-limit")

app.use(rateLimit({
    windowMs: 5 * 1000,
    max: 2,
    standardHeader: true,
    legacyHeader :false
}))

app.use(bodyParser.json());
// app.use(bodyParser.json());
app.use(async (req, res, next) => {
    try {
        if (!req.db) {
            req.db = await mongoConnector.getDB()
        }
        next()
    } catch (err) {
        console.log(err.message);
        res.sendStatus(500)
    }
})

app.get("/ping", (req, res) => {
    res.sendStatus(200)
})

const emailCheckBoolean = async (r) => {
    // const pattern = /^[a-zA-Z0-9]@/
    return await emailCheck.validate(r);
}

app.post("/employee/save", async (req, res) => {
    const {
        body
    } = req;
    const {
        employee_id,
        first_name,
        last_name,
        email_address,
        department_id
    } = body
    if (!(first_name && email_address && department_id)) {
        res.sendStatus(400)
    } else {
        try {
            console.log(department_id)
            const [department] = await req.db.read("departments", {
                _id: req.db.objectid(department_id)
            })
            if (!department) {
                res.sendStatus(400)
            }
            console.log(email_address)
            const emailChecker = await emailCheckBoolean(email_address)
            if (!emailChecker.valid) {
                console.error(emailChecker.validators.regex.reason)
                res.sendStatus(400)
            } else {
                const employee = await req.db.create("employees", {
                    employee_id,
                    first_name,
                    last_name,
                    email_address,
                    department_id: req.db.objectid(department_id)
                })
                console.log(employee)
                res.json(employee)
            }
        } catch (err) {
            console.error(err)
            res.sendStatus(500)
        }
    }
})

app.get("/employee/:employee_id", async (req, res) => {
    const {
        employee_id
    } = req.params
    const [employee] = await req.db.read("employees", {
        employee_id,
    })
    if (!employee) {
        res.sendStatus(400)
    } else {
        const [department] = await req.db.read("departments", {
            _id: employee.department_id
        })
        employee.department = department;
        res.json(employee)
    }
})

console.log(process.env.port)
app.listen(parseInt(process.env.port),()=>{
    console.log(`listening to ${process.env.port}`)
})