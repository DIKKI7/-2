// Update time every second
function updateTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    const timeElement = document.getElementById('current-time');
    if (timeElement) {
        timeElement.textContent = `${hours}:${minutes}:${seconds}`;
    }
}

// Update time immediately and then every second
updateTime();
setInterval(updateTime, 1000);

// Retry inline background playback when the user interacts with the page.
function initHeroVideo() {
    const video = document.querySelector('.site-header-video');
    if (!video) return;

    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.controls = false;

    const tryPlayback = () => {
        if (document.hidden || !video.paused) return;
        const attempt = video.play();
        if (attempt) attempt.catch(() => {
            // The browser may require a user gesture before playback.
        });
    };

    video.addEventListener('canplay', tryPlayback, { once: true });
    document.addEventListener('touchend', tryPlayback, { passive: true });
    document.addEventListener('click', tryPlayback);
    document.addEventListener('visibilitychange', tryPlayback);
    tryPlayback();
}

// Scroll animations
function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('.scroll-animate');
    
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                // Отключаем наблюдение после анимации для оптимизации
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    animatedElements.forEach(element => {
        observer.observe(element);
    });
}

// Bee cursor
function initBeeCursor() {
    if (!window.matchMedia('(pointer: fine)').matches) return;

    const bee = document.createElement('div');
    bee.className = 'bee-cursor';
    bee.setAttribute('aria-hidden', 'true');
    bee.innerHTML = `
        <div class="bee-wing bee-wing-left"></div>
        <div class="bee-wing bee-wing-right"></div>
        <div class="bee-body"></div>
    `;
    document.body.appendChild(bee);
    document.body.classList.add('bee-cursor-active');

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let beeX = mouseX;
    let beeY = mouseY;
    let lastX = beeX;
    let lastY = beeY;
    let isVisible = false;

    const showBee = () => {
        if (!isVisible) {
            bee.classList.add('is-visible');
            isVisible = true;
        }
    };

    document.addEventListener('mousemove', (event) => {
        mouseX = event.clientX;
        mouseY = event.clientY;
        showBee();
    });

    document.addEventListener('mouseleave', () => {
        bee.classList.remove('is-visible');
        isVisible = false;
    });

    function animateBee() {
        beeX += (mouseX - beeX) * 0.28;
        beeY += (mouseY - beeY) * 0.28;

        const dx = beeX - lastX;
        const dy = beeY - lastY;
        const angle = Math.max(-18, Math.min(18, dx * 2 + dy * 0.6));

        bee.style.transform = `translate3d(${beeX - 8}px, ${beeY - 8}px, 0) rotate(${angle}deg)`;

        lastX = beeX;
        lastY = beeY;
        requestAnimationFrame(animateBee);
    }

    animateBee();
}

