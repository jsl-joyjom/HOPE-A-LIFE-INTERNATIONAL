// Events Page Loader - Loads events from admin panel to events.html
(function() {
    // Listen for real-time updates
    window.addEventListener('admin-content-updated', function(e) {
        if (e.detail && e.detail.type === 'events') {
            console.log('🔄 Reloading events due to admin update');
            loadAdminEvents();
        }
    });
    
    window.addEventListener('admin-data-updated', function(e) {
        if (e.detail && e.detail.key === 'admin-events') {
            console.log('🔄 Reloading events due to data update');
            loadAdminEvents();
        }
    });
    
    window.addEventListener('storage', function(e) {
        if (e.key === 'admin-events') {
            console.log('🔄 Reloading events due to storage change');
            loadAdminEvents();
        }
    });
    
    async function loadAdminEvents() {
        const upcomingContainer = document.querySelector('#upcoming-events');
        const pastContainer = document.querySelector('#past-events');
        
        if (!upcomingContainer || !pastContainer) return;
        
        try {
            if (!window.supabase) {
                upcomingContainer.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">Database connection not available. Please refresh the page.</p>';
                pastContainer.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">Database connection not available. Please refresh the page.</p>';
                return;
            }

            const { data: events, error } = await window.supabase
                .from('events')
                .select('*')
                .order('date', { ascending: true });
            
            if (error) throw error;
            
            // Sort by date
            const sortedEvents = (events || []).sort((a, b) => new Date(a.date) - new Date(b.date));
            
            const now = new Date();
            const upcoming = sortedEvents.filter(event => new Date(event.date) >= now);
            const past = sortedEvents.filter(event => new Date(event.date) < now).reverse(); // Reverse to show newest first
        
            // Load upcoming events
            if (upcoming.length === 0) {
                upcomingContainer.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">No upcoming events scheduled. Check back soon!</p>';
            } else {
                upcomingContainer.innerHTML = upcoming.map(event => createEventCard(event)).join('');
                // Handle image loading after HTML is inserted
                setTimeout(() => handleEventImageLoading(), 50);
            }
            
            // Load past events
            if (past.length === 0) {
                pastContainer.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">No past events to display.</p>';
            } else {
                pastContainer.innerHTML = past.map(event => createEventCard(event)).join('');
                // Handle image loading after HTML is inserted
                setTimeout(() => handleEventImageLoading(), 50);
            }
        } catch (error) {
            console.error('Error loading events:', error);
            upcomingContainer.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">Error loading events. Please try again.</p>';
            pastContainer.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">Error loading events. Please try again.</p>';
        }
    }
    
    function createEventCard(event) {
        const eventDate = new Date(event.date);
        const formattedDate = eventDate.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        
        // Truncate description to show only first 120 characters
        const shortDescription = event.description ? 
            (event.description.length > 120 ? event.description.substring(0, 120) + '...' : event.description) : 
            'No description available.';
        
        // Store full event data as data attribute
        const eventData = encodeURIComponent(JSON.stringify(event));
        
        // Determine if image is base64 (data URL) - don't use lazy loading for base64
        const isBase64 = event.image && event.image.startsWith('data:image/');
        const loadingAttr = isBase64 ? '' : 'loading="lazy"';
        
        return `
            <article class="event-card" onclick="openEventDetails('${event.id}')" data-event-data='${eventData}'>
                ${event.image ? `
                    <div class="event-image">
                        <img src="${event.image}" alt="${event.title}" ${loadingAttr} data-event-image>
                    </div>
                ` : ''}
                <div class="event-content">
                    <h3 class="event-title">${event.title}</h3>
                    <div class="event-meta">
                        <span class="event-date">
                            <i class="fas fa-calendar-alt" aria-hidden="true"></i>
                            ${formattedDate}${event.time ? ` at ${event.time}` : ''}
                        </span>
                        <span class="event-location">
                            <i class="fas fa-map-marker-alt" aria-hidden="true"></i>
                            ${event.location || 'TBA'}
                        </span>
                    </div>
                    <p class="event-description">${shortDescription}</p>
                    ${event.venue ? `<p class="event-venue"><i class="fas fa-building" aria-hidden="true"></i> ${event.venue}</p>` : ''}
                    <button class="event-register-btn" type="button" onclick="event.stopPropagation(); openEventDetails('${event.id}')">
                        View Details <i class="fas fa-arrow-right" aria-hidden="true"></i>
                    </button>
                </div>
            </article>
        `;
    }
    
    // Function to handle event image loading
    function handleEventImageLoading() {
        const eventImages = document.querySelectorAll('.event-image img[data-event-image]');
        eventImages.forEach(img => {
            // If image is already loaded (cached or base64), add loaded class immediately
            if (img.complete && img.naturalWidth > 0) {
                img.classList.add('loaded');
            } else {
                // Add loaded class when image loads
                img.onload = function() {
                    img.classList.add('loaded');
                };
                // For base64 images that load instantly, add loaded class after a tiny delay
                if (img.src && img.src.startsWith('data:image/')) {
                    setTimeout(() => {
                        if (img.complete && img.naturalWidth > 0) {
                            img.classList.add('loaded');
                        }
                    }, 10);
                }
            }
        });
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadAdminEvents);
    } else {
        loadAdminEvents();
    }
    
    window.addEventListener('storage', loadAdminEvents);
    window.addEventListener('admin-content-updated', (e) => {
        if (e.detail.type === 'events') {
            loadAdminEvents();
        }
    });
})();

