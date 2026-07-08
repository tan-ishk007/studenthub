import mongoose from 'mongoose';

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
    semester: {
      type: Number,
      required: [true, 'Semester is required'],
      min: 1,
      max: 8,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['Notes', 'PYQs', 'Books', 'Assignments', 'Coding', 'Lab Files', 'Others'],
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
  },
  { timestamps: true }
);

const Resource = mongoose.model('Resource', resourceSchema);

export default Resource;
