const {bot} = require('../bot')
const User = require('../../model/user')
const {adminKeyboard, userKeyboard} = require('../menu/keyboard')

const get_all_users = async (msg) => {
    const chatId = msg.from.id
    let user = await User.findOne({chatId}).lean()
    if(user.admin){
        let users = await User.find().lean()
        console.log(users)
        let list = ''
        users.forEach(user => {
            list += `${user.name}: ${user.phone}: ${user.createdAt.toLocaleDateString()}\n`
        })
        bot.sendMessage(chatId, `Foydalanuvchilar ro'yhati: 
${list}
            `)
        }else{
        bot.sendMessage(chatId, 'Sizga bunday so`rov mumkin emas', {
            reply_markup: {
                keyboard: userKeyboard,
                resize_keyboard: true
            }
        })
    }
}


module.exports = {
    get_all_users   
}