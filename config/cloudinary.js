import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: (req, file) => {
    const isImage = ['image/jpeg', 'image/png'].includes(file.mimetype);

    return {
      folder: 'studenthub_resources',
      resource_type: isImage ? 'image' : 'raw',
      allowed_formats: ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'jpg', 'png'],
    };
  },
});

const upload = multer({ storage });

export default upload;
