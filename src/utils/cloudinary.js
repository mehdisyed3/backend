import {v2 as  cloudinary} from 'cloudinary';
import e from 'express';
import fs from 'fs';


// (async function() {

    // Configuration
    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET 
    });

    // we are going to uplaod file locally on our server and then push to cloudinary 
    //in case of error uplaoding files directly to cloudinary so  that we have the file saved locally and can be saved to cloudinary later

    const uploadOnCloudinary = async (filePath) => {
      try{
        if(!filePath) return;

        const response = await cloudinary.uploader.upload(filePath,{
          resource_type: 'auto', //Automatically determine the type of file to upload
        })
        console.log('>>> response', response);
        // file uploaded successfully
        console.log('File uploaded on cloudinary successfully',response.url);
        fs.unlinkSync(filePath); // remove the locallly saved temp file as the upload operation was successful
        return response
      }
      catch(error){
        console.log(error);
        fs.unlinkSync(filePath); // remove the locallly saved temp file as the upload operation failed
        return null;
      }

    }

    export {uploadOnCloudinary};
    
    // Upload an image
    //  const uploadResult = await cloudinary.uploader
    //    .upload(
    //        'https://res.cloudinary.com/demo/image/upload/getting-started/shoes.jpg', {
    //            public_id: 'shoes',
    //        }
    //    )
    //    .catch((error) => {
    //        console.log(error);
    //    });
    
    // console.log(uploadResult);
    
    // // Optimize delivery by resizing and applying auto-format and auto-quality
    // const optimizeUrl = cloudinary.url('shoes', {
    //     fetch_format: 'auto',
    //     quality: 'auto'
    // });
    
    // console.log(optimizeUrl);
    
    // // Transform the image: auto-crop to square aspect_ratio
    // const autoCropUrl = cloudinary.url('shoes', {
    //     crop: 'auto',
    //     gravity: 'auto',
    //     width: 500,
    //     height: 500,
    // });
    
    // console.log(autoCropUrl);    
// })();