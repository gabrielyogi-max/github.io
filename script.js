class ThemeController {
    constructor() {
        this.root = document.documentElement;
        this.button = document.getElementById('theme-toggle');
        this.media = window.matchMedia('(prefers-color-scheme: light)');
        this.syncButton();
        this.bind();
    }

    bind() {
        if (!this.button) return;

        this.button.addEventListener('click', () => {
            const nextTheme = this.root.dataset.theme === 'dark' ? 'light' : 'dark';
            this.apply(nextTheme, true);
        });
    }

    apply(theme, persist = false) {
        this.root.dataset.theme = theme;

        if (persist) {
            try {
                localStorage.setItem('theme', theme);
            } catch (_) {
                // The selected theme still works when storage is unavailable.
            }
        }

        this.syncButton();
        window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
    }

    syncButton() {
        if (!this.button) return;
        const isDark = this.root.dataset.theme === 'dark';
        this.button.setAttribute('aria-label', isDark ? 'Ativar tema claro' : 'Ativar tema escuro');
        this.button.setAttribute('title', isDark ? 'Ativar tema claro' : 'Ativar tema escuro');
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

        if (!this.toggle || !this.menu) return;

        this.toggle.addEventListener('click', () => {
            const shouldOpen = this.toggle.getAttribute('aria-expanded') !== 'true';
            shouldOpen ? this.open() : this.close();
        });

        this.links.forEach((link) => link.addEventListener('click', this.close));

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') this.close();
        });

        window.addEventListener('resize', () => {
            if (window.innerWidth > 820) this.close();
        });
    }

    onScroll() {
        this.header?.classList.toggle('is-scrolled', window.scrollY > 18);
    }

    open() {
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
        this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.init();
    }

    init() {
        if (!this.items.length) return;

        if (this.reducedMotion || !('IntersectionObserver' in window)) {
            this.items.forEach((item) => item.classList.add('is-visible'));
            return;
        }

        this.observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;
                    entry.target.classList.add('is-visible');
                    this.observer.unobserve(entry.target);
                });
            },
            { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
        );

        this.items.forEach((item) => this.observer.observe(item));
    }
}

class CardSpotlight {
    constructor() {
        this.cards = [...document.querySelectorAll('.spotlight-card')];
        this.supportsFinePointer = window.matchMedia('(pointer: fine)').matches;
        this.init();
    }

    init() {
        if (!this.supportsFinePointer) return;

        this.cards.forEach((card) => {
            card.addEventListener('pointermove', (event) => {
                const rect = card.getBoundingClientRect();
                card.style.setProperty('--spot-x', `${event.clientX - rect.left}px`);
                card.style.setProperty('--spot-y', `${event.clientY - rect.top}px`);
            });
        });
    }
}

class GpuMesh {
    constructor() {
        this.container = document.getElementById('gpu-mesh');
        this.hero = document.querySelector('.hero');
        if (!this.container || !this.hero) return;

        this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.pointer = { x: 0, y: 0 };
        this.targetPointer = { x: 0, y: 0 };
        this.isVisible = true;
        this.frame = null;

        this.resize = this.resize.bind(this);
        this.animate = this.animate.bind(this);
        this.init();
    }

    async init() {
        try {
            const THREE = await import('https://cdn.jsdelivr.net/npm/three@0.167.0/build/three.module.js');
            this.THREE = THREE;
            this.clock = new THREE.Clock();
            this.scene = new THREE.Scene();
            this.camera = new THREE.PerspectiveCamera(58, 1, 0.1, 100);
            this.camera.position.set(0, 1, 25);

            this.renderer = new THREE.WebGLRenderer({
                antialias: true,
                alpha: true,
                powerPreference: 'high-performance'
            });
            this.renderer.setClearColor(0x000000, 0);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
            this.renderer.outputColorSpace = THREE.SRGBColorSpace;
            this.container.appendChild(this.renderer.domElement);

            this.createMesh();
            this.updateColors(document.documentElement.dataset.theme);
            this.resize();
            this.bind();
            this.renderFrame(0);

            if (!this.reducedMotion) {
                this.frame = requestAnimationFrame(this.animate);
            }
        } catch (error) {
            this.container.classList.add('gpu-unavailable');
            console.info('GPU mesh unavailable; keeping the 2D systems canvas as fallback.', error);
        }
    }

