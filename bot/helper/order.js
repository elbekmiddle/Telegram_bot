const User = require('../../model/user')
const Order = require('../../model/order')
const Product = require('../../model/product')
const {bot} = require('../bot')
const ready_order = async (chatId, product, count) => {
    let user = await User.findOne({chatId}).lean()
    let orders = await Order.find({user, status: 0}).lean()
    await Promise.all(orders.map(async(order) => {
        await Order.findByIdAndDelete(order._id)
    }))
    await User.findByIdAndUpdate(user._id, {
        ...user,
        action: 'order'
    }, {new: true})

    newOrder = new Order({
        user: user._id,
        product,
        count,
        status: 0
    })

    await newOrder.save()

    bot.sendMessage(chatId, `Mahsulotni yetkazib berish uchun manzilingizni bering`, {
        reply_markup: {
            keyboard: [
                [{
                    text: 'Manzilni yuboring',
                    request_location: true
                }]
            ],
            resize_keyboard: true,
            one_time_keyboard: true
        }
    })
}
const end_order = async (chatId, location) =>  {
    let user = await User.findOne({chatId}).lean()
    let admin = await User.findOne({admin: true}).lean()
    await User.findByIdAndUpdate(user._id, {
        ...user,
        action: 'end_order'
    }, {new: true})
    let order = await Order.findOne({
        user: user._id,
        status: 0
    }).populate(['product']).lean()
    if(order){
        await Order.findByIdAndUpdate(order._id, {
            ...order,
            location,
            status: 1
        }, {new: true}) 

        await bot.sendMessage(chatId, `Buyurtmangiz qabul qilindi tez orada siz bilan bog'lanamiz`, {
            reply_markup: {
                remove_keyboard: true
            }
        })
        await bot.sendMessage(admin.chatId, `Yangi buyurtma. \nBuyurtmachi: ${user.name}\nmahsulot: ${order.product.title}\nsoni: ${order.count} ta\nUmumiy narhi: ${order.count * order.product.price} so'm`, {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: 'Bekor qilish',
                            callback_data: `cancel_order-${order._id}`
                        },
                        {
                            text: 'Qabul qilish',
                            callback_data: `success_order-${order._id}`
                        }
                    ], [
                        {
                            text: 'Manzilni olish',
                            callback_data: `xarita_order-${order._id}`
                        }
                    ]
                ]
            }
        })
    }
}


const change_order = async (chatId, id , status) => {
    let admin = await User.findOne({chatId}).lean()

    if(admin.admin){    
            let order = await Order.findById(id).populate(['user','product']).lean()
            await Order.findByIdAndUpdate(order._id, {...order, status, createdAt: new Date()}, {new: true})
            const msg = status == 2 ? 'buyurtmangiz qabul qilindi' : 'buuyurtmangiz bekor qilindi'
            await bot.sendMessage(order.user.chatId, msg)
            await bot.sendMessage(chatId, `Buyurtma holati o'zgardi`)
    }else{
        bot.sendMessage(chatId, `Sizga bunday sorov mumkin emas`)
    }
}

show_location = async (chatId,_id) => {
    let user = await User.findOne({chatId}).lean()

    if(user.admin){
        let order = await Order.findById(_id).lean()
        bot.sendLocation(chatId, order.location.latitude, order.location.longitude)  
    }else{
        bot.sendMessage(chatId, `Sizga bunday sorov mumkin emas`)
    }
}
module.exports = {
    ready_order,
    end_order,
    show_location,
    change_order
}