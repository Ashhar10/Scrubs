document.addEventListener('DOMContentLoaded', () => {

    /* ==================================
       1. SCROLL CANVAS SEQUENCE
    ================================== */
    const canvas = document.getElementById('sequence-canvas');
    if (canvas) {
        const context = canvas.getContext('2d');
        const frameCount = 127;
        const currentFrame = index => `public/scroll/${String(index).padStart(3, '0')}.png`;

        const images = [];
        const sequenceObj = { frame: 0 };

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            render();
        };

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        let loadedImages = 0;
        for (let i = 1; i <= frameCount; i++) {
            const img = new Image();
            img.src = currentFrame(i);
            img.onload = () => {
                loadedImages++;
                if (i === 1) render();
            };
            images.push(img);
        }

        function render() {
            const currentImg = images[sequenceObj.frame];
            if (!currentImg || !currentImg.complete) return;

            // Extract top-left pixel color for letterboxing
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = 1; tempCanvas.height = 1;
            const tCtx = tempCanvas.getContext('2d');
            tCtx.drawImage(currentImg, 0, 0, 1, 1, 0, 0, 1, 1);
            const data = tCtx.getImageData(0, 0, 1, 1).data;
            context.fillStyle = `rgb(${data[0]}, ${data[1]}, ${data[2]})`;
            context.fillRect(0, 0, canvas.width, canvas.height);
            
            // Extract center pixel for dynamic scrub color
            tCtx.clearRect(0, 0, 1, 1);
            // Sample a nice spot relative to the model's chest/scrub area
            tCtx.drawImage(currentImg, currentImg.width / 2, currentImg.height * 0.4, 1, 1, 0, 0, 1, 1);
            const scrubData = tCtx.getImageData(0, 0, 1, 1).data;
            document.documentElement.style.setProperty('--dynamic-scrub', `rgb(${scrubData[0]}, ${scrubData[1]}, ${scrubData[2]})`);

            // Calculate background brightness for alternating contrast
            const brightness = Math.round(((parseInt(data[0]) * 299) + (parseInt(data[1]) * 587) + (parseInt(data[2]) * 114)) / 1000);
            const contrastColor = (brightness > 125) ? '#0F172A' : '#FFFFFF';
            document.documentElement.style.setProperty('--dynamic-contrast', contrastColor);

            const canvasRatio = canvas.width / canvas.height;
            const imgRatio = currentImg.width / currentImg.height;
            
            // Core Logic: Always fix the image height to the screen height.
            // On wide desktops: This ensures head/feet aren't cropped, with edge-pixels filling the sides.
            // On tall phones: This perfectly scales the person to fill the phone height, elegantly cropping the empty horizontal space.
            let drawHeight = canvas.height;
            let drawWidth = drawHeight * imgRatio;
            let offsetX = (canvas.width - drawWidth) / 2;
            let offsetY = 0;

            context.drawImage(currentImg, offsetX, offsetY, drawWidth, drawHeight);
        }

        const heroSpacer = document.getElementById('hero-spacer');
        let targetFrame = 0;

        window.addEventListener('scroll', () => {
            if (!heroSpacer) return;
            const scrollTop = window.scrollY;
            const maxScrollTop = heroSpacer.offsetHeight - window.innerHeight;
            const scrollFraction = maxScrollTop > 0 ? Math.min(1, Math.max(0, scrollTop / maxScrollTop)) : 0;
            targetFrame = Math.min(frameCount - 1, Math.floor(scrollFraction * frameCount));
        }, { passive: true });

        let currentFrameFloat = 0;
        const lerp = (start, end, factor) => start + (end - start) * factor;

        function animate() {
            currentFrameFloat = lerp(currentFrameFloat, targetFrame, 0.08);
            const frameIndex = Math.round(currentFrameFloat);
            if (sequenceObj.frame !== frameIndex) {
                sequenceObj.frame = frameIndex;
                render();
            }
            requestAnimationFrame(animate);
        }
        animate();
    }

    /* ==================================
       2. UI INTERSECTION OBSERVER
    ================================== */
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.reveal-up').forEach((el) => {
        observer.observe(el);
    });

    /* ==================================
       3. NAVBAR SCROLL EFFECT
    ================================== */
    const navbar = document.getElementById('navbar');
    const heroSpacerEl = document.getElementById('hero-spacer');
    
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        const maxHeroScroll = heroSpacerEl ? heroSpacerEl.offsetHeight - window.innerHeight : 0;
        
        if (scrollY < maxHeroScroll - 20) {
            // Hide at the top and during the scroll sequence
            navbar.classList.add('hidden');
            navbar.classList.remove('scrolled');
        } else {
            // Show as glass pill after sequence
            navbar.classList.remove('hidden');
            navbar.classList.add('scrolled');
        }
    }, { passive: true });

    /* ==================================
       3b. HAMBURGER MENU
    ================================== */
    const hamburger = document.getElementById('hamburger');
    const mobileNav = document.getElementById('mobile-nav');

    if (hamburger && mobileNav) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('open');
            mobileNav.classList.toggle('open');
            document.body.style.overflow = mobileNav.classList.contains('open') ? 'hidden' : '';
        });

        // Close mobile nav when any link inside is clicked
        mobileNav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('open');
                mobileNav.classList.remove('open');
                document.body.style.overflow = '';
            });
        });
    }

    /* ==================================
       4. BUTTON INTERACTIONS & CAROUSELS
    ================================== */

    // Smooth scroll for "SHOP BEST SELLERS" button
    const shopBtn = document.querySelector('.primary-btn');
    if (shopBtn) {
        shopBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const productsSection = document.querySelector('.products-section');
            if (productsSection) {
                productsSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    // Prevent default form submissions (Newsletter & Footer Contact)
    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = form.querySelector('.submit-btn');
            const originalText = btn.textContent;
            btn.textContent = 'Sent!';
            btn.style.backgroundColor = 'var(--secondary-color)';
            btn.style.color = 'white';

            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.backgroundColor = '';
                btn.style.color = '';
                form.reset();
            }, 2000);
        });
    });

    // Handle generic anchor tags for presentation (Prevents jumping on empty links)
    document.querySelectorAll('a[href="#shop"], a[href="#navbar"], a[href="#hero-spacer"], a[href="#features"]').forEach(link => {
        link.addEventListener('click', (e) => {
            const targetId = link.getAttribute('href');
            const targetSection = document.querySelector(targetId);

            if (targetSection) {
                e.preventDefault();
                targetSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // Robust scroll logic for Carousels (Reviews & Products)
    const setupCarousel = (carouselSelector, trackSelector) => {
        const carousel = document.querySelector(carouselSelector);
        if (!carousel) return;
        const track = carousel.querySelector(trackSelector);
        if (!track) return;

        const prevBtn = carousel.querySelector('.prev');
        const nextBtn = carousel.querySelector('.next');
        const dotsContainer = carousel.querySelector('.carousel-dots');
        let dots = dotsContainer ? Array.from(dotsContainer.querySelectorAll('.dot')) : [];

        // --- Dragging Logic ---
        let isDown = false;
        let startX;
        let scrollLeft;

        const startDrag = (e) => {
            isDown = true;
            track.style.cursor = 'grabbing';
            track.style.scrollBehavior = 'auto'; // Disable smooth scroll while dragging
            track.style.scrollSnapType = 'none'; // Disable snapping while dragging
            startX = (e.pageX || e.touches[0].pageX) - track.offsetLeft;
            scrollLeft = track.scrollLeft;
        };

        const stopDrag = () => {
            isDown = false;
            track.style.cursor = 'grab';
            track.style.scrollBehavior = 'smooth';
            track.style.scrollSnapType = ''; // Restore snapping
            updateDots();
        };

        const moveDrag = (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = (e.pageX || e.touches[0].pageX) - track.offsetLeft;
            const walk = (x - startX) * 1.5; // Scroll speed multiplier
            track.scrollLeft = scrollLeft - walk;
        };

        track.addEventListener('mousedown', startDrag);
        track.addEventListener('touchstart', startDrag, { passive: true });

        track.addEventListener('mouseleave', stopDrag);
        track.addEventListener('mouseup', stopDrag);
        track.addEventListener('touchend', stopDrag);

        track.addEventListener('mousemove', moveDrag);
        track.addEventListener('touchmove', moveDrag, { passive: false });
        // Set initial cursor
        track.style.cursor = 'grab';

        // --- Button Logic ---
        const getScrollAmount = () => {
            const firstCard = track.children[0];
            const gap = parseInt(window.getComputedStyle(track).gap) || 0;
            return firstCard ? firstCard.offsetWidth + gap : 350;
        };

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                track.scrollBy({ left: -getScrollAmount(), behavior: 'smooth' });
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                track.scrollBy({ left: getScrollAmount(), behavior: 'smooth' });
            });
        }

        // --- Synchronization Logic ---
        let scrollTimeout;
        track.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(updateDots, 100);
        });

        const updateDots = () => {
            if (dots.length === 0) return;
            const maxScroll = track.scrollWidth - track.clientWidth;
            if (maxScroll <= 0) return;

            const scrollPercentage = track.scrollLeft / maxScroll;
            let activeIndex = Math.round(scrollPercentage * (dots.length - 1));

            // Bounds safety
            activeIndex = Math.max(0, Math.min(activeIndex, dots.length - 1));

            dots.forEach((dot, index) => {
                if (index === activeIndex) dot.classList.add('active');
                else dot.classList.remove('active');
            });
        };

        // Initialize dots if any
        setTimeout(updateDots, 50);
    };

    setupCarousel('.reviews-carousel', '.reviews-track');
    setupCarousel('.products-carousel', '.products-track');

    // Cart Toggle Logic
    const cartBtns = document.querySelectorAll('.cart-btn');
    const closeCartBtn = document.getElementById('close-cart');
    const cartSidebar = document.getElementById('cart-sidebar');
    const cartOverlay = document.getElementById('cart-overlay');

    console.log('Cart Elements Loaded:', { cartBtns, closeCartBtn, cartSidebar, cartOverlay });

    const toggleCart = (e) => {
        if (e) e.preventDefault();
        console.log('Cart toggle triggered!');

        if (cartSidebar && cartOverlay) {
            cartSidebar.classList.toggle('active');
            cartOverlay.classList.toggle('active');
            document.body.style.overflow = cartSidebar.classList.contains('active') ? 'hidden' : '';
            console.log('Cart classes toggled. Active:', cartSidebar.classList.contains('active'));
        } else {
            console.error('Missing cartSidebar or cartOverlay elements from the DOM.');
        }
    };

    if (cartBtns.length > 0) {
        cartBtns.forEach(btn => btn.addEventListener('click', toggleCart));
    } else {
        console.error('No .cart-btn found on page!');
    }

    if (closeCartBtn) closeCartBtn.addEventListener('click', toggleCart);
    if (cartOverlay) cartOverlay.addEventListener('click', toggleCart);

    // Cart Interactivity Logic
    const cartContainer = document.querySelector('.cart-items');
    const totalDisplay = document.querySelector('.cart-total span:last-child');

    const updateCartTotal = () => {
        let total = 0;
        document.querySelectorAll('.cart-item').forEach(item => {
            const priceText = item.querySelector('.cart-item-info p').textContent.replace('$', '');
            const qtyText = item.querySelector('.qty-control span').textContent;
            total += parseFloat(priceText) * parseInt(qtyText);
        });
        if (totalDisplay) {
            totalDisplay.textContent = `$${total.toFixed(2)}`;
        }
    };

    if (cartContainer) {
        cartContainer.addEventListener('click', (e) => {
            const item = e.target.closest('.cart-item');
            if (!item) return;

            // Remove Item
            if (e.target.closest('.remove-item')) {
                item.style.opacity = '0';
                setTimeout(() => {
                    item.remove();
                    updateCartTotal();
                }, 300);
            }

            // Quantity Control
            if (e.target.tagName === 'BUTTON') {
                const qtySpan = item.querySelector('.qty-control span');
                if (!qtySpan) return;
                let currentQty = parseInt(qtySpan.textContent);

                if (e.target.textContent === '+') {
                    qtySpan.textContent = currentQty + 1;
                    updateCartTotal();
                } else if (e.target.textContent === '-' && currentQty > 1) {
                    qtySpan.textContent = currentQty - 1;
                    updateCartTotal();
                }
            }
        });
    }

    // Checkout Button
    const checkoutBtn = document.querySelector('.checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            const originalText = checkoutBtn.textContent;
            checkoutBtn.textContent = 'Processing...';
            setTimeout(() => {
                alert('Checkout successful! Thank you for your purchase.');
                if (cartContainer) cartContainer.innerHTML = '';
                updateCartTotal();
                checkoutBtn.textContent = originalText;
                toggleCart();
            }, 1000);
        });
    }

});
