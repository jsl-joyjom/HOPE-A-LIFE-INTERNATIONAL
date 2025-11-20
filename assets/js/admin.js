// Admin Panel JavaScript

// Initialize tab switching - wait for admin div to be visible
function initAdminTabs() {
    const adminDiv = document.getElementById('admin');
    if (!adminDiv || adminDiv.style.display === 'none') {
        // Admin div not visible yet, retry
        setTimeout(initAdminTabs, 100);
        return;
    }
    
    // Tab switching
    document.querySelectorAll('.admin-tab').forEach(tab => {
        // Remove any existing listeners by cloning
        if (tab.hasAttribute('data-listener-attached')) {
            return; // Already has listener
        }
        tab.setAttribute('data-listener-attached', 'true');
        
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const targetTab = tab.getAttribute('data-tab');
            if (!targetTab) return;
            
            // Update active tab
            document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Update active content
            document.querySelectorAll('.admin-content').forEach(c => c.classList.remove('active'));
            const targetContent = document.getElementById(`${targetTab}-tab`);
            if (targetContent) {
                targetContent.classList.add('active');
            }
            
            // Load content for active tab
            if (typeof loadTabContent === 'function') {
                loadTabContent(targetTab);
            }
        });
    });
    
    // Load initial tab content
    const activeTab = document.querySelector('.admin-tab.active');
    if (activeTab) {
        const initialTab = activeTab.getAttribute('data-tab');
        if (initialTab && typeof loadTabContent === 'function') {
            loadTabContent(initialTab);
        }
    }
}

// Start initialization
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdminTabs);
} else {
    initAdminTabs();
}

// Load content based on active tab
function loadTabContent(tab) {
    switch(tab) {
        case 'testimonials':
            loadTestimonials();
            break;
        case 'photos':
            loadPhotos();
            break;
        case 'videos':
            loadVideos();
            break;
        case 'comments':
            loadComments();
            break;
        case 'pending-stories':
            loadPendingStories();
            break;
        case 'contact-messages':
            loadContactMessages();
            break;
        case 'events':
            loadEvents();
            break;
        case 'news':
            loadNews();
            break;
        case 'publications':
            loadPublications();
            break;
        case 'quotes':
            loadQuotes();
            loadVerses();
            break;
    }
}

// Testimonials Management
async function loadTestimonials(searchTerm = '') {
    try {
        if (!window.supabase) {
            const list = document.getElementById('testimonials-list');
            list.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">Database connection not available. Please refresh the page.</p>';
            return;
        }

        const { data: testimonials, error } = await window.supabase
            .from('testimonials')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        const list = document.getElementById('testimonials-list');
        
        // Filter testimonials if search term provided
        let filteredTestimonials = testimonials || [];
        if (searchTerm.trim()) {
            const searchLower = searchTerm.toLowerCase();
            filteredTestimonials = filteredTestimonials.filter(testimonial => 
                (testimonial.name && testimonial.name.toLowerCase().includes(searchLower)) ||
                (testimonial.role && testimonial.role.toLowerCase().includes(searchLower)) ||
                (testimonial.quote && testimonial.quote.toLowerCase().includes(searchLower)) ||
                (testimonial.tags && testimonial.tags.toLowerCase().includes(searchLower))
            );
        }
        
        if (filteredTestimonials.length === 0) {
            list.innerHTML = searchTerm.trim() 
                ? `<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">No testimonials found matching "${searchTerm}"</p>`
                : '<p>No testimonials added yet. Add one above!</p>';
            return;
        }
        
        list.innerHTML = filteredTestimonials.map((testimonial) => {
            return `
            <div class="item-card">
                <div class="item-card-content">
                    <h3>${testimonial.name}</h3>
                    <p><strong>Role:</strong> ${testimonial.role || 'N/A'}</p>
                    <p>${testimonial.quote ? (testimonial.quote.length > 100 ? testimonial.quote.substring(0, 100) + '...' : testimonial.quote) : ''}</p>
                    ${testimonial.tags ? `<p><strong>Tags:</strong> ${testimonial.tags}</p>` : ''}
                </div>
                <div class="item-card-actions">
                    <button class="btn btn-secondary" onclick="editTestimonial(${testimonial.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-danger" onclick="deleteTestimonial(${testimonial.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
        }).join('');
    } catch (error) {
        console.error('Error loading testimonials:', error);
        const list = document.getElementById('testimonials-list');
        list.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">Error loading testimonials. Please try again.</p>';
    }
}

// Word count function
function countWords(text) {
    if (!text || !text.trim()) return 0;
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

// Initialize word counter for testimonial quote
document.addEventListener('DOMContentLoaded', () => {
    const quoteTextarea = document.getElementById('testimonial-quote');
    if (quoteTextarea) {
        // Create word counter element
        const wordCounter = document.createElement('small');
        wordCounter.className = 'word-counter';
        wordCounter.style.display = 'block';
        wordCounter.style.marginTop = '0.5rem';
        wordCounter.style.color = 'var(--text-secondary)';
        quoteTextarea.parentNode.appendChild(wordCounter);
        
        const updateWordCount = () => {
            const wordCount = countWords(quoteTextarea.value);
            const maxWords = 100;
            wordCounter.textContent = `${wordCount} / ${maxWords} words`;
            
            if (wordCount > maxWords) {
                wordCounter.style.color = '#ef4444';
                wordCounter.classList.add('over-limit');
            } else {
                wordCounter.style.color = 'var(--text-secondary)';
                wordCounter.classList.remove('over-limit');
            }
        };
        
        quoteTextarea.addEventListener('input', updateWordCount);
        quoteTextarea.addEventListener('paste', () => {
            setTimeout(updateWordCount, 10);
        });
        updateWordCount();
    }
});

document.getElementById('testimonial-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
        if (!window.supabase) {
            showAlert('testimonial-alert', '❌ Database connection not available. Please refresh the page.', 'error');
            return;
        }

        const quote = document.getElementById('testimonial-quote').value;
        const wordCount = countWords(quote);
        
        // Validate word count (max 100 words)
        if (wordCount > 100) {
            showAlert('testimonial-alert', `❌ Error: Testimonial text exceeds the maximum of 100 words. Current count: ${wordCount} words. Please reduce it to 100 words or less.`, 'error');
            return;
        }
        
        if (wordCount === 0) {
            showAlert('testimonial-alert', '❌ Error: Testimonial text is required.', 'error');
            return;
        }
        
        const form = document.getElementById('testimonial-form');
        const editingId = form.getAttribute('data-editing-id');
        
        const testimonialData = {
            name: document.getElementById('testimonial-name').value,
            role: document.getElementById('testimonial-role').value || null,
            quote: quote,
            tags: document.getElementById('testimonial-tags').value || null
        };
        
        if (editingId) {
            // Update existing testimonial
            const { error } = await window.supabase
                .from('testimonials')
                .update(testimonialData)
                .eq('id', editingId);
            
            if (error) throw error;
            
            showAlert('testimonial-alert', '✅ Testimonial updated successfully!', 'success');
            form.removeAttribute('data-editing-id');
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn.getAttribute('data-original-html')) {
                const originalHTML = submitBtn.getAttribute('data-original-html');
                submitBtn.innerHTML = originalHTML;
                submitBtn.removeAttribute('data-original-html');
            }
        } else {
            // Insert new testimonial
            const { error } = await window.supabase
                .from('testimonials')
                .insert([testimonialData]);
            
            if (error) throw error;
            
            showAlert('testimonial-alert', '✅ Testimonial added successfully! It will appear on the Impact page. <a href="impact.html" target="_blank" style="color: inherit; text-decoration: underline;">View Impact Page</a>', 'success');
        }
        
        form.reset();
        
        // Reset word counter
        const wordCounter = document.querySelector('#testimonial-quote').parentNode.querySelector('.word-counter');
        if (wordCounter) {
            wordCounter.textContent = '0 / 100 words';
            wordCounter.style.color = 'var(--text-secondary)';
            wordCounter.classList.remove('over-limit');
        }
        
        await loadTestimonials();
        
        // Trigger custom event for same-tab updates
        window.dispatchEvent(new CustomEvent('admin-content-updated', { detail: { type: 'testimonials' } }));
        
    } catch (error) {
        console.error('Error saving testimonial:', error);
        showAlert('testimonial-alert', `❌ Error saving testimonial: ${error.message || 'Please try again.'}`, 'error');
    }
});

async function deleteTestimonial(testimonialId) {
    try {
        if (!window.supabase) {
            showAlert('testimonial-alert', '❌ Database connection not available. Please refresh the page.', 'error');
            return;
        }

        // First, get the testimonial to show its name in confirmation
        const { data: testimonialData, error: fetchError } = await window.supabase
            .from('testimonials')
            .select('name')
            .eq('id', testimonialId)
            .single();
        
        if (fetchError || !testimonialData) {
            showAlert('testimonial-alert', '❌ Testimonial not found.', 'error');
            return;
        }
        
        if (confirm(`Are you sure you want to delete the testimonial from "${testimonialData.name || 'this person'}"? This action cannot be undone.`)) {
            const { error } = await window.supabase
                .from('testimonials')
                .delete()
                .eq('id', testimonialId);
            
            if (error) throw error;
            
            await loadTestimonials();
            showAlert('testimonial-alert', '✅ Testimonial deleted successfully.', 'success');
            window.dispatchEvent(new CustomEvent('admin-content-updated', { detail: { type: 'testimonials' } }));
        }
    } catch (error) {
        console.error('Error deleting testimonial:', error);
        showAlert('testimonial-alert', `❌ Error deleting testimonial: ${error.message || 'Please try again.'}`, 'error');
    }
}

async function editTestimonial(testimonialId) {
    try {
        if (!window.supabase) {
            showAlert('testimonial-alert', '❌ Database connection not available. Please refresh the page.', 'error');
            return;
        }

        const { data: testimonial, error } = await window.supabase
            .from('testimonials')
            .select('*')
            .eq('id', testimonialId)
            .single();
        
        if (error || !testimonial) {
            showAlert('testimonial-alert', '❌ Testimonial not found.', 'error');
            return;
        }
        
        document.getElementById('testimonial-name').value = testimonial.name || '';
        document.getElementById('testimonial-role').value = testimonial.role || '';
        document.getElementById('testimonial-quote').value = testimonial.quote || '';
        document.getElementById('testimonial-tags').value = testimonial.tags || '';
        
        // Store the ID being edited
        const form = document.getElementById('testimonial-form');
        form.setAttribute('data-editing-id', testimonialId);
        
        // Change submit button text
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalHTML = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-save"></i> Update Testimonial';
        submitBtn.setAttribute('data-original-html', originalHTML);
        
        // Scroll to form
        form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
        showAlert('testimonial-alert', '📝 Editing testimonial. Update the fields and click "Update Testimonial" to save changes.', 'info');
    } catch (error) {
        console.error('Error editing testimonial:', error);
        showAlert('testimonial-alert', `❌ Error loading testimonial for editing: ${error.message || 'Please try again.'}`, 'error');
    }
}

// Photos Management
async function loadPhotos(searchTerm = '') {
    try {
        if (!window.supabase) {
            console.error('Supabase client not available');
            const list = document.getElementById('photos-list');
            list.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">⚠️ Database connection not available. Please refresh the page.</p>';
            return;
        }

        // Fetch photos from Supabase
        let query = window.supabase
            .from('photos')
            .select('*')
            .order('created_at', { ascending: false });

        const { data: photos, error } = await query;

        if (error) throw error;

        const list = document.getElementById('photos-list');
        
        // Filter photos if search term provided
        let filteredPhotos = photos || [];
        if (searchTerm.trim()) {
            const searchLower = searchTerm.toLowerCase();
            filteredPhotos = filteredPhotos.filter(photo => 
                (photo.title && photo.title.toLowerCase().includes(searchLower)) ||
                (photo.description && photo.description.toLowerCase().includes(searchLower)) ||
                (photo.alt && photo.alt.toLowerCase().includes(searchLower))
            );
        }
        
        if (filteredPhotos.length === 0) {
            list.innerHTML = searchTerm.trim()
                ? `<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">No photos found matching "${searchTerm}"</p>`
                : '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">No photos added yet. Add one above!</p>';
            return;
        }
        
        // Sort by date (newest first) - already sorted by created_at, but use date field if available
        const sortedPhotos = [...filteredPhotos].sort((a, b) => {
            const dateA = a.date ? new Date(a.date) : new Date(a.created_at);
            const dateB = b.date ? new Date(b.date) : new Date(b.created_at);
            return dateB - dateA;
        });
        
        list.innerHTML = sortedPhotos.map((photo, index) => {
            // Use photo.id for edit/delete functions (Supabase auto-generates IDs)
            const photoId = photo.id;
        const photoDate = photo.date ? new Date(photo.date).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }) : 'Unknown date';
        
        // Create thumbnail preview (for base64, show first 100 chars, for URL show full)
        const urlPreview = photo.url ? (photo.url.length > 100 ? photo.url.substring(0, 100) + '...' : photo.url) : 'No URL';
        const isBase64 = photo.url && photo.url.startsWith('data:image/');
        
        return `
        <div class="photo-list-item">
            <div class="photo-list-thumbnail">
                ${photo.url ? `
                    <img src="${photo.url}" alt="${photo.alt || photo.title || 'Photo'}" 
                         onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'200\'%3E%3Crect fill=\'%23ddd\' width=\'200\' height=\'200\'/%3E%3Ctext fill=\'%23999\' font-family=\'sans-serif\' font-size=\'14\' dy=\'10.5\' font-weight=\'bold\' x=\'50%25\' y=\'50%25\' text-anchor=\'middle\'%3ENo Image%3C/text%3E%3C/svg%3E';"
                         loading="lazy">
                ` : `
                    <div class="photo-placeholder">
                        <i class="fas fa-image"></i>
                    </div>
                `}
            </div>
            <div class="photo-list-content">
                <h3>${photo.title || 'Untitled Photo'}</h3>
                ${photo.description ? `<p class="photo-list-description">${photo.description.length > 150 ? photo.description.substring(0, 150) + '...' : photo.description}</p>` : '<p class="photo-list-description" style="color: var(--text-secondary); font-style: italic;">No description</p>'}
                <div class="photo-list-meta">
                    <span><i class="fas fa-calendar"></i> ${photoDate}</span>
                    <span><i class="fas fa-link"></i> ${isBase64 ? 'Base64 Image' : 'External URL'}</span>
                    ${photo.alt ? `<span><i class="fas fa-tag"></i> Alt: ${photo.alt}</span>` : ''}
                </div>
            </div>
            <div class="photo-list-actions">
                <button class="btn btn-secondary btn-sm" onclick="viewPhotoDetails(${photoId})" title="View Details">
                    <i class="fas fa-eye"></i> View More
                </button>
                <button class="btn btn-primary btn-sm" onclick="editPhoto(${photoId})" title="Edit Photo">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-danger btn-sm" onclick="deletePhoto(${photoId})" title="Delete Photo">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
        `;
    }).join('');
    } catch (error) {
        console.error('Error loading photos:', error);
        const list = document.getElementById('photos-list');
        list.innerHTML = '<p style="text-align: center; color: var(--text-danger); padding: 2rem;">❌ Error loading photos. Please try again.</p>';
    }
}

