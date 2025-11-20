const initSmoothScroll = () => {
    const anchorLinks = document.querySelectorAll('a[href^="#"]');

    anchorLinks.forEach((anchor) => {
        anchor.addEventListener('click', (event) => {
            const targetSelector = anchor.getAttribute('href');
            if (!targetSelector || targetSelector === '#') {
                return;
            }

            const target = document.querySelector(targetSelector);
            if (!target) {
                return;
            }

            event.preventDefault();
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            });
        });
    });
};

const initScrollProgress = () => {
    const progressFill = document.querySelector('.progress-fill');
    if (!progressFill) {
        return;
    }

    const updateProgress = () => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        progressFill.style.width = `${scrollPercent}%`;
    };

    updateProgress();
    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress);
};

const initSidebarLayout = () => {
    const navLinks = document.querySelector('.nav-links');
    if (!navLinks) return;
    
    // Check if already wrapped
    if (navLinks.querySelector('.nav-links-scrollable')) return;
    
    const footer = navLinks.querySelector('.nav-sidebar-footer');
    if (!footer) return;
    
    // Get all menu items except footer and collapse button
    const menuItems = Array.from(navLinks.children).filter(li => 
        !li.classList.contains('nav-sidebar-footer') && 
        !li.querySelector('.nav-collapse')
    );
    
    if (menuItems.length === 0) return;
    
    // Create scrollable wrapper
    const scrollableWrapper = document.createElement('div');
    scrollableWrapper.className = 'nav-links-scrollable';
    scrollableWrapper.style.cssText = 'flex: 1 1 auto; min-height: 0; overflow-y: auto; overflow-x: hidden; display: flex; flex-direction: column; gap: 0.5rem;';
    
    // Move menu items into wrapper
    menuItems.forEach(item => {
        scrollableWrapper.appendChild(item);
    });
    
    // Insert wrapper before footer
    navLinks.insertBefore(scrollableWrapper, footer);
    
    // Move collapse button to top if it exists
    const collapseBtn = navLinks.querySelector('.nav-collapse');
    if (collapseBtn && collapseBtn.parentElement === navLinks) {
        navLinks.insertBefore(collapseBtn, scrollableWrapper);
    }
};

const initMobileMenu = () => {
    const header = document.querySelector('header');
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    const navOverlay = document.querySelector('.nav-overlay');
    const navCollapse = document.querySelector('.nav-collapse');
    const headerCollapse = document.querySelector('.header-collapse');

    if (!hamburger || !navLinks) {
        return;
    }

    const setMenuState = (shouldOpen, { skipFocus = false } = {}) => {
        const wasOpen = document.body.classList.contains('nav-open');
        document.body.classList.toggle('nav-open', shouldOpen);
        hamburger.setAttribute('aria-expanded', String(shouldOpen));
        navLinks.setAttribute('aria-hidden', String(!shouldOpen));
        navOverlay?.setAttribute('aria-hidden', String(!shouldOpen));
        header?.classList.toggle('header--drawer-open', shouldOpen);
        header?.classList.remove('header--hidden');
        
        // Update menu toggle button in volunteer CTA section
        const menuToggleBtn = document.querySelector('.menu-toggle-btn');
        if (menuToggleBtn) {
            menuToggleBtn.setAttribute('aria-expanded', String(shouldOpen));
        }

        if (skipFocus) {
            return;
        }

        if (shouldOpen) {
            navLinks.querySelector('a')?.focus();
        } else if (wasOpen) {
            hamburger.focus();
        }
    };

    const toggleMenu = (forceState, options = {}) => {
        const shouldOpen =
            typeof forceState === 'boolean'
                ? forceState
                : !document.body.classList.contains('nav-open');
        setMenuState(shouldOpen, options);
    };

    hamburger.addEventListener('click', () => toggleMenu());

    navCollapse?.addEventListener('click', () => toggleMenu(false, { skipFocus: true }));

    // Menu toggle button in volunteer CTA section
    const menuToggleBtn = document.querySelector('.menu-toggle-btn');
    if (menuToggleBtn) {
        menuToggleBtn.addEventListener('click', () => {
            toggleMenu();
        });
    }

    // Handle dropdown toggles
    navLinks.querySelectorAll('.dropdown > a').forEach((dropdownLink) => {
        dropdownLink.addEventListener('click', (e) => {
            const dropdown = dropdownLink.parentElement;
            const hasSubmenu = dropdown.classList.contains('dropdown');
            
            if (hasSubmenu) {
                e.preventDefault();
                dropdown.classList.toggle('dropdown-open');
                dropdown.setAttribute('aria-expanded', dropdown.classList.contains('dropdown-open'));
            }
        });
    });

    // Close menu when clicking non-dropdown links
    navLinks.querySelectorAll('a:not(.dropdown > a)').forEach((link) => {
        link.addEventListener('click', () => {
            if (document.body.classList.contains('nav-open')) {
                toggleMenu(false);
            }
        });
    });

    navOverlay?.addEventListener('click', () => toggleMenu(false));

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && document.body.classList.contains('nav-open')) {
            toggleMenu(false);
        }
    });

    // Header collapse/expand
    if (headerCollapse) {
        headerCollapse.addEventListener('click', () => {
            const isCollapsed = document.body.classList.toggle('header-collapsed');
            headerCollapse.setAttribute('aria-pressed', String(isCollapsed));
            // toggle chevron direction
            const icon = headerCollapse.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-chevron-up', !isCollapsed);
                icon.classList.toggle('fa-chevron-down', isCollapsed);
            }
            // Clear hover-peek state when explicitly toggled
            if (!isCollapsed) {
                document.body.classList.remove('header-peek');
            }
        });
    }

    // Hover to reveal (peek) when collapsed
    if (header) {
        header.addEventListener('mouseenter', () => {
            if (document.body.classList.contains('header-collapsed')) {
                document.body.classList.add('header-peek');
            }
        });
        header.addEventListener('mouseleave', () => {
            if (document.body.classList.contains('header-collapsed')) {
                document.body.classList.remove('header-peek');
            }
        });
    }

    // Desktop-only: auto-close the menu when pointer leaves the header/nav area
    // without any focused element inside the nav (prevents closing while keyboard navigating).
    let hoverCloseTimeoutId = null;
    const isDesktop = () => window.matchMedia('(min-width: 1024px)').matches;

    const headerOrMenuContainsFocus = () => {
        const active = document.activeElement;
        return !!(active && (header?.contains(active) || navLinks.contains(active)));
    };

    const scheduleCloseIfAllowed = () => {
        if (!isDesktop()) {
            return;
        }
        if (!document.body.classList.contains('nav-open')) {
            return;
        }
        if (headerOrMenuContainsFocus()) {
            return;
        }
        hoverCloseTimeoutId = window.setTimeout(() => {
            if (!headerOrMenuContainsFocus()) {
                toggleMenu(false, { skipFocus: true });
            }
        }, 220);
    };

    const cancelScheduledClose = () => {
        if (hoverCloseTimeoutId) {
            window.clearTimeout(hoverCloseTimeoutId);
            hoverCloseTimeoutId = null;
        }
    };

    header?.addEventListener('mouseenter', cancelScheduledClose);
    header?.addEventListener('mouseleave', scheduleCloseIfAllowed);
    navLinks.addEventListener('mouseenter', cancelScheduledClose);
    navLinks.addEventListener('mouseleave', scheduleCloseIfAllowed);

    setMenuState(false, { skipFocus: true });
};

