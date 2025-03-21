const Product = require("./.././../model/product");
const User = require("../../model/user");

const { bot } = require("../bot");

const add_product = async (chatId, category, step) => {
  const newProduct = new Product({
    category,
    status: 0,
  });
  await newProduct.save();
  let user = await User.findOne({ chatId }).lean();
  await User.findByIdAndUpdate(
    user._id,
    {
      ...user,
      action: "new_product_title",
    },
    { new: true }
  );
  bot.sendMessage(chatId, `Yangi mahsulot nomini kiriting`);
};

const steps = {
  title: {
    action: "new_product_price",
    text: "Yangi mahsulot narxini kiriting",
  },
  price: {
    action: "new_product_img",
    text: "Yangi mahsulot rasmini yuboring",
  },
  img: {
    action: "new_product_text",
    text: "Yangi mahsulot haqida ma`lumot yuboring",
  },
};

const add_product_next = async (chatId, value, slug) => {
  let user = await User.findOne({ chatId }).lean();
  let product = await Product.findOne({ status: 0 }).lean();

  if (["title", "text", "price", "img"].includes(slug)) {
    product[slug] = value;

    if (slug === "text") {
      product.status = 1;
      await User.findByIdAndUpdate(user._id, {
        ...user,
        action: "catalog",
      });
      bot.sendMessage(chatId, "Yangi mahsulot kiritildi");
    } else {
      await User.findByIdAndUpdate(user._id, {
        ...user,
        action: steps[slug].action,
      });
      bot.sendMessage(chatId, steps[slug].text);
    }
    await Product.findByIdAndUpdate(product._id, product, { new: true });
  }
};

  const clear_draft_product = async () => {
      let products = await Product.find({status: 0}).lean()
      if(products){
        await Promise.all(products.map(async product => {
          await Product.findByIdAndDelete(product._id)
        }))
      }
}

const show_product = async (chatId, id, count = 1, message_id = null ) => {
  let product = await Product.findById(id).populate(['category']).lean()
  let user = await User.findOne({chatId}).lean()
  const inline_keyboard = [
    [
      {text: '➖',callback_data: `less_count-${product._id}-${count}`},
      {text: count,callback_data: count},
      {text:'➕',callback_data: `more_count-${product._id}-${count}`}],user.admin ? [
      {text: 'Mahsulotni tahrirlash ✏️',callback_data: `edit_product-${product._id}`},
      { text: 'Mahsulotni o`chirish 🗑',callback_data: `del_product-${product._id}`}] : [],
    [{text: 'Buyurtma berish',callback_data: `order-${product._id}-${count}`}
     ]
  ]

  if(message_id > 0){
    bot.editMessageReplyMarkup({inline_keyboard}, {chat_id: chatId, message_id})
  }else{
    bot.sendPhoto(chatId, product.img, {
      caption:`<b>${product.title}</b>
📦Turkum ${product.category.title}
💸Narhi ${product.price} so'm
🔥Qisqa ma'lumoti ${product.text}`,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard
      }
    })
  }
}
const delete_product = async(chatId, id, sure) => {
  let user = await User.findOne({chatId}).lean()
  if(user.admin){
    if(sure){
      await Product.findByIdAndDelete(id)
      bot.sendMessage(chatId, 'Mahsulot o`chirildi')
    }else{
      bot.sendMessage(chatId, `Mahsulotni ochirmoqchisiz. Qaroringiz qatiymi?`, {
        reply_markup: {
          inline_keyboard: [
            [
                {
                  text: 'Yo`q ❌',
                  callback_data: `catalog`
                }, {
                  text: 'Ha ✅',
                  callback_data: `rem_product-${id}`
                }
            ]
          ]
        }
      })
    }
  }else {
    bot.sendMessage(chatId, 'Sizga bunday sorov mumkin emas')
  }
}



module.exports = {
  add_product,
  add_product_next,
  clear_draft_product,
  show_product,
  delete_product
};

// 7: 45
