const ThemePreviewModel = require("../model/theme_preview.model");
const ErrorHandler = require("../utils/errorHandler");

async function addThemePreview(data) {
  let themePreview;
  const { type } = data;
  switch (type) {
    case 1: {
      themePreview = new ThemePreviewModel({
        hidden: data.hidden || false,
        type: type,
        title: data.title,
        category_ids: data.category_ids || [],
      });
      break;
    }
    case 2: {
      themePreview = new ThemePreviewModel({
        hidden: data.hidden || false,
        type: type,
        title: data.title,
        product_ids: data.product_ids || [],
      });
      break;
    }
    case 3: {
      themePreview = new ThemePreviewModel({
        hidden: data.hidden || false,
        type: type,
        title: data.title,
        slideshow: data.slideshow || [],
      });
      break;
    }
    case 4: {
      themePreview = new ThemePreviewModel({
        hidden: data.hidden || false,
        type: type,
        title: data.title,
        tagline: data.tagline || "",
      });
      break;
    }
    case 5: {
      themePreview = new ThemePreviewModel({
        hidden: data.hidden || false,
        type: type,
        title: data.title,
        reviews: data.reviews || {},
      });
      break;
    }
    default: {
      throw new Error("Unsupported theme preview type");
    }
  }

  const srn = await ThemePreviewModel.countDocuments();
  themePreview.srn = srn + 1;
  await themePreview.save();

  let response;

  switch (type) {
    case 1: {
      response = await ThemePreviewModel.findById(themePreview._id).populate({
        path: "category_ids",
        populate: {
          path: "img_ids",
        },
      });
      break;
    }
    case 2: {
      response = await ThemePreviewModel.findById(themePreview._id)
        .populate({
          path: "product_ids",
          populate: {
            path: "img_ids",
          },
        })
        .lean();
      break;
    }
    case 3: {
      response = await ThemePreviewModel.findById(themePreview._id)
        .populate({
          path: "slideshow",
          populate: {
            path: "img_id",
          },
        })
        .lean();
      break;
    }
    case 4: {
      await reorderThemePreviews(themePreview.srn, 1, themePreview._id);
      response = themePreview;
      break;
    }
    case 5: {
      response = themePreview;
      break;
    }
    default: {
      break;
    }
  }

  return response;
}

async function deleteThemePreview(_id) {
  const themePreview = await ThemePreviewModel.findById(_id);
  if (!themePreview) {
    throw new ErrorHandler("Theme preview not found", 400);
  }
  await themePreview.deleteOne();

  if (themePreview.srn > 1) {
    await ThemePreviewModel.updateMany(
      { srn: { $gt: themePreview.srn } },
      { $inc: { srn: -1 } }
    );
  }

  return themePreview;
}

async function updateThemePreview(_id, data) {
  const themePreview = await ThemePreviewModel.findById(_id)
    .populate({
      path: "slideshow",
      populate: {
        path: "img_id",
      },
    })
    .populate({
      path: "product_ids",
      populate: {
        path: "img_ids",
      },
    })
    .populate({
      path: "category_ids",
      populate: {
        path: "img_ids",
      },
    });

  if (!themePreview) {
    throw new ErrorHandler("Theme preview not found", 400);
  }

  Object.assign(themePreview, data);
  await themePreview.save();

  return themePreview;
}

async function showThemePreview(_id, hide) {
  const themePreview = await ThemePreviewModel.findById(_id);
  if (!themePreview) {
    throw new ErrorHandler("Theme preview not found", 400);
  }

  // Update the theme preview document
  themePreview.hidden = hide === "1" ? true : false;
  await themePreview.save();

  return themePreview;
}

async function reorderThemePreviews(from, to, _id) {
  if (from > to) {
    const filter = { srn: { $lt: from, $gt: to - 1 } };
    const update = { $inc: { srn: 1 } };

    const result = await ThemePreviewModel.updateMany(filter, update);
    await ThemePreviewModel.updateOne({ _id }, { $set: { srn: to } });
  } else if (to > from) {
    const filter = { srn: { $gt: from, $lt: to + 1 } };
    const update = { $inc: { srn: -1 } };

    const result = await ThemePreviewModel.updateMany(filter, update);
    await ThemePreviewModel.updateOne({ _id }, { $set: { srn: to } });
  }

  return await ThemePreviewModel.find().sort({ srn: 1 });
}

async function getThemePreviews() {
  let data = await ThemePreviewModel.find()
    .populate("category_ids product_ids")
    .populate({
      path: "slideshow",
      populate: {
        path: "img_id",
      },
    })
    .populate({
      path: "product_ids",
      populate: [
        {
          path: "img_ids",
        },
        {
          path: "offers", // Populate the offer field
        },
        {
          path: "size", // Populate the size field
        },
      ],
    })
    .populate({
      path: "category_ids",
      populate: {
        path: "img_ids",
      },
    })
    .sort({ srn: 1 });
  if (data.length === 0) {
    let preview = [];
    preview.push(
      new ThemePreviewModel({
        type: 3,
        title: "",
        slideshow: [],
        main: true,
        srn: 2,
      })
    );
    preview.push(
      new ThemePreviewModel({
        type: 4,
        title: "",
        tagline: "",
        main: true,
        srn: 1,
      })
    );
    await ThemePreviewModel.insertMany(preview);
    data = await ThemePreviewModel.find()
      .populate("category_ids product_ids")
      .populate({
        path: "slideshow",
        populate: {
          path: "img_id",
        },
      })
      .populate({
        path: "product_ids",
        populate: {
          path: "img_ids",
        },
      })
      .populate({
        path: "category_ids",
        populate: {
          path: "img_ids",
        },
      })
      .sort({ srn: 1 });
  }
  return data;
}

module.exports = {
  addThemePreview,
  deleteThemePreview,
  updateThemePreview,
  showThemePreview,
  reorderThemePreviews,
  getThemePreviews,
};
