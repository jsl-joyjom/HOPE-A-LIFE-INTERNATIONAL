/**
 * Impact Page JavaScript
 * Handles form submission, image upload, and interactive features
 */

// Initialize impact page functionality
const initImpactPage = () => {
    initImpactForm();
    initImageUpload();
    // Use window version if available, otherwise the fallback will be created
    if (typeof window.initImpactCounters === 'function') {
        window.initImpactCounters();
    } else if (typeof initImpactCounters === 'function') {
        initImpactCounters();
    }
    initTestimonialAnimations();
    initGalleryLightbox();
};

// Initialize impact form submission
const initImpactForm = () => {
    const form = document.getElementById('impact-form');
    if (!form) return;

    const submitButton = form.querySelector('.impact-submit-btn');
    const messageDiv = document.getElementById('form-message');
    
    // Initialize word counter for story textarea
    const storyTextarea = document.getElementById('impact-story');
    if (storyTextarea) {
        initWordCounter(storyTextarea);
    }

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        // Disable submit button
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i><span>Submitting...</span>';

        // Hide previous messages
        messageDiv.style.display = 'none';
        messageDiv.className = 'form-message';

        // Get form data
        const formData = new FormData(form);
        const imageFile = formData.get('image');

        // Validate file size (max 5MB)
        if (imageFile && imageFile.size > 5 * 1024 * 1024) {
            showFormMessage('Image size must be less than 5MB.', 'error');
            submitButton.disabled = false;
            submitButton.innerHTML = '<i class="fas fa-paper-plane" aria-hidden="true"></i><span>Share My Story</span>';
            return;
        }

        try {
            // Validate required fields
            const name = formData.get('name');
            const email = formData.get('email');
            const storyTitle = formData.get('story-title');
            const story = formData.get('story');
            
            if (!name || !email || !storyTitle || !story) {
                showFormMessage('Please fill in all required fields.', 'error');
                submitButton.disabled = false;
                submitButton.innerHTML = '<i class="fas fa-paper-plane" aria-hidden="true"></i><span>Share My Story</span>';
                return;
            }
            
            // Simulate form submission (replace with actual API endpoint)
            // In production, you would send this to your backend server
            await simulateFormSubmission(formData);

            // Show success modal
            showSuccessModal();
            
            // Reset form
            form.reset();
            document.getElementById('image-preview').style.display = 'none';
            document.getElementById('impact-image').value = '';
            const uploadLabel = document.querySelector('.file-upload-label');
            if (uploadLabel) uploadLabel.style.display = 'flex';
            // Reset file upload text
            const fileUploadText = document.querySelector('.file-upload-text');
            if (fileUploadText) {
                fileUploadText.textContent = 'Choose a photo or drag it here';
                fileUploadText.style.color = '';
                fileUploadText.style.fontWeight = '';
            }
            // Reset word counter
            const wordCounter = document.getElementById('word-counter');
            if (wordCounter) wordCounter.textContent = '0 / 100 words';

        } catch (error) {
            console.error('Form submission error:', error);
            showFormMessage('Sorry, there was an error submitting your story. Please try again later.', 'error');
        } finally {
            submitButton.disabled = false;
            submitButton.innerHTML = '<i class="fas fa-paper-plane" aria-hidden="true"></i><span>Share My Story</span>';
        }
    });
};

// Save story submission to pending queue for admin approval
const simulateFormSubmission = (formData) => {
    return new Promise((resolve, reject) => {
        try {
            // Get form data
            const storyData = {
                id: Date.now() + Math.random(), // Ensure unique ID
                status: 'pending', // pending, approved, rejected
                submittedAt: new Date().toISOString(),
                name: formData.get('name') || 'Anonymous',
                email: formData.get('email') || '',
                location: formData.get('location') || '',
                program: formData.get('program') || '',
                storyTitle: formData.get('story-title') || '',
                story: formData.get('story') || '',
                imageUrl: '', // Will be set if image uploaded
                imageName: '',
                consent: formData.get('consent') === 'on',
                newsletter: formData.get('newsletter') === 'on'
            };
            
            console.log('Preparing story data:', {
                name: storyData.name,
                email: storyData.email,
                storyTitle: storyData.storyTitle,
                hasStory: !!storyData.story,
                hasImage: false
            });
            
            // Handle image file if uploaded
            const imageFile = formData.get('image');
            if (imageFile && imageFile.size > 0) {
                console.log('Image file detected:', imageFile.name, imageFile.size);
                // Convert to base64 for localStorage (in production, upload to server)
                const reader = new FileReader();
                reader.onload = async (e) => {
                    storyData.imageUrl = e.target.result;
                    storyData.imageName = imageFile.name;
                    console.log('Image converted, saving story...');
                    await savePendingStory(storyData);
                    resolve({ success: true });
                };
                reader.onerror = async (error) => {
                    console.error('Error reading image file:', error);
                    storyData.imageUrl = '';
                    storyData.imageName = '';
                    await savePendingStory(storyData);
                    resolve({ success: true });
                };
                reader.readAsDataURL(imageFile);
            } else {
                console.log('No image file, saving story directly...');
                await savePendingStory(storyData);
                resolve({ success: true });
            }
        } catch (error) {
            console.error('Error in simulateFormSubmission:', error);
            reject(error);
        }
    });
};

