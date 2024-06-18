const express = require('express');
const app = express();
const path = require('path');
const multer = require('multer');
require('dotenv').config();
const port = process.env.PORT || 3000;

// server.js
const storeRoutes = require('./routes/appRoutes');

app.use('/static', express.static(path.join(__dirname, 'public')));
// Middleware to use the routes
app.use('/api', storeRoutes);

app.get('/', (req, res) => {
    res.send('Search auto related app backend API!');
});


// File upload
// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Ensure this folder exists
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 1 MB file size limit
    fileFilter: function (req, file, cb) {
        const fileTypes = /xlsx|application\/vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet/;
        const mimeType = fileTypes.test(file.mimetype);
        const extName = fileTypes.test(path.extname(file.originalname).toLowerCase());

        if (mimeType && extName) {
            return cb(null, true);
        }
        cb(new Error('File type not supported'));
    }
});

// Endpoint to handle file upload
app.post('/files/upload', upload.single('file'), (req, res) => {
    try {
        const filePath = `/uploads/${req.file.filename}`;
        const fileUrl = `${req.protocol}://${req.get('host')}${filePath}`;
        res.status(200).send({
            message: 'File uploaded successfully',
            fileUrl: fileUrl
        });
    } catch (err) {
        res.status(400).send({
            message: 'Failed to upload file',
            error: err.message
        });
    }
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});