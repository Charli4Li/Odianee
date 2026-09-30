/**
 * 3D Floating Gallery for ODIANEE
 * Replicating https://pahari.vercel.app/ 3D WebGL experience using Three.js & GSAP
 */

class FloatingGallery {
  constructor() {
    this.container = document.getElementById('canvas-container');
    this.canvas = document.getElementById('webgl-canvas');
    this.centerHero = document.querySelector('.center-hero');
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

    // Interaction variables
    this.isDragging = false;
    this.isDragMove = false;
    this.downPosition = { x: 0, y: 0 };
    this.previousMousePosition = { x: 0, y: 0 };
    this.rotationVelocity = 0;
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
    this.initLightsAndFog();
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
    this.renderer.outputEncoding = THREE.sRGBEncoding;

    // Main group holding all cards for collective rotation
    this.galleryGroup = new THREE.Group();
    this.scene.add(this.galleryGroup);
  }

  initLightsAndFog() {
    // Warm atmospheric fog
    this.scene.fog = new THREE.Fog(0xe8dcc5, 9, 35);

    // Warm ambient light
    const ambientLight = new THREE.AmbientLight(0xfff8ee, 1.2);
    this.scene.add(ambientLight);

    // Directional light from front-top
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 7);
    this.scene.add(dirLight);

