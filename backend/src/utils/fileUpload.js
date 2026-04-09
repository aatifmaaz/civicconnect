/**
 * File Upload Configuration (Multer with Cloudinary)
 * Handles file upload middleware with validation
 */

const multer = require('multer');
const path = require('path');
const cloudinary = require('cloudinary');
const cloudinaryStorage = require('multer-storage-cloudinary');
require('dotenv').config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Cloudinary storage
const storage = cloudinaryStorage({
  cloudinary: cloudinary,
  folder: 'civic-app-images',
  allowedFormats: ['jpg', 'png', 'jpeg', 'gif', 'webp'],
  transformation: [{ width: 1000, crop: 'limit' }]
});

// Create multer instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

/**
 * Single file upload middleware
 */
const uploadSingleFile = upload.single('image');

/**
 * Multiple file upload middleware
 */
const uploadMultipleFiles = upload.array('images', 5);

/**
 * Handle file deletion from Cloudinary
 * @param {string} imageUrl - Cloudinary URL to delete
 */
const deleteFile = async (imageUrl) => {
  try {
    if (!imageUrl || !imageUrl.includes('cloudinary.com')) {
      return false; // Skip if it's a local file or invalid URL
    }
    
    // Extract public_id from Cloudinary URL
    // Typical URL: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder_name/image_name.ext
    const urlParts = imageUrl.split('/');
    const folderAndFile = urlParts.slice(-2).join('/'); // 'civic-app-images/image_name.ext'
    const publicIdWithExt = folderAndFile.split('?')[0]; // Remove query params if any
    const publicId = publicIdWithExt.substring(0, publicIdWithExt.lastIndexOf('.'));
    
    const result = await cloudinary.v2.uploader.destroy(publicId);
    return result.result === 'ok';
  } catch (error) {
    console.error('Cloudinary file deletion error:', error);
    return false;
  }
};

module.exports = {
  uploadSingleFile,
  uploadMultipleFiles,
  deleteFile,
  upload
};
