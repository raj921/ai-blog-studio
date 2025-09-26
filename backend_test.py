#!/usr/bin/env python3
"""
AI Blog Studio MVP Backend API Testing Suite
Tests all backend endpoints comprehensively including:
- Health check and integrations
- Blog generation with GPT-5
- Image generation with AI
- Complete generation flow
- Storyblok CMS integration
- Error handling scenarios
"""

import requests
import json
import time
import os
from datetime import datetime

# Get the base URL from environment or use local for testing
BASE_URL = 'http://localhost:3000'
API_BASE = f"{BASE_URL}/api"

class BlogStudioTester:
    def __init__(self):
        self.results = {
            'total_tests': 0,
            'passed': 0,
            'failed': 0,
            'errors': []
        }
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'User-Agent': 'AI-Blog-Studio-Tester/1.0'
        })
    
    def log_result(self, test_name, success, message, response_data=None):
        """Log test results"""
        self.results['total_tests'] += 1
        if success:
            self.results['passed'] += 1
            print(f"✅ {test_name}: {message}")
        else:
            self.results['failed'] += 1
            self.results['errors'].append({
                'test': test_name,
                'message': message,
                'response': response_data
            })
            print(f"❌ {test_name}: {message}")
            if response_data:
                print(f"   Response: {json.dumps(response_data, indent=2)}")
    
    def test_health_check(self):
        """Test basic health check endpoint"""
        print("\n🔍 Testing Health Check API...")
        try:
            response = self.session.get(f"{API_BASE}/health", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if 'status' in data and data['status'] == 'ok':
                    self.log_result("Health Check", True, "API is healthy and responding")
                    return True
                else:
                    self.log_result("Health Check", False, "Invalid health response format", data)
            else:
                self.log_result("Health Check", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("Health Check", False, f"Request failed: {str(e)}")
        return False
    
    def test_integrations_check(self):
        """Test integrations availability endpoint"""
        print("\n🔍 Testing Integrations Check API...")
        try:
            response = self.session.get(f"{API_BASE}/test", timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                if 'integrations' in data:
                    integrations = data['integrations']
                    expected = ['gpt5', 'imageGeneration', 'storyblok']
                    
                    all_available = True
                    for integration in expected:
                        if integration not in integrations or integrations[integration] != 'Available':
                            all_available = False
                            break
                    
                    if all_available:
                        self.log_result("Integrations Check", True, "All integrations (GPT-5, Image Gen, Storyblok) are available")
                        return True
                    else:
                        self.log_result("Integrations Check", False, "Some integrations not available", data)
                else:
                    self.log_result("Integrations Check", False, "Missing integrations field in response", data)
            else:
                self.log_result("Integrations Check", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("Integrations Check", False, f"Request failed: {str(e)}")
        return False
    
    def test_blog_generation(self):
        """Test blog generation with GPT-5"""
        print("\n🔍 Testing Blog Generation API...")
        
        test_cases = [
            {
                "name": "Digital Marketing Blog",
                "data": {
                    "title": "Digital Marketing Trends 2024",
                    "topic": "Digital marketing strategies and emerging trends for 2024",
                    "keywords": ["digital marketing", "SEO", "social media", "content marketing"],
                    "wordCount": 800,
                    "tone": "professional"
                }
            },
            {
                "name": "Remote Work Blog",
                "data": {
                    "title": "Remote Work Productivity Tips",
                    "topic": "Effective strategies for maintaining productivity while working remotely",
                    "keywords": ["remote work", "productivity", "work from home"],
                    "wordCount": 600,
                    "tone": "casual"
                }
            }
        ]
        
        success_count = 0
        for test_case in test_cases:
            try:
                print(f"  Testing: {test_case['name']}")
                response = self.session.post(f"{API_BASE}/generate-blog", 
                                           json=test_case['data'], 
                                           timeout=60)
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get('success') and 'data' in data:
                        blog_content = data['data']
                        required_fields = ['title', 'introduction', 'sections', 'conclusion', 'metaDescription']
                        
                        if all(field in blog_content for field in required_fields):
                            if len(blog_content['sections']) >= 2:
                                self.log_result(f"Blog Generation - {test_case['name']}", True, 
                                              f"Generated structured blog with {len(blog_content['sections'])} sections")
                                success_count += 1
                            else:
                                self.log_result(f"Blog Generation - {test_case['name']}", False, 
                                              "Blog has insufficient sections", blog_content)
                        else:
                            missing = [f for f in required_fields if f not in blog_content]
                            self.log_result(f"Blog Generation - {test_case['name']}", False, 
                                          f"Missing required fields: {missing}", blog_content)
                    else:
                        self.log_result(f"Blog Generation - {test_case['name']}", False, 
                                      "Invalid response format", data)
                else:
                    self.log_result(f"Blog Generation - {test_case['name']}", False, 
                                  f"HTTP {response.status_code}: {response.text}")
            except Exception as e:
                self.log_result(f"Blog Generation - {test_case['name']}", False, f"Request failed: {str(e)}")
        
        return success_count == len(test_cases)
    
    def test_image_generation(self):
        """Test AI image generation"""
        print("\n🔍 Testing Image Generation API...")
        
        test_prompts = [
            {
                "name": "Marketing Image",
                "prompt": "Professional digital marketing concept with charts, graphs, and modern technology elements",
                "title": "Digital Marketing Trends 2024"
            },
            {
                "name": "Productivity Image", 
                "prompt": "Clean workspace setup for remote work productivity with laptop, coffee, and organized desk",
                "title": "Remote Work Productivity"
            }
        ]
        
        success_count = 0
        for test_prompt in test_prompts:
            try:
                print(f"  Testing: {test_prompt['name']}")
                response = self.session.post(f"{API_BASE}/generate-image", 
                                           json={
                                               "prompt": test_prompt['prompt'],
                                               "title": test_prompt['title']
                                           }, 
                                           timeout=45)
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get('success') and 'imageUrl' in data:
                        image_url = data['imageUrl']
                        if image_url.startswith('/generated/') and image_url.endswith('.png'):
                            self.log_result(f"Image Generation - {test_prompt['name']}", True, 
                                          f"Generated image: {image_url}")
                            success_count += 1
                        else:
                            self.log_result(f"Image Generation - {test_prompt['name']}", False, 
                                          f"Invalid image URL format: {image_url}")
                    else:
                        self.log_result(f"Image Generation - {test_prompt['name']}", False, 
                                      "Invalid response format or generation failed", data)
                else:
                    self.log_result(f"Image Generation - {test_prompt['name']}", False, 
                                  f"HTTP {response.status_code}: {response.text}")
            except Exception as e:
                self.log_result(f"Image Generation - {test_prompt['name']}", False, f"Request failed: {str(e)}")
        
        return success_count > 0  # At least one should succeed
    
    def test_complete_generation_flow(self):
        """Test the complete generation flow (blog + image + Storyblok)"""
        print("\n🔍 Testing Complete Generation Flow API...")
        
        test_data = {
            "title": "AI-Powered Content Marketing Strategies",
            "topic": "How artificial intelligence is revolutionizing content marketing and what businesses need to know",
            "keywords": ["AI", "content marketing", "automation", "digital strategy"],
            "wordCount": 1000,
            "tone": "professional"
        }
        
        try:
            print("  Testing complete end-to-end generation...")
            response = self.session.post(f"{API_BASE}/generate-complete", 
                                       json=test_data, 
                                       timeout=120)  # Longer timeout for complete flow
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and 'data' in data:
                    result_data = data['data']
                    
                    # Check blog content
                    blog_valid = False
                    if 'blogContent' in result_data:
                        blog = result_data['blogContent']
                        required_fields = ['title', 'introduction', 'sections', 'conclusion']
                        if all(field in blog for field in required_fields):
                            blog_valid = True
                    
                    # Check image generation
                    image_valid = 'imageUrl' in result_data and result_data['imageUrl']
                    
                    # Check Storyblok integration
                    storyblok_attempted = 'storyblokResult' in result_data
                    storyblok_success = (storyblok_attempted and 
                                       result_data['storyblokResult'].get('success', False))
                    
                    if blog_valid and image_valid:
                        if storyblok_success:
                            self.log_result("Complete Generation Flow", True, 
                                          "Full end-to-end generation successful (blog + image + Storyblok)")
                        else:
                            self.log_result("Complete Generation Flow", True, 
                                          "Blog and image generation successful, Storyblok integration had issues but flow continued")
                        return True
                    else:
                        issues = []
                        if not blog_valid:
                            issues.append("blog generation")
                        if not image_valid:
                            issues.append("image generation")
                        self.log_result("Complete Generation Flow", False, 
                                      f"Issues with: {', '.join(issues)}", result_data)
                else:
                    self.log_result("Complete Generation Flow", False, 
                                  "Invalid response format", data)
            else:
                self.log_result("Complete Generation Flow", False, 
                              f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("Complete Generation Flow", False, f"Request failed: {str(e)}")
        
        return False
    
    def test_storyblok_integration(self):
        """Test Storyblok CMS integration"""
        print("\n🔍 Testing Storyblok Integration...")
        
        # Test getting blog posts
        try:
            print("  Testing: Get blog posts from Storyblok")
            response = self.session.get(f"{API_BASE}/blog-posts", timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                if 'stories' in data or isinstance(data, list):
                    self.log_result("Storyblok - Get Posts", True, 
                                  f"Successfully retrieved blog posts from Storyblok")
                else:
                    self.log_result("Storyblok - Get Posts", False, 
                                  "Invalid response format for blog posts", data)
            else:
                self.log_result("Storyblok - Get Posts", False, 
                              f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("Storyblok - Get Posts", False, f"Request failed: {str(e)}")
        
        # Test creating a blog post in Storyblok
        try:
            print("  Testing: Create blog post in Storyblok")
            test_blog_data = {
                "blogData": {
                    "title": "Test Blog Post for API Testing",
                    "introduction": "This is a test blog post created during API testing.",
                    "sections": [
                        {
                            "heading": "Test Section",
                            "content": "This is test content for the API testing process."
                        }
                    ],
                    "conclusion": "This concludes our test blog post.",
                    "metaDescription": "Test blog post for API validation"
                },
                "imageUrl": ""  # No image for this test
            }
            
            response = self.session.post(f"{API_BASE}/publish-to-storyblok", 
                                       json=test_blog_data, 
                                       timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and 'storyId' in data:
                    story_id = data['storyId']
                    self.log_result("Storyblok - Create Post", True, 
                                  f"Successfully created blog post in Storyblok (ID: {story_id})")
                    
                    # Test publishing the created post
                    try:
                        print(f"  Testing: Publish blog post {story_id}")
                        publish_response = self.session.post(f"{API_BASE}/publish/{story_id}", 
                                                           json={}, 
                                                           timeout=15)
                        
                        if publish_response.status_code == 200:
                            publish_data = publish_response.json()
                            if publish_data.get('success'):
                                self.log_result("Storyblok - Publish Post", True, 
                                              f"Successfully published blog post {story_id}")
                            else:
                                self.log_result("Storyblok - Publish Post", False, 
                                              "Publish response indicates failure", publish_data)
                        else:
                            self.log_result("Storyblok - Publish Post", False, 
                                          f"HTTP {publish_response.status_code}: {publish_response.text}")
                    except Exception as e:
                        self.log_result("Storyblok - Publish Post", False, f"Publish request failed: {str(e)}")
                    
                    # Clean up: Delete the test post
                    try:
                        print(f"  Cleaning up: Delete test post {story_id}")
                        delete_response = self.session.delete(f"{API_BASE}/blog-posts/{story_id}", 
                                                            timeout=15)
                        if delete_response.status_code == 200:
                            print(f"  ✅ Test post {story_id} cleaned up successfully")
                        else:
                            print(f"  ⚠️ Could not clean up test post {story_id}")
                    except Exception as e:
                        print(f"  ⚠️ Cleanup failed: {str(e)}")
                    
                    return True
                else:
                    self.log_result("Storyblok - Create Post", False, 
                                  "Invalid response format for post creation", data)
            else:
                self.log_result("Storyblok - Create Post", False, 
                              f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("Storyblok - Create Post", False, f"Request failed: {str(e)}")
        
        return False
    
    def test_error_handling(self):
        """Test error handling scenarios"""
        print("\n🔍 Testing Error Handling...")
        
        error_tests = [
            {
                "name": "Blog Generation - Missing Title",
                "endpoint": "/generate-blog",
                "data": {"topic": "test topic"},
                "expected_status": 400
            },
            {
                "name": "Blog Generation - Missing Topic", 
                "endpoint": "/generate-blog",
                "data": {"title": "test title"},
                "expected_status": 400
            },
            {
                "name": "Image Generation - Missing Prompt",
                "endpoint": "/generate-image", 
                "data": {"title": "test"},
                "expected_status": 400
            },
            {
                "name": "Invalid Endpoint",
                "endpoint": "/nonexistent-endpoint",
                "data": {},
                "expected_status": 404
            }
        ]
        
        success_count = 0
        for test in error_tests:
            try:
                print(f"  Testing: {test['name']}")
                response = self.session.post(f"{API_BASE}{test['endpoint']}", 
                                           json=test['data'], 
                                           timeout=10)
                
                if response.status_code == test['expected_status']:
                    data = response.json()
                    if 'error' in data:
                        self.log_result(f"Error Handling - {test['name']}", True, 
                                      f"Correctly returned {test['expected_status']} with error message")
                        success_count += 1
                    else:
                        self.log_result(f"Error Handling - {test['name']}", False, 
                                      f"Status {test['expected_status']} but no error message", data)
                else:
                    self.log_result(f"Error Handling - {test['name']}", False, 
                                  f"Expected {test['expected_status']}, got {response.status_code}")
            except Exception as e:
                self.log_result(f"Error Handling - {test['name']}", False, f"Request failed: {str(e)}")
        
        return success_count >= len(error_tests) // 2  # At least half should work
    
    def run_all_tests(self):
        """Run all backend API tests"""
        print("🚀 Starting AI Blog Studio MVP Backend API Testing")
        print(f"📍 Testing against: {API_BASE}")
        print("=" * 60)
        
        # Run tests in order of priority
        test_results = {}
        
        # Critical infrastructure tests
        test_results['health'] = self.test_health_check()
        test_results['integrations'] = self.test_integrations_check()
        
        # Core functionality tests
        test_results['blog_generation'] = self.test_blog_generation()
        test_results['image_generation'] = self.test_image_generation()
        test_results['complete_flow'] = self.test_complete_generation_flow()
        
        # Integration tests
        test_results['storyblok'] = self.test_storyblok_integration()
        
        # Error handling tests
        test_results['error_handling'] = self.test_error_handling()
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        print(f"Total Tests: {self.results['total_tests']}")
        print(f"Passed: {self.results['passed']} ✅")
        print(f"Failed: {self.results['failed']} ❌")
        print(f"Success Rate: {(self.results['passed']/self.results['total_tests']*100):.1f}%")
        
        # Critical systems status
        print("\n🔧 CRITICAL SYSTEMS STATUS:")
        critical_systems = ['health', 'integrations', 'blog_generation', 'complete_flow']
        critical_passed = sum(1 for system in critical_systems if test_results.get(system, False))
        print(f"Critical Systems Working: {critical_passed}/{len(critical_systems)}")
        
        if self.results['failed'] > 0:
            print(f"\n❌ FAILED TESTS ({self.results['failed']}):")
            for error in self.results['errors']:
                print(f"  • {error['test']}: {error['message']}")
        
        print("\n" + "=" * 60)
        
        return test_results

if __name__ == "__main__":
    tester = BlogStudioTester()
    results = tester.run_all_tests()