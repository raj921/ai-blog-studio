'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Save, 
  Eye, 
  Smartphone, 
  Tablet, 
  Monitor,
  RefreshCw,
  Wand2,
  MessageSquare,
  Upload,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from 'next/navigation';
import BlogPreview from './BlogPreview';
import AIControls from './AIControls';

export default function VisualEditor() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobId = searchParams.get('jobId');
  
  const [blogData, setBlogData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState('desktop'); // desktop, tablet, mobile
  const [editingSection, setEditingSection] = useState(null);
  const [showAIPanel, setShowAIPanel] = useState(true);

  // Fetch blog data from job result
  useEffect(() => {
    const fetchBlogData = async () => {
      if (!jobId) {
        // If no job ID, redirect to home
        router.push('/');
        return;
      }

      try {
        const response = await fetch(`/api/job-status/${jobId}`);
        const data = await response.json();
        
        if (data.status === 'completed' && data.result?.blogContent) {
          setBlogData(data.result.blogContent);
          setLoading(false);
        } else if (data.status === 'failed') {
          throw new Error('Blog generation failed');
        } else {
          // Still processing, wait and retry
          setTimeout(fetchBlogData, 2000);
        }
      } catch (error) {
        console.error('Error fetching blog data:', error);
        router.push('/');
      }
    };

    fetchBlogData();
  }, [jobId, router]);

  const handleSectionUpdate = (sectionIndex, newContent) => {
    setBlogData(prev => {
      const updated = { ...prev };
      if (sectionIndex === 'intro') {
        updated.introduction = newContent;
      } else if (sectionIndex === 'conclusion') {
        updated.conclusion = newContent;
      } else if (typeof sectionIndex === 'number') {
        updated.sections[sectionIndex].content = newContent;
      }
      return updated;
    });
  };

  const handlePublish = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/publish-to-storyblok', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blogData })
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert('🎉 Published to Storyblok successfully!');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      alert('Failed to publish: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-lg text-gray-600">Loading your blog...</p>
        </div>
      </div>
    );
  }

  if (!blogData) {
    return null;
  }

  const previewWidths = {
    desktop: 'max-w-7xl',
    tablet: 'max-w-3xl',
    mobile: 'max-w-md'
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Toolbar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-screen-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left */}
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="h-6 w-px bg-gray-300" />
              <h1 className="font-semibold text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                AI Visual Editor
              </h1>
            </div>

            {/* Center - Preview Mode */}
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              <Button
                variant={previewMode === 'desktop' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setPreviewMode('desktop')}
              >
                <Monitor className="h-4 w-4" />
              </Button>
              <Button
                variant={previewMode === 'tablet' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setPreviewMode('tablet')}
              >
                <Tablet className="h-4 w-4" />
              </Button>
              <Button
                variant={previewMode === 'mobile' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setPreviewMode('mobile')}
              >
                <Smartphone className="h-4 w-4" />
              </Button>
            </div>

            {/* Right */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAIPanel(!showAIPanel)}
              >
                <Wand2 className="h-4 w-4 mr-2" />
                {showAIPanel ? 'Hide' : 'Show'} AI Controls
              </Button>
              <Button
                size="sm"
                onClick={handlePublish}
                disabled={saving}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Publish
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex max-w-screen-2xl mx-auto">
        {/* AI Controls Panel */}
        <AnimatePresence>
          {showAIPanel && (
            <motion.div
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              className="w-80 bg-white border-r border-gray-200 overflow-y-auto"
              style={{ height: 'calc(100vh - 73px)' }}
            >
              <AIControls
                blogData={blogData}
                setBlogData={setBlogData}
                editingSection={editingSection}
                setEditingSection={setEditingSection}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Preview Panel */}
        <div className="flex-1 overflow-y-auto bg-gray-50 p-8" style={{ height: 'calc(100vh - 73px)' }}>
          <motion.div
            key={previewMode}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`mx-auto transition-all duration-300 ${previewWidths[previewMode]}`}
          >
            <BlogPreview
              blogData={blogData}
              onSectionEdit={setEditingSection}
              editingSection={editingSection}
              onSectionUpdate={handleSectionUpdate}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