document.getElementById('photo-form').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const form = document.getElementById('photo-form');
    const editingId = form.getAttribute('data-editing-id'); // Changed from data-editing-index
    
    const photoFile = document.getElementById('photo-file').files[0];
    let photoUrl = document.getElementById('photo-url').value;
    
    // Handle local file upload
    if (photoFile && !photoUrl) {
        const reader = new FileReader();
        reader.onload = (e) => {
            photoUrl = e.target.result;
            if (editingId !== null) {
                updatePhoto(parseInt(editingId), photoUrl); // Pass ID instead of index
            } else {
                savePhoto(photoUrl);
            }
        };
        reader.onerror = () => {
            showAlert('photo-alert', '❌ Error reading file. Please try again.', 'error');
        };
        reader.readAsDataURL(photoFile);
    } else if (!photoUrl && editingId === null) {
        // Only require URL for new photos, not when editing (keep existing URL)
        showAlert('photo-alert', '⚠️ Please provide either a photo URL or upload a file.', 'error');
        return;
    } else {
        if (editingId !== null) {
            updatePhoto(parseInt(editingId), photoUrl); // Pass ID instead of index
        } else {
            savePhoto(photoUrl);
        }
    }
});

async function updatePhoto(photoId, photoUrl) {
    try {
        if (!window.supabase) {
            showAlert('photo-alert', '❌ Database connection not available. Please refresh the page.', 'error');
            return;
        }

        // Prepare update data
        const updateData = {
            title: document.getElementById('photo-title').value,
            description: document.getElementById('photo-description').value,
            alt: document.getElementById('photo-alt').value || document.getElementById('photo-title').value
        };
        
        // Only update URL if a new one was provided
        if (photoUrl) {
            updateData.url = photoUrl;
        }
        
        // Update photo in Supabase
        const { data, error } = await window.supabase
            .from('photos')
            .update(updateData)
            .eq('id', photoId)
            .select();
        
        if (error) throw error;
        
        if (!data || data.length === 0) {
            showAlert('photo-alert', '❌ Photo not found.', 'error');
            return;
        }
        
        showAlert('photo-alert', '✅ Photo updated successfully!', 'success');
        
        // Reset form
        document.getElementById('photo-form').reset();
        document.getElementById('photo-form').removeAttribute('data-editing-id');
        const submitBtn = document.querySelector('#photo-form button[type="submit"]');
        const originalHTML = submitBtn.getAttribute('data-original-html') || '<i class="fas fa-upload"></i> Add Photo';
        submitBtn.innerHTML = originalHTML;
        submitBtn.removeAttribute('data-original-html');
        
        await loadPhotos();
        
        // Trigger real-time update event
        window.dispatchEvent(new CustomEvent('admin-content-updated', { detail: { type: 'photos' } }));
        
    } catch (error) {
        console.error('Error updating photo:', error);
        showAlert('photo-alert', `❌ Error updating photo: ${error.message || 'Please try again.'}`, 'error');
    }
}

async function savePhoto(photoUrl) {
    try {
        if (!window.supabase) {
            showAlert('photo-alert', '❌ Database connection not available. Please refresh the page.', 'error');
            return;
        }

        const photo = {
            title: document.getElementById('photo-title').value,
            description: document.getElementById('photo-description').value,
            url: photoUrl,
            alt: document.getElementById('photo-alt').value || document.getElementById('photo-title').value,
            date: new Date().toISOString()
        };
        
        console.log('Saving photo to Supabase:', { ...photo, urlLength: photo.url.length });
        
        // Insert photo into Supabase
        const { data, error } = await window.supabase
            .from('photos')
            .insert([photo])
            .select();
        
        if (error) throw error;
        
        console.log('✅ Photo saved to Supabase:', data);
        
        showAlert('photo-alert', '✅ Photo added successfully! It will appear on the Gallery page. <a href="gallery.html" target="_blank" style="color: inherit; text-decoration: underline;">View Gallery</a>', 'success');
        document.getElementById('photo-form').reset();
        document.getElementById('photo-form').removeAttribute('data-editing-id');
        const submitBtn = document.querySelector('#photo-form button[type="submit"]');
        if (submitBtn.getAttribute('data-original-html')) {
            const originalHTML = submitBtn.getAttribute('data-original-html');
            submitBtn.innerHTML = originalHTML;
            submitBtn.removeAttribute('data-original-html');
        }
        
        await loadPhotos();
        
        // Trigger custom event for real-time updates
        window.dispatchEvent(new CustomEvent('admin-content-updated', { detail: { type: 'photos' } }));
        
    } catch (error) {
        console.error('❌ Error saving photo:', error);
        showAlert('photo-alert', `❌ Error saving photo: ${error.message || 'Please try again.'}`, 'error');
    }
}

