const {bot} = require('./bot')
const User = require('../model/user') 
const {add_category, pagination_category, show_category} = require('./helper/category')  

bot.on('callback_query', async query => {
    const {data} = query
    const chatId = query.from.id

    if (data === 'add_category'){
        add_category(chatId)
    }
    console.log(data)
    if(['next_category', 'back_category'].includes(data)){
        pagination_category(chatId, data)
    }
    if(data.includes('category_')){
        let id = data.split('_')[1]
        show_category(chatId, id)
    }   
})