// Save pending story to Supabase
const savePendingStory = async (storyData) => {
    try {
        if (!window.supabase) {
            console.error('Supabase not available');
            throw new Error('Database connection not available. Please refresh the page and try again.');
        }
        
        // Prepare data for Supabase (pending_stories table)
        const pendingStoryData = {
            name: storyData.name,
            role: storyData.role || null,
            quote: storyData.story || storyData.quote,
            tags: storyData.program || storyData.tags || null,
            status: 'pending'
        };
        
        // Insert into Supabase
        const { data: insertedStory, error } = await window.supabase
            .from('pending_stories')
            .insert([pendingStoryData])
            .select();
        
        if (error) {
            console.error('Error saving story to Supabase:', error);
            throw new Error(`Failed to save story: ${error.message || 'Please try again.'}`);
        }
        
        // Debug logging
        console.log('✅ Story saved to Supabase:', insertedStory);
        console.log('✅ Story ID:', insertedStory[0]?.id);
        
        // Trigger event for admin panel
        try {
            window.dispatchEvent(new CustomEvent('new-pending-story', { detail: insertedStory[0] }));
            window.dispatchEvent(new CustomEvent('pending-stories-updated', { detail: { count: 1 } }));
        } catch (e) {
            console.warn('Error dispatching events:', e);
        }
        
    } catch (error) {
        console.error('❌ Error saving story to Supabase:', error);
        alert('Error saving your story. Please try again or contact support if the problem persists.');
        throw error;
    }
};

// Show form message
const showFormMessage = (message, type) => {
    const messageDiv = document.getElementById('form-message');
    messageDiv.textContent = message;
    messageDiv.className = `form-message ${type}-message`;
    messageDiv.style.display = 'block';
    messageDiv.setAttribute('role', 'alert');
    messageDiv.setAttribute('aria-live', 'polite');

    // Scroll to message
    messageDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    // Auto-hide after 10 seconds for success messages
    if (type === 'success') {
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 10000);
    }
};

