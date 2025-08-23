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
    subGroups: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group'
    }]
})

module.exports = mongoose.model('Group', GroupSchema); 