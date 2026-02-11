// Three.js Scene Setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#webgl'),
    antialias: true,
    alpha: true
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Particle System
const particlesCount = 5000;
const posArray = new Float32Array(particlesCount * 3);
const originalPosArray = new Float32Array(particlesCount * 3); // To store base shape
const targetPosArray = new Float32Array(particlesCount * 3); // For morphing

// Initial Shape: Sphere
for (let i = 0; i < particlesCount * 3; i++) {
    // Random point in sphere
    const r = 2.5 * Math.cbrt(Math.random());
    const theta = Math.random() * 2 * Math.PI;
    const phi = Math.acos(2 * Math.random() - 1);

    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);

    posArray[i] = x;
    posArray[i + 1] = y;
    posArray[i + 2] = z;

    // Save original for noise/return
    originalPosArray[i] = x;
    originalPosArray[i + 1] = y;
    originalPosArray[i + 2] = z;

    // Initialize target as same
    targetPosArray[i] = x;
    targetPosArray[i + 1] = y;
    targetPosArray[i + 2] = z;
}

const particlesGeometry = new THREE.BufferGeometry();
particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
particlesGeometry.setAttribute('target', new THREE.BufferAttribute(targetPosArray, 3));

// Custom Shader for Particles
const particlesMaterial = new THREE.ShaderMaterial({
    uniforms: {
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector3(0, 0, 0) },
        uColor1: { value: new THREE.Color('#00f3ff') }, // Cyan
        uColor2: { value: new THREE.Color('#bc13fe') }, // Purple
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uMorphFactor: { value: 0 }
    },
    vertexShader: `
        uniform float uTime;
        uniform vec3 uMouse;
        uniform float uPixelRatio;
        uniform float uMorphFactor;
        
        attribute vec3 target;
        varying vec3 vColor;
        varying float vAlpha;

        // Simplex Noise (simplified)
        // ... (Noise function would go here, simplified for brevity in this tool call, using sine waves for movement)
        
        void main() {
            vec3 pos = position;
            vec3 trg = target;

            // Simple Morphing: Linear Interpolation
            vec3 finalPos = mix(pos, trg, uMorphFactor);

            // Noise / Wave effect
            finalPos.x += sin(uTime * 0.5 + finalPos.y) * 0.1;
            finalPos.y += cos(uTime * 0.3 + finalPos.x) * 0.1;
            
            // Mouse Interaction (Repulsion)
            float dist = distance(uMouse.xy, finalPos.xy);
            float maxDist = 2.0;
            if(dist < maxDist) {
                vec3 dir = normalize(finalPos - uMouse);
                float force = (maxDist - dist) * 0.5;
                finalPos += dir * force;
            }

            vec4 mvPosition = modelViewMatrix * vec4(finalPos, 1.0);
            gl_Position = projectionMatrix * mvPosition;
            
            // Size attenuation
            gl_PointSize = (4.0 * uPixelRatio) * (1.0 / -mvPosition.z);
            
            // Color based on depth/position
            vAlpha = 1.0;
        }
    `,
    fragmentShader: `
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        varying float vAlpha;

        void main() {
            // Circular particle
            float r = distance(gl_PointCoord, vec2(0.5));
            if (r > 0.5) discard;
            
            // Glow effect
            float glow = 1.0 - (r * 2.0);
            glow = pow(glow, 1.5);

            vec3 color = mix(uColor1, uColor2, gl_FragCoord.y / 1000.0);
            gl_FragColor = vec4(color, glow * vAlpha);
        }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
});

const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particlesMesh);

camera.position.z = 5;

// Forms Logic
function getSphereShape() {
    const arr = new Float32Array(particlesCount * 3);
    for (let i = 0; i < particlesCount * 3; i += 3) {
        const r = 3;
        const theta = Math.random() * 2 * Math.PI;
        const phi = Math.acos(2 * Math.random() - 1);
        arr[i] = r * Math.sin(phi) * Math.cos(theta);
        arr[i + 1] = r * Math.sin(phi) * Math.sin(theta);
        arr[i + 2] = r * Math.cos(phi);
    }
    return arr;
}

function getRingShape() {
    const arr = new Float32Array(particlesCount * 3);
    for (let i = 0; i < particlesCount * 3; i += 3) {
        const r = 3 + (Math.random() - 0.5) * 1;
        const theta = Math.random() * 2 * Math.PI;
        arr[i] = r * Math.cos(theta);
        arr[i + 1] = (Math.random() - 0.5) * 0.5; // Flat
        arr[i + 2] = r * Math.sin(theta);
    }
    return arr;
}

function getWaveShape() {
    const arr = new Float32Array(particlesCount * 3);
    for (let i = 0; i < particlesCount * 3; i += 3) {
        const x = (Math.random() - 0.5) * 10;
        const z = (Math.random() - 0.5) * 10;
        const y = Math.sin(x * 0.5 + z * 0.5);
        arr[i] = x;
        arr[i + 1] = y;
        arr[i + 2] = z;
    }
    return arr;
}

function getCloudShape() {
    const arr = new Float32Array(particlesCount * 3);
    for (let i = 0; i < particlesCount * 3; i += 3) {
        const r = 4 * Math.random();
        const theta = Math.random() * 2 * Math.PI;
        const phi = Math.acos(2 * Math.random() - 1);
        // Flatter, wider cloud
        arr[i] = r * Math.sin(phi) * Math.cos(theta) * 2;
        arr[i + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.5;
        arr[i + 2] = r * Math.cos(phi) * 1.5;
    }
    return arr;
}

const shapes = {
    sphere: originalPosArray, // Initial random sphere
    ring: getRingShape(),
    cloud: getCloudShape(),
    wave: getWaveShape()
};

// Animation Loop
const clock = new THREE.Clock();

function animate() {
    const elapsedTime = clock.getElapsedTime();
    particlesMaterial.uniforms.uTime.value = elapsedTime;

    // Rotate entire system slowly
    particlesMesh.rotation.y = elapsedTime * 0.05;

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

animate();

// Mouse Move for Raycaster/Shader interaction
window.addEventListener('mousemove', (event) => {
    // Normalize mouse for shader (-1 to 1 sphere approx view)
    // Map pixels to world logic approx for repulsion
    const x = (event.clientX / window.innerWidth) * 2 - 1;
    const y = -(event.clientY / window.innerHeight) * 2 + 1;
    // Project to z=0 plane for simple repulsion check
    const vec = new THREE.Vector3(x, y, 0.5);
    vec.unproject(camera);
    const dir = vec.sub(camera.position).normalize();
    const distance = -camera.position.z / dir.z;
    const pos = camera.position.clone().add(dir.multiplyScalar(distance));

    particlesMaterial.uniforms.uMouse.value.copy(pos);
});

// Resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    particlesMaterial.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2);
});

// Scroll Triggers for Morphing
gsap.registerPlugin(ScrollTrigger);

// Helper to transition shape
function morphTo(shapeName) {
    const targetArr = shapes[shapeName];
    // We can't easily animate attributes directly in GSAP without a proxy or heavy CPU mapping.
    // Efficient way: use the 'target' attribute and mix in shader.
    // 1. Update 'position' attribute to current state (or keep morphFactor flow).
    // Let's use CPU buffer update for target and shader morphFactor for blend.

    // Actually, for simplicity and performance in this timeframe:
    // Tween morphFactor from 0 to 1, then swap buffers.

    const currentPos = particlesGeometry.attributes.position.array;

    // Optimization: Just GSAP the position array directly? 
    // No, too extensive.
    // Approach: use GSAP to animate a proxy object, onUpdate copy values? Too slow.
    // Better Approach: Shader mix. 
    // "Position" is A, "Target" is B. uMorphFactor 0->1.
    // When complete, A = B, uMorphFactor = 0.

    particlesGeometry.setAttribute('target', new THREE.BufferAttribute(targetArr, 3));
    particlesGeometry.attributes.target.needsUpdate = true;

    gsap.fromTo(particlesMaterial.uniforms.uMorphFactor,
        { value: 0 },
        {
            value: 1, duration: 2, ease: "power2.inOut", onComplete: () => {
                // Set current position to target
                particlesGeometry.setAttribute('position', new THREE.BufferAttribute(targetArr, 3));
                particlesMaterial.uniforms.uMorphFactor.value = 0;
            }
        }
    );
}

// GSAP Animations
const heroTl = gsap.timeline();

heroTl.from('.profile-container', {
    duration: 1.5,
    x: 100,
    opacity: 0,
    ease: 'power4.out'
})
    .from('.hero-content h1', {
        duration: 1.5,
        x: -100,
        opacity: 0,
        ease: 'power4.out'
    }, "-=1.5")
    .from('.hero-content p', {
        duration: 1.5,
        opacity: 0,
        y: 30,
        stagger: 0.2
    }, "-=1");

// Section Triggers
ScrollTrigger.create({
    trigger: "#skills",
    start: "top center",
    onEnter: () => morphTo('ring'),
    onLeaveBack: () => morphTo('sphere')
});

ScrollTrigger.create({
    trigger: "#certificates",
    start: "top center",
    onEnter: () => morphTo('cloud'), // New shape
    onLeaveBack: () => morphTo('ring')
});

ScrollTrigger.create({
    trigger: "#projects",
    start: "top center",
    onEnter: () => morphTo('wave'),
    onLeaveBack: () => morphTo('cloud')
});

ScrollTrigger.create({
    trigger: "#contact",
    start: "top center",
    onEnter: () => morphTo('sphere'), // Return to sphere or explode
    onLeaveBack: () => morphTo('wave')
});

// Section content fades
document.querySelectorAll('section:not(#hero)').forEach(section => {
    gsap.from(section.querySelectorAll('.container > *'), {
        scrollTrigger: {
            trigger: section,
            start: "top 80%",
            toggleActions: "play none none reverse"
        },
        y: 50,
        opacity: 0,
        duration: 1,
        stagger: 0.1
    });
});
