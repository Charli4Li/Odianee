/**
 * 3D Floating Gallery for ODIANEE
 * Flawless front-facing billboarding, rich saturated colors (no paleness),
 * hover translucency, and detail inspection
 */

class FloatingGallery {
  constructor() {
    this.container = document.getElementById('canvas-container');
    this.canvas = document.getElementById('webgl-canvas');
    this.centerHero = document.querySelector('.center-hero');
    this.wheelBackdrop = document.getElementById('hero-wheel-backdrop');
    this.bottomControls = document.querySelector('.bottom-controls');
    this.detailModal = document.getElementById('detail-modal');
    
    this.detailTitle = document.getElementById('detail-title');
    this.detailMeta = document.getElementById('detail-meta');
    this.detailDesc = document.getElementById('detail-desc');
    this.detailTags = document.getElementById('detail-tags');
    this.detailCloseBtn = document.getElementById('detail-close-btn');

    this.sphereBtn = document.getElementById('btn-sphere');
    this.cylinderBtn = document.getElementById('btn-cylinder');

    this.currentView = 'sphere'; // 'sphere' | 'cylinder'
    this.isDetailOpen = false;
    this.selectedCard = null;
    this.selectedIndex = null;

    // Gallery collective orbit rotation around Y axis
    this.currentRotationY = 0;
    this.rotationVelocity = 0;

    // Interaction variables
    this.isDragging = false;
    this.isDragMove = false;
    this.downPosition = { x: 0, y: 0 };
    this.previousMousePosition = { x: 0, y: 0 };
    this.mouseNormalized = { x: 0, y: 0 };
    this.hoveredCard = null;

    // Raycaster
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2(-999, -999);

    this.cards = [];
    this.paperParticles = [];
    this.clock = new THREE.Clock();

    // Default camera targets
    this.defaultCamPos = new THREE.Vector3(0, 0, 7.5);
    this.targetCamPos = this.defaultCamPos.clone();
    this.targetCamLookAt = new THREE.Vector3(0, 0, 0);
    this.currentCamLookAt = new THREE.Vector3(0, 0, 0);

    this.initScene();
    this.initLights();
    this.createCards();
    this.createPaperParticles();
    this.setupEvents();
    this.animate();
  }

