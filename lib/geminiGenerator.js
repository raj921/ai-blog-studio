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
 * Generates a hero image - placeholder for now
 * Note: Google Gemini doesn't include image generation
 * You can integrate Google's Imagen API separately if needed
 */
export async function generateHeroImage(imagePrompt, title = '') {
  try {
    console.log('Image generation skipped (Gemini does not support image generation)');
    console.log('To add images, integrate Google Imagen API or another service');
    
    return {
      success: false,
      error: 'Image generation not available with Gemini. Integrate Imagen API for images.'
    };
  } catch (error) {
    console.error('Image generation error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
