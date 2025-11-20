// Video Loader - Loads videos from admin panel
(function() {
    // Listen for real-time updates
    window.addEventListener('admin-content-updated', function(e) {
        if (e.detail && e.detail.type === 'videos') {
            console.log('🔄 Reloading videos due to admin update');
            loadAdminVideos();
        }
    });
    
    window.addEventListener('admin-data-updated', function(e) {
        if (e.detail && e.detail.key === 'admin-videos') {
            console.log('🔄 Reloading videos due to data update');
            loadAdminVideos();
        }
    });
    
    window.addEventListener('storage', function(e) {
        if (e.key === 'admin-videos') {
            console.log('🔄 Reloading videos due to storage change');
            loadAdminVideos();
        }
    });
    
    function loadAdminVideos() {
        const videoGrid = document.querySelector('.video-grid');
        if (!videoGrid) return;
        
        const adminVideos = JSON.parse(localStorage.getItem('admin-videos') || '[]');
        
        // Always load admin videos if they exist
        if (adminVideos.length > 0) {
            // Clear existing videos
            const existingCards = videoGrid.querySelectorAll('.video-card');
            existingCards.forEach(card => card.remove());
        } else {
            // Keep existing videos if no admin videos
            return;
        }
        
        // Add admin videos
        adminVideos.forEach((video) => {
            const card = document.createElement('article');
            card.className = 'video-card';
            
            // Convert YouTube/Vimeo URL to embed format
            let embedUrl = video.url;
            if (video.url.includes('youtube.com/watch')) {
                const videoId = video.url.split('v=')[1]?.split('&')[0];
                if (videoId) {
                    embedUrl = `https://www.youtube.com/embed/${videoId}`;
                }
            } else if (video.url.includes('youtu.be/')) {
                const videoId = video.url.split('youtu.be/')[1]?.split('?')[0];
                if (videoId) {
                    embedUrl = `https://www.youtube.com/embed/${videoId}`;
                }
            } else if (video.url.includes('vimeo.com/')) {
                const videoId = video.url.split('vimeo.com/')[1]?.split('?')[0];
                if (videoId) {
                    embedUrl = `https://player.vimeo.com/video/${videoId}`;
                }
            }
            
            const iframe = document.createElement('iframe');
            iframe.src = embedUrl;
            iframe.title = video.title || 'Video';
            iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
            iframe.setAttribute('allowfullscreen', '');
            iframe.loading = 'lazy';
            
            card.appendChild(iframe);
            videoGrid.appendChild(card);
        });
    }
    
    // Load when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadAdminVideos);
    } else {
        loadAdminVideos();
    }
    
    // Listen for storage changes (when admin adds content)
    window.addEventListener('storage', loadAdminVideos);
    window.addEventListener('admin-content-updated', loadAdminVideos);
})();