    // Subtle fill light
    const fillLight = new THREE.DirectionalLight(0xe4d3b5, 0.5);
    fillLight.position.set(-5, -5, 5);
    this.scene.add(fillLight);
  }

  computeSpherePositions(count, radius = 5.0) {
    const positions = [];
    const phi = Math.PI * (3 - Math.sqrt(5)); // Golden angle (~2.39996 rad)
    for (let i = 0; i < count; i++) {
      const y = 1 - (i / (count - 1)) * 2; // from 1 down to -1
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
    const borderMaterial = new THREE.MeshBasicMaterial({
      color: 0x313927,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide
    });

    ARTS_DATA.forEach((item, index) => {
      // Main positioning group for lerping
      const mainGroup = new THREE.Group();
      const initialPos = this.spherePositions[index];
      mainGroup.position.copy(initialPos);

      // Float group for idle wave motion and orientation
      const floatGroup = new THREE.Group();
      mainGroup.add(floatGroup);

      // Card texture
      const texture = textureLoader.load(item.image);
      texture.generateMipmaps = true;
      texture.minFilter = THREE.LinearMipmapLinearFilter;

      const cardMaterial = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 1.0,
        side: THREE.DoubleSide
      });

      const cardMesh = new THREE.Mesh(cardGeometry, cardMaterial);
      cardMesh.userData = { id: item.id, item, index, parentCard: mainGroup };

      // Elegant dark border placard backing
      const borderMesh = new THREE.Mesh(borderGeometry, borderMaterial);
      borderMesh.position.z = -0.005;
      floatGroup.add(borderMesh);

      floatGroup.add(cardMesh);
      this.galleryGroup.add(mainGroup);

      this.cards.push({
        id: item.id,
        item,
        index,
        mainGroup,
        floatGroup,
        mesh: cardMesh,
        borderMesh,
        targetPos: initialPos.clone(),
        seed: Math.random() * 100,
        scaleMultiplier: 1.0
      });
    });
  }

  createPaperParticles() {
    const textureLoader = new THREE.TextureLoader();
    const textures = [
      textureLoader.load('assets/textures/paper-1.png'),
      textureLoader.load('assets/textures/paper-2.png')
    ];

    const particleCount = 100;
    this.particlesGroup = new THREE.Group();
    this.scene.add(this.particlesGroup);

    for (let i = 0; i < particleCount; i++) {
      const scale = 0.18 + Math.random() * 0.28;
      const geom = new THREE.PlaneGeometry(scale, scale);
      const mat = new THREE.MeshBasicMaterial({
        map: textures[Math.random() > 0.5 ? 0 : 1],
        transparent: true,
        opacity: 0.65 + Math.random() * 0.35,
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
        speed: 0.006 + Math.random() * 0.016,
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
        this.rotationVelocity += deltaX * 0.0025;
        this.previousMousePosition = { x: e.clientX, y: e.clientY };
      }
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

    // Mouse Wheel (Rotates gallery)
    window.addEventListener('wheel', (e) => {
      if (this.isDetailOpen) return;
      this.rotationVelocity += e.deltaY * 0.0006;
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
        this.rotationVelocity += deltaX * 0.003;
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
        gsap.fromTo('.detail-close-btn', { opacity: 0, y: -16 }, { opacity: 0.75, y: 0, duration: 0.4, ease: 'power3.out' });
        gsap.fromTo('.detail-title-col', { opacity: 0, y: 35 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out', delay: 0.1 });
        gsap.fromTo('.detail-desc-col', { opacity: 0, y: 35 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out', delay: 0.2 });
      }
    }

    // Dim non-selected cards
    this.cards.forEach((c, i) => {
      const isTarget = (i === index);
      if (window.gsap) {
        gsap.to(c.mesh.material, { opacity: isTarget ? 1.0 : 0.08, duration: 0.5 });
        gsap.to(c.borderMesh.material, { opacity: isTarget ? 0.2 : 0.02, duration: 0.5 });
      }
    });
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
    if (this.bottomControls) this.bottomControls.classList.remove('hidden-controls');

    // Restore all cards opacity and scale
    this.cards.forEach((c) => {
      c.scaleMultiplier = 1.0;
      if (window.gsap) {
        gsap.to(c.mesh.material, { opacity: 1.0, duration: 0.5 });
        gsap.to(c.borderMesh.material, { opacity: 0.12, duration: 0.5 });
      }
    });

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

    // Collective group rotation and inertia damping
    this.galleryGroup.rotation.y += this.rotationVelocity;
    this.rotationVelocity *= 0.92; // Damping

    // Camera target calculations
    if (this.isDetailOpen && this.selectedCard) {
      const cardLocalPos = this.selectedCard.targetPos;
      const cardY = cardLocalPos.y;
      const distFromCenter = Math.sqrt(cardLocalPos.x * cardLocalPos.x + cardLocalPos.z * cardLocalPos.z);

      // Camera zooms toward the card height
      const zOffset = isMobile ? 8.2 : 3.8;
      this.targetCamPos.set(0, cardY, distFromCenter + zOffset);
      this.targetCamLookAt.set(0, cardY, distFromCenter);

      // Rotate group so selected card faces front
      const targetAngleY = -Math.atan2(cardLocalPos.x, cardLocalPos.z);
      this.galleryGroup.rotation.y = THREE.MathUtils.lerp(this.galleryGroup.rotation.y, targetAngleY, 0.05);

      this.selectedCard.scaleMultiplier = THREE.MathUtils.lerp(this.selectedCard.scaleMultiplier, 1.35, 0.08);
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

    // Compute local camera position for child lookAt orientation
    const localCamPos = this.galleryGroup.worldToLocal(this.camera.position.clone());

    // Cards floating wave & orientation
    this.cards.forEach((card, i) => {
      // Lerp position to current view geometry (sphere / cylinder)
      card.mainGroup.position.lerp(card.targetPos, 0.08);

      // Idle floating bobbing motion
      const seed = card.seed;
      card.floatGroup.position.y = Math.sin(elapsedTime * 1.5 + seed) * 0.1;
      card.floatGroup.rotation.x = Math.cos(elapsedTime * 0.75 + seed) * 0.035;
      card.floatGroup.rotation.z = Math.sin(elapsedTime * 0.65 + seed) * 0.025;

      // Card faces the camera in local space!
      card.floatGroup.lookAt(localCamPos);

      // Hover scale
      const isHovered = (this.hoveredCard === i && !this.isDetailOpen);
      const targetScale = isHovered ? 1.15 : (this.isDetailOpen && this.selectedIndex === i ? 1.35 : 1.0);
      card.scaleMultiplier = THREE.MathUtils.lerp(card.scaleMultiplier, targetScale, 0.08);
      card.mainGroup.scale.set(card.scaleMultiplier, card.scaleMultiplier, card.scaleMultiplier);
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
