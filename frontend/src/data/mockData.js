// KdM - Mock Data

export const currentUser = {
  id: 'user_self',
  username: 'alex_kdm',
  displayName: 'Alex Creator',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face',
  bio: 'Digital creator | KdM original ✨',
  followers: 12500,
  following: 348,
  likes: 89400,
  verified: true,
  videos: []
};

export const users = [
  {
    id: 'user_1',
    username: 'dance_queen',
    displayName: 'Maria Dance',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
    bio: 'Professional dancer | 1M+ family 💫',
    followers: 1200000,
    following: 234,
    likes: 45000000,
    verified: true
  },
  {
    id: 'user_2',
    username: 'chef_marco',
    displayName: 'Chef Marco',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    bio: 'Cooking made simple 🍳 New recipes daily',
    followers: 890000,
    following: 156,
    likes: 32000000,
    verified: true
  },
  {
    id: 'user_3',
    username: 'tech_bytes',
    displayName: 'Tech Bytes',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    bio: 'Tech tips in 60 seconds ⚡',
    followers: 2300000,
    following: 89,
    likes: 78000000,
    verified: true
  },
  {
    id: 'user_4',
    username: 'travel_vibes',
    displayName: 'Luna Travel',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    bio: 'Exploring the world one clip at a time 🌍',
    followers: 560000,
    following: 412,
    likes: 18000000,
    verified: false
  },
  {
    id: 'user_5',
    username: 'fitness_pro',
    displayName: 'Jake Fitness',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    bio: 'Transform your body 💪 Daily workouts',
    followers: 3400000,
    following: 67,
    likes: 120000000,
    verified: true
  },
  {
    id: 'user_6',
    username: 'art_studio',
    displayName: 'Mia Art',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
    bio: 'Digital art & illustrations ✨',
    followers: 780000,
    following: 203,
    likes: 25000000,
    verified: false
  },
  {
    id: 'user_7',
    username: 'comedy_king',
    displayName: 'Dan Comedy',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face',
    bio: 'Making you laugh since 2020 😂',
    followers: 5600000,
    following: 145,
    likes: 230000000,
    verified: true
  },
  {
    id: 'user_8',
    username: 'music_vibes',
    displayName: 'Sophie Music',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
    bio: 'Singer & songwriter | New single out now',
    followers: 4200000,
    following: 98,
    likes: 180000000,
    verified: true
  }
];

export const videos = [
  {
    id: 'vid_1',
    user: users[0],
    description: 'New choreography alert! 🔥 This one took 3 days to perfect #dance #viral #fyp',
    music: 'Original Sound - Maria Dance',
    likes: 234000,
    comments: 4500,
    shares: 12000,
    bookmarks: 8900,
    views: 2400000,
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnail: 'https://images.unsplash.com/photo-1547153760-18fc86324498?w=400&h=700&fit=crop',
    hashtags: ['dance', 'viral', 'fyp'],
    createdAt: '2h ago'
  },
  {
    id: 'vid_2',
    user: users[1],
    description: 'Easy pasta recipe in under 60 seconds! 🍝 #cooking #recipe #foodtok',
    music: 'Cooking Vibes - Lofi Kitchen',
    likes: 567000,
    comments: 8900,
    shares: 34000,
    bookmarks: 45000,
    views: 5600000,
    videoUrl: 'https://www.youtube.com/watch?v=ScMzIvxBSi4',
    thumbnail: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=700&fit=crop',
    hashtags: ['cooking', 'recipe', 'foodtok'],
    createdAt: '4h ago'
  },
  {
    id: 'vid_3',
    user: users[2],
    description: 'iPhone hidden feature you NEED to know! 📱 #tech #iphone #tips',
    music: 'Tech Beat - Digital Sounds',
    likes: 890000,
    comments: 12000,
    shares: 56000,
    bookmarks: 78000,
    views: 8900000,
    videoUrl: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
    thumbnail: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=700&fit=crop',
    hashtags: ['tech', 'iphone', 'tips'],
    createdAt: '6h ago'
  },
  {
    id: 'vid_4',
    user: users[3],
    description: 'Sunrise in Santorini hits different ☀️ #travel #greece #wanderlust',
    music: 'Paradise - Coldplay',
    likes: 123000,
    comments: 2300,
    shares: 8900,
    bookmarks: 15000,
    views: 1200000,
    videoUrl: 'https://www.youtube.com/watch?v=1G4isv_Fylg',
    thumbnail: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=400&h=700&fit=crop',
    hashtags: ['travel', 'greece', 'wanderlust'],
    createdAt: '8h ago'
  },
  {
    id: 'vid_5',
    user: users[4],
    description: '5 minute ab workout - no equipment needed! 💪 #fitness #workout #abs',
    music: 'Workout Mix - DJ Pump',
    likes: 456000,
    comments: 6700,
    shares: 23000,
    bookmarks: 56000,
    views: 4500000,
    videoUrl: 'https://www.youtube.com/watch?v=ml6cT4AZdqI',
    thumbnail: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=700&fit=crop',
    hashtags: ['fitness', 'workout', 'abs'],
    createdAt: '10h ago'
  },
  {
    id: 'vid_6',
    user: users[5],
    description: 'Digital painting timelapse - 8 hours in 60 seconds 🎨 #art #digitalart #painting',
    music: 'Lo-fi Chill - Art Beats',
    likes: 345000,
    comments: 5600,
    shares: 18000,
    bookmarks: 34000,
    views: 3400000,
    videoUrl: 'https://www.youtube.com/watch?v=2SUvWfNJSsM',
    thumbnail: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400&h=700&fit=crop',
    hashtags: ['art', 'digitalart', 'painting'],
    createdAt: '12h ago'
  },
  {
    id: 'vid_7',
    user: users[6],
    description: 'POV: When your mom finds your report card 😂 #comedy #funny #relatable',
    music: 'Oh No - Kreepa',
    likes: 1200000,
    comments: 23000,
    shares: 89000,
    bookmarks: 45000,
    views: 12000000,
    videoUrl: 'https://www.youtube.com/watch?v=Hr_9b-Lt-pk',
    thumbnail: 'https://images.unsplash.com/photo-1586105449897-20b5efeb3233?w=400&h=700&fit=crop',
    hashtags: ['comedy', 'funny', 'relatable'],
    createdAt: '14h ago'
  },
  {
    id: 'vid_8',
    user: users[7],
    description: 'Acoustic cover of the week! Let me know what you think 🎵 #music #cover #singing',
    music: 'Original Sound - Sophie Music',
    likes: 678000,
    comments: 9800,
    shares: 34000,
    bookmarks: 56000,
    views: 6700000,
    videoUrl: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk',
    thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=700&fit=crop',
    hashtags: ['music', 'cover', 'singing'],
    createdAt: '16h ago'
  }
];

