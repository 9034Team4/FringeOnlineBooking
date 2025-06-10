import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../../../public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置存储
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // 生成唯一文件名
    const uniqueSuffix = uuidv4();
    const extension = path.extname(file.originalname);
    cb(null, `event-${uniqueSuffix}${extension}`);
  }
});

// 文件过滤器
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // 只接受图片文件
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'));
  }
};

// 创建 multer 实例
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 限制文件大小为 5MB
  }
}).single('image'); // 'image' 是表单字段名

export const UploadController = {
  /**
   * 上传图片
   */
  async uploadImage(req: Request, res: Response) {
    upload(req, res, function (err) {
      if (err instanceof multer.MulterError) {
        // Multer 错误
        return res.status(400).json({
          success: false,
          message: 'File upload error',
          error: err.message
        });
      } else if (err) {
        // 其他错误
        return res.status(500).json({
          success: false,
          message: 'Unknown error',
          error: err.message
        });
      }
      
      // 文件上传成功
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded',
          error: 'Please select a file to upload'
        });
      }
      
      // 生成文件的公共URL
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? 'http://3.25.85.247:3000'
        : 'http://3.25.85.247:3000';
      
      const fileUrl = `${baseUrl}/public/uploads/${req.file.filename}`;
      
      return res.status(200).json({
        success: true,
        message: 'File uploaded successfully',
        data: {
          imageUrl: fileUrl,
          filename: req.file.filename,
          size: req.file.size
        }
      });
    });
  }
}; 