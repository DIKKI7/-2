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