const initHeaderScroll = () => {
    const header = document.querySelector('header');
    if (!header) {
        return;
    }

    let lastScroll = window.scrollY;
    let ticking = false;

    const update = () => {
        const current = window.scrollY;
        const delta = current - lastScroll;
        const isNavOpen = document.body.classList.contains('nav-open');

        if (!isNavOpen) {
            header.classList.toggle('header--scrolled', current > 32);
            header.classList.toggle('header--compact', current > 140);

            if (current > 160 && delta > 6) {
                header.classList.add('header--hidden');
            } else if (delta < -6 || current <= 160) {
                header.classList.remove('header--hidden');
            }
        }

        lastScroll = current <= 0 ? 0 : current;
        ticking = false;
    };

    window.addEventListener(
        'scroll',
        () => {
            if (!ticking) {
                window.requestAnimationFrame(update);
                ticking = true;
            }
        },
        { passive: true }
    );

    update();
};

const initImageSlider = () => {
    const containers = document.querySelectorAll('.slider-container');
    if (!containers.length) {
        return;
    }

    containers.forEach((container) => {
        const images = Array.from(container.querySelectorAll('.slider-image'));
        if (!images.length) {
            return;
        }

        const loadedImages = [];

        const registerLoadedImage = (img) => {
            if (!loadedImages.includes(img)) {
                loadedImages.push(img);
                // If this is the first successfully loaded image, show it
                if (loadedImages.length === 1) {
                    img.classList.add('active');
                }
            }
        };

        images.forEach((img) => {
            if (img.complete && img.naturalWidth > 0) {
                registerLoadedImage(img);
            } else {
                img.addEventListener('load', () => registerLoadedImage(img), { once: true });
                img.addEventListener(
                    'error',
                    () => {
                        img.classList.add('slider-image--error');
                    },
                    { once: true }
                );
            }
        });

        let currentIndex = 0;

        setInterval(() => {
            if (loadedImages.length <= 1) {
                return;
            }

            loadedImages[currentIndex].classList.remove('active');
            currentIndex = (currentIndex + 1) % loadedImages.length;
            loadedImages[currentIndex].classList.add('active');
        }, 5000);
    });
};

const initStatsAnimation = () => {
    const heroMetrics = document.querySelector('.hero-metrics');
    if (!heroMetrics) {
        return;
    }

    const counters = heroMetrics.querySelectorAll('.metric-number[data-count]');
    if (!counters.length) {
        return;
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    const animateNumber = (element) => {
        const target = Number(element.dataset.count);
        if (!Number.isFinite(target)) {
            return;
        }

        const duration = 2000;
        const start = 0;
        const startTime = performance.now();
        const hasSuffix = target >= 1000;

        const step = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const value = Math.floor(start + (target - start) * eased);
            element.textContent = `${value.toLocaleString('en-US')}${hasSuffix ? '+' : ''}`;

            if (progress < 1) {
                requestAnimationFrame(step);
            }
        };

        requestAnimationFrame(step);
    };

    const revealStats = () => {
        counters.forEach((counter) => {
            if (!counter.dataset.animated) {
                counter.dataset.animated = 'true';
                animateNumber(counter);
            }
        });
    };

    if (prefersReducedMotion.matches) {
        counters.forEach((counter) => {
            const target = Number(counter.dataset.count);
            if (Number.isFinite(target)) {
                counter.textContent = `${target.toLocaleString('en-US')}${target >= 1000 ? '+' : ''}`;
            }
        });
        return;
    }

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    revealStats();
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.4 }
    );

    observer.observe(heroMetrics);

    const handlePreferenceChange = (event) => {
        if (event.matches) {
            counters.forEach((counter) => {
                const target = Number(counter.dataset.count);
                if (Number.isFinite(target)) {
                    counter.textContent = `${target.toLocaleString('en-US')}${target >= 1000 ? '+' : ''}`;
                }
            });
        } else {
            counters.forEach((counter) => {
                counter.dataset.animated = '';
                counter.textContent = '0';
            });
            revealStats();
        }
    };

    if (typeof prefersReducedMotion.addEventListener === 'function') {
        prefersReducedMotion.addEventListener('change', handlePreferenceChange);
    } else if (typeof prefersReducedMotion.addListener === 'function') {
        prefersReducedMotion.addListener(handlePreferenceChange);
    }
};

