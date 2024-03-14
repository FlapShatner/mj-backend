// Require the cloudinary library
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

/////////////////////////
// Uploads an image file
/////////////////////////
export const uploadImage = async (url, content, style) => {
  console.log("uploading image", url, style)  
  const options = {
    use_filename: false,
    unique_filename: true,
    overwrite: false,
    resource_type: 'auto',
    context: `content=${content}|style=${style}`,
  }

  try {
    const result = await cloudinary.uploader.upload(url, options)
    console.log('cloudinary res:', result.url)
    const imgData = {
      url: result.secure_url,
      publicId: result.public_id
    }
    return imgData
  } catch (error) {
    console.error(error)
  }
}
