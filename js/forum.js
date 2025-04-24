// Sample posts data
let posts = [
    {
        id: 1,
        title: "Welcome to our Community Forum!",
        content: "This is our first post in the community forum. Here, we can share ideas, discuss topics, and learn from each other.",
        author: "Admin",
        isAnonymous: false,
        timestamp: new Date(2024, 2, 15, 10, 30),
        votes: 15,
        comments: [
            {
                author: "JohnDoe",
                content: "Excited to be part of this community!",
                timestamp: new Date(2024, 2, 15, 11, 0)
            }
        ]
    },
    {
        id: 2,
        title: "Community Guidelines",
        content: "To maintain a positive community atmosphere, please follow these rules:\n1. Be respectful to others\n2. No spam or self-promotion\n3. Follow relevant laws and regulations",
        author: "Admin",
        isAnonymous: false,
        timestamp: new Date(2024, 2, 15, 14, 20),
        votes: 10,
        comments: []
    },
    {
        id: 3,
        title: "Introducing Dark Mode Feature",
        content: "We're excited to announce that dark mode is coming soon! This has been one of our most requested features. The development is in progress and we expect to launch it next month.",
        author: "DevTeam",
        isAnonymous: false,
        timestamp: new Date(2024, 2, 16, 9, 15),
        votes: 45,
        comments: [
            {
                author: "TechEnthusiast",
                content: "Finally! Can't wait to try it out. Will it be customizable?",
                timestamp: new Date(2024, 2, 16, 10, 0)
            },
            {
                author: "NightOwl",
                content: "This is great news! Dark mode is easier on the eyes.",
                timestamp: new Date(2024, 2, 16, 10, 30)
            }
        ]
    },
    {
        id: 4,
        title: "Performance Optimization Request",
        content: "I've noticed some lag when loading large datasets. Here are some specific examples:\n1. Page load time > 3s on mobile\n2. Search results take too long\n\nAny plans to optimize these?",
        author: "WebDev",
        isAnonymous: false,
        timestamp: new Date(2024, 2, 17, 15, 45),
        votes: 32,
        comments: [
            {
                author: "OptimizationPro",
                content: "Have you tried clearing your cache? Also, which browser are you using?",
                timestamp: new Date(2024, 2, 17, 16, 0)
            }
        ]
    },
    {
        id: 5,
        title: "Mobile App Development Progress",
        content: "Just wanted to share an update on our mobile app development. We're currently in the final testing phase and expect to launch the beta version in two weeks!",
        author: "ProjectManager",
        isAnonymous: false,
        timestamp: new Date(2024, 2, 18, 11, 20),
        votes: 28,
        comments: [
            {
                author: "MobileUser",
                content: "Will it be available for both iOS and Android?",
                timestamp: new Date(2024, 2, 18, 11, 45)
            },
            {
                author: "BetaTester",
                content: "How can we join the beta testing program?",
                timestamp: new Date(2024, 2, 18, 12, 0)
            }
        ]
    }
];

// DOM Elements
const postsContainer = document.getElementById('posts-container');
const newPostBtn = document.querySelector('.new-post-btn');
const newPostModal = document.getElementById('newPostModal');
const newPostForm = document.getElementById('newPostForm');
const closeModal = document.querySelector('.close');

// Event Listeners
newPostBtn.addEventListener('click', openNewPostModal);
closeModal.addEventListener('click', closeNewPostModal);
newPostForm.addEventListener('submit', handleNewPost);

