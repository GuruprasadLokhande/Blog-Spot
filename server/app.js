const express = require("express");
const mongoos = require("mongoose");
const multer = require("multer");
const requestIp = require("request-ip");
require("dotenv").config();
const cookieParser = require("cookie-parser");
const cors = require("cors");

const app = express();

const port = process.env.PORT || "3030";
const MONGO_URL = process.env.MONGO_URL || `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@blogspot.reqbnje.mongodb.net/blog?retryWrites=true&w=majority&appName=BlogSpot`;

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(requestIp.mw());

// CORS configuration
const allowedOrigins = [
  "http://localhost:3000",
  "https://blog-spot-alpha.vercel.app"
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
    exposedHeaders: ["Set-Cookie"],
    maxAge: 86400 // 24 hours
  })
);

// add rateLimit later
//
// code here
//

// File upload configuration
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPEG, PNG, and JPG are allowed."));
    }
  },
});

app.use(upload.single("image"));

// Routes
const publicRoutes = require("./routes/public");
const authRoutes = require("./routes/auth");
const profileRoutes = require("./routes/profile");
const postRoutes = require("./routes/post");

app.use("/public", publicRoutes);
app.use("/auth", authRoutes);
app.use("/profile", profileRoutes);
app.use("/post", postRoutes);

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Error:', {
    message: error.message,
    stack: error.stack,
    statusCode: error.statusCode
  });
  
  const status = error.statusCode || 500;
  const message = error.message || "An error occurred";
  const data = error.data;
  
  res.status(status).json({
    error: "yes",
    errors: {
      message: message,
      details: data,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }
  });
});

// Database connection
mongoos
  .connect(MONGO_URL)
  .then(() => {
    console.log('Connected to MongoDB successfully');
    app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
