// Gallery Loader - Loads photos from admin panel
(function() {
    // Listen for real-time updates
    window.addEventListener('admin-content-updated', function(e) {
        if (e.detail && e.detail.type === 'photos') {
            console.log('🔄 Reloading photos due to admin update');
            loadAdminPhotos();
        }
    });
    
    window.addEventListener('admin-data-updated', function(e) {
        if (e.detail && e.detail.key === 'admin-photos') {
            console.log('🔄 Reloading photos due to data update');
            loadAdminPhotos();
        }
    });
    
    window.addEventListener('storage', function(e) {
        if (e.key === 'admin-photos') {
            console.log('🔄 Reloading photos due to storage change');
            loadAdminPhotos();
        }
    });
    
    async function loadAdminPhotos() {
        const galleryGrid = document.querySelector('.gallery-grid');
        if (!galleryGrid) {
            console.warn('Gallery grid not found');
            return;
        }
        
        // Try to load from Supabase first, fallback to localStorage
        let adminPhotos = [];
        
        // Check if Supabase is available
        if (window.supabase) {
            try {
                console.log('📡 Loading photos from Supabase...');
                const { data, error } = await window.supabase
                    .from('photos')
                    .select('*')
                    .order('created_at', { ascending: false });
                
                if (error) {
                    console.warn('⚠️ Supabase error, falling back to localStorage:', error);
                    throw error; // Will trigger fallback
                }
                
                if (data && data.length > 0) {
                    adminPhotos = data;
                    console.log('✅ Successfully loaded', adminPhotos.length, 'photos from Supabase');
                    
                    // Log each photo's info (without the full base64 URL)
                    adminPhotos.forEach((photo, i) => {
                        const urlPreview = photo.url ? (photo.url.substring(0, 50) + '...') : 'NO URL';
                        console.log(`Photo ${i + 1}:`, {
                            id: photo.id,
                            title: photo.title,
                            urlLength: photo.url ? photo.url.length : 0,
                            urlPreview: urlPreview
                        });
                    });
                } else {
                    console.log('No photos found in Supabase');
                }
            } catch (supabaseError) {
                console.warn('⚠️ Supabase unavailable, trying localStorage fallback...');
                // Fall through to localStorage fallback
            }
        }
        
        // Fallback to localStorage if Supabase failed or not available
        if (adminPhotos.length === 0) {
            try {
                const stored = localStorage.getItem('admin-photos');
                if (stored) {
                    adminPhotos = JSON.parse(stored);
                    console.log('✅ Successfully parsed', adminPhotos.length, 'photos from localStorage (fallback)');
                } else {
                    console.log('No photos found in localStorage');
                }
            } catch (e) {
                console.error('❌ Error parsing admin photos from localStorage:', e);
                console.error('Raw data length:', localStorage.getItem('admin-photos')?.length || 0);
                return;
            }
        }
        
        console.log('Loading admin photos:', adminPhotos.length);
        
        // Get existing static photos (those without data-admin-photo attribute)
        const existingCards = galleryGrid.querySelectorAll('.gallery-card:not([data-admin-photo])');
        console.log('Found', existingCards.length, 'existing static photos');
        
        // If admin photos exist, add them to the gallery (don't remove static photos)
        if (adminPhotos.length > 0) {
            // Remove only previously added admin photos to avoid duplicates
            const oldAdminCards = galleryGrid.querySelectorAll('.gallery-card[data-admin-photo]');
            oldAdminCards.forEach(card => card.remove());
            console.log('Removed', oldAdminCards.length, 'old admin photos');
            
            console.log('Adding', adminPhotos.length, 'admin photos to gallery');
            
            // Add admin photos (append to existing static photos)
            let addedCount = 0;
            adminPhotos.forEach((photo, index) => {
                if (!photo || !photo.url) {
                    console.warn('Photo missing URL or invalid:', photo);
                    return;
                }
                
                // Validate URL format
                const isValidUrl = photo.url.startsWith('http://') || 
                                  photo.url.startsWith('https://') || 
                                  photo.url.startsWith('data:image/');
                
                if (!isValidUrl) {
                    console.warn('Invalid photo URL format:', photo.url.substring(0, 50));
                    return;
                }
                
                const card = document.createElement('a');
                card.className = 'gallery-card';
                card.href = photo.url;
                card.setAttribute('data-lightbox', 'gallery');
                card.setAttribute('data-photo-id', photo.id || index);
                card.setAttribute('data-admin-photo', 'true'); // Mark as admin photo
                
                const img = document.createElement('img');
                img.alt = photo.alt || photo.title || 'Gallery photo';
                
                // For base64 images (data URLs), don't use lazy loading as they load instantly
                const isBase64 = photo.url.startsWith('data:image/');
                if (!isBase64) {
                    img.loading = 'lazy';
                }
                
                // Make sure card is visible by default and stays visible
                card.style.cssText = 'display: block !important; opacity: 1 !important;';
                
                // Add error handling with detailed logging
                img.onerror = function() {
                    console.error('❌ Failed to load photo:', {
                        id: photo.id,
                        title: photo.title,
                        urlLength: photo.url.length,
                        urlStart: photo.url.substring(0, 50)
                    });
                    // Show error message but keep card visible
                    const errorDiv = document.createElement('div');
                    errorDiv.style.cssText = 'padding: 2rem; text-align: center; color: var(--text-secondary); background: var(--bg-secondary); border-radius: 8px;';
                    errorDiv.textContent = 'Failed to load image';
                    card.innerHTML = '';
                    card.appendChild(errorDiv);
                    card.style.cssText = 'display: block !important; opacity: 1 !important;';
                };
                
                img.onload = function() {
                    // Add loaded class to make image visible (required by CSS for lazy-loaded images)
                    img.classList.add('loaded');
                    // Force card to stay visible with !important
                    card.style.cssText = 'display: block !important; opacity: 1 !important;';
                    console.log('✅ Photo loaded successfully:', photo.title || photo.id);
                };
                
                // Set src after setting up handlers
                img.src = photo.url;
                
                // If image is already loaded (cached or base64), add loaded class immediately
                if (img.complete && img.naturalWidth > 0) {
                    img.classList.add('loaded');
                } else if (isBase64) {
                    // Base64 images load instantly, add loaded class after a tiny delay
                    setTimeout(() => {
                        if (img.complete && img.naturalWidth > 0) {
                            img.classList.add('loaded');
                        }
                    }, 10);
                }
                
                card.appendChild(img);
                galleryGrid.appendChild(card);
                
                // Force visibility immediately after adding
                setTimeout(() => {
                    card.style.cssText = 'display: block !important; opacity: 1 !important;';
                    // Verify it's actually in the DOM
                    if (galleryGrid.contains(card)) {
                        console.log('✅ Verified photo card is in DOM:', photo.title || `Photo ${index + 1}`);
                    } else {
                        console.error('❌ Photo card NOT in DOM:', photo.title || `Photo ${index + 1}`);
                    }
                }, 100);
                
                addedCount++;
                console.log('Added photo card to gallery:', photo.title || `Photo ${index + 1}`);
            });
            
            console.log(`✅ Successfully added ${addedCount} admin photos to gallery`);
            
            // Verify all admin photos are in the DOM
            setTimeout(() => {
                const allAdminCards = galleryGrid.querySelectorAll('.gallery-card[data-admin-photo]');
                console.log('✅ Verification: Found', allAdminCards.length, 'admin photo cards in DOM');
                allAdminCards.forEach((card, i) => {
                    const computedStyle = window.getComputedStyle(card);
                    console.log(`Admin photo ${i + 1} - Display:`, computedStyle.display, 'Opacity:', computedStyle.opacity);
                    // Force visibility again
                    card.style.cssText = 'display: block !important; opacity: 1 !important;';
                });
            }, 500);
            
            // Don't re-initialize the loader for admin photos - they're already visible
            // Only initialize for static photos if needed
            console.log('Admin photos added. Total photos in gallery:', galleryGrid.querySelectorAll('.gallery-card').length);
        } else {
            console.log('No admin photos found, keeping static photos only');
        }
        
        // Always ensure static photos are visible (don't let inline script hide them)
        ensureStaticPhotosVisible();
    }
    
    // Ensure static photos remain visible (prevent inline script from hiding them)
    function ensureStaticPhotosVisible() {
        const staticCards = document.querySelectorAll('.gallery-card:not([data-admin-photo])');
        staticCards.forEach((card, index) => {
            const img = card.querySelector('img');
            if (!img) return;
            
            // Always ensure card is visible if image has loaded
            if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
                card.style.display = 'block';
                card.style.opacity = '1';
            } else if (!img.complete) {
                // Image still loading - ensure it will be visible when loaded
                const showCard = function() {
                    if (img.naturalWidth > 0 && img.naturalHeight > 0) {
                        card.style.display = 'block';
                        card.style.opacity = '1';
                    }
                };
                // Only add listener if not already added
                if (!img.hasAttribute('data-listener-added')) {
                    img.setAttribute('data-listener-added', 'true');
                    img.addEventListener('load', showCard);
                }
            }
        });
    }
    
    // Ensure admin photos remain visible
    function ensureAdminPhotosVisible() {
        const adminCards = document.querySelectorAll('.gallery-card[data-admin-photo]');
        adminCards.forEach((card) => {
            // Force visibility with !important to override any inline styles
            card.style.cssText = 'display: block !important; opacity: 1 !important;';
            
            const img = card.querySelector('img');
            if (!img) return;
            
            // Always keep admin photos visible regardless of load state
            if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
                card.style.cssText = 'display: block !important; opacity: 1 !important;';
            } else if (img.complete && (img.naturalWidth === 0 || img.naturalHeight === 0)) {
                // Image failed to load but keep card visible
                card.style.cssText = 'display: block !important; opacity: 1 !important;';
            } else {
                // Still loading - keep visible
                card.style.cssText = 'display: block !important; opacity: 1 !important;';
            }
        });
    }
    
    // Load when DOM is ready
    // Wait longer to ensure inline scripts in gallery.html have run
    let hasLoaded = false; // Prevent multiple loads
    
    function initGalleryLoader() {
        // Check if gallery grid exists and has static photos
        const galleryGrid = document.querySelector('.gallery-grid');
        if (galleryGrid && !hasLoaded) {
            // Wait a bit more to let inline script initialize, then load admin photos
            setTimeout(() => {
                loadAdminPhotos();
                hasLoaded = true;
                // Keep checking to ensure photos stay visible (both static and admin)
                // Check more frequently for admin photos
                setInterval(() => {
                    ensureStaticPhotosVisible();
                    ensureAdminPhotosVisible();
                }, 1000); // Check every second
            }, 1000);
        } else if (!galleryGrid) {
            // Retry if gallery grid not ready yet
            setTimeout(initGalleryLoader, 100);
        }
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initGalleryLoader);
    } else {
        initGalleryLoader();
    }
    
    // Listen for storage changes (when admin adds content)
    window.addEventListener('storage', (e) => {
        if (e.key === 'admin-photos') {
            console.log('Storage event detected for admin-photos');
            loadAdminPhotos();
        }
    });
    
    window.addEventListener('admin-content-updated', (e) => {
        if (e.detail && e.detail.type === 'photos') {
            console.log('Admin content updated event for photos');
            loadAdminPhotos();
        }
    });
    
    window.addEventListener('photos-updated', () => {
        console.log('Photos updated event received');
        loadAdminPhotos();
    });
})();

