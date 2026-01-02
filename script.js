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
        const rotateX = ((y - centerY) / centerY) * -8;
        const rotateY = ((x - centerX) / centerX) * 8;

        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    }

    handleMouseLeave(card) {
        card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
    }
}

// --- EMBEDDING MANIFOLD MESH BACKGROUND ---
class ManifoldBackground {
    constructor() {
        this.container = document.getElementById('canvas-container');
        if (!this.container) return;

        this.mouse = { x: 0, y: 0 };
        this.targetMouse = { x: 0, y: 0 };

        this.init();
    }

    async init() {
        const THREE = await import('https://cdn.jsdelivr.net/npm/three@0.167.0/build/three.module.js');
        this.THREE = THREE;
        this.clock = new THREE.Clock();

        // Scene
        this.scene = new THREE.Scene();

        // Camera
        this.camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 0, 40);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x000000, 0);
        this.container.appendChild(this.renderer.domElement);

        // Create manifold mesh
        this.createManifoldMesh();

        // Events
        window.addEventListener('resize', () => this.onResize());
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));

        this.animate();
    }

    createManifoldMesh() {
        const THREE = this.THREE;

        // Large mesh positioned lower in view
        const geometry = new THREE.PlaneGeometry(120, 70, 80, 50);

        const material = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uMouse: { value: new THREE.Vector2(0, 0) },
                uColor1: { value: new THREE.Color(0x6366f1) }, // Indigo
                uColor2: { value: new THREE.Color(0x8b5cf6) }, // Purple
                uColor3: { value: new THREE.Color(0x0ea5e9) }, // Cyan accent
            },
            vertexShader: `
                uniform float uTime;
                uniform vec2 uMouse;
                varying vec2 vUv;
                varying float vElevation;

                // Simplex noise-like function for organic movement
                float wave(vec2 p, float t) {
                    return sin(p.x * 0.12 + t * 0.4) * sin(p.y * 0.1 + t * 0.3) * 3.0
                         + sin(p.x * 0.08 - t * 0.25) * 2.0
                         + sin((p.x + p.y) * 0.06 + t * 0.35) * 2.5;
                }

                void main() {
                    vUv = uv;
                    vec3 pos = position;

                    // Organic wave deformation
                    float elevation = wave(pos.xy, uTime);

                    // Mouse interaction - creates a smooth bump
                    vec2 mousePos = uMouse * 30.0;
                    float dist = distance(pos.xy, mousePos);
                    float mouseBump = exp(-dist * 0.08) * 5.0;

                    pos.z = elevation + mouseBump;
                    vElevation = pos.z;

                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 uColor1;
                uniform vec3 uColor2;
                uniform vec3 uColor3;
                uniform float uTime;
                varying vec2 vUv;
                varying float vElevation;

                void main() {
                    // Gradient based on position
                    vec3 color = mix(uColor1, uColor2, vUv.x);
                    
                    // Add cyan accent based on elevation
                    float elevationMix = smoothstep(-2.0, 6.0, vElevation);
                    color = mix(color, uColor3, elevationMix * 0.3);

                    // Fade edges smoothly
                    float alpha = smoothstep(0.0, 0.2, vUv.x) * smoothstep(1.0, 0.8, vUv.x);
                    alpha *= smoothstep(0.0, 0.25, vUv.y) * smoothstep(1.0, 0.75, vUv.y);
                    alpha *= 0.18; // Overall opacity

                    gl_FragColor = vec4(color, alpha);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide,
            wireframe: true,
            depthWrite: false
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.rotation.x = -Math.PI * 0.4; // Angled view
        this.mesh.position.y = -30; // Balanced position
        this.mesh.position.z = -8;
        this.scene.add(this.mesh);
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    onMouseMove(e) {
        this.targetMouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        this.targetMouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const time = this.clock.getElapsedTime();

        // Smooth mouse interpolation
        this.mouse.x += (this.targetMouse.x - this.mouse.x) * 0.04;
        this.mouse.y += (this.targetMouse.y - this.mouse.y) * 0.04;

        // Update shader uniforms
        if (this.mesh) {
            this.mesh.material.uniforms.uTime.value = time;
            this.mesh.material.uniforms.uMouse.value.set(this.mouse.x, this.mouse.y);

            // Subtle rotation based on mouse
            this.mesh.rotation.z = this.mouse.x * 0.03;
        }

        this.renderer.render(this.scene, this.camera);
    }

    // Theme color update
    updateColors(isDark) {
        if (!this.mesh) return;
        const THREE = this.THREE;
        if (isDark) {
            this.mesh.material.uniforms.uColor1.value = new THREE.Color(0x6366f1);
            this.mesh.material.uniforms.uColor2.value = new THREE.Color(0x8b5cf6);
        } else {
            this.mesh.material.uniforms.uColor1.value = new THREE.Color(0x4f46e5);
            this.mesh.material.uniforms.uColor2.value = new THREE.Color(0x7c3aed);
        }
    }
}

// --- THEME MANAGER ---
class ThemeManager {
    constructor(bg) {
        this.toggleBtn = document.getElementById('theme-toggle');
        this.html = document.documentElement;
        this.bg = bg;

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

        if (this.toggleBtn) {
            const sunIcon = '<i data-lucide="sun" class="h-5 w-5"></i>';
            const moonIcon = '<i data-lucide="moon" class="h-5 w-5"></i>';
            this.toggleBtn.innerHTML = theme === 'dark' ? sunIcon : moonIcon;
            lucide.createIcons();
        }

        if (this.bg) {
            this.bg.updateColors(theme === 'dark');
        }
    }
}

// Start
document.addEventListener('DOMContentLoaded', () => {
    new TiltEffect();
    const bg = new ManifoldBackground();
    new ThemeManager(bg);
});
