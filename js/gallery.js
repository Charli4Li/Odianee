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
    this.renderer.outputEncoding = THREE.sRGBEncoding;

    // Main group holding all cards for collective rotation
    this.galleryGroup = new THREE.Group();
    this.scene.add(this.galleryGroup);
  }

  initLights() {
    // Keep cards vibrant: no dense fog on card surfaces
    // Subtle background fog only for distant particles
    this.scene.fog = new THREE.Fog(0xe8dcc5, 25, 60);

    // Warm ambient light
    const ambientLight = new THREE.AmbientLight(0xfffdf7, 1.4);
    this.scene.add(ambientLight);

    // Directional light from front-top
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight.position.set(5, 10, 7);
    this.scene.add(dirLight);

    // Subtle fill light
    const fillLight = new THREE.DirectionalLight(0xe4d3b5, 0.6);
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

    ARTS_DATA.forEach((item, index) => {
      // Main positioning group for lerping to sphere/cylinder coordinates
      const mainGroup = new THREE.Group();
      const initialPos = this.spherePositions[index];
      mainGroup.position.copy(initialPos);

      // Float group for orientation & billboarding
      const floatGroup = new THREE.Group();
      mainGroup.add(floatGroup);

      // Card texture: high-resolution, vivid colors, fog disabled so cards stay crisp
      const texture = textureLoader.load(item.image);
      texture.generateMipmaps = true;
      texture.minFilter = THREE.LinearMipmapLinearFilter;

      const cardMaterial = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 1.0,
        fog: false, // Prevents fog from washing out cards
        side: THREE.DoubleSide
      });

      const borderMaterial = new THREE.MeshBasicMaterial({
        color: 0x313927,
        transparent: true,
        opacity: 0.15,
        fog: false,
        side: THREE.DoubleSide
      });

      const cardMesh = new THREE.Mesh(cardGeometry, cardMaterial);
      cardMesh.userData = { id: item.id, item, index, parentCard: mainGroup };

      // Placard border
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
        scaleMultiplier: 1.0,
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

    const particleCount = 90;
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

    // Mouse Wheel (Rotates gallery around Y axis)
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
      this.galleryGroup.rotation.y = THREE.MathUtils.lerp(this.galleryGroup.rotation.y, targetAngleY, 0.08);
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

    // Compute inverse quaternion of galleryGroup to align card orientations
    const groupWorldQuat = new THREE.Quaternion();
    this.galleryGroup.getWorldQuaternion(groupWorldQuat);
    const invGroupQuat = groupWorldQuat.clone().invert();

    // Cards floating wave, billboarding, opacity & orientation
    this.cards.forEach((card, i) => {
      // Lerp position to current view geometry (sphere / cylinder)
      card.mainGroup.position.lerp(card.targetPos, 0.08);

      // Determine target opacity & scale based on hover / detail state
      if (this.isDetailOpen) {
        // In detail view: selected card is full opacity, other cards fade to pale translucent
        card.targetOpacity = (this.selectedIndex === i) ? 1.0 : 0.08;
        card.targetScale = (this.selectedIndex === i) ? 1.35 : 0.95;
      } else if (this.hoveredCard !== null) {
        // Requirement 5: Hovered image stays full actual color and opacity;
        // Non-hovered images become translucent and pale!
        card.targetOpacity = (this.hoveredCard === i) ? 1.0 : 0.22;
        card.targetScale = (this.hoveredCard === i) ? 1.15 : 1.0;
      } else {
        // Requirement 5: When NO cursor hover, all images stay fully opaque and vivid!
        card.targetOpacity = 1.0;
        card.targetScale = 1.0;
      }

      // Orientation & Billboarding (Requirements 3 & 4)
      if (this.isDetailOpen && this.selectedIndex === i) {
        // Requirement 4: On click, card is 100% upright, flat, squarely facing the viewer (NO skew!)
        card.floatGroup.position.set(0, 0, 0);
        // Direct alignment with camera orientation:
        card.floatGroup.quaternion.copy(invGroupQuat.clone().multiply(this.camera.quaternion));
      } else {
        // Requirement 3: Stop spinning in their own axis!
        // Start from camera world orientation so cards directly point towards the user
        const targetWorldQuat = this.camera.quaternion.clone();

        // Natural subtle tilt (like reference website) and gentle breathing sway
        const seed = card.seed;
        const floatBob = Math.sin(elapsedTime * 1.4 + seed) * 0.08;
        card.floatGroup.position.y = floatBob;

        const tiltX = -0.06; // slight gentle tilt back
        const swayZ = Math.sin(elapsedTime * 0.9 + seed) * 0.02;
        const swayX = Math.cos(elapsedTime * 0.75 + seed) * 0.015;

        const tiltEuler = new THREE.Euler(tiltX + swayX, 0, swayZ, 'YXZ');
        const tiltQuat = new THREE.Quaternion().setFromEuler(tiltEuler);
        targetWorldQuat.multiply(tiltQuat);

        // Convert world orientation into galleryGroup local space
        card.floatGroup.quaternion.copy(invGroupQuat.clone().multiply(targetWorldQuat));
      }

      // Smoothly lerp scale & opacity
      card.scaleMultiplier = THREE.MathUtils.lerp(card.scaleMultiplier, card.targetScale, 0.08);
      card.mainGroup.scale.set(card.scaleMultiplier, card.scaleMultiplier, card.scaleMultiplier);

      card.mesh.material.opacity = THREE.MathUtils.lerp(card.mesh.material.opacity, card.targetOpacity, 0.12);
      card.borderMesh.material.opacity = THREE.MathUtils.lerp(card.borderMesh.material.opacity, card.targetOpacity * 0.15, 0.12);
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
