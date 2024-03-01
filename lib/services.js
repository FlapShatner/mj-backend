import { uploadImage } from "./cloudinary.js";

export const uploadImageToCloudinary = async (imageUrl, content, style) => {
    try {
       const cloudinaryData = await uploadImage(imageUrl, content, style )
        return cloudinaryData
    } catch (error) {
        return { error: error.message };
    }
};