    createMesh() {
        const THREE = this.THREE;
        const geometry = new THREE.PlaneGeometry(72, 54, 64, 48);
        const material = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uMouse: { value: new THREE.Vector2(0, 0) },
                uColorA: { value: new THREE.Color(0xa7ff4f) },
                uColorB: { value: new THREE.Color(0x9d7cff) },
                uColorC: { value: new THREE.Color(0x5ab7ff) },
                uOpacity: { value: 0.24 }
            },
            vertexShader: `
                uniform float uTime;
                uniform vec2 uMouse;
                varying vec2 vUv;
                varying float vElevation;

                void main() {
                    vUv = uv;
                    vec3 transformed = position;

                    float broadWave = sin(transformed.x * 0.21 + uTime * 0.42) * 2.2;
                    float crossWave = cos(transformed.y * 0.27 - uTime * 0.31) * 1.7;
                    float diagonalWave = sin((transformed.x + transformed.y) * 0.16 + uTime * 0.24) * 1.25;
                    float pointerDistance = distance(transformed.xy * 0.04, uMouse);
                    float pointerWave = exp(-pointerDistance * 2.4) * 2.8;

                    transformed.z = broadWave + crossWave + diagonalWave + pointerWave;
                    vElevation = transformed.z;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 uColorA;
                uniform vec3 uColorB;
                uniform vec3 uColorC;
                uniform float uOpacity;
                varying vec2 vUv;
                varying float vElevation;

                void main() {
                    vec3 horizontal = mix(uColorA, uColorB, smoothstep(0.05, 0.95, vUv.x));
                    vec3 color = mix(horizontal, uColorC, vUv.y * 0.48);
                    color = mix(color, uColorA, smoothstep(-4.0, 5.0, vElevation) * 0.26);

                    float edgeX = smoothstep(0.0, 0.16, vUv.x) * smoothstep(1.0, 0.84, vUv.x);
                    float edgeY = smoothstep(0.0, 0.14, vUv.y) * smoothstep(1.0, 0.86, vUv.y);
                    gl_FragColor = vec4(color, uOpacity * edgeX * edgeY);
                }
            `,
            transparent: true,
            wireframe: true,
            side: THREE.DoubleSide,
            depthWrite: false
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.rotation.x = -Math.PI * 0.39;
        this.mesh.rotation.z = -0.08;
        this.mesh.position.set(10, -12, -5);
        this.scene.add(this.mesh);
    }

    bind() {
        window.addEventListener('resize', this.resize, { passive: true });

        this.hero.addEventListener('pointermove', (event) => {
            const rect = this.hero.getBoundingClientRect();
            this.targetPointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            this.targetPointer.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
        });

        this.hero.addEventListener('pointerleave', () => {
            this.targetPointer.x = 0;
            this.targetPointer.y = 0;
        });

        window.addEventListener('themechange', (event) => {
            this.updateColors(event.detail.theme);
            if (this.reducedMotion) this.renderFrame(0);
        });

        document.addEventListener('visibilitychange', () => {
            this.isVisible = !document.hidden;
            if (this.isVisible && !this.reducedMotion && !this.frame) {
                this.clock.getDelta();
                this.frame = requestAnimationFrame(this.animate);
            }
        });

        if ('IntersectionObserver' in window) {
            this.visibilityObserver = new IntersectionObserver(
                ([entry]) => {
                    this.isVisible = entry.isIntersecting && !document.hidden;
                    if (this.isVisible && !this.reducedMotion && !this.frame) {
                        this.clock.getDelta();
                        this.frame = requestAnimationFrame(this.animate);
                    }
                },
                { threshold: 0.02 }
            );
            this.visibilityObserver.observe(this.hero);
        }
    }

    resize() {
        if (!this.renderer || !this.camera) return;
        const rect = this.hero.getBoundingClientRect();
        const width = Math.max(1, Math.round(rect.width));
        const height = Math.max(1, Math.round(rect.height));
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height, false);
        if (this.reducedMotion) this.renderFrame(0);
    }

    updateColors(theme) {
        if (!this.mesh || !this.THREE) return;
        const isLight = theme === 'light';
        const uniforms = this.mesh.material.uniforms;
        uniforms.uColorA.value.setHex(isLight ? 0x4b8f08 : 0xa7ff4f);
        uniforms.uColorB.value.setHex(isLight ? 0x694ad6 : 0x9d7cff);
        uniforms.uColorC.value.setHex(isLight ? 0x1673ba : 0x5ab7ff);
        uniforms.uOpacity.value = isLight ? 0.16 : 0.25;
    }

    renderFrame(time) {
        if (!this.renderer || !this.mesh) return;
        const uniforms = this.mesh.material.uniforms;
        uniforms.uTime.value = time;
        uniforms.uMouse.value.set(this.pointer.x, this.pointer.y);
        this.renderer.render(this.scene, this.camera);
    }

    animate() {
        this.frame = null;
        if (!this.isVisible) return;

        this.pointer.x += (this.targetPointer.x - this.pointer.x) * 0.045;
        this.pointer.y += (this.targetPointer.y - this.pointer.y) * 0.045;

        const time = this.clock.getElapsedTime();
        this.mesh.rotation.z = -0.08 + this.pointer.x * 0.045;
        this.camera.position.x = this.pointer.x * 1.4;
        this.camera.position.y = 1 + this.pointer.y * 0.8;
        this.renderFrame(time);
        this.frame = requestAnimationFrame(this.animate);
    }
}

