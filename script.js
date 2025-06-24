// Global variables
let currentImageId = null;
let comments = JSON.parse(localStorage.getItem('renovationComments')) || {};
let commentImagePreview = null;

// Hardcoded images for the gallery
const galleryImages = [
    {
        id: 'image1',
        src: 'https://i.imgur.com/2gs3eaN.jpg',
        title: 'Main Living Area',
        isHighPriority: true
    },
    {
        id: 'image2', 
        src: 'https://i.imgur.com/QZC8dBZ.jpg',
        title: 'Kitchen Space',
        isHighPriority: true
    },
    {
        id: 'image3',
        src: 'https://i.imgur.com/XLqnbuK.jpg',
        title: 'Dining Area',
        isHighPriority: false
    },
    {
        id: 'image4',
        src: 'https://i.imgur.com/xS605si.jpg',
        title: 'Bedroom',
        isHighPriority: true
    },
    {
        id: 'image5',
        src: 'https://i.imgur.com/rFp8q99.jpg',
        title: 'Bathroom',
        isHighPriority: false
    },
    {
        id: 'image6',
        src: 'https://i.imgur.com/kIkzSJm.jpg',
        title: 'Hallway/Entry',
        isHighPriority: false
    },
    {
        id: 'image7',
        src: 'https://i.imgur.com/cQOzMiK.jpg',
        title: 'Storage/Closet Area',
        isHighPriority: false
    },
    {
        id: 'image8',
        src: 'https://i.imgur.com/Nn1cK4j.jpg',
        title: 'Window/Natural Light',
        isHighPriority: true
    },
    {
        id: 'image9',
        src: 'https://i.imgur.com/yWSRYZD.jpg',
        title: 'Floor Details',
        isHighPriority: false
    },
    {
        id: 'image10',
        src: 'https://i.imgur.com/iTFf1PT.jpg',
        title: 'Wall/Paint Condition',
        isHighPriority: false
    },
    {
        id: 'image11',
        src: 'https://i.imgur.com/5ruAZyX.jpg',
        title: 'Ceiling Details',
        isHighPriority: false
    },
    {
        id: 'image12',
        src: 'https://i.imgur.com/nIx0tLq.jpg',
        title: 'Additional Space',
        isHighPriority: false
    },
    {
        id: 'image13',
        src: 'https://i.imgur.com/P5iD5bi.jpg',
        title: 'Overall Layout',
        isHighPriority: true
    }
];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadGalleryImages();
    loadComments();
    setupCommentImageUpload();
});

// Load hardcoded images into gallery
function loadGalleryImages() {
    const gallery = document.getElementById('current-gallery');
    
    galleryImages.forEach(imageData => {
        const galleryItem = createGalleryItem(imageData.src, imageData.title, imageData.id, imageData.isHighPriority);
        gallery.appendChild(galleryItem);
    });
}

// Create gallery item
function createGalleryItem(imageSrc, title, imageId, isHighPriority = false) {
    const galleryItem = document.createElement('div');
    galleryItem.className = 'gallery-item';
    galleryItem.setAttribute('data-src', imageSrc);
    galleryItem.setAttribute('data-id', imageId);
    
    galleryItem.innerHTML = `
        ${isHighPriority ? '<div class="priority-tag">High Priority</div>' : ''}
        <img src="${imageSrc}" alt="${title}" loading="lazy">
        <div class="image-overlay">
            <h3>${title}</h3>
        </div>
    `;
    
    // Add click handler for opening modal
    galleryItem.addEventListener('click', function(e) {
        openModal(imageSrc, imageId, title);
    });
    
    return galleryItem;
}

// Open modal
function openModal(imageSrc, imageId, imageTitle) {
    const modal = document.getElementById('image-modal');
    const modalImage = document.getElementById('modal-image');
    const modalTitle = document.getElementById('modal-title');
    
    modalImage.src = imageSrc;
    modalTitle.textContent = imageTitle;
    currentImageId = imageId;
    
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    loadImageComments(imageId);
}

