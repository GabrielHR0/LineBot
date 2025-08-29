const mongoose = require('mongoose');

const GroupSchema = new mongoose.Schema({
    key: {
        type: String,
        trim: true,
        required: true,
    },
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