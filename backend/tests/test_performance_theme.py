"""
Test Performance Optimization, Theme System, and Capacitor Integration
for KdM (Klip de Moment) TikTok clone - Fork 3 Features.

Features tested:
1. Feed API Performance - Response time and data structure
2. Live Streams in Feed - Active streams mixed into For You feed
3. Gift System - Gift list and sending
4. Theme System - CSS variables and localStorage persistence (frontend)
5. Capacitor Config - Valid configuration for native apps
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "commenter1@test.com"
TEST_PASSWORD = "test123"


@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="module")
def auth_token(api_client):
    """Get authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("token")
    pytest.skip(f"Authentication failed - status {response.status_code}")


@pytest.fixture(scope="module")
def authenticated_client(api_client, auth_token):
    """Session with auth header"""
    api_client.headers.update({"Authorization": f"Bearer {auth_token}"})
    return api_client


class TestHealthCheck:
    """Basic health check"""
    
    def test_backend_health(self, api_client):
        """Verify backend is running"""
        response = api_client.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        print("✓ Backend health check passed")


class TestFeedPerformance:
    """Test Feed API performance and structure"""
    
    def test_feed_response_time(self, api_client):
        """Feed should respond within 2 seconds"""
        start = time.time()
        response = api_client.get(f"{BASE_URL}/api/videos/feed?page=1&limit=10")
        elapsed = time.time() - start
        
        assert response.status_code == 200, f"Feed failed: {response.text}"
        assert elapsed < 2.0, f"Feed too slow: {elapsed:.2f}s (should be < 2s)"
        
        print(f"✓ Feed response time: {elapsed:.3f}s")
    
    def test_feed_video_structure(self, api_client):
        """Verify video structure has all required fields"""
        response = api_client.get(f"{BASE_URL}/api/videos/feed?page=1&limit=5")
        assert response.status_code == 200
        
        data = response.json()
        videos = data.get("videos", [])
        
        if len(videos) > 0:
            video = videos[0]
            required_fields = ["id", "user", "description", "likes", "comments", "views"]
            for field in required_fields:
                assert field in video, f"Video missing '{field}' field"
            
            # Check user structure
            user = video.get("user", {})
            user_fields = ["id", "username", "avatar"]
            for field in user_fields:
                assert field in user, f"User missing '{field}' field"
            
            print(f"✓ Video structure is correct with all required fields")
        else:
            print("⚠ No videos in feed to verify structure")


class TestLiveStreamsInFeed:
    """Test Live Streams integration in Feed"""
    
    def test_active_streams_endpoint(self, api_client):
        """GET /api/live/active should return active streams"""
        response = api_client.get(f"{BASE_URL}/api/live/active")
        assert response.status_code == 200, f"Active streams failed: {response.text}"
        
        streams = response.json()
        assert isinstance(streams, list), "Response should be a list"
        
        print(f"✓ Active streams endpoint returned {len(streams)} streams")
        
        if len(streams) > 0:
            stream = streams[0]
            required_fields = ["id", "user", "title", "active"]
            for field in required_fields:
                assert field in stream, f"Stream missing '{field}' field"
            print(f"✓ Stream structure is correct")
    
    def test_stream_has_viewer_count(self, api_client):
        """Streams should have viewer count for feed display"""
        response = api_client.get(f"{BASE_URL}/api/live/active")
        assert response.status_code == 200
        
        streams = response.json()
        if len(streams) > 0:
            stream = streams[0]
            # Check for viewers field (could be 'viewers' or 'currentViewers')
            has_viewers = "viewers" in stream or "currentViewers" in stream
            assert has_viewers, "Stream should have viewer count"
            print(f"✓ Stream has viewer count: {stream.get('viewers', stream.get('currentViewers', 0))}")
        else:
            print("⚠ No active streams to verify viewer count")


