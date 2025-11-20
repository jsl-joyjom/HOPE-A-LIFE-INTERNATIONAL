// Events Loader - Loads events from admin panel to modal and updates notification badge
(function() {
    function getUpcomingEvents() {
        const events = JSON.parse(localStorage.getItem('admin-events') || '[]');
        const now = new Date();
        
        return events
            .filter(event => {
                const eventDate = new Date(event.date);
                return event.featured || eventDate >= now;
            })
            .sort((a, b) => new Date(a.date) - new Date(b.date));
    }
    
    function updateNotificationBadge() {
        const badge = document.getElementById('notification-badge');
        if (!badge) return;
        
        const upcomingEvents = getUpcomingEvents();
        const count = upcomingEvents.length;
        
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
        
        // Add urgency animation if there are events
        const floatingIcon = document.getElementById('floating-notifications');
        if (floatingIcon) {
            if (count > 0) {
                floatingIcon.classList.add('has-notifications');
            } else {
                floatingIcon.classList.remove('has-notifications');
            }
        }
    }
    
    function loadEvents() {
        const eventsContainer = document.getElementById('events-container-modal');
        if (!eventsContainer) return;
        
        const upcomingEvents = getUpcomingEvents();
        
        if (upcomingEvents.length === 0) {
            eventsContainer.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">No upcoming events at this time. Check back soon!</p>';
            return;
        }
        
        eventsContainer.innerHTML = upcomingEvents.map(event => {
            const eventDate = new Date(event.date);
            const formattedDate = eventDate.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
            
            return `
                <article class="event-card">
                    ${event.image ? `
                        <div class="event-image">
                            <img src="${event.image}" alt="${event.title}" loading="lazy">
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
                                ${event.location}
                            </span>
                        </div>
                        <p class="event-description">${event.description}</p>
                        ${event.venue ? `<p class="event-venue"><i class="fas fa-building" aria-hidden="true"></i> ${event.venue}</p>` : ''}
                        ${event.registrationLink ? `
                            <a href="${event.registrationLink}" class="event-register-btn" target="_blank" rel="noopener">
                                Register Now <i class="fas fa-arrow-right" aria-hidden="true"></i>
                            </a>
                        ` : ''}
                        ${event.contactName || event.contactEmail || event.contactPhone ? `
                            <div class="event-contact">
                                <p><strong>Contact:</strong> 
                                    ${event.contactName ? event.contactName : ''}
                                    ${event.contactEmail ? ` <a href="mailto:${event.contactEmail}">${event.contactEmail}</a>` : ''}
                                    ${event.contactPhone ? ` <a href="tel:${event.contactPhone}">${event.contactPhone}</a>` : ''}
                                </p>
                            </div>
                        ` : ''}
                    </div>
                </article>
            `;
        }).join('');
    }
    
    function initModal() {
        const floatingNotifications = document.getElementById('floating-notifications');
        const eventsModal = document.getElementById('events-modal');
        const modalOverlay = document.getElementById('events-modal-overlay');
        const modalClose = document.getElementById('events-modal-close');
        
        if (!floatingNotifications || !eventsModal) return;
        
        function openModal() {
            eventsModal.setAttribute('aria-hidden', 'false');
            eventsModal.classList.add('active');
            document.body.style.overflow = 'hidden';
            loadEvents();
        }
        
        function closeModal() {
            eventsModal.setAttribute('aria-hidden', 'true');
            eventsModal.classList.remove('active');
            document.body.style.overflow = '';
        }
        
        floatingNotifications.addEventListener('click', openModal);
        floatingNotifications.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openModal();
            }
        });
        
        if (modalOverlay) modalOverlay.addEventListener('click', closeModal);
        if (modalClose) modalClose.addEventListener('click', closeModal);
        
        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && eventsModal.classList.contains('active')) {
                closeModal();
            }
        });
    }
    
    function init() {
        loadEvents();
        updateNotificationBadge();
        initModal();
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    window.addEventListener('storage', () => {
        loadEvents();
        updateNotificationBadge();
    });
    
    window.addEventListener('admin-content-updated', (e) => {
        if (e.detail.type === 'events') {
            loadEvents();
            updateNotificationBadge();
        }
    });
})();

