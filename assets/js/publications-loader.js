// Publications Loader - Loads publications from admin panel to articles.html
(function() {
    // Listen for real-time updates
    window.addEventListener('admin-content-updated', function(e) {
        if (e.detail && e.detail.type === 'publications') {
            console.log('🔄 Reloading publications due to admin update');
            loadAdminPublications();
        }
    });
    
    window.addEventListener('admin-data-updated', function(e) {
        if (e.detail && e.detail.key === 'admin-publications') {
            console.log('🔄 Reloading publications due to data update');
            loadAdminPublications();
        }
    });
    
    window.addEventListener('storage', function(e) {
        if (e.key === 'admin-publications') {
            console.log('🔄 Reloading publications due to storage change');
            loadAdminPublications();
        }
    });
    
    function loadAdminPublications() {
        const publicationsContainer = document.getElementById('article-container');
        if (!publicationsContainer) return;
        
        const publications = JSON.parse(localStorage.getItem('admin-publications') || '[]');
        
        // Sort by date (newest first)
        const sortedPublications = publications.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        if (sortedPublications.length === 0) {
            publicationsContainer.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 3rem;">No publications available at this time. Check back later!</p>';
            return;
        }
        
        publicationsContainer.innerHTML = sortedPublications.map(pub => {
            const pubDate = new Date(pub.date);
            const formattedDate = pubDate.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
            
            return `
                <article class="publication-item" style="background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 12px; padding: 2rem; margin-bottom: 2rem; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);">
                    <h3 style="font-size: 1.75rem; font-weight: 700; color: var(--text-primary); margin-bottom: 1rem;">
                        ${pub.title}
                    </h3>
                    <div style="display: flex; gap: 1.5rem; margin-bottom: 1.5rem; font-size: 0.9rem; color: var(--text-secondary); flex-wrap: wrap;">
                        ${pub.author ? `<span><i class="fas fa-user" aria-hidden="true"></i> ${pub.author}</span>` : ''}
                        <span><i class="fas fa-calendar-alt" aria-hidden="true"></i> ${formattedDate}</span>
                    </div>
                    ${pub.images && pub.images.length > 0 ? `
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
                            ${pub.images.map(img => `
                                <img src="${img}" alt="Publication image" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px;">
                            `).join('')}
                        </div>
                    ` : ''}
                    <div style="color: var(--text-secondary); line-height: 1.8; margin-bottom: 1.5rem; white-space: pre-wrap;">
                        ${pub.content}
                    </div>
                    ${pub.videos && pub.videos.length > 0 ? `
                        <div style="margin-top: 1.5rem;">
                            <h4 style="font-size: 1.1rem; font-weight: 600; margin-bottom: 1rem; color: var(--text-primary);">Videos</h4>
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem;">
                                ${pub.videos.map(video => {
                                    // Check if it's a URL or base64
                                    if (video.startsWith('http')) {
                                        // YouTube/Vimeo URL
                                        let embedUrl = video;
                                        if (video.includes('youtube.com/watch?v=')) {
                                            embedUrl = video.replace('watch?v=', 'embed/');
                                        } else if (video.includes('youtu.be/')) {
                                            embedUrl = video.replace('youtu.be/', 'www.youtube.com/embed/');
                                        } else if (video.includes('vimeo.com/')) {
                                            embedUrl = video.replace('vimeo.com/', 'player.vimeo.com/video/');
                                        }
                                        return `
                                            <iframe src="${embedUrl}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="width: 100%; height: 200px; border-radius: 8px;"></iframe>
                                        `;
                                    } else {
                                        // Base64 video
                                        return `
                                            <video controls style="width: 100%; height: 200px; border-radius: 8px;">
                                                <source src="${video}" type="video/mp4">
                                                Your browser does not support the video tag.
                                            </video>
                                        `;
                                    }
                                }).join('')}
                            </div>
                        </div>
                    ` : ''}
                </article>
            `;
        }).join('');
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadAdminPublications);
    } else {
        loadAdminPublications();
    }
    
    window.addEventListener('storage', loadAdminPublications);
    window.addEventListener('admin-content-updated', (e) => {
        if (e.detail.type === 'publications') {
            loadAdminPublications();
        }
    });
})();

