// Require the cloudinary library
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();
// Return "https" URLs by setting secure: true
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

// Log the configuration
// console.log(cloudinary.config())

/////////////////////////
// Uploads an image file
/////////////////////////
export const uploadImage = async (url, prompt, style) => {
  // Use the uploaded file's name as the asset's public ID and
  // allow overwriting the asset with new versions
  console.log("uploading image", url, prompt, style)
  const options = {
    use_filename: false,
    unique_filename: true,
    overwrite: false,
    resource_type: 'auto',
    context: `prompt=${prompt}|style=${style}`,
  }

  try {
    // Upload the image
    // const result = cloudinary.uploader.upload_stream(noBgData, options)
    // const result = await new Promise((resolve) => {
    //   cloudinary.uploader.upload_stream(options, (error, result) => {
    //     if (result) {
    //       resolve(result);
    //     } else {
    //       console.log(error);
    //     }
    //   }).end(noBgData);
    // })
    // // console.log(result)
    // return result.secure_url

    const result = await cloudinary.uploader.upload(url, options)
    return result.secure_url
  } catch (error) {
    console.error(error)
  }
}
