// Event Details Modal Handler
(function() {
    const modal = document.getElementById('event-details-modal');
    const overlay = document.getElementById('event-details-overlay');
    const closeBtn = document.getElementById('event-details-close');
    const modalBody = document.getElementById('event-details-body');
    const modalTitle = document.getElementById('event-details-title');
    
    if (!modal || !overlay || !closeBtn || !modalBody) return;
    
    // Open modal function - accessible globally
    window.openEventDetails = function(eventId) {
        const events = JSON.parse(localStorage.getItem('admin-events') || '[]');
        const event = events.find(e => (e.id || '').toString() === eventId.toString());
        
        if (!event) {
            // Try to get from card data attribute
            const card = document.querySelector(`[onclick*="openEventDetails('${eventId}')"]`);
            if (card && card.dataset.eventData) {
                try {
                    const eventData = JSON.parse(decodeURIComponent(card.dataset.eventData));
                    displayEventDetails(eventData);
                    return;
                } catch (e) {
                    console.error('Error parsing event data:', e);
                }
            }
            alert('Event not found');
            return;
        }
        
        displayEventDetails(event);
    };
    
    function displayEventDetails(event) {
        const eventDate = new Date(event.date);
        const formattedDate = eventDate.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        
        modalTitle.textContent = event.title;
        
        let documentsHTML = '';
        if (event.documents && event.documents.length > 0) {
            documentsHTML = `
                <div class="event-details-documents">
                    <h3><i class="fas fa-file-alt"></i> Event Documents</h3>
                    <div class="event-document-list">
                        ${event.documents.map((doc, index) => `
                            <div class="event-document-item">
                                <div class="event-document-info">
                                    <div class="event-document-icon">
                                        <i class="fas fa-file-${getFileIcon(doc.name || doc.filename)}"></i>
                                    </div>
                                    <div>
                                        <div class="event-document-name">${doc.name || doc.filename || 'Document ' + (index + 1)}</div>
                                        ${doc.size ? `<small style="color: var(--text-secondary);">${formatFileSize(doc.size)}</small>` : ''}
                                    </div>
                                </div>
                                <a href="${doc.url || doc.data}" download="${doc.name || doc.filename || 'document'}" class="event-document-download">
                                    <i class="fas fa-download"></i> Download
                                </a>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        
        modalBody.innerHTML = `
            ${event.image ? `<img src="${event.image}" alt="${event.title}" class="event-details-image">` : ''}
            
            <div class="event-details-meta">
                <div class="event-details-meta-item">
                    <i class="fas fa-calendar-alt"></i>
                    <div>
                        <strong>Date</strong>
                        <div>${formattedDate}${event.time ? ` at ${event.time}` : ''}</div>
                    </div>
                </div>
                <div class="event-details-meta-item">
                    <i class="fas fa-map-marker-alt"></i>
                    <div>
                        <strong>Location</strong>
                        <div>${event.location || 'TBA'}</div>
                    </div>
                </div>
                ${event.venue ? `
                    <div class="event-details-meta-item">
                        <i class="fas fa-building"></i>
                        <div>
                            <strong>Venue</strong>
                            <div>${event.venue}</div>
                        </div>
                    </div>
                ` : ''}
                ${event.contactName || event.contactEmail || event.contactPhone ? `
                    <div class="event-details-meta-item">
                        <i class="fas fa-user"></i>
                        <div>
                            <strong>Contact</strong>
                            <div>
                                ${event.contactName ? event.contactName + '<br>' : ''}
                                ${event.contactEmail ? `<a href="mailto:${event.contactEmail}">${event.contactEmail}</a><br>` : ''}
                                ${event.contactPhone ? `<a href="tel:${event.contactPhone}">${event.contactPhone}</a>` : ''}
                            </div>
                        </div>
                    </div>
                ` : ''}
            </div>
            
            <div class="event-details-description">
                <h3 style="color: var(--navy-blue); margin-bottom: 1rem;">About This Event</h3>
                <p>${event.description || 'No description available.'}</p>
            </div>
            
            ${documentsHTML}
            
            <div class="event-details-actions">
                ${new Date(event.date) >= new Date() ? `
                    <button class="event-register-btn" type="button" onclick="closeEventDetails(); openEventRegistration('${event.id || Date.now()}')">
                        Register Here <i class="fas fa-user-plus" aria-hidden="true"></i>
                    </button>
                ` : ''}
                ${event.registrationLink ? `
                    <a href="${event.registrationLink}" target="_blank" rel="noopener" class="event-register-btn">
                        External Registration <i class="fas fa-external-link-alt"></i>
                    </a>
                ` : ''}
            </div>
        `;
        
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }
    
    function getFileIcon(filename) {
        if (!filename) return 'alt';
        const ext = filename.split('.').pop().toLowerCase();
        const iconMap = {
            'pdf': 'pdf',
            'doc': 'word',
            'docx': 'word',
            'xls': 'excel',
            'xlsx': 'excel',
            'ppt': 'powerpoint',
            'pptx': 'powerpoint',
            'jpg': 'image',
            'jpeg': 'image',
            'png': 'image',
            'gif': 'image',
            'zip': 'archive',
            'rar': 'archive'
        };
        return iconMap[ext] || 'alt';
    }
    
    function formatFileSize(bytes) {
        if (!bytes) return '';
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }
    
    // Close modal function - accessible globally
    window.closeEventDetails = function() {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    };
    
    // Event listeners
    closeBtn.addEventListener('click', closeEventDetails);
    overlay.addEventListener('click', closeEventDetails);
    
    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeEventDetails();
        }
    });
})();