const initImpactCounters = () => {
    const container = document.querySelector('#impact-counters');
    if (!container || typeof window.d3 === 'undefined') {
        return;
    }

    const counterData = [
        {
            number: 62000,
            suffix: '+',
            title: 'Widows Empowered',
            subtitle: 'of over 8 million Widows in Kenya',
            tooltip: 'Empowered & lives transformed through our programs since 2008',
        },
        {
            number: 5000,
            suffix: '+',
            title: 'Orphans Supported',
            subtitle: 'of over 3.6 million Orphans Need Care',
            tooltip: 'Children requiring comprehensive support and protection',
        },
        {
            number: 50,
            suffix: '',
            title: 'Children with Disabilities',
            subtitle: 'Supported, All from Kenya',
            tooltip: 'Supported children living with disabilities',
        },
        {
            number: 145,
            suffix: '',
            title: 'Houses Built',
            subtitle: 'For Needy Widows',
            tooltip: 'Homes built for the most needy homeless widows',
        },
        {
            number: 900,
            suffix: '+',
            title: 'GBV Survivors',
            subtitle: 'Currently Supported in Kenya',
            tooltip: 'Gender-Based Violence survivors currently being supported',
        },
        {
            number: 2000,
            suffix: '+',
            title: 'FGM Survivors',
            subtitle: 'All from Kenya',
            tooltip: 'FGM survivors supported and empowered',
        },
        {
            number: 10,
            suffix: '+',
            title: 'Widows Regained Property',
            subtitle: 'Through ADR',
            tooltip: 'Widows regained property through alternative dispute resolution',
        },
        {
            number: 7,
            suffix: '+',
            title: 'Core Programs',
            subtitle: 'Comprehensive initiatives for lasting change',
            tooltip: 'Seven core programs addressing critical community needs',
        },
    ];

    const d3 = window.d3;
    const accentPalette = ['#38bdf8', '#f472b6', '#a855f7', '#facc15', '#34d399', '#f97316', '#60a5fa'];
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const countersContainer = d3.select(container);
    const counterItems = countersContainer
        .selectAll('.counter-item')
        .data(counterData)
        .enter()
        .append('div')
        .attr('class', 'counter-item')
        .style('--accent', (d, index) => accentPalette[index % accentPalette.length]);

    const counterRings = counterItems.append('div').attr('class', 'counter-ring');
    const numberElements = counterRings
        .append('span')
        .attr('class', 'counter-number')
        .attr('data-target', (d) => d.number)
        .attr('data-suffix', (d) => d.suffix || '')
        .attr('data-large', (d) => d.number >= 1000 ? 'true' : 'false')
        .text('0');

    counterItems.append('div').attr('class', 'counter-title').text((d) => d.title);
    counterItems.append('div').attr('class', 'counter-subtitle').text((d) => d.subtitle);

    const tooltip = d3
        .select('body')
        .append('div')
        .attr('class', 'tooltip');

    counterItems
        .on('mouseover', function (event, d) {
            d3.select(this).classed('is-hovered', true);
            tooltip
                .classed('is-visible', true)
                .html(`<strong>${d.title}</strong><br>${d.tooltip}`)
                .style('left', `${event.pageX + 10}px`)
                .style('top', `${event.pageY - 28}px`);
        })
        .on('mousemove', function (event) {
            tooltip
                .style('left', `${event.pageX + 10}px`)
                .style('top', `${event.pageY - 28}px`);
        })
        .on('mouseout', function () {
            d3.select(this).classed('is-hovered', false);
            tooltip.classed('is-visible', false);
        });

    const animateCounters = () => {
        counterItems.each(function (d) {
            const item = d3.select(this);
            const numberElement = item.select('.counter-number');
            const ringElement = item.select('.counter-ring');

            item.classed('is-visible', true);
            ringElement.style('--progress', '0deg');

            numberElement
                .transition()
                .duration(2200)
                .ease(window.d3.easeCubicOut)
                .tween('text', function () {
                    const element = d3.select(this);
                    const start = 0;
                    const end = d.number;
                    const suffix = d.suffix || '';
                    return function (t) {
                        const value = Math.floor(start + (end - start) * t);
                        const formatted = Number.isFinite(value) ? value.toLocaleString('en-US') : value;
                        element.text(`${formatted}${suffix}`);
                        // Update data-large attribute for large numbers
                        if (d.number >= 1000) {
                            element.attr('data-large', 'true');
                        }
                        const progress = end ? Math.min(value / end, 1) : 1;
                        ringElement.style('--progress', `${(progress * 360).toFixed(2)}deg`);
                    };
                })
                .on('end', () => {
                    ringElement.style('--progress', '360deg');
                });
        });
    };

    if (prefersReducedMotion.matches) {
        counterItems.each(function (d) {
            const item = d3.select(this);
            const numberElement = item.select('.counter-number');
            const ringElement = item.select('.counter-ring');
            const suffix = d.suffix || '';
            const formatted = d.number.toLocaleString('en-US');
            numberElement.text(`${formatted}${suffix}`);
            // Set data-large for numbers >= 1000
            if (d.number >= 1000) {
                numberElement.attr('data-large', 'true');
            }
            ringElement.style('--progress', '360deg');
            item.classed('is-visible', true);
        });
        return;
    }

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    animateCounters();
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.5 }
    );

    observer.observe(container);
};

