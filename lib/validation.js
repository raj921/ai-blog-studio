/**
 * Input validation and sanitization utilities
 */

/**
 * Sanitizes text input by removing potentially harmful characters
 */
export function sanitizeText(text, maxLength = 5000) {
  if (typeof text !== 'string') {
    return '';
  }
  
  // Remove control characters and limit length
  let sanitized = text
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control chars
    .trim()
    .slice(0, maxLength);
  
  return sanitized;
}

/**
 * Validates and sanitizes blog post input data
 */
export function validateBlogInput({ title, topic, keywords, wordCount, tone }) {
  const errors = [];
  
  // Validate title
  if (!title || typeof title !== 'string') {
    errors.push('Title is required');
  } else if (title.trim().length < 3) {
    errors.push('Title must be at least 3 characters');
  } else if (title.trim().length > 200) {
    errors.push('Title must be less than 200 characters');
  }
  
  // Validate topic
  if (!topic || typeof topic !== 'string') {
    errors.push('Topic is required');
  } else if (topic.trim().length < 10) {
    errors.push('Topic must be at least 10 characters');
  } else if (topic.trim().length > 5000) {
    errors.push('Topic must be less than 5000 characters');
  }
  
  // Validate keywords
  let sanitizedKeywords = [];
  if (keywords) {
    if (Array.isArray(keywords)) {
      sanitizedKeywords = keywords
        .map(k => sanitizeText(k, 100))
        .filter(k => k.length > 0)
        .slice(0, 20); // Max 20 keywords
    } else if (typeof keywords === 'string') {
      sanitizedKeywords = keywords
        .split(',')
        .map(k => sanitizeText(k, 100))
        .filter(k => k.length > 0)
        .slice(0, 20);
    }
  }
  
  // Validate word count
  let sanitizedWordCount = 800;
  if (wordCount) {
    const count = parseInt(wordCount);
    if (isNaN(count) || count < 100 || count > 5000) {
      errors.push('Word count must be between 100 and 5000');
    } else {
      sanitizedWordCount = count;
    }
  }
  
  // Validate tone
  const validTones = ['professional', 'casual', 'friendly', 'authoritative', 'humorous'];
  let sanitizedTone = 'professional';
  if (tone && typeof tone === 'string') {
    if (!validTones.includes(tone.toLowerCase())) {
      errors.push(`Tone must be one of: ${validTones.join(', ')}`);
    } else {
      sanitizedTone = tone.toLowerCase();
    }
  }
  
  if (errors.length > 0) {
    return { valid: false, errors };
  }
  
  return {
    valid: true,
    data: {
      title: sanitizeText(title, 200),
      topic: sanitizeText(topic, 5000),
      keywords: sanitizedKeywords,
      wordCount: sanitizedWordCount,
      tone: sanitizedTone
    }
  };
}

/**
 * Validates image prompt
 */
export function validateImagePrompt(prompt, title) {
  const errors = [];
  
  if (!prompt || typeof prompt !== 'string') {
    errors.push('Image prompt is required');
  } else if (prompt.trim().length < 10) {
    errors.push('Image prompt must be at least 10 characters');
  } else if (prompt.trim().length > 2000) {
    errors.push('Image prompt must be less than 2000 characters');
  }
  
  if (errors.length > 0) {
    return { valid: false, errors };
  }
  
  return {
    valid: true,
    data: {
      prompt: sanitizeText(prompt, 2000),
      title: sanitizeText(title || '', 200)
    }
  };
}

/**
 * Validates Storyblok story ID
 */
export function validateStoryId(storyId) {
  if (!storyId) {
    return { valid: false, errors: ['Story ID is required'] };
  }
  
  // Story ID should be numeric or UUID format
  const isNumeric = /^\d+$/.test(storyId);
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(storyId);
  
  if (!isNumeric && !isUUID) {
    return { valid: false, errors: ['Invalid story ID format'] };
  }
  
  return { valid: true, data: storyId };
}