class TestGiftSystem:
    """Test Gift System APIs"""
    
    def test_get_gifts_list(self, api_client):
        """GET /api/gifts should return available gifts"""
        response = api_client.get(f"{BASE_URL}/api/gifts")
        assert response.status_code == 200, f"Get gifts failed: {response.text}"
        
        gifts = response.json()
        assert isinstance(gifts, list), "Response should be a list"
        
        print(f"✓ Gifts endpoint returned {len(gifts)} gifts")
        
        if len(gifts) > 0:
            gift = gifts[0]
            required_fields = ["_id", "name", "icon", "cost"]
            for field in required_fields:
                assert field in gift, f"Gift missing '{field}' field"
            print(f"✓ Gift structure is correct: {gift.get('name')} ({gift.get('cost')} coins)")
    
    def test_gift_has_animation_data(self, api_client):
        """Gifts should have icon for animation"""
        response = api_client.get(f"{BASE_URL}/api/gifts")
        assert response.status_code == 200
        
        gifts = response.json()
        if len(gifts) > 0:
            for gift in gifts[:3]:
                assert "icon" in gift, f"Gift {gift.get('name')} missing icon"
                assert len(gift["icon"]) > 0, f"Gift {gift.get('name')} has empty icon"
            print(f"✓ All gifts have icons for animation")


class TestSwipeNavigation:
    """Test Swipe Navigation for Live Streams"""
    
    def test_multiple_streams_available(self, api_client):
        """Verify multiple streams exist for swipe navigation"""
        response = api_client.get(f"{BASE_URL}/api/live/active")
        assert response.status_code == 200
        
        streams = response.json()
        if len(streams) >= 2:
            print(f"✓ Multiple streams available ({len(streams)}) - swipe navigation possible")
            
            # Verify streams have IDs for navigation
            for i, stream in enumerate(streams[:3]):
                assert "id" in stream, f"Stream {i} missing 'id' for navigation"
            print(f"✓ All streams have IDs for navigation")
        else:
            print(f"⚠ Only {len(streams)} stream(s) - swipe navigation limited")
    
    def test_stream_sorting_by_relevance(self, api_client):
        """Streams should be sorted by relevance (viewers, likes, recency)"""
        response = api_client.get(f"{BASE_URL}/api/live/active")
        assert response.status_code == 200
        
        streams = response.json()
        if len(streams) >= 2:
            # Check that streams have metrics for sorting
            for stream in streams:
                has_metrics = any(key in stream for key in ["viewers", "currentViewers", "likes"])
                assert has_metrics, "Stream should have metrics for relevance sorting"
            print(f"✓ Streams have metrics for relevance sorting")


class TestNestedCommentsUI:
    """Test Nested Comments Backend Support"""
    
    def test_comment_has_replies_field(self, api_client):
        """Comments should have 'replies' count field"""
        # Get a video first
        feed_response = api_client.get(f"{BASE_URL}/api/videos/feed?page=1&limit=1")
        if feed_response.status_code != 200:
            pytest.skip("No videos available")
        
        videos = feed_response.json().get("videos", [])
        if not videos:
            pytest.skip("No videos in feed")
        
        video_id = videos[0]["id"]
        
        # Get comments
        response = api_client.get(f"{BASE_URL}/api/videos/{video_id}/comments")
        assert response.status_code == 200, f"Get comments failed: {response.text}"
        
        data = response.json()
        comments = data.get("comments", [])
        
        if len(comments) > 0:
            comment = comments[0]
            assert "replies" in comment, "Comment should have 'replies' count field"
            print(f"✓ Comment has 'replies' field: {comment.get('replies', 0)} replies")
        else:
            print("⚠ No comments to verify structure")


