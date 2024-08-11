
const searchController = require("../controllers/search.controller");
const router = require("express").Router();

router.get("/", searchController.search);

module.exports = router;