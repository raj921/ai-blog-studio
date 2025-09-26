import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

/**
 * Generates a structured blog post using GPT-5
 */
export async function generateBlogPost({
  title,
  topic,
  keywords = [],
  wordCount = 800,
  tone = 'professional'
}) {
  try {
    // Create a temporary Python script for GPT-5 generation
    const timestamp = Date.now();
    const scriptPath = `/tmp/blog_gen_${timestamp}.py`;
    
    const pythonScript = `
import asyncio
import json
import os
import sys

# Add current directory to path to import emergentintegrations
sys.path.append('.')

async def generate_blog():
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        # Get API key from environment variables
        api_key = os.getenv("EMERGENT_LLM_KEY")
        if not api_key:
            raise ValueError("No EMERGENT_LLM_KEY found in environment variables")
        
        # Initialize the LLM chat client
        chat = LlmChat(
            api_key=api_key,
            session_id=f"blog-{${timestamp}}",
            system_message="""You are a professional blog writer specializing in creating well-structured, engaging content. 
            You write in a ${tone} tone and create content that is SEO-friendly while remaining informative and valuable to readers."""
        ).with_model("openai", "gpt-5")
        
        # Create a structured prompt for the blog post
        prompt = f"""
        Create a well-structured blog post with the following details:
        
        Title: "${title}"
        Main Topic: ${topic}
        Keywords to include: ${keywords.join(', ')}
        Approximate word count: ${wordCount} words
        Tone: ${tone}
        
        Please structure the blog post with the following sections:
        1. Introduction (compelling hook and overview)
        2. 3-4 Main sections with descriptive subheadings
        3. Conclusion (key takeaways and call-to-action)
        
        Format the response as a JSON object with this exact structure:
        {{
          "title": "The final optimized title",
          "introduction": "Engaging introduction text...",
          "sections": [
            {{
              "heading": "Section 1 Heading",
              "content": "Section 1 content..."
            }},
            {{
              "heading": "Section 2 Heading", 
              "content": "Section 2 content..."
            }}
          ],
          "conclusion": "Strong conclusion text...",
          "metaDescription": "A 150-160 character SEO meta description",
          "imagePrompt": "A detailed prompt for generating a hero image for this blog post"
        }}
        
        Make sure the content is engaging, informative, and optimized for SEO without keyword stuffing.
        Each section should be substantial (150-250 words) and provide real value.
        Include the imagePrompt field with a detailed description for creating a relevant hero image.
        """
        
        # Send the message to the LLM
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        # Parse the JSON response
        try:
            # Extract JSON from the response if it's wrapped in markdown code blocks
            response_text = str(response)
            if "```json" in response_text:
                json_match = response_text.split("```json")[1].split("```")[0].strip()
            elif "```" in response_text and "{" in response_text:
                json_match = response_text.split("```")[1].strip()
            else:
                json_match = response_text
            
            blog_content = json.loads(json_match)
            
            # Validate the structure
            required_fields = ["title", "introduction", "sections", "conclusion", "metaDescription"]
            for field in required_fields:
                if field not in blog_content:
                    raise KeyError(f"Missing required field: {field}")
            
            print(json.dumps(blog_content))
            
        except (json.JSONDecodeError, KeyError) as parse_error:
            # Fallback: create structured content from raw response
            fallback_content = {
                "title": "${title}",
                "introduction": f"Generated content for ${topic}. " + str(response)[:200] + "...",
                "sections": [
                    {
                        "heading": "Main Content", 
                        "content": str(response)[:500] + "..."
                    }
                ],
                "conclusion": "This concludes our discussion on the topic.",
                "metaDescription": f"Learn about {topic} in this comprehensive guide.",
                "imagePrompt": f"Professional illustration related to {topic}"
            }
            print(json.dumps(fallback_content))
            
    except Exception as e:
        error_response = {
            "error": str(e),
            "title": "${title}",
            "introduction": f"We apologize, but we're currently unable to generate the full content for '${topic}'. Please try again later.",
            "sections": [
                {
                    "heading": "Content Unavailable",
                    "content": "The AI content generation service is temporarily unavailable. Please try again in a few moments."
                }
            ],
            "conclusion": "Thank you for your patience. Please try generating this content again.",
            "metaDescription": f"Information about {topic}",
            "imagePrompt": f"Abstract professional image related to {topic}"
        }
        print(json.dumps(error_response))

# Run the async function
asyncio.run(generate_blog())
`;
    
    // Write the script to a temporary file
    const fs = await import('fs');
    fs.writeFileSync(scriptPath, pythonScript);
    
    // Set environment variables and execute the Python script
    const env = {
      ...process.env,
      EMERGENT_LLM_KEY: process.env.EMERGENT_LLM_KEY
    };
    
    console.log('Generating blog post with GPT-5...');
    const { stdout, stderr } = await execPromise(`cd /app && python3 ${scriptPath}`, { env });
    
    // Clean up the temporary script
    fs.unlinkSync(scriptPath);
    
    if (stderr && !stderr.includes('WARNING')) {
      console.error('Blog generation error:', stderr);
      throw new Error(`Blog generation failed: ${stderr}`);
    }
    
    // Parse the JSON response
    const blogContent = JSON.parse(stdout);
    
    if (blogContent.error) {
      console.log('Blog generation completed with fallback content');
    } else {
      console.log('Blog post generated successfully');
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
          content: `When it comes to ${topic}, it's essential to start with a solid foundation. The key principles involve understanding the core concepts and how they apply to real-world scenarios. This foundational knowledge will serve as the building blocks for more advanced techniques and strategies.`
        },
        {
          heading: "Best Practices and Implementation",
          content: `Successful implementation of ${topic} requires following proven best practices. These time-tested approaches have been refined through experience and research, providing a reliable framework for achieving optimal results. Consider these strategies as your roadmap to success.`
        },
        {
          heading: "Advanced Techniques and Tips",
          content: `Once you've mastered the basics, you can explore more advanced techniques that will set you apart. These sophisticated approaches require a deeper understanding but offer significant advantages for those willing to invest the time and effort to master them.`
        }
      ],
      conclusion: `In conclusion, ${topic} is a multifaceted subject that offers numerous opportunities for growth and success. By understanding the fundamentals, implementing best practices, and exploring advanced techniques, you'll be well-equipped to achieve your goals. Remember to stay updated with the latest trends and continue learning to maintain your competitive edge.`,
      metaDescription: `Comprehensive guide to ${topic}. Learn fundamentals, best practices, and advanced techniques to master this important subject.`,
      imagePrompt: `Professional, clean illustration representing ${topic}, modern design, business-focused, high quality`
    };
  }
}

