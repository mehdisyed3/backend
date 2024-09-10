import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId)
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()
    user.refreshToken = refreshToken;
    user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken }

  } catch (error) {
    throw new ApiError(500, 'Error generating tokens');
  }
}

const registerUser = asyncHandler(async (req, res) => {
  // res.status(200).json({ message: "user registered!!!!" });
  const { fullName, email, password, username } = req.body;
  console.log('@@@@@@@@', req)
  if ([fullName, email, password, username].some((field) => field?.trim() === '')) {
    throw new ApiError(400, 'All fields are required');
  }

  const existingUser = await User.findOne({
    $or: [{ email }, { username }]
  })

  if (existingUser) {
    throw new ApiError(409, 'Email or username already exists');
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, 'Avatar is required');
  }
  // if(!coverImageLocalPath){
  //   throw new ApiError(400, 'Cover Image is required');
  // }

  const avatar = await uploadOnCloudinary(avatarLocalPath)
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if (!avatar) {
    throw new ApiError(500, 'Error uploading avatar');
  }
  // if(!coverImage){
  //   throw new ApiError(500, 'Error uploading cover image');
  // }
  const user = await User.create({
    fullName,
    username: username.toLowerCase(),
    password,
    email,
    avatar: avatar.url,
    coverImage: coverImage?.url || '',
  })
  console.log('>>>> user', user);

  const createdUser = await User.findById(user._id).select('-password -refreshToken');

  if (!createdUser) {
    throw new ApiError(500, 'Error creating user');
  }

  return res.status(201).json(
    new ApiResponse(201, createdUser, 'User created successfully')
  );
});

const logginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;
  if (!username && !email) {
    throw new ApiError(400, 'Username or email is required');
  }

  console.log('>>>> req.body', req.body);

  const user = await User.findOne({
    $or: [{ email }, { username }]
  })

  console.log('>>>> user', user);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  console.log('>>>> isPasswordValid', isPasswordValid);
  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid credentials');
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

  const loggedInUser = await User.findById(user._id).select('-password -refreshToken');
  console.log('@@@@ loggedinUSEr', loggedInUser);
  console.log('!!!! accessTOKER',accessToken)
  console.log('!!!! refreshToken',refreshToken)

  const options ={
    httpOnly:true,
    secure:true
  }
  return res.status(200).cookie('accessToken', accessToken,options)
  .cookie('refreshToken', refreshToken, options)
  // .json( new ApiResponse(200, loggedInUser, 'User logged in successfully'));
  .json( new ApiResponse(200, { user : loggedInUser, accessToken, refreshToken}, 'User logged in successfully'));

});

const logoutUser = asyncHandler(async (req, res) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  // res.status(200).json(new ApiResponse(200, {}, 'User logged out successfully'));
  const user = await User.findByIdAndUpdate(req.user._id , {
    $set : { refreshToken : undefined}
  },{
    new : true
  } );
  const options ={
    httpOnly:true,
    secure:true
  }
  return res.status(200).clearCookie('accessToken', options).clearCookie('refreshToken', options).json(new ApiResponse(200, {}, 'User logged out successfully'));

});


export { registerUser, logginUser, logoutUser };