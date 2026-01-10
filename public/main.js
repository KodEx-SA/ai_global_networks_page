/**
 * AI GLOBAL NETWORKS - ENHANCED JAVASCRIPT
 * Clean, modern, fully functional mobile navigation
 * Production-ready with smooth animations
 */

(function () {
    'use strict';

    // ==================== CONFIGURATION ====================
    const CONFIG = {
        scrollThreshold: 100,
        counterDuration: 2000,
        counterDelay: 500
    };

    // ==================== MOBILE NAVIGATION ====================
    function initMobileNav() {
        const hamburger = document.getElementById('hamburger');
        const navMenu = document.getElementById('navMenu');
        const mobileOverlay = document.getElementById('mobileOverlay');
        const navLinks = document.querySelectorAll('.nav-link');
        const body = document.body;

        if (!hamburger || !navMenu || !mobileOverlay) {
            console.warn('Mobile nav elements not found');
            return;
        }

        // Toggle menu
        function toggleMenu() {
            const isActive = navMenu.classList.contains('active');

            if (isActive) {
                closeMenu();
            } else {
                openMenu();
            }
        }

        // Open menu
        function openMenu() {
            hamburger.classList.add('active');
            navMenu.classList.add('active');
            mobileOverlay.classList.add('active');
            body.style.overflow = 'hidden';
        }

        // Close menu
        function closeMenu() {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
            mobileOverlay.classList.remove('active');
            body.style.overflow = '';
        }

        // Event listeners
        hamburger.addEventListener('click', toggleMenu);
        mobileOverlay.addEventListener('click', closeMenu);

        // Close menu when clicking nav links
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                closeMenu();
            });
        });

        // Close menu on ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && navMenu.classList.contains('active')) {
                closeMenu();
            }
        });
    }

    // ==================== HEADER SCROLL ====================
    function initHeaderScroll() {
        const header = document.getElementById('header');

        if (!header) return;

        function handleScroll() {
            if (window.scrollY > CONFIG.scrollThreshold) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }

        window.addEventListener('scroll', throttle(handleScroll, 100));
    }

    // ==================== SMOOTH SCROLL ====================
    function initSmoothScroll() {
        const links = document.querySelectorAll('a[href^="#"]');

        links.forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');

                if (href && href !== '#') {
                    e.preventDefault();
                    const targetId = href.substring(1);
                    const target = document.getElementById(targetId);

                    if (target) {
                        const header = document.querySelector('.header');
                        const headerHeight = header ? header.offsetHeight : 0;
                        const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;

                        window.scrollTo({
                            top: targetPosition,
                            behavior: 'smooth'
                        });
                    }
                }
            });
        });
    }

    // ==================== COUNTER ANIMATION ====================
    function initCounters() {
        const counters = document.querySelectorAll('.stat-number');
        if (counters.length === 0) return;

        let hasAnimated = false;

        function isInViewport(element) {
            const rect = element.getBoundingClientRect();
            return (
                rect.top >= 0 &&
                rect.left >= 0 &&
                rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
                rect.right <= (window.innerWidth || document.documentElement.clientWidth)
            );
        }

        function animateCounters() {
            if (hasAnimated) return;

            const firstCounter = counters[0];
            if (!isInViewport(firstCounter)) return;

            hasAnimated = true;

            counters.forEach(counter => {
                const target = parseInt(counter.dataset.target) || 0;
                const duration = CONFIG.counterDuration;
                const increment = target / (duration / 16);
                let current = 0;

                function updateCounter() {
                    current += increment;
                    if (current < target) {
                        counter.textContent = Math.floor(current).toLocaleString();
                        requestAnimationFrame(updateCounter);
                    } else {
                        counter.textContent = target.toLocaleString();
                    }
                }

                setTimeout(updateCounter, CONFIG.counterDelay);
            });
        }

        window.addEventListener('scroll', throttle(animateCounters, 200));
        animateCounters(); // Check on load
    }

    // ==================== SCROLL ANIMATIONS ====================
    function initScrollAnimations() {
        if (!('IntersectionObserver' in window)) {
            // Fallback for older browsers
            return;
        }

        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        // Observe elements that should animate on scroll
        const animatedElements = document.querySelectorAll(
            '.feature-card, .industry-card, .testimonial-card, .solution-category'
        );

        animatedElements.forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(el);
        });
    }

    // ==================== UTILITY FUNCTIONS ====================
    function throttle(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // ==================== GLOBAL FUNCTION ====================
    window.scrollToSection = function (sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            const header = document.querySelector('.header');
            const headerHeight = header ? header.offsetHeight : 0;
            const sectionPosition = section.getBoundingClientRect().top + window.pageYOffset - headerHeight;

            window.scrollTo({
                top: sectionPosition,
                behavior: 'smooth'
            });
        }
    };

    // ==================== INITIALIZATION ====================
    function init() {
        console.log('🚀 AI Global Networks - Initializing...');

        initMobileNav();
        initHeaderScroll();
        initSmoothScroll();
        initCounters();
        initScrollAnimations();

        console.log('✅ All systems initialized');
    }

    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})(); s