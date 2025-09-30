'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  RefreshCw,
  MessageSquare,
  Wand2,
  TrendingUp,
  Minimize2,
  Maximize2,
  Smile,
  Briefcase,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AIControls({ blogData, setBlogData, editingSection, setEditingSection }) {
  const [aiCommand, setAiCommand] = useState('');
  const [processing, setProcessing] = useState(false);

  const getSectionContent = (sectionId) => {
    if (sectionId === 'intro') return blogData.introduction;
    if (sectionId === 'conclusion') return blogData.conclusion;
    if (sectionId === 'title') return blogData.title;
    if (typeof sectionId === 'number') return blogData.sections[sectionId].content;
    return '';
  };

  const getSectionLabel = (sectionId) => {
    if (sectionId === 'intro') return 'Introduction';
    if (sectionId === 'conclusion') return 'Conclusion';
    if (sectionId === 'title') return 'Title';
    if (typeof sectionId === 'number') return `Section ${sectionId + 1}: ${blogData.sections[sectionId].heading}`;
    return 'Unknown';
  };

  const handleAIRegenerate = async (action) => {
    if (editingSection === null) {
      alert('Please select a section to edit first');
      return;
    }

    setProcessing(true);
    const content = getSectionContent(editingSection);
    
    let prompt = '';
    switch(action) {
      case 'regenerate':
        prompt = `Rewrite this content to make it better while keeping the same meaning:\n\n${content}`;
        break;
      case 'shorter':
        prompt = `Make this content more concise (about 50% shorter) while keeping key points:\n\n${content}`;
        break;
      case 'longer':
        prompt = `Expand this content with more details, examples, and explanations:\n\n${content}`;
        break;
      case 'casual':
        prompt = `Rewrite this in a casual, friendly tone:\n\n${content}`;
        break;
      case 'professional':
        prompt = `Rewrite this in a professional, formal tone:\n\n${content}`;
        break;
      case 'seo':
        prompt = `Optimize this content for SEO with relevant keywords:\n\n${content}`;
        break;
      case 'custom':
        if (!aiCommand.trim()) {
          alert('Please enter a custom command');
          setProcessing(false);
          return;
        }
        prompt = `${aiCommand}\n\nCurrent content:\n${content}`;
        break;
    }

    try {
      // Call Gemini AI to regenerate
      const response = await fetch('/api/ai-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt,
          sectionId: editingSection
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // Update the section with new content
        setBlogData(prev => {
          const updated = { ...prev };
          if (editingSection === 'intro') {
            updated.introduction = result.content;
          } else if (editingSection === 'conclusion') {
            updated.conclusion = result.content;
          } else if (editingSection === 'title') {
            updated.title = result.content;
          } else if (typeof editingSection === 'number') {
            updated.sections[editingSection].content = result.content;
          }
          return updated;
        });
        setAiCommand('');
      } else {
        throw new Error(result.error || 'AI edit failed');
      }
    } catch (error) {
      alert('AI editing failed: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2 mb-2">
          <Wand2 className="h-5 w-5 text-purple-600" />
          AI Controls
        </h2>
        <p className="text-sm text-gray-600">
          Select a section in the preview, then use AI to improve it
        </p>
      </div>

      {/* Currently Editing */}
      {editingSection !== null ? (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-purple-50 border border-purple-200 rounded-lg p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-purple-900">Editing:</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditingSection(null)}
              className="text-purple-600 hover:text-purple-700"
            >
              Clear
            </Button>
          </div>
          <p className="text-sm text-purple-700 font-medium">
            {getSectionLabel(editingSection)}
          </p>
        </motion.div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
          <Sparkles className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">
            Click "AI Edit" on any section to start
          </p>
        </div>
      )}

      {/* Quick Actions */}
      {editingSection !== null && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">Quick Actions</h3>
          
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAIRegenerate('regenerate')}
              disabled={processing}
              className="w-full"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-2" />
              Regenerate
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAIRegenerate('seo')}
              disabled={processing}
              className="w-full"
            >
              <TrendingUp className="h-3.5 w-3.5 mr-2" />
              SEO Optimize
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAIRegenerate('shorter')}
              disabled={processing}
              className="w-full"
            >
              <Minimize2 className="h-3.5 w-3.5 mr-2" />
              Make Shorter
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAIRegenerate('longer')}
              disabled={processing}
              className="w-full"
            >
              <Maximize2 className="h-3.5 w-3.5 mr-2" />
              Make Longer
            </Button>
          </div>

          {/* Tone Adjustment */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Change Tone</h3>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAIRegenerate('casual')}
                disabled={processing}
                className="w-full"
              >
                <Smile className="h-3.5 w-3.5 mr-2" />
                Casual
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAIRegenerate('professional')}
                disabled={processing}
                className="w-full"
              >
                <Briefcase className="h-3.5 w-3.5 mr-2" />
                Professional
              </Button>
            </div>
          </div>

          {/* Custom Command */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Custom AI Command</h3>
            <Textarea
              placeholder="e.g., 'Add code examples' or 'Make it more technical'..."
              value={aiCommand}
              onChange={(e) => setAiCommand(e.target.value)}
              disabled={processing}
              rows={3}
              className="mb-2"
            />
            <Button
              onClick={() => handleAIRegenerate('custom')}
              disabled={processing || !aiCommand.trim()}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  AI Processing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Apply AI Command
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">💡 Tips</h3>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Hover over any section to see edit options</li>
          <li>• Use custom commands for specific changes</li>
          <li>• All changes are instant and AI-powered</li>
          <li>• Click "Publish" when ready to go live</li>
        </ul>
      </div>
    </div>
  );
}