const initLightbox = () => {
    const lightbox = document.querySelector('.lightbox');
    const triggers = document.querySelectorAll('[data-lightbox="gallery"]');

    if (!lightbox || !triggers.length) {
        return;
    }

    const image = lightbox.querySelector('.lightbox-image');
    const closeButton = lightbox.querySelector('.lightbox-close');

    const close = () => {
        lightbox.classList.remove('is-active');
        lightbox.setAttribute('aria-hidden', 'true');
        if (image) {
            image.src = '';
            image.alt = '';
        }
    };

    const open = (src, altText) => {
        if (!image) {
            return;
        }
        image.src = src;
        image.alt = altText || '';
        lightbox.classList.add('is-active');
        lightbox.setAttribute('aria-hidden', 'false');
    };

    triggers.forEach((trigger) => {
        trigger.addEventListener('click', (event) => {
            event.preventDefault();
            const href = trigger.getAttribute('href');
            if (!href) {
                return;
            }
            const img = trigger.querySelector('img');
            const altText = img?.alt || trigger.getAttribute('aria-label') || 'Gallery image';
            open(href, altText);
        });
    });

    closeButton?.addEventListener('click', close);
    lightbox.addEventListener('click', (event) => {
        if (event.target === lightbox) {
            close();
        }
    });
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && lightbox.classList.contains('is-active')) {
            close();
        }
    });
};

const initEventTabs = () => {
    const buttons = document.querySelectorAll('.tab-button[data-tab-target]');
    if (!buttons.length) {
        return;
    }

    const grids = document.querySelectorAll('.event-grid');

    buttons.forEach((button) => {
        button.addEventListener('click', () => {
            const targetId = button.dataset.tabTarget;
            const targetGrid = document.getElementById(targetId);
            if (!targetGrid) {
                return;
            }

            buttons.forEach((btn) => {
                btn.classList.remove('active');
                btn.setAttribute('aria-selected', 'false');
            });
            grids.forEach((grid) => grid.classList.remove('active'));

            button.classList.add('active');
            button.setAttribute('aria-selected', 'true');
            targetGrid.classList.add('active');
        });
    });
};

const initContactForm = () => {
    const form = document.getElementById('contact-form');
    if (!form) {
        return;
    }

    const successMessage = document.getElementById('success-message');
    const errorMessage = document.getElementById('error-message');
    const configMessage = document.getElementById('configuration-message');
    const submitButton = form.querySelector('button[type="submit"]');
    const defaultButtonText = submitButton?.dataset.defaultText || submitButton?.textContent || 'Send Message';

    const emailjsAvailable = typeof window.emailjs !== 'undefined';
    const userId = form.dataset.emailUser;
    const serviceId = form.dataset.emailService;
    const templateId = form.dataset.emailTemplate;
    let emailJsReady = emailjsAvailable && userId && serviceId && templateId;

    const toggleMessage = (element, shouldShow) => {
        if (!element) {
            return;
        }
        element.style.display = shouldShow ? 'block' : 'none';
    };

    const setLoading = (isLoading) => {
        if (!submitButton) {
            return;
        }
        submitButton.disabled = isLoading;
        submitButton.textContent = isLoading ? 'Sending…' : defaultButtonText;
    };

    if (emailJsReady) {
        try {
            window.emailjs.init(userId);
            toggleMessage(configMessage, false);
        } catch (initialisationError) {
            console.error('EmailJS initialisation failed:', initialisationError);
            toggleMessage(configMessage, true);
            emailJsReady = false;
        }
    } else {
        toggleMessage(configMessage, true);
    }

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        toggleMessage(successMessage, false);
        toggleMessage(errorMessage, false);

        if (!emailJsReady) {
            toggleMessage(configMessage, true);
            console.warn('EmailJS configuration is incomplete. Update data attributes to enable submissions.');
            return;
        }

        toggleMessage(configMessage, false);
        setLoading(true);

        try {
            // Get form data
            const formData = new FormData(form);
            const contactData = {
                name: formData.get('name') || '',
                email: formData.get('email') || '',
                subject: formData.get('subject') || '',
                message: formData.get('message') || ''
            };
            
            // Save to Supabase if available
            if (window.supabase) {
                try {
                    const { error: dbError } = await window.supabase
                        .from('contact_messages')
                        .insert([{
                            name: contactData.name,
                            email: contactData.email,
                            subject: contactData.subject || null,
                            message: contactData.message,
                            status: 'new'
                        }]);
                    
                    if (dbError) {
                        console.error('Error saving contact message to database:', dbError);
                        // Continue with EmailJS even if DB save fails
                    } else {
                        console.log('✅ Contact message saved to Supabase');
                        // Trigger event for admin panel
                        window.dispatchEvent(new CustomEvent('new-contact-message', { detail: contactData }));
                    }
                } catch (dbError) {
                    console.error('Error saving to database:', dbError);
                    // Continue with EmailJS even if DB save fails
                }
            }
            
            // Send via EmailJS (if configured)
            if (emailJsReady) {
                await window.emailjs.sendForm(serviceId, templateId, form);
            }
            
            form.reset();
            toggleMessage(successMessage, true);
        } catch (sendError) {
            console.error('Form submission failed:', sendError);
            toggleMessage(errorMessage, true);
        } finally {
            setLoading(false);
        }
    });
};