  initScene() {
    this.scene = new THREE.Scene();

    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    this.camera.position.copy(this.defaultCamPos);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));



    // Set outputEncoding to LinearEncoding so Three.js never gamma-bleaches or washes out textures
    this.renderer.outputEncoding = THREE.LinearEncoding;

    // Container holding cards
    this.cardsContainer = new THREE.Group();
    this.scene.add(this.cardsContainer);
  }

  initLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight.position.set(5, 10, 7);
    this.scene.add(dirLight);
  }

  computeSpherePositions(count, radius = 5.0) {
    const positions = [];
    const phi = Math.PI * (3 - Math.sqrt(5)); // Golden angle (~2.39996 rad)
    for (let i = 0; i < count; i++) {
      const y = 1 - (i / (count - 1)) * 2;
      const radiusAtY = Math.sqrt(1 - y * y);
      const theta = phi * i;
      const x = Math.cos(theta) * radiusAtY;
      const z = Math.sin(theta) * radiusAtY;
      positions.push(new THREE.Vector3(x * radius, y * radius, z * radius));
    }
    return positions;
  }

  computeCylinderPositions(count, radius = 5.0, height = 8.0) {
    const positions = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = (i / count) * height - height / 2;
      positions.push(new THREE.Vector3(x, y, z));
    }
    return positions;
  }

  createCards() {
    const textureLoader = new THREE.TextureLoader();
    const count = ARTS_DATA.length;
    this.spherePositions = this.computeSpherePositions(count, 5.0);
    this.cylinderPositions = this.computeCylinderPositions(count, 5.0, 8.0);

    const cardGeometry = new THREE.PlaneGeometry(1.5, 2.0);
    const borderGeometry = new THREE.PlaneGeometry(1.54, 2.04);

    ARTS_DATA.forEach((item, index) => {
      const initialPos = this.spherePositions[index];

      // Load texture with LinearEncoding to guarantee true source pixel fidelity
      const texture = textureLoader.load(item.image);
      texture.encoding = THREE.LinearEncoding;
      texture.generateMipmaps = true;
      texture.minFilter = THREE.LinearMipmapLinearFilter;

      // Custom high-fidelity ShaderMaterial:
      // - Direct Rec.709 color fidelity
      // - Rich contrast (+18%) and deep vibrant saturation (+28%)
      // - Eliminates Three.js gamma bleaching and double-sRGB washing out
      // - Clean opacity blending for hover translucency
      const cardMaterial = new THREE.ShaderMaterial({
        uniforms: {
          map: { value: texture },
          opacity: { value: 1.0 },
          contrast: { value: 1.18 },
          saturation: { value: 1.28 },
          brightness: { value: 0.98 }
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform sampler2D map;
          uniform float opacity;
          uniform float contrast;
          uniform float saturation;
          uniform float brightness;
          varying vec2 vUv;

          void main() {
            vec4 tex = texture2D(map, vUv);
            vec3 col = tex.rgb;

            // Rec.709 Luma for accurate saturation enhancement
            float luma = dot(col, vec3(0.2126, 0.7152, 0.0722));
            col = mix(vec3(luma), col, saturation);

            // High contrast curve: deepens shadows and blacks, makes rich tones punchy
            col = (col - 0.5) * contrast + 0.5;

            // Controlled brightness
            col *= brightness;

            col = clamp(col, 0.0, 1.0);

            gl_FragColor = vec4(col, tex.a * opacity);
          }
        `,
        transparent: true,
        depthWrite: true,
        side: THREE.FrontSide
      });

      // Placard dark outline border
      const borderMaterial = new THREE.MeshBasicMaterial({
        color: 0x222a1b,
        transparent: true,
        opacity: 0.45,
        side: THREE.FrontSide
      });
      const borderMesh = new THREE.Mesh(borderGeometry, borderMaterial);
      borderMesh.position.set(0, 0, -0.005);

      // Main Card Mesh
      const cardMesh = new THREE.Mesh(cardGeometry, cardMaterial);
      cardMesh.position.copy(initialPos);
      cardMesh.userData = { id: item.id, item, index };

      cardMesh.add(borderMesh);
      this.cardsContainer.add(cardMesh);

      this.cards.push({
        id: item.id,
        item,
        index,
        mesh: cardMesh,
        borderMesh,
        targetPos: initialPos.clone(),
        seed: Math.random() * 100,
        targetScale: 1.0,
        targetOpacity: 1.0
      });
    });
  }

  createPaperParticles() {
    const textureLoader = new THREE.TextureLoader();
    const textures = [
      textureLoader.load('assets/textures/paper-1.png'),
      textureLoader.load('assets/textures/paper-2.png')
    ];
    textures.forEach(t => { t.encoding = THREE.LinearEncoding; });

    const particleCount = 70;
    this.particlesGroup = new THREE.Group();
    this.scene.add(this.particlesGroup);

    for (let i = 0; i < particleCount; i++) {
      const scale = 0.18 + Math.random() * 0.28;
      const geom = new THREE.PlaneGeometry(scale, scale);
      const mat = new THREE.MeshBasicMaterial({
        map: textures[Math.random() > 0.5 ? 0 : 1],
        transparent: true,
        opacity: 0.55 + Math.random() * 0.35,
        side: THREE.DoubleSide
      });
      const pMesh = new THREE.Mesh(geom, mat);

      const pData = {
        mesh: pMesh,
        x: (Math.random() - 0.5) * 32,
        y: (Math.random() - 0.5) * 30,
        z: (Math.random() - 0.5) * 26,
        rotationZ: Math.random() * Math.PI * 2,
        rotationX: Math.random() * Math.PI * 2,
        speed: 0.005 + Math.random() * 0.014,
        drift: 0.002 + Math.random() * 0.004
      };

      pMesh.position.set(pData.x, pData.y, pData.z);
      this.particlesGroup.add(pMesh);
      this.paperParticles.push(pData);
    }
  }

  setupEvents() {
    window.addEventListener('resize', () => this.onResize());

    // Mouse Move (Parallax, Dragging & Raycasting)
    window.addEventListener('mousemove', (e) => {
      this.mouseNormalized.x = (e.clientX / window.innerWidth - 0.5) * 2;
      this.mouseNormalized.y = (e.clientY / window.innerHeight - 0.5) * 2;

      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

      if (this.isDragging && !this.isDetailOpen) {
        const deltaX = e.clientX - this.previousMousePosition.x;
        if (Math.hypot(e.clientX - this.downPosition.x, e.clientY - this.downPosition.y) > 6) {
          this.isDragMove = true;
        }
        this.rotationVelocity += deltaX * 0.0028;
        this.previousMousePosition = { x: e.clientX, y: e.clientY };
      }
    });

    // Reset hover when mouse leaves canvas container
    this.container.addEventListener('mouseleave', () => {
      this.hoveredCard = null;
      this.mouse.set(-999, -999);
    });

    // Pointer Down (Drag start)
    this.container.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.bottom-controls') || e.target.closest('.detail-modal')) return;
      this.isDragging = true;
      this.isDragMove = false;
      this.downPosition = { x: e.clientX, y: e.clientY };
      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    // Pointer Up
    window.addEventListener('pointerup', () => {
      this.isDragging = false;
    });

    // Mouse Wheel (Rotates gallery orbit smoothly around Y axis)
    window.addEventListener('wheel', (e) => {
      if (this.isDetailOpen) return;
      this.rotationVelocity += e.deltaY * 0.0007;
    }, { passive: true });

    // Touch Support for mobile devices
    this.container.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        this.isDragging = true;
        this.isDragMove = false;
        this.downPosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        this.previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (this.isDragging && e.touches.length === 1 && !this.isDetailOpen) {
        const touchX = e.touches[0].clientX;
        const deltaX = touchX - this.previousMousePosition.x;
        if (Math.abs(touchX - this.downPosition.x) > 6) {
          this.isDragMove = true;
        }
        this.rotationVelocity += deltaX * 0.0035;
        this.previousMousePosition = { x: touchX, y: e.touches[0].clientY };
      }
    }, { passive: true });

    window.addEventListener('touchend', () => {
      this.isDragging = false;
    });

    // Click on canvas for selecting card
    this.container.addEventListener('click', (e) => {
      if (this.isDragMove || this.isDetailOpen) return;
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const meshes = this.cards.map(c => c.mesh);
      const intersects = this.raycaster.intersectObjects(meshes);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        const data = hit.userData;
        this.openCardDetail(data.item, data.index);
      }
    });

    // Close button
    if (this.detailCloseBtn) {
      this.detailCloseBtn.addEventListener('click', () => this.closeCardDetail());
    }

    // View Switcher Buttons
    if (this.sphereBtn && this.cylinderBtn) {
      this.sphereBtn.addEventListener('click', () => this.switchView('sphere'));
      this.cylinderBtn.addEventListener('click', () => this.switchView('cylinder'));
    }

    // Keyboard support: Escape closes detail
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isDetailOpen) {
        this.closeCardDetail();
      }
    });
  }

  switchView(type) {
    if (this.currentView === type) return;
    this.currentView = type;

    if (type === 'sphere') {
      this.sphereBtn.classList.add('active');
      this.cylinderBtn.classList.remove('active');
      this.cards.forEach((c, i) => {
        c.targetPos.copy(this.spherePositions[i]);
      });
    } else if (type === 'cylinder') {
      this.cylinderBtn.classList.add('active');
      this.sphereBtn.classList.remove('active');
      this.cards.forEach((c, i) => {
        c.targetPos.copy(this.cylinderPositions[i]);
      });
    }
  }

  openCardDetail(item, index) {
    this.isDetailOpen = true;
    this.selectedCard = this.cards[index];
    this.selectedIndex = index;

    // Hide center hero logo and bottom controls smoothly
    if (this.centerHero) this.centerHero.classList.add('hidden-hero');
    if (this.wheelBackdrop) this.wheelBackdrop.classList.add('hidden-hero');
    if (this.bottomControls) this.bottomControls.classList.add('hidden-controls');

    // Populate detail modal text
    if (this.detailTitle) this.detailTitle.textContent = item.title;
    if (this.detailMeta) this.detailMeta.textContent = `${item.time} • ${item.tags ? item.tags[0] : ''}`;
    if (this.detailDesc) this.detailDesc.textContent = item.description;

    if (this.detailTags) {
      this.detailTags.innerHTML = '';
      if (item.tags) {
        item.tags.forEach(t => {
          const badge = document.createElement('span');
          badge.className = 'detail-tag';
          badge.textContent = t;
          this.detailTags.appendChild(badge);
        });
      }
    }

    // Show modal with GSAP
    if (this.detailModal) {
      this.detailModal.classList.add('active');
      if (window.gsap) {
        gsap.fromTo('.detail-close-btn', { opacity: 0, y: -16 }, { opacity: 0.85, y: 0, duration: 0.4, ease: 'power3.out' });
        gsap.fromTo('.detail-title-col', { opacity: 0, y: 35 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out', delay: 0.1 });
        gsap.fromTo('.detail-desc-col', { opacity: 0, y: 35 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out', delay: 0.2 });
      }
    }
  }

  closeCardDetail() {
    if (!this.isDetailOpen) return;
    this.isDetailOpen = false;

    if (window.gsap && this.detailModal) {
      gsap.to(this.detailModal, {
        opacity: 0,
        duration: 0.3,
        ease: 'power2.in',
        onComplete: () => {
          this.detailModal.classList.remove('active');
          this.detailModal.style.opacity = '';
        }
      });
    } else if (this.detailModal) {
      this.detailModal.classList.remove('active');
    }

    // Restore center hero logo and bottom controls
    if (this.centerHero) this.centerHero.classList.remove('hidden-hero');
    if (this.wheelBackdrop) this.wheelBackdrop.classList.remove('hidden-hero');
    if (this.bottomControls) this.bottomControls.classList.remove('hidden-controls');

    this.selectedCard = null;
    this.selectedIndex = null;
  }

  onResize() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();
    const isMobile = window.innerWidth < 768;

    // Raycasting for card hover
    if (!this.isDetailOpen) {
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const meshes = this.cards.map(c => c.mesh);
      const intersects = this.raycaster.intersectObjects(meshes);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        this.hoveredCard = hit.userData.index;
        this.container.style.cursor = 'pointer';
      } else {
        this.hoveredCard = null;
        this.container.style.cursor = this.isDragging ? 'grabbing' : 'grab';
      }
    }

    // Collective orbit rotation around Y axis
    this.currentRotationY += this.rotationVelocity;
    this.rotationVelocity *= 0.92; // Damping

    // Detail mode: smoothly align gallery orbit so selected card faces front center
    if (this.isDetailOpen && this.selectedCard) {
      const cardBasePos = this.selectedCard.targetPos;
      const targetAngleY = -Math.atan2(cardBasePos.x, cardBasePos.z);
      this.currentRotationY = THREE.MathUtils.lerp(this.currentRotationY, targetAngleY, 0.08);

      const cardY = cardBasePos.y;
      const distFromCenter = Math.sqrt(cardBasePos.x * cardBasePos.x + cardBasePos.z * cardBasePos.z);
      const zOffset = isMobile ? 8.0 : 3.8;

      this.targetCamPos.set(0, cardY, distFromCenter + zOffset);
      this.targetCamLookAt.set(0, cardY, distFromCenter);
    } else {
      // Normal Parallax Camera tilt with mouse
      const targetCamX = 0.75 * this.mouseNormalized.x;
      const targetCamY = -0.38 * this.mouseNormalized.y;

      this.targetCamPos.set(targetCamX, targetCamY, this.defaultCamPos.z);
      this.targetCamLookAt.set(0, 0, 0);
    }

    // Smooth camera lerp
    this.camera.position.lerp(this.targetCamPos, 0.05);
    this.currentCamLookAt.lerp(this.targetCamLookAt, 0.05);
    this.camera.lookAt(this.currentCamLookAt);

    // Orbit trigonometry
    const cosOrbit = Math.cos(this.currentRotationY);
    const sinOrbit = Math.sin(this.currentRotationY);

    // Cards positioning, billboarding, opacity & scale
    this.cards.forEach((card, i) => {
      // Calculate 3D orbit position around center Y axis
      const orbitedX = card.targetPos.x * cosOrbit + card.targetPos.z * sinOrbit;
      const orbitedZ = -card.targetPos.x * sinOrbit + card.targetPos.z * cosOrbit;
      const orbitedY = card.targetPos.y;

      // Idle vertical float bobbing
      const seed = card.seed;
      const floatY = (!this.isDetailOpen || this.selectedIndex !== i) 
        ? Math.sin(elapsedTime * 1.5 + seed) * 0.08 
        : 0;

      // Lerp position to destination
      card.mesh.position.x = THREE.MathUtils.lerp(card.mesh.position.x, orbitedX, 0.08);
      card.mesh.position.y = THREE.MathUtils.lerp(card.mesh.position.y, orbitedY + floatY, 0.08);
      card.mesh.position.z = THREE.MathUtils.lerp(card.mesh.position.z, orbitedZ, 0.08);

      // BILLBOARDING: Cards ALWAYS face directly towards the camera!
      // This physically prevents any roll or spinning on their own axis!
      card.mesh.quaternion.copy(this.camera.quaternion);

      // Opacity & Scale logic:
      // In default state: 100% full, rich, vibrant, saturated colors!
      // Only when hovered: the hovered card stays 100% opaque, others fade to pale translucent!
      if (this.isDetailOpen) {
        card.targetOpacity = (this.selectedIndex === i) ? 1.0 : 0.08;
        card.targetScale = (this.selectedIndex === i) ? 1.4 : 0.95;
      } else if (this.hoveredCard !== null) {
        card.targetOpacity = (this.hoveredCard === i) ? 1.0 : 0.35;
        card.targetScale = (this.hoveredCard === i) ? 1.16 : 1.0;
      } else {
        card.targetOpacity = 1.0;
        card.targetScale = 1.0;
      }

      // Smooth scale and opacity transitions
      const currentScale = THREE.MathUtils.lerp(card.mesh.scale.x, card.targetScale, 0.08);
      card.mesh.scale.set(currentScale, currentScale, currentScale);

      const currentOpacity = THREE.MathUtils.lerp(
        card.mesh.material.uniforms.opacity.value,
        card.targetOpacity,
        0.12
      );
      card.mesh.material.uniforms.opacity.value = currentOpacity;
      if (card.borderMesh) {
        card.borderMesh.material.opacity = currentOpacity * 0.45;
      }

      // Keep depthWrite enabled when opaque to ensure sharp card occlusion
      card.mesh.material.depthWrite = (card.targetOpacity >= 0.95 && currentOpacity >= 0.9);
    });

    // Paper particles falling animation
    this.paperParticles.forEach((p) => {
      p.y -= p.speed;
      p.x += 0.003 * Math.sin(elapsedTime * p.drift * 20);
      p.rotationZ += 0.2 * p.speed;
      p.rotationX += 0.1 * p.speed;

      // Loop when fallen below bottom
      if (p.y < -15) {
        p.y = 15;
        p.x = (Math.random() - 0.5) * 32;
        p.z = (Math.random() - 0.5) * 26;
      }

      p.mesh.position.set(p.x, p.y, p.z);
      p.mesh.rotation.set(p.rotationX, 0, p.rotationZ);
    });

    this.renderer.render(this.scene, this.camera);
  }
}
