import { uploadImage } from "./cloudinary.js";

export const uploadImageToCloudinary = async (imageUrl, prompt, style) => {
    try {
       const cloudinaryData = await uploadImage(imageUrl, prompt, style )
        return cloudinaryData
    } catch (error) {
        return { error: error.message };
    }
};