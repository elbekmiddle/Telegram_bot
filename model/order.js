const {Schema, model} = require('mongoose')

const Order =  Schema({
    user:{ 
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    product: {
        type: Schema.Types.ObjectId,
        ref: 'Product'
    },
    count: Number,
    locatoin: {
        latitude: Number,
        longitude: Number,
    },
    createdAt:Date,
    status: {
        type: Number,
        default: 0
    }
})
module.exports = model('Order', Order)