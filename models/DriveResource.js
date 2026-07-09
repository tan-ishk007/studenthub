import mongoose from "mongoose";

const driveResourceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    driveFileId: {
      type: String,
      required: true,
      unique: true,
    },

    semester: {
      type: Number,
      required: true,
    },

    subject: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      default: "Others",
    },

    path: {
      type: String,
      required: true,
    },

    mimeType: String,

    // true when no subject folder could be detected in the Drive path
    // (file sat directly inside a category folder, e.g. "5TH SEM/Papers/x.pdf")
    needsReview: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("DriveResource", driveResourceSchema);
