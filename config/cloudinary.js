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
    const mime = file.mimetype ? file.mimetype.toLowerCase() : '';
    // 🔥 Fix: PDF, JPG, aur PNG sabhi 'image' category mein hone chahiye Cloudinary ke liye
    const isImageOrPdf = mime.includes('image') || mime.includes('pdf') || file.originalname.toLowerCase().endsWith('.pdf');

    return {
      folder: 'studenthub_resources',
      // Agar image/pdf hai toh 'image', agar docx/pptx hai toh 'raw', ya fir use automatic detect hone do ('auto')
      resource_type: isImageOrPdf ? 'image' : 'auto', 
      // Note: 'raw' files ke sath allowed_formats issue karta hai, isliye hum isko basic image/pdf tak generic rakh sakte hain ya skip kar sakte hain
    };
  },
});

const upload = multer({ storage });

// Named export of the configured client itself, for code that needs to
// upload outside of an Express multipart request (e.g. scripts/importFromDrive.js).
export { cloudinary };

export default upload;
