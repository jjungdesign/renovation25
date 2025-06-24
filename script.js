// Global variables
let currentImageId = null;
let comments = JSON.parse(localStorage.getItem('renovationComments')) || {};
let savedImages = JSON.parse(localStorage.getItem('renovationImages')) || {
    'current-gallery': [],
    'reference-gallery': []
};
let draggedElement = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeGallery();
    setupFileUploads();
    loadComments();
    loadSavedImages();
    setupDragAndDrop();
});

// Initialize gallery functionality
function initializeGallery() {
    const galleryItems = document.querySelectorAll('.gallery-item');
    
    galleryItems.forEach(item => {
        item.addEventListener('click', function() {
            const imageSrc = this.getAttribute('data-src');
            const imageId = this.getAttribute('data-id');
            const imageTitle = this.querySelector('.image-overlay h3').textContent;
            
            openModal(imageSrc, imageId, imageTitle);
        });
    });
}

// Setup file upload functionality
function setupFileUploads() {
    const currentUpload = document.getElementById('current-upload');
    const referenceUpload = document.getElementById('reference-upload');
    
    currentUpload.addEventListener('change', function() {
        handleFileUpload(this.files, 'current-gallery');
    });
    
    referenceUpload.addEventListener('change', function() {
        handleFileUpload(this.files, 'reference-gallery');
    });
}

// Trigger file upload
function triggerFileUpload(type) {
    const uploadId = type === 'current' ? 'current-upload' : 'reference-upload';
    document.getElementById(uploadId).click();
}

// Handle file upload
function handleFileUpload(files, galleryId) {
    const gallery = document.getElementById(galleryId);
    
    Array.from(files).forEach((file, index) => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                const imageId = `${galleryId}-${Date.now()}-${index}`;
                const imageData = {
                    id: imageId,
                    src: e.target.result,
                    title: file.name,
                    galleryId: galleryId,
                    isHighPriority: false,
                    order: savedImages[galleryId].length
                };
                
                // Save to localStorage
                savedImages[galleryId].push(imageData);
                saveSavedImages();
                
                const galleryItem = createGalleryItem(e.target.result, file.name, imageId, false);
                gallery.appendChild(galleryItem);
                
                // Add fade-in animation
                setTimeout(() => {
                    galleryItem.classList.add('fade-in');
                }, 100);
            };
            
            reader.readAsDataURL(file);
        }
    });
}

// Create gallery item
function createGalleryItem(imageSrc, title, imageId, isHighPriority = false) {
    const galleryItem = document.createElement('div');
    galleryItem.className = 'gallery-item';
    galleryItem.setAttribute('data-src', imageSrc);
    galleryItem.setAttribute('data-id', imageId);
    galleryItem.setAttribute('draggable', 'true');
    
    galleryItem.innerHTML = `
        ${isHighPriority ? '<div class="priority-tag">High Priority</div>' : ''}
        <div class="photo-controls">
            <button class="control-btn priority-control" onclick="togglePriority('${imageId}')" title="Toggle Priority">
                ★
            </button>
            <button class="control-btn delete-control" onclick="deleteImageById('${imageId}')" title="Delete">
                ×
            </button>
        </div>
        <img src="${imageSrc}" alt="${title}" loading="lazy">
        <div class="image-overlay">
            <h3>${title}</h3>
        </div>
    `;
    
    // Add click handler for opening modal (but not on control buttons)
    galleryItem.addEventListener('click', function(e) {
        if (!e.target.closest('.photo-controls')) {
            openModal(imageSrc, imageId, title);
        }
    });
    
    // Add drag event listeners
    galleryItem.addEventListener('dragstart', handleDragStart);
    galleryItem.addEventListener('dragend', handleDragEnd);
    galleryItem.addEventListener('dragover', handleDragOver);
    galleryItem.addEventListener('drop', handleDrop);
    
    return galleryItem;
}

