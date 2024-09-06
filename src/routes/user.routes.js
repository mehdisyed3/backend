import { Router } from "express";
import { logginUser, registerUser } from "../controllers/user.controller.js";

const router = Router();

router.route('/register').post(registerUser)
router.route('/login').get(logginUser)

export default router;