export const trendingHashtags = [
  { tag: 'fyp', posts: '234.5B', icon: 'flame' },
  { tag: 'viral', posts: '189.2B', icon: 'zap' },
  { tag: 'dance', posts: '98.7B', icon: 'music' },
  { tag: 'comedy', posts: '87.3B', icon: 'smile' },
  { tag: 'cooking', posts: '56.8B', icon: 'chef-hat' },
  { tag: 'fitness', posts: '45.2B', icon: 'dumbbell' },
  { tag: 'travel', posts: '34.1B', icon: 'plane' },
  { tag: 'tech', posts: '28.9B', icon: 'cpu' },
  { tag: 'art', posts: '23.4B', icon: 'palette' },
  { tag: 'music', posts: '67.8B', icon: 'headphones' },
  { tag: 'fashion', posts: '41.2B', icon: 'shirt' },
  { tag: 'pets', posts: '52.3B', icon: 'heart' }
];

export const discoverCategories = [
  { id: 'all', label: 'All' },
  { id: 'trending', label: 'Trending' },
  { id: 'dance', label: 'Dance' },
  { id: 'comedy', label: 'Comedy' },
  { id: 'food', label: 'Food' },
  { id: 'sports', label: 'Sports' },
  { id: 'music', label: 'Music' },
  { id: 'art', label: 'Art' },
  { id: 'gaming', label: 'Gaming' },
  { id: 'education', label: 'Education' }
];

export const comments = [
  { id: 'c1', user: users[0], text: 'This is absolutely amazing! 🔥', likes: 2340, time: '2h', replies: 12 },
  { id: 'c2', user: users[1], text: 'How do you do this?? Tutorial please!', likes: 890, time: '3h', replies: 5 },
  { id: 'c3', user: users[2], text: 'Ive watched this 100 times already 😂', likes: 5600, time: '4h', replies: 23 },
  { id: 'c4', user: users[3], text: 'The talent is unreal', likes: 1200, time: '5h', replies: 8 },
  { id: 'c5', user: users[4], text: 'This made my day! ❤️', likes: 3400, time: '6h', replies: 15 },
  { id: 'c6', user: users[5], text: 'Song name please?? 🎵', likes: 780, time: '7h', replies: 34 },
  { id: 'c7', user: users[6], text: 'POV: youre addicted to this video', likes: 4500, time: '8h', replies: 19 },
  { id: 'c8', user: users[7], text: 'Bestie this is everything!! 💕', likes: 2100, time: '9h', replies: 7 }
];

export const suggestedAccounts = users.slice(0, 5);
export const followingAccounts = users.slice(3, 7);

export const notifications = [
  { id: 'n1', type: 'like', user: users[0], text: 'liked your video', time: '1m ago' },
  { id: 'n2', type: 'follow', user: users[1], text: 'started following you', time: '5m ago' },
  { id: 'n3', type: 'comment', user: users[2], text: 'commented: Amazing content!', time: '15m ago' },
  { id: 'n4', type: 'like', user: users[3], text: 'liked your video', time: '30m ago' },
  { id: 'n5', type: 'share', user: users[4], text: 'shared your video', time: '1h ago' }
];

export const formatNumber = (num) => {
  if (num >= 1000000000) return (num / 1000000000).toFixed(1) + 'B';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};
