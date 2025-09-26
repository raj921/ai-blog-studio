'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PenTool, 
  Image, 
  Upload, 
  Wand2, 
  CheckCircle2, 
  AlertCircle, 
  Copy,
  ExternalLink,
  Sparkles,
  Bot,
  Zap,
  Layers
} from 'lucide-react';

// Kokonut UI Components
import AIPrompt from '@/components/kokonutui/ai-prompt';
import AITextLoading from '@/components/kokonutui/ai-text-loading';
import ShimmerText from '@/components/kokonutui/shimmer-text';
import SmoothTab from '@/components/kokonutui/smooth-tab';
import GradientButton from '@/components/kokonutui/gradient-button';
import LiquidGlassCard from '@/components/kokonutui/liquid-glass-card';
import BeamsBackground from '@/components/kokonutui/beams-background';

// Existing components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

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

  const tabs = [
    { id: 'generator', label: 'Generate', icon: <Bot className="h-4 w-4" /> },
    { id: 'preview', label: 'Preview', icon: <PenTool className="h-4 w-4" /> },
    { id: 'published', label: 'Published', icon: <Upload className="h-4 w-4" /> }
  ];

  const handleInputChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTopicSubmit = (topic) => {
    if (!formData.title) {
      setFormData(prev => ({ ...prev, title: topic.slice(0, 100) }));
    }
    setFormData(prev => ({ ...prev, topic }));
  };

  const generateCompleteBlog = async () => {
    console.log('🚀 Generate button clicked!');
    console.log('Form data:', { title: formData.title, topic: formData.topic });
    
    if (!formData.title.trim() || !formData.topic.trim()) {
      console.log('❌ Validation failed - missing required fields');
      setError('Title and topic are required');
      return;
    }

    console.log('✅ Validation passed, starting generation...');
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
    <BeamsBackground className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div 
            className="flex items-center justify-center gap-3 mb-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              animate={{ 
                rotate: [0, 360],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 4, 
                repeat: Infinity,
                ease: "linear"
              }}
            >
              <Sparkles className="h-10 w-10 text-purple-600" />
            </motion.div>
            <h1 className="text-5xl font-bold text-slate-900 dark:text-white">
              AI Blog Studio
            </h1>
          </motion.div>
          <motion.p 
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            Generate complete blog posts with AI-powered content, hero images, and automatic Storyblok CMS publishing
          </motion.p>
        </div>

        {/* Status Messages */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6"
            >
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6"
            >
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">{success}</AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Interface */}
        <div className="space-y-8">
          {/* Tab Navigation */}
          <div className="flex justify-center">
            <SmoothTab 
              tabs={tabs}
              defaultTab={activeTab}
              onTabChange={setActiveTab}
            />
          </div>

          {/* Generation Tab */}
          {activeTab === 'generator' && (
            <motion.div
              key="generator"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.5 }}
            >
              <LiquidGlassCard className="max-w-4xl mx-auto">
                <div className="space-y-8">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
                      <Bot className="h-6 w-6 text-purple-600" />
                      Blog Post Generator
                    </h2>
                    <p className="text-muted-foreground">
                      Enter your topic and let AI create a complete blog post with images
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column - Topic Input */}
                    <div className="space-y-6">
                      <div>
                        <Label className="text-base font-medium mb-3 block">Blog Topic & Ideas</Label>
                        <AIPrompt
                          onSubmit={handleTopicSubmit}
                          placeholder="Describe your blog post idea in detail. What should it cover? What's the main message? Include any specific points you want to address..."
                          isLoading={isGenerating}
                        />
                      </div>
                      
                      {formData.topic && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="p-4 rounded-lg bg-muted/50 border"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Zap className="h-4 w-4 text-green-500" />
                            <span className="text-sm font-medium text-green-700">Topic Captured</span>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {formData.topic}
                          </p>
                        </motion.div>
                      )}
                    </div>

                    {/* Right Column - Configuration */}
                    <div className="space-y-6">
                      <div>
                        <Label htmlFor="title" className="text-base font-medium">Blog Title</Label>
                        <Input
                          id="title"
                          value={formData.title}
                          onChange={(e) => handleInputChange('title', e.target.value)}
                          placeholder="Enter your blog post title..."
                          disabled={isGenerating}
                          className="mt-2"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="keywords" className="text-base font-medium">Keywords (SEO)</Label>
                        <Input
                          id="keywords"
                          value={formData.keywords}
                          onChange={(e) => handleInputChange('keywords', e.target.value)}
                          placeholder="SEO keywords, separated by commas"
                          disabled={isGenerating}
                          className="mt-2"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-base font-medium">Word Count</Label>
                          <Select
                            value={formData.wordCount.toString()}
                            onValueChange={(value) => handleInputChange('wordCount', parseInt(value))}
                            disabled={isGenerating}
                          >
                            <SelectTrigger className="mt-2">
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
                          <Label className="text-base font-medium">Tone</Label>
                          <Select
                            value={formData.tone}
                            onValueChange={(value) => handleInputChange('tone', value)}
                            disabled={isGenerating}
                          >
                            <SelectTrigger className="mt-2">
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
                  </div>

                  {/* Progress Section */}
                  {isGenerating && (
                    <motion.div 
                      className="space-y-4 p-6 rounded-xl bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                    >
                      <div className="flex items-center gap-3">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <Layers className="h-5 w-5 text-purple-600" />
                        </motion.div>
                        <AITextLoading text={currentStep} />
                      </div>
                      <Progress value={progress} className="h-3" />
                      <div className="text-xs text-purple-600 text-center">
                        This may take 1-2 minutes for AI processing...
                      </div>
                    </motion.div>
                  )}

                  {/* Generate Button */}
                  <div className="text-center">
                    {(!formData.title.trim() || !formData.topic.trim()) && (
                      <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                        <div className="font-medium mb-1">⚠️ Required fields missing:</div>
                        <ul className="text-xs">
                          {!formData.title.trim() && <li>• Blog title is required</li>}
                          {!formData.topic.trim() && <li>• Topic description is required</li>}
                        </ul>
                      </div>
                    )}
                    
                    <GradientButton
                      onClick={generateCompleteBlog}
                      disabled={isGenerating || !formData.title.trim() || !formData.topic.trim()}
                      size="lg"
                      isLoading={isGenerating}
                      className="px-12 shadow-2xl shadow-purple-500/25"
                    >
                      {isGenerating ? 'Generating...' : (
                        <>
                          <Sparkles className="mr-2 h-5 w-5" />
                          Generate Complete Blog Post
                        </>
                      )}
                    </GradientButton>
                    <p className="text-xs text-muted-foreground mt-3">
                      This will generate content, create a hero image, and publish to Storyblok
                    </p>
                  </div>
                </div>
              </LiquidGlassCard>
            </motion.div>
          )}

          {/* Preview Tab */}
          {activeTab === 'preview' && generatedContent?.blogContent && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.5 }}
            >
              <LiquidGlassCard className="max-w-5xl mx-auto">
                <div className="space-y-6">
                  {/* Preview Header */}
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                      <PenTool className="h-6 w-6 text-blue-600" />
                      Blog Preview
                    </h2>
                    <div className="flex items-center gap-2">
                      <GradientButton
                        onClick={() => copyToClipboard(generateMarkdownContent())}
                        size="sm"
                        variant="secondary"
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Copy Markdown
                      </GradientButton>
                    </div>
                  </div>

                  {/* Hero Image */}
                  {generatedContent.imageUrl && (
                    <motion.div 
                      className="rounded-xl overflow-hidden"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <img
                        src={`${process.env.NEXT_PUBLIC_BASE_URL || ''}${generatedContent.imageUrl}`}
                        alt="Generated Hero Image"
                        className="w-full h-64 object-cover"
                      />
                    </motion.div>
                  )}

                  {/* Blog Content */}
                  <div className="prose lg:prose-lg max-w-none">
                    <ShimmerText className="text-4xl font-bold mb-6">
                      {generatedContent.blogContent.title}
                    </ShimmerText>
                    
                    <div className="space-y-8">
                      <div>
                        <h3 className="text-xl font-semibold mb-4 text-blue-600">Introduction</h3>
                        <div className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
                          {generatedContent.blogContent.introduction}
                        </div>
                      </div>

                      {generatedContent.blogContent.sections?.map((section, index) => (
                        <motion.div 
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 * index }}
                        >
                          <h3 className="text-xl font-semibold mb-4 text-blue-600">{section.heading}</h3>
                          <div className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
                            {section.content}
                          </div>
                        </motion.div>
                      ))}

                      <div>
                        <h3 className="text-xl font-semibold mb-4 text-blue-600">Conclusion</h3>
                        <div className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
                          {generatedContent.blogContent.conclusion}
                        </div>
                      </div>
                    </div>

                    <Separator className="my-8" />

                    <div className="bg-muted/30 p-6 rounded-xl border">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-purple-600" />
                        SEO Meta Description
                      </h4>
                      <p className="text-sm text-muted-foreground italic">
                        "{generatedContent.blogContent.metaDescription}"
                      </p>
                    </div>
                  </div>

                  {/* Generation Results */}
                  <LiquidGlassCard blur="sm">
                    <h3 className="font-semibold mb-4">Generation Results</h3>
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
                            <span>Storyblok Pending</span>
                          </>
                        )}
                      </div>
                    </div>

                    {generatedContent.storyblokResult?.success && (
                      <motion.div 
                        className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-green-800">
                            Story ID: {generatedContent.storyblokResult.storyId}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setActiveTab('published')}
                          >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            View Published
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </LiquidGlassCard>
                </div>
              </LiquidGlassCard>
            </motion.div>
          )}

          {/* Published Tab */}
          {activeTab === 'published' && generatedContent?.storyblokResult?.success && (
            <motion.div
              key="published"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.5 }}
            >
              <LiquidGlassCard className="max-w-3xl mx-auto text-center">
                <div className="space-y-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", bounce: 0.5 }}
                  >
                    <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
                  </motion.div>
                  
                  <div>
                    <ShimmerText className="text-3xl font-bold mb-2">
                      Successfully Published!
                    </ShimmerText>
                    <p className="text-muted-foreground">
                      Your blog post has been created and published to Storyblok CMS
                    </p>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <div className="space-y-3">
                      <div className="font-medium text-green-900">Story Created</div>
                      <div className="text-sm text-green-700">
                        ID: {generatedContent.storyblokResult.storyId}
                      </div>
                      <Badge className="bg-green-100 text-green-800">Draft</Badge>
                    </div>
                  </div>

                  <div className="space-y-3 text-sm text-muted-foreground">
                    <h4 className="font-medium text-foreground">Next Steps:</h4>
                    <ul className="space-y-1">
                      <li>• Login to your Storyblok dashboard</li>
                      <li>• Review and edit the content if needed</li>
                      <li>• Publish when ready to go live</li>
                    </ul>
                  </div>

                  <Separator />

                  <GradientButton
                    onClick={() => {
                      setActiveTab('generator');
                      setGeneratedContent(null);
                      setFormData({
                        title: '',
                        topic: '',
                        keywords: '',
                        wordCount: 800,
                        tone: 'professional'
                      });
                    }}
                    className="w-full"
                  >
                    Generate Another Blog Post
                  </GradientButton>
                </div>
              </LiquidGlassCard>
            </motion.div>
          )}
        </div>
      </div>
    </BeamsBackground>
  );
}