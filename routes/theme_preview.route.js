const express = require("express");
const themePreviewController = require("../controllers/theme_preview.controller");

const router = express.Router();

router.post("/add", themePreviewController.addThemePreview);
router.delete("/:id", themePreviewController.deleteThemePreview);
router.put("/:id", themePreviewController.updateThemePreview);
router.get("/:id/:hide", themePreviewController.showThemePreview);
router.post("/reorder", themePreviewController.reorderThemePreviews);
router.get("/", themePreviewController.getThemePreviews);

module.exports = router;
