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
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}

// Create HTML for a single post
function createPostElement(post) {
    console.log('Creating post element for:', post);
    const postElement = document.createElement('div');
    postElement.className = 'post';
    postElement.setAttribute('data-post-id', post.id);
    
    postElement.innerHTML = `
        <div class="post-header">
            <div class="post-votes">
                <button class="vote-btn" onclick="handleVote('${post.id}', 'up')">
                    <i class="fas fa-arrow-up"></i>
                </button>
                <span class="vote-count">${post.upvotes || 0}</span>
                <button class="vote-btn" onclick="handleVote('${post.id}', 'down')">
                    <i class="fas fa-arrow-down"></i>
                </button>
            </div>
            <div class="post-info">
                <h3 class="post-title">${post.title}</h3>
                <div class="post-meta">
                    <span>Posted by ${post.anonymous ? 'Anonymous' : post.author_name}</span>
                    <span>${formatDate(post.created_at)}</span>
                    <span class="post-category">${post.category}</span>
                </div>
            </div>
        </div>
    `;
    return postElement;
}

// Fetch posts from Supabase
async function fetchPosts() {
    try {
        const { data: posts, error } = await window.supabaseClient
            .from('posts')
            .select(`
                *,
                comments (
                    *
                )
            `)
            .order('votes', { ascending: false })
            .order('created_at', { ascending: false });

        if (error) throw error;
        return posts;
    } catch (error) {
        console.error('Error fetching posts:', error);
        return [];
    }
}

// Update stats
async function updateStats() {
    try {
        // 获取总帖子数
        const { count: totalCount, error: totalError } = await window.supabaseClient
            .from('posts')
            .select('*', { count: 'exact' });

        if (totalError) throw totalError;

        // 获取已关闭帖子数
        const { count: closedCount, error: closedError } = await window.supabaseClient
            .from('posts')
            .select('*', { count: 'exact' })
            .eq('is_closed', true);

        if (closedError) throw closedError;

        // 更新显示
        document.getElementById('total-posts').textContent = totalCount || 0;
        document.getElementById('closed-posts').textContent = closedCount || 0;
    } catch (error) {
        console.error('Error updating stats:', error);
    }
}

// Render all posts
async function renderPosts() {
    const postsContainer = document.getElementById('posts-container');
    if (!postsContainer) {
        console.error('Posts container not found');
        return;
    }

    try {
        console.log('Fetching posts from Supabase...');
        
        // 检查 supabaseClient 是否存在
        if (!window.supabaseClient) {
            throw new Error('Supabase client not initialized');
        }

        // 获取所有帖子
        const { data: posts, error: postsError } = await window.supabaseClient
            .from('posts')
            .select('*')
            .order('created_at', { ascending: false });

        console.log('Supabase response:', { posts, error: postsError });

        if (postsError) {
            throw postsError;
        }

        // 清空并重新渲染帖子
        postsContainer.innerHTML = '';
        if (posts && posts.length > 0) {
            posts.forEach(post => {
                const postElement = createPostElement(post);
                postsContainer.appendChild(postElement);
            });
        } else {
            console.log('No posts found in the response');
            postsContainer.innerHTML = '<div class="no-posts">No posts yet</div>';
        }

        // 更新统计数据
        const totalPosts = posts ? posts.length : 0;
        const closedPosts = posts ? posts.filter(p => p.is_closed).length : 0;
        
        document.getElementById('total-posts').textContent = totalPosts;
        document.getElementById('closed-posts').textContent = closedPosts;

    } catch (error) {
        console.error('Error rendering posts:', error);
        postsContainer.innerHTML = `<div class="error-message">Failed to load posts: ${error.message}</div>`;
    }
}

// Handle new post submission
async function handleNewPost(event) {
    event.preventDefault();
    
    try {
        // 获取当前用户信息
        const { data: { user }, error: userError } = await window.supabaseClient.auth.getUser();
        if (userError) throw userError;
        if (!user) {
            alert('Please sign in to create a post');
            return;
        }

        // 获取表单数据
        const title = document.getElementById('postTitle').value;
        const category = document.getElementById('postCategory').value;
        const isAnonymous = document.getElementById('anonymousPost').checked;
        
        console.log('Creating new post with data:', {
            title,
            category,
            isAnonymous,
            userId: user.id
        });

        // 创建新帖子
        const { data: post, error: postError } = await window.supabaseClient
            .from('posts')
            .insert([{
                title: title,
                author_id: user.id,
                author_name: user.email, // 或者用户的显示名称
                anonymous: isAnonymous,
                upvotes: 0,
                created_at: new Date().toISOString(),
                category: category
            }])
            .select()
            .single();

        if (postError) throw postError;

        console.log('Post created successfully:', post);

        // 重新渲染帖子列表
        await renderPosts();
        closeNewPostModal();
    } catch (error) {
        console.error('Error creating post:', error);
        alert('Failed to create post. Please try again.');
    }
}