async function viewPhotoDetails(photoId) {
    try {
        if (!window.supabase) {
            showAlert('photo-alert', '❌ Database connection not available. Please refresh the page.', 'error');
            return;
        }

        const { data: photo, error } = await window.supabase
            .from('photos')
            .select('*')
            .eq('id', photoId)
            .single();
        
        if (error || !photo) {
            showAlert('photo-alert', '❌ Photo not found.', 'error');
            return;
        }
    
    // Create or get modal
    let modal = document.getElementById('photo-details-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'photo-details-modal';
        modal.className = 'photo-details-modal';
        modal.innerHTML = `
            <div class="photo-details-modal-overlay"></div>
            <div class="photo-details-modal-content">
                <div class="photo-details-modal-header">
                    <h2>Photo Details</h2>
                    <button class="photo-details-modal-close" aria-label="Close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="photo-details-modal-body" id="photo-details-body">
                    <!-- Content will be inserted here -->
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Close handlers
        const overlay = modal.querySelector('.photo-details-modal-overlay');
        const closeBtn = modal.querySelector('.photo-details-modal-close');
        
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
    
    // Populate modal content
    const body = document.getElementById('photo-details-body');
    const photoDate = photo.date ? new Date(photo.date).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }) : 'Unknown date';
    
    body.innerHTML = `
        <div class="photo-details-image">
            ${photo.url ? `
                <img src="${photo.url}" alt="${photo.alt || photo.title || 'Photo'}" 
                     onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'400\' height=\'300\'%3E%3Crect fill=\'%23ddd\' width=\'400\' height=\'300\'/%3E%3Ctext fill=\'%23999\' font-family=\'sans-serif\' font-size=\'18\' dy=\'10.5\' font-weight=\'bold\' x=\'50%25\' y=\'50%25\' text-anchor=\'middle\'%3EImage Not Available%3C/text%3E%3C/svg%3E';">
            ` : '<div class="photo-placeholder-large"><i class="fas fa-image"></i> No Image</div>'}
        </div>
        <div class="photo-details-info">
            <div class="photo-details-field">
                <label>Title:</label>
                <p>${photo.title || 'Untitled Photo'}</p>
            </div>
            ${photo.description ? `
                <div class="photo-details-field">
                    <label>Description:</label>
                    <p>${photo.description}</p>
                </div>
            ` : ''}
            ${photo.alt ? `
                <div class="photo-details-field">
                    <label>Alt Text:</label>
                    <p>${photo.alt}</p>
                </div>
            ` : ''}
            <div class="photo-details-field">
                <label>Uploaded:</label>
                <p>${photoDate}</p>
            </div>
            <div class="photo-details-field">
                <label>Image Type:</label>
                <p>${photo.url && photo.url.startsWith('data:image/') ? 'Base64 Encoded Image' : 'External URL'}</p>
            </div>
            <div class="photo-details-field">
                <label>URL:</label>
                <p class="photo-details-url">
                    ${photo.url && photo.url.length > 100 ? photo.url.substring(0, 100) + '...' : (photo.url || 'No URL')}
                    ${photo.url ? `<button class="btn btn-sm btn-secondary" onclick="navigator.clipboard.writeText('${photo.url.replace(/'/g, "\\'")}'); showAlert('photo-alert', '✅ URL copied to clipboard!', 'success');" title="Copy URL"><i class="fas fa-copy"></i> Copy</button>` : ''}
                </p>
            </div>
        </div>
    `;
    
    // Show modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    } catch (error) {
        console.error('Error viewing photo details:', error);
        showAlert('photo-alert', '❌ Error loading photo details.', 'error');
    }
}

async function editPhoto(photoId) {
    try {
        if (!window.supabase) {
            showAlert('photo-alert', '❌ Database connection not available. Please refresh the page.', 'error');
            return;
        }

        const { data: photo, error } = await window.supabase
            .from('photos')
            .select('*')
            .eq('id', photoId)
            .single();
        
        if (error || !photo) {
            showAlert('photo-alert', '❌ Photo not found.', 'error');
            return;
        }
        
        // Populate form with photo data
        document.getElementById('photo-title').value = photo.title || '';
        document.getElementById('photo-description').value = photo.description || '';
        document.getElementById('photo-url').value = photo.url && !photo.url.startsWith('data:image/') ? photo.url : '';
        document.getElementById('photo-alt').value = photo.alt || '';
        document.getElementById('photo-file').value = ''; // Clear file input
        
        // Store the ID being edited (changed from index to ID)
        const form = document.getElementById('photo-form');
        form.setAttribute('data-editing-id', photoId);
    
    // Change submit button text
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalHTML = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-save"></i> Update Photo';
    submitBtn.setAttribute('data-original-html', originalHTML);
    
    // Scroll to form
    form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
    showAlert('photo-alert', '📝 Editing photo. Update the fields and click "Update Photo" to save changes.', 'info');
    } catch (error) {
        console.error('Error editing photo:', error);
        showAlert('photo-alert', `❌ Error loading photo for editing: ${error.message || 'Please try again.'}`, 'error');
    }
}

async function deletePhoto(photoId) {
    try {
        if (!window.supabase) {
            showAlert('photo-alert', '❌ Database connection not available. Please refresh the page.', 'error');
            return;
        }

        // First, get the photo to show its title in confirmation
        const { data: photoData, error: fetchError } = await window.supabase
            .from('photos')
            .select('title')
            .eq('id', photoId)
            .single();
        
        if (fetchError || !photoData) {
            showAlert('photo-alert', '❌ Photo not found.', 'error');
            return;
        }
        
        if (confirm(`Are you sure you want to delete "${photoData.title || 'this photo'}"? This action cannot be undone.`)) {
            const { error } = await window.supabase
                .from('photos')
                .delete()
                .eq('id', photoId);
            
            if (error) throw error;
            
            await loadPhotos();
            showAlert('photo-alert', '✅ Photo deleted successfully.', 'success');
            window.dispatchEvent(new CustomEvent('admin-content-updated', { detail: { type: 'photos' } }));
        }
    } catch (error) {
        console.error('Error deleting photo:', error);
        showAlert('photo-alert', `❌ Error deleting photo: ${error.message || 'Please try again.'}`, 'error');
    }
}

// Videos Management
async function loadVideos(searchTerm = '') {
    try {
        if (!window.supabase) {
            const list = document.getElementById('videos-list');
            list.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">Database connection not available. Please refresh the page.</p>';
            return;
        }

        const { data: videos, error } = await window.supabase
            .from('videos')
            .select('*')
            .order('date', { ascending: false });
        
        if (error) throw error;
        
        const list = document.getElementById('videos-list');
        
        // Filter videos if search term provided
        let filteredVideos = videos || [];
        if (searchTerm.trim()) {
            const searchLower = searchTerm.toLowerCase();
            filteredVideos = filteredVideos.filter(video => 
                (video.title && video.title.toLowerCase().includes(searchLower)) ||
                (video.description && video.description.toLowerCase().includes(searchLower)) ||
                (video.url && video.url.toLowerCase().includes(searchLower))
            );
        }
        
        if (filteredVideos.length === 0) {
            list.innerHTML = searchTerm.trim()
                ? `<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">No videos found matching "${searchTerm}"</p>`
                : '<p>No videos added yet. Add one above!</p>';
            return;
        }
        
        list.innerHTML = filteredVideos.map((video) => {
            return `
            <div class="item-card">
                <div class="item-card-content">
                    <h3>${video.title}</h3>
                    ${video.description ? `<p>${video.description}</p>` : ''}
                    <p><strong>URL:</strong> <a href="${video.url}" target="_blank">${video.url}</a></p>
                    ${video.thumbnail ? `<p><strong>Thumbnail:</strong> <a href="${video.thumbnail}" target="_blank">${video.thumbnail}</a></p>` : ''}
                </div>
                <div class="item-card-actions">
                    <button class="btn btn-info" onclick="editVideo(${video.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-danger" onclick="deleteVideo(${video.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
        }).join('');
    } catch (error) {
        console.error('Error loading videos:', error);
        const list = document.getElementById('videos-list');
        list.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">Error loading videos. Please try again.</p>';
    }
}

document.getElementById('video-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
        if (!window.supabase) {
            showAlert('video-alert', '❌ Database connection not available. Please refresh the page.', 'error');
            return;
        }

        const form = document.getElementById('video-form');
        const editingId = form.getAttribute('data-editing-id');
        
        const videoData = {
            title: document.getElementById('video-title').value,
            description: document.getElementById('video-description').value,
            url: document.getElementById('video-url').value,
            thumbnail: document.getElementById('video-thumbnail').value || null,
            date: new Date().toISOString()
        };
        
        if (editingId) {
            // Update existing video
            const { error } = await window.supabase
                .from('videos')
                .update(videoData)
                .eq('id', editingId);
            
            if (error) throw error;
            
            showAlert('video-alert', '✅ Video updated successfully!', 'success');
            form.removeAttribute('data-editing-id');
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn.getAttribute('data-original-html')) {
                const originalHTML = submitBtn.getAttribute('data-original-html');
                submitBtn.innerHTML = originalHTML;
                submitBtn.removeAttribute('data-original-html');
            }
        } else {
            // Insert new video
            const { error } = await window.supabase
                .from('videos')
                .insert([videoData]);
            
            if (error) throw error;
            
            showAlert('video-alert', '✅ Video added successfully! It will appear on the Video Gallery page. <a href="video.html" target="_blank" style="color: inherit; text-decoration: underline;">View Videos</a>', 'success');
        }
        
        form.reset();
        await loadVideos();
        
        // Trigger custom event for real-time updates
        window.dispatchEvent(new CustomEvent('admin-content-updated', { detail: { type: 'videos' } }));
        
    } catch (error) {
        console.error('Error saving video:', error);
        showAlert('video-alert', `❌ Error saving video: ${error.message || 'Please try again.'}`, 'error');
    }
});

async function deleteVideo(videoId) {
    try {
        if (!window.supabase) {
            showAlert('video-alert', '❌ Database connection not available. Please refresh the page.', 'error');
            return;
        }

        // First, get the video to show its title in confirmation
        const { data: videoData, error: fetchError } = await window.supabase
            .from('videos')
            .select('title')
            .eq('id', videoId)
            .single();
        
        if (fetchError || !videoData) {
            showAlert('video-alert', '❌ Video not found.', 'error');
            return;
        }
        
        if (confirm(`Are you sure you want to delete "${videoData.title || 'this video'}"? This action cannot be undone.`)) {
            const { error } = await window.supabase
                .from('videos')
                .delete()
                .eq('id', videoId);
            
            if (error) throw error;
            
            await loadVideos();
            showAlert('video-alert', '✅ Video deleted successfully.', 'success');
            window.dispatchEvent(new CustomEvent('admin-content-updated', { detail: { type: 'videos' } }));
        }
    } catch (error) {
        console.error('Error deleting video:', error);
        showAlert('video-alert', `❌ Error deleting video: ${error.message || 'Please try again.'}`, 'error');
    }
}

async function editVideo(videoId) {
    try {
        if (!window.supabase) {
            showAlert('video-alert', '❌ Database connection not available. Please refresh the page.', 'error');
            return;
        }

        const { data: video, error } = await window.supabase
            .from('videos')
            .select('*')
            .eq('id', videoId)
            .single();
        
        if (error || !video) {
            showAlert('video-alert', '❌ Video not found.', 'error');
            return;
        }
        
        // Populate form with video data
        document.getElementById('video-title').value = video.title || '';
        document.getElementById('video-description').value = video.description || '';
        document.getElementById('video-url').value = video.url || '';
        document.getElementById('video-thumbnail').value = video.thumbnail || '';
        
        // Store the ID being edited
        const form = document.getElementById('video-form');
        form.setAttribute('data-editing-id', videoId);
    
        // Change submit button text
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalHTML = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-save"></i> Update Video';
        submitBtn.setAttribute('data-original-html', originalHTML);
    
        // Scroll to form
        form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
        showAlert('video-alert', '📝 Editing video. Update the fields and click "Update Video" to save changes.', 'info');
    } catch (error) {
        console.error('Error editing video:', error);
        showAlert('video-alert', `❌ Error loading video for editing: ${error.message || 'Please try again.'}`, 'error');
    }
}

// Comments Management
function loadComments(searchTerm = '') {
    const allComments = [];
    
    // Get comments from all testimonials
    for (let i = 1; i <= 10; i++) {
        const comments = JSON.parse(localStorage.getItem(`testimonial-comments-${i}`) || '[]');
        comments.forEach(comment => {
            allComments.push({
                ...comment,
                testimonialId: i
            });
        });
    }
    
    // Filter comments if search term provided
    let filteredComments = allComments;
    if (searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase();
        filteredComments = allComments.filter(comment => 
            (comment.author && comment.author.toLowerCase().includes(searchLower)) ||
            (comment.email && comment.email.toLowerCase().includes(searchLower)) ||
            (comment.text && comment.text.toLowerCase().includes(searchLower))
        );
    }
    
    const list = document.getElementById('comments-list');
    
    if (filteredComments.length === 0) {
        list.innerHTML = searchTerm.trim()
            ? `<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">No comments found matching "${searchTerm}"</p>`
            : '<p>No comments yet.</p>';
        return;
    }
    
    list.innerHTML = filteredComments.map((comment, index) => `
        <div class="item-card">
            <div class="item-card-content">
                <h3>${comment.author}</h3>
                <p>${comment.text}</p>
                <p><strong>Time:</strong> ${comment.time} | <strong>Testimonial ID:</strong> ${comment.testimonialId}</p>
            </div>
            <div class="item-card-actions">
                <button class="btn btn-danger" onclick="deleteComment(${comment.testimonialId}, ${comment.id})">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
}

function deleteComment(testimonialId, commentId) {
    if (confirm('Are you sure you want to delete this comment?')) {
        const comments = JSON.parse(localStorage.getItem(`testimonial-comments-${testimonialId}`) || '[]');
        const filtered = comments.filter(c => c.id !== commentId);
        localStorage.setItem(`testimonial-comments-${testimonialId}`, JSON.stringify(filtered));
        loadComments();
    }
}

// Utility Functions
function showAlert(containerId, message, type) {
    const container = document.getElementById(containerId);
    container.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
    setTimeout(() => {
        container.innerHTML = '';
    }, 5000); // Increased timeout to allow clicking the link
}

// Pending Stories Management
async function loadPendingStories(searchTerm = '') {
    try {
        console.log('Loading pending stories...');
        
        if (!window.supabase) {
            const list = document.getElementById('pending-stories-list');
            if (list) {
                list.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">Database connection not available. Please refresh the page.</p>';
            }
            return;
        }

        const { data: pendingStories, error } = await window.supabase
            .from('pending_stories')
            .select('*')
            .order('submitted_at', { ascending: false });
        
        if (error) throw error;
        
        console.log('Found pending stories:', pendingStories?.length || 0, pendingStories);
        const list = document.getElementById('pending-stories-list');
        
        if (!list) {
            console.error('pending-stories-list element not found!');
            return;
        }
        
        const stories = pendingStories || [];
        const pendingCount = stories.filter(s => s.status === 'pending').length;
        const countElement = document.getElementById('pending-count');
        if (countElement) {
            countElement.textContent = pendingCount;
        }
        
        // Filter stories if search term provided
        let filteredStories = stories;
        if (searchTerm.trim()) {
            const searchLower = searchTerm.toLowerCase();
            filteredStories = stories.filter(story => 
                (story.name && story.name.toLowerCase().includes(searchLower)) ||
                (story.quote && story.quote.toLowerCase().includes(searchLower)) ||
                (story.tags && story.tags.toLowerCase().includes(searchLower))
            );
        }
        
        if (filteredStories.length === 0) {
            list.innerHTML = searchTerm.trim()
                ? `<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">No stories found matching "${searchTerm}"</p>`
                : '<p style="text-align: center; color: var(--text-secondary);">No pending story submissions.</p>';
            return;
        }
        
        // Filter to show only pending stories first, then others
        const sortedStories = [...filteredStories].sort((a, b) => {
            if (a.status === 'pending' && b.status !== 'pending') return -1;
            if (a.status !== 'pending' && b.status === 'pending') return 1;
            return new Date(b.submitted_at || 0) - new Date(a.submitted_at || 0);
        });
        
        if (sortedStories.length === 0) {
            list.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No pending story submissions.</p>';
            return;
        }
        
            list.innerHTML = sortedStories.map((story) => {
                const submittedDate = story.submitted_at ? new Date(story.submitted_at).toLocaleDateString() : 'Unknown';
                return `
                <div class="item-card" style="border-left: 4px solid ${story.status === 'pending' ? '#f59e0b' : story.status === 'approved' ? '#10b981' : '#ef4444'};">
                    <div class="item-card-content">
                        <h3>${story.name || 'Untitled Story'}</h3>
                        <p><strong>By:</strong> ${story.name} ${story.role ? `(${story.role})` : ''}</p>
                        ${story.tags ? `<p><strong>Tags:</strong> ${story.tags}</p>` : ''}
                        <p><strong>Submitted:</strong> ${submittedDate}</p>
                        <p><strong>Status:</strong> <span style="text-transform: capitalize; color: ${story.status === 'pending' ? '#f59e0b' : story.status === 'approved' ? '#10b981' : '#ef4444'};">${story.status}</span></p>
                        <details style="margin-top: 1rem;">
                            <summary style="cursor: pointer; color: var(--primary-blue); font-weight: 600;">View Story</summary>
                            <div style="margin-top: 1rem; padding: 1rem; background: var(--bg-secondary); border-radius: 8px;">
                                <p>${story.quote || 'No story content'}</p>
                            </div>
                        </details>
                    </div>
                    <div class="item-card-actions">
                        ${story.status === 'pending' ? `
                            <button class="btn btn-primary" onclick="approveStory(${story.id})">
                                <i class="fas fa-check"></i> Approve & Post
                            </button>
                            <button class="btn btn-danger" onclick="rejectStory(${story.id})">
                                <i class="fas fa-times"></i> Reject
                            </button>
                        ` : ''}
                        <button class="btn btn-secondary" onclick="deletePendingStory(${story.id})">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            `;
            }).join('');
        } catch (error) {
            console.error('Error loading pending stories:', error);
            const list = document.getElementById('pending-stories-list');
            if (list) {
                list.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">Error loading pending stories. Please try again.</p>';
            }
        }
    }

async function approveStory(storyId) {
    try {
        if (!window.supabase) {
            showAlert('testimonial-alert', '❌ Database connection not available. Please refresh the page.', 'error');
            return;
        }
        
        // Get the story from Supabase
        const { data: story, error: fetchError } = await window.supabase
            .from('pending_stories')
            .select('*')
            .eq('id', storyId)
            .single();
        
        if (fetchError || !story) {
            showAlert('testimonial-alert', '❌ Story not found.', 'error');
            return;
        }
        
        // Convert to testimonial format
        const testimonialData = {
            name: story.name,
            role: story.role || 'Community Member',
            quote: story.quote,
            tags: story.tags || 'Stories of Transformation'
        };
        
        // Insert testimonial into Supabase
        const { error: insertError } = await window.supabase
            .from('testimonials')
            .insert([testimonialData]);
        
        if (insertError) throw insertError;
        
        // Update story status in Supabase
        const { error: updateError } = await window.supabase
            .from('pending_stories')
            .update({ 
                status: 'approved',
                reviewed_at: new Date().toISOString()
            })
            .eq('id', storyId);
        
        if (updateError) throw updateError;
        
        showAlert('testimonial-alert', '✅ Story approved and posted! <a href="impact.html" target="_blank" style="color: inherit; text-decoration: underline;">View on Impact Page</a>', 'success');
        await loadPendingStories();
        await loadTestimonials(); // Reload testimonials from Supabase
        window.dispatchEvent(new CustomEvent('admin-content-updated', { detail: { type: 'testimonials' } }));
    } catch (error) {
        console.error('Error approving story:', error);
        showAlert('testimonial-alert', `❌ Error approving story: ${error.message || 'Please try again.'}`, 'error');
    }
}

async function rejectStory(storyId) {
    if (!confirm('Are you sure you want to reject this story?')) {
        return;
    }
    
    try {
        if (!window.supabase) {
            showAlert('testimonial-alert', '❌ Database connection not available. Please refresh the page.', 'error');
            return;
        }
        
        const { error } = await window.supabase
            .from('pending_stories')
            .update({ 
                status: 'rejected',
                reviewed_at: new Date().toISOString()
            })
            .eq('id', storyId);
        
        if (error) throw error;
        
        await loadPendingStories();
    } catch (error) {
        console.error('Error rejecting story:', error);
        showAlert('testimonial-alert', `❌ Error rejecting story: ${error.message || 'Please try again.'}`, 'error');
    }
}

async function deletePendingStory(storyId) {
    if (!confirm('Are you sure you want to delete this story submission?')) {
        return;
    }
    
    try {
        if (!window.supabase) {
            showAlert('testimonial-alert', '❌ Database connection not available. Please refresh the page.', 'error');
            return;
        }
        
        const { error } = await window.supabase
            .from('pending_stories')
            .delete()
            .eq('id', storyId);
        
        if (error) throw error;
        
        await loadPendingStories();
    } catch (error) {
        console.error('Error deleting story:', error);
        showAlert('testimonial-alert', `❌ Error deleting story: ${error.message || 'Please try again.'}`, 'error');
    }
}

// Contact Messages Management
async function loadContactMessages(searchTerm = '') {
    try {
        if (!window.supabase) {
            const list = document.getElementById('contact-messages-list');
            if (list) {
                list.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">Database connection not available. Please refresh the page.</p>';
            }
            return;
        }

        const { data: messages, error } = await window.supabase
            .from('contact_messages')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        const list = document.getElementById('contact-messages-list');
        if (!list) return;
        
        const allMessages = messages || [];
        const newCount = allMessages.filter(m => m.status === 'new').length;
        const countElement = document.getElementById('contact-count');
        if (countElement) {
            countElement.textContent = newCount;
        }
        
        // Filter messages if search term provided
        let filteredMessages = allMessages;
        if (searchTerm.trim()) {
            const searchLower = searchTerm.toLowerCase();
            filteredMessages = allMessages.filter(msg => 
                (msg.name && msg.name.toLowerCase().includes(searchLower)) ||
                (msg.email && msg.email.toLowerCase().includes(searchLower)) ||
                (msg.subject && msg.subject.toLowerCase().includes(searchLower)) ||
                (msg.message && msg.message.toLowerCase().includes(searchLower))
            );
        }
        
        if (filteredMessages.length === 0) {
            list.innerHTML = searchTerm.trim()
                ? `<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">No messages found matching "${searchTerm}"</p>`
                : '<p style="text-align: center; color: var(--text-secondary);">No contact messages yet.</p>';
            return;
        }
        
        // Sort: new messages first
        const sortedMessages = [...filteredMessages].sort((a, b) => {
            if (a.status === 'new' && b.status !== 'new') return -1;
            if (a.status !== 'new' && b.status === 'new') return 1;
            return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        });
        
        list.innerHTML = sortedMessages.map((msg) => {
            const createdDate = msg.created_at ? new Date(msg.created_at).toLocaleDateString() : 'Unknown';
            const statusColor = msg.status === 'new' ? '#f59e0b' : msg.status === 'read' ? '#3b82f6' : msg.status === 'replied' ? '#10b981' : '#6b7280';
            return `
            <div class="item-card" style="border-left: 4px solid ${statusColor};">
                <div class="item-card-content">
                    <h3>${msg.name || 'Anonymous'}</h3>
                    <p><strong>Email:</strong> <a href="mailto:${msg.email}">${msg.email || 'N/A'}</a></p>
                    ${msg.subject ? `<p><strong>Subject:</strong> ${msg.subject}</p>` : ''}
                    <p><strong>Received:</strong> ${createdDate}</p>
                    <p><strong>Status:</strong> <span style="text-transform: capitalize; color: ${statusColor};">${msg.status || 'new'}</span></p>
                    <details style="margin-top: 1rem;">
                        <summary style="cursor: pointer; color: var(--primary-blue); font-weight: 600;">View Message</summary>
                        <div style="margin-top: 1rem; padding: 1rem; background: var(--bg-secondary); border-radius: 8px;">
                            <p style="white-space: pre-wrap;">${msg.message || 'No message content'}</p>
                        </div>
                    </details>
                </div>
                <div class="item-card-actions">
                    ${msg.status === 'new' ? `
                        <button class="btn btn-primary" onclick="markContactMessageRead(${msg.id})">
                            <i class="fas fa-check"></i> Mark as Read
                        </button>
                    ` : ''}
                    ${msg.status !== 'replied' ? `
                        <button class="btn btn-success" onclick="markContactMessageReplied(${msg.id})">
                            <i class="fas fa-reply"></i> Mark as Replied
                        </button>
                    ` : ''}
                    <button class="btn btn-secondary" onclick="deleteContactMessage(${msg.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
        }).join('');
    } catch (error) {
        console.error('Error loading contact messages:', error);
        const list = document.getElementById('contact-messages-list');
        if (list) {
            list.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">Error loading contact messages. Please try again.</p>';
        }
    }
}

async function markContactMessageRead(messageId) {
    try {
        if (!window.supabase) {
            showAlert('testimonial-alert', '❌ Database connection not available. Please refresh the page.', 'error');
            return;
        }
        
        const { error } = await window.supabase
            .from('contact_messages')
            .update({ status: 'read' })
            .eq('id', messageId);
        
        if (error) throw error;
        
        await loadContactMessages();
    } catch (error) {
        console.error('Error marking message as read:', error);
        showAlert('testimonial-alert', `❌ Error: ${error.message || 'Please try again.'}`, 'error');
    }
}

async function markContactMessageReplied(messageId) {
    try {
        if (!window.supabase) {
            showAlert('testimonial-alert', '❌ Database connection not available. Please refresh the page.', 'error');
            return;
        }
        
        const { error } = await window.supabase
            .from('contact_messages')
            .update({ 
                status: 'replied',
                replied_at: new Date().toISOString()
            })
            .eq('id', messageId);
        
        if (error) throw error;
        
        await loadContactMessages();
    } catch (error) {
        console.error('Error marking message as replied:', error);
        showAlert('testimonial-alert', `❌ Error: ${error.message || 'Please try again.'}`, 'error');
    }
}

async function deleteContactMessage(messageId) {
    if (!confirm('Are you sure you want to delete this contact message?')) {
        return;
    }
    
    try {
        if (!window.supabase) {
            showAlert('testimonial-alert', '❌ Database connection not available. Please refresh the page.', 'error');
            return;
        }
        
        const { error } = await window.supabase
            .from('contact_messages')
            .delete()
            .eq('id', messageId);
        
        if (error) throw error;
        
        await loadContactMessages();
    } catch (error) {
        console.error('Error deleting contact message:', error);
        showAlert('testimonial-alert', `❌ Error: ${error.message || 'Please try again.'}`, 'error');
    }
}

// Events Management
async function loadEvents(searchTerm = '') {
    try {
        if (!window.supabase) {
            const list = document.getElementById('events-list');
            list.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">Database connection not available. Please refresh the page.</p>';
            return;
        }

        const { data: events, error } = await window.supabase
            .from('events')
            .select('*')
            .order('date', { ascending: true });
        
        if (error) throw error;
        
        const list = document.getElementById('events-list');
        
        // Filter events if search term provided
        let filteredEvents = events || [];
        if (searchTerm.trim()) {
            const searchLower = searchTerm.toLowerCase();
            filteredEvents = filteredEvents.filter(event => 
                (event.title && event.title.toLowerCase().includes(searchLower)) ||
                (event.description && event.description.toLowerCase().includes(searchLower)) ||
                (event.location && event.location.toLowerCase().includes(searchLower)) ||
                (event.venue && event.venue.toLowerCase().includes(searchLower))
            );
        }
        
        if (filteredEvents.length === 0) {
            list.innerHTML = searchTerm.trim()
                ? `<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">No events found matching "${searchTerm}"</p>`
                : '<p>No events created yet. Create one above!</p>';
            return;
        }
        
        list.innerHTML = filteredEvents.map((event) => {
            const eventDate = new Date(event.date);
            const isUpcoming = eventDate >= new Date();
            return `
            <div class="item-card">
                <div class="item-card-content">
                    <h3>${event.title}</h3>
                    <p><strong>Date:</strong> ${eventDate.toLocaleDateString()} ${event.time ? `at ${event.time}` : ''}</p>
                    <p><strong>Location:</strong> ${event.location || 'N/A'}</p>
                    ${event.venue ? `<p><strong>Venue:</strong> ${event.venue}</p>` : ''}
                    <p>${event.description || ''}</p>
                    ${event.contact_name ? `<p><strong>Contact:</strong> ${event.contact_name} ${event.contact_email ? `(${event.contact_email})` : ''} ${event.contact_phone ? `- ${event.contact_phone}` : ''}</p>` : ''}
                    ${event.featured ? '<span style="background: #f59e0b; color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem;">Featured on Homepage</span>' : ''}
                </div>
                <div class="item-card-actions">
                    ${isUpcoming ? `
                        <button class="btn btn-info" onclick="viewEventRegistrants('${event.id}')" title="View Registrants">
                            <i class="fas fa-users"></i> View Registrants
                        </button>
                    ` : ''}
                    <button class="btn btn-secondary" onclick="editEvent(${event.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-danger" onclick="deleteEvent(${event.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
        }).join('');
    } catch (error) {
        console.error('Error loading events:', error);
        const list = document.getElementById('events-list');
        list.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">Error loading events. Please try again.</p>';
    }
}

// Initialize event form handlers when DOM is ready
function initEventFormHandlers() {
    // Document preview handler
    const eventDocumentsInput = document.getElementById('event-documents');
    if (eventDocumentsInput && !eventDocumentsInput.hasAttribute('data-listener-attached')) {
        eventDocumentsInput.setAttribute('data-listener-attached', 'true');
        eventDocumentsInput.addEventListener('change', (e) => {
            const files = e.target.files;
            const previewDiv = document.getElementById('event-documents-preview');
            if (previewDiv) {
                if (files.length > 0) {
                    let previewHTML = `<div style="margin-top: 0.5rem; padding: 0.75rem; background: var(--light-gray); border-radius: 6px;"><strong>Selected Files (${files.length}):</strong><ul style="margin: 0.5rem 0 0 0; padding-left: 1.5rem;">`;
                    Array.from(files).forEach(file => {
                        const fileSize = (file.size / 1024).toFixed(2) + ' KB';
                        previewHTML += `<li>${file.name} <small style="color: var(--text-secondary);">(${fileSize})</small></li>`;
                    });
                    previewHTML += '</ul></div>';
                    previewDiv.innerHTML = previewHTML;
                } else {
                    previewDiv.innerHTML = '';
                }
            }
        });
    }

    // Event form submit handler
    const eventForm = document.getElementById('event-form');
    if (eventForm && !eventForm.hasAttribute('data-listener-attached')) {
        eventForm.setAttribute('data-listener-attached', 'true');
        eventForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const imageFile = document.getElementById('event-image-file');
            const imageFileValue = imageFile ? imageFile.files[0] : null;
            let imageUrl = document.getElementById('event-image') ? document.getElementById('event-image').value : '';
            
            // Handle local file upload
            if (imageFileValue && !imageUrl) {
                const reader = new FileReader();
                reader.onload = async (e) => {
                    imageUrl = e.target.result;
                    await saveEvent(imageUrl);
                };
                reader.readAsDataURL(imageFileValue);
            } else {
                await saveEvent(imageUrl);
            }
        });
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initEventFormHandlers, 100);
    });
} else {
    setTimeout(initEventFormHandlers, 100);
}

// Also initialize when events tab is loaded
const originalLoadTabContent = loadTabContent;
loadTabContent = function(tab) {
    originalLoadTabContent(tab);
    if (tab === 'events') {
        setTimeout(initEventFormHandlers, 200); // Small delay to ensure DOM is updated
    }
};

async function saveEvent(imageUrl) {
    try {
        if (!window.supabase) {
            showAlert('event-alert', '❌ Database connection not available. Please refresh the page.', 'error');
            return;
        }

        const maxAttendees = parseInt(document.getElementById('event-max-attendees').value) || 0;
        const maxOrgAttendees = document.getElementById('event-max-org-attendees').value 
            ? parseInt(document.getElementById('event-max-org-attendees').value) 
            : null;
        
        // Handle document uploads
        const documentFiles = document.getElementById('event-documents').files;
        const documents = [];
        
        if (documentFiles.length > 0) {
            const filePromises = Array.from(documentFiles).map(file => {
                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        resolve({
                            name: file.name,
                            filename: file.name,
                            data: e.target.result,
                            url: e.target.result, // For data URLs
                            size: file.size,
                            type: file.type
                        });
                    };
                    reader.readAsDataURL(file);
                });
            });
            
            const docs = await Promise.all(filePromises);
            documents.push(...docs);
        }
        
        const form = document.getElementById('event-form');
        const editingId = form.getAttribute('data-editing-id');
        
        const eventData = {
            title: document.getElementById('event-title').value,
            date: document.getElementById('event-date').value,
            time: document.getElementById('event-time').value || null,
            location: document.getElementById('event-location').value || null,
            description: document.getElementById('event-description').value || null,
            venue: document.getElementById('event-venue').value || null,
            contact_name: document.getElementById('event-contact-name').value || null,
            contact_email: document.getElementById('event-contact-email').value || null,
            contact_phone: document.getElementById('event-contact-phone').value || null,
            image: imageUrl || null,
            registration_link: document.getElementById('event-registration-link').value || null,
            featured: document.getElementById('event-featured').checked,
            max_attendees: maxAttendees,
            max_attendees_per_organization: maxOrgAttendees,
            documents: documents.length > 0 ? documents : []
        };
        
        if (editingId) {
            // Update existing event
            const { error } = await window.supabase
                .from('events')
                .update(eventData)
                .eq('id', editingId);
            
            if (error) throw error;
            
            showAlert('event-alert', '✅ Event updated successfully!', 'success');
            form.removeAttribute('data-editing-id');
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.innerHTML = '<i class="fas fa-calendar-plus"></i> Create Event';
                submitBtn.onclick = null;
            }
        } else {
            // Insert new event
            const { error } = await window.supabase
                .from('events')
                .insert([eventData]);
            
            if (error) throw error;
            
            showAlert('event-alert', '✅ Event created successfully!', 'success');
        }
        
        document.getElementById('event-form').reset();
        document.getElementById('event-documents-preview').innerHTML = '';
        await loadEvents();
        window.dispatchEvent(new CustomEvent('admin-content-updated', { detail: { type: 'events' } }));
        
    } catch (error) {
        console.error('Error saving event:', error);
        showAlert('event-alert', `❌ Error saving event: ${error.message || 'Please try again.'}`, 'error');
    }
}

async function editEvent(eventId) {
    try {
        if (!window.supabase) {
            showAlert('event-alert', '❌ Database connection not available. Please refresh the page.', 'error');
            return;
        }

        const { data: event, error } = await window.supabase
            .from('events')
            .select('*')
            .eq('id', eventId)
            .single();
        
        if (error || !event) {
            showAlert('event-alert', '❌ Event not found.', 'error');
            return;
        }
        
        // Populate form
        document.getElementById('event-title').value = event.title || '';
        document.getElementById('event-date').value = event.date || '';
        document.getElementById('event-time').value = event.time || '';
        document.getElementById('event-location').value = event.location || '';
        document.getElementById('event-description').value = event.description || '';
        document.getElementById('event-venue').value = event.venue || '';
        document.getElementById('event-contact-name').value = event.contact_name || '';
        document.getElementById('event-contact-email').value = event.contact_email || '';
        document.getElementById('event-contact-phone').value = event.contact_phone || '';
        document.getElementById('event-image').value = event.image || '';
        document.getElementById('event-registration-link').value = event.registration_link || '';
        document.getElementById('event-featured').checked = event.featured || false;
        document.getElementById('event-max-attendees').value = event.max_attendees || '';
        document.getElementById('event-max-org-attendees').value = event.max_attendees_per_organization || '';
        
        // Display existing documents
        const previewDiv = document.getElementById('event-documents-preview');
        if (event.documents && event.documents.length > 0) {
            previewDiv.innerHTML = `
                <div style="margin-top: 0.5rem; padding: 0.75rem; background: var(--light-gray); border-radius: 6px;">
                    <strong>Existing Documents (${event.documents.length}):</strong>
                    <ul style="margin: 0.5rem 0 0 0; padding-left: 1.5rem;">
                        ${event.documents.map(doc => `<li>${doc.name || doc.filename || 'Document'}</li>`).join('')}
                    </ul>
                    <small style="color: var(--text-secondary);">Upload new files to add to existing documents</small>
                </div>
            `;
        } else {
            previewDiv.innerHTML = '';
        }
        
        // Store the ID being edited
        const form = document.getElementById('event-form');
        form.setAttribute('data-editing-id', eventId);
        
        // Change submit button text
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalHTML = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-save"></i> Update Event';
        submitBtn.setAttribute('data-original-html', originalHTML);
        
        // Scroll to form
        form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
        showAlert('event-alert', '📝 Editing event. Update the fields and click "Update Event" to save changes.', 'info');
    } catch (error) {
        console.error('Error editing event:', error);
        showAlert('event-alert', `❌ Error loading event for editing: ${error.message || 'Please try again.'}`, 'error');
    }
}

// updateEvent and saveUpdatedEvent are now handled by saveEvent with editingId

async function deleteEvent(eventId) {
    try {
        if (!window.supabase) {
            showAlert('event-alert', '❌ Database connection not available. Please refresh the page.', 'error');
            return;
        }

        // First, get the event to show its title in confirmation
        const { data: eventData, error: fetchError } = await window.supabase
            .from('events')
            .select('title')
            .eq('id', eventId)
            .single();
        
        if (fetchError || !eventData) {
            showAlert('event-alert', '❌ Event not found.', 'error');
            return;
        }
        
        if (confirm(`Are you sure you want to delete "${eventData.title || 'this event'}"? This action cannot be undone.`)) {
            const { error } = await window.supabase
                .from('events')
                .delete()
                .eq('id', eventId);
            
            if (error) throw error;
            
            await loadEvents();
            showAlert('event-alert', '✅ Event deleted successfully.', 'success');
            window.dispatchEvent(new CustomEvent('admin-content-updated', { detail: { type: 'events' } }));
        }
    } catch (error) {
        console.error('Error deleting event:', error);
        showAlert('event-alert', `❌ Error deleting event: ${error.message || 'Please try again.'}`, 'error');
    }
}

// Event Registrations Management
async function viewEventRegistrants(eventId) {
    try {
        // Get event and registrations from Supabase
        if (!window.supabase) {
            const container = document.getElementById('event-registrations-container');
            if (container) {
                container.innerHTML = '<p style="color: var(--error-color);">Database connection not available.</p>';
            }
            return;
        }

        const { data: event, error: eventError } = await window.supabase
            .from('events')
            .select('*')
            .eq('id', eventId)
            .single();
        
        if (eventError || !event) {
            const container = document.getElementById('event-registrations-container');
            if (container) {
                container.innerHTML = '<p style="color: var(--error-color);">Event not found.</p>';
            }
            return;
        }

        // Fetch registrations from Supabase
        const { data: eventRegistrations, error: regError } = await window.supabase
            .from('event_registrations')
            .select('*')
            .eq('event_id', eventId)
            .order('created_at', { ascending: false });
        
        if (regError) {
            console.error('Error fetching registrations:', regError);
            const container = document.getElementById('event-registrations-container');
            if (container) {
                container.innerHTML = '<p style="color: var(--error-color);">Error loading registrations.</p>';
            }
            return;
        }
        
        const registrations = eventRegistrations || [];
        
        const container = document.getElementById('event-registrations-container');
        if (!container) return;
        
        // Store current event ID for refresh
        container.setAttribute('data-current-event-id', eventId);
        
        if (registrations.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 2rem;">
                    <p style="color: var(--text-secondary); margin-bottom: 1rem;">No registrations yet for this event.</p>
                    <p style="color: var(--text-secondary); font-size: 0.9rem;">Event: <strong>${event.title}</strong></p>
                </div>
            `;
            return;
        }
        
        // Calculate total attendees
        const totalAttendees = registrations.reduce((sum, reg) => sum + (reg.number_of_attendees || 1), 0);
        const maxAttendees = event.max_attendees || 0;
        const remainingSlots = maxAttendees > 0 ? Math.max(0, maxAttendees - totalAttendees) : 'Unlimited';
        
        container.innerHTML = `
        <div style="margin-bottom: 1.5rem;">
            <h3 style="margin-bottom: 0.5rem;">${event.title}</h3>
            <p style="color: var(--text-secondary); margin-bottom: 1rem;">
                Date: ${new Date(event.date).toLocaleDateString()} | 
                Total Registrations: ${registrations.length} | 
                Total Attendees: ${totalAttendees}${maxAttendees > 0 ? ` / ${maxAttendees} (${remainingSlots} remaining)` : ''}
            </p>
            <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                <button class="btn btn-success" onclick="exportRegistrantsPDF('${eventId}')">
                    <i class="fas fa-file-pdf"></i> Export PDF
                </button>
                <button class="btn btn-success" onclick="exportRegistrantsExcel('${eventId}')">
                    <i class="fas fa-file-excel"></i> Export Excel
                </button>
                <button class="btn btn-primary" onclick="openBulkEmailModal('${eventId}')" style="background: var(--primary-blue);">
                    <i class="fas fa-envelope"></i> Send Invitation Emails
                </button>
                <button class="btn btn-primary" onclick="openBulkEmailModal('${eventId}')" style="background: var(--primary-blue);">
                    <i class="fas fa-envelope"></i> Send Invitation Emails
                </button>
            </div>
        </div>
        <div style="overflow-x: auto;">
            <table class="registrants-table" style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: var(--bg-secondary);">
                        <th style="padding: 0.75rem; text-align: left; border-bottom: 2px solid var(--border-color);">#</th>
                        <th style="padding: 0.75rem; text-align: left; border-bottom: 2px solid var(--border-color);">Name/Organization</th>
                        <th style="padding: 0.75rem; text-align: left; border-bottom: 2px solid var(--border-color);">Type</th>
                        <th style="padding: 0.75rem; text-align: left; border-bottom: 2px solid var(--border-color);">Email</th>
                        <th style="padding: 0.75rem; text-align: left; border-bottom: 2px solid var(--border-color);">Phone</th>
                        <th style="padding: 0.75rem; text-align: left; border-bottom: 2px solid var(--border-color);">Attendees</th>
                        <th style="padding: 0.75rem; text-align: left; border-bottom: 2px solid var(--border-color);">Attendee Details</th>
                        <th style="padding: 0.75rem; text-align: left; border-bottom: 2px solid var(--border-color);">Registered</th>
                    </tr>
                </thead>
                <tbody>
                    ${registrations.map((reg, index) => {
                        const attendeeDetails = reg.attendee_details || [];
                        const hasDetails = attendeeDetails.length > 0;
                        const name = reg.registration_type === 'organization' ? reg.contact_person : reg.registrant_name;
                        const email = reg.registration_type === 'organization' ? reg.contact_email : reg.registrant_email;
                        const phone = reg.registration_type === 'organization' ? reg.contact_phone : reg.registrant_phone;
                        return `
                        <tr style="border-bottom: 1px solid var(--border-color);">
                            <td style="padding: 0.75rem;">${index + 1}</td>
                            <td style="padding: 0.75rem;">
                                ${reg.registration_type === 'organization' ? `<strong>${reg.organization_name || 'N/A'}</strong><br><small>Contact: ${name || 'N/A'}</small>` : name || 'N/A'}
                            </td>
                            <td style="padding: 0.75rem; text-transform: capitalize;">${reg.registration_type || 'individual'}</td>
                            <td style="padding: 0.75rem;"><a href="mailto:${email}">${email || 'N/A'}</a></td>
                            <td style="padding: 0.75rem;"><a href="tel:${phone}">${phone || 'N/A'}</a></td>
                            <td style="padding: 0.75rem;">${reg.number_of_attendees || 1}</td>
                            <td style="padding: 0.75rem;">
                                ${hasDetails ? `
                                    <button class="btn btn-sm btn-info" onclick="viewAttendeeDetails(${reg.id})" style="padding: 0.25rem 0.5rem; font-size: 0.875rem;">
                                        <i class="fas fa-eye"></i> View (${attendeeDetails.length})
                                    </button>
                                ` : '<span style="color: var(--text-secondary);">No details</span>'}
                            </td>
                            <td style="padding: 0.75rem;">${new Date(reg.created_at).toLocaleDateString()}</td>
                        </tr>
                    `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
    } catch (error) {
        console.error('Error loading event registrants:', error);
        const container = document.getElementById('event-registrations-container');
        if (container) {
            container.innerHTML = '<p style="color: var(--error-color);">Error loading registrants. Please try again.</p>';
        }
    }
}

async function exportRegistrantsPDF(eventId) {
    try {
        const registrations = JSON.parse(localStorage.getItem('event-registrations') || '[]');
        const eventRegistrations = registrations.filter(reg => reg.eventId.toString() === eventId.toString());
        
        if (!window.supabase) {
            alert('Database connection not available.');
            return;
        }

        const { data: event, error } = await window.supabase
            .from('events')
            .select('*')
            .eq('id', eventId)
            .single();
        
        if (error || !event || eventRegistrations.length === 0) {
            alert('No registrations to export.');
            return;
        }
        
        // Create PDF content
        let pdfContent = `
        <html>
        <head>
            <title>Event Registrants - ${event.title}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h1 { color: #2563eb; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #2563eb; color: white; }
            </style>
        </head>
        <body>
            <h1>${event.title}</h1>
            <p><strong>Event Date:</strong> ${new Date(event.date).toLocaleDateString()}</p>
            <p><strong>Location:</strong> ${event.location}</p>
            <p><strong>Total Registrations:</strong> ${registrations.length}</p>
            <table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Name/Organization</th>
                        <th>Type</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Attendees</th>
                        <th>Registered</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
        registrations.forEach((reg, index) => {
            const name = reg.registration_type === 'organization' 
                ? `${reg.organization_name || 'N/A'} (Contact: ${reg.contact_person || 'N/A'})` 
                : reg.registrant_name || 'N/A';
            const email = reg.registration_type === 'organization' ? reg.contact_email : reg.registrant_email;
            const phone = reg.registration_type === 'organization' ? reg.contact_phone : reg.registrant_phone;
            pdfContent += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${name}</td>
                    <td>${reg.registration_type || 'individual'}</td>
                    <td>${email || 'N/A'}</td>
                    <td>${phone || 'N/A'}</td>
                    <td>${reg.number_of_attendees || 1}</td>
                    <td>${new Date(reg.created_at).toLocaleDateString()}</td>
                </tr>
            `;
        });
        
        pdfContent += `
                </tbody>
            </table>
        </body>
        </html>
    `;
    
        // Open print dialog
        const printWindow = window.open('', '_blank');
        printWindow.document.write(pdfContent);
        printWindow.document.close();
        printWindow.print();
    } catch (error) {
        console.error('Error exporting PDF:', error);
        alert('Error exporting PDF. Please try again.');
    }
}

async function exportRegistrantsExcel(eventId) {
    try {
        const registrations = JSON.parse(localStorage.getItem('event-registrations') || '[]');
        const eventRegistrations = registrations.filter(reg => reg.eventId.toString() === eventId.toString());
        
        if (!window.supabase) {
            alert('Database connection not available.');
            return;
        }

        const { data: event, error } = await window.supabase
            .from('events')
            .select('*')
            .eq('id', eventId)
            .single();
        
        if (error || !event || eventRegistrations.length === 0) {
            alert('No registrations to export.');
            return;
        }
        
        // Create CSV content
        let csvContent = `Event: ${event.title}\n`;
        csvContent += `Event Date: ${new Date(event.date).toLocaleDateString()}\n`;
        csvContent += `Location: ${event.location || 'N/A'}\n`;
        csvContent += `Total Registrations: ${eventRegistrations.length}\n\n`;
        
        csvContent += `#,Name/Organization,Type,Email,Phone,Address,Attendees,Registered Date,Additional Notes\n`;
        
        eventRegistrations.forEach((reg, index) => {
            const name = reg.registrationType === 'organization' 
                ? `${reg.organizationName || 'N/A'} (Contact: ${reg.name || 'N/A'})` 
                : reg.name || 'N/A';
            const email = reg.email || '';
            const phone = reg.phone || '';
            const address = (reg.address || '').replace(/,/g, ';');
            const notes = (reg.additionalNotes || '').replace(/,/g, ';');
            const registered = new Date(reg.registrationDate).toLocaleDateString();
            
            csvContent += `${index + 1},"${name}",${reg.registrationType || 'individual'},"${email}","${phone}","${address}",${reg.numberOfAttendees || 1},"${registered}","${notes}"\n`;
        });
        
        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `event-registrants-${event.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${Date.now()}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error('Error exporting Excel:', error);
        alert('Error exporting Excel. Please try again.');
    }
}

// Helper function to clean contact information from Excel formatting
function cleanContactInfo(value) {
    if (!value) return null;
    // Convert to string and trim
    let cleaned = String(value).trim();
    // Remove Excel date formatting artifacts (e.g., "44562" becomes empty)
    // Remove any non-printable characters
    cleaned = cleaned.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
    // Remove leading/trailing quotes
    cleaned = cleaned.replace(/^["']|["']$/g, '');
    // For emails, ensure it's a valid format
    if (cleaned.includes('@')) {
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(cleaned)) {
            return null; // Invalid email format
        }
    }
    // For phones, remove any non-digit characters except +, spaces, hyphens, parentheses
    if (!cleaned.includes('@')) {
        cleaned = cleaned.replace(/[^\d+\s\-()]/g, '');
    }
    return cleaned || null;
}

async function viewAttendeeDetails(registrationId) {
    try {
        if (!window.supabase) {
            alert('Database connection not available.');
            return;
        }

        const { data: registration, error } = await window.supabase
            .from('event_registrations')
            .select('*')
            .eq('id', registrationId)
            .single();
        
        if (error || !registration) {
            alert('Registration not found.');
            return;
        }
        
        if (!registration.attendee_details || registration.attendee_details.length === 0) {
            alert('No attendee details available.');
            return;
        }
        
        // Store the current event ID to refresh the view after closing
        const container = document.getElementById('event-registrations-container');
        const currentEventId = container ? container.getAttribute('data-current-event-id') : null;
        
        const orgName = registration.registration_type === 'organization' ? registration.organization_name : registration.registrant_name;
        
        let detailsHTML = `
        <div style="max-width: 800px; margin: 0 auto;">
            <h3 style="margin-bottom: 1rem; color: var(--navy-blue);">Attendee Details</h3>
            <p style="margin-bottom: 1.5rem;"><strong>Registration:</strong> ${orgName}</p>
            <table class="registrants-table" style="width: 100%; border-collapse: collapse; margin-top: 1rem;">
                <thead>
                    <tr style="background: var(--bg-secondary);">
                        <th style="padding: 0.75rem; text-align: left; border-bottom: 2px solid var(--border-color);">#</th>
                        <th style="padding: 0.75rem; text-align: left; border-bottom: 2px solid var(--border-color);">Name</th>
                        <th style="padding: 0.75rem; text-align: left; border-bottom: 2px solid var(--border-color);">Position</th>
                        <th style="padding: 0.75rem; text-align: left; border-bottom: 2px solid var(--border-color);">Email</th>
                        <th style="padding: 0.75rem; text-align: left; border-bottom: 2px solid var(--border-color);">Phone</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
        registration.attendee_details.forEach((attendee, index) => {
        // Clean contact information
        const cleanEmail = cleanContactInfo(attendee.email);
        const cleanPhone = cleanContactInfo(attendee.phone);
        
        detailsHTML += `
            <tr style="border-bottom: 1px solid var(--border-color);">
                <td style="padding: 0.75rem;">${index + 1}</td>
                <td style="padding: 0.75rem;">${attendee.name || 'N/A'}</td>
                <td style="padding: 0.75rem;">${attendee.position || 'N/A'}</td>
                <td style="padding: 0.75rem;">
                    ${cleanEmail ? `<a href="mailto:${cleanEmail}" style="color: var(--primary-blue); text-decoration: none;">${cleanEmail}</a>` : '<span style="color: var(--text-secondary);">N/A</span>'}
                </td>
                <td style="padding: 0.75rem;">
                    ${cleanPhone ? `<a href="tel:${cleanPhone.replace(/[\s\-()]/g, '')}" style="color: var(--primary-blue); text-decoration: none;">${cleanPhone}</a>` : '<span style="color: var(--text-secondary);">N/A</span>'}
                </td>
            </tr>
        `;
    });
    
    detailsHTML += `
                </tbody>
            </table>
        </div>
    `;
    
    // Create modal with proper close handler
    const modal = document.createElement('div');
    modal.id = 'attendee-details-modal';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 3000; display: flex; align-items: center; justify-content: center;';
    modal.innerHTML = `
        <div style="background: var(--bg-primary); padding: 2rem; border-radius: 16px; max-width: 900px; width: 90%; max-height: 90vh; overflow-y: auto; position: relative; box-shadow: 0 10px 40px rgba(0,0,0,0.3);">
            <button id="close-attendee-modal" style="position: absolute; top: 1rem; right: 1rem; background: rgba(0,0,0,0.1); border: none; width: 40px; height: 40px; border-radius: 50%; font-size: 1.5rem; cursor: pointer; color: var(--text-dark); display: flex; align-items: center; justify-content: center; transition: all 0.3s ease;" onmouseover="this.style.background='rgba(0,0,0,0.2)'" onmouseout="this.style.background='rgba(0,0,0,0.1)'">&times;</button>
            ${detailsHTML}
        </div>
    `;
    
    // Close handler that refreshes the registrants view
    const closeBtn = modal.querySelector('#close-attendee-modal');
    closeBtn.addEventListener('click', () => {
        modal.remove();
        // Refresh the registrants view if we have an event ID
        if (currentEventId) {
            viewEventRegistrants(currentEventId);
        }
    });
    
    // Also close on overlay click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
            if (currentEventId) {
                viewEventRegistrants(currentEventId);
            }
        }
    });
    
    // Close on Escape key
    const escapeHandler = (e) => {
        if (e.key === 'Escape' && document.getElementById('attendee-details-modal')) {
            document.getElementById('attendee-details-modal').remove();
            if (currentEventId) {
                viewEventRegistrants(currentEventId);
            }
            document.removeEventListener('keydown', escapeHandler);
        }
    };
    document.addEventListener('keydown', escapeHandler);
    
        document.body.appendChild(modal);
    } catch (error) {
        console.error('Error viewing attendee details:', error);
        alert('Error loading attendee details. Please try again.');
    }
}

// Bulk Email Functionality
async function openBulkEmailModal(eventId) {
    try {
        if (!window.supabase) {
            alert('Database connection not available.');
            return;
        }

        const { data: event, error: eventError } = await window.supabase
            .from('events')
            .select('*')
            .eq('id', eventId)
            .single();
        
        if (eventError || !event) {
            alert('Event not found.');
            return;
        }

        const { data: eventRegistrations, error: regError } = await window.supabase
            .from('event_registrations')
            .select('*')
            .eq('event_id', eventId)
            .order('created_at', { ascending: false });
        
        if (regError) {
            alert('Error loading registrations.');
            return;
        }
        
        const registrations = eventRegistrations || [];
        
        if (registrations.length === 0) {
            alert('No registrations found for this event.');
            return;
        }
        
        // Count total recipients (including all attendees)
        const recipientEmails = new Set();
        const recipientList = [];
        
        registrations.forEach(reg => {
            // Add main registrant email
            const email = reg.registration_type === 'organization' ? reg.contact_email : reg.registrant_email;
            if (email) {
                const cleanEmail = cleanContactInfo(email);
                if (cleanEmail && !recipientEmails.has(cleanEmail)) {
                    recipientEmails.add(cleanEmail);
                    recipientList.push({
                        email: cleanEmail,
                        name: reg.registration_type === 'organization' ? (reg.organization_name || reg.contact_person) : reg.registrant_name || 'Attendee',
                        type: reg.registration_type || 'individual'
                    });
                }
            }
            
            // Add attendee emails if available
            if (reg.attendee_details && reg.attendee_details.length > 0) {
                reg.attendee_details.forEach(attendee => {
                    if (attendee.email) {
                        const cleanEmail = cleanContactInfo(attendee.email);
                        if (cleanEmail && !recipientEmails.has(cleanEmail)) {
                            recipientEmails.add(cleanEmail);
                            recipientList.push({
                                email: cleanEmail,
                                name: attendee.name || 'Attendee',
                                type: 'attendee'
                            });
                        }
                    }
                });
            }
        });
    
        const totalRecipients = recipientEmails.size;
        
        // Default invitation message template
        const defaultMessage = `Dear ${registrations.length === 1 ? 'Attendee' : 'Attendees'},

You are cordially invited to attend:

${event.title}
Date: ${new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
${event.time ? `Time: ${event.time}` : ''}
${event.location ? `Location: ${event.location}` : ''}
${event.venue ? `Venue: ${event.venue}` : ''}

This invitation serves as your entry ticket to the event. Please present this email or a printed copy at the registration desk.

We look forward to seeing you there!

Best regards,
Hope A Life International`;

    const modal = document.createElement('div');
    modal.id = 'bulk-email-modal';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 3000; display: flex; align-items: center; justify-content: center;';
    modal.innerHTML = `
        <div style="background: var(--bg-primary); padding: 2rem; border-radius: 16px; max-width: 800px; width: 90%; max-height: 90vh; overflow-y: auto; position: relative; box-shadow: 0 10px 40px rgba(0,0,0,0.3);">
            <button id="close-bulk-email-modal" style="position: absolute; top: 1rem; right: 1rem; background: rgba(0,0,0,0.1); border: none; width: 40px; height: 40px; border-radius: 50%; font-size: 1.5rem; cursor: pointer; color: var(--text-dark); display: flex; align-items: center; justify-content: center; transition: all 0.3s ease;" onmouseover="this.style.background='rgba(0,0,0,0.2)'" onmouseout="this.style.background='rgba(0,0,0,0.1)'">&times;</button>
            
            <h3 style="margin-bottom: 1rem; color: var(--navy-blue);">Send Invitation Emails</h3>
            
            <div style="margin-bottom: 1.5rem; padding: 1rem; background: var(--light-gray); border-radius: 8px;">
                <p style="margin: 0 0 0.5rem 0;"><strong>Event:</strong> ${event.title}</p>
                <p style="margin: 0 0 0.5rem 0;"><strong>Total Recipients:</strong> ${totalRecipients} unique email address(es)</p>
                <p style="margin: 0; color: var(--text-secondary); font-size: 0.9rem;">Emails will be sent to all registered attendees.</p>
            </div>
            
            <form id="bulk-email-form">
                <div style="margin-bottom: 1.5rem;">
                    <label for="invitation-card" style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Invitation Card (Optional)</label>
                    <input type="file" id="invitation-card" accept=".pdf,.jpg,.jpeg,.png" style="width: 100%; padding: 0.5rem; border: 1px solid var(--border-color); border-radius: 6px; font-size: 1rem;">
                    <small style="color: var(--text-secondary); display: block; margin-top: 0.5rem;">Upload a PDF or JPG invitation card. You'll need to attach it manually when sending.</small>
                    <div id="invitation-card-preview" style="margin-top: 1rem;"></div>
                </div>
                
                <div style="margin-bottom: 1.5rem;">
                    <label for="email-subject" style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Email Subject *</label>
                    <input type="text" id="email-subject" required value="Invitation: ${event.title}" style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: 6px; font-size: 1rem;">
                </div>
                
                <div style="margin-bottom: 1.5rem;">
                    <label for="email-message" style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Invitation Message *</label>
                    <textarea id="email-message" required rows="12" style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: 6px; font-size: 1rem; font-family: inherit; resize: vertical;">${defaultMessage}</textarea>
                    <small style="color: var(--text-secondary); display: block; margin-top: 0.5rem;">Edit this message to customize your invitation. It will serve as the invitation/ticket for all attendees.</small>
                </div>
                
                <div id="email-status" style="display: none; margin-bottom: 1rem; padding: 1rem; border-radius: 8px;"></div>
                
                <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                    <button type="button" onclick="document.getElementById('bulk-email-modal').remove()" style="padding: 0.75rem 1.5rem; background: var(--light-gray); border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">Cancel</button>
                    <button type="submit" id="send-email-btn" style="padding: 0.75rem 1.5rem; background: var(--primary-blue); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
                        <i class="fas fa-paper-plane"></i> Send Emails (${totalRecipients})
                    </button>
                </div>
            </form>
        </div>
    `;
    
    // Handle invitation card upload preview
    const cardInput = modal.querySelector('#invitation-card');
    const previewDiv = modal.querySelector('#invitation-card-preview');
    cardInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (file.type.startsWith('image/')) {
                    previewDiv.innerHTML = `
                        <div style="padding: 1rem; background: var(--light-gray); border-radius: 8px; border: 2px dashed var(--border-color);">
                            <img src="${event.target.result}" alt="Invitation Card Preview" style="max-width: 100%; max-height: 200px; border-radius: 6px; margin-bottom: 0.5rem;">
                            <p style="margin: 0; color: var(--text-secondary); font-size: 0.9rem;"><strong>${file.name}</strong> (${(file.size / 1024).toFixed(2)} KB)</p>
                        </div>
                    `;
                } else if (file.type === 'application/pdf') {
                    previewDiv.innerHTML = `
                        <div style="padding: 1rem; background: var(--light-gray); border-radius: 8px; border: 2px dashed var(--border-color);">
                            <i class="fas fa-file-pdf" style="font-size: 3rem; color: var(--primary-blue); margin-bottom: 0.5rem;"></i>
                            <p style="margin: 0; color: var(--text-secondary); font-size: 0.9rem;"><strong>${file.name}</strong> (${(file.size / 1024).toFixed(2)} KB)</p>
                        </div>
                    `;
                }
            };
            reader.readAsDataURL(file);
        } else {
            previewDiv.innerHTML = '';
        }
    });
    
    // Close handler
    const closeBtn = modal.querySelector('#close-bulk-email-modal');
    closeBtn.addEventListener('click', () => modal.remove());
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
    
    // Form submit handler
    const form = modal.querySelector('#bulk-email-form');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const subject = form.querySelector('#email-subject').value;
        const message = form.querySelector('#email-message').value;
        const cardFile = cardInput.files[0];
        
        sendBulkEmails(eventId, subject, message, recipientList, cardFile, modal);
    });
    
    // Close on Escape key
    const escapeHandler = (e) => {
        if (e.key === 'Escape' && document.getElementById('bulk-email-modal')) {
            document.getElementById('bulk-email-modal').remove();
            document.removeEventListener('keydown', escapeHandler);
        }
    };
        document.addEventListener('keydown', escapeHandler);
        
        document.body.appendChild(modal);
    } catch (error) {
        console.error('Error opening bulk email modal:', error);
        alert('Error loading event. Please try again.');
    }
}

