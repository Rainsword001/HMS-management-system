import fs from 'fs/promises';
import path from 'path';
const logger = require('../config/logger');

exports.deleteFile = async (filePath) => {
  try {
    await fs.unlink(filePath);
    logger.info(`File deleted: ${filePath}`);
    return true;
  } catch (error) {
    logger.error(`Failed to delete file: ${error.message}`);
    return false;
  }
};

exports.ensureDirectoryExists = async (dirPath) => {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
    logger.info(`Directory created: ${dirPath}`);
  }
};

exports.getFilePath = (type, filename) => {
  return path.join(__dirname, '../../uploads', type, filename);
};

exports.moveFile = async (source, destination) => {
  try {
    await fs.rename(source, destination);
    return true;
  } catch (error) {
    logger.error(`Failed to move file: ${error.message}`);
    return false;
  }
};
