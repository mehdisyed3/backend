import { Router } from "express";
import { logginUser, registerUser, logoutUser, refreshAccessToken } from "../controllers/user.controller.js";

import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// multer middleware is used to upload files to the server
// upload.fields() is used to upload multiple files to the server
// upload.fields() takes an array of objects with the name and maxCount properties
// name is the name of the field in the form
// maxCount is the maximum number of files that can be uploaded
// upload.fields() returns a middleware function that can be used in the route
// upload.fields() saves the files in the specified destination
// upload.fields() saves the file information in the req.files object
// upload.fields() saves the file path in the req.files[field][index].path property
// upload.fields() saves the file original name in the req.files[field][index].originalname property
// upload.fields() saves the file mimetype in the req.files[field][index].mimetype property
router.route('/register').post(
  upload.fields([
    {
      name: "avatar", maxCount: 1
    },
    {
      name: "coverImage", maxCount: 1
    }
  ]),
  registerUser
)

router.route('/login').post(logginUser)

//secure routes

router.route('/logout').post(verifyJWT, logoutUser)
router.route('/refresh-token').post(refreshAccessToken)

export default router;