// News Loader - Loads news from Supabase to latestnews.html
(function() {
    let cachedNews = [];
    let lastNewsFetch = 0;
    const NEWS_CACHE_DURATION = 10000; // 10 seconds cache
    
    // Function to fetch news from Supabase
    async function fetchNewsFromSupabase() {
        try {
            if (!window.supabase) {
                return [];
            }
            
            const { data: news, error } = await window.supabase
                .from('news')
                .select('*')
                .order('date', { ascending: false });
            
            if (error) throw error;
            
            return news || [];
        } catch (error) {
            console.error('Error loading news from Supabase:', error);
            return [];
        }
    }
    
    // Function to force refresh news
    async function refreshNews() {
        console.log('🔄 Refreshing news from Supabase');
        cachedNews = [];
        lastNewsFetch = 0;
        await loadAdminNews();
    }
    
    // Listen for real-time updates
    window.addEventListener('admin-content-updated', function(e) {
        if (e.detail && e.detail.type === 'news') {
            console.log('🔄 Reloading news due to admin update');
            refreshNews();
        }
    });
    
    window.addEventListener('storage', function(e) {
        if (e.key === 'news-updated') {
            console.log('🔄 Reloading news due to storage change');
            refreshNews();
        }
    });
    
    async function loadAdminNews() {
        const newsContainer = document.getElementById('latest-news-container');
        if (!newsContainer) return;
        
        // Always fetch fresh if cache is older than 10 seconds
        const now = Date.now();
        if (now - lastNewsFetch > NEWS_CACHE_DURATION || cachedNews.length === 0) {
            console.log('Fetching fresh news from Supabase');
            cachedNews = await fetchNewsFromSupabase();
            lastNewsFetch = now;
        }
        
        const news = cachedNews;
        
        if (news.length === 0) {
            newsContainer.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 3rem;">No news articles available at this time. Check back later!</p>';
            return;
        }
        
        newsContainer.innerHTML = news.map(item => {
            const newsDate = item.date ? new Date(item.date) : new Date();
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
                        ${item.content ? item.content.split('\n').map(p => `<p>${p}</p>`).join('') : ''}
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
    
    // Poll for updates every 15 seconds (fallback)
    setInterval(function() {
        if (document.visibilityState === 'visible') {
            refreshNews();
        }
    }, 15000);
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadAdminNews);
    } else {
        loadAdminNews();
    }
})();

