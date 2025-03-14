const { bot } = require("../bot");
const User = require("../../model/user");
const { adminKeyboard, userKeyboard } = require("../menu/keyboard");
const Category = require("../../model/category");

get_all_categories = async  (chatId, page = 1) => {
  let user = await User.findOne({ chatId }).lean();
  let limit = 5;
  let skip = (page - 1) * limit;
  let categories = await Category.find().skip(skip).limit(limit).lean();

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
            callback_data: "back_category",
          },
          {
            text: "1",
            callback_data: "0",
          },
          {
            text: "Keyingisi",
            callback_data: "next_category",
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
    if (action === "back_category" && page > 1) {
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

module.exports = {
  get_all_categories,
  add_category,
  new_category,
  pagination_category,
};

// 4:18
