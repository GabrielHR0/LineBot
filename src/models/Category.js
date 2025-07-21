const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
    name : {
        type : String,
        trim : true,
        required : true,
    },
    description : {
        type : String,
        trim : true,
    },
    subCategories : [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
    }]
})

module.exports = mongoose.model('Category', CategorySchema); 