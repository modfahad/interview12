const mongo = require("./mongoWrapper")
module.exports = {
    getDB : async () => {
        try {
            console.log("connecting to DB", process.env.db, process.env.dbCollection)
            const db = await mongo(process.env.db, process.env.dbCollection,{
                useNewUrlParser: true
            })
            console.log("connected to DB")
            return db;
        } catch (err) {
            console.error("DB connection error")
            throw new Error(`${err.message} =>`)
        }
    }
}