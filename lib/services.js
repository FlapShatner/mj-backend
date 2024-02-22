import { uploadImage } from "./cloudinary.js";

export const uploadImageToCloudinary = async (imageUrl, prompt, style) => {
    try {
       const cloudinaryUrl = await uploadImage(imageUrl, prompt, style )
        return cloudinaryUrl
    } catch (error) {
        return { error: error.message };
    }
};