// Functions
function openNewPostModal() {
    const modal = document.getElementById('newPostModal');
    modal.style.display = 'block';
    // Trigger reflow to ensure transition works
    modal.offsetHeight;
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeNewPostModal() {
    const modal = document.getElementById('newPostModal');
    modal.classList.remove('show');
    // Wait for animation to complete before hiding
    setTimeout(() => {
        modal.style.display = 'none';
        document.body.style.overflow = '';
        document.getElementById('newPostForm').reset();
    }, 300); // Match the transition duration in CSS
}

// Close modal when clicking outside
document.addEventListener('click', function(event) {
    const modal = document.getElementById('newPostModal');
    if (event.target === modal) {
        closeNewPostModal();
    }
});

// Prevent modal close when clicking modal content
document.querySelector('.modal-content').addEventListener('click', function(event) {
    event.stopPropagation();
});

function handleNewPost(event) {
    event.preventDefault();
    
    const title = document.getElementById('postTitle').value;
    const content = document.getElementById('postContent').value;
    const isAnonymous = document.getElementById('anonymousPost').checked;
    
    const newPost = {
        id: posts.length + 1,
        title,
        content,
        author: isAnonymous ? "Anonymous" : "Current User",
        isAnonymous,
        timestamp: new Date(),
        votes: 0,
        comments: []
    };
    
    posts.unshift(newPost);
    renderPosts();
    closeNewPostModal();
    
    // Update total posts count
    const totalPostsElement = document.querySelector('.stat-value');
    totalPostsElement.textContent = posts.length;
}

// Format date for display
function formatDate(date) {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 60) {
        return minutes <= 1 ? "just now" : `${minutes}m ago`;
    } else if (hours < 24) {
        return `${hours}h ago`;
    } else if (days < 7) {
        return `${days}d ago`;
    } else {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}

// Create HTML for a single post
function createPostElement(post) {
    const postElement = document.createElement('div');
    postElement.className = 'post';
    postElement.dataset.postId = post.id;

    // Only show first 5 comments initially
    const initialComments = post.comments.slice(0, 5);
    const hasMoreComments = post.comments.length > 5;

    const commentsHtml = initialComments.map(comment => `
        <div class="comment">
            <div class="comment-meta">
                <span class="comment-author">${comment.author}</span>
                <span class="comment-date">${formatDate(comment.timestamp)}</span>
            </div>
            <div class="comment-text">${comment.content}</div>
        </div>
    `).join('');

    postElement.innerHTML = `
        <div class="post-header">
            <div class="post-votes">
                <button class="vote-btn upvote" onclick="handleVote(${post.id}, 1)">▲</button>
                <span class="vote-count">${post.votes}</span>
                <button class="vote-btn downvote" onclick="handleVote(${post.id}, -1)">▼</button>
            </div>
            <div class="post-content-wrapper">
                <h3 class="post-title">${post.title}</h3>
                <div class="post-meta">
                    <span>${post.isAnonymous ? 'Anonymous' : post.author}</span>
                    <span>•</span>
                    <span>${formatDate(post.timestamp)}</span>
                </div>
                <div class="post-text">${post.content}</div>
                <div class="post-actions">
                    <button class="action-btn" onclick="toggleComments(${post.id})">
                        <i class="fas fa-comment"></i>
                        Comments (${post.comments.length})
                    </button>
                    <button class="action-btn">
                        <i class="fas fa-share"></i>
                        Share
                    </button>
                </div>
                <div class="comments-section" data-loaded-all="${!hasMoreComments}">
                    ${commentsHtml}
                    ${hasMoreComments ? `
                        <button class="load-more-comments" onclick="loadMoreComments(${post.id})">
                            Load More Comments (${post.comments.length - 5} more)
                        </button>
                    ` : ''}
                </div>
            </div>
        </div>
    `;

    return postElement;
}

// Render all posts
function renderPosts() {
    const postsContainer = document.getElementById('posts-container');
    if (!postsContainer) return;

    // Sort posts by votes and timestamp
    const sortedPosts = [...posts].sort((a, b) => {
        if (b.votes !== a.votes) return b.votes - a.votes;
        return b.timestamp - a.timestamp;
    });

    postsContainer.innerHTML = '';
    sortedPosts.forEach(post => {
        postsContainer.appendChild(createPostElement(post));
    });

    // Update total posts count
    const totalPostsElement = document.querySelector('.stat-value');
    if (totalPostsElement) {
        totalPostsElement.textContent = posts.length;
    }
}

// Handle voting
function handleVote(postId, value) {
    const post = posts.find(p => p.id === postId);
    if (post) {
        post.votes += value;
        renderPosts();
    }
}

// Toggle comments visibility
function toggleComments(postId) {
    const post = document.querySelector(`.post[data-post-id="${postId}"]`);
    const commentsSection = post.querySelector('.comments-section');
    if (commentsSection) {
        commentsSection.classList.toggle('show');
    }
}

// Load more comments
function loadMoreComments(postId) {
    const post = posts.find(p => p.id === postId);
    const postElement = document.querySelector(`.post[data-post-id="${postId}"]`);
    const commentsSection = postElement.querySelector('.comments-section');
    const loadMoreBtn = commentsSection.querySelector('.load-more-comments');
    
    if (!post || !commentsSection || commentsSection.dataset.loadedAll === 'true') return;

    // Get current number of comments displayed
    const currentComments = commentsSection.querySelectorAll('.comment').length;
    
    // Get next batch of comments (5 more)
    const nextComments = post.comments.slice(currentComments, currentComments + 5);
    
    // Create and append new comments
    const newCommentsHtml = nextComments.map(comment => `
        <div class="comment">
            <div class="comment-meta">
                <span class="comment-author">${comment.author}</span>
                <span class="comment-date">${formatDate(comment.timestamp)}</span>
            </div>
            <div class="comment-text">${comment.content}</div>
        </div>
    `).join('');
    
    // Insert new comments before the "Load More" button
    loadMoreBtn.insertAdjacentHTML('beforebegin', newCommentsHtml);
    
    // Check if we've loaded all comments
    const remainingComments = post.comments.length - (currentComments + nextComments.length);
    if (remainingComments <= 0) {
        loadMoreBtn.remove();
        commentsSection.dataset.loadedAll = 'true';
    } else {
        loadMoreBtn.textContent = `Load More Comments (${remainingComments} more)`;
    }
}

// Initialize posts when the page loads
document.addEventListener('DOMContentLoaded', () => {
    renderPosts();
}); 