class SystemsCanvas {
    constructor() {
        this.canvas = document.getElementById('systems-canvas');
        this.hero = document.querySelector('.hero');
        if (!this.canvas || !this.hero) return;

        this.context = this.canvas.getContext('2d');
        this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.pointer = { x: 0, y: 0, active: false };
        this.nodes = [];
        this.frame = null;
        this.lastWidth = 0;
        this.lastHeight = 0;
        this.isVisible = true;

        this.resize = this.resize.bind(this);
        this.draw = this.draw.bind(this);
        this.init();
    }

    init() {
        this.resize();
        this.readColors();

        window.addEventListener('resize', this.resize, { passive: true });
        window.addEventListener('themechange', () => {
            this.readColors();
            if (this.reducedMotion) this.drawStatic();
        });

        this.hero.addEventListener('pointermove', (event) => {
            const rect = this.canvas.getBoundingClientRect();
            this.pointer.x = event.clientX - rect.left;
            this.pointer.y = event.clientY - rect.top;
            this.pointer.active = true;
        });

        this.hero.addEventListener('pointerleave', () => {
            this.pointer.active = false;
        });

        document.addEventListener('visibilitychange', () => {
            this.isVisible = !document.hidden;
            if (this.isVisible && !this.reducedMotion && !this.frame) {
                this.frame = requestAnimationFrame(this.draw);
            }
        });

        if (this.reducedMotion) {
            this.drawStatic();
        } else {
            this.frame = requestAnimationFrame(this.draw);
        }
    }

    readColors() {
        const styles = getComputedStyle(document.documentElement);
        const accent = styles.getPropertyValue('--accent-rgb').trim() || '167, 255, 79';
        const isLight = document.documentElement.dataset.theme === 'light';
        this.nodeColor = `rgba(${accent}, ${isLight ? 0.55 : 0.68})`;
        this.lineColor = `rgba(${accent}, ${isLight ? 0.1 : 0.12})`;
        this.pointerColor = `rgba(${accent}, ${isLight ? 0.22 : 0.28})`;
    }

