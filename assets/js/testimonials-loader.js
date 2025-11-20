// Testimonials Loader - Loads testimonials from admin panel
(function() {
    let hasLoaded = false;
    let animationObserver = null;
    let mutationObserver = null;
    
    // Listen for real-time updates
    window.addEventListener('admin-content-updated', function(e) {
        if (e.detail && e.detail.type === 'testimonials') {
            console.log('🔄 Reloading testimonials due to admin update');
            hasLoaded = false; // Reset flag to allow reload
            loadAdminTestimonials();
        }
    });
    
    window.addEventListener('admin-data-updated', function(e) {
        if (e.detail && e.detail.key === 'admin-testimonials') {
            console.log('🔄 Reloading testimonials due to data update');
            hasLoaded = false;
            loadAdminTestimonials();
        }
    });
    
    window.addEventListener('storage', function(e) {
        if (e.key === 'admin-testimonials') {
            console.log('🔄 Reloading testimonials due to storage change');
            hasLoaded = false;
            loadAdminTestimonials();
        }
    });
    
    // Create or get IntersectionObserver for animations
    function createAnimationObserver() {
        if (animationObserver) {
            return animationObserver;
        }
        
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        
        animationObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                        entry.target.style.opacity = '1';
                        entry.target.style.visibility = 'visible';
                        animationObserver.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.1 } // Lower threshold for faster visibility
        );
        
        return animationObserver;
    }
    
    // Observe new testimonials automatically
    function observeNewTestimonials() {
        const observer = createAnimationObserver();
        const newTestimonials = document.querySelectorAll(
            '.testimonial-card[data-animate]:not(.is-visible)'
        );
        
        newTestimonials.forEach(el => {
            observer.observe(el);
            console.log("Observing new testimonial:", el);
        });
        
        return newTestimonials.length;
    }
    
    // Force visibility fallback - ensures all testimonials are visible
    function forceVisibleTestimonials() {
        const allTestimonials = document.querySelectorAll('.testimonial-card');
        const testimonialsGrid = document.querySelector('.testimonials-grid');
        
        // Ensure grid is visible
        if (testimonialsGrid) {
            testimonialsGrid.style.setProperty('display', '', 'important');
            testimonialsGrid.style.setProperty('opacity', '1', 'important');
            testimonialsGrid.style.setProperty('visibility', 'visible', 'important');
        }
        
        allTestimonials.forEach((el, index) => {
            // Add is-visible class
            el.classList.add('is-visible');
            
            // Force visibility with !important to override CSS
            el.style.setProperty('opacity', '1', 'important');
            el.style.setProperty('visibility', 'visible', 'important');
            el.style.setProperty('display', '', 'important');
            el.style.setProperty('transform', 'translateY(0)', 'important');
            
            // Remove any inline styles that might hide it
            el.style.removeProperty('height');
            el.style.removeProperty('max-height');
        });
        
        console.log("Making all testimonials visible. Total cards:", allTestimonials.length);
        console.log("Grid visible:", testimonialsGrid ? window.getComputedStyle(testimonialsGrid).display !== 'none' : 'N/A');
        return allTestimonials.length;
    }
    
    // Setup MutationObserver to automatically detect new testimonials
    function setupMutationObserver() {
        if (mutationObserver) {
            return; // Already set up
        }
        
        const testimonialsGrid = document.querySelector('.testimonials-grid');
        if (!testimonialsGrid) {
            return;
        }
        
        mutationObserver = new MutationObserver((mutations) => {
            let hasNewTestimonials = false;
            
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1 && // Element node
                        node.classList && 
                        node.classList.contains('testimonial-card')) {
                        hasNewTestimonials = true;
                    }
                });
            });
            
            if (hasNewTestimonials) {
                console.log('New testimonials detected via MutationObserver');
                setTimeout(() => {
                    observeNewTestimonials();
                    // Re-initialize carousel with new testimonials
                    initTestimonialsCarousel();
                }, 200);
            }
        });
        
        mutationObserver.observe(testimonialsGrid, {
            childList: true,
            subtree: false
        });
        
        console.log('MutationObserver set up to watch for new testimonials');
    }
    
    async function loadAdminTestimonials() {
        const testimonialsGrid = document.querySelector('.testimonials-grid');
        if (!testimonialsGrid) {
            console.warn('Testimonials grid not found, retrying...');
            // Retry after a short delay if grid not found
            if (!hasLoaded) {
                setTimeout(loadAdminTestimonials, 500);
            }
            return;
        }
        
        try {
            if (!window.supabase) {
                console.warn('Supabase not available, skipping testimonials load');
                return;
            }

            const { data: adminTestimonials, error } = await window.supabase
                .from('testimonials')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) {
                console.error('Error loading testimonials:', error);
                return;
            }
            
            // Ensure grid is visible with !important
            testimonialsGrid.style.setProperty('display', '', 'important');
            testimonialsGrid.style.setProperty('visibility', 'visible', 'important');
            testimonialsGrid.style.setProperty('opacity', '1', 'important');
            
            const testimonials = adminTestimonials || [];
            console.log('Loading admin testimonials:', testimonials.length, testimonials);
        
            // Count static testimonials
            const staticCards = testimonialsGrid.querySelectorAll('.testimonial-card:not([data-admin-testimonial="true"])');
            console.log('Static testimonials found:', staticCards.length);
            
            // Get initials helper
            function getInitials(name) {
                if (!name) return 'U';
                const parts = name.trim().split(/\s+/);
                if (parts.length >= 2) {
                    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
                }
                return name.substring(0, 2).toUpperCase();
            }
            
            // Remove only previously added admin testimonials (marked with data-admin-testimonial)
            const existingAdminCards = testimonialsGrid.querySelectorAll('.testimonial-card[data-admin-testimonial="true"]');
            existingAdminCards.forEach(card => card.remove());
            
            // Sort admin testimonials by date (newest first) - show ALL, carousel will manage visibility
            const sortedAdminTestimonials = [...testimonials]
                .sort((a, b) => new Date(b.created_at || b.date || 0) - new Date(a.created_at || a.date || 0));
            
            console.log('Total admin testimonials:', testimonials.length);
            console.log('All admin testimonials will be available in carousel (showing 3 at a time)');
            
            // Keep all static testimonials visible - they'll be managed by carousel
            // Static testimonials are already in the DOM, we just need to ensure they're ready
            staticCards.forEach((card) => {
                // Keep them visible but carousel will manage which ones show
                card.style.setProperty('display', '', 'important');
                card.style.setProperty('opacity', '1', 'important');
                card.style.setProperty('visibility', 'visible', 'important');
            });
            
            // Add ALL admin testimonials (newest first) - carousel will manage showing only 3 at a time
            // Admin testimonials will be added AFTER static ones in the DOM, but we want them to appear first
            // So we'll prepend them to the grid
            sortedAdminTestimonials.forEach((testimonial, displayIndex) => {
            // Create and show admin testimonial
            const article = document.createElement('article');
            article.className = 'testimonial-card';
            article.setAttribute('data-tilt', '');
            article.setAttribute('data-glow', '');
            article.setAttribute('data-admin-testimonial', 'true');
            
            const initials = getInitials(testimonial.name);
            const testimonialId = Date.now() + displayIndex; // Unique ID
            
            const tags = testimonial.tags ? testimonial.tags.split(',').map(t => t.trim()) : [];
            
            article.innerHTML = `
                    <div class="testimonial-card-inner">
                        <div class="testimonial-header">
                            <div class="testimonial-avatar" data-initials="${initials}">
                                <span class="avatar-initials">${initials}</span>
                            </div>
                            <div class="testimonial-info">
                                <h3 class="testimonial-name">${testimonial.name}</h3>
                                <p class="testimonial-role">${testimonial.role}</p>
                            </div>
                        </div>
                        <div class="testimonial-rating">
                            <i class="fas fa-star" aria-hidden="true"></i>
                            <i class="fas fa-star" aria-hidden="true"></i>
                            <i class="fas fa-star" aria-hidden="true"></i>
                            <i class="fas fa-star" aria-hidden="true"></i>
                            <i class="fas fa-star" aria-hidden="true"></i>
                        </div>
                        <blockquote class="testimonial-quote">
                            "${testimonial.quote}"
                        </blockquote>
                        ${tags.length > 0 ? `
                        <div class="testimonial-tags">
                            ${tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                        </div>
                        ` : ''}
                        
                        <!-- Comments Section -->
                        <div class="testimonial-comments" data-testimonial-id="${testimonialId}">
                            <div class="comments-list"></div>
                            <form class="comment-form" data-testimonial-id="${testimonialId}">
                                <div class="comment-form-fields">
                                    <input type="text" class="comment-name-input" placeholder="Your name (optional)" maxlength="50">
                                    <div class="comment-input-wrapper">
                                        <input type="text" class="comment-input" placeholder="Write a comment..." required>
                                        <button type="submit" class="comment-submit-btn" aria-label="Post comment">
                                            <i class="fas fa-paper-plane"></i>
                                        </button>
                                    </div>
                                </div>
                                <small class="comment-form-hint">Comments are moderated and may take a moment to appear.</small>
                            </form>
                        </div>
                    </div>
                `;
            
            // Add data-animate attribute
            article.setAttribute('data-animate', 'fade-up');
            
            // Prepend admin testimonials so they appear first (newest first)
            // If this is the first admin testimonial, prepend it; otherwise insert after previous admin ones
            const firstStaticCard = testimonialsGrid.querySelector('.testimonial-card:not([data-admin-testimonial])');
            if (firstStaticCard && displayIndex === 0) {
                testimonialsGrid.insertBefore(article, firstStaticCard);
            } else {
                // Insert after the last admin testimonial or at the beginning
                const lastAdminCard = testimonialsGrid.querySelector('.testimonial-card[data-admin-testimonial="true"]:last-child');
                if (lastAdminCard) {
                    lastAdminCard.insertAdjacentElement('afterend', article);
                } else {
                    testimonialsGrid.insertBefore(article, testimonialsGrid.firstChild);
                }
            }
            
            // Force visibility immediately with !important
            article.style.setProperty('opacity', '1', 'important');
            article.style.setProperty('visibility', 'visible', 'important');
            article.style.setProperty('display', '', 'important');
            article.style.setProperty('transform', 'translateY(0)', 'important');
            article.classList.add('is-visible');
            
            // Immediately observe this new testimonial
            const observer = createAnimationObserver();
            observer.observe(article);
            
            // Load existing comments for this testimonial from Supabase
            if (window.supabase) {
                try {
                    const { data: comments } = await window.supabase
                        .from('testimonial_comments')
                        .select('*')
                        .eq('testimonial_id', testimonialId)
                        .order('created_at', { ascending: true });
                    
                    if (comments && comments.length > 0) {
                        const commentsList = article.querySelector('.comments-list');
                        if (commentsList) {
                            comments.forEach(comment => {
                                const commentDiv = document.createElement('div');
                                commentDiv.className = 'comment-item';
                                commentDiv.innerHTML = `
                                    <div class="comment-author">${comment.author || 'Anonymous'}</div>
                                    <div class="comment-text">${comment.text}</div>
                                    <div class="comment-time">${new Date(comment.created_at).toLocaleString()}</div>
                                `;
                                commentsList.appendChild(commentDiv);
                            });
                        }
                    }
                } catch (error) {
                    console.error('Error loading comments:', error);
                }
            }
        });
        
        hasLoaded = true;
        
        const totalTestimonials = sortedAdminTestimonials.length + staticCards.length;
        console.log('✅ All testimonials loaded. Admin:', sortedAdminTestimonials.length, 'Static:', staticCards.length, 'Total:', totalTestimonials);
        
        // Initialize carousel after testimonials are loaded
        // Use a longer delay to ensure all DOM elements are ready
        setTimeout(() => {
            initTestimonialsCarousel();
        }, 500);
        
        // Observe all new testimonials that aren't visible yet
        const observedCount = observeNewTestimonials();
        console.log('Observed', observedCount, 'new testimonials');
        
        // Force visibility immediately
        forceVisibleTestimonials();
        
        // Force visibility again after a short delay (in case CSS re-applies)
        setTimeout(() => {
            forceVisibleTestimonials();
            console.log('Second visibility check completed');
        }, 100);
        
        // Force visibility one more time after animations might have run
        setTimeout(() => {
            forceVisibleTestimonials();
            console.log('Final visibility check completed');
            
            // Debug: Check computed styles
            const sampleCard = testimonialsGrid.querySelector('.testimonial-card');
            if (sampleCard) {
                const computed = window.getComputedStyle(sampleCard);
                console.log('Sample card computed styles:', {
                    opacity: computed.opacity,
                    visibility: computed.visibility,
                    display: computed.display,
                    transform: computed.transform,
                    hasIsVisible: sampleCard.classList.contains('is-visible')
                });
            }
        }, 500);
        
        // Re-initialize carousel after a delay to ensure all testimonials are loaded
        setTimeout(() => {
            initTestimonialsCarousel();
        }, 400);
        
        // Re-initialize scroll animations to ensure everything is set up
        setTimeout(() => {
            if (typeof initScrollAnimations === 'function') {
                console.log('Re-initializing scroll animations for new testimonials');
                initScrollAnimations();
            }
        }, 200);
        
        // Re-initialize testimonial interactions if the function exists
        // Wait a bit for DOM to settle
        setTimeout(() => {
            if (typeof initTestimonialInteractions === 'function') {
                initTestimonialInteractions();
            }
            // Also re-initialize comment forms for new testimonials
            const commentForms = document.querySelectorAll('.comment-form[data-testimonial-id]');
            commentForms.forEach(form => {
                if (!form.hasAttribute('data-initialized')) {
                    form.addEventListener('submit', function(e) {
                        e.preventDefault();
                        const testimonialId = this.getAttribute('data-testimonial-id');
                        const commentInput = this.querySelector('.comment-input');
                        const nameInput = this.querySelector('.comment-name-input');
                        const commentText = commentInput.value.trim();
                        const authorName = nameInput.value.trim() || 'Anonymous';
                        
                        if (!commentText) return;
                        
                        // Save comment to Supabase
                        if (window.supabase) {
                            try {
                                const { data: newComment, error } = await window.supabase
                                    .from('testimonial_comments')
                                    .insert([{
                                        testimonial_id: parseInt(testimonialId),
                                        text: commentText,
                                        author: authorName
                                    }])
                                    .select()
                                    .single();
                                
                                if (error) throw error;
                                
                                // Display comment
                                const commentsList = this.closest('.testimonial-comments').querySelector('.comments-list');
                                if (commentsList && newComment) {
                                    const commentDiv = document.createElement('div');
                                    commentDiv.className = 'comment-item';
                                    commentDiv.innerHTML = `
                                        <div class="comment-author">${authorName}</div>
                                        <div class="comment-text">${commentText}</div>
                                        <div class="comment-time">${new Date(newComment.created_at).toLocaleString()}</div>
                                    `;
                                    commentsList.appendChild(commentDiv);
                                    
                                    // Clear form
                                    commentInput.value = '';
                                    if (nameInput) nameInput.value = '';
                                }
                            } catch (error) {
                                console.error('Error saving comment:', error);
                                alert('Error saving comment. Please try again.');
                            }
                        } else {
                            alert('Database connection not available. Please refresh the page.');
                        }
                            <div class="comment-time">${newComment.time}</div>
                        `;
                        commentsList.appendChild(commentDiv);
                        
                        // Clear form
                        commentInput.value = '';
                        nameInput.value = '';
                        
                        this.setAttribute('data-initialized', 'true');
                    });
                    form.setAttribute('data-initialized', 'true');
                }
            });
        }, 200);
        } catch (error) {
            console.error('Error loading testimonials:', error);
        }
    }
    
    // Load when DOM is ready and after a short delay to ensure other scripts have run
    function initLoader() {
        console.log('Testimonials loader script initialized');
        console.log('Document ready state:', document.readyState);
        console.log('Testimonials grid exists:', !!document.querySelector('.testimonials-grid'));
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                console.log('DOM loaded, initializing testimonials loader');
                // Wait a bit for other scripts and animations to initialize
                setTimeout(loadAdminTestimonials, 300);
            });
        } else {
            console.log('DOM already ready, loading testimonials after delay');
            // Wait a bit for other scripts and animations to initialize
            setTimeout(loadAdminTestimonials, 300);
        }
    }
    
    initLoader();
    
    // Testimonials Carousel System
    let carouselCurrentIndex = 0;
    let carouselAutoScroll = null;
    const testimonialsPerPage = 3;
    let carouselInitialized = false;
    
    function initTestimonialsCarousel() {
        // Clear any existing auto-scroll
        if (carouselAutoScroll) {
            clearInterval(carouselAutoScroll);
            carouselAutoScroll = null;
        }
        const grid = document.querySelector('.testimonials-grid');
        const controls = document.getElementById('testimonial-controls');
        const prevBtn = document.getElementById('prev-testimonials');
        const nextBtn = document.getElementById('next-testimonials');
        const indicators = document.getElementById('testimonial-indicators');
        
        if (!grid) {
            console.warn('Testimonials grid not found for carousel');
            return;
        }
        
        const allCards = Array.from(grid.querySelectorAll('.testimonial-card'));
        const totalCards = allCards.length;
        
        if (totalCards === 0) {
            console.warn('No testimonials found for carousel');
            return;
        }
        
        // Show controls if we have more than 3 testimonials
        if (totalCards > testimonialsPerPage && controls) {
            controls.style.display = 'flex';
        } else if (controls) {
            controls.style.display = 'none';
        }
        
        // Create indicators
        if (indicators) {
            const totalPages = Math.ceil(totalCards / testimonialsPerPage);
            indicators.innerHTML = '';
            for (let i = 0; i < totalPages; i++) {
                const indicator = document.createElement('button');
                indicator.className = 'testimonial-indicator';
                indicator.setAttribute('aria-label', `Go to page ${i + 1}`);
                indicator.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    carouselCurrentIndex = i * testimonialsPerPage;
                    showTestimonialsPage(carouselCurrentIndex);
                    resetAutoScroll();
                });
                indicators.appendChild(indicator);
            }
        }
        
        function showTestimonialsPage(startIndex) {
            // Ensure all cards are visible first (for CSS to work)
            allCards.forEach(card => {
                card.style.setProperty('display', '', 'important');
                card.style.setProperty('opacity', '1', 'important');
                card.style.setProperty('visibility', 'visible', 'important');
            });
            
            // Hide cards not in current page
            allCards.forEach((card, index) => {
                if (index >= startIndex && index < startIndex + testimonialsPerPage) {
                    card.style.setProperty('display', '', 'important');
                    card.style.setProperty('opacity', '1', 'important');
                    card.style.setProperty('visibility', 'visible', 'important');
                    card.classList.add('is-visible');
                } else {
                    card.style.setProperty('display', 'none', 'important');
                    card.style.setProperty('opacity', '0', 'important');
                    card.style.setProperty('visibility', 'hidden', 'important');
                    card.classList.remove('is-visible');
                }
            });
            
            // Update indicators
            if (indicators) {
                const currentPage = Math.floor(startIndex / testimonialsPerPage);
                const indicatorButtons = indicators.querySelectorAll('.testimonial-indicator');
                indicatorButtons.forEach((ind, i) => {
                    ind.classList.toggle('active', i === currentPage);
                });
            }
            
            // Update button states
            if (prevBtn) {
                prevBtn.disabled = startIndex === 0;
            }
            if (nextBtn) {
                const maxIndex = Math.max(0, totalCards - testimonialsPerPage);
                nextBtn.disabled = startIndex >= maxIndex;
            }
            
            console.log(`Showing testimonials ${startIndex + 1} to ${Math.min(startIndex + testimonialsPerPage, totalCards)} of ${totalCards}`);
        }
        
        function nextTestimonials() {
            const maxIndex = Math.max(0, totalCards - testimonialsPerPage);
            carouselCurrentIndex += testimonialsPerPage;
            
            // If we've gone past the last page, loop back to start
            if (carouselCurrentIndex > maxIndex) {
                carouselCurrentIndex = 0;
            }
            
            // Ensure we don't go negative
            if (carouselCurrentIndex < 0) {
                carouselCurrentIndex = maxIndex;
            }
            
            showTestimonialsPage(carouselCurrentIndex);
        }
        
        function prevTestimonials() {
            const maxIndex = Math.max(0, totalCards - testimonialsPerPage);
            carouselCurrentIndex -= testimonialsPerPage;
            
            // If we've gone before the first page, loop to the last page
            if (carouselCurrentIndex < 0) {
                carouselCurrentIndex = maxIndex;
            }
            
            // Ensure we don't exceed max
            if (carouselCurrentIndex > maxIndex) {
                carouselCurrentIndex = 0;
            }
            
            showTestimonialsPage(carouselCurrentIndex);
        }
        
        function startAutoScroll() {
            if (totalCards <= testimonialsPerPage) return; // No need to auto-scroll if all fit
            
            carouselAutoScroll = setInterval(() => {
                nextTestimonials();
            }, 5000); // Auto-advance every 5 seconds
        }
        
        function resetAutoScroll() {
            if (carouselAutoScroll) {
                clearInterval(carouselAutoScroll);
                carouselAutoScroll = null;
            }
            startAutoScroll();
        }
        
        function stopAutoScroll() {
            if (carouselAutoScroll) {
                clearInterval(carouselAutoScroll);
                carouselAutoScroll = null;
            }
        }
        
        // Event listeners - prevent default and stop propagation
        if (nextBtn) {
            nextBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                nextTestimonials();
                resetAutoScroll();
            });
        }
        
        if (prevBtn) {
            prevBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                prevTestimonials();
                resetAutoScroll();
            });
        }
        
        // Pause on hover
        if (grid) {
            grid.addEventListener('mouseenter', stopAutoScroll);
            grid.addEventListener('mouseleave', startAutoScroll);
        }
        
        // Initialize
        carouselCurrentIndex = 0;
        showTestimonialsPage(carouselCurrentIndex);
        startAutoScroll();
        
        carouselInitialized = true;
        console.log('✅ Testimonials carousel initialized. Total cards:', totalCards, 'Showing', testimonialsPerPage, 'per page');
    }
    
    // Make carousel function globally accessible for re-initialization
    window.initTestimonialsCarousel = initTestimonialsCarousel;
    
    // Setup MutationObserver to watch for future testimonials
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(setupMutationObserver, 500);
        });
    } else {
        setTimeout(setupMutationObserver, 500);
    }
    
    // Also try loading after window load event
    window.addEventListener('load', () => {
        console.log('Window loaded event fired');
        if (!hasLoaded) {
            console.log('Window loaded, attempting to load testimonials');
            setTimeout(loadAdminTestimonials, 500);
        } else {
            console.log('Testimonials already loaded, skipping');
        }
        // Ensure MutationObserver is set up
        setupMutationObserver();
    });
    
    // Force load after a longer delay as fallback
    setTimeout(() => {
        if (!hasLoaded) {
            console.log('Fallback: Force loading testimonials after 2 seconds');
            loadAdminTestimonials();
        }
    }, 2000);
    
    // Listen for storage changes (when admin adds content)
    window.addEventListener('storage', (e) => {
        if (e.key === 'admin-testimonials') {
            console.log('Storage event detected for admin-testimonials');
            loadAdminTestimonials();
        }
    });
    
    window.addEventListener('admin-content-updated', (e) => {
        if (e.detail && e.detail.type === 'testimonials') {
            console.log('Admin content updated event for testimonials');
            loadAdminTestimonials();
        }
    });
})();