const WP_API_BASE = 'https://hopealife.org/wp/wp-json/wp/v2';
const wpCategoryCache = new Map();

const fetchCategoryId = async (slug) => {
    if (!slug) {
        return null;
    }
    if (wpCategoryCache.has(slug)) {
        return wpCategoryCache.get(slug);
    }

    const response = await fetch(`${WP_API_BASE}/categories?slug=${encodeURIComponent(slug)}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch category for slug "${slug}"`);
    }
    const data = await response.json();
    const categoryId = data.length ? data[0].id : null;
    wpCategoryCache.set(slug, categoryId);
    return categoryId;
};

const fetchPostsByCategory = async (slug, perPage = 20) => {
    const categoryId = await fetchCategoryId(slug);
    if (slug && !categoryId) {
        return [];
    }
    const params = new URLSearchParams({
        per_page: String(perPage),
        _embed: '1',
    });
    if (categoryId) {
        params.set('categories', String(categoryId));
    }
    const response = await fetch(`${WP_API_BASE}/posts?${params.toString()}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch posts for slug "${slug}"`);
    }
    return response.json();
};

const stripHTML = (html) => {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
};

const createPostCard = (post) => {
    const card = document.createElement('article');
    card.className = 'article-card';

    const featuredImage = post._embedded?.['wp:featuredmedia']?.[0]?.source_url;
    const categoryName = post._embedded?.['wp:term']?.[0]?.[0]?.name || 'News';
    const title = stripHTML(post.title.rendered);
    const excerpt = stripHTML(post.excerpt.rendered).slice(0, 180).trim();
    const date = new Date(post.date);
    const formattedDate = Number.isNaN(date.getTime())
        ? ''
        : date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const postUrl = post.link || '#';

    card.innerHTML = `
        ${featuredImage
            ? `<img src="${featuredImage}" alt="${title}" class="article-image">`
            : '<div class="article-image-placeholder">No Image Available</div>'}
        <div class="article-content">
            <span class="category-badge">${categoryName}</span>
            <h3>${title}</h3>
            ${formattedDate ? `<p><strong>Date:</strong> ${formattedDate}</p>` : ''}
            ${excerpt ? `<p>${excerpt}...</p>` : ''}
            <a href="${postUrl}" target="_blank" rel="noopener">Read More</a>
        </div>
    `;

    return card;
};

const initWordPressFeeds = async () => {
    const feeds = document.querySelectorAll('[data-wp-feed="true"]');
    if (!feeds.length) {
        return;
    }

    for (const feed of feeds) {
        const categorySlug = feed.dataset.wpCategory || '';
        const emptyMessage = feed.dataset.wpEmpty || 'No posts found.';
        const errorMessage = feed.dataset.wpError || 'Unable to load posts at this time.';

        try {
            const posts = await fetchPostsByCategory(categorySlug);
            if (!posts.length) {
                feed.innerHTML = `<p class="loading">${emptyMessage}</p>`;
                continue;
            }

            const grid = document.createElement('div');
            grid.className = 'article-grid';
            posts.forEach((post) => {
                const card = createPostCard(post);
                grid.appendChild(card);
            });

            feed.innerHTML = '';
            feed.appendChild(grid);
        } catch (error) {
            console.error(error);
            feed.innerHTML = `<div class="error-message">${errorMessage}</div>`;
        }
    }
};

const initScrollAnimations = () => {
    const animatedElements = document.querySelectorAll('[data-animate]');
    if (!animatedElements.length) {
        return;
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const reduceMotion = prefersReducedMotion.matches;

    animatedElements.forEach((element) => {
        const delay = Number(element.dataset.animateDelay || 0);
        if (delay) {
            element.style.setProperty('--animate-delay', `${delay}ms`);
            element.style.transitionDelay = `${delay}ms`;
        }

        if (element.dataset.animate === 'stagger-up') {
            const children = element.querySelectorAll(':scope > *');
            children.forEach((child, index) => {
                child.style.transitionDelay = `${delay + index * 120}ms`;
            });
        }

        if (reduceMotion) {
            element.classList.add('is-visible');
        }
    });

    if (reduceMotion) {
        return;
    }

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.3 }
    );

    animatedElements.forEach((element) => observer.observe(element));

    prefersReducedMotion.addEventListener('change', () => {
        if (prefersReducedMotion.matches) {
            animatedElements.forEach((element) => {
                element.classList.add('is-visible');
            });
        }
    });
};

