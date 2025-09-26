import axios from 'axios';

/**
 * Creates a blog post in Storyblok
 */
export async function createStoryblokBlogPost(blogData) {
  try {
    const SPACE_ID = process.env.NEXT_PUBLIC_STORYBLOK_SPACE_ID;
    const ACCESS_TOKEN = process.env.STORYBLOK_MANAGEMENT_TOKEN;
    
    if (!SPACE_ID || !ACCESS_TOKEN) {
      throw new Error('Missing Storyblok credentials');
    }
    
    console.log('Creating blog post in Storyblok...');
    
    // Generate slug from title if not provided
    const slug = blogData.slug || blogData.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .trim();
    
    // Prepare the story data structure for Storyblok
    const storyData = {
      story: {
        name: blogData.title,
        slug: slug,
        content: {
          component: 'BlogPost', // This should match your Storyblok component name
          title: blogData.title,
          introduction: blogData.introduction,
          sections: blogData.sections || [],
          conclusion: blogData.conclusion,
          meta_description: blogData.metaDescription,
          hero_image: blogData.heroImage || '',
          author: blogData.author || 'AI Blog Studio',
          published_date: blogData.publishedDate || new Date().toISOString(),
          tags: blogData.tags || [],
          // Add any custom fields your Storyblok component requires
          body: generateFullContent(blogData)
        },
        // Set to 'draft' initially
        published: false
      }
    };

    const response = await axios.post(`https://mapi.storyblok.com/v1/spaces/${SPACE_ID}/stories`, storyData, {
      headers: {
        'Authorization': ACCESS_TOKEN,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Blog post created in Storyblok successfully');
    return {
      success: true,
      story: response.data.story,
      storyId: response.data.story.id
    };
    
  } catch (error) {
    console.error('Error creating blog post in Storyblok:', error.response?.data || error.message);
    throw new Error(`Storyblok creation failed: ${error.response?.data?.error || error.message}`);
  }
}

/**
 * Publishes a blog post in Storyblok
 */
export async function publishStoryblokBlogPost(storyId) {
  try {
    console.log(`Publishing blog post ${storyId} in Storyblok...`);
    
    const response = await storyblokManagement.get(`/spaces/${SPACE_ID}/stories/${storyId}/publish`);
    
    console.log('Blog post published in Storyblok successfully');
    return {
      success: true,
      story: response.data.story
    };
    
  } catch (error) {
    console.error('Error publishing blog post in Storyblok:', error.response?.data || error.message);
    throw new Error(`Storyblok publishing failed: ${error.response?.data?.error || error.message}`);
  }
}

/**
 * Uploads an image to Storyblok assets
 */
export async function uploadImageToStoryblok(imagePath, filename) {
  try {
    console.log('Uploading image to Storyblok assets...');
    
    const fs = await import('fs');
    const FormData = require('form-data');
    
    // Check if the image file exists
    if (!fs.existsSync(imagePath)) {
      throw new Error(`Image file not found: ${imagePath}`);
    }
    
    const form = new FormData();
    form.append('file', fs.createReadStream(imagePath));
    form.append('filename', filename);
    
    const response = await axios.post(
      `https://mapi.storyblok.com/v1/spaces/${SPACE_ID}/assets`,
      form,
      {
        headers: {
          ...form.getHeaders(),
          'Authorization': ACCESS_TOKEN,
        }
      }
    );
    
    console.log('Image uploaded to Storyblok successfully');
    return {
      success: true,
      asset: response.data,
      url: response.data.pretty_url
    };
    
  } catch (error) {
    console.error('Error uploading image to Storyblok:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error || error.message
    };
  }
}

/**
 * Gets all blog posts from Storyblok
 */
export async function getStoryblokBlogPosts() {
  try {
    console.log('Fetching blog posts from Storyblok...');
    
    const response = await storyblokManagement.get(`/spaces/${SPACE_ID}/stories`, {
      params: {
        per_page: 100,
        starts_with: 'blog/', // Adjust this path based on your folder structure
        sort_by: 'created_at:desc'
      }
    });
    
    return {
      success: true,
      stories: response.data.stories
    };
    
  } catch (error) {
    console.error('Error fetching blog posts from Storyblok:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error || error.message
    };
  }
}

/**
 * Deletes a blog post from Storyblok
 */
export async function deleteStoryblokBlogPost(storyId) {
  try {
    console.log(`Deleting blog post ${storyId} from Storyblok...`);
    
    const response = await storyblokManagement.delete(`/spaces/${SPACE_ID}/stories/${storyId}`);
    
    console.log('Blog post deleted from Storyblok successfully');
    return {
      success: true,
      story: response.data.story
    };
    
  } catch (error) {
    console.error('Error deleting blog post from Storyblok:', error.response?.data || error.message);
    throw new Error(`Storyblok deletion failed: ${error.response?.data?.error || error.message}`);
  }
}

/**
 * Generates full content from blog sections for Storyblok
 */
function generateFullContent(blogData) {
  let fullContent = blogData.introduction + '\n\n';
  
  if (blogData.sections && blogData.sections.length > 0) {
    blogData.sections.forEach(section => {
      fullContent += `## ${section.heading}\n\n${section.content}\n\n`;
    });
  }
  
  fullContent += blogData.conclusion;
  
  return fullContent;
}