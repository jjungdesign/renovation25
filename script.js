// Global variables
let currentImageId = null;
let commentImagePreview = null;

// Hardcoded comments for specific images
const predefinedComments = {
    'image2': [
        {
            id: 'comment5',
            name: 'Note',
            text: '전반적으로 집에 이런 빈티지한 장식이 섞여 있는데, 분위기가 괜찮은 것 같아 최대한 살리고 위에 페인트만 칠하려고 합니다. 현관 옆에 있는 화장실 공간도 전체적으로 보존해도 괜찮을 것 같습니다.',
            timestamp: new Date().toISOString(),
            imageAttachment: null
        }
    ],
    'image4': [
        {
            id: 'comment1',
            name: 'Note',
            text: '리빙룸 왼쪽 벽을 철거하고 오픈 키친으로 리모델링하고 싶습니다. 또, 발코니 왼쪽 벽은 유리로 변경하여 다이닝룸과 자연스럽게 연결된 느낌을 주고싶습니다. 참고용으로 레퍼런스 사진올립니다.',
            timestamp: new Date().toISOString(),
            imageAttachment: 'https://i.imgur.com/XAd3AlJ.jpg'
        }
    ],
    'image6': [
        {
            id: 'comment2',
            name: 'Note',
            text: '이 사진에서 왼쪽 벽을 유리로 만들어 발코니와 연결감을 주고싶습니다. 참고용으로 레퍼런스 사진올립니다.',
            timestamp: new Date().toISOString(),
            imageAttachment: 'https://i.imgur.com/XAd3AlJ.jpg'
        }
    ],
    'image10': [
        {
            id: 'comment3',
            name: 'Note',
            text: '침실 내부에 있는 보일러실 문을 없애고 벽으로 마감하여 공간을 더 정돈된 느낌으로 만들고 싶습니다. 컨트롤러는 작고 심플한 형태로 교체하고자 합니다.',
            timestamp: new Date().toISOString(),
            imageAttachment: null
        }
    ],
    'image13': [
        {
            id: 'comment4',
            name: 'Note',
            text: '화장실은 다른 유닛 화장실 사진 첨부합니다. Full renovation 필요합니다.',
            timestamp: new Date().toISOString(),
            imageAttachment: null
        }
    ]
};

// Hardcoded images for the gallery
const galleryImages = [
    {
        id: 'image1',
        src: 'https://i.imgur.com/2gs3eaN.jpg',
        title: 'Balcony',
        isHighPriority: false
    },
    {
        id: 'image2',
        src: 'https://i.imgur.com/1tgGD0B.jpg',
        title: 'Entrance 1',
        isHighPriority: false
    },
    {
        id: 'image3', 
        src: 'https://i.imgur.com/LS0zgxK.jpg',
        title: 'Entrance 2',
        isHighPriority: false
    },
    {
        id: 'image4',
        src: 'https://i.imgur.com/XLqnbuK.jpg',
        title: 'Livingroom 1',
        isHighPriority: true
    },
    {
        id: 'image5',
        src: 'https://i.imgur.com/xS605si.jpg',
        title: 'Livingroom 2',
        isHighPriority: true
    },
    {
        id: 'image6',
        src: 'https://i.imgur.com/rFp8q99.jpg',
        title: 'Dining area 1',
        isHighPriority: true
    },
    {
        id: 'image7',
        src: 'https://i.imgur.com/kIkzSJm.jpg',
        title: 'Dining area 2',
        isHighPriority: false
    },
    {
        id: 'image8',
        src: 'https://i.imgur.com/cQOzMiK.jpg',
        title: 'Kitchen',
        isHighPriority: true
    },
    {
        id: 'image9',
        src: 'https://i.imgur.com/Nn1cK4j.jpg',
        title: 'Bedroom hallway',
        isHighPriority: false
    },
    {
        id: 'image10',
        src: 'https://i.imgur.com/yWSRYZD.jpg',
        title: 'Bedroom 1',
        isHighPriority: true
    },
    {
        id: 'image11',
        src: 'https://i.imgur.com/iTFf1PT.jpg',
        title: 'Bedroom 2',
        isHighPriority: false
    },
    {
        id: 'image12',
        src: 'https://i.imgur.com/5ruAZyX.jpg',
        title: 'Bedroom 3',
        isHighPriority: false
    },
    {
        id: 'image13',
        src: 'https://i.imgur.com/nIx0tLq.jpg',
        title: 'Bathroom',
        isHighPriority: true
    },
    {
        id: 'image14',
        src: 'https://i.imgur.com/P5iD5bi.jpg',
        title: 'Blueprint',
        isHighPriority: false
    }
];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadGalleryImages();
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
}

// Display comment
function displayComment(comment) {
    const commentDiv = document.createElement('div');
    commentDiv.className = 'comment';
    commentDiv.setAttribute('data-comment-id', comment.id);
    
    let imageAttachmentHtml = '';
    if (comment.imageAttachment) {
        imageAttachmentHtml = `
            <div class="comment-image">
                <a href="javascript:void(0)" onclick="openImageModal('${comment.imageAttachment}')" style="color: #2c3e50; text-decoration: underline; font-size: 0.9rem;">
                    📷 Reference Image (Click to view)
                </a>
            </div>
        `;
    }
    
    commentDiv.innerHTML = `
        <div class="comment-header">
            <strong>${comment.name}</strong>
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
    
    if (predefinedComments[imageId] && predefinedComments[imageId].length > 0) {
        predefinedComments[imageId].forEach(comment => {
            commentsList.appendChild(displayComment(comment));
        });
    }
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