const initMagneticButtons = () => {
    const buttons = document.querySelectorAll('.magnetic');
    if (!buttons.length) {
        return;
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (prefersReducedMotion.matches) {
        return;
    }

    buttons.forEach((button) => {
        const maxOffset = 12;

        button.addEventListener('pointermove', (event) => {
            const rect = button.getBoundingClientRect();
            const relativeX = event.clientX - rect.left - rect.width / 2;
            const relativeY = event.clientY - rect.top - rect.height / 2;
            const offsetX = (relativeX / (rect.width / 2)) * maxOffset;
            const offsetY = (relativeY / (rect.height / 2)) * maxOffset;

            button.style.setProperty('--magnet-x', `${offsetX.toFixed(2)}px`);
            button.style.setProperty('--magnet-y', `${offsetY.toFixed(2)}px`);
            button.classList.add('is-active');
        });

        button.addEventListener('pointerleave', () => {
            button.style.setProperty('--magnet-x', '0px');
            button.style.setProperty('--magnet-y', '0px');
            button.classList.remove('is-active');
        });
    });
};

const initTiltInteractions = () => {
    const tiltItems = document.querySelectorAll('[data-tilt]');
    if (!tiltItems.length) {
        return;
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (prefersReducedMotion.matches) {
        return;
    }

    tiltItems.forEach((item) => {
        const maxTilt = 6;

        const handleMove = (event) => {
            const rect = item.getBoundingClientRect();
            const relativeX = (event.clientX - rect.left) / rect.width;
            const relativeY = (event.clientY - rect.top) / rect.height;
            const tiltX = (0.5 - relativeY) * maxTilt;
            const tiltY = (relativeX - 0.5) * maxTilt;
            item.style.setProperty('--tilt-x', `${tiltX.toFixed(2)}deg`);
            item.style.setProperty('--tilt-y', `${tiltY.toFixed(2)}deg`);
            item.classList.add('is-tilting');
        };

        const reset = () => {
            item.style.setProperty('--tilt-x', '0deg');
            item.style.setProperty('--tilt-y', '0deg');
            item.classList.remove('is-tilting');
        };

        item.addEventListener('pointermove', handleMove);
        item.addEventListener('pointerleave', reset);
        item.addEventListener('blur', reset);
    });
};

const initDarkMode = () => {
    const themeToggle = document.querySelector('.theme-toggle');
    const html = document.documentElement;
    
    if (!themeToggle) {
        return;
    }

    const moonIcon = themeToggle.querySelector('.fa-moon');
    const sunIcon = themeToggle.querySelector('.fa-sun');

    // Get saved theme or default to light
    const getTheme = () => {
        const saved = localStorage.getItem('theme');
        if (saved) {
            return saved;
        }
        // Check system preference
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    };

    // Apply theme
    const applyTheme = (theme) => {
        html.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        if (theme === 'dark') {
            if (moonIcon) moonIcon.style.display = 'none';
            if (sunIcon) sunIcon.style.display = 'inline-block';
        } else {
            if (moonIcon) moonIcon.style.display = 'inline-block';
            if (sunIcon) sunIcon.style.display = 'none';
        }
    };

    // Initialize theme
    const currentTheme = getTheme();
    applyTheme(currentTheme);

    // Toggle theme on button click
    themeToggle.addEventListener('click', () => {
        const current = html.getAttribute('data-theme') || 'light';
        const newTheme = current === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
    });

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
            applyTheme(e.matches ? 'dark' : 'light');
        }
    });
};

const initNewsletterForm = () => {
    const forms = document.querySelectorAll('.newsletter-form');
    if (!forms.length) {
        return;
    }

    forms.forEach((form) => {
        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            const input = form.querySelector('input[type="email"]');
            const button = form.querySelector('button[type="submit"]');
            
            if (!input || !button) {
                return;
            }

            const email = input.value.trim();
            if (!email || !email.includes('@')) {
                input.focus();
                input.style.borderColor = '#f43f5e';
                setTimeout(() => {
                    input.style.borderColor = '';
                }, 3000);
                return;
            }

            // Disable button and show loading state
            const originalText = button.textContent;
            button.disabled = true;
            button.textContent = 'Subscribing...';

            try {
                // Here you would integrate with your email service (e.g., Mailchimp, SendGrid, etc.)
                // For now, we'll simulate a successful submission
                await new Promise((resolve) => setTimeout(resolve, 1000));
                
                // Show success message
                const successMsg = document.createElement('div');
                successMsg.className = 'form-message success-message';
                successMsg.textContent = 'Thank you for subscribing!';
                successMsg.style.display = 'block';
                form.appendChild(successMsg);
                
                input.value = '';
                
                // Remove message after 5 seconds
                setTimeout(() => {
                    successMsg.remove();
                }, 5000);
            } catch (error) {
                console.error('Newsletter subscription error:', error);
                const errorMsg = document.createElement('div');
                errorMsg.className = 'form-message error-message';
                errorMsg.textContent = 'Something went wrong. Please try again.';
                errorMsg.style.display = 'block';
                form.appendChild(errorMsg);
                
                setTimeout(() => {
                    errorMsg.remove();
                }, 5000);
            } finally {
                button.disabled = false;
                button.textContent = originalText;
            }
        });
    });
};