function sendBulkEmails(eventId, subject, message, recipientList, cardFile, modal) {
    if (!recipientList || recipientList.length === 0) {
        showEmailStatus(modal, 'error', 'No valid email addresses found.');
        return;
    }
    
    const statusDiv = modal.querySelector('#email-status');
    const sendBtn = modal.querySelector('#send-email-btn');
    
    // Disable send button and show loading
    sendBtn.disabled = true;
    sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    showEmailStatus(modal, 'info', 'Preparing emails...');
    
    // Process invitation card if uploaded
    let cardDataUrl = null;
    let cardFileName = null;
    
    if (cardFile) {
        const reader = new FileReader();
        reader.onload = (e) => {
            cardDataUrl = e.target.result;
            cardFileName = cardFile.name;
            completeEmailSend(eventId, subject, message, recipientList, cardDataUrl, cardFileName, modal, statusDiv, sendBtn);
        };
        reader.onerror = () => {
            showEmailStatus(modal, 'error', 'Error reading invitation card file.');
            sendBtn.disabled = false;
            sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Emails';
        };
        reader.readAsDataURL(cardFile);
    } else {
        completeEmailSend(eventId, subject, message, recipientList, null, null, modal, statusDiv, sendBtn);
    }
}

function completeEmailSend(eventId, subject, message, recipientList, cardDataUrl, cardFileName, modal, statusDiv, sendBtn) {
    try {
        // Build email body with invitation card note if available
        let emailBody = message;
        
        if (cardDataUrl) {
            emailBody += `\n\n---\nInvitation Card:\n`;
            emailBody += `\nPlease see the attached invitation card file: ${cardFileName}`;
            emailBody += `\n\nNote: You will need to manually attach the invitation card file when sending this email.`;
        }
        
        // Get all email addresses
        const recipientEmails = recipientList.map(r => r.email);
        const primaryEmail = recipientEmails[0];
        const bccEmails = recipientEmails.slice(1);
        
        // Encode the message for URL
        const encodedSubject = encodeURIComponent(subject);
        const encodedBody = encodeURIComponent(emailBody);
        
        // Create mailto link
        let mailtoLink = `mailto:${primaryEmail}?subject=${encodedSubject}&body=${encodedBody}`;
        if (bccEmails.length > 0) {
            mailtoLink += `&bcc=${bccEmails.join(',')}`;
        }
        
        showEmailStatus(modal, 'info', `Opening email client with ${recipientEmails.length} recipient(s)...`);
        
        // Open email client
        window.location.href = mailtoLink;
        
        // Show success after a delay
        setTimeout(() => {
            const successMessage = `✅ Email client opened successfully!\n\nRecipients: ${recipientEmails.length}\n\n${cardDataUrl ? '⚠️ IMPORTANT: Please remember to attach the invitation card file (' + cardFileName + ') manually before sending.' : ''}\n\nIf your email client doesn't support BCC, you may need to send individual emails or use a bulk email service.`;
            showEmailStatus(modal, 'success', successMessage);
            
            // Log the email action (for admin tracking)
            const emailLog = JSON.parse(localStorage.getItem('admin-email-logs') || '[]');
            emailLog.push({
                eventId: eventId,
                subject: subject,
                recipients: recipientEmails.length,
                recipientList: recipientEmails,
                hasInvitationCard: !!cardDataUrl,
                invitationCardName: cardFileName,
                sentAt: new Date().toISOString()
            });
            localStorage.setItem('admin-email-logs', JSON.stringify(emailLog));
            
            // Re-enable button with success state
            sendBtn.disabled = false;
            sendBtn.innerHTML = '<i class="fas fa-check"></i> Email Client Opened';
            sendBtn.style.background = '#10b981';
            
            // Auto-close modal after 8 seconds
            setTimeout(() => {
                if (document.getElementById('bulk-email-modal')) {
                    document.getElementById('bulk-email-modal').remove();
                }
            }, 8000);
        }, 1000);
        
    } catch (error) {
        console.error('Error sending emails:', error);
        showEmailStatus(modal, 'error', `❌ Error: ${error.message}`);
        sendBtn.disabled = false;
        sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Emails';
    }
}