// Show success modal
const showSuccessModal = () => {
    // Create modal if it doesn't exist
    let modal = document.getElementById('story-success-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'story-success-modal';
        modal.className = 'story-success-modal';
        modal.innerHTML = `
            <div class="story-success-modal-overlay"></div>
            <div class="story-success-modal-content">
                <div class="story-success-icon">
                    <i class="fas fa-check-circle"></i>
                </div>
                <h2>Success!</h2>
                <p>Your story has been shared successfully.</p>
                <button class="story-success-close-btn" aria-label="Close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Close handlers
        const overlay = modal.querySelector('.story-success-modal-overlay');
        const closeBtn = modal.querySelector('.story-success-close-btn');
        
        const closeModal = () => {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        };
        
        overlay.addEventListener('click', closeModal);
        closeBtn.addEventListener('click', closeModal);
        
        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                closeModal();
            }
        });
    }
    
    // Show modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Auto-close after 5 seconds
    setTimeout(() => {
        if (modal.classList.contains('active')) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }, 5000);
};

// Initialize word counter
const initWordCounter = (textarea) => {
    const maxWords = 100;
    const formGroup = textarea.closest('.form-group');
    
    // Create word counter element
    let wordCounter = document.getElementById('word-counter');
    if (!wordCounter) {
        wordCounter = document.createElement('div');
        wordCounter.id = 'word-counter';
        wordCounter.className = 'word-counter';
        wordCounter.textContent = '0 / 100 words';
        formGroup.appendChild(wordCounter);
    }
    
    // Update counter on input
    const updateCounter = () => {
        const text = textarea.value.trim();
        const words = text ? text.split(/\s+/).filter(word => word.length > 0) : [];
        const wordCount = words.length;
        
        wordCounter.textContent = `${wordCount} / ${maxWords} words`;
        
        if (wordCount > maxWords) {
            wordCounter.classList.add('over-limit');
            textarea.setCustomValidity(`Please limit your story to ${maxWords} words or less.`);
        } else {
            wordCounter.classList.remove('over-limit');
            textarea.setCustomValidity('');
        }
    };
    
    // Limit textarea to maxWords
    textarea.addEventListener('input', () => {
        const text = textarea.value.trim();
        const words = text ? text.split(/\s+/).filter(word => word.length > 0) : [];
        
        if (words.length > maxWords) {
            // Truncate to maxWords
            const truncated = words.slice(0, maxWords).join(' ');
            textarea.value = truncated;
        }
        
        updateCounter();
    });
    
    // Initial update
    updateCounter();
};

// Initialize image upload preview
const initImageUpload = () => {
    const fileInput = document.getElementById('impact-image');
    const previewDiv = document.getElementById('image-preview');
    const previewImg = document.getElementById('preview-img');
    const removeBtn = document.getElementById('remove-image');
    const uploadLabel = document.querySelector('.file-upload-label');
    const fileUploadText = document.querySelector('.file-upload-text');

    if (!fileInput || !previewDiv) return;

    // Handle file selection
    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file.');
            fileInput.value = '';
            return;
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('Image size must be less than 5MB.');
            fileInput.value = '';
            return;
        }

        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
            previewImg.src = e.target.result;
            previewDiv.style.display = 'block';
            if (uploadLabel) uploadLabel.style.display = 'none';
            // Update file upload text to show file name
            if (fileUploadText) {
                fileUploadText.textContent = file.name;
                fileUploadText.style.color = 'var(--primary-blue)';
                fileUploadText.style.fontWeight = '600';
            }
        };
        reader.readAsDataURL(file);
    });

    // Handle drag and drop
    uploadLabel.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadLabel.style.borderColor = 'var(--primary-blue)';
        uploadLabel.style.background = 'rgba(37, 99, 235, 0.1)';
    });

    uploadLabel.addEventListener('dragleave', () => {
        uploadLabel.style.borderColor = 'var(--border-color)';
        uploadLabel.style.background = 'var(--bg-secondary)';
    });

    uploadLabel.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadLabel.style.borderColor = 'var(--border-color)';
        uploadLabel.style.background = 'var(--bg-secondary)';

        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            fileInput.files = e.dataTransfer.files;
            fileInput.dispatchEvent(new Event('change'));
        }
    });

    // Handle remove button
    removeBtn.addEventListener('click', () => {
        fileInput.value = '';
        previewDiv.style.display = 'none';
        if (uploadLabel) uploadLabel.style.display = 'flex';
        const fileUploadText = document.querySelector('.file-upload-text');
        if (fileUploadText) {
            fileUploadText.textContent = 'Choose a photo or drag it here';
            fileUploadText.style.color = '';
            fileUploadText.style.fontWeight = '';
        }
    });
};

// Initialize impact counters - using the one from main.js if available
// If main.js doesn't have it, create a fallback version
if (typeof window.initImpactCounters === 'undefined') {
    window.initImpactCounters = () => {
        const container = document.querySelector('#impact-counters');
        if (!container) return;

        // Check if counters are already populated (main.js may have initialized them)
        if (container.children.length > 0) {
            // Animate existing counters
            const existingCounters = container.querySelectorAll('.counter-item');
            existingCounters.forEach((item, index) => {
                setTimeout(() => {
                    item.classList.add('is-visible');
                }, index * 150);
            });
            return;
        }

        // Fallback: Create counters manually if main.js didn't initialize them
        const counters = [
            {
                number: 62000,
                suffix: '+',
                title: 'Lives Transformed',
                subtitle: 'Widows, orphans, and community members empowered',
                tooltip: 'Empowered & lives transformed through our programs since 2008',
                icon: 'fas fa-users'
            },
            {
                number: 17,
                suffix: '',
                title: 'Years of Service',
                subtitle: 'Dedicated to restoring hope across Kenya',
                tooltip: 'Years of dedicated service to vulnerable communities',
                icon: 'fas fa-calendar-alt'
            },
            {
                number: 7,
                suffix: '',
                title: 'Core Programs',
                subtitle: 'Comprehensive initiatives for lasting change',
                tooltip: 'Seven core programs addressing critical community needs',
                icon: 'fas fa-heart'
            },
            {
                number: 450,
                suffix: '+',
                title: 'Girls Mentored',
                subtitle: 'Empowered through mentorship and education',
                tooltip: 'Girls receiving mentorship and leadership training',
                icon: 'fas fa-graduation-cap'
            },
            {
                number: 145,
                suffix: '+',
                title: 'Homes Built',
                subtitle: 'Safe housing for widows and families',
                tooltip: 'Homes constructed for vulnerable families',
                icon: 'fas fa-home'
            },
            {
                number: 12000,
                suffix: '+',
                title: 'Liters of Water',
                subtitle: 'Clean water delivered to communities',
                tooltip: 'Liters of clean water provided to drought-stricken areas',
                icon: 'fas fa-tint'
            }
        ];

        counters.forEach((counter, index) => {
            const counterItem = document.createElement('div');
            counterItem.className = 'counter-item';
            counterItem.innerHTML = `
                <div class="counter-ring">
                    <div class="counter-number" data-count="${counter.number}">0${counter.suffix}</div>
                </div>
                <h3 class="counter-title">${counter.title}</h3>
                <p class="counter-subtitle">${counter.subtitle}</p>
            `;
            counterItem.setAttribute('data-tooltip', counter.tooltip);
            container.appendChild(counterItem);

            // Animate counter
            setTimeout(() => {
                animateCounter(counterItem.querySelector('.counter-number'), counter.number, counter.suffix);
                counterItem.classList.add('is-visible');
            }, index * 150);
        });
    };
}

// Animate counter number
const animateCounter = (element, target, suffix) => {
    const duration = 2000;
    const start = 0;
    const increment = target / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = Math.round(target).toLocaleString() + suffix;
            clearInterval(timer);
        } else {
            element.textContent = Math.round(current).toLocaleString() + suffix;
        }
    }, 16);
};

// Initialize testimonial animations
const initTestimonialAnimations = () => {
    const testimonialCards = document.querySelectorAll('.testimonial-card');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, index * 100);
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    testimonialCards.forEach((card) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });
};

// Initialize gallery lightbox (simple modal)
const initGalleryLightbox = () => {
    const galleryItems = document.querySelectorAll('.gallery-item');
    
    galleryItems.forEach((item) => {
        item.addEventListener('click', () => {
            const img = item.querySelector('img');
            if (!img) return;

            // Create lightbox
            const lightbox = document.createElement('div');
            lightbox.className = 'lightbox';
            lightbox.style.cssText = `
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0.95);
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
            `;

            const lightboxImg = document.createElement('img');
            lightboxImg.src = img.src;
            lightboxImg.alt = img.alt;
            lightboxImg.style.cssText = `
                max-width: 90%;
                max-height: 90%;
                object-fit: contain;
                border-radius: 8px;
            `;

            lightbox.appendChild(lightboxImg);
            document.body.appendChild(lightbox);

            // Close on click
            lightbox.addEventListener('click', () => {
                document.body.removeChild(lightbox);
            });

            // Close on Escape key
            const handleEscape = (e) => {
                if (e.key === 'Escape') {
                    document.body.removeChild(lightbox);
                    document.removeEventListener('keydown', handleEscape);
                }
            };
            document.addEventListener('keydown', handleEscape);
        });
    });
};

// Generate initials from name
const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
};

// Initialize testimonial interactions (likes and comments)
const initTestimonialInteractions = () => {
    // Generate initials for all avatars
    const avatars = document.querySelectorAll('.testimonial-avatar');
    avatars.forEach(avatar => {
        const nameElement = avatar.closest('.testimonial-header').querySelector('.testimonial-name');
        if (nameElement) {
            const name = nameElement.textContent.trim();
            const initials = getInitials(name);
            const initialsSpan = avatar.querySelector('.avatar-initials');
            if (initialsSpan) {
                initialsSpan.textContent = initials;
            }
        }
    });
    // Initialize likes
    const likeButtons = document.querySelectorAll('.like-btn');
    likeButtons.forEach(button => {
        const testimonialId = button.getAttribute('data-testimonial-id');
        const likeCount = button.querySelector('.like-count');
        
        // Load saved likes from localStorage
        const savedLikes = localStorage.getItem(`testimonial-likes-${testimonialId}`);
        const isLiked = localStorage.getItem(`testimonial-liked-${testimonialId}`) === 'true';
        
        if (savedLikes) {
            likeCount.textContent = savedLikes;
        }
        
        const farIcon = button.querySelector('.far.fa-heart');
        const fasIcon = button.querySelector('.fas.fa-heart');
        
        if (isLiked) {
            button.classList.add('liked');
            if (farIcon) farIcon.style.display = 'none';
            if (fasIcon) fasIcon.style.display = 'inline-block';
        }
        
        button.addEventListener('click', () => {
            const currentLikes = parseInt(likeCount.textContent) || 0;
            const wasLiked = button.classList.contains('liked');
            
            if (wasLiked) {
                // Unlike
                button.classList.remove('liked');
                if (farIcon) farIcon.style.display = 'inline-block';
                if (fasIcon) fasIcon.style.display = 'none';
                likeCount.textContent = Math.max(0, currentLikes - 1);
                localStorage.setItem(`testimonial-liked-${testimonialId}`, 'false');
            } else {
                // Like with animation
                button.classList.add('liked');
                if (farIcon) farIcon.style.display = 'none';
                if (fasIcon) {
                    fasIcon.style.display = 'inline-block';
                    // Trigger pulse animation
                    fasIcon.style.animation = 'none';
                    setTimeout(() => {
                        fasIcon.style.animation = 'heartPulse 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
                    }, 10);
                }
                likeCount.textContent = currentLikes + 1;
                localStorage.setItem(`testimonial-liked-${testimonialId}`, 'true');
                
                // Trigger count bounce animation
                likeCount.style.animation = 'none';
                setTimeout(() => {
                    likeCount.style.animation = 'countBounce 0.5s ease';
                }, 10);
            }
            
            localStorage.setItem(`testimonial-likes-${testimonialId}`, likeCount.textContent);
        });
    });
    
    // Initialize comment toggles
    const commentToggleButtons = document.querySelectorAll('.comment-toggle-btn');
    commentToggleButtons.forEach(button => {
        const testimonialId = button.getAttribute('data-testimonial-id');
        const commentsSection = document.querySelector(`.testimonial-comments[data-testimonial-id="${testimonialId}"]`);
        const commentCount = button.querySelector('.comment-count');
        
        // Load saved comments count
        const savedComments = localStorage.getItem(`testimonial-comments-${testimonialId}`);
        if (savedComments) {
            const comments = JSON.parse(savedComments);
            commentCount.textContent = comments.length;
        }
        
        button.addEventListener('click', () => {
            const isVisible = commentsSection.style.display !== 'none';
            commentsSection.style.display = isVisible ? 'none' : 'block';
            
            if (!isVisible) {
                loadComments(testimonialId);
            }
        });
    });
    
    // Initialize comment forms
    const commentForms = document.querySelectorAll('.comment-form');
    commentForms.forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const testimonialId = form.getAttribute('data-testimonial-id');
            const input = form.querySelector('.comment-input');
            const nameInput = form.querySelector('.comment-name-input');
            const submitBtn = form.querySelector('.comment-submit-btn');
            const commentText = input.value.trim();
            const commenterName = nameInput ? nameInput.value.trim() : '';
            
            if (commentText) {
                // Disable submit button during submission
                submitBtn.disabled = true;
                submitBtn.classList.add('submitting');
                
                // Add comment with optional name
                addComment(testimonialId, commentText, commenterName);
                
                // Clear inputs
                input.value = '';
                if (nameInput) nameInput.value = '';
                
                // Re-enable submit button after a short delay
                setTimeout(() => {
                    submitBtn.disabled = false;
                    submitBtn.classList.remove('submitting');
                }, 500);
            }
        });
    });
    
    // Initialize share buttons
    const shareButtons = document.querySelectorAll('.share-btn');
    const shareModal = document.getElementById('share-modal');
    const shareModalClose = document.querySelector('.share-modal-close');
    const shareModalOverlay = document.querySelector('.share-modal-overlay');
    const shareStoryPreview = document.getElementById('share-story-preview');
    const sharePlatformButtons = document.querySelectorAll('.share-platform-btn');
    
    shareButtons.forEach(button => {
        button.addEventListener('click', () => {
            const testimonialName = button.getAttribute('data-testimonial-name');
            const testimonialText = button.getAttribute('data-testimonial-text');
            const testimonialId = button.getAttribute('data-testimonial-id');
            
            // Update preview
            shareStoryPreview.textContent = `"${testimonialText}" - ${testimonialName}`;
            
            // Generate share URLs
            const pageUrl = encodeURIComponent(window.location.href + `#testimonial-${testimonialId}`);
            const shareText = encodeURIComponent(`${testimonialName}: "${testimonialText}" - Hope A Life International`);
            
            sharePlatformButtons.forEach(platformBtn => {
                const platform = platformBtn.getAttribute('data-platform');
                let shareUrl = '';
                
                switch(platform) {
                    case 'whatsapp':
                        shareUrl = `https://wa.me/?text=${shareText}%20${pageUrl}`;
                        break;
                    case 'facebook':
                        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${pageUrl}&quote=${shareText}`;
                        break;
                    case 'twitter':
                        shareUrl = `https://twitter.com/intent/tweet?text=${shareText}&url=${pageUrl}`;
                        break;
                    case 'linkedin':
                        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${pageUrl}`;
                        break;
                    case 'instagram':
                        // Instagram doesn't support direct URL sharing, open in new tab
                        shareUrl = `https://www.instagram.com/`;
                        break;
                }
                
                platformBtn.href = shareUrl;
            });
            
            // Show modal
            shareModal.classList.add('active');
            shareModal.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
        });
    });
    
    // Close modal
    const closeShareModal = () => {
        shareModal.classList.remove('active');
        shareModal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    };
    
    if (shareModalClose) {
        shareModalClose.addEventListener('click', closeShareModal);
    }
    
    if (shareModalOverlay) {
        shareModalOverlay.addEventListener('click', closeShareModal);
    }
    
    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && shareModal.classList.contains('active')) {
            closeShareModal();
        }
    });
};