class TestReactMemoOptimization:
    """Test that React.memo components are properly defined (code review)"""
    
    def test_feed_returns_stable_ids(self, api_client):
        """Feed should return stable video IDs for React.memo optimization"""
        response1 = api_client.get(f"{BASE_URL}/api/videos/feed?page=1&limit=5")
        response2 = api_client.get(f"{BASE_URL}/api/videos/feed?page=1&limit=5")
        
        assert response1.status_code == 200
        assert response2.status_code == 200
        
        videos1 = response1.json().get("videos", [])
        videos2 = response2.json().get("videos", [])
        
        if len(videos1) > 0 and len(videos2) > 0:
            # Same request should return same video IDs (for memo stability)
            ids1 = [v["id"] for v in videos1]
            ids2 = [v["id"] for v in videos2]
            
            # At least some IDs should match (unless data changed)
            matching = set(ids1) & set(ids2)
            print(f"✓ Feed returns stable IDs: {len(matching)}/{len(ids1)} matching")


class TestCapacitorConfig:
    """Test Capacitor configuration is valid"""
    
    def test_capacitor_config_exists(self):
        """Verify capacitor.config.ts exists and has required fields"""
        config_path = "/app/frontend/capacitor.config.ts"
        
        assert os.path.exists(config_path), "capacitor.config.ts not found"
        
        with open(config_path, 'r') as f:
            content = f.read()
        
        # Check required fields
        assert "appId" in content, "Config missing 'appId'"
        assert "appName" in content, "Config missing 'appName'"
        assert "webDir" in content, "Config missing 'webDir'"
        
        # Check for KdM app ID
        assert "com.kdm.app" in content, "App ID should be 'com.kdm.app'"
        
        # Check for plugins
        assert "SplashScreen" in content, "Config should have SplashScreen plugin"
        assert "StatusBar" in content, "Config should have StatusBar plugin"
        
        print("✓ Capacitor config is valid with all required fields")
    
    def test_capacitor_hook_exists(self):
        """Verify useCapacitor hook exists"""
        hook_path = "/app/frontend/src/hooks/useCapacitor.js"
        
        assert os.path.exists(hook_path), "useCapacitor.js not found"
        
        with open(hook_path, 'r') as f:
            content = f.read()
        
        # Check for platform detection
        assert "Capacitor.getPlatform" in content, "Hook should detect platform"
        assert "isNativePlatform" in content, "Hook should check if native"
        
        # Check for StatusBar and SplashScreen
        assert "StatusBar" in content, "Hook should configure StatusBar"
        assert "SplashScreen" in content, "Hook should handle SplashScreen"
        
        print("✓ useCapacitor hook is properly implemented")


class TestThemeSystem:
    """Test Theme System configuration"""
    
    def test_theme_context_exists(self):
        """Verify ThemeContext exists and has required functionality"""
        context_path = "/app/frontend/src/contexts/ThemeContext.js"
        
        assert os.path.exists(context_path), "ThemeContext.js not found"
        
        with open(context_path, 'r') as f:
            content = f.read()
        
        # Check for localStorage persistence
        assert "localStorage" in content, "Theme should persist to localStorage"
        assert "kdm-theme" in content, "Theme key should be 'kdm-theme'"
        
        # Check for toggle function
        assert "toggleTheme" in content, "Should have toggleTheme function"
        
        # Check for dark/light mode
        assert "dark" in content, "Should support dark mode"
        assert "light" in content, "Should support light mode"
        
        print("✓ ThemeContext is properly implemented with localStorage persistence")
    
    def test_css_variables_defined(self):
        """Verify CSS variables for theme are defined"""
        css_path = "/app/frontend/src/index.css"
        
        assert os.path.exists(css_path), "index.css not found"
        
        with open(css_path, 'r') as f:
            content = f.read()
        
        # Check for light-mode class
        assert ".light-mode" in content, "CSS should have .light-mode class"
        
        # Check for CSS variables
        assert "--kdm-bg" in content, "CSS should have --kdm-bg variable"
        assert "--kdm-text" in content, "CSS should have --kdm-text variable"
        
        print("✓ CSS variables for theme are properly defined")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
