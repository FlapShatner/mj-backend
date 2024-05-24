import { uploadImage } from './cloudinary.js'

export const uploadImageToCloudinary = async (imageUrl, content, style) => {
 try {
  const cloudinaryData = await uploadImage(imageUrl, content, style)
  //   const cloudinaryData = {
  //    publicId: 'yakr7wsmcgk8mve1gwao',
  //    url: 'https://res.cloudinary.com/dkxssdk96/image/upload/v1715617819/yakr7wsmcgk8mve1gwao.png',
  //   }
  return cloudinaryData
 } catch (error) {
  return { error: error.message }
 }
}