// Open modal
function openModal(imageSrc, imageId, imageTitle) {
    const modal = document.getElementById('image-modal');
    const modalImage = document.getElementById('modal-image');
    const modalTitle = document.getElementById('modal-title');
    const deleteBtn = document.getElementById('delete-image-btn');
    const priorityBtn = document.getElementById('priority-toggle-btn');
    
    modalImage.src = imageSrc;
    modalTitle.textContent = imageTitle;
    currentImageId = imageId;
    
    // Show controls only for uploaded images (not sample images)
    if (imageSrc.startsWith('data:') || !imageSrc.includes('unsplash.com')) {
        deleteBtn.style.display = 'block';
        priorityBtn.style.display = 'block';
        
        // Check if image is currently high priority
        let isHighPriority = false;
        Object.keys(savedImages).forEach(galleryId => {
            const imageData = savedImages[galleryId].find(img => img.id === imageId);
            if (imageData && imageData.isHighPriority) {
                isHighPriority = true;
            }
        });
        
        // Update priority button text and style
        if (isHighPriority) {
            priorityBtn.textContent = 'Remove High Priority';
            priorityBtn.classList.add('active');
        } else {
            priorityBtn.textContent = 'Mark as High Priority';
            priorityBtn.classList.remove('active');
        }
    } else {
        deleteBtn.style.display = 'none';
        priorityBtn.style.display = 'none';
    }
    
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
        id: Date.now(),
        author: name,
        text: text,
        date: new Date().toLocaleString()
    };
    
    // Initialize comments array for this image if it doesn't exist
    if (!comments[currentImageId]) {
        comments[currentImageId] = [];
    }
    
    comments[currentImageId].push(comment);
    saveComments();
    displayComment(comment);
    
    // Clear form
    nameInput.value = '';
    textInput.value = '';
    
    // Show success feedback
    showNotification('Comment added successfully!');
}

// Display comment
function displayComment(comment) {
    const commentsList = document.getElementById('comments-list');
    const commentElement = document.createElement('div');
    commentElement.className = 'comment fade-in';
    commentElement.setAttribute('data-comment-id', comment.id);
    
    commentElement.innerHTML = `
        <div class="comment-header">
            <span class="comment-author">${escapeHtml(comment.author)}</span>
            <div class="comment-meta">
                <span class="comment-date">${comment.date}</span>
                <button class="comment-delete" onclick="deleteComment('${currentImageId}', ${comment.id})">delete</button>
            </div>
        </div>
        <div class="comment-text">${escapeHtml(comment.text)}</div>
    `;
    
    commentsList.insertBefore(commentElement, commentsList.firstChild);
}

// Load comments for specific image
function loadImageComments(imageId) {
    const commentsList = document.getElementById('comments-list');
    commentsList.innerHTML = '';
    
    if (comments[imageId]) {
        comments[imageId].forEach(comment => {
            displayComment(comment);
        });
    }
}