// CTA button click handler и инициализация интерактивности
document.addEventListener('DOMContentLoaded', function() {
    initHeroVideo();
    const ctaButton = document.querySelector('.cta-button');
    if (ctaButton) {
        ctaButton.addEventListener('click', function() {
            // Здесь можно добавить действие при клике на кнопку
            console.log('Кнопка нажата');
        });
    }

    // Галерея товара
    const mainImage = document.querySelector('.product-main-image');
    const thumbs = document.querySelectorAll('.product-thumb img');
    const thumbButtons = document.querySelectorAll('.product-thumb');

    const selectProductPhoto = (index) => {
        const img = thumbs[index];
        if (!mainImage || !img || !thumbButtons[index]) return;

        mainImage.src = img.dataset.full || img.src;
        mainImage.alt = img.alt;
        thumbButtons.forEach((button, photoIndex) => {
            button.classList.toggle('is-active', photoIndex === index);
        });
    };

    thumbButtons.forEach((button, index) => {
        button.addEventListener('click', () => selectProductPhoto(index));
    });

    // Full-size photos: native dialog provides modal focus and Escape support.
    const photoViewer = document.querySelector('.photo-viewer');
    const photoOpenButton = document.querySelector('.product-photo-open');
    let suppressPhotoOpenUntil = 0;
    const stepProductPhoto = (direction) => {
        if (!thumbs.length) return;
        const activeIndex = Array.from(thumbButtons).findIndex(button => button.classList.contains('is-active'));
        selectProductPhoto((Math.max(0, activeIndex) + direction + thumbs.length) % thumbs.length);
    };
    if (photoOpenButton) {
        let cardSwipeStart = null;
        photoOpenButton.addEventListener('touchstart', event => {
            suppressPhotoOpenUntil = 0;
            cardSwipeStart = event.touches.length === 1
                ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : null;
        }, { passive: true });
        photoOpenButton.addEventListener('touchend', event => {
            if (!cardSwipeStart || !event.changedTouches.length) return;
            const dx = event.changedTouches[0].clientX - cardSwipeStart.x;
            const dy = event.changedTouches[0].clientY - cardSwipeStart.y;
            cardSwipeStart = null;
            if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) {
                suppressPhotoOpenUntil = Date.now() + 700;
                stepProductPhoto(dx < 0 ? 1 : -1);
            }
        }, { passive: true });
        photoOpenButton.addEventListener('touchcancel', () => { cardSwipeStart = null; }, { passive: true });
    }
    if (photoViewer && photoOpenButton && thumbs.length) {
        const viewerImage = photoViewer.querySelector('.photo-viewer-image');
        const counter = photoViewer.querySelector('.photo-viewer-counter');
        const stage = photoViewer.querySelector('.photo-viewer-stage');
        let photoIndex = 0;
        let previousOverflow = '';
        let swipeStart = null;

        let photoRequest = 0;
        let photoAnimation = null;
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        let isClosing = false;
        let closeAnimation = null;
        let closeTimer = null;

        const closePhotoViewer = () => {
            if (!photoViewer.open || isClosing) return;
            isClosing = true;
            photoRequest++;
            swipeStart = null;
            if (reducedMotion.matches) {
                photoViewer.close();
                return;
            }

            // Fade from the current shade even if opening has not finished.
            const backdropColor = getComputedStyle(photoViewer, '::backdrop').backgroundColor;
            photoViewer.style.setProperty('--closing-backdrop-color', backdropColor);
            photoViewer.classList.add('is-closing');
            closeAnimation = photoViewer.animate([
                { opacity: 1, transform: 'translateY(0) scale(1)' },
                { opacity: 0, transform: 'translateY(6px) scale(0.98)' }
            ], { duration: 600, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', fill: 'forwards' });
            const finishClose = () => {
                if (isClosing && photoViewer.open) photoViewer.close();
            };
            closeAnimation.finished.then(finishClose, finishClose);
            closeTimer = setTimeout(finishClose, 700);
        };


        const showPhoto = (index) => {
            if (isClosing) return;
            const direction = index >= photoIndex ? 1 : -1;
            photoIndex = (index + thumbs.length) % thumbs.length;
            const targetIndex = photoIndex;
            const request = ++photoRequest;
            const image = thumbs[targetIndex];
            const source = image.dataset.full || image.src;
            const animate = photoViewer.open && !reducedMotion.matches;

            const displayPhoto = () => {
                if (request !== photoRequest) return;
                if (photoAnimation) photoAnimation.cancel();
                viewerImage.src = source;
                viewerImage.alt = image.alt;
                counter.textContent = `${targetIndex + 1} / ${thumbs.length}`;
                selectProductPhoto(targetIndex);
                if (animate && photoViewer.open && !reducedMotion.matches) {
                    photoAnimation = viewerImage.animate([
                        { opacity: 0, transform: `translateX(${direction * 10}px) scale(0.995)` },
                        { opacity: 1, transform: 'translateX(0) scale(1)' }
                    ], { duration: 750, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' });
                }
            };

            if (!photoViewer.open) {
                displayPhoto();
                return;
            }
            // Keep the current photo visible until the next one has loaded.
            const nextImage = new Image();
            nextImage.onload = displayPhoto;
            nextImage.onerror = () => {
                if (request !== photoRequest) return;
                const active = Array.from(thumbButtons).findIndex(button => button.classList.contains('is-active'));
                photoIndex = Math.max(0, active);
            };
            nextImage.src = source;
        };

        photoOpenButton.addEventListener('click', () => {
            if (photoViewer.open || Date.now() < suppressPhotoOpenUntil) return;
            const activeIndex = Array.from(thumbButtons).findIndex(button => button.classList.contains('is-active'));
            showPhoto(Math.max(0, activeIndex));
            previousOverflow = document.body.style.overflow;
            photoViewer.showModal();
            document.body.style.overflow = 'hidden';
        });
        photoViewer.querySelector('.photo-viewer-close').addEventListener('click', closePhotoViewer);
        photoViewer.addEventListener('cancel', event => {
            event.preventDefault();
            closePhotoViewer();
        });
        photoViewer.querySelector('.photo-viewer-prev').addEventListener('click', () => showPhoto(photoIndex - 1));
        photoViewer.querySelector('.photo-viewer-next').addEventListener('click', () => showPhoto(photoIndex + 1));
        photoViewer.addEventListener('close', () => {
            isClosing = false;
            clearTimeout(closeTimer);
            if (closeAnimation) closeAnimation.cancel();
            closeAnimation = null;
            photoViewer.classList.remove('is-closing');
            photoViewer.style.removeProperty('--closing-backdrop-color');
            photoRequest++;
            if (photoAnimation) photoAnimation.cancel();
            document.body.style.overflow = previousOverflow;
            swipeStart = null;
            photoOpenButton.focus({ preventScroll: true });
        });
        photoViewer.addEventListener('click', event => {
            if (event.target !== photoViewer) return;
            const rect = photoViewer.getBoundingClientRect();
            if (event.clientX < rect.left || event.clientX > rect.right ||
                event.clientY < rect.top || event.clientY > rect.bottom) closePhotoViewer();
        });
        photoViewer.addEventListener('keydown', event => {
            if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                event.preventDefault();
                showPhoto(photoIndex + (event.key === 'ArrowLeft' ? -1 : 1));
            }
        });
        stage.addEventListener('touchstart', event => {
            swipeStart = event.touches.length === 1
                ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : null;
        }, { passive: true });
        stage.addEventListener('touchend', event => {
            if (!swipeStart || !event.changedTouches.length) return;
            const dx = event.changedTouches[0].clientX - swipeStart.x;
            const dy = event.changedTouches[0].clientY - swipeStart.y;
            swipeStart = null;
            if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.5) {
                showPhoto(photoIndex + (dx < 0 ? 1 : -1));
            }
        }, { passive: true });
        stage.addEventListener('touchcancel', () => { swipeStart = null; });
    }

    // Варианты граммовки
    const productTitle = document.querySelector('.product-title');
    const productPrice = document.querySelector('.product-price');
    const weightOptions = document.querySelectorAll('.product-weight-option');

    if (productTitle && productPrice && weightOptions.length) {
        const updateProductWeight = (option) => {
            const weight = option.querySelector('span')?.textContent?.trim();
            const price = option.querySelector('strong')?.textContent?.trim();

            if (weight) {
                const titleWeight = productTitle.querySelector('.product-title-weight-value');
                if (titleWeight) titleWeight.textContent = weight;
            }

            if (price) {
                productPrice.textContent = price;
            }

            weightOptions.forEach(item => item.classList.remove('is-active'));
            option.classList.add('is-active');
        };

        weightOptions.forEach(option => {
            option.addEventListener('click', () => {
                updateProductWeight(option);
                const photoIndex = Number.parseInt(option.dataset.photoIndex, 10);
                if (Number.isInteger(photoIndex)) selectProductPhoto(photoIndex);
            });
        });

        const activeWeight = document.querySelector('.product-weight-option.is-active') || weightOptions[0];
        updateProductWeight(activeWeight);
    }

    // Счётчик количества
    const qtyInput = document.querySelector('.qty-input');
    const qtyButtons = document.querySelectorAll('.qty-btn');

    if (qtyInput && qtyButtons.length) {
        const min = parseInt(qtyInput.min || '1', 10);
        const max = parseInt(qtyInput.max || '99', 10);

        qtyButtons.forEach(button => {
            button.addEventListener('click', () => {
                const dir = button.getAttribute('data-direction');
                let value = parseInt(qtyInput.value || '1', 10);
                if (isNaN(value)) value = 1;

                if (dir === 'up') value += 1;
                if (dir === 'down') value -= 1;

                if (value < min) value = min;
                if (value > max) value = max;

                qtyInput.value = String(value);
            });
        });

        qtyInput.addEventListener('input', () => {
            let value = parseInt(qtyInput.value || '1', 10);
            const minVal = parseInt(qtyInput.min || '1', 10);
            const maxVal = parseInt(qtyInput.max || '99', 10);
            if (isNaN(value) || value < minVal) value = minVal;
            if (value > maxVal) value = maxVal;
            qtyInput.value = String(value);
        });
    }

    const orderModal = document.querySelector('.order-modal');
    const orderOpenButton = document.querySelector('[data-order-open]');
    const orderCloseButtons = document.querySelectorAll('[data-order-close]');

    if (orderModal && orderOpenButton) {
        const openOrderModal = () => {
            orderModal.classList.add('is-open');
            orderModal.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
        };

        const closeOrderModal = () => {
            orderModal.classList.remove('is-open');
            orderModal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
        };

        orderOpenButton.addEventListener('click', openOrderModal);
        orderCloseButtons.forEach(button => {
            button.addEventListener('click', closeOrderModal);
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && orderModal.classList.contains('is-open')) {
                closeOrderModal();
            }
        });
    }

    initBeeCursor();
    // Инициализация анимаций при скролле
    initScrollAnimations();

    // Также запускаем анимации для элементов, которые уже видны при загрузке
    setTimeout(() => {
        const visibleElements = document.querySelectorAll('.scroll-animate');
        visibleElements.forEach(element => {
            const rect = element.getBoundingClientRect();
            const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
            if (isVisible) {
                element.classList.add('animate-in');
            }
        });
    }, 100);
});
