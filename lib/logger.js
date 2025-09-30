
/**
 * Centralized logging utility
 * Provides structured logging with different levels
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

const CURRENT_LEVEL = process.env.NODE_ENV === 'production' ? LOG_LEVELS.INFO : LOG_LEVELS.DEBUG;

function formatMessage(level, message, meta = {}) {
  const timestamp = new Date().toISOString();
  const metaStr = Object.keys(meta).length > 0 ? JSON.stringify(meta) : '';
  return `[${timestamp}] [${level}] ${message} ${metaStr}`;
}

export const logger = {
  debug(message, meta) {
    if (CURRENT_LEVEL <= LOG_LEVELS.DEBUG) {
      console.log(formatMessage('DEBUG', message, meta));
    }
  },
  
  info(message, meta) {
    if (CURRENT_LEVEL <= LOG_LEVELS.INFO) {
      console.log(formatMessage('INFO', message, meta));
    }
  },
  
  warn(message, meta) {
    if (CURRENT_LEVEL <= LOG_LEVELS.WARN) {
      console.warn(formatMessage('WARN', message, meta));
    }
  },
  
  error(message, error, meta) {
    if (CURRENT_LEVEL <= LOG_LEVELS.ERROR) {
      const errorMeta = {
        ...meta,
        error: error?.message || error,
        stack: error?.stack
      };
      console.error(formatMessage('ERROR', message, errorMeta));
    }
  }
};

/**
 * User-friendly error messages mapper
 */
export const ERROR_MESSAGES = {
  // Validation errors
  VALIDATION_FAILED: 'Please check your input and try again',
  INVALID_TITLE: 'Blog title is required and must be between 3-200 characters',
  INVALID_TOPIC: 'Topic description is required and must be at least 10 characters',
  INVALID_KEYWORDS: 'Keywords should be comma-separated and under 100 characters each',
  INVALID_WORD_COUNT: 'Word count must be between 100 and 5000',
  INVALID_TONE: 'Please select a valid tone from the dropdown',
  
  // Generation errors
  BLOG_GENERATION_FAILED: 'Unable to generate blog content. Please try again or contact support',
  IMAGE_GENERATION_FAILED: 'Unable to create hero image. Your blog content is ready, but without an image',
  
  // API/Network errors
  API_ERROR: 'Service temporarily unavailable. Please try again in a moment',
  NETWORK_ERROR: 'Connection error. Please check your internet connection',
  TIMEOUT_ERROR: 'Request timed out. The service might be busy, please try again',
  
  // Storyblok errors
  STORYBLOK_AUTH_ERROR: 'CMS authentication failed. Please check your Storyblok credentials',
  STORYBLOK_PUBLISH_ERROR: 'Unable to publish to CMS. Your content is saved locally',
  STORYBLOK_UPLOAD_ERROR: 'Unable to upload image to CMS. Using local image instead',
  
  // File errors
  FILE_NOT_FOUND: 'Required file not found. Please try generating again',
  FILE_TOO_LARGE: 'Generated file is too large. Please try with smaller content',
  PERMISSION_ERROR: 'Permission denied. Please check file system permissions',
  
  // Generic
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again or contact support'
};

/**
 * Maps technical errors to user-friendly messages
 */
export function getUserFriendlyError(error) {
  const errorMessage = error?.message || error;
  const errorString = String(errorMessage).toLowerCase();
  
  // Validation errors
  if (errorString.includes('invalid input') || errorString.includes('validation')) {
    return ERROR_MESSAGES.VALIDATION_FAILED;
  }
  
  // Generation errors
  if (errorString.includes('blog generation failed')) {
    return ERROR_MESSAGES.BLOG_GENERATION_FAILED;
  }
  if (errorString.includes('image generation') || errorString.includes('image file')) {
    return ERROR_MESSAGES.IMAGE_GENERATION_FAILED;
  }
  
  // Network/API errors
  if (errorString.includes('timeout') || errorString.includes('timed out')) {
    return ERROR_MESSAGES.TIMEOUT_ERROR;
  }
  if (errorString.includes('network') || errorString.includes('econnrefused')) {
    return ERROR_MESSAGES.NETWORK_ERROR;
  }
  if (errorString.includes('http') || errorString.includes('status')) {
    return ERROR_MESSAGES.API_ERROR;
  }
  
  // Storyblok errors
  if (errorString.includes('storyblok') && errorString.includes('auth')) {
    return ERROR_MESSAGES.STORYBLOK_AUTH_ERROR;
  }
  if (errorString.includes('storyblok') && errorString.includes('publish')) {
    return ERROR_MESSAGES.STORYBLOK_PUBLISH_ERROR;
  }
  if (errorString.includes('storyblok') && errorString.includes('upload')) {
    return ERROR_MESSAGES.STORYBLOK_UPLOAD_ERROR;
  }
  
  // File errors
  if (errorString.includes('not found') || errorString.includes('enoent')) {
    return ERROR_MESSAGES.FILE_NOT_FOUND;
  }
  if (errorString.includes('too large') || errorString.includes('size')) {
    return ERROR_MESSAGES.FILE_TOO_LARGE;
  }
  if (errorString.includes('permission') || errorString.includes('eacces')) {
    return ERROR_MESSAGES.PERMISSION_ERROR;
  }
  
  // Default
  return ERROR_MESSAGES.UNKNOWN_ERROR;
}
