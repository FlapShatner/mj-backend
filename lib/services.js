import { uploadImage } from './cloudinary.js'

export const uploadImageToCloudinary = async (imageUrl, content, style) => {
 console.log('uploading to cloudinary')
 try {
  const cloudinaryData = await uploadImage(imageUrl, content, style)
  return cloudinaryData
 } catch (error) {
  return { error: error.message }
 }
}
