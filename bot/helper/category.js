const { bot } = require("../bot");
const User = require("../../model/user");
const { adminKeyboard, userKeyboard } = require("../menu/keyboard");
const Category = require("../../model/category");
const Product = require("../../model/product");
const { clear_draft_product } = require("../helper/product");

get_all_categories = async (chatId, page = 1, message_id = null) => {
  clear_draft_product();
  let user = await User.findOne({ chatId }).lean();
  let limit = 5;
  let skip = (page - 1) * limit;
  let categories = await Category.find().skip(skip).limit(limit).lean();

  if (categories.length == 0 && skip > 0 ) {
    page--;
    await User.findByIdAndUpdate(
      user._id,
      { ...user, action: `category-${page}` },
      { new: true }
    );
    get_all_categories(chatId, page - 1);
    return;
  }

  if (page == 1) {
    await User.findByIdAndUpdate(
      user._id,
      { ...user, action: "cateogory-1" },
      { new: true }
    );
  }

  console.log(categories);

  let list = categories.map((category) => [
    {
      text: category.title,
      callback_data: `category_${category._id}`,
    },
  ]);
  console.log(list);

  const inline_keyboard = [
    ...list,
    [
      {
        text: "Ortga",
        callback_data: page > 1 ? "back_category" : page,
      },
      {
        text: page,
        callback_data: "0",
      },
      {
        text: "Keyingisi",
        callback_data: limit == categories.length ? "next_category" : page,
      },
    ],
    user.admin
      ? [
          {
            text: "Yangi Kategoriya qo`shish",
            callback_data: "add_category",
          },
        ]
      : [],
  ]

    if(message_id > 0){
      bot.editMessageReplyMarkup({inline_keyboard}, {chat_id: chatId, message_id})
  }else{    
    bot.sendMessage(chatId, "Kateoriyalar ro`yhati", {
      reply_markup: {
        remove_keyboard: true,
        inline_keyboard
      },
    });
  }
};
const add_category = async (chatId) => {
  let user = await User.findOne({ chatId }).lean();

  if (user.admin) {
    await User.findByIdAndUpdate(
      user._id,
      {
        ...user,
        action: "add_category",
      },
      { new: true }
    );

    bot.sendMessage(chatId, "Yangi kategoriya nomini kiriting");
  } else {
    bot.sendMessage(chatId, "Sizga bunday so`rov mumkin emas!");
  }
};

const new_category = async (msg) => {
  const chatId = msg.from.id;
  const text = msg.text;

  let user = await User.findOne({ chatId });

  if (user.admin && user.action === "add_category") {
    let newcategory = new Category({
      title: text,
    });
    await newcategory.save();
    await User.findByIdAndUpdate(user._id, {
      ...user,
      action: "category",
    });
    get_all_categories(chatId);
  } else {
    bot.sendMessage(chatId, "Sizga bunday so`rov mumkin emas!");
  }
};

const pagination_category = async (chatId, action, message_id = null ) => {
  let user = await User.findOne({ chatId }).lean();
  let page = 1;
  if (user.action.includes("category-")) {
    page = +user.action.split("-")[1];
    if (action == "back_category" && page > 1) {
      page--;
    }
  }
  if (action == "next_category") {
    page++;
  }
  await User.findByIdAndUpdate(
    user._id,
    { ...user, action: `category-${page}` },
    { new: true }
  );
  get_all_categories(chatId, page, message_id);
};

const show_category = async (chatId, id, page = 1) => {
  let cateogry = await Category.findById(id).lean();
  let user = await User.findOne({ chatId }).lean();
  await User.findByIdAndUpdate(
    user._id,
    { ...user, aciton: `category_${cateogry._id}` },
    { new: true }
  );
  let limit = 5;
  let skip = (page - 1) * limit;
  let products = await Product.find({ category: cateogry._id, status: 1 })
    .skip(skip)
    .limit(limit)
    .sort({ _id: -1 })
    .lean();
  let list = products.map((product) => [
    {
      text: product.title,
      callback_data: `product_${product._id}`,
    },
  ]);
  const userKeyboards = [];
  const adminKeyboards = [
    [
      {
        text: "Yangi mahsulot qo`shish",
        callback_data: `add_product-${cateogry._id}`,
      },
    ],
    [
      {
        text: "Turkumni tahrirlash",
        callback_data: `edit_category-${cateogry._id}`,
      },
      {
        text: "Turkumni o`chirish",
        callback_data: `del_category-${cateogry._id}`,
      },
    ],
  ];
  const keyboards = user.admin ? adminKeyboards : userKeyboards;

  bot.sendMessage(
    chatId,
    `${cateogry.title} turkumidagi mahsulotlar ro'yhati`,
    {
      reply_markup: {
        remove_keyboard: true,
        inline_keyboard: [
          ...list,
          [
            {
              text: "Ortga",
              callback_data: page > 1 ? "back_product" : page,
            },
            {
              text: page,
              callback_data: "0",
            },
            {
              text: "Keyingisi",
              callback_data: limit == products.length ? "next_product" : page,
            },
          ],
          ...keyboards,
        ],
      },
    }
  );
};
const remove_category = async (chatId, id) => {
  let user = await User.findOne({ chatId }).lean();
  let category = await Category.findById(id).lean();
  if (user.action !== "del_category") {
    await User.findByIdAndUpdate(
      user._id,
      { ...user, action: "del_category" },
      { new: true }
    );
    bot.sendMessage(
      chatId,
      `Siz ${category.title} turkumini o'chirmoqchimisiz. Qaroringiz qatiymi?`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "Bekor qilish ❌",
                callback_data: `category_${category._id}`,
              },
              {
                text: "O`chirish ✅",
                callback_data: `del_category-${category._id}`,
              },
            ],
          ],
        },
      }
    );
  } else {
    let products = await Product.find({ category: category._id })
      .select(["_id"])
      .lean();

    await Promise.all(
      products.map(async (product) => {
        await Product.findByIdAndDelete(product._id);
      })
    );
    // await Category.findByIdAndRemove(id)
    await Category.findByIdAndDelete(id);

    bot.sendMessage(chatId, `${category.title} turkumi o'chirildi!`);
  }
};

const edit_category = async (chatId, id) => {
  let user = await User.findOne({ chatId }).lean();
  let category = await Category.findById(id).lean();

  await User.findByIdAndUpdate(
    user._id,
    { ...user, action: `edit_category-${id}` },
    { new: true }
  );

  bot.sendMessage(chatId, `${category.title} turkumiga yangi nom bering`);
};

const save_categroy = async (chatId, title) => {
  let user = await User.findOne({ chatId }).lean();
  await User.findByIdAndUpdate(
    user._id,
    { new: true, action: "menu" },
    { new: true }
  );
  let id = user.action.split("-")[1];
  let category = await Category.findById(id).lean();
  await Category.findByIdAndUpdate(id, { ...category, title }, { new: true });
  bot.sendMessage(chatId, `Turkum yangilandi!`);
};

module.exports = {
  get_all_categories,
  add_category,
  new_category,
  pagination_category,
  show_category,
  remove_category,
  edit_category,
  save_categroy,
}; 