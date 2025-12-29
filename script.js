// Initialize Lucide Icons
lucide.createIcons();

// --- 3D TILT EFFECT ---
class TiltEffect {
    constructor() {
        this.cards = document.querySelectorAll('.tilt-card');
        this.init();
    }

    init() {
        this.cards.forEach(card => {
            card.addEventListener('mousemove', (e) => this.handleMouseMove(e, card));
            card.addEventListener('mouseleave', () => this.handleMouseLeave(card));
        });
    }

    handleMouseMove(e, card) {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -10;
        const rotateY = ((x - centerX) / centerX) * 10;

        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    }

    handleMouseLeave(card) {
        card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
    }
}

// --- ANTIGRAVITY REPULSOR EFFECT ---
class AntigravityEffect {
    constructor() {
        this.canvas = document.getElementById('hero-canvas');
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.resize();

        this.config = {
            spacing: 50, // Much wider spacing for cleaner look
            mouseRadius: 250, // Larger void
            repulsionStrength: 3000,
            springStrength: 0.05, // Slower, more graceful return
            friction: 0.92,
            dashLength: 4, // Smaller dashes
            dashWidth: 2,
            color: '#6366f1'
        };

        this.mouse = { x: -1000, y: -1000 }; // Start off-screen

        this.init();
    }

    init() {
        this.createParticlesGrid();
        this.addEventListeners();
        this.animate();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    createParticlesGrid() {
        this.particles = [];

        // Create a grid of particles covering the screen
        const cols = Math.ceil(this.canvas.width / this.config.spacing);
        const rows = Math.ceil(this.canvas.height / this.config.spacing);

        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
                // Randomize position slightly for organic feel
                const x = (i * this.config.spacing) + (Math.random() * 10 - 5);
                const y = (j * this.config.spacing) + (Math.random() * 10 - 5);

                this.particles.push(new DashParticle(x, y));
            }
        }
    }

    addEventListeners() {
        window.addEventListener('resize', () => {
            this.resize();
            this.createParticlesGrid();
        });

        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });

        window.addEventListener('mouseleave', () => {
            this.mouse.x = -1000;
            this.mouse.y = -1000;
        });
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.particles.forEach(p => {
            p.update(this.mouse, this.config);
            p.draw(this.ctx, this.config);
        });

        requestAnimationFrame(() => this.animate());
    }

    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }
}

class DashParticle {
    constructor(x, y) {
        this.originX = x;
        this.originY = y;
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        // Random slight angle variation for the dash itself
        this.angle = Math.random() * Math.PI;
    }

    update(mouse, config) {
        // 1. Calculate distance to mouse
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // 2. Repulsion Force (Antigravity)
        if (dist < config.mouseRadius) {
            const force = (config.mouseRadius - dist) / config.mouseRadius; // 0 to 1
            const repulsionX = -(dx / dist) * force * 5; // Push away
            const repulsionY = -(dy / dist) * force * 5;

            this.vx += repulsionX;
            this.vy += repulsionY;
        }

        // 3. Spring Force (Return to Origin)
        const springX = (this.originX - this.x) * config.springStrength;
        const springY = (this.originY - this.y) * config.springStrength;

        this.vx += springX;
        this.vy += springY;

        // 4. Physics application
        this.vx *= config.friction;
        this.vy *= config.friction;

        this.x += this.vx;
        this.y += this.vy;

        // Update angle based on velocity for dynamic look
        if (Math.abs(this.vx) > 0.1 || Math.abs(this.vy) > 0.1) {
            this.angle = Math.atan2(this.vy, this.vx);
        }
    }

    draw(ctx, config) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Draw the dash (pill shape)
        ctx.fillStyle = config.color;

        // Opacity based on displacement (optional, but looks nice if they fade a bit when idle)
        ctx.globalAlpha = 0.4; // Increased visibility as requested

        ctx.beginPath();
        // Rounded rectangle logic
        ctx.roundRect(-config.dashLength / 2, -config.dashWidth / 2, config.dashLength, config.dashWidth, 1);
        ctx.fill();

        ctx.restore();
    }
}

// Start everything when DOM is ready
// --- THEME MANAGER ---
class ThemeManager {
    constructor(antigravityEffect) {
        this.toggleBtn = document.getElementById('theme-toggle');
        this.html = document.documentElement;
        this.antigravity = antigravityEffect;

        // Check local storage or system preference
        const savedTheme = localStorage.getItem('theme');
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        this.currentTheme = savedTheme || (systemDark ? 'dark' : 'light');

        this.init();
    }

    init() {
        this.applyTheme(this.currentTheme);

        if (this.toggleBtn) {
            this.toggleBtn.addEventListener('click', () => {
                this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
                this.applyTheme(this.currentTheme);
            });
        }
    }

    applyTheme(theme) {
        this.html.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);

        // Update Icon
        if (this.toggleBtn) {
            const sunIcon = '<i data-lucide="sun" class="h-5 w-5"></i>';
            const moonIcon = '<i data-lucide="moon" class="h-5 w-5"></i>';
            this.toggleBtn.innerHTML = theme === 'dark' ? sunIcon : moonIcon;
            lucide.createIcons();
        }

        // Update Particles
        if (this.antigravity) {
            const particleColor = theme === 'dark' ? '#6366f1' : '#4f46e5';
            this.antigravity.updateConfig({ color: particleColor });
        }
    }
}

// Start everything when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new TiltEffect();
    const antigravity = new AntigravityEffect();
    new ThemeManager(antigravity);
});
