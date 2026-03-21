#!/usr/bin/env python3
"""
KdM TikTok Clone Backend API Test Suite
Tests all backend endpoints systematically
"""

import requests
import json
import time
import sys
from typing import Dict, Any, Optional

# Backend URL from frontend environment
BACKEND_URL = "https://pulse-feed-6.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

class KdMAPITester:
    def __init__(self):
        self.session = requests.Session()
        self.user1_token = None
        self.user2_token = None
        self.user1_id = None
        self.user2_id = None
        self.video_id = None
        self.comment_id = None
        self.test_results = []
        
    def log_test(self, test_name: str, success: bool, details: str = ""):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"    {details}")
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details
        })
        
    def make_request(self, method: str, endpoint: str, data: Any = None, 
                    headers: Dict[str, str] = None, files: Dict = None) -> tuple:
        """Make HTTP request and return (success, response, error)"""
        url = f"{API_BASE}{endpoint}"
        try:
            if headers is None:
                headers = {}
            
            if method.upper() == "GET":
                response = self.session.get(url, headers=headers, timeout=30)
            elif method.upper() == "POST":
                if files:
                    response = self.session.post(url, data=data, files=files, headers=headers, timeout=30)
                elif isinstance(data, dict) and not files:
                    headers["Content-Type"] = "application/json"
                    response = self.session.post(url, json=data, headers=headers, timeout=30)
                else:
                    response = self.session.post(url, data=data, headers=headers, timeout=30)
            elif method.upper() == "PUT":
                headers["Content-Type"] = "application/json"
                response = self.session.put(url, json=data, headers=headers, timeout=30)
            elif method.upper() == "DELETE":
                response = self.session.delete(url, headers=headers, timeout=30)
            else:
                return False, None, f"Unsupported method: {method}"
                
            return True, response, None
        except requests.exceptions.RequestException as e:
            return False, None, str(e)
    
    def test_health_check(self):
        """Test health check endpoint"""
        success, response, error = self.make_request("GET", "/health")
        if not success:
            self.log_test("Health Check", False, f"Request failed: {error}")
            return False
            
        if response.status_code == 200:
            try:
                data = response.json()
                if data.get("status") == "ok":
                    self.log_test("Health Check", True, "API is healthy")
                    return True
                else:
                    self.log_test("Health Check", False, f"Unexpected response: {data}")
                    return False
            except json.JSONDecodeError:
                self.log_test("Health Check", False, "Invalid JSON response")
                return False
        else:
            self.log_test("Health Check", False, f"HTTP {response.status_code}: {response.text}")
            return False
    
    def test_auth_register(self):
        """Test user registration"""
        # Test User 1
        user1_data = {
            "username": "tiktoker_alex",
            "email": "alex@tiktok.com", 
            "password": "securepass123",
            "displayName": "Alex TikToker"
        }
        
        success, response, error = self.make_request("POST", "/auth/register", user1_data)
        if not success:
            self.log_test("Auth Register User1", False, f"Request failed: {error}")
            return False
            
        if response.status_code == 200:
            try:
                data = response.json()
                if "user" in data and "token" in data:
                    self.user1_token = data["token"]
                    self.user1_id = data["user"]["id"]
                    self.log_test("Auth Register User1", True, f"User registered: {data['user']['username']}")
                else:
                    self.log_test("Auth Register User1", False, f"Missing user/token in response: {data}")
                    return False
            except json.JSONDecodeError:
                self.log_test("Auth Register User1", False, "Invalid JSON response")
                return False
        else:
            self.log_test("Auth Register User1", False, f"HTTP {response.status_code}: {response.text}")
            return False
            
        # Test User 2 for follow testing
        user2_data = {
            "username": "creator_bella",
            "email": "bella@tiktok.com",
            "password": "mypassword456", 
            "displayName": "Bella Creator"
        }
        
        success, response, error = self.make_request("POST", "/auth/register", user2_data)
        if not success:
            self.log_test("Auth Register User2", False, f"Request failed: {error}")
            return False
            
        if response.status_code == 200:
            try:
                data = response.json()
                if "user" in data and "token" in data:
                    self.user2_token = data["token"]
                    self.user2_id = data["user"]["id"]
                    self.log_test("Auth Register User2", True, f"User registered: {data['user']['username']}")
                    return True
                else:
                    self.log_test("Auth Register User2", False, f"Missing user/token in response: {data}")
                    return False
            except json.JSONDecodeError:
                self.log_test("Auth Register User2", False, "Invalid JSON response")
                return False
        else:
            self.log_test("Auth Register User2", False, f"HTTP {response.status_code}: {response.text}")
            return False
    
    def test_auth_login(self):
        """Test user login"""
        login_data = {
            "email": "alex@tiktok.com",
            "password": "securepass123"
        }
        
        success, response, error = self.make_request("POST", "/auth/login", login_data)
        if not success:
            self.log_test("Auth Login", False, f"Request failed: {error}")
            return False
            
        if response.status_code == 200:
            try:
                data = response.json()
                if "user" in data and "token" in data:
                    # Verify token matches
                    if data["token"] == self.user1_token:
                        self.log_test("Auth Login", True, f"Login successful: {data['user']['username']}")
                        return True
                    else:
                        self.log_test("Auth Login", False, "Token mismatch")
                        return False
                else:
                    self.log_test("Auth Login", False, f"Missing user/token in response: {data}")
                    return False
            except json.JSONDecodeError:
                self.log_test("Auth Login", False, "Invalid JSON response")
                return False
        else:
            self.log_test("Auth Login", False, f"HTTP {response.status_code}: {response.text}")
            return False
    
    def test_auth_me(self):
        """Test get current user"""
        if not self.user1_token:
            self.log_test("Auth Me", False, "No token available")
            return False
            
        headers = {"Authorization": f"Bearer {self.user1_token}"}
        success, response, error = self.make_request("GET", "/auth/me", headers=headers)
        
        if not success:
            self.log_test("Auth Me", False, f"Request failed: {error}")
            return False
            
        if response.status_code == 200:
            try:
                data = response.json()
                if data.get("username") == "tiktoker_alex":
                    self.log_test("Auth Me", True, f"User profile retrieved: {data['username']}")
                    return True
                else:
                    self.log_test("Auth Me", False, f"Unexpected user data: {data}")
                    return False
            except json.JSONDecodeError:
                self.log_test("Auth Me", False, "Invalid JSON response")
                return False
        else:
            self.log_test("Auth Me", False, f"HTTP {response.status_code}: {response.text}")
            return False
    
    def test_create_video(self):
        """Test video creation"""
        if not self.user1_token:
            self.log_test("Create Video", False, "No token available")
            return False
            
        headers = {"Authorization": f"Bearer {self.user1_token}"}
        video_data = {
            "caption": "Amazing dance moves! #viral #fyp #dance",
            "hashtags": "viral,fyp,dance",
            "visibility": "public",
            "videoUrl": "https://youtube.com/watch?v=dQw4w9WgXcQ",
            "allowComments": "true"
        }
        
        success, response, error = self.make_request("POST", "/videos", video_data, headers=headers)
        
        if not success:
            self.log_test("Create Video", False, f"Request failed: {error}")
            return False
            
        if response.status_code == 200:
            try:
                data = response.json()
                if "id" in data and "user" in data:
                    self.video_id = data["id"]
                    self.log_test("Create Video", True, f"Video created: {data['id']}")
                    return True
                else:
                    self.log_test("Create Video", False, f"Missing id/user in response: {data}")
                    return False
            except json.JSONDecodeError:
                self.log_test("Create Video", False, "Invalid JSON response")
                return False
        else:
            self.log_test("Create Video", False, f"HTTP {response.status_code}: {response.text}")
            return False
    
    def test_get_feed(self):
        """Test video feed"""
        success, response, error = self.make_request("GET", "/videos/feed?page=1&limit=10")
        
        if not success:
            self.log_test("Get Feed", False, f"Request failed: {error}")
            return False
            
        if response.status_code == 200:
            try:
                data = response.json()
                if "videos" in data and isinstance(data["videos"], list):
                    video_count = len(data["videos"])
                    self.log_test("Get Feed", True, f"Feed retrieved with {video_count} videos")
                    return True
                else:
                    self.log_test("Get Feed", False, f"Invalid feed structure: {data}")
                    return False
            except json.JSONDecodeError:
                self.log_test("Get Feed", False, "Invalid JSON response")
                return False
        else:
            self.log_test("Get Feed", False, f"HTTP {response.status_code}: {response.text}")
            return False
    
    def test_like_video(self):
        """Test video like/unlike"""
        if not self.user1_token or not self.video_id:
            self.log_test("Like Video", False, "No token or video_id available")
            return False
            
        headers = {"Authorization": f"Bearer {self.user1_token}"}
        success, response, error = self.make_request("POST", f"/videos/{self.video_id}/like", headers=headers)
        
        if not success:
            self.log_test("Like Video", False, f"Request failed: {error}")
            return False
            
        if response.status_code == 200:
            try:
                data = response.json()
                if "liked" in data and "likeCount" in data:
                    self.log_test("Like Video", True, f"Video liked: {data['liked']}, count: {data['likeCount']}")
                    return True
                else:
                    self.log_test("Like Video", False, f"Invalid like response: {data}")
                    return False
            except json.JSONDecodeError:
                self.log_test("Like Video", False, "Invalid JSON response")
                return False
        else:
            self.log_test("Like Video", False, f"HTTP {response.status_code}: {response.text}")
            return False
    
    def test_bookmark_video(self):
        """Test video bookmark"""
        if not self.user1_token or not self.video_id:
            self.log_test("Bookmark Video", False, "No token or video_id available")
            return False
            
        headers = {"Authorization": f"Bearer {self.user1_token}"}
        success, response, error = self.make_request("POST", f"/videos/{self.video_id}/bookmark", headers=headers)
        
        if not success:
            self.log_test("Bookmark Video", False, f"Request failed: {error}")
            return False
            
        if response.status_code == 200:
            try:
                data = response.json()
                if "bookmarked" in data:
                    self.log_test("Bookmark Video", True, f"Video bookmarked: {data['bookmarked']}")
                    return True
                else:
                    self.log_test("Bookmark Video", False, f"Invalid bookmark response: {data}")
                    return False
            except json.JSONDecodeError:
                self.log_test("Bookmark Video", False, "Invalid JSON response")
                return False
        else:
            self.log_test("Bookmark Video", False, f"HTTP {response.status_code}: {response.text}")
            return False
    
    def test_create_comment(self):
        """Test comment creation"""
        if not self.user1_token or not self.video_id:
            self.log_test("Create Comment", False, "No token or video_id available")
            return False
            
        headers = {"Authorization": f"Bearer {self.user1_token}"}
        comment_data = {"text": "Great video! Love the moves! 🔥"}
        
        success, response, error = self.make_request("POST", f"/videos/{self.video_id}/comments", comment_data, headers=headers)
        
        if not success:
            self.log_test("Create Comment", False, f"Request failed: {error}")
            return False
            
        if response.status_code == 200:
            try:
                data = response.json()
                if "id" in data and "text" in data:
                    self.comment_id = data["id"]
                    self.log_test("Create Comment", True, f"Comment created: {data['text'][:30]}...")
                    return True
                else:
                    self.log_test("Create Comment", False, f"Invalid comment response: {data}")
                    return False
            except json.JSONDecodeError:
                self.log_test("Create Comment", False, "Invalid JSON response")
                return False
        else:
            self.log_test("Create Comment", False, f"HTTP {response.status_code}: {response.text}")
            return False
    
    def test_get_comments(self):
        """Test get video comments"""
        if not self.video_id:
            self.log_test("Get Comments", False, "No video_id available")
            return False
            
        success, response, error = self.make_request("GET", f"/videos/{self.video_id}/comments")
        
        if not success:
            self.log_test("Get Comments", False, f"Request failed: {error}")
            return False
            
        if response.status_code == 200:
            try:
                data = response.json()
                if "comments" in data and "total" in data:
                    comment_count = len(data["comments"])
                    self.log_test("Get Comments", True, f"Comments retrieved: {comment_count} comments, total: {data['total']}")
                    return True
                else:
                    self.log_test("Get Comments", False, f"Invalid comments response: {data}")
                    return False
            except json.JSONDecodeError:
                self.log_test("Get Comments", False, "Invalid JSON response")
                return False
        else:
            self.log_test("Get Comments", False, f"HTTP {response.status_code}: {response.text}")
            return False
    
    def test_follow_user(self):
        """Test user follow"""
        if not self.user1_token or not self.user2_id:
            self.log_test("Follow User", False, "No token or user2_id available")
            return False
            
        headers = {"Authorization": f"Bearer {self.user1_token}"}
        success, response, error = self.make_request("POST", f"/users/{self.user2_id}/follow", headers=headers)
        
        if not success:
            self.log_test("Follow User", False, f"Request failed: {error}")
            return False
            
        if response.status_code == 200:
            try:
                data = response.json()
                if "followed" in data:
                    self.log_test("Follow User", True, f"User followed: {data['followed']}")
                    return True
                else:
                    self.log_test("Follow User", False, f"Invalid follow response: {data}")
                    return False
            except json.JSONDecodeError:
                self.log_test("Follow User", False, "Invalid JSON response")
                return False
        else:
            self.log_test("Follow User", False, f"HTTP {response.status_code}: {response.text}")
            return False
    
    def test_discover_trending(self):
        """Test discover trending"""
        success, response, error = self.make_request("GET", "/discover/trending")
        
        if not success:
            self.log_test("Discover Trending", False, f"Request failed: {error}")
            return False
            
        if response.status_code == 200:
            try:
                data = response.json()
                if "hashtags" in data and "videos" in data:
                    hashtag_count = len(data["hashtags"])
                    video_count = len(data["videos"])
                    self.log_test("Discover Trending", True, f"Trending data: {hashtag_count} hashtags, {video_count} videos")
                    return True
                else:
                    self.log_test("Discover Trending", False, f"Invalid trending response: {data}")
                    return False
            except json.JSONDecodeError:
                self.log_test("Discover Trending", False, "Invalid JSON response")
                return False
        else:
            self.log_test("Discover Trending", False, f"HTTP {response.status_code}: {response.text}")
            return False
    
    def test_discover_creators(self):
        """Test discover creators"""
        success, response, error = self.make_request("GET", "/discover/creators")
        
        if not success:
            self.log_test("Discover Creators", False, f"Request failed: {error}")
            return False
            
        if response.status_code == 200:
            try:
                data = response.json()
                if isinstance(data, list):
                    creator_count = len(data)
                    self.log_test("Discover Creators", True, f"Creators retrieved: {creator_count} creators")
                    return True
                else:
                    self.log_test("Discover Creators", False, f"Invalid creators response: {data}")
                    return False
            except json.JSONDecodeError:
                self.log_test("Discover Creators", False, "Invalid JSON response")
                return False
        else:
            self.log_test("Discover Creators", False, f"HTTP {response.status_code}: {response.text}")
            return False
    
    def test_search(self):
        """Test search functionality"""
        success, response, error = self.make_request("GET", "/search?q=dance")
        
        if not success:
            self.log_test("Search", False, f"Request failed: {error}")
            return False
            
        if response.status_code == 200:
            try:
                data = response.json()
                if "users" in data and "videos" in data:
                    user_count = len(data["users"])
                    video_count = len(data["videos"])
                    self.log_test("Search", True, f"Search results: {user_count} users, {video_count} videos")
                    return True
                else:
                    self.log_test("Search", False, f"Invalid search response: {data}")
                    return False
            except json.JSONDecodeError:
                self.log_test("Search", False, "Invalid JSON response")
                return False
        else:
            self.log_test("Search", False, f"HTTP {response.status_code}: {response.text}")
            return False
    
    def test_notifications(self):
        """Test notifications"""
        if not self.user2_token:
            self.log_test("Notifications", False, "No user2 token available")
            return False
            
        headers = {"Authorization": f"Bearer {self.user2_token}"}
        success, response, error = self.make_request("GET", "/notifications", headers=headers)
        
        if not success:
            self.log_test("Notifications", False, f"Request failed: {error}")
            return False
            
        if response.status_code == 200:
            try:
                data = response.json()
                if isinstance(data, list):
                    notification_count = len(data)
                    self.log_test("Notifications", True, f"Notifications retrieved: {notification_count} notifications")
                    return True
                else:
                    self.log_test("Notifications", False, f"Invalid notifications response: {data}")
                    return False
            except json.JSONDecodeError:
                self.log_test("Notifications", False, "Invalid JSON response")
                return False
        else:
            self.log_test("Notifications", False, f"HTTP {response.status_code}: {response.text}")
            return False
    
    def run_all_tests(self):
        """Run all tests in sequence"""
        print(f"🚀 Starting KdM Backend API Tests")
        print(f"📡 Backend URL: {BACKEND_URL}")
        print("=" * 60)
        
        # Test sequence following the review request flow
        tests = [
            ("Health Check", self.test_health_check),
            ("Auth Register", self.test_auth_register),
            ("Auth Login", self.test_auth_login),
            ("Auth Me", self.test_auth_me),
            ("Create Video", self.test_create_video),
            ("Get Feed", self.test_get_feed),
            ("Like Video", self.test_like_video),
            ("Bookmark Video", self.test_bookmark_video),
            ("Create Comment", self.test_create_comment),
            ("Get Comments", self.test_get_comments),
            ("Follow User", self.test_follow_user),
            ("Discover Trending", self.test_discover_trending),
            ("Discover Creators", self.test_discover_creators),
            ("Search", self.test_search),
            ("Notifications", self.test_notifications),
        ]
        
        passed = 0
        failed = 0
        
        for test_name, test_func in tests:
            try:
                if test_func():
                    passed += 1
                else:
                    failed += 1
            except Exception as e:
                self.log_test(test_name, False, f"Exception: {str(e)}")
                failed += 1
            
            # Small delay between tests
            time.sleep(0.5)
        
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {passed} passed, {failed} failed")
        
        if failed > 0:
            print("\n❌ Failed Tests:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  • {result['test']}: {result['details']}")
        
        return failed == 0


def main():
    """Main test runner"""
    tester = KdMAPITester()
    success = tester.run_all_tests()
    
    if success:
        print("\n🎉 All tests passed! KdM backend is working correctly.")
        sys.exit(0)
    else:
        print("\n💥 Some tests failed. Check the details above.")
        sys.exit(1)


if __name__ == "__main__":
    main()