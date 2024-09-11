import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from 'jsonwebtoken';
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async (req, _, next) => {

try {
  const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
  console.log('>>>> token', token);
  if(!token){
    throw new ApiError(401, 'Unauthorized Request');
  }
  console.log('>>>> req.cookies', req.cookies);
  console.log('>>>> req.headers', req.headers);

  const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

  console.log('###### decodedToken', decodedToken);
  
  const user = await User.findById(decodedToken?._id).select('-password -refreshToken');
  
  if(!user){
    throw new ApiError(401, 'Invalid access token');  
  }
  
  req.user = user;
  
  next();
} catch (error) {
  console.log('#@#@##@#@#@# JWT',jwt)
  throw new ApiError(401, 'invalid access token Request');
  
}


});