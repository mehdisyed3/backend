import { asyncHandler } from "../utils/asyncHandler.js";

const registerUser = asyncHandler(async (req, res) => {
  res.status(200).json({ message: "user registered!!!!" });
});

const logginUser = asyncHandler(async (req, res) => {
  res.status(200).json({ message: "user logged in Cheetayy !!!!" });
});

export { registerUser,logginUser };