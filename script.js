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

// --- THREE.JS MESH BACKGROUND ---
class MeshBackground {
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

        this.scene = new THREE.Scene();

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.z = 30;

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x000000, 0);
        this.container.appendChild(this.renderer.domElement);

        this.createMesh();

        window.addEventListener('resize', () => this.onResize());
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));

        this.animate();
    }

    createMesh() {
        const THREE = this.THREE;

        const geometry = new THREE.PlaneGeometry(80, 80, 50, 50);

        const material = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uMouse: { value: new THREE.Vector2(0, 0) },
                uColor1: { value: new THREE.Color(0x6366f1) },
                uColor2: { value: new THREE.Color(0x8b5cf6) },
                uColor3: { value: new THREE.Color(0x0ea5e9) },
            },
            vertexShader: `
                uniform float uTime;
                uniform vec2 uMouse;
                varying vec2 vUv;
                varying float vElevation;

                void main() {
                    vUv = uv;
                    vec3 pos = position;

                    float wave1 = sin(pos.x * 0.3 + uTime * 0.5) * 2.0;
                    float wave2 = sin(pos.y * 0.2 + uTime * 0.3) * 2.0;
                    float wave3 = sin((pos.x + pos.y) * 0.2 + uTime * 0.4) * 1.5;

                    float dist = distance(pos.xy * 0.05, uMouse);
                    float mouseWave = exp(-dist * 2.0) * 3.0;

                    pos.z = wave1 + wave2 + wave3 + mouseWave;
                    vElevation = pos.z;

                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 uColor1;
                uniform vec3 uColor2;
                uniform vec3 uColor3;
                varying vec2 vUv;
                varying float vElevation;

                void main() {
                    vec3 color = mix(uColor1, uColor2, vUv.x);
                    color = mix(color, uColor3, vUv.y * 0.5);
                    color = mix(color, uColor2, (vElevation + 5.0) / 10.0 * 0.3);

                    float alpha = smoothstep(0.0, 0.2, vUv.x) * smoothstep(1.0, 0.8, vUv.x);
                    alpha *= smoothstep(0.0, 0.2, vUv.y) * smoothstep(1.0, 0.8, vUv.y);
                    alpha *= 0.15;

                    gl_FragColor = vec4(color, alpha);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide,
            wireframe: true
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.rotation.x = -Math.PI * 0.4;
        this.mesh.position.y = -10;
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

        this.mouse.x += (this.targetMouse.x - this.mouse.x) * 0.05;
        this.mouse.y += (this.targetMouse.y - this.mouse.y) * 0.05;

        if (this.mesh) {
            this.mesh.material.uniforms.uTime.value = time;
            this.mesh.material.uniforms.uMouse.value.set(this.mouse.x, this.mouse.y);
            this.mesh.rotation.z = this.mouse.x * 0.1;
        }

        this.camera.position.x = this.mouse.x * 2;
        this.camera.position.y = this.mouse.y * 1.5;

        this.renderer.render(this.scene, this.camera);
    }

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
    constructor(meshBg) {
        this.toggleBtn = document.getElementById('theme-toggle');
        this.html = document.documentElement;
        this.meshBg = meshBg;

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

        if (this.meshBg) {
            this.meshBg.updateColors(theme === 'dark');
        }
    }
}

// Start
document.addEventListener('DOMContentLoaded', () => {
    new TiltEffect();
    const meshBg = new MeshBackground();
    new ThemeManager(meshBg);
});
