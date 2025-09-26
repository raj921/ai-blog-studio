'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  PenTool, 
  Image, 
  Upload, 
  Wand2, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Copy,
  ExternalLink,
  Sparkles
} from 'lucide-react';

export default function AIBlogStudio() {
  const [formData, setFormData] = useState({
    title: '',
    topic: '',
    keywords: '',
    wordCount: 800,
    tone: 'professional'
  });
  
  const [activeTab, setActiveTab] = useState('generator');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [generatedContent, setGeneratedContent] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const generateCompleteBlog = async () => {
    if (!formData.title.trim() || !formData.topic.trim()) {
      setError('Title and topic are required');
      return;
    }

    setIsGenerating(true);
    setError('');
    setSuccess('');
    setProgress(0);
    setCurrentStep('Initializing AI Blog Studio...');

    try {
      // Simulate progress updates
      const steps = [
        { progress: 20, step: 'Generating blog content with GPT-5...' },
        { progress: 50, step: 'Creating hero image...' },
        { progress: 80, step: 'Publishing to Storyblok CMS...' },
        { progress: 100, step: 'Complete! Blog post ready.' }
      ];

      let stepIndex = 0;
      const progressInterval = setInterval(() => {
        if (stepIndex < steps.length) {
          setProgress(steps[stepIndex].progress);
          setCurrentStep(steps[stepIndex].step);
          stepIndex++;
        }
      }, 2000);

      const response = await fetch('/api/generate-complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          keywords: formData.keywords.split(',').map(k => k.trim()).filter(Boolean)
        }),
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate blog');
      }

      const result = await response.json();
      
      setGeneratedContent(result.data);
      setSuccess('Blog post generated and published successfully!');
      setActiveTab('preview');
      setProgress(100);
      setCurrentStep('Complete! Your blog post is ready.');

    } catch (err) {
      setError(err.message);
      setProgress(0);
      setCurrentStep('');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setSuccess('Content copied to clipboard!');
    } catch (err) {
      setError('Failed to copy to clipboard');
    }
  };

  const generateMarkdownContent = () => {
    if (!generatedContent?.blogContent) return '';
    
    const { blogContent } = generatedContent;
    let markdown = `# ${blogContent.title}\n\n`;
    
    if (generatedContent.imageUrl) {
      markdown += `![Hero Image](${process.env.NEXT_PUBLIC_BASE_URL}${generatedContent.imageUrl})\n\n`;
    }
    
    markdown += `## Introduction\n${blogContent.introduction}\n\n`;
    
    if (blogContent.sections) {
      blogContent.sections.forEach(section => {
        markdown += `## ${section.heading}\n${section.content}\n\n`;
      });
    }
    
    markdown += `## Conclusion\n${blogContent.conclusion}\n\n`;
    markdown += `**Meta Description:** ${blogContent.metaDescription}`;
    
    return markdown;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-8 w-8 text-blue-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AI Blog Studio
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Generate complete blog posts with AI-powered content, hero images, and automatic Storyblok CMS publishing
          </p>
        </div>

        {/* Status Messages */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* Main Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto">
            <TabsTrigger value="generator" className="flex items-center gap-2">
              <Wand2 className="h-4 w-4" />
              Generate
            </TabsTrigger>
            <TabsTrigger value="preview" disabled={!generatedContent}>
              <PenTool className="h-4 w-4" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="storyblok" disabled={!generatedContent?.storyblokResult?.success}>
              <Upload className="h-4 w-4" />
              Published
            </TabsTrigger>
          </TabsList>

          {/* Generation Tab */}
          <TabsContent value="generator">
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wand2 className="h-5 w-5 text-blue-600" />
                  Blog Post Generator
                </CardTitle>
                <CardDescription>
                  Enter your topic and let AI create a complete blog post with images
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="title">Blog Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder="Enter your blog post title..."
                      disabled={isGenerating}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="topic">Main Topic *</Label>
                    <Textarea
                      id="topic"
                      value={formData.topic}
                      onChange={(e) => handleInputChange('topic', e.target.value)}
                      placeholder="Describe what your blog post should cover..."
                      rows={3}
                      disabled={isGenerating}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="keywords">Keywords (comma-separated)</Label>
                    <Input
                      id="keywords"
                      value={formData.keywords}
                      onChange={(e) => handleInputChange('keywords', e.target.value)}
                      placeholder="SEO keywords, separated by commas"
                      disabled={isGenerating}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="wordCount">Word Count</Label>
                      <Select
                        value={formData.wordCount.toString()}
                        onValueChange={(value) => handleInputChange('wordCount', parseInt(value))}
                        disabled={isGenerating}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="500">500 words</SelectItem>
                          <SelectItem value="800">800 words</SelectItem>
                          <SelectItem value="1200">1200 words</SelectItem>
                          <SelectItem value="1500">1500 words</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="tone">Tone</Label>
                      <Select
                        value={formData.tone}
                        onValueChange={(value) => handleInputChange('tone', value)}
                        disabled={isGenerating}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="professional">Professional</SelectItem>
                          <SelectItem value="casual">Casual</SelectItem>
                          <SelectItem value="friendly">Friendly</SelectItem>
                          <SelectItem value="authoritative">Authoritative</SelectItem>
                          <SelectItem value="humorous">Humorous</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Progress Section */}
                {isGenerating && (
                  <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">{currentStep}</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <div className="text-xs text-blue-600">
                      This may take 1-2 minutes for AI processing...
                    </div>
                  </div>
                )}

                <Button 
                  onClick={generateCompleteBlog}
                  disabled={isGenerating || !formData.title.trim() || !formData.topic.trim()}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Complete Blog Post
                    </>
                  )}
                </Button>

                <div className="text-xs text-muted-foreground text-center">
                  This will generate content, create a hero image, and publish to Storyblok
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview">
            {generatedContent?.blogContent && (
              <div className="max-w-4xl mx-auto space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <PenTool className="h-5 w-5" />
                        Blog Preview
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(generateMarkdownContent())}
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Copy Markdown
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Hero Image */}
                    {generatedContent.imageUrl && (
                      <div className="mb-6">
                        <img
                          src={`${process.env.NEXT_PUBLIC_BASE_URL || ''}${generatedContent.imageUrl}`}
                          alt="Hero"
                          className="w-full h-64 object-cover rounded-lg border"
                        />
                      </div>
                    )}

                    {/* Blog Content */}
                    <div className="prose lg:prose-lg max-w-none">
                      <h1>{generatedContent.blogContent.title}</h1>
                      
                      <div className="mb-6">
                        <h2 className="text-xl font-semibold mb-3">Introduction</h2>
                        <div className="whitespace-pre-wrap">{generatedContent.blogContent.introduction}</div>
                      </div>

                      {generatedContent.blogContent.sections?.map((section, index) => (
                        <div key={index} className="mb-6">
                          <h2 className="text-xl font-semibold mb-3">{section.heading}</h2>
                          <div className="whitespace-pre-wrap">{section.content}</div>
                        </div>
                      ))}

                      <div className="mb-6">
                        <h2 className="text-xl font-semibold mb-3">Conclusion</h2>
                        <div className="whitespace-pre-wrap">{generatedContent.blogContent.conclusion}</div>
                      </div>

                      <Separator className="my-6" />

                      <div className="bg-slate-50 p-4 rounded-lg">
                        <h3 className="font-medium mb-2">SEO Meta Description</h3>
                        <p className="text-sm text-muted-foreground">{generatedContent.blogContent.metaDescription}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Generation Results Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>Generation Results</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <span>Content Generated</span>
                        <Badge variant="secondary">GPT-5</Badge>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {generatedContent.imageUrl ? (
                          <>
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                            <span>Image Created</span>
                            <Badge variant="secondary">AI Generated</Badge>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-5 w-5 text-yellow-600" />
                            <span>No Image</span>
                          </>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {generatedContent.storyblokResult?.success ? (
                          <>
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                            <span>Published to Storyblok</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-5 w-5 text-yellow-600" />
                            <span>Storyblok Failed</span>
                          </>
                        )}
                      </div>
                    </div>

                    {generatedContent.storyblokResult?.success && (
                      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-green-800">
                            Story ID: {generatedContent.storyblokResult.storyId}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setActiveTab('storyblok')}
                          >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            View in Storyblok
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Storyblok Tab */}
          <TabsContent value="storyblok">
            {generatedContent?.storyblokResult?.success && (
              <Card className="max-w-2xl mx-auto">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5 text-green-600" />
                    Published to Storyblok
                  </CardTitle>
                  <CardDescription>
                    Your blog post has been successfully created in Storyblok CMS
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div>
                      <div className="font-medium text-green-900">Story Created</div>
                      <div className="text-sm text-green-700">ID: {generatedContent.storyblokResult.storyId}</div>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Draft</Badge>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-medium">Next Steps:</h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Login to your Storyblok dashboard</li>
                      <li>• Review and edit the content if needed</li>
                      <li>• Publish when ready to go live</li>
                    </ul>
                  </div>

                  <Separator />

                  <div className="text-center">
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab('generator')}
                      className="w-full"
                    >
                      Generate Another Blog Post
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}