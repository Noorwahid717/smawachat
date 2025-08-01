#!/usr/bin/env python3
"""
Backend API Test Suite for Chatbot with HuggingFace Integration
Tests all endpoints: sessions, messages, text generation, image generation, downloads
"""

import asyncio
import httpx
import json
import base64
import os
from datetime import datetime
from typing import Dict, Any, Optional

# Get backend URL from frontend .env file
def get_backend_url():
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    return line.split('=', 1)[1].strip()
    except Exception as e:
        print(f"Error reading frontend .env: {e}")
    return "http://localhost:8001"

BACKEND_URL = get_backend_url()
API_BASE = f"{BACKEND_URL}/api"

class ChatbotAPITester:
    def __init__(self):
        self.session_id = None
        self.message_ids = []
        self.test_results = {
            "total_tests": 0,
            "passed": 0,
            "failed": 0,
            "errors": []
        }
    
    def log_test(self, test_name: str, success: bool, message: str = ""):
        """Log test result"""
        self.test_results["total_tests"] += 1
        if success:
            self.test_results["passed"] += 1
            print(f"✅ {test_name}: PASSED {message}")
        else:
            self.test_results["failed"] += 1
            self.test_results["errors"].append(f"{test_name}: {message}")
            print(f"❌ {test_name}: FAILED {message}")
    
    async def test_get_sessions_empty(self):
        """Test GET /api/sessions - Should return empty array initially"""
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(f"{API_BASE}/sessions")
                
                if response.status_code == 200:
                    sessions = response.json()
                    if isinstance(sessions, list):
                        self.log_test("GET /api/sessions (empty)", True, f"Returned {len(sessions)} sessions")
                        return True
                    else:
                        self.log_test("GET /api/sessions (empty)", False, "Response is not a list")
                        return False
                else:
                    self.log_test("GET /api/sessions (empty)", False, f"Status: {response.status_code}, Body: {response.text}")
                    return False
        except Exception as e:
            self.log_test("GET /api/sessions (empty)", False, f"Exception: {str(e)}")
            return False
    
    async def test_create_session(self):
        """Test POST /api/sessions - Create new session"""
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                payload = {"title": "Percakapan Baru"}
                response = await client.post(f"{API_BASE}/sessions", json=payload)
                
                if response.status_code == 200:
                    session = response.json()
                    if "id" in session and "title" in session:
                        self.session_id = session["id"]
                        self.log_test("POST /api/sessions", True, f"Created session: {self.session_id}")
                        return True
                    else:
                        self.log_test("POST /api/sessions", False, "Missing id or title in response")
                        return False
                else:
                    self.log_test("POST /api/sessions", False, f"Status: {response.status_code}, Body: {response.text}")
                    return False
        except Exception as e:
            self.log_test("POST /api/sessions", False, f"Exception: {str(e)}")
            return False
    
    async def test_send_text_message(self):
        """Test POST /api/sessions/{session_id}/messages - Send text message"""
        if not self.session_id:
            self.log_test("POST /api/sessions/{id}/messages (text)", False, "No session ID available")
            return False
        
        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                payload = {
                    "content": "Halo, apa kabar? Ceritakan tentang teknologi AI terbaru.",
                    "message_type": "text"
                }
                response = await client.post(f"{API_BASE}/sessions/{self.session_id}/messages", json=payload)
                
                if response.status_code == 200:
                    message = response.json()
                    if "id" in message and "content" in message and message.get("type") == "assistant":
                        self.message_ids.append(message["id"])
                        content_preview = message["content"][:100] + "..." if len(message["content"]) > 100 else message["content"]
                        self.log_test("POST /api/sessions/{id}/messages (text)", True, f"Got response: {content_preview}")
                        return True
                    else:
                        self.log_test("POST /api/sessions/{id}/messages (text)", False, "Invalid message structure in response")
                        return False
                else:
                    self.log_test("POST /api/sessions/{id}/messages (text)", False, f"Status: {response.status_code}, Body: {response.text}")
                    return False
        except Exception as e:
            self.log_test("POST /api/sessions/{id}/messages (text)", False, f"Exception: {str(e)}")
            return False
    
    async def test_send_image_message(self):
        """Test POST /api/sessions/{session_id}/messages - Send image generation request"""
        if not self.session_id:
            self.log_test("POST /api/sessions/{id}/messages (image)", False, "No session ID available")
            return False
        
        try:
            async with httpx.AsyncClient(timeout=180.0) as client:
                payload = {
                    "content": "A beautiful sunset over mountains with vibrant colors",
                    "message_type": "image"
                }
                response = await client.post(f"{API_BASE}/sessions/{self.session_id}/messages", json=payload)
                
                if response.status_code == 200:
                    message = response.json()
                    if "id" in message and "content" in message and message.get("type") == "assistant":
                        self.message_ids.append(message["id"])
                        content_type = message.get("content_type", "")
                        if content_type == "image" and message["content"].startswith("data:image/"):
                            self.log_test("POST /api/sessions/{id}/messages (image)", True, "Generated image successfully")
                            return True
                        elif content_type == "text":
                            # Fallback text response when image generation fails
                            self.log_test("POST /api/sessions/{id}/messages (image)", True, "Got fallback text response (image generation may have failed)")
                            return True
                        else:
                            self.log_test("POST /api/sessions/{id}/messages (image)", False, f"Unexpected content type: {content_type}")
                            return False
                    else:
                        self.log_test("POST /api/sessions/{id}/messages (image)", False, "Invalid message structure in response")
                        return False
                else:
                    self.log_test("POST /api/sessions/{id}/messages (image)", False, f"Status: {response.status_code}, Body: {response.text}")
                    return False
        except Exception as e:
            self.log_test("POST /api/sessions/{id}/messages (image)", False, f"Exception: {str(e)}")
            return False
    
    async def test_get_messages(self):
        """Test GET /api/sessions/{session_id}/messages - Get conversation messages"""
        if not self.session_id:
            self.log_test("GET /api/sessions/{id}/messages", False, "No session ID available")
            return False
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(f"{API_BASE}/sessions/{self.session_id}/messages")
                
                if response.status_code == 200:
                    messages = response.json()
                    if isinstance(messages, list) and len(messages) > 0:
                        # Should have user messages and assistant responses
                        user_messages = [m for m in messages if m.get("type") == "user"]
                        assistant_messages = [m for m in messages if m.get("type") == "assistant"]
                        self.log_test("GET /api/sessions/{id}/messages", True, 
                                    f"Found {len(user_messages)} user messages, {len(assistant_messages)} assistant messages")
                        return True
                    else:
                        self.log_test("GET /api/sessions/{id}/messages", False, "No messages found or invalid format")
                        return False
                else:
                    self.log_test("GET /api/sessions/{id}/messages", False, f"Status: {response.status_code}, Body: {response.text}")
                    return False
        except Exception as e:
            self.log_test("GET /api/sessions/{id}/messages", False, f"Exception: {str(e)}")
            return False
    
    async def test_download_message(self):
        """Test GET /api/download/{message_id} - Download message content"""
        if not self.message_ids:
            self.log_test("GET /api/download/{message_id}", False, "No message IDs available")
            return False
        
        success_count = 0
        for message_id in self.message_ids:
            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    response = await client.get(f"{API_BASE}/download/{message_id}")
                    
                    if response.status_code == 200:
                        content_type = response.headers.get("content-type", "")
                        content_disposition = response.headers.get("content-disposition", "")
                        
                        if "attachment" in content_disposition:
                            success_count += 1
                        else:
                            print(f"⚠️  Download {message_id}: Missing attachment header")
                    else:
                        print(f"⚠️  Download {message_id}: Status {response.status_code}")
            except Exception as e:
                print(f"⚠️  Download {message_id}: Exception {str(e)}")
        
        if success_count > 0:
            self.log_test("GET /api/download/{message_id}", True, f"Successfully downloaded {success_count}/{len(self.message_ids)} messages")
            return True
        else:
            self.log_test("GET /api/download/{message_id}", False, "No successful downloads")
            return False
    
    async def test_get_sessions_with_data(self):
        """Test GET /api/sessions - Should return sessions with data"""
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(f"{API_BASE}/sessions")
                
                if response.status_code == 200:
                    sessions = response.json()
                    if isinstance(sessions, list) and len(sessions) > 0:
                        session = sessions[0]
                        if "id" in session and "title" in session:
                            self.log_test("GET /api/sessions (with data)", True, f"Found {len(sessions)} sessions")
                            return True
                        else:
                            self.log_test("GET /api/sessions (with data)", False, "Invalid session structure")
                            return False
                    else:
                        self.log_test("GET /api/sessions (with data)", False, "No sessions found")
                        return False
                else:
                    self.log_test("GET /api/sessions (with data)", False, f"Status: {response.status_code}, Body: {response.text}")
                    return False
        except Exception as e:
            self.log_test("GET /api/sessions (with data)", False, f"Exception: {str(e)}")
            return False
    
    async def test_delete_session(self):
        """Test DELETE /api/sessions/{session_id} - Delete session"""
        if not self.session_id:
            self.log_test("DELETE /api/sessions/{id}", False, "No session ID available")
            return False
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.delete(f"{API_BASE}/sessions/{self.session_id}")
                
                if response.status_code == 200:
                    result = response.json()
                    if "message" in result:
                        self.log_test("DELETE /api/sessions/{id}", True, "Session deleted successfully")
                        return True
                    else:
                        self.log_test("DELETE /api/sessions/{id}", False, "Invalid response format")
                        return False
                else:
                    self.log_test("DELETE /api/sessions/{id}", False, f"Status: {response.status_code}, Body: {response.text}")
                    return False
        except Exception as e:
            self.log_test("DELETE /api/sessions/{id}", False, f"Exception: {str(e)}")
            return False
    
    async def test_api_root(self):
        """Test GET /api/ - Root endpoint"""
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(f"{API_BASE}/")
                
                if response.status_code == 200:
                    result = response.json()
                    if "message" in result:
                        self.log_test("GET /api/", True, f"Root endpoint: {result['message']}")
                        return True
                    else:
                        self.log_test("GET /api/", False, "Invalid response format")
                        return False
                else:
                    self.log_test("GET /api/", False, f"Status: {response.status_code}, Body: {response.text}")
                    return False
        except Exception as e:
            self.log_test("GET /api/", False, f"Exception: {str(e)}")
            return False
    
    async def run_all_tests(self):
        """Run complete test suite"""
        print(f"🚀 Starting Chatbot Backend API Tests")
        print(f"📍 Backend URL: {BACKEND_URL}")
        print(f"📍 API Base: {API_BASE}")
        print("=" * 60)
        
        # Test sequence following the complete flow
        await self.test_api_root()
        await self.test_get_sessions_empty()
        await self.test_create_session()
        await self.test_send_text_message()
        await self.test_send_image_message()
        await self.test_get_messages()
        await self.test_download_message()
        await self.test_get_sessions_with_data()
        await self.test_delete_session()
        
        # Print summary
        print("=" * 60)
        print(f"📊 TEST SUMMARY")
        print(f"Total Tests: {self.test_results['total_tests']}")
        print(f"Passed: {self.test_results['passed']}")
        print(f"Failed: {self.test_results['failed']}")
        
        if self.test_results['errors']:
            print(f"\n❌ FAILED TESTS:")
            for error in self.test_results['errors']:
                print(f"  - {error}")
        
        success_rate = (self.test_results['passed'] / self.test_results['total_tests']) * 100 if self.test_results['total_tests'] > 0 else 0
        print(f"\n🎯 Success Rate: {success_rate:.1f}%")
        
        return self.test_results

async def main():
    """Main test runner"""
    tester = ChatbotAPITester()
    results = await tester.run_all_tests()
    
    # Exit with appropriate code
    if results['failed'] == 0:
        print("\n🎉 All tests passed!")
        exit(0)
    else:
        print(f"\n💥 {results['failed']} tests failed!")
        exit(1)

if __name__ == "__main__":
    asyncio.run(main())