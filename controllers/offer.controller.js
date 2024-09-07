const createOffer = require("../services/offer.services").createOffer;
const getOffers = require("../services/offer.services").getOffers;
const bindProducts = require("../services/offer.services").bindProducts;
class OfferController {
  async getOffers(req, res) {
    try{
      const offers = await getOffers();
    res.status(200).json({message: "Offers fetched successfully",success:true, data: offers});
    }catch(error){
      console.log(error);
      res.status(500).json({message: "Internal server error",success:true});
    }
  }

  async createOffer(req, res) {
    try{
    const {type} = req.body;
    if(['seasonal', 'loyalty', 'free_shipping'].includes(type)){
        delete req.body.discountValue;
        delete req.body.discountUpto;
    }
    const offer = await createOffer(req.body);
    res.json(offer);
    }
    catch(error){
        console.log(error);
        res.status(500).json({message: "Internal server error"});
    }
  }
  async deleteOffer(req, res) {
    // const offer = await deleteOffer(req.params.id);
    // res.json(offer);
  }

  async bindProducts(req, res) {
   try{
    const offerId = req.params.offerId;
    const productIds = req.body;
    const response = await bindProducts(offerId, productIds);
    res.json({
      message: "Products binded successfully",
      success: true,
      data: response
  });
   }
   catch(error){
    console.log(error);
  
    res.status(500).json({
      message: "Internal server error",
      success: false,
  });
  }
}
}

module.exports =new OfferController();