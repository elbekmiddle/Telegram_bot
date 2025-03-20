const Product = require("./.././../model/product");
const User = require("../../model/user");

const { bot } = require("../bot");

const add_product = async (chatId, category, step) => {
  const newProduct = new Product({
    category,
    status: 0
  })
  await newProduct.save()
  let user = await User.findOne({chatId}).lean()
  await User.findByIdAndUpdate(user._id, {
    ...user,
    action: 'new_product_title'
  }, {new: true})
  bot.sendMessage(chatId, `Yangi mahsulot nomini kiriting`)
}

const steps = {
  'title': {
    action: 'new_product_price',
    text: 'Yangi mahsulot narxini kiriting',
  },
  'price': {
    action: 'new_product_img',
    text: 'Yangi mahsulot rasmini yuboring',
  },
  'img': {
    action: 'new_product_text',
    text: 'Yangi mahsulot haqida ma`lumot yuboring',
  },
};

  const add_product_next= async (chatId, value, slug) => {
    let user = await User.findOne({chatId}).lean()
    let product = await Product.findOne({status: 0}).lean()

    if(['title', 'text', 'price', 'img'].includes(slug)){
      product[slug] = value

      if(slug === 'text'){
        product.status = 1
        await User.findByIdAndUpdate(user._id, {
          ...user,
          action: 'catalog'
        })
        bot.sendMessage(chatId, 'Yangi mahsulot kiritildi')
      }else{
        await User.findByIdAndUpdate(user._id, {
          ...user,
          action: steps[slug].action
        })
        bot.sendMessage(chatId, steps[slug].text)
      }
      await Product.findByIdAndUpdate(product._id, product, {new: true})
    }
  }

module.exports = {
  add_product,
  add_product_next
};

// 6:47