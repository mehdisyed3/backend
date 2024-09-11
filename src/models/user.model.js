import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  fullName: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  avatar: {
    type: String, //cluodinary url
    required: true,

  },
  coverImage: {
    type: String, //cluodinary url

  },
  password: {
    type: String,
    required: [true, 'Password is required'],


  },
  watchHistory: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Video'
    }
  ],
  refreshToken: {
    type: String,
  },

}, { timestamps: true });

// in middleware we do not use arrow funtion because we want to use this keyword to refer to the current document hence we use normal function expression

userSchema.pre('save', async function(next){
  if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);

    next();
})
 userSchema.methods.isPasswordCorrect = async function(password){
  return await bcrypt.compare(password, this.password);
 }
 userSchema.methods.generateAccessToken = function(){
 return  jwt.sign({
    _id:this._id,
    email:this.email,
    username:this.username,
    fullName:this.fullName,
  },
  process.env.ACCESS_TOKEN_SECRET,
{
  expiresIn: process.env.ACCESS_TOKEN_EXPIRY
})

 }
  userSchema.methods.generateRefreshToken = function(){
    return  jwt.sign({
      _id:this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
  {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY
  })
  }

export const User = mongoose.model('User', userSchema);