// Handle voting
async function handleVote(postId, value) {
    try {
        const { data: post, error: fetchError } = await window.supabaseClient
            .from('posts')
            .select('upvotes')
            .eq('id', postId)
            .single();

        if (fetchError) throw fetchError;

        const newVotes = post.upvotes + (value === 'up' ? 1 : -1);

        const { error: updateError } = await window.supabaseClient
            .from('posts')
            .update({ upvotes: newVotes })
            .eq('id', postId);

        if (updateError) throw updateError;

        await renderPosts();
    } catch (error) {
        console.error('Error updating vote:', error);
        alert('Failed to update vote. Please try again.');
    }
}

// Add comment
async function addComment(postId, content) {
    try {
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        // 检查帖子是否已关闭
        const { data: post, error: postError } = await window.supabaseClient
            .from('posts')
            .select('is_closed')
            .eq('id', postId)
            .single();

        if (postError) throw postError;
        if (post.is_closed) {
            alert('This post is closed and cannot receive new comments.');
            return;
        }

        const { data: comment, error } = await window.supabaseClient
            .from('comments')
            .insert([{
                post_id: postId,
                content,
                author: user.email,
                user_id: user.id,
                created_at: new Date().toISOString()
            }])
            .select();

        if (error) throw error;

        await renderPosts();
        return comment;
    } catch (error) {
        console.error('Error adding comment:', error);
        throw error;
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
async function loadMoreComments(postId) {
    const postElement = document.querySelector(`.post[data-post-id="${postId}"]`);
    const commentsSection = postElement.querySelector('.comments-section');
    const loadMoreBtn = commentsSection.querySelector('.load-more-comments');
    
    if (!commentsSection || commentsSection.dataset.loadedAll === 'true') return;

    try {
        const currentComments = commentsSection.querySelectorAll('.comment').length;
        
        const { data: comments, error } = await window.supabaseClient
            .from('comments')
            .select('*')
            .eq('post_id', postId)
            .order('created_at', { ascending: true })
            .range(currentComments, currentComments + 4);

        if (error) throw error;

        const newCommentsHtml = comments.map(comment => `
            <div class="comment">
                <div class="comment-meta">
                    <span class="comment-author">${comment.author}</span>
                    <span class="comment-date">${formatDate(comment.created_at)}</span>
                </div>
                <div class="comment-text">${comment.content}</div>
            </div>
        `).join('');

        loadMoreBtn.insertAdjacentHTML('beforebegin', newCommentsHtml);

        if (comments.length < 5) {
            loadMoreBtn.remove();
            commentsSection.dataset.loadedAll = 'true';
        }
    } catch (error) {
        console.error('Error loading more comments:', error);
        alert('Failed to load more comments. Please try again.');
    }
}

// Toggle post status
async function togglePostStatus(postId, currentStatus) {
    try {
        const { error } = await window.supabaseClient
            .from('posts')
            .update({ is_closed: !currentStatus })
            .eq('id', postId);

        if (error) throw error;
        await renderPosts();
    } catch (error) {
        console.error('Error toggling post status:', error);
        alert('Failed to update post status. Please try again.');
    }
}

// Initialize posts when the page loads
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Page loaded, initializing...');
    try {
        // 等待 Supabase 初始化
        if (!window.supabaseInitialized) {
            console.log('Waiting for Supabase initialization...');
            await new Promise(resolve => {
                const checkInit = setInterval(() => {
                    if (window.supabaseInitialized) {
                        clearInterval(checkInit);
                        resolve();
                    }
                }, 100);
            });
        }
        
        console.log('Supabase initialized, rendering posts...');
        await renderPosts();
    } catch (error) {
        console.error('Error during initialization:', error);
    }
}); 