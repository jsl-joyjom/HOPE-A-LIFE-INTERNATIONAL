// News Loader - Loads news from admin panel to latestnews.html
(function() {
    // Listen for real-time updates
    window.addEventListener('admin-content-updated', function(e) {
        if (e.detail && e.detail.type === 'news') {
            console.log('🔄 Reloading news due to admin update');
            loadAdminNews();
        }
    });
    
    window.addEventListener('admin-data-updated', function(e) {
        if (e.detail && e.detail.key === 'admin-news') {
            console.log('🔄 Reloading news due to data update');
            loadAdminNews();
        }
    });
    
    window.addEventListener('storage', function(e) {
        if (e.key === 'admin-news') {
            console.log('🔄 Reloading news due to storage change');
            loadAdminNews();
        }
    });
    
    function loadAdminNews() {
        const newsContainer = document.getElementById('latest-news-container');
        if (!newsContainer) return;
        
        const news = JSON.parse(localStorage.getItem('admin-news') || '[]');
        
        // Sort by date (newest first)
        const sortedNews = news.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        if (sortedNews.length === 0) {
            newsContainer.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 3rem;">No news articles available at this time. Check back later!</p>';
            return;
        }
        
        newsContainer.innerHTML = sortedNews.map(item => {
            const newsDate = new Date(item.date);
            const formattedDate = newsDate.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
            
            return `
                <article class="news-item" style="background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);">
                    ${item.image ? `
                        <div style="margin-bottom: 1rem;">
                            <img src="${item.image}" alt="${item.title}" style="width: 100%; max-height: 300px; object-fit: cover; border-radius: 8px;">
                        </div>
                    ` : ''}
                    <h3 style="font-size: 1.5rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.75rem;">
                        ${item.title}
                    </h3>
                    <div style="display: flex; gap: 1rem; margin-bottom: 1rem; font-size: 0.9rem; color: var(--text-secondary);">
                        <span><i class="fas fa-calendar-alt" aria-hidden="true"></i> ${formattedDate}</span>
                        <span><i class="fas fa-tag" aria-hidden="true"></i> ${item.source || 'Admin'}</span>
                    </div>
                    <div style="color: var(--text-secondary); line-height: 1.7; margin-bottom: 1rem;">
                        ${item.content.split('\n').map(p => `<p>${p}</p>`).join('')}
                    </div>
                    ${item.link ? `
                        <a href="${item.link}" target="_blank" rel="noopener" style="display: inline-flex; align-items: center; gap: 0.5rem; color: var(--primary-blue); text-decoration: none; font-weight: 600;">
                            Read More <i class="fas fa-arrow-right" aria-hidden="true"></i>
                        </a>
                    ` : ''}
                </article>
            `;
        }).join('');
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadAdminNews);
    } else {
        loadAdminNews();
    }
    
    window.addEventListener('storage', loadAdminNews);
    window.addEventListener('admin-content-updated', (e) => {
        if (e.detail.type === 'news') {
            loadAdminNews();
        }
    });
})();

