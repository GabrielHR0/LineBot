const mongoose = require('mongoose')

const ProductProgressSchema = mongoose.Schema({
    productId : mongoose.Schema.Types.ObjectId,
    name : String
},{ _id : false})

const Counter = mongoose.model('Counter', new mongoose.Schema({
    _id : String,
    seq : {
        type : Number,
        default : 0
    }
}));

const OrderSchema = mongoose.Schema({
    orderNumber : {
        type: String,
        unique: true,
        required: true,
        sparse: true,
    },
    client : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'Client',
        required : true
    },
    items : [{
        name : String,
        price : Number,
        status : {
            type : String,
            enum : ['pending', 'in_production', 'ready']
        },
        itemType : {
            type : String,
            enum : ['Product', 'CustomProduct'],
            required : true
        },
        product : {
            type : mongoose.Schema.Types.ObjectId,
            refPath : 'items.itemType',
            required : true
        },
        quantity : {
            type : Number,
            default : 1
        }
    }],
    total : {
        type : Number,
        required : true
    },
    status : {
        type : String,
        enum : ['pending', 'approved', 'in_production', 'ready', 'shipped', 'delivered', 'canceled', 'refunded'],
        required : true
    },
      forecastDate: {
        type: Date,
        default: null
    },
    deliveryDate: {
        type: Date,
        default: null
    },
    productProgress : {
        completed : [ProductProgressSchema],
        pending : [ProductProgressSchema]
    },

}, { timestamps : true })


OrderSchema.pre('validate', async function(next) {
  if (!this.orderNumber) {
    const counter = await Counter.findByIdAndUpdate(
      { _id: 'orderNumber' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.orderNumber = `ORD-${counter.seq.toString().padStart(6, '0')}`;
  }
  next();
});


module.exports = mongoose.model('Order', OrderSchema);