// Delete comment
function deleteComment(imageId, commentId) {
    if (confirm('Are you sure you want to delete this comment?')) {
        // Remove from comments object
        if (comments[imageId]) {
            comments[imageId] = comments[imageId].filter(comment => comment.id !== commentId);
            saveComments();
            
            // Remove from DOM
            const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
            if (commentElement) {
                commentElement.remove();
            }
            
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
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        z-index: 2000;
        animation: slideIn 0.3s ease-out;
    `;
    notification.textContent = message;
    
    // Add animation keyframes
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    const modal = document.getElementById('image-modal');
    if (event.target === modal) {
        closeModal();
    }
});

// Handle keyboard events
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeModal();
    }
});

// Handle Enter key in comment form
document.getElementById('comment-text').addEventListener('keydown', function(event) {
    if (event.key === 'Enter' && event.ctrlKey) {
        addComment();
    }
});

// Lazy loading for images
function setupLazyLoading() {
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            });
        });

        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }
}

// Initialize lazy loading
setupLazyLoading();

// Add smooth scrolling for better UX
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add loading indicator for file uploads
function showLoadingIndicator() {
    const loading = document.createElement('div');
    loading.id = 'loading-indicator';
    loading.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(255, 255, 255, 0.95);
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        z-index: 2000;
        text-align: center;
    `;
    loading.innerHTML = `
        <div style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #667eea; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 10px;"></div>
        <p>Uploading images...</p>
    `;
    
    // Add spin animation
    if (!document.querySelector('#loading-styles')) {
        const style = document.createElement('style');
        style.id = 'loading-styles';
        style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(loading);
    return loading;
}

function hideLoadingIndicator(loading) {
    if (loading && loading.parentNode) {
        loading.parentNode.removeChild(loading);
    }
}

// Save images to localStorage
function saveSavedImages() {
    try {
        localStorage.setItem('renovationImages', JSON.stringify(savedImages));
    } catch (e) {
        if (e.name === 'QuotaExceededError') {
            alert('Storage limit reached. Please delete some images or use smaller file sizes.');
        }
    }
}

// Load saved images from localStorage
function loadSavedImages() {
    Object.keys(savedImages).forEach(galleryId => {
        const gallery = document.getElementById(galleryId);
        if (gallery && savedImages[galleryId].length > 0) {
            // Clear all existing items (no more sample images)
            gallery.innerHTML = '';
            
            // Sort images by order
            const sortedImages = savedImages[galleryId].sort((a, b) => (a.order || 0) - (b.order || 0));
            
            // Load saved images
            sortedImages.forEach(imageData => {
                const galleryItem = createGalleryItem(
                    imageData.src, 
                    imageData.title, 
                    imageData.id, 
                    imageData.isHighPriority || false
                );
                gallery.appendChild(galleryItem);
            });
        }
    });
}

// Add function to delete an image
function deleteImage(imageId, galleryId) {
    // Remove from saved images
    savedImages[galleryId] = savedImages[galleryId].filter(img => img.id !== imageId);
    saveSavedImages();
    
    // Remove from DOM
    const galleryItem = document.querySelector(`[data-id="${imageId}"]`);
    if (galleryItem) {
        galleryItem.remove();
    }
    
    // Remove associated comments
    if (comments[imageId]) {
        delete comments[imageId];
        saveComments();
    }
    
    showNotification('Image deleted successfully!');
}

// Delete current image from modal
function deleteCurrentImage() {
    if (!currentImageId) return;
    
    if (confirm('Are you sure you want to delete this image? This action cannot be undone.')) {
        // Find which gallery this image belongs to
        let galleryId = null;
        Object.keys(savedImages).forEach(gId => {
            if (savedImages[gId].some(img => img.id === currentImageId)) {
                galleryId = gId;
            }
        });
        
        if (galleryId) {
            deleteImage(currentImageId, galleryId);
            closeModal();
        }
    }
}

// Delete image by ID (for individual delete buttons)
function deleteImageById(imageId) {
    if (confirm('Are you sure you want to delete this image? This action cannot be undone.')) {
        // Find which gallery this image belongs to
        let galleryId = null;
        Object.keys(savedImages).forEach(gId => {
            if (savedImages[gId].some(img => img.id === imageId)) {
                galleryId = gId;
            }
        });
        
        if (galleryId) {
            deleteImage(imageId, galleryId);
        }
    }
}

// Toggle priority status
function togglePriority(imageId) {
    // Find which gallery this image belongs to
    let galleryId = null;
    let imageIndex = -1;
    
    Object.keys(savedImages).forEach(gId => {
        const index = savedImages[gId].findIndex(img => img.id === imageId);
        if (index !== -1) {
            galleryId = gId;
            imageIndex = index;
        }
    });
    
    if (galleryId && imageIndex !== -1) {
        // Toggle priority status
        savedImages[galleryId][imageIndex].isHighPriority = !savedImages[galleryId][imageIndex].isHighPriority;
        saveSavedImages();
        
        // Update the DOM
        const galleryItem = document.querySelector(`[data-id="${imageId}"]`);
        if (galleryItem) {
            const priorityTag = galleryItem.querySelector('.priority-tag');
            if (savedImages[galleryId][imageIndex].isHighPriority) {
                if (!priorityTag) {
                    const newPriorityTag = document.createElement('div');
                    newPriorityTag.className = 'priority-tag';
                    newPriorityTag.textContent = 'High Priority';
                    galleryItem.insertBefore(newPriorityTag, galleryItem.firstChild);
                }
            } else {
                if (priorityTag) {
                    priorityTag.remove();
                }
            }
        }
        
        showNotification(savedImages[galleryId][imageIndex].isHighPriority ? 'Set as high priority!' : 'Removed high priority');
    }
}

// Toggle priority for current image in modal
function toggleCurrentImagePriority() {
    if (!currentImageId) return;
    
    togglePriority(currentImageId);
    
    // Update the priority button in the modal
    const priorityBtn = document.getElementById('priority-toggle-btn');
    let isHighPriority = false;
    
    Object.keys(savedImages).forEach(galleryId => {
        const imageData = savedImages[galleryId].find(img => img.id === currentImageId);
        if (imageData && imageData.isHighPriority) {
            isHighPriority = true;
        }
    });
    
    if (isHighPriority) {
        priorityBtn.textContent = 'Remove High Priority';
        priorityBtn.classList.add('active');
    } else {
        priorityBtn.textContent = 'Mark as High Priority';
        priorityBtn.classList.remove('active');
    }
}

// Setup drag and drop functionality
function setupDragAndDrop() {
    const galleries = document.querySelectorAll('.gallery');
    galleries.forEach(gallery => {
        gallery.addEventListener('dragover', handleDragOver);
        gallery.addEventListener('drop', handleDrop);
    });
}

// Drag and drop handlers
function handleDragStart(e) {
    draggedElement = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.outerHTML);
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
    draggedElement = null;
    
    // Remove all drag-over effects
    document.querySelectorAll('.drag-over').forEach(item => {
        item.classList.remove('drag-over');
    });
}

function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    
    e.dataTransfer.dropEffect = 'move';
    
    if (this.classList.contains('gallery-item') && this !== draggedElement) {
        this.classList.add('drag-over');
    }
    
    return false;
}

function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    
    if (draggedElement && this !== draggedElement) {
        const galleryId = this.closest('.gallery').id;
        const draggedId = draggedElement.getAttribute('data-id');
        const targetId = this.getAttribute('data-id');
        
        if (this.classList.contains('gallery-item')) {
            // Reorder images in the same gallery
            reorderImages(galleryId, draggedId, targetId);
            
            // Swap DOM elements
            const parent = this.parentNode;
            const draggedNextSibling = draggedElement.nextSibling;
            const targetNextSibling = this.nextSibling;
            
            parent.insertBefore(draggedElement, targetNextSibling);
            parent.insertBefore(this, draggedNextSibling);
        } else if (this.classList.contains('gallery')) {
            // Drop into empty gallery or at the end
            this.appendChild(draggedElement);
            
            // Update the gallery ID if moving between galleries
            const newGalleryId = this.id;
            const oldGalleryId = draggedElement.closest('.gallery').id;
            
            if (newGalleryId !== oldGalleryId) {
                moveImageBetweenGalleries(draggedId, oldGalleryId, newGalleryId);
            }
        }
    }
    
    this.classList.remove('drag-over');
    return false;
}

// Reorder images in localStorage
function reorderImages(galleryId, draggedId, targetId) {
    const images = savedImages[galleryId];
    const draggedIndex = images.findIndex(img => img.id === draggedId);
    const targetIndex = images.findIndex(img => img.id === targetId);
    
    if (draggedIndex !== -1 && targetIndex !== -1) {
        // Remove dragged item and insert at target position
        const draggedItem = images.splice(draggedIndex, 1)[0];
        images.splice(targetIndex, 0, draggedItem);
        
        // Update order values
        images.forEach((img, index) => {
            img.order = index;
        });
        
        saveSavedImages();
    }
}

// Move image between galleries
function moveImageBetweenGalleries(imageId, fromGalleryId, toGalleryId) {
    const fromImages = savedImages[fromGalleryId];
    const imageIndex = fromImages.findIndex(img => img.id === imageId);
    
    if (imageIndex !== -1) {
        const imageData = fromImages.splice(imageIndex, 1)[0];
        imageData.galleryId = toGalleryId;
        imageData.order = savedImages[toGalleryId].length;
        
        savedImages[toGalleryId].push(imageData);
        saveSavedImages();
        
        showNotification('Image moved to other gallery!');
    }
} 