/**
 * Generates a hero image for the blog post
 */
export async function generateHeroImage(imagePrompt, title = '') {
  try {
    const timestamp = Date.now();
    const scriptPath = `/tmp/image_gen_${timestamp}.py`;
    const outputPath = `/app/public/generated/image_${timestamp}.png`;
    
    // Ensure the output directory exists
    const fs = await import('fs');
    const path = await import('path');
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const pythonScript = `
import asyncio
import os
import sys

async def generate_image():
    try:
        from emergentintegrations.llm.openai.image_generation import OpenAIImageGeneration
        
        # Get API key from environment variables
        api_key = os.getenv("EMERGENT_LLM_KEY")
        if not api_key:
            raise ValueError("No EMERGENT_LLM_KEY found in environment variables")
        
        # Initialize the image generator
        image_gen = OpenAIImageGeneration(api_key=api_key)
        
        # Enhanced prompt for better results
        enhanced_prompt = "${imagePrompt}. Professional blog header image, clean composition, modern style, high quality, 16:9 aspect ratio"
        
        # Generate image
        images = await image_gen.generate_images(
            prompt=enhanced_prompt,
            model="gpt-image-1",
            number_of_images=1
        )
        
        # Save the image
        if images and len(images) > 0:
            with open("${outputPath.replace(/\\/g, '/')}", "wb") as f:
                f.write(images[0])
            print("SUCCESS: Image generated and saved")
        else:
            print("ERROR: No image was generated")
            
    except Exception as e:
        print(f"ERROR: {str(e)}")

# Run the async function
asyncio.run(generate_image())
`;
    
    // Write the script to a temporary file
    fs.writeFileSync(scriptPath, pythonScript);
    
    // Set environment variables and execute the Python script
    const env = {
      ...process.env,
      EMERGENT_LLM_KEY: process.env.EMERGENT_LLM_KEY
    };
    
    console.log('Generating hero image...');
    const { stdout, stderr } = await execPromise(`cd /app && python3 ${scriptPath}`, { env });
    
    // Clean up the temporary script
    fs.unlinkSync(scriptPath);
    
    if (stdout.includes('SUCCESS')) {
      const imageUrl = `/generated/image_${timestamp}.png`;
      console.log('Hero image generated successfully');
      return { success: true, imageUrl };
    } else {
      console.error('Image generation failed:', stderr || stdout);
      return { success: false, error: stderr || stdout || 'Unknown error' };
    }
    
  } catch (error) {
    console.error('Image generation error:', error);
    return { success: false, error: error.message };
  }
}