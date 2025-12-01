// Initialize Lucide Icons
lucide.createIcons();

// Mobile Menu Toggle
const btn = document.getElementById('mobile-menu-btn');
const menu = document.getElementById('mobile-menu');

if (btn && menu) {
    btn.addEventListener('click', () => {
        menu.classList.toggle('hidden');
    });
}

// Typewriter Effect
const textElement = document.getElementById('typewriter');
const texts = ["MACHINE LEARNING", "RETROFUTURISMO", "FULL STACK DEV", "CYBERPUNK AI"];
let textIndex = 0;
let charIndex = 0;
let isDeleting = false;
let typeSpeed = 100;

function type() {
    const currentText = texts[textIndex];
    
    if (isDeleting) {
        textElement.textContent = currentText.substring(0, charIndex - 1);
        charIndex--;
        typeSpeed = 50; // Faster when deleting
    } else {
        textElement.textContent = currentText.substring(0, charIndex + 1);
        charIndex++;
        typeSpeed = 100; // Normal typing speed
    }

    if (!isDeleting && charIndex === currentText.length) {
        isDeleting = true;
        typeSpeed = 2000; // Pause at end
    } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        textIndex = (textIndex + 1) % texts.length;
        typeSpeed = 500; // Pause before new word
    }

    setTimeout(type, typeSpeed);
}

// Start typewriter if element exists
if (textElement) {
    type();
}