// Load comments from localStorage
const loadComments = (testimonialId) => {
    const commentsList = document.querySelector(`.testimonial-comments[data-testimonial-id="${testimonialId}"] .comments-list`);
    const savedComments = localStorage.getItem(`testimonial-comments-${testimonialId}`);
    
    if (savedComments) {
        const comments = JSON.parse(savedComments);
        commentsList.innerHTML = '';
        comments.forEach(comment => {
            addCommentToDOM(commentsList, comment);
        });
    }
};

// Add a new comment
const addComment = (testimonialId, commentText, commenterName = '') => {
    const savedComments = localStorage.getItem(`testimonial-comments-${testimonialId}`);
    const comments = savedComments ? JSON.parse(savedComments) : [];
    
    // Use provided name or default to "Anonymous"
    const author = commenterName && commenterName.trim() ? commenterName.trim() : 'Anonymous';
    
    const newComment = {
        id: Date.now(),
        text: commentText,
        author: author,
        time: new Date().toLocaleString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        })
    };
    
    comments.push(newComment);
    localStorage.setItem(`testimonial-comments-${testimonialId}`, JSON.stringify(comments));
    
    const commentsList = document.querySelector(`.testimonial-comments[data-testimonial-id="${testimonialId}"] .comments-list`);
    if (commentsList) {
        addCommentToDOM(commentsList, newComment, true);
    }
    
    // Update comment count with animation
    const commentCount = document.querySelector(`.comment-toggle-btn[data-testimonial-id="${testimonialId}"] .comment-count`);
    if (commentCount) {
        commentCount.textContent = comments.length;
        // Trigger count animation
        commentCount.style.animation = 'none';
        setTimeout(() => {
            commentCount.style.animation = 'countBounce 0.5s ease';
        }, 10);
    }
};

