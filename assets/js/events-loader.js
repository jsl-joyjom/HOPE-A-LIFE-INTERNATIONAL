// Events Loader - Loads events from admin panel to modal and updates notification badge
(function() {
    async function getUpcomingEvents() {
        try {
            if (!window.supabase) {
                return [];
            }

            const { data: events, error } = await window.supabase
                .from('events')
                .select('*')
                .order('date', { ascending: true });
            
            if (error) throw error;
            
            const now = new Date();
            
            return (events || [])
                .filter(event => {
                    const eventDate = new Date(event.date);
                    return event.featured || eventDate >= now;
                })
                .sort((a, b) => new Date(a.date) - new Date(b.date));
        } catch (error) {
            console.error('Error loading events:', error);
            return [];
        }
    }
    
    async function updateNotificationBadge() {
        const badge = document.getElementById('notification-badge');
        if (!badge) return;
        
        const upcomingEvents = await getUpcomingEvents();
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
    
    async function loadEvents() {
        const eventsContainer = document.getElementById('events-container-modal');
        if (!eventsContainer) return;
        
        const upcomingEvents = await getUpcomingEvents();
        
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
                                ${event.location || 'TBA'}
                            </span>
                        </div>
                        <p class="event-description">${event.description || ''}</p>
                        ${event.venue ? `<p class="event-venue"><i class="fas fa-building" aria-hidden="true"></i> ${event.venue}</p>` : ''}
                        ${event.registration_link ? `
                            <a href="${event.registration_link}" class="event-register-btn" target="_blank" rel="noopener">
                                Register Now <i class="fas fa-arrow-right" aria-hidden="true"></i>
                            </a>
                        ` : ''}
                        ${event.contact_name || event.contact_email || event.contact_phone ? `
                            <div class="event-contact">
                                <p><strong>Contact:</strong> 
                                    ${event.contact_name ? event.contact_name : ''}
                                    ${event.contact_email ? ` <a href="mailto:${event.contact_email}">${event.contact_email}</a>` : ''}
                                    ${event.contact_phone ? ` <a href="tel:${event.contact_phone}">${event.contact_phone}</a>` : ''}
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
    
    async function init() {
        await loadEvents();
        await updateNotificationBadge();
        initModal();
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    window.addEventListener('admin-content-updated', async (e) => {
        if (e.detail.type === 'events') {
            await loadEvents();
            await updateNotificationBadge();
        }
    });
})();

