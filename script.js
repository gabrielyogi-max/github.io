class ThemeController {
    constructor() {
        this.root = document.documentElement;
        this.button = document.getElementById('theme-toggle');
        this.syncButton();
        this.button?.addEventListener('click', () => this.toggle());
    }

    toggle() {
        const theme = this.root.dataset.theme === 'dark' ? 'light' : 'dark';
        this.root.dataset.theme = theme;

        try {
            localStorage.setItem('theme', theme);
        } catch (_) {
            // Theme switching remains available when storage is unavailable.
        }

        this.syncButton();
    }

    syncButton() {
        if (!this.button) return;
        const isDark = this.root.dataset.theme === 'dark';
        const label = isDark ? 'Ativar tema claro' : 'Ativar tema escuro';
        this.button.setAttribute('aria-label', label);
        this.button.setAttribute('title', label);
    }
}

class NavigationController {
    constructor() {
        this.header = document.getElementById('site-header');
        this.toggle = document.getElementById('menu-toggle');
        this.menu = document.getElementById('mobile-menu');
        this.links = this.menu ? [...this.menu.querySelectorAll('a')] : [];

        this.onScroll = this.onScroll.bind(this);
        this.close = this.close.bind(this);
        this.bind();
        this.onScroll();
    }

    bind() {
        window.addEventListener('scroll', this.onScroll, { passive: true });

        this.toggle?.addEventListener('click', () => {
            const shouldOpen = this.toggle.getAttribute('aria-expanded') !== 'true';
            shouldOpen ? this.open() : this.close();
        });

        this.links.forEach((link) => link.addEventListener('click', this.close));
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') this.close();
        });
        window.addEventListener('resize', () => {
            if (window.innerWidth > 820) this.close();
        }, { passive: true });
    }

    onScroll() {
        this.header?.classList.toggle('is-scrolled', window.scrollY > 18);
    }

    open() {
        if (!this.toggle || !this.menu) return;
        this.menu.hidden = false;
        this.toggle.setAttribute('aria-expanded', 'true');
        this.toggle.setAttribute('aria-label', 'Fechar menu');
        this.toggle.innerHTML = '<i data-lucide="x" aria-hidden="true"></i>';
        this.header?.classList.add('menu-active');
        document.body.classList.add('menu-open');
        window.lucide?.createIcons({ nodes: [this.toggle] });
    }

    close() {
        if (!this.toggle || !this.menu) return;
        this.menu.hidden = true;
        this.toggle.setAttribute('aria-expanded', 'false');
        this.toggle.setAttribute('aria-label', 'Abrir menu');
        this.toggle.innerHTML = '<i data-lucide="menu" aria-hidden="true"></i>';
        this.header?.classList.remove('menu-active');
        document.body.classList.remove('menu-open');
        window.lucide?.createIcons({ nodes: [this.toggle] });
    }
}

class RevealController {
    constructor() {
        this.items = [...document.querySelectorAll('.reveal')];
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (reducedMotion || !('IntersectionObserver' in window)) {
            this.items.forEach((item) => item.classList.add('is-visible'));
            return;
        }

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-visible');
                this.observer.unobserve(entry.target);
            });
        }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });

        this.items.forEach((item) => this.observer.observe(item));
    }
}

function initializePortfolio() {
    window.lucide?.createIcons();
    new ThemeController();
    new NavigationController();
    new RevealController();

    const year = document.getElementById('current-year');
    if (year) year.textContent = String(new Date().getFullYear());
}

document.addEventListener('DOMContentLoaded', initializePortfolio);