// Add comment to DOM
const addCommentToDOM = (commentsList, comment, isNew = false) => {
    const commentItem = document.createElement('div');
    commentItem.className = 'comment-item';
    
    // Add joining animation class for new comments
    if (isNew) {
        commentItem.classList.add('joining');
    }
    
    // Generate initials from author name
    const authorInitials = getInitials(comment.author);
    
    commentItem.innerHTML = `
        <div class="comment-avatar">${authorInitials}</div>
        <div class="comment-content">
            <div class="comment-author">${comment.author}</div>
            <p class="comment-text">${comment.text}</p>
            <div class="comment-time">${comment.time}</div>
        </div>
    `;
    
    commentsList.appendChild(commentItem);
    
    // Scroll to bottom with smooth behavior
    commentsList.scrollTo({
        top: commentsList.scrollHeight,
        behavior: 'smooth'
    });
    
    // Remove joining class after animation completes
    if (isNew) {
        setTimeout(() => {
            commentItem.classList.remove('joining');
        }, 600);
    }
};

// Initialize when DOM is ready
const initializeImpactFeatures = () => {
    try {
        initImpactPage();
        initTestimonialInteractions();
        console.log('✅ Impact page features initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing impact features:', error);
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeImpactFeatures);
} else {
    initializeImpactFeatures();
}

