/**
 * AI GLOBAL NETWORKS - MAIN JAVASCRIPT
 * Updated with booking functionality
 */

(function () {
    'use strict';

    // ==================== CONFIGURATION ====================
    const CONFIG = {
        scrollThreshold: 100,
        counterDuration: 2000,
        counterDelay: 500,
        // Replace with your actual Google Calendar booking link
        bookingURL: 'https://calendar.google.com/calendar/appointments/schedules/YOUR_BOOKING_ID'
    };

    // ==================== BOOKING FUNCTION ====================
    window.openBooking = function () {
        // Open Google Calendar booking in new tab
        window.open(CONFIG.bookingURL, '_blank', 'noopener,noreferrer');

        // Optional: Track booking click with analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'booking_click', {
                'event_category': 'engagement',
                'event_label': 'consultation_booking'
            });
        }

        console.log('📅 Opening booking calendar...');
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
            if (!firstCounter || !isInViewport(firstCounter)) return;

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
            '.service-card, .why-card, .testimonial-card, .mission-card'
        );

        animatedElements.forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(el);
        });
    }

    // ==================== BOOKING BUTTON HOVER EFFECTS ====================
    function initBookingEffects() {
        const bookingButtons = document.querySelectorAll('.btn-booking, .btn-booking-glow');

        bookingButtons.forEach(button => {
            // Add calendar icon pulse on hover
            button.addEventListener('mouseenter', () => {
                const svg = button.querySelector('svg');
                if (svg) {
                    svg.style.transform = 'scale(1.1)';
                    svg.style.transition = 'transform 0.3s ease';
                }
            });

            button.addEventListener('mouseleave', () => {
                const svg = button.querySelector('svg');
                if (svg) {
                    svg.style.transform = 'scale(1)';
                }
            });
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

    // ==================== GLOBAL FUNCTIONS ====================
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

    // ==================== SERVICE CARD INTERACTIONS ====================
    function initServiceCards() {
        const serviceCards = document.querySelectorAll('.service-card');

        serviceCards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                // Add subtle rotation to icon on hover
                const icon = card.querySelector('.service-icon');
                if (icon) {
                    icon.style.transform = 'scale(1.1) rotate(5deg)';
                }
            });

            card.addEventListener('mouseleave', () => {
                const icon = card.querySelector('.service-icon');
                if (icon) {
                    icon.style.transform = 'scale(1) rotate(0deg)';
                }
            });
        });
    }

    // ==================== STATS ICONS ANIMATION ====================
    function initStatsIcons() {
        const statIcons = document.querySelectorAll('.stat-icon');

        statIcons.forEach((icon, index) => {
            // Stagger animation on load
            setTimeout(() => {
                icon.style.transform = 'scale(1)';
                icon.style.opacity = '1';
            }, index * 200);

            // Initial state
            icon.style.transform = 'scale(0.8)';
            icon.style.opacity = '0';
            icon.style.transition = 'all 0.5s ease';
        });
    }

    // ==================== CONSOLE BRANDING ====================
    function showConsoleBranding() {
        const styles = [
            'color: #ff6600',
            'font-size: 16px',
            'font-weight: bold',
            'padding: 10px'
        ].join(';');

        console.log('%c🤖 AI Global Networks', styles);
        console.log('%cEthical AI Solutions in South Africa', 'color: #666; font-size: 12px;');
        console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #ff6600;');
        console.log('%cWebsite by Thando Ndlovu & Ashley K Motsie', 'color: #999; font-size: 10px;');
        console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #ff6600;');
    }

    // ==================== EASTER EGG ====================
    function initEasterEgg() {
        let konami = [];
        const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

        document.addEventListener('keydown', (e) => {
            konami.push(e.key);
            konami.splice(-konamiCode.length - 1, konami.length - konamiCode.length);

            if (konami.join(',').includes(konamiCode.join(','))) {
                console.log('%c🎉 Easter Egg Unlocked!', 'color: #ff6600; font-size: 20px; font-weight: bold;');
                console.log('%cWelcome to the secret developer club! 🚀', 'color: #999;');

                // Add subtle animation to logo
                const logo = document.querySelector('.logo');
                if (logo) {
                    logo.style.animation = 'spin 1s ease-in-out';
                    setTimeout(() => {
                        logo.style.animation = '';
                    }, 1000);
                }
            }
        });
    }

    // ==================== PERFORMANCE MONITORING ====================
    function monitorPerformance() {
        if ('performance' in window && 'getEntriesByType' in window.performance) {
            window.addEventListener('load', () => {
                setTimeout(() => {
                    const perfData = window.performance.timing;
                    const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
                    const connectTime = perfData.responseEnd - perfData.requestStart;
                    const renderTime = perfData.domComplete - perfData.domLoading;

                    console.log('%c⚡ Performance Metrics', 'color: #ff6600; font-weight: bold;');
                    console.log(`Page Load Time: ${pageLoadTime}ms`);
                    console.log(`Server Response: ${connectTime}ms`);
                    console.log(`Render Time: ${renderTime}ms`);
                }, 0);
            });
        }
    }

    // ==================== INITIALIZATION ====================
    function init() {
        console.log('🚀 AI Global Networks - Initializing...');

        // Show console branding
        showConsoleBranding();

        // Initialize core functionality
        initMobileNav();
        initHeaderScroll();
        initSmoothScroll();
        initCounters();
        initScrollAnimations();
        initBookingEffects();
        initServiceCards();
        initStatsIcons();
        initEasterEgg();

        // Monitor performance (development only)
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            monitorPerformance();
        }

        console.log('✅ All systems initialized');
        console.log('📅 Booking system ready');
    }

    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();