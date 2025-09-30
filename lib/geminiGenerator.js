import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

/**
 * Generates a structured blog post using Google Gemini AI
 */
export async function generateBlogPost({
  title,
  topic,
  keywords = [],
  wordCount = 800,
  tone = 'professional'
}) {
  try {
    const timestamp = Date.now();
    const scriptPath = `/tmp/blog_gen_gemini_${timestamp}.py`;
    
    // Escape quotes in strings for Python
    const escapeForPython = (str) => str.replace(/"/g, '\\"').replace(/\n/g, '\\n');
    
    // Build the Python script for Gemini
    const pythonScript = `
import json
import os
import sys

try:
    import google.generativeai as genai
    
    # Get API key from environment
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("No GEMINI_API_KEY found in environment variables")
    
    # Configure Gemini
    genai.configure(api_key=api_key)
    
    # Create the model - using gemini-2.0-flash-exp for best performance
    model = genai.GenerativeModel('gemini-2.0-flash-exp')
    
    # Create a structured prompt
    prompt = """Create a well-structured blog post with the following details:

Title: "${escapeForPython(title)}"
Main Topic: ${escapeForPython(topic)}
Keywords to include: ${keywords.join(', ')}
Approximate word count: ${wordCount} words
Tone: ${tone}

Please structure the blog post with the following sections:
1. Introduction (compelling hook and overview)
2. 3-4 Main sections with descriptive subheadings
3. Conclusion (key takeaways and call-to-action)

Format the response as a JSON object with this exact structure:
{
  "title": "The final optimized title",
  "introduction": "Engaging introduction text...",
  "sections": [
    {
      "heading": "Section 1 Heading",
      "content": "Section 1 content..."
    },
    {
      "heading": "Section 2 Heading",
      "content": "Section 2 content..."
    }
  ],
  "conclusion": "Strong conclusion text...",
  "metaDescription": "A 150-160 character SEO meta description",
  "imagePrompt": "A detailed prompt for generating a hero image for this blog post"
}

Make sure the content is engaging, informative, and optimized for SEO without keyword stuffing.
Each section should be substantial (150-250 words) and provide real value.
Include the imagePrompt field with a detailed description for creating a relevant hero image.
Only return the JSON object, nothing else."""
    
    # Generate content
    response = model.generate_content(prompt)
    response_text = response.text
    
    # Extract JSON from response (handle markdown code blocks)
    if "\`\`\`json" in response_text:
        json_text = response_text.split("\`\`\`json")[1].split("\`\`\`")[0].strip()
    elif "\`\`\`" in response_text:
        # Try to find JSON between any code blocks
        parts = response_text.split("\`\`\`")
        for part in parts:
            part = part.strip()
            if part.startswith('json'):
                json_text = part[4:].strip()
                break
            elif part.startswith('{'):
                json_text = part
                break
        else:
            json_text = response_text
    else:
        json_text = response_text.strip()
    
    # Parse and output
    blog_content = json.loads(json_text)
    
    # Validate required fields
    required_fields = ["title", "introduction", "sections", "conclusion", "metaDescription"]
    for field in required_fields:
        if field not in blog_content:
            raise ValueError(f"Missing required field: {field}")
    
    print(json.dumps(blog_content))
    
except Exception as e:
    # Fallback content on error
    error_content = {
        "error": str(e),
        "title": "${escapeForPython(title)}",
        "introduction": "We apologize, but we encountered an issue generating the full content. Please try again.",
        "sections": [
            {
                "heading": "Content Generation Issue",
                "content": "The AI content generation encountered an error. Please try again in a few moments."
            }
        ],
        "conclusion": "Thank you for your patience. Please try generating this content again.",
        "metaDescription": "Information about ${escapeForPython(topic)}",
        "imagePrompt": "Abstract professional image related to ${escapeForPython(topic)}"
    }
    print(json.dumps(error_content))
`;
    
    // Write the script
    const fs = await import('fs');
    fs.writeFileSync(scriptPath, pythonScript);
    
    // Execute with Python from venv
    const env = {
      ...process.env,
      GEMINI_API_KEY: process.env.GEMINI_API_KEY
    };
    
    const pythonPath = process.env.PYTHON_PATH || 'python3';
    
    console.log('Generating blog post with Google Gemini AI (gemini-2.0-flash-exp)...');
    const { stdout, stderr } = await execPromise(`${pythonPath} ${scriptPath}`, { env, cwd: process.cwd() });
    
    // Clean up
    fs.unlinkSync(scriptPath);
    
    if (stderr && !stderr.includes('WARNING')) {
      console.error('Blog generation error:', stderr);
      throw new Error(`Blog generation failed: ${stderr}`);
    }
    
    const blogContent = JSON.parse(stdout);
    
    if (blogContent.error) {
      console.log('Blog generation completed with fallback content:', blogContent.error);
    } else {
      console.log('Blog post generated successfully with Google Gemini AI');
    }
    
    return blogContent;
    
  } catch (error) {
    console.error('Blog generation error:', error);
    
    // Return fallback content
    return {
      title: title,
      introduction: `This is a comprehensive guide to ${topic}. In this article, we'll explore the key concepts, best practices, and actionable insights to help you understand and implement effective strategies.`,
      sections: [
        {
          heading: "Understanding the Fundamentals",
          content: `When it comes to ${topic}, it's essential to start with a solid foundation. The key principles involve understanding the core concepts and how they apply to real-world scenarios. This foundational knowledge will serve as the building blocks for more advanced techniques.`
        },
        {
          heading: "Best Practices and Implementation",
          content: `Successful implementation of ${topic} requires following proven best practices. These time-tested approaches have been refined through experience and research, providing a reliable framework for achieving optimal results.`
        },
        {
          heading: "Advanced Techniques",
          content: `Once you've mastered the basics, you can explore more advanced techniques that will set you apart. These sophisticated approaches require a deeper understanding but offer significant advantages for those willing to invest the time.`
        }
      ],
      conclusion: `In conclusion, ${topic} offers numerous opportunities for growth and success. By understanding the fundamentals, implementing best practices, and exploring advanced techniques, you'll be well-equipped to achieve your goals.`,
      metaDescription: `Comprehensive guide to ${topic}. Learn fundamentals, best practices, and advanced techniques.`,
      imagePrompt: `Professional, clean illustration representing ${topic}, modern design, business-focused, high quality, 16:9 aspect ratio`
    };
  }
}

/**
 * Generates a hero image using Google Imagen API (Gemini)
 * Creates AI-generated images from text prompts
 */
export async function generateHeroImage(imagePrompt, title = '') {
  try {
    const timestamp = Date.now();
    const scriptPath = `/tmp/image_imagen_${timestamp}.py`;
    const outputPath = `public/generated/image_${timestamp}.png`;
    
    // Ensure output directory exists
    const fs = await import('fs');
    const path = await import('path');
    const outputDir = path.join(process.cwd(), 'public', 'generated');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Create Python script using Google Imagen API
    const pythonScript = `
from google import genai
from google.genai import types
import os
import base64

try:
    # Initialize Gemini client
    client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
    
    # Image prompt from blog content
    prompt = """${imagePrompt.replace(/"/g, '\\"')}"""
    
    # Generate image using Imagen 3
    response = client.models.generate_images(
        model='imagen-3.0-generate-001',
        prompt=prompt,
        config=types.GenerateImagesConfig(
            number_of_images=1,
            aspect_ratio="16:9",
        )
    )
    
    # Get first generated image
    generated_image = response.generated_images[0]
    image_bytes = generated_image.image.image_bytes
    
    # Save image
    output_path = "${path.join(process.cwd(), outputPath).replace(/\\/g, '/')}"
    with open(output_path, 'wb') as f:
        f.write(image_bytes)
    
    print("SUCCESS: Image generated and saved")
    
except Exception as e:
    print(f"ERROR: {str(e)}")
`;
    
    fs.writeFileSync(scriptPath, pythonScript);
    
    const env = {
      ...process.env,
      GEMINI_API_KEY: process.env.GEMINI_API_KEY
    };
    const pythonPath = process.env.PYTHON_PATH || 'python3';
    
    console.log('Generating hero image with Google Imagen...');
    const { stdout, stderr } = await execPromise(`${pythonPath} ${scriptPath}`, { 
      env, 
      cwd: process.cwd(),
      timeout: 30000  // Imagen takes longer than Unsplash
    });
    
    fs.unlinkSync(scriptPath);
    
    if (stdout.includes('SUCCESS')) {
      const imageUrl = `/generated/image_${timestamp}.png`;
      console.log('Hero image generated successfully with Google Imagen');
      
      return {
        success: true,
        imageUrl: imageUrl,
        source: 'Google Imagen 3'
      };
    } else {
      console.error('Image generation failed:', stderr || stdout);
      return {
        success: false,
        error: stderr || stdout || 'Unknown error'
      };
    }
    
  } catch (error) {
    console.error('Image generation error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
