const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
      minlength: 2,
      maxlength: 60,
      unique: true,
      index: true,
    },

    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 300,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Category", categorySchema);
