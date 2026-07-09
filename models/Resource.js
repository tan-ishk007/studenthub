import mongoose from 'mongoose';
import { RESOURCE_CATEGORIES, BRANCHES, MIN_YEAR, MAX_YEAR } from '../config/constants.js';

const resourceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
    },
    branch: {
      type: String,
      required: [true, 'Branch is required'],
      enum: BRANCHES,
    },
    semester: {
      type: Number,
      required: [true, 'Semester is required'],
      min: 1,
      max: 8,
    },
    // Calendar/exam year the resource is from (e.g. 2025), not the
    // student's year of study. Optional — most Notes/Books don't have one.
    year: {
      type: Number,
      required: false,
      min: MIN_YEAR,
      max: MAX_YEAR,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: RESOURCE_CATEGORIES,
    },
    fileUrl: {
      type: String,
      required: [true, 'File is required'],
    },
    fileName: {
      type: String,
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Set only for resources created by the Drive import script.
    // `sparse: true` means manually-uploaded resources (which have no
    // driveFileId at all) don't collide on the unique index — but two
    // imports of the *same* Drive file will, which is what makes re-running
    // the import script safe (already-imported files are skipped instead
    // of duplicated).
    driveFileId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
  },
  { timestamps: true }
);

const Resource = mongoose.model('Resource', resourceSchema);

export default Resource;
