import { NextResponse } from 'next/server';
import { generateBlogPost, generateHeroImage } from '../../../lib/geminiGenerator';
import { createStoryblokBlogPost, publishStoryblokBlogPost, uploadImageToStoryblok, getStoryblokBlogPosts, deleteStoryblokBlogPost } from '../../../lib/storyblok';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { validateBlogInput, validateImagePrompt, validateStoryId } from '../../../lib/validation';
import { logger, getUserFriendlyError } from '../../../lib/logger';

// In-memory storage for job status (in production, use Redis or database)
const jobStore = new Map();

// Cleanup old jobs (older than 1 hour)
const JOB_EXPIRY_TIME = 60 * 60 * 1000; // 1 hour in milliseconds

function cleanupOldJobs() {
  const now = Date.now();
  for (const [jobId, job] of jobStore.entries()) {
    const jobTime = new Date(job.startTime).getTime();
    if (now - jobTime > JOB_EXPIRY_TIME) {
      jobStore.delete(jobId);
    }
  }
}

// Run cleanup every 10 minutes
setInterval(cleanupOldJobs, 10 * 60 * 1000);

// Helper function to extract path segments
function getPathSegments(request) {
  const url = new URL(request.url);
  const pathSegments = url.pathname.split('/').filter(segment => segment && segment !== 'api');
  return pathSegments;
}

