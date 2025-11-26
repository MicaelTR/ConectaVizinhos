// JS/config/upload.js

const path = require("path");
const multer = require("multer");
const { GridFsStorage } = require("multer-gridfs-storage");
const crypto = require("crypto");

const mongoURI = process.env.MONGO_URI;

// STORAGE
const storage = new GridFsStorage({
  url: mongoURI,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) return reject(err);

        const filename = buf.toString("hex") + path.extname(file.originalname);

        const fileInfo = {
          filename,
          bucketName: "uploads", // 🔥 obrigatória
        };

        resolve(fileInfo);
      });
    });
  },
});

const upload = multer({ storage });

module.exports = upload;
