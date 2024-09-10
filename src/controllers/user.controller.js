import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  // res.status(200).json({ message: "user registered!!!!" });
  const { fullName, email, password, username } = req.body;
 console.log('@@@@@@@@',req)
  if([fullName, email, password, username].some((field) => field?.trim() === '')){
    throw new ApiError(400, 'All fields are required');
  }

 const existingUser = await User.findOne({ 
    $or: [ { email }, { username } ]
   })

   if(existingUser){
     throw new ApiError(409, 'Email or username already exists');
   }

  const avatarLocalPath =  req.files?.avatar[0]?.path;
  const coverImageLocalPath =  req.files?.coverImage[0]?.path;

  if(!avatarLocalPath){
    throw new ApiError(400, 'Avatar is required');
  }
  // if(!coverImageLocalPath){
  //   throw new ApiError(400, 'Cover Image is required');
  // }

  const avatar = await uploadOnCloudinary(avatarLocalPath)
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if(!avatar){
    throw new ApiError(500, 'Error uploading avatar');
  }
  // if(!coverImage){
  //   throw new ApiError(500, 'Error uploading cover image');
  // }
  const  user = await User.create({
    fullName,
    username: username.toLowerCase(),
    password,
    email,
    avatar: avatar.url,
    coverImage: coverImage?.url||'',    
  })
  console.log('>>>> user', user);

  const createdUser = await User.findById(user._id).select('-password -refreshToken');

  if(!createdUser){
    throw new ApiError(500, 'Error creating user');
  }

  return res.status(201).json(
    new ApiResponse(201, createdUser, 'User created successfully')
  );
});

const logginUser = asyncHandler(async (req, res) => {
  res.status(20).json({ message: "user logged in Cheetayy !!!!" });
});

export { registerUser,logginUser };