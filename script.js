document.addEventListener('DOMContentLoaded', () => {
    // Mobile menu toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    const headerActions = document.querySelector('.header-actions');

    mobileMenuBtn.addEventListener('click', () => {
        const isExpanded = navLinks.style.display === 'flex';
        
        if (isExpanded) {
            navLinks.style.display = 'none';
            headerActions.style.display = 'none';
        } else {
            navLinks.style.display = 'flex';
            navLinks.style.flexDirection = 'column';
            navLinks.style.position = 'absolute';
            navLinks.style.top = '100%';
            navLinks.style.left = '0';
            navLinks.style.width = '100%';
            navLinks.style.backgroundColor = '#1a1a1a';
            navLinks.style.padding = '1rem';
            navLinks.style.zIndex = '100';
            
            headerActions.style.display = 'flex';
            headerActions.style.flexDirection = 'column';
            headerActions.style.position = 'absolute';
            // Avoid forced reflow by using a fixed or CSS-based position
            headerActions.style.top = 'calc(100% + 50px)'; 
            headerActions.style.left = '0';
            headerActions.style.width = '100%';
            headerActions.style.backgroundColor = '#1a1a1a';
            headerActions.style.padding = '1rem';
            headerActions.style.zIndex = '100';
        }
    });

    // Testimonial Carousel Logic
    const slidesContainer = document.getElementById('testi-slides');
    const slides = document.querySelectorAll('.testimonial-slide');
    const prevBtn = document.getElementById('testi-prev');
    const nextBtn = document.getElementById('testi-next');
    const dotsContainer = document.getElementById('testi-dots');
    
    if (slides.length > 0) {
        let currentSlide = 0;
        
        // Generate dots
        slides.forEach((_, i) => {
            const dot = document.createElement('span');
            dot.classList.add('dot');
            if (i === 0) dot.classList.add('active');
            dot.addEventListener('click', () => goToSlide(i));
            dotsContainer.appendChild(dot);
        });
        const dots = document.querySelectorAll('.dot');
        
        function goToSlide(index) {
            slides[currentSlide].classList.remove('active');
            dots[currentSlide].classList.remove('active');
            
            currentSlide = index;
            if (currentSlide < 0) currentSlide = slides.length - 1;
            if (currentSlide >= slides.length) currentSlide = 0;
            
            slides[currentSlide].classList.add('active');
            dots[currentSlide].classList.add('active');
        }
        
        prevBtn.addEventListener('click', () => goToSlide(currentSlide - 1));
        nextBtn.addEventListener('click', () => goToSlide(currentSlide + 1));
        
        // Auto play
        let interval = setInterval(() => goToSlide(currentSlide + 1), 7000);
        
        // Pause on hover
        const carousel = document.querySelector('.testimonial-carousel');
        if (carousel) {
            carousel.addEventListener('mouseenter', () => clearInterval(interval));
            carousel.addEventListener('mouseleave', () => {
                interval = setInterval(() => goToSlide(currentSlide + 1), 7000);
            });
        }
    }
    // Web3Forms AJAX Submission
    const contactForm = document.getElementById('contact-form');
    const formResult = document.getElementById('form-result');

    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // hCaptcha validation check
            const hcaptchaVal = contactForm.querySelector('[name=h-captcha-response]');
            if (!hcaptchaVal || !hcaptchaVal.value) {
                formResult.style.display = "block";
                formResult.innerHTML = "Please complete the captcha";
                formResult.style.color = "var(--orange-main)";
                return;
            }
            
            const formData = new FormData(contactForm);
            const object = Object.fromEntries(formData);
            const json = JSON.stringify(object);
            
            formResult.style.display = "block";
            formResult.innerHTML = "Sending...";
            formResult.style.color = "var(--text-cream)";

            fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: json
            })
            .then(async (response) => {
                let json = await response.json();
                if (response.status == 200) {
                    formResult.innerHTML = "Message sent successfully!";
                    formResult.style.color = "var(--blue-pill)";
                    contactForm.reset();
                    if (typeof hcaptcha !== 'undefined') {
                        hcaptcha.reset();
                    }
                } else {
                    console.log(response);
                    formResult.innerHTML = json.message;
                    formResult.style.color = "var(--orange-main)";
                }
            })
            .catch(error => {
                console.log(error);
                formResult.innerHTML = "Something went wrong!";
                formResult.style.color = "var(--orange-main)";
            })
            .then(function() {
                setTimeout(() => {
                    formResult.style.display = "none";
                }, 5000);
            });
        });
    }
});
