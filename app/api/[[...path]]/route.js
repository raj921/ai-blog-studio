import { NextResponse } from 'next/server';
import { generateBlogPost, generateHeroImage } from '../../../lib/blogGenerator';
import { createStoryblokBlogPost, publishStoryblokBlogPost, uploadImageToStoryblok, getStoryblokBlogPosts, deleteStoryblokBlogPost } from '../../../lib/storyblok';
import { v4 as uuidv4 } from 'uuid';

// In-memory storage for job status (in production, use Redis or database)
const jobStore = new Map();

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
            gpt5: 'Available',
            imageGeneration: 'Available', 
            storyblok: 'Available'
          },
          environment: {
            EMERGENT_LLM_KEY: process.env.EMERGENT_LLM_KEY ? 'Present' : 'Missing',
            NEXT_PUBLIC_STORYBLOK_SPACE_ID: process.env.NEXT_PUBLIC_STORYBLOK_SPACE_ID || 'Missing',
            STORYBLOK_MANAGEMENT_TOKEN: process.env.STORYBLOK_MANAGEMENT_TOKEN ? 'Present' : 'Missing'
          }
        });
        
      default:
        return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('GET API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
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
        if (!storyId) {
          return NextResponse.json({ error: 'Story ID is required' }, { status: 400 });
        }
        return await handlePublishStory(storyId);
        
      default:
        return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('POST API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const pathSegments = getPathSegments(request);
    const endpoint = pathSegments[0];
    const storyId = pathSegments[1];

    if (endpoint === 'blog-posts' && storyId) {
      const result = await deleteStoryblokBlogPost(storyId);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Invalid endpoint' }, { status: 404 });
  } catch (error) {
    console.error('DELETE API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Handler functions
async function handleGenerateBlog(body) {
  const { title, topic, keywords, wordCount, tone } = body;
  
  if (!title || !topic) {
    return NextResponse.json({ 
      error: 'Missing required fields: title and topic are required' 
    }, { status: 400 });
  }

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
  const { prompt, title } = body;
  
  if (!prompt) {
    return NextResponse.json({ 
      error: 'Image prompt is required' 
    }, { status: 400 });
  }

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
      const imagePath = `/app/public${imageUrl}`;
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
  const { title, topic, keywords, wordCount, tone } = body;
  
  if (!title || !topic) {
    return NextResponse.json({ 
      error: 'Missing required fields: title and topic are required' 
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
  processCompleteGeneration(jobId, { title, topic, keywords, wordCount, tone });

  // Return job ID immediately
  return NextResponse.json({
    success: true,
    jobId: jobId,
    message: 'Blog generation started'
  });
}

async function processCompleteGeneration(jobId, formData) {
  try {
    const { title, topic, keywords, wordCount, tone } = formData;
    
    // Update progress: Step 1
    jobStore.set(jobId, {
      ...jobStore.get(jobId),
      status: 'processing',
      progress: 20,
      step: 'Generating blog content with GPT-5...'
    });

    const blogContent = await generateBlogPost({
      title,
      topic,
      keywords: keywords || [],
      wordCount: wordCount || 800,
      tone: tone || 'professional'
    });

    // Update progress: Step 2
    jobStore.set(jobId, {
      ...jobStore.get(jobId),
      progress: 50,
      step: 'Creating hero image...'
    });

    let imageUrl = '';
    if (blogContent.imagePrompt) {
      const imageResult = await generateHeroImage(blogContent.imagePrompt, blogContent.title);
      if (imageResult.success) {
        imageUrl = imageResult.imageUrl;
      }
    }

    // Update progress: Step 3
    jobStore.set(jobId, {
      ...jobStore.get(jobId),
      progress: 80,
      step: 'Publishing to Storyblok CMS...'
    });

    let storyblokResult = null;
    
    try {
      let storyblokImageUrl = '';
      
      if (imageUrl) {
        const imagePath = `/app/public${imageUrl}`;
        const filename = `blog-hero-${Date.now()}.png`;
        
        const uploadResult = await uploadImageToStoryblok(imagePath, filename);
        if (uploadResult.success) {
          storyblokImageUrl = uploadResult.url;
        }
      }
      
      const storyData = {
        ...blogContent,
        heroImage: storyblokImageUrl
      };
      
      storyblokResult = await createStoryblokBlogPost(storyData);
    } catch (storyblokError) {
      console.warn('Storyblok creation failed:', storyblokError.message);
      storyblokResult = { success: false, error: 'Storyblok integration failed but content generated successfully' };
    }

    // Complete the job
    jobStore.set(jobId, {
      ...jobStore.get(jobId),
      status: 'completed',
      progress: 100,
      step: 'Complete! Blog post ready.',
      result: {
        blogContent,
        imageUrl,
        storyblokResult
      },
      completedTime: new Date().toISOString()
    });

  } catch (error) {
    // Mark job as failed
    jobStore.set(jobId, {
      ...jobStore.get(jobId),
      status: 'failed',
      error: error.message,
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