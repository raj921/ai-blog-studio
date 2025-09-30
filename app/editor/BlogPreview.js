'use client';

import { motion } from 'framer-motion';
import { Eye, Sparkles, Edit } from 'lucide-react';
import { useState } from 'react';

export default function BlogPreview({ blogData, onSectionEdit, editingSection, onSectionUpdate }) {
  const [hoveredSection, setHoveredSection] = useState(null);

  const SectionWrapper = ({ id, children, label }) => {
    const isEditing = editingSection === id;
    const isHovered = hoveredSection === id;

    return (
      <div
        className="relative group"
        onMouseEnter={() => setHoveredSection(id)}
        onMouseLeave={() => setHoveredSection(null)}
      >
        {/* Hover Overlay */}
        {(isHovered || isEditing) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`absolute -inset-2 rounded-lg border-2 pointer-events-none z-10 ${
              isEditing ? 'border-purple-500 bg-purple-50/20' : 'border-blue-400 bg-blue-50/10'
            }`}
          />
        )}

        {/* Edit Button */}
        {isHovered && !isEditing && (
          <motion.button
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => onSectionEdit(id)}
            className="absolute top-2 right-2 z-20 bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 shadow-lg"
          >
            <Sparkles className="h-3.5 w-3.5" />
            AI Edit
          </motion.button>
        )}

        {/* Section Label */}
        {(isHovered || isEditing) && (
          <div className="absolute -top-3 left-2 z-20 bg-gray-900 text-white text-xs px-2 py-0.5 rounded">
            {label}
          </div>
        )}

        <div className="relative z-0">
          {children}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Article Header */}
      <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 text-white p-12">
        <SectionWrapper id="title" label="Title">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            {blogData.title}
          </h1>
        </SectionWrapper>

        {/* Meta Info */}
        <div className="flex items-center gap-4 text-gray-300 text-sm">
          <span>{blogData.author || 'AI Blog Studio'}</span>
          <span>•</span>
          <span>{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          <span>•</span>
          <span>{Math.ceil((blogData.introduction?.length || 0 + (blogData.sections?.reduce((acc, s) => acc + s.content.length, 0) || 0)) / 1000)} min read</span>
        </div>
      </div>

      {/* Hero Image Placeholder */}
      {blogData.heroImage && (
        <div className="relative h-96 bg-gradient-to-r from-purple-400 to-blue-500">
          <img
            src={blogData.heroImage}
            alt={blogData.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Article Content */}
      <article className="prose prose-lg max-w-none p-12">
        {/* Introduction */}
        <SectionWrapper id="intro" label="Introduction">
          <div className="text-xl leading-relaxed text-gray-700 mb-12 first-letter:text-5xl first-letter:font-bold first-letter:text-purple-600 first-letter:float-left first-letter:mr-2 first-letter:mt-1">
            {blogData.introduction}
          </div>
        </SectionWrapper>

        {/* Main Sections */}
        {blogData.sections?.map((section, index) => (
          <SectionWrapper key={index} id={index} label={`Section ${index + 1}`}>
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <span className="text-purple-600">{index + 1}.</span>
                {section.heading}
              </h2>
              <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {section.content}
              </div>
            </div>
          </SectionWrapper>
        ))}

        {/* Conclusion */}
        <SectionWrapper id="conclusion" label="Conclusion">
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-l-4 border-purple-600 p-8 rounded-r-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Conclusion</h2>
            <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {blogData.conclusion}
            </div>
          </div>
        </SectionWrapper>

        {/* SEO Meta Description */}
        <div className="mt-12 p-6 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-600">SEO Meta Description</span>
          </div>
          <p className="text-sm text-gray-700 italic">
            "{blogData.metaDescription}"
          </p>
        </div>
      </article>

      {/* Article Footer */}
      <div className="bg-gray-50 p-8 border-t border-gray-200">
        <div className="flex flex-wrap gap-2">
          {blogData.tags?.map((tag, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