function showEmailStatus(modal, type, message) {
    const statusDiv = modal.querySelector('#email-status');
    if (!statusDiv) return;
    
    statusDiv.style.display = 'block';
    
    const colors = {
        success: { bg: '#d1fae5', border: '#10b981', text: '#065f46', icon: 'fa-check-circle' },
        error: { bg: '#fee2e2', border: '#ef4444', text: '#991b1b', icon: 'fa-exclamation-circle' },
        info: { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af', icon: 'fa-info-circle' }
    };
    
    const color = colors[type] || colors.info;
    
    statusDiv.style.background = color.bg;
    statusDiv.style.border = `2px solid ${color.border}`;
    statusDiv.style.color = color.text;
    statusDiv.innerHTML = `
        <div style="display: flex; align-items: flex-start; gap: 0.75rem;">
            <i class="fas ${color.icon}" style="font-size: 1.25rem; margin-top: 0.25rem;"></i>
            <div style="flex: 1;">
                <p style="margin: 0; white-space: pre-line; line-height: 1.6;">${message}</p>
            </div>
        </div>
    `;
}

// Quotes Management Functions
async function loadQuotes() {
    try {
        const quotesList = document.getElementById('quotes-list');
        if (!quotesList) return;
        
        if (!window.supabase) {
            quotesList.innerHTML = '<p class="empty-state">Database connection not available. Please refresh the page.</p>';
            return;
        }

        const { data: quotes, error } = await window.supabase
            .from('daily_quotes')
            .select('*')
            .order('date', { ascending: true, nullsFirst: true });
        
        if (error) throw error;
        
        const allQuotes = quotes || [];
        
        if (allQuotes.length === 0) {
            quotesList.innerHTML = '<p class="empty-state">No quotes added yet. Add your first quote above.</p>';
            return;
        }
        
        quotesList.innerHTML = allQuotes.map((quote) => {
            const dateDisplay = quote.date ? new Date(quote.date).toLocaleDateString() : 'General (No date)';
            const isScheduled = quote.date && new Date(quote.date) > new Date();
            return `
            <div class="quote-item" data-id="${quote.id}">
                <div class="quote-item-content">
                    <div class="quote-item-text">
                        <p>"${quote.text}"</p>
                        ${quote.author ? `<span class="quote-item-author">— ${quote.author}</span>` : ''}
                    </div>
                    <div class="quote-item-meta">
                        <span class="quote-date-badge ${isScheduled ? 'scheduled' : ''}">
                            <i class="fas fa-calendar"></i> ${dateDisplay}
                        </span>
                    </div>
                </div>
                <div class="quote-item-actions">
                    <button class="btn-icon" onclick="editQuote(${quote.id})" title="Edit quote">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-danger" onclick="deleteQuote(${quote.id})" title="Delete quote">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        }).join('');
    } catch (error) {
        console.error('Error loading quotes:', error);
        const quotesList = document.getElementById('quotes-list');
        if (quotesList) {
            quotesList.innerHTML = '<p class="empty-state">Error loading quotes. Please try again.</p>';
        }
    }
}

async function saveQuote() {
    try {
        const textInput = document.getElementById('quote-text-input');
        const authorInput = document.getElementById('quote-author-input');
        const dateInput = document.getElementById('quote-date-input');
        
        if (!textInput || !textInput.value.trim()) {
            alert('Please enter a quote text.');
            return;
        }
        
        // Check if we're editing (has data-editing-id attribute)
        const editingId = textInput.getAttribute('data-editing-id');
        if (editingId) {
            return await updateQuote(parseInt(editingId));
        }
        
        if (!window.supabase) {
            alert('Database connection not available. Please refresh the page.');
            return;
        }

        const quoteData = {
            text: textInput.value.trim(),
            author: authorInput && authorInput.value.trim() ? authorInput.value.trim() : null,
            date: dateInput && dateInput.value ? dateInput.value : null
        };
        
        const { error } = await window.supabase
            .from('daily_quotes')
            .insert([quoteData]);
        
        if (error) throw error;
        
        // Clear form
        clearQuoteForm();
        
        // Reload quotes list
        await loadQuotes();
        
        // Show success message
        alert('Quote saved successfully!');
        
        // Dispatch event for frontend update
        window.dispatchEvent(new CustomEvent('admin-content-updated', { detail: { type: 'quotes' } }));
        
        // Also trigger storage event for cross-tab updates
        try {
            localStorage.setItem('quotes-updated', Date.now().toString());
            localStorage.removeItem('quotes-updated');
        } catch (e) {
            // Ignore storage errors
        }
    } catch (error) {
        console.error('Error saving quote:', error);
        alert(`Error saving quote: ${error.message || 'Please try again.'}`);
    }
}

async function editQuote(quoteId) {
    try {
        if (!window.supabase) {
            alert('Database connection not available. Please refresh the page.');
            return;
        }

        const { data: quote, error: fetchError } = await window.supabase
            .from('daily_quotes')
            .select('*')
            .eq('id', quoteId)
            .single();
        
        if (fetchError || !quote) {
            alert('Quote not found.');
            return;
        }
        
        const textInput = document.getElementById('quote-text-input');
        const authorInput = document.getElementById('quote-author-input');
        const dateInput = document.getElementById('quote-date-input');
        
        if (textInput) textInput.value = quote.text || '';
        if (authorInput) authorInput.value = quote.author || '';
        if (dateInput) dateInput.value = quote.date || '';
        
        // Store the ID being edited
        if (textInput) textInput.setAttribute('data-editing-id', quoteId);
        
        // Scroll to form
        if (textInput) textInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (textInput) textInput.focus();
        
        // Change save button to update
        const saveBtn = document.querySelector('#quotes-tab button.btn-primary');
        if (saveBtn) {
            saveBtn.setAttribute('data-original-text', saveBtn.textContent);
            saveBtn.innerHTML = '<i class="fas fa-save"></i> Update Quote';
            saveBtn.onclick = () => updateQuote(quoteId);
        }
    } catch (error) {
        console.error('Error loading quote for editing:', error);
        alert(`Error: ${error.message || 'Please try again.'}`);
    }
}

async function updateQuote(quoteId) {
    try {
        const textInput = document.getElementById('quote-text-input');
        const authorInput = document.getElementById('quote-author-input');
        const dateInput = document.getElementById('quote-date-input');
        
        if (!textInput || !textInput.value.trim()) {
            alert('Please enter a quote text.');
            return;
        }
        
        if (!window.supabase) {
            alert('Database connection not available. Please refresh the page.');
            return;
        }

        const quoteData = {
            text: textInput.value.trim(),
            author: authorInput && authorInput.value.trim() ? authorInput.value.trim() : null,
            date: dateInput && dateInput.value ? dateInput.value : null
        };
        
        const { error } = await window.supabase
            .from('daily_quotes')
            .update(quoteData)
            .eq('id', quoteId);
        
        if (error) throw error;
        
        // Clear form
        clearQuoteForm();
        
        // Reset save button
        const saveBtn = document.querySelector('#quotes-tab button.btn-primary');
        if (saveBtn && saveBtn.getAttribute('data-original-text')) {
            saveBtn.innerHTML = saveBtn.getAttribute('data-original-text');
            saveBtn.onclick = saveQuote;
        }
        
        // Reload quotes list
        await loadQuotes();
        
        // Show success message
        alert('Quote updated successfully!');
        
        // Dispatch event for frontend update
        window.dispatchEvent(new CustomEvent('admin-content-updated', { detail: { type: 'quotes' } }));
        
        // Also trigger storage event for cross-tab updates
        try {
            localStorage.setItem('quotes-updated', Date.now().toString());
            localStorage.removeItem('quotes-updated');
        } catch (e) {
            // Ignore storage errors
        }
    } catch (error) {
        console.error('Error updating quote:', error);
        alert(`Error updating quote: ${error.message || 'Please try again.'}`);
    }
}

async function deleteQuote(quoteId) {
    if (!confirm('Are you sure you want to delete this quote?')) return;
    
    try {
        if (!window.supabase) {
            alert('Database connection not available. Please refresh the page.');
            return;
        }

        const { error } = await window.supabase
            .from('daily_quotes')
            .delete()
            .eq('id', quoteId);
        
        if (error) throw error;
        
        await loadQuotes();
        
        // Dispatch event for frontend update
        window.dispatchEvent(new CustomEvent('admin-content-updated', { detail: { type: 'quotes' } }));
        
        // Also trigger storage event for cross-tab updates
        try {
            localStorage.setItem('quotes-updated', Date.now().toString());
            localStorage.removeItem('quotes-updated');
        } catch (e) {
            // Ignore storage errors
        }
    } catch (error) {
        console.error('Error deleting quote:', error);
        alert(`Error deleting quote: ${error.message || 'Please try again.'}`);
    }
}

function clearQuoteForm() {
    const textInput = document.getElementById('quote-text-input');
    const authorInput = document.getElementById('quote-author-input');
    const dateInput = document.getElementById('quote-date-input');
    
    if (textInput) {
        textInput.value = '';
        textInput.removeAttribute('data-editing-id');
    }
    if (authorInput) authorInput.value = '';
    if (dateInput) dateInput.value = '';
    
    // Reset save button
    const saveBtn = document.querySelector('#quotes-tab button.btn-primary');
    if (saveBtn && saveBtn.getAttribute('data-original-text')) {
        saveBtn.innerHTML = saveBtn.getAttribute('data-original-text');
        saveBtn.onclick = saveQuote;
    }
}

// Verses Management Functions
function loadVerses() {
    const versesList = document.getElementById('verses-list');
    if (!versesList) return;
    
    const verses = getVersesFromStorage();
    
    if (verses.length === 0) {
        versesList.innerHTML = '<p class="empty-state">No verses added yet. Add your first verse above.</p>';
        return;
    }
    
    versesList.innerHTML = verses.map((verse, index) => {
        const dateDisplay = verse.date ? new Date(verse.date).toLocaleDateString() : 'General (No date)';
        const isScheduled = verse.date && new Date(verse.date) > new Date();
        return `
            <div class="quote-item" data-index="${index}">
                <div class="quote-item-content">
                    <div class="quote-item-text">
                        <p>"${verse.text}"</p>
                        ${verse.reference ? `<span class="quote-item-author">— ${verse.reference}</span>` : ''}
                    </div>
                    <div class="quote-item-meta">
                        <span class="quote-date-badge ${isScheduled ? 'scheduled' : ''}">
                            <i class="fas fa-calendar"></i> ${dateDisplay}
                        </span>
                    </div>
                </div>
                <div class="quote-item-actions">
                    <button class="btn-icon" onclick="editVerse(${index})" title="Edit verse">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-danger" onclick="deleteVerse(${index})" title="Delete verse">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function getVersesFromStorage() {
    try {
        const verses = localStorage.getItem('dailyVerses');
        return verses ? JSON.parse(verses) : [];
    } catch (e) {
        return [];
    }
}

function saveVersesToStorage(verses) {
    localStorage.setItem('dailyVerses', JSON.stringify(verses));
}

function saveVerse() {
    const textInput = document.getElementById('verse-text-input');
    const referenceInput = document.getElementById('verse-reference-input');
    const dateInput = document.getElementById('verse-date-input');
    
    if (!textInput || !textInput.value.trim()) {
        alert('Please enter a verse text.');
        return;
    }
    
    const verses = getVersesFromStorage();
    const newVerse = {
        text: textInput.value.trim(),
        reference: referenceInput ? referenceInput.value.trim() : '',
        date: dateInput && dateInput.value ? dateInput.value : '',
        createdAt: new Date().toISOString()
    };
    
    verses.push(newVerse);
    saveVersesToStorage(verses);
    
    // Clear form
    clearVerseForm();
    
    // Reload verses list
    loadVerses();
    
    // Show success message
    alert('Verse saved successfully!');
}

function editVerse(index) {
    const verses = getVersesFromStorage();
    const verse = verses[index];
    
    if (!verse) return;
    
    const textInput = document.getElementById('verse-text-input');
    const referenceInput = document.getElementById('verse-reference-input');
    const dateInput = document.getElementById('verse-date-input');
    
    if (textInput) textInput.value = verse.text;
    if (referenceInput) referenceInput.value = verse.reference || '';
    if (dateInput) dateInput.value = verse.date || '';
    
    // Remove old verse and save new one
    verses.splice(index, 1);
    saveVersesToStorage(verses);
    
    // Scroll to form
    if (textInput) textInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (textInput) textInput.focus();
}

function deleteVerse(index) {
    if (!confirm('Are you sure you want to delete this verse?')) return;
    
    const verses = getVersesFromStorage();
    verses.splice(index, 1);
    saveVersesToStorage(verses);
    loadVerses();
}

function clearVerseForm() {
    const textInput = document.getElementById('verse-text-input');
    const referenceInput = document.getElementById('verse-reference-input');
    const dateInput = document.getElementById('verse-date-input');
    
    if (textInput) textInput.value = '';
    if (referenceInput) referenceInput.value = '';
    if (dateInput) dateInput.value = '';
}

// Listen for new registrations
window.addEventListener('event-registration-added', () => {
    // Refresh if viewing registrants
    const container = document.getElementById('event-registrations-container');
    if (container && container.querySelector('.registrants-table')) {
        const eventId = container.getAttribute('data-current-event-id');
        if (eventId) {
            viewEventRegistrants(eventId);
        }
    }
});

// News Management
async function loadNews(searchTerm = '', pendingSearchTerm = '') {
    try {
        if (!window.supabase) {
            const publishedList = document.getElementById('news-list');
            const pendingList = document.getElementById('pending-news-list');
            if (publishedList) publishedList.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">Database connection not available. Please refresh the page.</p>';
            if (pendingList) pendingList.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">Database connection not available. Please refresh the page.</p>';
            return;
        }

        // Fetch published news from Supabase
        const { data: news, error: newsError } = await window.supabase
            .from('news')
            .select('*')
            .order('date', { ascending: false });
        
        if (newsError) throw newsError;
        
        // Fetch pending news from Supabase
        const { data: pendingNews, error: pendingError } = await window.supabase
            .from('pending_news')
            .select('*')
            .order('submitted_at', { ascending: false });
        
        if (pendingError) throw pendingError;
        
        const publishedList = document.getElementById('news-list');
        const pendingList = document.getElementById('pending-news-list');
        
        const allNews = news || [];
        const allPendingNews = pendingNews || [];
        
        // Filter published news if search term provided
        let filteredNews = allNews;
        if (searchTerm.trim()) {
            const searchLower = searchTerm.toLowerCase();
            filteredNews = allNews.filter(item => 
                (item.title && item.title.toLowerCase().includes(searchLower)) ||
                (item.content && item.content.toLowerCase().includes(searchLower)) ||
                (item.source && item.source.toLowerCase().includes(searchLower)) ||
                (item.author && item.author.toLowerCase().includes(searchLower))
            );
        }
        
        // Filter pending news if search term provided
        let filteredPendingNews = allPendingNews;
        if (pendingSearchTerm.trim()) {
            const searchLower = pendingSearchTerm.toLowerCase();
            filteredPendingNews = allPendingNews.filter(item => 
                (item.title && item.title.toLowerCase().includes(searchLower)) ||
                (item.content && item.content.toLowerCase().includes(searchLower)) ||
                (item.source && item.source.toLowerCase().includes(searchLower)) ||
                (item.author && item.author.toLowerCase().includes(searchLower))
            );
        }
        
        if (filteredNews.length === 0) {
            if (publishedList) {
                publishedList.innerHTML = searchTerm.trim()
                    ? `<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">No news articles found matching "${searchTerm}"</p>`
                    : '<p>No news articles published yet.</p>';
            }
        } else {
            if (publishedList) {
                publishedList.innerHTML = filteredNews.map((item) => {
                    const newsDate = item.date ? new Date(item.date).toLocaleDateString() : 'No date';
                    return `
                    <div class="item-card">
                        <div class="item-card-content">
                            <h3>${item.title}</h3>
                            <p><strong>Source:</strong> ${item.source || 'N/A'} | <strong>Date:</strong> ${newsDate}</p>
                            <p>${item.content ? (item.content.length > 150 ? item.content.substring(0, 150) + '...' : item.content) : 'No content'}</p>
                            ${item.link ? `<p><a href="${item.link}" target="_blank">Read more →</a></p>` : ''}
                        </div>
                        <div class="item-card-actions">
                            <button class="btn btn-danger" onclick="deleteNews(${item.id})">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    </div>
                `;
                }).join('');
            }
        }
        
        if (filteredPendingNews.length === 0) {
            if (pendingList) {
                pendingList.innerHTML = pendingSearchTerm.trim()
                    ? `<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">No pending news found matching "${pendingSearchTerm}"</p>`
                    : '<p>No pending news submissions.</p>';
            }
        } else {
            if (pendingList) {
                pendingList.innerHTML = filteredPendingNews.map((item) => {
                    const submittedDate = item.submitted_at ? new Date(item.submitted_at).toLocaleDateString() : 'Unknown';
                    return `
                    <div class="item-card">
                        <div class="item-card-content">
                            <h3>${item.title}</h3>
                            <p><strong>Submitted:</strong> ${submittedDate}</p>
                            <p>${item.content ? (item.content.length > 150 ? item.content.substring(0, 150) + '...' : item.content) : 'No content'}</p>
                        </div>
                        <div class="item-card-actions">
                            <button class="btn btn-primary" onclick="approveNews(${item.id})">
                                <i class="fas fa-check"></i> Approve
                            </button>
                            <button class="btn btn-danger" onclick="rejectNews(${item.id})">
                                <i class="fas fa-times"></i> Reject
                            </button>
                        </div>
                    </div>
                `;
                }).join('');
            }
        }
    } catch (error) {
        console.error('Error loading news:', error);
        const publishedList = document.getElementById('news-list');
        const pendingList = document.getElementById('pending-news-list');
        if (publishedList) publishedList.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">Error loading news. Please try again.</p>';
        if (pendingList) pendingList.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">Error loading pending news. Please try again.</p>';
    }
}

document.getElementById('news-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
        if (!window.supabase) {
            showAlert('news-alert', '❌ Database connection not available. Please refresh the page.', 'error');
            return;
        }

        const newsData = {
            title: document.getElementById('news-title').value,
            content: document.getElementById('news-content').value,
            image: document.getElementById('news-image').value || null,
            link: document.getElementById('news-link').value || null,
            source: document.getElementById('news-source').value || null,
            author: document.getElementById('news-author') ? document.getElementById('news-author').value || null : null,
            date: new Date().toISOString()
        };
        
        const { error } = await window.supabase
            .from('news')
            .insert([newsData]);
        
        if (error) throw error;
        
        showAlert('news-alert', '✅ News article published!', 'success');
        document.getElementById('news-form').reset();
        await loadNews();
        
        // Trigger real-time update event
        window.dispatchEvent(new CustomEvent('admin-content-updated', { detail: { type: 'news' } }));
        
        // Also trigger storage event for cross-tab updates
        try {
            localStorage.setItem('news-updated', Date.now().toString());
            localStorage.removeItem('news-updated');
        } catch (e) {
            // Ignore storage errors
        }
    } catch (error) {
        console.error('Error saving news:', error);
        showAlert('news-alert', `❌ Error saving news: ${error.message || 'Please try again.'}`, 'error');
    }
});

async function approveNews(newsId) {
    try {
        if (!window.supabase) {
            showAlert('news-alert', '❌ Database connection not available. Please refresh the page.', 'error');
            return;
        }

        // Get the pending news item
        const { data: pendingNews, error: fetchError } = await window.supabase
            .from('pending_news')
            .select('*')
            .eq('id', newsId)
            .single();
        
        if (fetchError || !pendingNews) {
            showAlert('news-alert', '❌ Pending news not found.', 'error');
            return;
        }
        
        // Insert into published news
        const newsData = {
            title: pendingNews.title,
            content: pendingNews.content,
            image: pendingNews.image || null,
            link: pendingNews.link || null,
            source: pendingNews.source || null,
            author: pendingNews.author || null,
            date: new Date().toISOString()
        };
        
        const { error: insertError } = await window.supabase
            .from('news')
            .insert([newsData]);
        
        if (insertError) throw insertError;
        
        // Delete from pending news
        const { error: deleteError } = await window.supabase
            .from('pending_news')
            .delete()
            .eq('id', newsId);
        
        if (deleteError) throw deleteError;
        
        await loadNews();
        
        // Trigger real-time update event
        window.dispatchEvent(new CustomEvent('admin-content-updated', { detail: { type: 'news' } }));
        
        // Also trigger storage event
        try {
            localStorage.setItem('news-updated', Date.now().toString());
            localStorage.removeItem('news-updated');
        } catch (e) {
            // Ignore storage errors
        }
    } catch (error) {
        console.error('Error approving news:', error);
        showAlert('news-alert', `❌ Error approving news: ${error.message || 'Please try again.'}`, 'error');
    }
}

async function rejectNews(newsId) {
    if (!confirm('Are you sure you want to reject this news submission?')) {
        return;
    }
    
    try {
        if (!window.supabase) {
            showAlert('news-alert', '❌ Database connection not available. Please refresh the page.', 'error');
            return;
        }

        const { error } = await window.supabase
            .from('pending_news')
            .delete()
            .eq('id', newsId);
        
        if (error) throw error;
        
        await loadNews();
    } catch (error) {
        console.error('Error rejecting news:', error);
        showAlert('news-alert', `❌ Error rejecting news: ${error.message || 'Please try again.'}`, 'error');
    }
}

async function deleteNews(newsId) {
    if (!confirm('Are you sure you want to delete this news article?')) {
        return;
    }
    
    try {
        if (!window.supabase) {
            showAlert('news-alert', '❌ Database connection not available. Please refresh the page.', 'error');
            return;
        }

        const { error } = await window.supabase
            .from('news')
            .delete()
            .eq('id', newsId);
        
        if (error) throw error;
        
        await loadNews();
        
        // Trigger real-time update event
        window.dispatchEvent(new CustomEvent('admin-content-updated', { detail: { type: 'news' } }));
        
        // Also trigger storage event
        try {
            localStorage.setItem('news-updated', Date.now().toString());
            localStorage.removeItem('news-updated');
        } catch (e) {
            // Ignore storage errors
        }
    } catch (error) {
        console.error('Error deleting news:', error);
        showAlert('news-alert', `❌ Error deleting news: ${error.message || 'Please try again.'}`, 'error');
    }
}

// Publications Management
function loadPublications(searchTerm = '') {
    const publications = JSON.parse(localStorage.getItem('admin-publications') || '[]');
    const list = document.getElementById('publications-list');
    
    // Filter publications if search term provided
    let filteredPublications = publications;
    if (searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase();
        filteredPublications = publications.filter(pub => 
            (pub.title && pub.title.toLowerCase().includes(searchLower)) ||
            (pub.content && pub.content.toLowerCase().includes(searchLower)) ||
            (pub.author && pub.author.toLowerCase().includes(searchLower)) ||
            (pub.description && pub.description.toLowerCase().includes(searchLower))
        );
    }
    
    if (filteredPublications.length === 0) {
        list.innerHTML = searchTerm.trim()
            ? `<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">No publications found matching "${searchTerm}"</p>`
            : '<p>No publications created yet. Create one above!</p>';
        return;
    }
    
    list.innerHTML = filteredPublications.map((pub, displayIndex) => {
        // Find original index for edit/delete functions
        const originalIndex = publications.findIndex(p => p.id === pub.id);
        return `
        <div class="item-card">
            <div class="item-card-content">
                <h3>${pub.title}</h3>
                ${pub.author ? `<p><strong>Author:</strong> ${pub.author}</p>` : ''}
                <p><strong>Date:</strong> ${new Date(pub.date).toLocaleDateString()}</p>
                <p>${pub.content.substring(0, 200)}...</p>
                ${pub.images && pub.images.length > 0 ? `<p><strong>Images:</strong> ${pub.images.length} image(s)</p>` : ''}
                ${pub.videos && pub.videos.length > 0 ? `<p><strong>Videos:</strong> ${pub.videos.length} video(s)</p>` : ''}
            </div>
            <div class="item-card-actions">
                <button class="btn btn-danger" onclick="deletePublication(${originalIndex})">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `;
    }).join('');
}

document.getElementById('publication-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const publication = {
        id: Date.now(),
        title: document.getElementById('publication-title').value,
        content: document.getElementById('publication-content').value,
        author: document.getElementById('publication-author').value,
        date: document.getElementById('publication-date').value || new Date().toISOString(),
        images: [],
        videos: [],
        createdAt: new Date().toISOString()
    };
    
    // Handle WordPress fetch
    const wordpressUrl = document.getElementById('wordpress-url').value;
    if (wordpressUrl) {
        try {
            const response = await fetch(wordpressUrl);
            const data = await response.json();
            publication.content = data.content?.rendered || publication.content;
            publication.title = data.title?.rendered || publication.title;
            if (data.featured_media) {
                // Fetch media URL
                const mediaResponse = await fetch(`${wordpressUrl.split('/wp/v2/posts/')[0]}/wp/v2/media/${data.featured_media}`);
                const mediaData = await mediaResponse.json();
                publication.images.push(mediaData.source_url);
            }
        } catch (error) {
            console.error('WordPress fetch error:', error);
            showAlert('publication-alert', '⚠️ Could not fetch from WordPress. Using form data.', 'error');
        }
    }
    
    // Handle image files
    const imageFiles = document.getElementById('publication-images').files;
    if (imageFiles.length > 0) {
        for (let file of imageFiles) {
            const reader = new FileReader();
            reader.onload = (e) => {
                publication.images.push(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    }
    
    // Handle video files/URLs
    const videoFiles = document.getElementById('publication-videos').files;
    const videoUrls = document.getElementById('publication-video-urls').value.split(',').filter(url => url.trim());
    
    if (videoFiles.length > 0) {
        for (let file of videoFiles) {
            const reader = new FileReader();
            reader.onload = (e) => {
                publication.videos.push(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    }
    
    if (videoUrls.length > 0) {
        publication.videos.push(...videoUrls.map(url => url.trim()));
    }
    
    // Wait a bit for file readers
    setTimeout(() => {
        const publications = JSON.parse(localStorage.getItem('admin-publications') || '[]');
        publications.push(publication);
        localStorage.setItem('admin-publications', JSON.stringify(publications));
        
        showAlert('publication-alert', '✅ Publication created successfully!', 'success');
        document.getElementById('publication-form').reset();
        loadPublications();
        window.dispatchEvent(new CustomEvent('admin-content-updated', { detail: { type: 'publications' } }));
    }, 1000);
});

function deletePublication(index) {
    if (confirm('Are you sure you want to delete this publication?')) {
        const publications = JSON.parse(localStorage.getItem('admin-publications') || '[]');
        publications.splice(index, 1);
        localStorage.setItem('admin-publications', JSON.stringify(publications));
        loadPublications();
        window.dispatchEvent(new CustomEvent('admin-content-updated', { detail: { type: 'publications' } }));
    }
}

// Update pending count on load and when new stories arrive
function updatePendingCount() {
    const pendingStories = JSON.parse(localStorage.getItem('pending-stories') || '[]');
    const pendingCount = pendingStories.filter(s => s.status === 'pending').length;
    const badge = document.getElementById('pending-count');
    if (badge) {
        badge.textContent = pendingCount;
        badge.style.display = pendingCount > 0 ? 'inline-block' : 'none';
    }
}

// Listen for new pending stories
window.addEventListener('new-pending-story', (event) => {
    console.log('New pending story event received:', event.detail);
    updatePendingCount();
    const pendingTab = document.getElementById('pending-stories-tab');
    if (pendingTab && pendingTab.classList.contains('active')) {
        loadPendingStories();
    }
});

// Listen for storage events (cross-tab communication)
window.addEventListener('storage', (event) => {
    if (event.key === 'pending-stories') {
        console.log('Storage event detected for pending-stories');
        updatePendingCount();
        const pendingTab = document.getElementById('pending-stories-tab');
        if (pendingTab && pendingTab.classList.contains('active')) {
            loadPendingStories();
        }
    }
});

// Also listen for custom storage events (same-tab)
window.addEventListener('pending-stories-updated', () => {
    console.log('Pending stories updated event received');
    updatePendingCount();
    const pendingTab = document.getElementById('pending-stories-tab');
    if (pendingTab && pendingTab.classList.contains('active')) {
        loadPendingStories();
    }
});

// Search functionality - Add event listeners for all search inputs
document.addEventListener('DOMContentLoaded', () => {
    // Testimonials search
    const testimonialsSearch = document.getElementById('testimonials-search');
    if (testimonialsSearch) {
        testimonialsSearch.addEventListener('input', (e) => {
            loadTestimonials(e.target.value);
        });
    }
    
    // Photos search
    const photosSearch = document.getElementById('photos-search');
    if (photosSearch) {
        photosSearch.addEventListener('input', (e) => {
            loadPhotos(e.target.value);
        });
    }
    
    // Videos search
    const videosSearch = document.getElementById('videos-search');
    if (videosSearch) {
        videosSearch.addEventListener('input', (e) => {
            loadVideos(e.target.value);
        });
    }
    
    // Comments search
    const commentsSearch = document.getElementById('comments-search');
    if (commentsSearch) {
        commentsSearch.addEventListener('input', (e) => {
            loadComments(e.target.value);
        });
    }
    
    // Pending Stories search
    const pendingStoriesSearch = document.getElementById('pending-stories-search');
    if (pendingStoriesSearch) {
        pendingStoriesSearch.addEventListener('input', (e) => {
            loadPendingStories(e.target.value);
        });
    }
    
    // Contact Messages search
    const contactMessagesSearch = document.getElementById('contact-messages-search');
    if (contactMessagesSearch) {
        contactMessagesSearch.addEventListener('input', (e) => {
            loadContactMessages(e.target.value);
        });
    }
    
    // Events search
    const eventsSearch = document.getElementById('events-search');
    if (eventsSearch) {
        eventsSearch.addEventListener('input', (e) => {
            loadEvents(e.target.value);
        });
    }
    
    // News search (published)
    const newsSearch = document.getElementById('news-search');
    if (newsSearch) {
        newsSearch.addEventListener('input', (e) => {
            const pendingSearch = document.getElementById('pending-news-search');
            loadNews(e.target.value, pendingSearch ? pendingSearch.value : '');
        });
    }
    
    // Pending News search
    const pendingNewsSearch = document.getElementById('pending-news-search');
    if (pendingNewsSearch) {
        pendingNewsSearch.addEventListener('input', (e) => {
            const publishedSearch = document.getElementById('news-search');
            loadNews(publishedSearch ? publishedSearch.value : '', e.target.value);
        });
    }
    
    // Publications search
    const publicationsSearch = document.getElementById('publications-search');
    if (publicationsSearch) {
        publicationsSearch.addEventListener('input', (e) => {
            loadPublications(e.target.value);
        });
    }
});

// Load initial content
loadTabContent('testimonials');
updatePendingCount();


