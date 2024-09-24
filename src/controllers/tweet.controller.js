import { asyncHandler } from "../utils/asyncHandler.js";
import { Tweet } from "../models/tweet.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";


const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const userId = req.user._id;

  if (!content) {
    throw new ApiError(400, "Content cannot be empty");
  }

  if (!userId) {
    throw new ApiError(401, 'Unauthorized Request');
  }

  const newTweet = await Tweet.create({
    content,
    owner: userId,
  });

  const createdTweet = await Tweet.findById(newTweet._id)


  res.status(201).json(new ApiResponse(201, createdTweet, 'Tweet created successfully'));
});

const getUserTweets = asyncHandler(async (req, res) => {

  const userId = req.params.userId;

  if (!userId) {
    throw new ApiError(400, 'User Id is required');
  }

  const tweets = await Tweet.find({
    owner: userId
  })

  res.status(200).json(new ApiResponse(200, tweets, 'User tweets fetched successfully'));

})

const deleteTweet = asyncHandler(async (req, res) => {
  const tweetId = req.params.tweetId;

  if (!tweetId) {
    throw new ApiError(400, 'Tweet Id is required');
  }

  const tweet = await Tweet.findByIdAndDelete(tweetId);

  if (!tweet) {
    throw new ApiError(404, 'Tweet not found');
  }


  res.status(200).json(new ApiResponse(200, null, 'Tweet deleted successfully'));
});

const updateTweet = asyncHandler(async (req, res) => {
  const tweetId = req.params.tweetId;
  const { content } = req.body;

  if (!tweetId) {
    throw new ApiError(400, 'Tweet Id is required');
  }

  if (!content) {
    throw new ApiError(400, 'Content is required');
  }

  const tweet = await Tweet.findByIdAndUpdate(
    { _id: tweetId },
    { content: content },
    { new: true }
  )

  if (!tweet) {
    throw new ApiError(404, 'Tweet not found');
  }

  return res.status(200).json(new ApiResponse(200, tweet, 'Tweet updated successfully'));

});

export {
  createTweet,
  getUserTweets,
  deleteTweet,
  updateTweet,
};