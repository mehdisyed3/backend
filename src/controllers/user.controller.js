import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from 'jsonwebtoken';
import mongoose from "mongoose";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId)

    const accessToken = await user.generateAccessToken()
    const refreshToken = await user.generateRefreshToken()

    user.refreshToken = refreshToken
    await user.save({ validateBeforeSave: false })

    return { accessToken, refreshToken }


  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating referesh and access token")
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


  const createdUser = await User.findById(user._id).select('-password -refreshToken');

  if (!createdUser) {
    throw new ApiError(500, 'Error creating user');
  }

  return res.status(201).json(
    new ApiResponse(201, createdUser, 'User created successfully')
  );
});

const logginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body

  if (!username && !email) {
    throw new ApiError(400, 'Username or email is required');
  }

  const user = await User.findOne({
    $or: [{ email }, { username }]
  })

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid credentials');
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

  const loggedInUser = await User.findById(user._id).select('-password -refreshToken');

  // options are sent to the browser to tell the browser to store the cookie in a secure way
  // httpOnly: true means that the cookie cannot be accessed  on the client side
  // secure: true means that the cookie can only be sent over https
  // the cookie is sent to the browser with the response
  const options = {
    httpOnly: true,
    secure: true
  }
  return res.status(200)
    .cookie('accessToken', accessToken, options)
    .cookie('refreshToken', refreshToken, options)
    // .json( new ApiResponse(200, loggedInUser, 'User logged in successfully'));
    .json(new ApiResponse(200, { user: loggedInUser, accessToken, refreshToken }, 'User logged in successfully'));

});

const logoutUser = asyncHandler(async (req, res) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  // res.status(200).json(new ApiResponse(200, {}, 'User logged out successfully'));
  const user = await User.findByIdAndUpdate(req.user._id, {
    $unset: { refreshToken: 1 }
  }, {
    new: true
  });
  const options = {
    httpOnly: true,
    secure: true
  }
  return res.status(200).clearCookie('accessToken', options).clearCookie('refreshToken', options).json(new ApiResponse(200, {}, 'User logged out successfully'));

});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

  if (!incomingRefreshToken) {
    throw new ApiError(401, 'No refresh token found');
  }
  try {
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

    const user = await User.findById(decodedToken._id)

    if (!user) {
      throw new ApiError(401, 'Invalid refresh token');
    }

    if (user?.refreshToken !== incomingRefreshToken) {
      throw new ApiError(401, 'Refresh token has been invalidated');
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    const options = {
      httpOnly: true,
      secure: true
    }

    return res.status(200)
      .cookie('accessToken', accessToken, options)
      .cookie('refreshToken', refreshToken, options)
      .json(new ApiResponse(200, { accessToken, refreshToken }, 'successfully refreshed access token'));

  } catch (error) {
    throw new ApiError(401, 'Invalid refresh token');

  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id);

  const isPasswordValid = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordValid) {
    throw new ApiError(400, 'Old password is incorrect');
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, 'Password changed successfully'));

});

const getCurrentUser = asyncHandler(async (req, res) => {

  return res.status(200).json(new ApiResponse(200, req.user, 'User fetched successfully'));

});

const updateAccountDetails = asyncHandler(async (req, res) => {

  const { fullName, email } = req.body;

  if (!fullName || !email) {
    throw new ApiError(400, 'All Fields are required');
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        fullName,
        email
      },
      new: true
    }
  ).select('-password -refreshToken');

  return res.status(200).json(new ApiResponse(200, user, 'Account has been updated successfully'));


})

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file.path

  if (!avatarLocalPath) {
    throw new ApiError(400, 'Avatar file is missin');
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath)

  if (!avatar.url) {
    throw new ApiError(500, 'Error uploading avatar on cloudinary');
  }

  const user = await User.findByIdAndUpdate(req.user._id, {
    $set: { avatar: avatar.url },
  },
    { new: true }
  ).select('-password -refreshToken');

  return res.status(200).json(new ApiResponse(200, user, 'Avatar updated successfully'));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {

  const coverImageLocalPath = req.file.path

  if (!coverImageLocalPath) {
    throw new ApiError(400, 'Cover Image file is missing');
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  console.log('<><><><><> coverImage', coverImage)
  if (!coverImage.url) {
    throw new ApiError(500, 'Error uploading cover image on cloudinary no url');
  }

  const user = await User.findByIdAndUpdate(req.user?._id, {
    $set: {
      coverImage: coverImage.url
    }
  }, {
    new: true
  }).select('-password');
  console.log('##### USER', user)

  // return res.status(200).json(new ApiResponse(200, user, 'Cover Image updated successfully'));
  return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Cover image updated successfully")
    )


})

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username?.trim()) {
    throw new ApiError(400, 'Username is required');
  }

  const channel = await User.aggregate([
    {
      $match: {
        username: username.toLowerCase()
      }
    },
    {
      $lookup: {
        from: 'subscriptions',
        localField: '_id',
        foreignField: 'channel',
        as: 'subscribers'
      }
    },
    {
      $lookup: {
        from: 'subscriptons',
        localField: '_id',
        foreignField: 'subscriber',
        as: 'subscribedTo'
      }
    },
    {
      $addFields: {
        subscribersCount: { $size: '$subscribers' },
        subscribedToCount: { $size: '$subscribedTo' },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false
          }
        }
      }
    },
    {
      $project: {
        subscribersCount: 1,
        subscribedToCount: 1,
        isSubscribed: 1,
        fullName: 1,
        username: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
      }
    }
  ])

  if (!channel?.length) {
    throw new ApiError(404, 'Channel not found')
  }

  return res.status(200)
    .json(new ApiResponse(200, channel[0], 'Channel fetched successfully'));

});

const getWatchHistory = asyncHandler(async (req, res) => {
  console.log('>>>>> req.user', req.user._id)
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id)
        // _id: req.user._id

      }
    },
    {
      $lookup: {
        from: 'videos',
        localField: 'watchHistory',
        foreignField: '_id',
        as: 'watchHistory',
        pipeline: [
          {
            $lookup: {
              from: 'users',
              localField: 'owner',
              foreignField: '_id',
              as: 'owner',
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1,

                  }
                }
              ]
            }
          },
          {
            $addFields: {
              // owner: { $arrayElemAt: ['$owner', 0]}  // this is the same as the line below
              owner:{
                $first: "$owner"
            }
            }
          }
        ]
      }
    },
  ])

  return res.status(200).json(new ApiResponse(200, user[0].watchHistory, 'Watch history fetched successfully'));

})

export {
  registerUser,
  logginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails
  , updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory

};