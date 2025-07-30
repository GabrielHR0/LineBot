const mongoose = require('mongoose');

const GroupSchema = new mongoose.Schema({
    name : {
        type : String,
        trim : true,
        required : true,
    },
    description : {
        type : String,
        trim : true,
    },
})

module.exports = mongoose.model('Group', GroupSchema); 