import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();
// to use any middleware we use app.use
app.use(cors({
  origin : process.env.CORS_ORIGIN, // to only allow cross origin resouce sharing from the specified origin
  credentials : true
}));

app.use(express.json({limit: '16kb'})); // to receive json data from the client with a limit of 16kb
app.use(express.urlencoded({extended: true, limit: '16kb'})); //to receive and parse urlencoded data from the client with a limit of 16kb 
app.use(express.static('public'));// to serve static files from the public folder
app.use(cookieParser()); // to parse cookies from the client and perform crud operations on them

export {app};