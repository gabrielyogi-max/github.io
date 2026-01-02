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

// --- NEURAL NETWORK 3D BACKGROUND ---
class NeuralNetworkBackground {
    constructor() {
        this.container = document.getElementById('canvas-container');
        if (!this.container) return;

        this.nodes = [];
        this.connections = [];
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

        // Camera - positioned to see the network from an angle
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 0, 50);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x000000, 0);
        this.container.appendChild(this.renderer.domElement);

        // Create neural network
        this.createNeuralNetwork();

        // Events
        window.addEventListener('resize', () => this.onResize());
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));

        // Animate
        this.animate();
    }

    createNeuralNetwork() {
        const THREE = this.THREE;

        // Neural network layers configuration
        const layers = [
            { count: 6, x: -35 },   // Input layer
            { count: 10, x: -17 },  // Hidden 1
            { count: 12, x: 0 },    // Hidden 2
            { count: 10, x: 17 },   // Hidden 3
            { count: 5, x: 35 }     // Output layer
        ];

        // Colors for different layers
        const colors = [
            0x6366f1, // Indigo
            0x8b5cf6, // Purple
            0xa855f7, // Fuchsia
            0x8b5cf6, // Purple
            0x0ea5e9  // Cyan
        ];

        // Create nodes for each layer
        layers.forEach((layer, layerIndex) => {
            const layerNodes = [];
            const spacing = 50 / layer.count;

            for (let i = 0; i < layer.count; i++) {
                const y = (i - layer.count / 2 + 0.5) * spacing;
                const z = (Math.random() - 0.5) * 10;

                // Node sphere
                const geometry = new THREE.SphereGeometry(0.8, 16, 16);
                const material = new THREE.MeshBasicMaterial({
                    color: colors[layerIndex],
                    transparent: true,
                    opacity: 0.9
                });
                const node = new THREE.Mesh(geometry, material);
                node.position.set(layer.x, y, z);

                // Glow effect (larger transparent sphere)
                const glowGeo = new THREE.SphereGeometry(1.5, 16, 16);
                const glowMat = new THREE.MeshBasicMaterial({
                    color: colors[layerIndex],
                    transparent: true,
                    opacity: 0.15
                });
                const glow = new THREE.Mesh(glowGeo, glowMat);
                node.add(glow);

                // Store original position for animation
                node.userData = {
                    originalY: y,
                    originalZ: z,
                    phase: Math.random() * Math.PI * 2,
                    speed: 0.5 + Math.random() * 0.5
                };

                this.scene.add(node);
                layerNodes.push(node);
            }
            this.nodes.push(layerNodes);
        });

        // Create connections between layers
        this.connectionGroup = new THREE.Group();

        for (let l = 0; l < this.nodes.length - 1; l++) {
            const currentLayer = this.nodes[l];
            const nextLayer = this.nodes[l + 1];

            currentLayer.forEach((node1, i) => {
                // Connect to some nodes in next layer (not all, to avoid clutter)
                const connectionsCount = Math.min(3, nextLayer.length);
                const indices = this.getRandomIndices(nextLayer.length, connectionsCount);

                indices.forEach(j => {
                    const node2 = nextLayer[j];
                    const connection = this.createConnection(node1, node2, colors[l]);
                    this.connections.push({
                        line: connection,
                        node1: node1,
                        node2: node2
                    });
                    this.connectionGroup.add(connection);
                });
            });
        }

        this.scene.add(this.connectionGroup);

        // Add floating data particles
        this.createDataParticles();
    }

    getRandomIndices(max, count) {
        const indices = [];
        while (indices.length < count) {
            const idx = Math.floor(Math.random() * max);
            if (!indices.includes(idx)) indices.push(idx);
        }
        return indices;
    }

    createConnection(node1, node2, color) {
        const THREE = this.THREE;

        const points = [node1.position.clone(), node2.position.clone()];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);

        const material = new THREE.LineBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.2,
            blending: THREE.AdditiveBlending
        });

        return new THREE.Line(geometry, material);
    }

    createDataParticles() {
        const THREE = this.THREE;
        const particleCount = 150;

        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = [];

        for (let i = 0; i < particleCount; i++) {
            // Start particles along connections
            positions[i * 3] = (Math.random() - 0.5) * 80;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 50;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 20;

            velocities.push({
                x: (Math.random() - 0.3) * 0.3, // Tendency to move right
                y: (Math.random() - 0.5) * 0.1,
                z: (Math.random() - 0.5) * 0.1
            });
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
            color: 0x8b5cf6,
            size: 0.4,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });

        this.dataParticles = new THREE.Points(geometry, material);
        this.dataParticles.userData.velocities = velocities;
        this.scene.add(this.dataParticles);
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

        // Smooth mouse
        this.mouse.x += (this.targetMouse.x - this.mouse.x) * 0.03;
        this.mouse.y += (this.targetMouse.y - this.mouse.y) * 0.03;

        // Animate nodes (floating effect)
        this.nodes.forEach(layer => {
            layer.forEach(node => {
                const { originalY, originalZ, phase, speed } = node.userData;
                node.position.y = originalY + Math.sin(time * speed + phase) * 1.5;
                node.position.z = originalZ + Math.cos(time * speed * 0.7 + phase) * 1;
            });
        });

        // Update connections to follow nodes
        this.connections.forEach(conn => {
            const positions = conn.line.geometry.attributes.position.array;
            positions[0] = conn.node1.position.x;
            positions[1] = conn.node1.position.y;
            positions[2] = conn.node1.position.z;
            positions[3] = conn.node2.position.x;
            positions[4] = conn.node2.position.y;
            positions[5] = conn.node2.position.z;
            conn.line.geometry.attributes.position.needsUpdate = true;
        });

        // Animate data particles (flowing through network)
        if (this.dataParticles) {
            const positions = this.dataParticles.geometry.attributes.position.array;
            const velocities = this.dataParticles.userData.velocities;

            for (let i = 0; i < velocities.length; i++) {
                positions[i * 3] += velocities[i].x;
                positions[i * 3 + 1] += velocities[i].y;
                positions[i * 3 + 2] += velocities[i].z;

                // Reset if out of bounds
                if (positions[i * 3] > 45) {
                    positions[i * 3] = -45;
                    positions[i * 3 + 1] = (Math.random() - 0.5) * 40;
                }
            }
            this.dataParticles.geometry.attributes.position.needsUpdate = true;
        }

        // Camera response to mouse (subtle)
        this.camera.position.x = this.mouse.x * 5;
        this.camera.position.y = this.mouse.y * 3;
        this.camera.lookAt(0, 0, 0);

        // Subtle rotation of entire network
        this.scene.rotation.y = Math.sin(time * 0.1) * 0.1 + this.mouse.x * 0.1;
        this.scene.rotation.x = this.mouse.y * 0.1;

        this.renderer.render(this.scene, this.camera);
    }

    updateColors(isDark) {
        // Could update node colors based on theme if needed
    }
}

// --- THEME MANAGER ---
class ThemeManager {
    constructor(neuralBg) {
        this.toggleBtn = document.getElementById('theme-toggle');
        this.html = document.documentElement;
        this.neuralBg = neuralBg;

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

        if (this.neuralBg) {
            this.neuralBg.updateColors(theme === 'dark');
        }
    }
}

// Start everything when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new TiltEffect();
    const neuralBg = new NeuralNetworkBackground();
    new ThemeManager(neuralBg);
});
