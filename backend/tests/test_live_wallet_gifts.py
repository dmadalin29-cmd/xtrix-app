"""
Backend API Tests for KdM - Live Streaming, Wallet, and Gifts Features
Tests: Live streaming endpoints, Wallet management, Gift system with 70/30 split
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://pulse-feed-6.preview.emergentagent.com')

# Test credentials
TEST_USER_EMAIL = "testlive1@kdm.com"
TEST_USER_PASSWORD = "pass123"


@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="module")
def auth_token(api_client):
    """Get authentication token for test user"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_USER_EMAIL,
        "password": TEST_USER_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("token")
    pytest.skip("Authentication failed - skipping authenticated tests")


@pytest.fixture(scope="module")
def authenticated_client(api_client, auth_token):
    """Session with auth header"""
    api_client.headers.update({"Authorization": f"Bearer {auth_token}"})
    return api_client


@pytest.fixture(scope="module")
def test_user_data(api_client, auth_token):
    """Get test user data"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_USER_EMAIL,
        "password": TEST_USER_PASSWORD
    })
    return response.json().get("user")


@pytest.fixture(scope="module")
def second_user(api_client):
    """Create or login second test user for gift testing"""
    unique_id = str(uuid.uuid4())[:8]
    # Try to register a new user
    register_response = api_client.post(f"{BASE_URL}/api/auth/register", json={
        "email": f"TEST_giftrecipient_{unique_id}@kdm.com",
        "username": f"TEST_recipient_{unique_id}",
        "password": "testpass123",
        "displayName": "Gift Recipient"
    })
    if register_response.status_code == 200:
        return register_response.json()
    # If registration fails, skip gift tests
    pytest.skip("Could not create second user for gift testing")


# ============== HEALTH CHECK ==============
class TestHealthCheck:
    """Basic health check tests"""
    
    def test_api_health(self, api_client):
        """Test API health endpoint"""
        response = api_client.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "ok"
        print("✓ API health check passed")

    def test_api_root(self, api_client):
        """Test API root endpoint"""
        response = api_client.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print("✓ API root endpoint passed")


# ============== LIVE STREAMING TESTS ==============
class TestLiveStreaming:
    """Live streaming endpoint tests"""
    
    def test_get_active_streams(self, api_client):
        """Test GET /api/live/active - Get active streams (no auth required)"""
        response = api_client.get(f"{BASE_URL}/api/live/active")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/live/active - Found {len(data)} active streams")

    def test_start_live_stream(self, authenticated_client, test_user_data):
        """Test POST /api/live/start - Start a live stream"""
        response = authenticated_client.post(
            f"{BASE_URL}/api/live/start",
            params={"title": "TEST_Live Stream", "category": "gaming"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Validate response structure
        assert "id" in data
        assert "title" in data
        assert data["title"] == "TEST_Live Stream"
        assert data["category"] == "gaming"
        assert data["active"] == True
        assert "hlsUrl" in data
        assert "user" in data
        
        # Store stream ID for later tests
        TestLiveStreaming.stream_id = data["id"]
        print(f"✓ POST /api/live/start - Created stream: {data['id']}")

    def test_get_stream_details(self, api_client):
        """Test GET /api/live/{stream_id} - Get stream details"""
        if not hasattr(TestLiveStreaming, 'stream_id'):
            pytest.skip("No stream created")
        
        response = api_client.get(f"{BASE_URL}/api/live/{TestLiveStreaming.stream_id}")
        assert response.status_code == 200
        data = response.json()
        
        assert data["id"] == TestLiveStreaming.stream_id
        assert "title" in data
        assert "user" in data
        print(f"✓ GET /api/live/{TestLiveStreaming.stream_id} - Stream details retrieved")

    def test_join_stream(self, api_client):
        """Test POST /api/live/{stream_id}/join - Join stream (increment viewers)"""
        if not hasattr(TestLiveStreaming, 'stream_id'):
            pytest.skip("No stream created")
        
        response = api_client.post(f"{BASE_URL}/api/live/{TestLiveStreaming.stream_id}/join")
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        print(f"✓ POST /api/live/{TestLiveStreaming.stream_id}/join - Joined stream")

    def test_leave_stream(self, api_client):
        """Test POST /api/live/{stream_id}/leave - Leave stream (decrement viewers)"""
        if not hasattr(TestLiveStreaming, 'stream_id'):
            pytest.skip("No stream created")
        
        response = api_client.post(f"{BASE_URL}/api/live/{TestLiveStreaming.stream_id}/leave")
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        print(f"✓ POST /api/live/{TestLiveStreaming.stream_id}/leave - Left stream")

    def test_like_stream(self, authenticated_client):
        """Test POST /api/live/{stream_id}/like - Like a stream"""
        if not hasattr(TestLiveStreaming, 'stream_id'):
            pytest.skip("No stream created")
        
        response = authenticated_client.post(f"{BASE_URL}/api/live/{TestLiveStreaming.stream_id}/like")
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        print(f"✓ POST /api/live/{TestLiveStreaming.stream_id}/like - Liked stream")

    def test_get_chat_messages(self, api_client):
        """Test GET /api/live/{stream_id}/chat - Get chat messages"""
        if not hasattr(TestLiveStreaming, 'stream_id'):
            pytest.skip("No stream created")
        
        response = api_client.get(f"{BASE_URL}/api/live/{TestLiveStreaming.stream_id}/chat")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/live/{TestLiveStreaming.stream_id}/chat - Got {len(data)} messages")

    def test_send_chat_message(self, authenticated_client):
        """Test POST /api/live/{stream_id}/chat - Send chat message"""
        if not hasattr(TestLiveStreaming, 'stream_id'):
            pytest.skip("No stream created")
        
        response = authenticated_client.post(
            f"{BASE_URL}/api/live/{TestLiveStreaming.stream_id}/chat",
            params={"text": "TEST_Hello from test!"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "id" in data
        assert data["text"] == "TEST_Hello from test!"
        assert "user" in data
        print(f"✓ POST /api/live/{TestLiveStreaming.stream_id}/chat - Sent message")

    def test_hls_playlist_not_ready(self, api_client):
        """Test GET /api/live/{stream_id}/stream.m3u8 - HLS playlist (404 if no chunks)"""
        if not hasattr(TestLiveStreaming, 'stream_id'):
            pytest.skip("No stream created")
        
        response = api_client.get(f"{BASE_URL}/api/live/{TestLiveStreaming.stream_id}/stream.m3u8")
        # Expected 404 since no video chunks uploaded
        assert response.status_code == 404
        print(f"✓ GET /api/live/{TestLiveStreaming.stream_id}/stream.m3u8 - Returns 404 (no chunks yet)")

    def test_upload_chunk_requires_auth(self, api_client):
        """Test POST /api/live/{stream_id}/upload-chunk - Requires authentication"""
        if not hasattr(TestLiveStreaming, 'stream_id'):
            pytest.skip("No stream created")
        
        # Remove auth header temporarily
        auth_header = api_client.headers.pop("Authorization", None)
        
        response = api_client.post(
            f"{BASE_URL}/api/live/{TestLiveStreaming.stream_id}/upload-chunk",
            files={"chunk": ("test.webm", b"fake video data", "video/webm")}
        )
        
        # Restore auth header
        if auth_header:
            api_client.headers["Authorization"] = auth_header
        
        assert response.status_code == 401
        print(f"✓ POST /api/live/{TestLiveStreaming.stream_id}/upload-chunk - Requires auth (401)")

    def test_end_live_stream(self, authenticated_client):
        """Test POST /api/live/{stream_id}/end - End live stream"""
        if not hasattr(TestLiveStreaming, 'stream_id'):
            pytest.skip("No stream created")
        
        response = authenticated_client.post(f"{BASE_URL}/api/live/{TestLiveStreaming.stream_id}/end")
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("success") == True
        assert "duration" in data
        assert "peakViewers" in data
        assert "totalLikes" in data
        print(f"✓ POST /api/live/{TestLiveStreaming.stream_id}/end - Stream ended, duration: {data['duration']}s")


# ============== WALLET TESTS ==============
class TestWallet:
    """Wallet management endpoint tests"""
    
    def test_get_wallet_balance(self, authenticated_client):
        """Test GET /api/wallet - Get wallet balance"""
        response = authenticated_client.get(f"{BASE_URL}/api/wallet")
        assert response.status_code == 200
        data = response.json()
        
        assert "balance" in data
        assert "totalEarned" in data
        assert "totalSpent" in data
        assert "conversionRates" in data
        assert data["conversionRates"]["purchase"] == 0.013
        assert data["conversionRates"]["withdrawal"] == 0.01
        
        # Store initial balance
        TestWallet.initial_balance = data["balance"]
        print(f"✓ GET /api/wallet - Balance: {data['balance']} coins")

    def test_get_transactions(self, authenticated_client):
        """Test GET /api/wallet/transactions - Get transaction history"""
        response = authenticated_client.get(f"{BASE_URL}/api/wallet/transactions")
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        print(f"✓ GET /api/wallet/transactions - Found {len(data)} transactions")

    def test_initiate_topup(self, authenticated_client):
        """Test POST /api/wallet/topup/initiate - Initiate top-up (Viva pending)"""
        response = authenticated_client.post(
            f"{BASE_URL}/api/wallet/topup/initiate",
            params={"amount_eur": 10}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "transactionId" in data
        assert "coins" in data
        assert data["amountEur"] == 10
        assert data["status"] == "pending"
        # 10 EUR / 0.013 = ~769 coins
        assert data["coins"] == int(10 / 0.013)
        print(f"✓ POST /api/wallet/topup/initiate - Would receive {data['coins']} coins for 10 EUR")

    def test_withdraw_insufficient_balance(self, authenticated_client):
        """Test POST /api/wallet/withdraw - Insufficient balance error"""
        response = authenticated_client.post(
            f"{BASE_URL}/api/wallet/withdraw",
            params={"amount": 999999}  # More than balance
        )
        assert response.status_code == 400
        data = response.json()
        assert "Insufficient" in data.get("detail", "")
        print(f"✓ POST /api/wallet/withdraw - Correctly rejects insufficient balance")

    def test_withdraw_success(self, authenticated_client):
        """Test POST /api/wallet/withdraw - Successful withdrawal"""
        # First check current balance
        balance_response = authenticated_client.get(f"{BASE_URL}/api/wallet")
        current_balance = balance_response.json()["balance"]
        
        if current_balance < 10:
            pytest.skip("Insufficient balance for withdrawal test")
        
        response = authenticated_client.post(
            f"{BASE_URL}/api/wallet/withdraw",
            params={"amount": 10}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] == True
        assert data["coinsWithdrawn"] == 10
        assert data["amountEur"] == 0.10  # 10 * 0.01
        assert data["newBalance"] == current_balance - 10
        print(f"✓ POST /api/wallet/withdraw - Withdrew 10 coins = 0.10 EUR")


# ============== GIFTS TESTS ==============
class TestGifts:
    """Gift system endpoint tests"""
    
    def test_get_all_gifts(self, api_client):
        """Test GET /api/gifts - Get all available gifts"""
        response = api_client.get(f"{BASE_URL}/api/gifts")
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        assert len(data) == 20  # Should have 20 gifts
        
        # Verify gift structure
        first_gift = data[0]
        assert "name" in first_gift
        assert "icon" in first_gift
        assert "cost" in first_gift
        assert "animation" in first_gift
        
        # Verify price range (1 to 15000 coins)
        costs = [g["cost"] for g in data]
        assert min(costs) == 1
        assert max(costs) == 15000
        
        # Store first gift for later tests
        TestGifts.cheapest_gift = data[0]
        print(f"✓ GET /api/gifts - Found {len(data)} gifts (cost range: {min(costs)}-{max(costs)} coins)")

    def test_send_gift_requires_auth(self, api_client):
        """Test POST /api/gifts/send - Requires authentication"""
        # Remove auth header temporarily
        auth_header = api_client.headers.pop("Authorization", None)
        
        response = api_client.post(
            f"{BASE_URL}/api/gifts/send",
            params={"recipient_id": "fake-id", "gift_id": "fake-gift"}
        )
        
        # Restore auth header
        if auth_header:
            api_client.headers["Authorization"] = auth_header
        
        assert response.status_code == 401
        print(f"✓ POST /api/gifts/send - Requires auth (401)")

    def test_send_gift_invalid_recipient(self, authenticated_client):
        """Test POST /api/gifts/send - Invalid recipient error"""
        if not hasattr(TestGifts, 'cheapest_gift'):
            pytest.skip("No gift data available")
        
        response = authenticated_client.post(
            f"{BASE_URL}/api/gifts/send",
            params={"recipient_id": "nonexistent-user-id", "gift_id": TestGifts.cheapest_gift.get("_id", "fake")}
        )
        assert response.status_code == 404
        print(f"✓ POST /api/gifts/send - Correctly rejects invalid recipient")

    def test_send_gift_success(self, authenticated_client, second_user):
        """Test POST /api/gifts/send - Successful gift sending with 70/30 split"""
        # Get gift list to find a valid gift ID
        gifts_response = authenticated_client.get(f"{BASE_URL}/api/gifts")
        gifts = gifts_response.json()
        
        if not gifts:
            pytest.skip("No gifts available")
        
        # Use cheapest gift (1 coin)
        gift = gifts[0]
        gift_id = gift.get("_id")
        
        if not gift_id:
            # Try to find gift by name
            pytest.skip("Gift ID not available in response")
        
        recipient_id = second_user["user"]["id"]
        
        # Get sender's balance before
        balance_before = authenticated_client.get(f"{BASE_URL}/api/wallet").json()["balance"]
        
        if balance_before < gift["cost"]:
            pytest.skip(f"Insufficient balance ({balance_before}) for gift ({gift['cost']})")
        
        response = authenticated_client.post(
            f"{BASE_URL}/api/gifts/send",
            params={"recipient_id": recipient_id, "gift_id": gift_id}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert data["success"] == True
        assert data["coinsSpent"] == gift["cost"]
        assert data["newBalance"] == balance_before - gift["cost"]
        
        # Verify 70/30 split
        expected_creator_share = int(gift["cost"] * 0.70)
        expected_platform_share = gift["cost"] - expected_creator_share
        assert data["creatorReceived"] == expected_creator_share
        assert data["platformFee"] == expected_platform_share
        
        print(f"✓ POST /api/gifts/send - Sent {gift['name']} ({gift['cost']} coins)")
        print(f"  Creator received: {data['creatorReceived']} coins (70%)")
        print(f"  Platform fee: {data['platformFee']} coins (30%)")

    def test_send_gift_insufficient_balance(self, authenticated_client, second_user):
        """Test POST /api/gifts/send - Insufficient balance error"""
        # Get most expensive gift
        gifts_response = authenticated_client.get(f"{BASE_URL}/api/gifts")
        gifts = gifts_response.json()
        
        # Find most expensive gift (15000 coins)
        expensive_gift = max(gifts, key=lambda g: g["cost"])
        gift_id = expensive_gift.get("_id")
        
        if not gift_id:
            pytest.skip("Gift ID not available")
        
        recipient_id = second_user["user"]["id"]
        
        response = authenticated_client.post(
            f"{BASE_URL}/api/gifts/send",
            params={"recipient_id": recipient_id, "gift_id": gift_id}
        )
        
        # Should fail due to insufficient balance (user has ~100 coins, gift costs 15000)
        assert response.status_code == 400
        data = response.json()
        assert "Insufficient" in data.get("detail", "")
        print(f"✓ POST /api/gifts/send - Correctly rejects insufficient balance for {expensive_gift['cost']} coin gift")


# ============== INTEGRATION TESTS ==============
class TestIntegration:
    """Integration tests for combined flows"""
    
    def test_new_user_gets_100_coins(self, api_client):
        """Test that new users receive 100 coins bonus at registration"""
        unique_id = str(uuid.uuid4())[:8]
        
        response = api_client.post(f"{BASE_URL}/api/auth/register", json={
            "email": f"TEST_newuser_{unique_id}@kdm.com",
            "username": f"TEST_newuser_{unique_id}",
            "password": "testpass123",
            "displayName": "New Test User"
        })
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify 100 coins bonus
        assert data["user"]["walletBalance"] == 100
        print(f"✓ New user registration - Received 100 coins bonus")

    def test_gift_creates_notification(self, authenticated_client, second_user):
        """Test that sending a gift creates a notification for recipient"""
        # Get gift list
        gifts_response = authenticated_client.get(f"{BASE_URL}/api/gifts")
        gifts = gifts_response.json()
        
        if not gifts:
            pytest.skip("No gifts available")
        
        gift = gifts[0]
        gift_id = gift.get("_id")
        
        if not gift_id:
            pytest.skip("Gift ID not available")
        
        recipient_id = second_user["user"]["id"]
        recipient_token = second_user["token"]
        
        # Send gift
        send_response = authenticated_client.post(
            f"{BASE_URL}/api/gifts/send",
            params={"recipient_id": recipient_id, "gift_id": gift_id}
        )
        
        if send_response.status_code != 200:
            pytest.skip("Gift sending failed")
        
        # Check recipient's notifications
        notif_response = requests.get(
            f"{BASE_URL}/api/notifications",
            headers={"Authorization": f"Bearer {recipient_token}"}
        )
        
        assert notif_response.status_code == 200
        notifications = notif_response.json()
        
        # Should have at least one gift notification
        gift_notifs = [n for n in notifications if n.get("type") == "gift"]
        assert len(gift_notifs) > 0
        print(f"✓ Gift notification created for recipient")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
