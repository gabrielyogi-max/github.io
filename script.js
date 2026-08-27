class ThemeController {
    constructor() {
        this.root = document.documentElement;
        this.button = document.getElementById('theme-toggle');
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
                // Theme selection still works when storage is unavailable.
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

class NeuralHorizon {
    constructor() {
        this.container = document.getElementById('gpu-mesh');
        this.hero = document.querySelector('.hero');
        this.status = document.getElementById('renderer-status');
        if (!this.container || !this.hero) return;

        this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.pointer = { x: 0, y: 0 };
        this.targetPointer = { x: 0, y: 0 };
        this.isVisible = true;
        this.frame = null;
        this.lastFrame = 0;
        this.startTime = performance.now();
        this.isMobile = window.matchMedia('(max-width: 600px)').matches;
        this.frameInterval = 1000 / (this.isMobile ? 36 : 50);

        this.resize = this.resize.bind(this);
        this.animate = this.animate.bind(this);
        this.init();
    }

    init() {
        this.canvas = document.createElement('canvas');
        this.canvas.setAttribute('aria-hidden', 'true');
        this.container.appendChild(this.canvas);

        this.gl = this.canvas.getContext('webgl2', {
            alpha: true,
            antialias: false,
            depth: false,
            stencil: false,
            premultipliedAlpha: false,
            preserveDrawingBuffer: false,
            powerPreference: 'high-performance'
        });

        if (!this.gl) {
            this.activateFallback();
            return;
        }

        try {
            this.program = this.createProgram();
            this.uniforms = {
                resolution: this.gl.getUniformLocation(this.program, 'uResolution'),
                pointer: this.gl.getUniformLocation(this.program, 'uPointer'),
                time: this.gl.getUniformLocation(this.program, 'uTime'),
                accent: this.gl.getUniformLocation(this.program, 'uAccent'),
                violet: this.gl.getUniformLocation(this.program, 'uViolet'),
                blue: this.gl.getUniformLocation(this.program, 'uBlue'),
                light: this.gl.getUniformLocation(this.program, 'uLight')
            };

            this.gl.useProgram(this.program);
            this.setTheme(document.documentElement.dataset.theme);
            this.resize();
            this.bind();
            this.updateStatus('WEBGL2 / 1 PASS');
            this.render(12);

            if (!this.reducedMotion) {
                this.frame = requestAnimationFrame(this.animate);
            }
        } catch (error) {
            console.info('Neural Horizon unavailable; using the static fallback.', error);
            this.activateFallback();
        }
    }

    createProgram() {
        const vertexSource = `#version 300 es
            precision highp float;
            out vec2 vUv;

            void main() {
                vec2 positions[3] = vec2[3](
                    vec2(-1.0, -1.0),
                    vec2(3.0, -1.0),
                    vec2(-1.0, 3.0)
                );
                vec2 position = positions[gl_VertexID];
                vUv = position * 0.5 + 0.5;
                gl_Position = vec4(position, 0.0, 1.0);
            }
        `;

        const fragmentSource = `#version 300 es
            precision highp float;

            in vec2 vUv;
            out vec4 outColor;

            uniform vec2 uResolution;
            uniform vec2 uPointer;
            uniform float uTime;
            uniform vec3 uAccent;
            uniform vec3 uViolet;
            uniform vec3 uBlue;
            uniform float uLight;

            float hash21(vec2 value) {
                value = fract(value * vec2(123.34, 456.21));
                value += dot(value, value + 45.32);
                return fract(value.x * value.y);
            }

            float coreLine(float distanceToLine, float width) {
                float antialiasWidth = fwidth(distanceToLine) * 1.35;
                return 1.0 - smoothstep(width, width + antialiasWidth, abs(distanceToLine));
            }

            void main() {
                vec2 fragment = vUv * uResolution;
                float aspect = uResolution.x / uResolution.y;
                vec2 point = (fragment - 0.5 * uResolution) / uResolution.y;
                point += vec2(-uPointer.x * 0.025, -uPointer.y * 0.014);

                float time = uTime;
                vec3 color = vec3(0.0);
                float energy = 0.0;

                float edgeFade = 1.0 - smoothstep(0.62, 1.08, abs(point.x));
                float lowerField = 1.0 - smoothstep(-0.02, 0.31, point.y);
                float contentProtection = mix(0.18, 1.0, smoothstep(-0.52, 0.04, point.x));

                float flow =
                    sin(point.x * 2.15 + time * 0.24) +
                    sin(point.x * 4.4 - time * 0.17) * 0.42 +
                    cos(point.x * 7.1 + time * 0.11) * 0.18;
                float auroraDistance = point.y + 0.15 - flow * 0.043;
                float aurora = exp(-abs(auroraDistance) * 8.5) * lowerField * edgeFade;
                vec3 auroraColor = mix(uBlue, uViolet, 0.5 + 0.5 * sin(point.x * 1.2 + time * 0.08));
                color += auroraColor * aurora * 0.72 * mix(0.48, 1.0, contentProtection);
                energy += aurora * 0.52;

                for (int index = 0; index < 8; index++) {
                    float layer = float(index);
                    float baseHeight = -0.39 + layer * 0.062;
                    float curve =
                        sin(point.x * (1.7 + layer * 0.055) + time * 0.21 + layer * 0.76) * (0.026 + layer * 0.0018) +
                        cos(point.x * 3.45 - time * 0.13 + layer * 0.48) * 0.011 +
                        point.x * point.x * (0.035 + layer * 0.003);
                    float distanceToFilament = point.y - (baseHeight + curve);
                    float core = coreLine(distanceToFilament, 0.0012);
                    float glow = 0.0028 / (abs(distanceToFilament) + 0.0028);
                    float filament = (core * 0.9 + glow * 0.2) * lowerField * edgeFade;

                    float pulsePosition = fract(time * 0.055 + layer * 0.137) * 1.9 - 0.95;
                    float pulse = exp(-pow((point.x - pulsePosition) * 17.0, 2.0)) * glow * 1.45;
                    vec3 layerColor = mix(uAccent, mix(uBlue, uViolet, layer / 7.0), 0.5);

                    color += layerColor * (filament * 1.28 + pulse * 1.08) * lowerField * contentProtection;
                    energy += filament * 0.78 + pulse * 0.48;
                }

                vec2 portalCenter = vec2(0.43 * aspect, 0.065) + uPointer * vec2(0.022, 0.012);
                vec2 portalVector = point - portalCenter;
                float portalRadius = length(portalVector * vec2(1.0, 1.08));
                float portalAngle = atan(portalVector.y, portalVector.x);

                float firstRingTarget = 0.31 + sin(portalAngle * 6.0 - time * 0.31) * 0.009;
                float secondRingTarget = 0.395 + cos(portalAngle * 9.0 + time * 0.22) * 0.006;
                float firstRingDistance = portalRadius - firstRingTarget;
                float secondRingDistance = portalRadius - secondRingTarget;
                float firstRing = coreLine(firstRingDistance, 0.0014) + 0.0023 / (abs(firstRingDistance) + 0.0023);
                float secondRing = coreLine(secondRingDistance, 0.0011) + 0.0018 / (abs(secondRingDistance) + 0.0018);
                float portalFade = smoothstep(0.58, 0.2, portalRadius);

                float spokes = pow(max(0.0, cos(portalAngle * 18.0 - time * 0.46)), 30.0);
                spokes *= smoothstep(0.41, 0.27, portalRadius) * smoothstep(0.16, 0.25, portalRadius);

                color += uAccent * firstRing * 0.55;
                color += uBlue * secondRing * 0.42;
                color += mix(uViolet, uBlue, 0.5) * spokes * 0.7;
                energy += (firstRing * 0.26 + secondRing * 0.2 + spokes * 0.36) * portalFade;

                vec2 starGrid = (point + vec2(1.4, 0.9)) * vec2(20.0, 23.0);
                vec2 starCell = floor(starGrid);
                vec2 starLocal = fract(starGrid) - 0.5;
                float randomValue = hash21(starCell);
                float starShape = 1.0 - smoothstep(0.018, 0.075, length(starLocal));
                float starGate = step(0.925, randomValue);
                float twinkle = 0.42 + 0.58 * sin(time * (0.7 + randomValue) + randomValue * 25.0);
                float stars = starShape * starGate * twinkle;
                color += mix(uAccent, uBlue, randomValue) * stars * 0.95;
                energy += stars * 0.48;

                vec2 cursor = vec2(uPointer.x * aspect * 0.5, uPointer.y * 0.5);
                float cursorGlow = exp(-dot(point - cursor, point - cursor) * 8.0);
                color += uAccent * cursorGlow * 0.16;
                energy += cursorGlow * 0.11;

                float vignette = 1.0 - smoothstep(0.45, 1.12, length(point * vec2(0.72, 1.0)));
                color *= vignette;
                energy *= vignette;

                color *= 1.65;
                color = color / (vec3(1.0) + color);
                color = pow(max(color, vec3(0.0)), vec3(0.86));

                float themeScale = mix(1.22, 0.76, uLight);
                float alphaLimit = mix(0.84, 0.52, uLight);
                float alpha = clamp(energy * themeScale, 0.0, alphaLimit);
                outColor = vec4(color, alpha);
            }
        `;

        const vertexShader = this.compileShader(this.gl.VERTEX_SHADER, vertexSource);
        const fragmentShader = this.compileShader(this.gl.FRAGMENT_SHADER, fragmentSource);
        const program = this.gl.createProgram();
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);

        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            const message = this.gl.getProgramInfoLog(program);
            this.gl.deleteProgram(program);
            throw new Error(`Neural Horizon program link failed: ${message}`);
        }

        this.gl.deleteShader(vertexShader);
        this.gl.deleteShader(fragmentShader);
        return program;
    }

    compileShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);

        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            const message = this.gl.getShaderInfoLog(shader);
            this.gl.deleteShader(shader);
            throw new Error(`Neural Horizon shader compilation failed: ${message}`);
        }

        return shader;
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
            this.setTheme(event.detail.theme);
            if (this.reducedMotion) this.render(12);
        });

        document.addEventListener('visibilitychange', () => {
            this.isVisible = !document.hidden;
            if (this.isVisible) this.requestFrame();
        });

        this.canvas.addEventListener('webglcontextlost', (event) => {
            event.preventDefault();
            if (this.frame) cancelAnimationFrame(this.frame);
            this.frame = null;
            this.updateStatus('GPU FIELD / PAUSED');
        });

        if ('IntersectionObserver' in window) {
            this.visibilityObserver = new IntersectionObserver(
                ([entry]) => {
                    this.isVisible = entry.isIntersecting && !document.hidden;
                    if (this.isVisible) this.requestFrame();
                },
                { threshold: 0.02 }
            );
            this.visibilityObserver.observe(this.hero);
        }
    }

    resize() {
        if (!this.gl) return;

        const rect = this.hero.getBoundingClientRect();
        const width = Math.max(1, Math.round(rect.width));
        const height = Math.max(1, Math.round(rect.height));
        const mobile = width < 600;
        const memory = navigator.deviceMemory || 8;
        let renderScale = mobile ? 0.52 : width < 1050 ? 0.6 : 0.68;
        if (memory <= 4) renderScale -= 0.08;

        this.isMobile = mobile;
        this.frameInterval = 1000 / (mobile ? 36 : 50);
        this.canvas.width = Math.min(1280, Math.max(1, Math.round(width * renderScale)));
        this.canvas.height = Math.min(800, Math.max(1, Math.round(height * renderScale)));
        this.canvas.style.width = `${width}px`;
        this.canvas.style.height = `${height}px`;
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        this.gl.useProgram(this.program);
        this.gl.uniform2f(this.uniforms.resolution, this.canvas.width, this.canvas.height);

        if (this.reducedMotion) this.render(12);
    }

    setTheme(theme) {
        if (!this.gl || !this.program) return;

        const isLight = theme === 'light';
        const accent = isLight ? [0.294, 0.561, 0.031] : [0.655, 1.0, 0.31];
        const violet = isLight ? [0.412, 0.29, 0.839] : [0.616, 0.486, 1.0];
        const blue = isLight ? [0.086, 0.451, 0.729] : [0.353, 0.718, 1.0];

        this.gl.useProgram(this.program);
        this.gl.uniform3fv(this.uniforms.accent, accent);
        this.gl.uniform3fv(this.uniforms.violet, violet);
        this.gl.uniform3fv(this.uniforms.blue, blue);
        this.gl.uniform1f(this.uniforms.light, isLight ? 1 : 0);
    }

    render(time) {
        if (!this.gl || !this.program) return;

        this.gl.clearColor(0, 0, 0, 0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        this.gl.useProgram(this.program);
        this.gl.uniform1f(this.uniforms.time, time);
        this.gl.uniform2f(this.uniforms.pointer, this.pointer.x, this.pointer.y);
        this.gl.drawArrays(this.gl.TRIANGLES, 0, 3);
    }

    animate(now) {
        this.frame = null;
        if (!this.isVisible || this.reducedMotion) return;

        if (now - this.lastFrame < this.frameInterval) {
            this.requestFrame();
            return;
        }

        this.lastFrame = now;
        this.pointer.x += (this.targetPointer.x - this.pointer.x) * 0.055;
        this.pointer.y += (this.targetPointer.y - this.pointer.y) * 0.055;
        this.render((now - this.startTime) / 1000);
        this.requestFrame();
    }

    requestFrame() {
        if (!this.frame && this.isVisible && !this.reducedMotion) {
            this.frame = requestAnimationFrame(this.animate);
        }
    }

    activateFallback() {
        this.container.classList.add('gpu-unavailable');
        this.canvas?.remove();
        this.updateStatus('STATIC FIELD / FALLBACK');
    }

    updateStatus(message) {
        if (this.status) this.status.textContent = message;
    }
}

function initializePortfolio() {
    window.lucide?.createIcons();
    new ThemeController();
    new NavigationController();
    new RevealController();
    new CardSpotlight();
    new NeuralHorizon();

    const year = document.getElementById('current-year');
    if (year) year.textContent = String(new Date().getFullYear());
}

document.addEventListener('DOMContentLoaded', initializePortfolio);
