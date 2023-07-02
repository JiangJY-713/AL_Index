'use strict'
const sqlite3 = require('sqlite3').verbose()
const db_op = require('./db_module')

var db = new sqlite3.Database(
    '../data/journal.db', 
    // sqlite3.OPEN_READWRITE, 
    function (err) {
        if (err) {
            return console.log(err.message)
        }
        console.log('connect database successfully')
    }
)


// var data = require('../../data/data.json')

// var start_line = 2;
// var end_line = 136;

// db_op.createDBtable(db,['wyas'])  //create selected tables in database

// db_op.insertWYAS_ENTRY(db,data,start_line, end_line)  // initial insert from calendar JSON data
// db_op.insertALCB(db,data,start_line, end_line,'insert alcb')     // initial insert from calendar JSON data
// db_op.insertALCB(db,data,start_line, end_line,'update alcb') 
// db_op.insertWYAS_New(db,start_line, end_line)
// db_op.updateALCBdoc(db,'insert alcb')
        
db_op.updateWYASdoc('journal [in AC]', "25", db)


