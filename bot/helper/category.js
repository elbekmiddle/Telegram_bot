const { bot } = require("../bot");
const User = require("../../model/user");
const { adminKeyboard, userKeyboard } = require("../menu/keyboard");
const Category = require("../../model/category");
const Product = require("../../model/product");

get_all_categories = async (chatId, page = 1) => {
  let user = await User.findOne({ chatId }).lean();
  let limit = 5;
  let skip = (page - 1) * limit;
  let categories = await Category.find().skip(skip).limit(limit).lean();

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

  bot.sendMessage(chatId, "Kateoriyalar ro`yhati", {
    reply_markup: {
      remove_keyboard: true,
      inline_keyboard: [
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
      ],
    },
  });
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

const pagination_category = async (chatId, action) => {
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
  get_all_categories(chatId, page);
};

const show_category = async (chatId, id, page = 1) => {
  let cateogry = await Category.findById(id).lean();
  let user = await User.findOne({ chatId }).lean();
  let limit = 5;
  let skip = (page - 1) * limit;
  let products = await Product.find({ category: cateogry._id })
    .skip(skip)
    .limit(limit)
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
        callback_data: `add_product_${cateogry._id}`,
      },
    ],
    [
      {
        text: "Turkumni tahrirlash",
        callback_data: `edit_category-${cateogry._id}`,
      }
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

module.exports = {
  get_all_categories,
  add_category,
  new_category,
  pagination_category,
  show_category,
};