// Programs Carousel
const initProgramsCarousel = () => {
    const carousel = document.getElementById('programs-carousel');
    const prevBtn = document.getElementById('programs-prev');
    const nextBtn = document.getElementById('programs-next');
    const indicatorsContainer = document.getElementById('programs-indicators');

    if (!carousel || !prevBtn || !nextBtn) return;

    // Ensure all images load properly
    const images = carousel.querySelectorAll('.cause-image');
    images.forEach((img) => {
        // Preload images for better performance
        const imgSrc = img.src;
        if (imgSrc) {
            const preloadImg = new Image();
            preloadImg.src = imgSrc;
            preloadImg.onload = () => {
                img.classList.add('loaded');
                img.style.opacity = '1';
            };
            preloadImg.onerror = () => {
                img.style.display = 'none';
                const placeholder = img.nextElementSibling;
                if (placeholder && placeholder.classList.contains('image-placeholder')) {
                    placeholder.style.display = 'flex';
                    placeholder.classList.add('image-error');
                }
            };
        }
        
        // Also handle direct load events
        if (img.complete && img.naturalHeight !== 0) {
            img.classList.add('loaded');
            img.style.opacity = '1';
        } else {
            img.addEventListener('load', () => {
                img.classList.add('loaded');
                img.style.opacity = '1';
            });
            img.addEventListener('error', () => {
                img.style.display = 'none';
                const placeholder = img.nextElementSibling;
                if (placeholder && placeholder.classList.contains('image-placeholder')) {
                    placeholder.style.display = 'flex';
                    placeholder.classList.add('image-error');
                }
            });
        }
    });

    const cards = carousel.querySelectorAll('.cause-card');
    let currentIndex = 0;
    let autoAdvanceTimer = null;
    const AUTO_ADVANCE_DELAY = 10000; // 10 seconds

    // Create indicator dots - one per page (2 cards per page)
    if (indicatorsContainer) {
        const totalPages = Math.ceil(cards.length / 2);
        for (let page = 0; page < totalPages; page++) {
            const dot = document.createElement('button');
            dot.className = 'indicator-dot';
            if (page === 0) dot.classList.add('active');
            const startIndex = page * 2;
            dot.setAttribute('aria-label', `Go to programs ${startIndex + 1} and ${startIndex + 2}`);
            dot.addEventListener('click', () => goToProgram(startIndex));
            indicatorsContainer.appendChild(dot);
        }
    }

    const updateCarousel = (index) => {
        // Show 2 cards at a time (current and next)
        const totalCards = cards.length;
        const firstCardIndex = index;
        const secondCardIndex = (index + 1) % totalCards;
        
        // Remove active class from all cards
        cards.forEach((card, i) => {
            const isActive = i === firstCardIndex || i === secondCardIndex;
            card.classList.toggle('active', isActive);
            
            // Ensure images load when cards become active
            if (isActive) {
                const img = card.querySelector('.cause-image');
                if (img && !img.classList.contains('loaded')) {
                    // Force image load
                    const imgSrc = img.src || img.getAttribute('src');
                    if (imgSrc) {
                        const preloadImg = new Image();
                        preloadImg.src = imgSrc;
                        preloadImg.onload = () => {
                            img.classList.add('loaded');
                            img.style.opacity = '1';
                        };
                    }
                } else if (img) {
                    img.style.opacity = '1';
                }
            }
        });

        // Update indicator dots - each dot represents a page (2 cards)
        const dots = indicatorsContainer?.querySelectorAll('.indicator-dot');
        const currentPage = Math.floor(index / 2);
        dots?.forEach((dot, i) => {
            dot.classList.toggle('active', i === currentPage);
        });

        currentIndex = index;
    };

    const goToProgram = (index) => {
        const totalCards = cards.length;
        // Move by 2 cards at a time (since we show 2 per page)
        if (index < 0) {
            // Go to last page (showing last 2 cards)
            index = totalCards - 2;
            if (index < 0) index = 0;
        }
        if (index >= totalCards) {
            index = 0; // Wrap to first page
        }
        updateCarousel(index);
        resetAutoAdvance();
    };

    const nextProgram = () => {
        // Move forward by 2 cards
        goToProgram(currentIndex + 2);
    };

    const prevProgram = () => {
        // Move backward by 2 cards
        goToProgram(currentIndex - 2);
    };

    const startAutoAdvance = () => {
        autoAdvanceTimer = setInterval(nextProgram, AUTO_ADVANCE_DELAY);
    };

    const resetAutoAdvance = () => {
        if (autoAdvanceTimer) {
            clearInterval(autoAdvanceTimer);
        }
        startAutoAdvance();
    };

    const pauseAutoAdvance = () => {
        if (autoAdvanceTimer) {
            clearInterval(autoAdvanceTimer);
            autoAdvanceTimer = null;
        }
    };

    // Event listeners
    nextBtn.addEventListener('click', () => {
        nextProgram();
    });

    prevBtn.addEventListener('click', () => {
        prevProgram();
    });

    // Pause auto-advance on hover
    carousel.addEventListener('mouseenter', pauseAutoAdvance);
    carousel.addEventListener('mouseleave', startAutoAdvance);

    // Pause auto-advance when user interacts with navigation
    [prevBtn, nextBtn, ...(indicatorsContainer?.querySelectorAll('.indicator-dot') || [])].forEach(btn => {
        btn.addEventListener('click', pauseAutoAdvance);
        btn.addEventListener('mouseenter', pauseAutoAdvance);
    });

    // Keyboard navigation
    carousel.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            prevProgram();
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            nextProgram();
        }
    });

    // Load first two images immediately (first page shows 2 cards)
    [cards[0], cards[1]].forEach(card => {
        if (card) {
            const img = card.querySelector('.cause-image');
            if (img) {
                img.style.opacity = '1';
                img.classList.add('loaded');
            }
        }
    });

    // Start auto-advance
    startAutoAdvance();

    // Respect prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        pauseAutoAdvance();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    initSmoothScroll();
    initScrollProgress();
    initSidebarLayout();
    initMobileMenu();
    initHeaderScroll();
    initImageSlider();
    initStatsAnimation();
    initImpactCounters();
    initLightbox();
    initEventTabs();
    initWordPressFeeds();
    initContactForm();
    initScrollAnimations();
    initMagneticButtons();
    initTiltInteractions();
    initDarkMode();
    initNewsletterForm();
    initProgramsCarousel();
    initFlowingRibbon();
});

