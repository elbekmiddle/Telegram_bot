const { bot } = require("./bot");
const { start, requestContact } = require("./helper/start");
const User = require("../model/user");
const { get_all_users } = require("./helper/users");
const {
  get_all_categories,
  new_category,
  save_categroy,
} = require("./helper/category");
const { add_product_next } = require("./helper/product");
const { end_order } = require("./helper/order");

bot.on("message", async (msg) => {
  const chatId = msg.from.id;
  const text = msg.text;
  // console.log(msg)
  const user = await User.findOne({ chatId }).lean();

  if (text === "/start") {
    start(msg);
  }
      if(msg.location && user.action == 'order'){
        console.log(msg.location)
        end_order(chatId, msg.location)
      }

  if (user) {
    if (user.action === "request_contact" && !user.phone) requestContact(msg);
    if (text === "Foydalanuvchilar"){
      get_all_users(msg);
      return
    } 
      
    if (text === "Katalog"){
      get_all_categories(chatId)
      return
    } 
    
    if (user.action === "add_category") {
      new_category(msg);
    }
    if (user.action.includes("edit_category-")) {
      save_categroy(chatId, text);
    }
    if (
      user.action.includes("new_product_") &&
      user.action !== "new_product_img"
    ) {
      add_product_next(chatId, text, user.action.split("_")[2]);
    }
    if (user.action == "new_product_img") {
      if (msg.photo) {
        add_product_next(chatId, msg.photo.at(-1).file_id, "img");
      } else {
        bot.sendMessage(
          chatId,
          "Mahsulot rasmini fayl korinishida emas oddiy rasm ko`rinishida yuklang"
        );
      }
    }
  }
});
