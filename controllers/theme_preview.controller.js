const {
  addThemePreview,
  deleteThemePreview,
  updateThemePreview,
  reorderThemePreviews,
  showThemePreview,
  getThemePreviews,
} = require("../services/theme_preview.service");

class ThemePreviewController {
  async addThemePreview(req, res, next) {
    try {
      const themePreview = await addThemePreview(req.body);
      return res.status(201).json(themePreview);
    } catch (err) {
      return res.status(err.status || 500).json({ message: err.message });
    }
  }

  async deleteThemePreview(req, res, next) {
    try {
      const themePreview = await deleteThemePreview(req.params.id);
      return res.json(themePreview);
    } catch (err) {
      return res.status(err.status || 500).json({ message: err.message });
    }
  }

  async updateThemePreview(req, res, next) {
    try {
      const themePreview = await updateThemePreview(req.params.id, req.body);
      return res.json(themePreview);
    } catch (err) {
      return res.status(err.status || 500).json({ message: err.message });
    }
  }

  async showThemePreview(req, res, next) {
    try {
      const themePreview = await showThemePreview(
        req.params.id,
        req.params.hide
      );
      return res.json(themePreview);
    } catch (err) {
      return res.status(err.status || 500).json({ message: err.message });
    }
  }

  async reorderThemePreviews(req, res, next) {
    try {
      const { from, to, _id } = req.body;
      const themePreviews = await reorderThemePreviews(from, to, _id);
      return res.json(themePreviews);
    } catch (err) {
      return res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getThemePreviews(req, res, next) {
    try {
      const themePreviews = await getThemePreviews();
      return res.json(themePreviews);
    } catch (err) {
      return res.status(err.status || 500).json({ message: err.message });
    }
  }
}
module.exports = new ThemePreviewController();
