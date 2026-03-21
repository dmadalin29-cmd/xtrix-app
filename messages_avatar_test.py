#!/usr/bin/env python3
"""
Messages and Avatar Upload API Testing Script
Tests the specific endpoints requested in the review.
"""

import requests
import json
import os
import tempfile
from PIL import Image
import io

# Use the production URL from frontend/.env
BASE_URL = "https://pulse-feed-6.preview.emergentagent.com/api"

def create_test_image():
    """Create a simple test image for avatar upload"""
    img = Image.new('RGB', (100, 100), color='red')
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='PNG')
    img_bytes.seek(0)
    return img_bytes

def test_messages_and_avatar_endpoints():
    """Test the complete Messages and Avatar upload flow as specified"""
    print("🧪 Testing Messages and Avatar Upload Endpoints")
    print("=" * 60)
    
    # Step 1: Register User A
    print("\n1. 📝 Registering User A...")
    user_a_data = {
        "username": "msg_user_a",
        "email": "a@msg.com", 
        "password": "test123",
        "displayName": "User A"
    }
    
    response = requests.post(f"{BASE_URL}/auth/register", json=user_a_data)
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        user_a_response = response.json()
        user_a_token = user_a_response.get("token")
        user_a_id = user_a_response.get("user", {}).get("id")
        print(f"   ✅ User A registered successfully. ID: {user_a_id}")
    else:
        print(f"   ❌ Failed to register User A: {response.text}")
        return False
    
    # Step 2: Register User B
    print("\n2. 📝 Registering User B...")
    user_b_data = {
        "username": "msg_user_b",
        "email": "b@msg.com",
        "password": "test123", 
        "displayName": "User B"
    }
    
    response = requests.post(f"{BASE_URL}/auth/register", json=user_b_data)
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        user_b_response = response.json()
        user_b_token = user_b_response.get("token")
        user_b_id = user_b_response.get("user", {}).get("id")
        print(f"   ✅ User B registered successfully. ID: {user_b_id}")
    else:
        print(f"   ❌ Failed to register User B: {response.text}")
        return False
    
    # Step 3: Create Conversation
    print("\n3. 💬 Creating conversation between User A and User B...")
    headers_a = {"Authorization": f"Bearer {user_a_token}"}
    
    response = requests.post(
        f"{BASE_URL}/messages/conversations",
        headers=headers_a,
        params={"target_user_id": user_b_id}
    )
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        conversation = response.json()
        conversation_id = conversation.get("id")
        print(f"   ✅ Conversation created successfully. ID: {conversation_id}")
        print(f"   📋 Conversation details: {json.dumps(conversation, indent=2)}")
    else:
        print(f"   ❌ Failed to create conversation: {response.text}")
        return False
    
    # Step 4: Send Message from User A
    print("\n4. 📤 Sending message from User A...")
    response = requests.post(
        f"{BASE_URL}/messages/conversations/{conversation_id}/messages",
        headers=headers_a,
        params={"text": "Hello User B"}
    )
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        message_a = response.json()
        print(f"   ✅ Message sent successfully from User A")
        print(f"   📋 Message details: {json.dumps(message_a, indent=2)}")
    else:
        print(f"   ❌ Failed to send message from User A: {response.text}")
        return False
    
    # Step 5: Send Message from User B
    print("\n5. 📤 Sending message from User B...")
    headers_b = {"Authorization": f"Bearer {user_b_token}"}
    
    response = requests.post(
        f"{BASE_URL}/messages/conversations/{conversation_id}/messages",
        headers=headers_b,
        params={"text": "Hey User A!"}
    )
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        message_b = response.json()
        print(f"   ✅ Message sent successfully from User B")
        print(f"   📋 Message details: {json.dumps(message_b, indent=2)}")
    else:
        print(f"   ❌ Failed to send message from User B: {response.text}")
        return False
    
    # Step 6: Get Messages (User A perspective)
    print("\n6. 📥 Getting messages from User A perspective...")
    response = requests.get(
        f"{BASE_URL}/messages/conversations/{conversation_id}/messages",
        headers=headers_a
    )
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        messages_response = response.json()
        messages = messages_response.get("messages", [])
        print(f"   ✅ Retrieved {len(messages)} messages successfully")
        print(f"   📋 Messages: {json.dumps(messages_response, indent=2)}")
        
        # Verify both messages are present
        if len(messages) >= 2:
            print(f"   ✅ Both messages found in conversation")
        else:
            print(f"   ⚠️ Expected 2 messages, found {len(messages)}")
    else:
        print(f"   ❌ Failed to get messages: {response.text}")
        return False
    
    # Step 7: Get Conversations for User A
    print("\n7. 📋 Getting conversations for User A...")
    response = requests.get(f"{BASE_URL}/messages/conversations", headers=headers_a)
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        conversations_a = response.json()
        print(f"   ✅ Retrieved {len(conversations_a)} conversations for User A")
        print(f"   📋 Conversations: {json.dumps(conversations_a, indent=2)}")
        
        # Verify conversation exists with last message
        if len(conversations_a) >= 1:
            last_message = conversations_a[0].get("lastMessage", "")
            if "Hey User A!" in last_message:
                print(f"   ✅ Last message correctly shows User B's message")
            else:
                print(f"   ⚠️ Last message doesn't match expected: {last_message}")
    else:
        print(f"   ❌ Failed to get conversations for User A: {response.text}")
        return False
    
    # Step 8: Get Conversations for User B
    print("\n8. 📋 Getting conversations for User B...")
    response = requests.get(f"{BASE_URL}/messages/conversations", headers=headers_b)
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        conversations_b = response.json()
        print(f"   ✅ Retrieved {len(conversations_b)} conversations for User B")
        print(f"   📋 Conversations: {json.dumps(conversations_b, indent=2)}")
        
        # Check unread count (should be 0 since User A read the messages)
        if len(conversations_b) >= 1:
            unread_count = conversations_b[0].get("unread", 0)
            print(f"   📊 Unread count for User B: {unread_count}")
    else:
        print(f"   ❌ Failed to get conversations for User B: {response.text}")
        return False
    
    # Step 9: Avatar Upload for User A
    print("\n9. 🖼️ Testing avatar upload for User A...")
    
    # Create test image
    test_image = create_test_image()
    files = {"file": ("test_avatar.png", test_image, "image/png")}
    
    response = requests.post(
        f"{BASE_URL}/users/me/avatar",
        headers=headers_a,
        files=files
    )
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        avatar_response = response.json()
        avatar_url = avatar_response.get("avatar", "")
        print(f"   ✅ Avatar uploaded successfully")
        print(f"   🖼️ Avatar URL: {avatar_url}")
        print(f"   📋 User profile: {json.dumps(avatar_response, indent=2)}")
    else:
        print(f"   ❌ Failed to upload avatar: {response.text}")
        return False
    
    # Step 10: Update Profile for User A
    print("\n10. ✏️ Testing profile update for User A...")
    profile_update = {
        "displayName": "Updated Name A",
        "bio": "New bio!"
    }
    
    response = requests.put(
        f"{BASE_URL}/users/me",
        headers=headers_a,
        json=profile_update
    )
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        updated_profile = response.json()
        print(f"   ✅ Profile updated successfully")
        print(f"   📋 Updated profile: {json.dumps(updated_profile, indent=2)}")
        
        # Verify updates
        if updated_profile.get("displayName") == "Updated Name A":
            print(f"   ✅ Display name updated correctly")
        if updated_profile.get("bio") == "New bio!":
            print(f"   ✅ Bio updated correctly")
    else:
        print(f"   ❌ Failed to update profile: {response.text}")
        return False
    
    print("\n" + "=" * 60)
    print("🎉 All tests completed successfully!")
    return True

if __name__ == "__main__":
    try:
        success = test_messages_and_avatar_endpoints()
        if success:
            print("\n✅ ALL TESTS PASSED - Messages and Avatar endpoints working correctly")
        else:
            print("\n❌ SOME TESTS FAILED - Check output above for details")
    except Exception as e:
        print(f"\n💥 Test execution failed with error: {str(e)}")
        import traceback
        traceback.print_exc()