export async function GET(request) {
  try {
    const pathSegments = getPathSegments(request);
    const endpoint = pathSegments[0];

    switch (endpoint) {
      case 'health':
        return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() });
        
      case 'blog-posts':
        // Get all blog posts from Storyblok
        const posts = await getStoryblokBlogPosts();
        return NextResponse.json(posts);
        
      case 'job-status':
        const jobId = pathSegments[1];
        if (!jobId) {
          return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
        }
        const job = jobStore.get(jobId);
        if (!job) {
          return NextResponse.json({ error: 'Job not found' }, { status: 404 });
        }
        return NextResponse.json(job);
        
      case 'test':
        return NextResponse.json({ 
          message: 'AI Blog Studio API is working!',
          integrations: {
            geminiAI: process.env.GEMINI_API_KEY ? 'Available' : 'Missing',
            imageGeneration: 'Not Available (Gemini does not support image generation)', 
            storyblok: 'Available'
          },
          environment: {
            GEMINI_API_KEY: process.env.GEMINI_API_KEY ? 'Present' : 'Missing',
            NEXT_PUBLIC_STORYBLOK_SPACE_ID: process.env.NEXT_PUBLIC_STORYBLOK_SPACE_ID || 'Missing',
            STORYBLOK_MANAGEMENT_TOKEN: process.env.STORYBLOK_MANAGEMENT_TOKEN ? 'Present' : 'Missing',
            PYTHON_PATH: process.env.PYTHON_PATH || 'python3 (default)'
          }
        });
        
      default:
        return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });
    }
  } catch (error) {
    logger.error('GET API Error', error);
    return NextResponse.json({ 
      error: getUserFriendlyError(error),
      technicalError: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const pathSegments = getPathSegments(request);
    const endpoint = pathSegments[0];
    const body = await request.json();

    switch (endpoint) {
      case 'generate-blog':
        return await handleGenerateBlog(body);
        
      case 'generate-image': 
        return await handleGenerateImage(body);
        
      case 'publish-to-storyblok':
        return await handlePublishToStoryblok(body);
        
      case 'generate-complete':
        return await handleGenerateCompleteAsync(body);
        
      case 'publish':
        const storyId = pathSegments[1];
        const storyValidation = validateStoryId(storyId);
        if (!storyValidation.valid) {
          return NextResponse.json({ error: storyValidation.errors[0] }, { status: 400 });
        }
        return await handlePublishStory(storyValidation.data);
        
      default:
        return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });
    }
  } catch (error) {
    logger.error('POST API Error', error);
    return NextResponse.json({ 
      error: getUserFriendlyError(error),
      technicalError: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const pathSegments = getPathSegments(request);
    const endpoint = pathSegments[0];
    const storyId = pathSegments[1];

    if (endpoint === 'blog-posts' && storyId) {
      const storyValidation = validateStoryId(storyId);
      if (!storyValidation.valid) {
        return NextResponse.json({ error: storyValidation.errors[0] }, { status: 400 });
      }
      const result = await deleteStoryblokBlogPost(storyValidation.data);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Invalid endpoint' }, { status: 404 });
  } catch (error) {
    logger.error('DELETE API Error', error);
    return NextResponse.json({ 
      error: getUserFriendlyError(error),
      technicalError: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

// Handler functions
async function handleGenerateBlog(body) {
  // Validate and sanitize input
  const validation = validateBlogInput(body);
  if (!validation.valid) {
    return NextResponse.json({ 
      error: 'Invalid input',
      details: validation.errors 
    }, { status: 400 });
  }
  
  const { title, topic, keywords, wordCount, tone } = validation.data;

  try {
    const blogContent = await generateBlogPost({
      title,
      topic,
      keywords: keywords || [],
      wordCount: wordCount || 800,
      tone: tone || 'professional'
    });

    return NextResponse.json({ 
      success: true, 
      data: blogContent,
      id: uuidv4()
    });
  } catch (error) {
    return NextResponse.json({ 
      error: `Blog generation failed: ${error.message}` 
    }, { status: 500 });
  }
}

async function handleGenerateImage(body) {
  // Validate and sanitize input
  const validation = validateImagePrompt(body.prompt, body.title);
  if (!validation.valid) {
    return NextResponse.json({ 
      error: 'Invalid input',
      details: validation.errors 
    }, { status: 400 });
  }
  
  const { prompt, title } = validation.data;

  try {
    const result = await generateHeroImage(prompt, title);
    
    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        imageUrl: result.imageUrl 
      });
    } else {
      return NextResponse.json({ 
        error: `Image generation failed: ${result.error}` 
      }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ 
      error: `Image generation failed: ${error.message}` 
    }, { status: 500 });
  }
}

async function handlePublishToStoryblok(body) {
  const { blogData, imageUrl } = body;
  
  if (!blogData || !blogData.title) {
    return NextResponse.json({ 
      error: 'Blog data with title is required' 
    }, { status: 400 });
  }

  try {
    let storyblokImageUrl = '';
    
    // Upload image to Storyblok if provided
    if (imageUrl) {
      const imagePath = path.join('public', imageUrl.replace(/^\//, ''));
      const filename = `blog-hero-${Date.now()}.png`;
      
      const uploadResult = await uploadImageToStoryblok(imagePath, filename);
      if (uploadResult.success) {
        storyblokImageUrl = uploadResult.url;
      }
    }
    
    // Create the blog post in Storyblok
    const storyData = {
      ...blogData,
      heroImage: storyblokImageUrl
    };
    
    const createResult = await createStoryblokBlogPost(storyData);
    
    if (createResult.success) {
      return NextResponse.json({ 
        success: true, 
        storyId: createResult.storyId,
        story: createResult.story,
        message: 'Blog post created in Storyblok successfully'
      });
    } else {
      return NextResponse.json({ 
        error: 'Failed to create blog post in Storyblok' 
      }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ 
      error: `Storyblok publishing failed: ${error.message}` 
    }, { status: 500 });
  }
}

async function handleGenerateCompleteAsync(body) {
  // Validate and sanitize input
  const validation = validateBlogInput(body);
  if (!validation.valid) {
    return NextResponse.json({ 
      error: 'Invalid input',
      details: validation.errors 
    }, { status: 400 });
  }

  // Create a job ID and return it immediately
  const jobId = uuidv4();
  
  // Initialize job status
  jobStore.set(jobId, {
    id: jobId,
    status: 'started',
    progress: 0,
    step: 'Initializing blog generation...',
    startTime: new Date().toISOString()
  });

  // Start the async process (don't await it)
  processCompleteGeneration(jobId, validation.data);

  // Return job ID immediately
  return NextResponse.json({
    success: true,
    jobId: jobId,
    message: 'Blog generation started'
  });
}

async function processCompleteGeneration(jobId, formData) {
  const { title, topic, keywords, wordCount, tone } = formData;
  let blogContent = null;
  let imageUrl = '';
  let storyblokResult = null;
  const errors = [];
  
  try {
    // Update progress: Step 1
    jobStore.set(jobId, {
      ...jobStore.get(jobId),
      status: 'processing',
      progress: 20,
      step: 'Generating blog content with GPT-5...'
    });

    try {
      blogContent = await generateBlogPost({
        title,
        topic,
        keywords: keywords || [],
        wordCount: wordCount || 800,
        tone: tone || 'professional'
      });
    } catch (blogError) {
      errors.push({ step: 'blog_generation', error: blogError.message });
      throw new Error('Blog generation failed: ' + blogError.message);
    }

    // Update progress: Step 2
    jobStore.set(jobId, {
      ...jobStore.get(jobId),
      progress: 50,
      step: 'Creating hero image...'
    });

    if (blogContent.imagePrompt) {
      try {
        const imageResult = await generateHeroImage(blogContent.imagePrompt, blogContent.title);
        if (imageResult.success) {
          imageUrl = imageResult.imageUrl;
        } else {
          errors.push({ step: 'image_generation', error: imageResult.error });
        }
      } catch (imageError) {
        errors.push({ step: 'image_generation', error: imageError.message });
        // Continue without image - not critical
      }
    }

    // Update progress: Step 3
    jobStore.set(jobId, {
      ...jobStore.get(jobId),
      progress: 80,
      step: 'Publishing to Storyblok CMS...'
    });
    
    try {
      let storyblokImageUrl = '';
      
      if (imageUrl) {
        const imagePath = path.join('public', imageUrl.replace(/^\//, ''));
        const filename = `blog-hero-${Date.now()}.png`;
        
        try {
          const uploadResult = await uploadImageToStoryblok(imagePath, filename);
          if (uploadResult.success) {
            storyblokImageUrl = uploadResult.url;
          }
        } catch (uploadError) {
          errors.push({ step: 'image_upload', error: uploadError.message });
          // Continue with local image URL
        }
      }
      
      const storyData = {
        ...blogContent,
        heroImage: storyblokImageUrl
      };
      
      storyblokResult = await createStoryblokBlogPost(storyData);
    } catch (storyblokError) {
      errors.push({ step: 'storyblok_publish', error: storyblokError.message });
      storyblokResult = { 
        success: false, 
        error: 'Storyblok integration failed but content generated successfully' 
      };
    }

    // Complete the job with partial results if needed
    const hasContent = blogContent !== null;
    const status = hasContent ? 'completed' : 'failed';
    
    jobStore.set(jobId, {
      ...jobStore.get(jobId),
      status: status,
      progress: 100,
      step: hasContent ? 'Complete! Blog post ready.' : 'Failed to generate content',
      result: {
        blogContent,
        imageUrl,
        storyblokResult,
        errors: errors.length > 0 ? errors : undefined,
        partialSuccess: hasContent && errors.length > 0
      },
      completedTime: new Date().toISOString()
    });

  } catch (error) {
    // Mark job as failed with any partial results
    jobStore.set(jobId, {
      ...jobStore.get(jobId),
      status: 'failed',
      error: error.message,
      result: {
        blogContent,
        imageUrl,
        storyblokResult,
        errors: errors,
        partialSuccess: blogContent !== null
      },
      failedTime: new Date().toISOString()
    });
  }
}

async function handlePublishStory(storyId) {
  try {
    const result = await publishStoryblokBlogPost(storyId);
    
    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        story: result.story,
        message: 'Blog post published successfully'
      });
    } else {
      return NextResponse.json({ 
        error: 'Failed to publish blog post' 
      }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ 
      error: `Publishing failed: ${error.message}` 
    }, { status: 500 });
  }
}