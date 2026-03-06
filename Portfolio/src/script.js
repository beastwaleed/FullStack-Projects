document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark')
    } else {
        document.documentElement.classList.remove('dark')
    }
})
const navbar = document.getElementById("navbar");
const navLink = document.getElementById("navLink");
const mobileMenu = document.getElementById("mobileMenu");

function openMenu() {
    mobileMenu.style.transform = 'translateX(-16rem)';
}

function closeMenu() {
    mobileMenu.style.transform = 'translateX(0)';
}

function toggleTheme() {
    document.documentElement.classList.toggle('dark');

    if (document.documentElement.classList.contains('dark')) {
        localStorage.theme = 'dark';
    } else {
        localStorage.theme = 'light';
    }
}

window.addEventListener('scroll', () => {
    if (scrollY > 50) {
        navbar.classList.add('bg-white', 'bg-opacity-50', 'backdrop-blur-lg', 'shadow-sm', 'dark:bg-darkTheme', 'dark:shadow-white/20');
        navLink.classList.remove('bg-white', 'shadow-sm', 'bg-opacity-50', 'dark:border', 'dark:border-white/30', "dark:bg-transparent");
    } else {
        navbar.classList.remove('bg-white', 'bg-opacity-50', 'backdrop-blur-lg', 'shadow-sm', 'dark:bg-darkTheme', 'dark:shadow-white/20');
        navLink.classList.add('bg-white', 'shadow-sm', 'bg-opacity-50', 'dark:border', 'dark:border-white/30', "dark:bg-transparent");
    }
})

// Contact Form Handler
const contactForm = document.getElementById('contactForm');
const formMessage = document.getElementById('formMessage');

if (contactForm) {
    contactForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;
        
        // Show loading state
        submitBtn.innerHTML = 'Sending...';
        submitBtn.disabled = true;
        formMessage.textContent = '';
        formMessage.className = 'mt-4 text-center';
        
        try {
            const formData = new FormData(contactForm);
            
            const response = await fetch(contactForm.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (response.ok) {
                // Success
                formMessage.textContent = '✓ Thank you! Your message has been sent successfully.';
                formMessage.classList.add('text-green-600', 'dark:text-green-400');
                contactForm.reset();
            } else {
                throw new Error('Form submission failed');
            }
        } catch (error) {
            // Error
            formMessage.textContent = '✕ Oops! Something went wrong. Please try again.';
            formMessage.classList.add('text-red-600', 'dark:text-red-400');
        } finally {
            // Restore button
            submitBtn.innerHTML = originalBtnText;
            submitBtn.disabled = false;
        }
    });
}

// Projects Filtering
document.addEventListener('DOMContentLoaded', () => {
    const projectTabs = document.querySelectorAll('.project-tab-btn');
    const projectCards = document.querySelectorAll('.project-card');

    if (projectTabs.length > 0 && projectCards.length > 0) {
        projectTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Remove active classes from all tabs
                projectTabs.forEach(t => {
                    t.classList.remove('active', 'border-transparent', 'bg-gradient-to-r', 'from-[#b820e6]', 'to-[#da7d20]', 'text-white', 'shadow-md');
                    t.classList.add('border-gray-300', 'dark:border-white/30', 'bg-white', 'dark:bg-transparent', 'dark:text-white', 'hover:bg-slate-100/70', 'dark:hover:bg-darkHover');
                });
                
                // Add active classes to clicked tab
                tab.classList.remove('border-gray-300', 'dark:border-white/30', 'bg-white', 'dark:bg-transparent', 'dark:text-white', 'hover:bg-slate-100/70', 'dark:hover:bg-darkHover');
                tab.classList.add('active', 'border-transparent', 'bg-gradient-to-r', 'from-[#b820e6]', 'to-[#da7d20]', 'text-white', 'shadow-md');
                
                const targetCategory = tab.getAttribute('data-category');
                
                // Filter cards
                projectCards.forEach(card => {
                    const cardCategory = card.getAttribute('data-category');
                    
                    if (targetCategory === 'all' || targetCategory === cardCategory) {
                        card.style.display = 'flex';
                        // Add fade-in animation
                        card.style.opacity = '0';
                        card.style.transform = 'scale(0.95)';
                        setTimeout(() => {
                            card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                            card.style.opacity = '1';
                            card.style.transform = 'scale(1)';
                        }, 10);
                    } else {
                        card.style.display = 'none';
                    }
                });
            });
        });
    }
});

// Slider Logic
document.addEventListener('DOMContentLoaded', () => {
    const slideLeftBtn = document.getElementById('slideLeft');
    const slideRightBtn = document.getElementById('slideRight');
    const graphicSlider = document.getElementById('graphicSlider');

    if(slideLeftBtn && slideRightBtn && graphicSlider) {
        let scrollAmount = 0;
        
        slideLeftBtn.addEventListener('click', () => {
            const card = graphicSlider.querySelector('.snap-center');
            const cardWidth = card ? card.offsetWidth : 300;
            graphicSlider.scrollLeft -= (cardWidth + 24);
        });

        slideRightBtn.addEventListener('click', () => {
             const card = graphicSlider.querySelector('.snap-center');
             const cardWidth = card ? card.offsetWidth : 300;
             graphicSlider.scrollLeft += (cardWidth + 24);
        });
    }
});