    resize() {
        const rect = this.hero.getBoundingClientRect();
        const width = Math.max(1, Math.round(rect.width));
        const height = Math.max(1, Math.round(rect.height));
        const dpr = Math.min(window.devicePixelRatio || 1, 2);

        this.canvas.width = Math.round(width * dpr);
        this.canvas.height = Math.round(height * dpr);
        this.canvas.style.width = `${width}px`;
        this.canvas.style.height = `${height}px`;
        this.context.setTransform(dpr, 0, 0, dpr, 0, 0);

        if (!this.nodes.length || Math.abs(width - this.lastWidth) > 120) {
            this.createNodes(width, height);
        } else {
            const scaleX = width / this.lastWidth;
            const scaleY = height / this.lastHeight;
            this.nodes.forEach((node) => {
                node.x *= scaleX;
                node.y *= scaleY;
            });
        }

        this.width = width;
        this.height = height;
        this.lastWidth = width;
        this.lastHeight = height;

        if (this.reducedMotion) this.drawStatic();
    }

    createNodes(width, height) {
        const count = width < 700 ? 28 : Math.min(62, Math.round(width / 24));
        this.nodes = Array.from({ length: count }, () => ({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.16,
            vy: (Math.random() - 0.5) * 0.16,
            radius: Math.random() * 1.3 + 0.55
        }));
    }

    updateNodes() {
        this.nodes.forEach((node) => {
            node.x += node.vx;
            node.y += node.vy;

            if (node.x < -20) node.x = this.width + 20;
            if (node.x > this.width + 20) node.x = -20;
            if (node.y < -20) node.y = this.height + 20;
            if (node.y > this.height + 20) node.y = -20;

            if (this.pointer.active) {
                const dx = this.pointer.x - node.x;
                const dy = this.pointer.y - node.y;
                const distance = Math.hypot(dx, dy);

                if (distance < 160 && distance > 0) {
                    const pull = (160 - distance) / 16000;
                    node.x += dx * pull;
                    node.y += dy * pull;
                }
            }
        });
    }

    render() {
        this.context.clearRect(0, 0, this.width, this.height);

        for (let i = 0; i < this.nodes.length; i += 1) {
            const node = this.nodes[i];

            for (let j = i + 1; j < this.nodes.length; j += 1) {
                const other = this.nodes[j];
                const dx = node.x - other.x;
                const dy = node.y - other.y;
                const distance = Math.hypot(dx, dy);

                if (distance > 145) continue;
                this.context.globalAlpha = 1 - distance / 145;
                this.context.strokeStyle = this.lineColor;
                this.context.lineWidth = 1;
                this.context.beginPath();
                this.context.moveTo(node.x, node.y);
                this.context.lineTo(other.x, other.y);
                this.context.stroke();
            }

            this.context.globalAlpha = 1;
            this.context.fillStyle = this.nodeColor;
            this.context.beginPath();
            this.context.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
            this.context.fill();
        }

        if (this.pointer.active) {
            const gradient = this.context.createRadialGradient(
                this.pointer.x,
                this.pointer.y,
                0,
                this.pointer.x,
                this.pointer.y,
                120
            );
            gradient.addColorStop(0, this.pointerColor);
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            this.context.fillStyle = gradient;
            this.context.beginPath();
            this.context.arc(this.pointer.x, this.pointer.y, 120, 0, Math.PI * 2);
            this.context.fill();
        }

        this.context.globalAlpha = 1;
    }

    draw() {
        this.frame = null;
        if (!this.isVisible) return;
        this.updateNodes();
        this.render();
        this.frame = requestAnimationFrame(this.draw);
    }

    drawStatic() {
        if (!this.context || !this.width || !this.height) return;
        this.render();
    }
}

function initializePortfolio() {
    window.lucide?.createIcons();
    new ThemeController();
    new NavigationController();
    new RevealController();
    new CardSpotlight();
    new GpuMesh();
    new SystemsCanvas();

    const year = document.getElementById('current-year');
    if (year) year.textContent = String(new Date().getFullYear());
}

document.addEventListener('DOMContentLoaded', initializePortfolio);
