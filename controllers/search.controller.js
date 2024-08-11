const { search } = require("../services/search.service");

class SearchController {
  async search(req, res) {
    const { item, filters } = req.query;
    if(!item){
    res.status(400).json({ error: 'Item is required' });
    }
    //use filters for searching.
    let parsedFilters = {};
    if (filters) {
      try {
        parsedFilters = JSON.parse(filters);
      } catch (error) {
        return res.status(400).json({ error: 'Invalid filters format' });
      }
    }
    const response = await search({ item, filters: parsedFilters });

    res.json(response);
  }
}

module.exports = new SearchController();