// Flowing Ribbon of Unity
const initFlowingRibbon = () => {
    const ribbonSection = document.querySelector('.ribbon-section');
    const ribbonSvg = document.querySelector('.ribbon-svg');
    const ribbonPath = document.getElementById('ribbonPath');
    const teamCards = document.querySelectorAll('.ribbon-section .team-card');
    
    if (!ribbonSection || !ribbonSvg || !ribbonPath || teamCards.length === 0) {
        return;
    }

    // Get card center coordinates relative to SVG
    const getCardCenter = (card) => {
        const cardRect = card.getBoundingClientRect();
        const sectionRect = ribbonSection.getBoundingClientRect();
        
        return {
            x: ((cardRect.left + cardRect.width / 2 - sectionRect.left) / sectionRect.width) * 1200,
            y: ((cardRect.top + cardRect.height / 2 - sectionRect.top) / sectionRect.height) * 1000
        };
    };

    // Create smooth flowing path through all cards
    const createRibbonPath = () => {
        const points = [];
        
        // Collect all card positions in order (top row, middle row, bottom row)
        teamCards.forEach(card => {
            const center = getCardCenter(card);
            points.push(center);
        });

        if (points.length < 2) return '';

        // Create smooth curved path
        let pathData = `M ${points[0].x} ${points[0].y}`;
        
        for (let i = 1; i < points.length; i++) {
            const prev = points[i - 1];
            const curr = points[i];
            const next = points[i + 1] || curr;
            
            // Calculate control points for smooth curves
            const cp1x = prev.x + (curr.x - prev.x) * 0.5;
            const cp1y = prev.y;
            const cp2x = curr.x - (next.x - curr.x) * 0.5;
            const cp2y = curr.y;
            
            pathData += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
        }

        // Close the loop back to start
        const last = points[points.length - 1];
        const first = points[0];
        const cp1x = last.x + (first.x - last.x) * 0.5;
        const cp1y = last.y;
        const cp2x = first.x;
        const cp2y = first.y;
        
        pathData += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${first.x} ${first.y} Z`;

        return pathData;
    };

    // Update ribbon path
    const updateRibbon = () => {
        const pathData = createRibbonPath();
        if (pathData) {
            ribbonPath.setAttribute('d', pathData);
            
            // Update animated dot path
            const dot = document.getElementById('ribbonDot');
            if (dot) {
                const animateMotion = dot.querySelector('animateMotion');
                if (animateMotion) {
                    animateMotion.setAttribute('dur', '15s');
                }
            }
        }
    };

    // Simulate ribbon passing through cards
    const simulateRibbonFlow = () => {
        let currentIndex = 0;
        
        const activateCard = (index) => {
            // Remove active class from all cards
            teamCards.forEach(card => card.classList.remove('ribbon-active'));
            
            // Activate current card
            if (teamCards[index]) {
                teamCards[index].classList.add('ribbon-active');
                
                // Highlight ribbon path
                ribbonPath.classList.add('active');
                
                setTimeout(() => {
                    ribbonPath.classList.remove('active');
                }, 500);
            }
        };

        // Activate cards in sequence (15s total / number of cards)
        const interval = 15000 / teamCards.length;
        
        setInterval(() => {
            activateCard(currentIndex);
            currentIndex = (currentIndex + 1) % teamCards.length;
        }, interval);
    };

    // Hover effect - intensify ribbon around hovered card
    teamCards.forEach((card, index) => {
        card.addEventListener('mouseenter', () => {
            // Find all cards connected to this one (adjacent cards)
            const prevIndex = index > 0 ? index - 1 : teamCards.length - 1;
            const nextIndex = (index + 1) % teamCards.length;
            
            // Highlight this card and adjacent cards
            card.classList.add('ribbon-active');
            if (teamCards[prevIndex]) teamCards[prevIndex].classList.add('ribbon-active');
            if (teamCards[nextIndex]) teamCards[nextIndex].classList.add('ribbon-active');
            
            // Intensify ribbon path
            ribbonPath.classList.add('active');
        });

        card.addEventListener('mouseleave', () => {
            // Remove highlights
            teamCards.forEach(c => c.classList.remove('ribbon-active'));
            ribbonPath.classList.remove('active');
        });
    });

    // Initialize
    setTimeout(() => {
        updateRibbon();
        simulateRibbonFlow();
    }, 500);

    // Update on resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(updateRibbon, 250);
    });

    // Update when images load
    const images = document.querySelectorAll('.ribbon-section .team-image img');
    images.forEach(img => {
        if (img.complete) {
            updateRibbon();
        } else {
            img.addEventListener('load', updateRibbon);
        }
    });
};

