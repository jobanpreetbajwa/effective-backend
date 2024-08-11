const Product = require('../model/product.model');
const Category = require('../model/category.model');
async function search({ item, filters}) {
    const products = await Product.find({name:{$regex:item,$options:'i'}}).populate("img_ids");
    const categories = await Category.find({category_name:{$regex:item,$options:'i'}}).populate("img_ids");
    return {products,categories};
}

module.exports = {
    search,
}