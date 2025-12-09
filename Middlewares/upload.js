const multer = require('multer');
const path = require('path');
const { sendError } = require('../utils/response');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const type = req.baseUrl.includes('lab') ? 'lab' : 'radiology';
    cb(null, `uploads/${type}/`);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|pdf|dicom|dcm/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype) || file.mimetype === 'application/dicom';

  if (extname && mimetype) {
    return cb(null, true);
  }
  cb(new Error('Invalid file type. Only images, PDFs, and DICOM files are allowed.'));
};

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter
});

exports.uploadSingle = upload.single('file');
exports.uploadMultiple = upload.array('files', 10);

exports.handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return sendError(res, 400, 'File too large. Maximum size is 50MB.');
    }
    return sendError(res, 400, err.message);
  }
  if (err) {
    return sendError(res, 400, err.message);
  }
  next();
};