// Close modal
function closeModal() {
    const modal = document.getElementById('image-modal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    currentImageId = null;
    
    // Clear comment form
    document.getElementById('comment-name').value = '';
    document.getElementById('comment-text').value = '';
    clearCommentImagePreview();
}

// Add comment
function addComment() {
    const nameInput = document.getElementById('comment-name');
    const textInput = document.getElementById('comment-text');
    const name = nameInput.value.trim();
    const text = textInput.value.trim();
    
    if (!name || !text) {
        alert('Please enter both your name and comment.');
        return;
    }
    
    if (!currentImageId) {
        alert('Error: No image selected.');
        return;
    }
    
    const comment = {
        id: Date.now().toString(),
        name: escapeHtml(name),
        text: escapeHtml(text),
        timestamp: new Date().toISOString(),
        imageAttachment: commentImagePreview ? commentImagePreview : null
    };
    
    if (!comments[currentImageId]) {
        comments[currentImageId] = [];
    }
    
    comments[currentImageId].push(comment);
    saveComments();
    
    // Clear form
    nameInput.value = '';
    textInput.value = '';
    clearCommentImagePreview();
    
    // Refresh comments display
    loadImageComments(currentImageId);
    
    showNotification('Comment posted successfully!');
}

// Display comment
function displayComment(comment) {
    const commentDiv = document.createElement('div');
    commentDiv.className = 'comment';
    commentDiv.setAttribute('data-comment-id', comment.id);
    
    const date = new Date(comment.timestamp).toLocaleDateString();
    const time = new Date(comment.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    let imageAttachmentHtml = '';
    if (comment.imageAttachment) {
        imageAttachmentHtml = `
            <div class="comment-image">
                <img src="${comment.imageAttachment}" alt="Reference image" onclick="openImageModal('${comment.imageAttachment}')">
            </div>
        `;
    }
    
    commentDiv.innerHTML = `
        <div class="comment-header">
            <strong>${comment.name}</strong>
            <span class="comment-date">${date} at ${time}</span>
            <button class="delete-comment-btn" onclick="deleteComment('${currentImageId}', '${comment.id}')" title="Delete comment">×</button>
        </div>
        <div class="comment-text">${comment.text}</div>
        ${imageAttachmentHtml}
    `;
    
    return commentDiv;
}

// Load comments for specific image
function loadImageComments(imageId) {
    const commentsList = document.getElementById('comments-list');
    commentsList.innerHTML = '';
    
    if (comments[imageId] && comments[imageId].length > 0) {
        comments[imageId].forEach(comment => {
            commentsList.appendChild(displayComment(comment));
        });
    } else {
        commentsList.innerHTML = '<p class="no-comments">No comments yet. Be the first to leave a comment!</p>';
    }
}

// Delete comment
function deleteComment(imageId, commentId) {
    if (confirm('Are you sure you want to delete this comment?')) {
        if (comments[imageId]) {
            comments[imageId] = comments[imageId].filter(comment => comment.id !== commentId);
            saveComments();
            loadImageComments(imageId);
            showNotification('Comment deleted successfully!');
        }
    }
}

// Save comments to localStorage
function saveComments() {
    localStorage.setItem('renovationComments', JSON.stringify(comments));
}

// Load comments from localStorage
function loadComments() {
    const savedComments = localStorage.getItem('renovationComments');
    if (savedComments) {
        comments = JSON.parse(savedComments);
    }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

// Show notification
function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    
    // Style the notification
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #2c3e50;
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 10000;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        transform: translateX(400px);
        transition: transform 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Animate out and remove
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Setup comment image upload
function setupCommentImageUpload() {
    const imageInput = document.getElementById('comment-image');
    const imageLabel = document.querySelector('.image-upload-label');
    
    imageInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(event) {
                commentImagePreview = event.target.result;
                showCommentImagePreview(event.target.result);
            };
            reader.readAsDataURL(file);
        }
    });
    
    imageLabel.addEventListener('click', function() {
        imageInput.click();
    });
}

// Show comment image preview
function showCommentImagePreview(imageSrc) {
    const previewDiv = document.getElementById('comment-image-preview');
    previewDiv.innerHTML = `
        <div class="preview-image">
            <img src="${imageSrc}" alt="Preview">
            <button type="button" onclick="clearCommentImagePreview()" class="remove-preview">×</button>
        </div>
    `;
    previewDiv.style.display = 'block';
}

// Clear comment image preview
function clearCommentImagePreview() {
    const previewDiv = document.getElementById('comment-image-preview');
    const imageInput = document.getElementById('comment-image');
    previewDiv.innerHTML = '';
    previewDiv.style.display = 'none';
    imageInput.value = '';
    commentImagePreview = null;
}

// Open image in modal (for comment attachments)
function openImageModal(imageSrc) {
    const modal = document.createElement('div');
    modal.className = 'image-attachment-modal';
    modal.style.cssText = `
        display: flex;
        position: fixed;
        z-index: 10001;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0,0,0,0.9);
        justify-content: center;
        align-items: center;
    `;
    
    modal.innerHTML = `
        <div style="position: relative; max-width: 90%; max-height: 90%;">
            <img src="${imageSrc}" style="max-width: 100%; max-height: 100%; object-fit: contain;">
            <button onclick="this.closest('.image-attachment-modal').remove()" 
                    style="position: absolute; top: -40px; right: 0; background: none; border: none; color: white; font-size: 30px; cursor: pointer;">×</button>
        </div>
    `;
    
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    });
    
    document.body.appendChild(modal);
}

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    const modal = document.getElementById('image-modal');
    if (event.target === modal) {
        closeModal();
    }
});

// Keyboard navigation
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeModal();
    }
}); 