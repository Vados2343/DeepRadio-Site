export class GeometricVisualizer {
  constructor(analyser, canvas) {
    this.analyser = analyser;
    this.canvas = canvas;
   this.ctx = canvas.getContext('2d', { alpha: false, willReadFrequently: true });
    this.animationId = null;
    this.currentMode = 0;
    this.isEnabled = true;

    this.dataArray = null;
    this.bufferLength = null;

    if (this.analyser) {
      this.bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(this.bufferLength);
    } else {
      this.bufferLength = 128;
      this.dataArray = new Uint8Array(this.bufferLength);
    }

    this.theme = this.getTheme();

    this.modes = [
      this.drawHexagonGrid.bind(this),
      this.drawSpiralGalaxy.bind(this),
      this.drawCrystalFormation.bind(this),
      this.drawVoronoiCells.bind(this),
      this.drawNeuralNetwork.bind(this),
      this.drawSacredGeometry.bind(this),
      this.drawPulsingOrb.bind(this),
      this.drawKaleidoscope.bind(this)
    ];

    this.hexagons = [];
    this.neurons = [];
    this.crystals = [];
    this.voronoiPoints = [];
    this.orbParticles = [];
    this.time = 0;
    this.frameCount = 0;

    this.performanceMonitor = {
      fps: 60,
      frameTime: 0,
      lastFrameTime: performance.now(),
      adaptiveQuality: 1,
      targetFrameTime: 16.67
    };

    this.hexagonGrid = {
      spatial: new Map(),
      cellSize: 150,
      activeHexagons: new Set(),
      renderBatch: []
    };

    this.framesSinceFullClear = 0;
    this.fullClearInterval = 10000;
    this.fadeAccumulator = 0;
    this.isInitializing = false;

    this.handleResize = this.setupCanvas.bind(this);

    this.setupCanvas();
    this.animate();

    window.addEventListener('resize', this.handleResize);

    document.addEventListener('visualizer-mode-change', (e) => {
      this.currentMode = e.detail % this.modes.length;
      this.resetMode();
    });

    document.addEventListener('settings-change', (e) => {
      if (e.detail.key === 'visualizerEnabled') {
        this.isEnabled = e.detail.value;
        if (!this.isEnabled) {
          this.clearCanvas(true);
        }
      }
    });

    this.themeObserver = new MutationObserver(() => {
      this.theme = this.getTheme();
    });
    this.themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });
  }

  getTheme() {
    const theme = document.documentElement.dataset.theme || 'dark';
    return {
      isDark: theme === 'dark' || theme === 'oled',
      bgColor: theme === 'light' ? 'rgba(255, 255, 255, 1)' : 'rgba(0, 0, 0, 1)',
      bgFade: theme === 'light' ? 'rgba(255, 255, 255, ' : 'rgba(0, 0, 0, '
    };
  }

  getAudioData() {
    if (this.analyser && this.analyser.getByteFrequencyData) {
      this.analyser.getByteFrequencyData(this.dataArray);
    } else {
      const time = Date.now() * 0.001;
      for (let i = 0; i < this.bufferLength; i++) {
        this.dataArray[i] = Math.abs(Math.sin(time + i * 0.1)) * 100 +
                           Math.random() * 50 +
                           Math.sin(time * 2 + i * 0.05) * 30;
      }
    }
  }

  updatePerformance() {
    const now = performance.now();
    const delta = now - this.performanceMonitor.lastFrameTime;
    this.performanceMonitor.lastFrameTime = now;

    this.performanceMonitor.frameTime = this.performanceMonitor.frameTime * 0.9 + delta * 0.1;
    this.performanceMonitor.fps = 1000 / this.performanceMonitor.frameTime;

    if (this.performanceMonitor.frameTime > 20) {
      this.performanceMonitor.adaptiveQuality *= 0.95;
    } else if (this.performanceMonitor.frameTime < 14 && this.performanceMonitor.adaptiveQuality < 1) {
      this.performanceMonitor.adaptiveQuality *= 1.02;
    }

    this.performanceMonitor.adaptiveQuality = Math.max(0.3, Math.min(1, this.performanceMonitor.adaptiveQuality));
  }

  initAudio() {
    if (this.source || !this.audio) return;

    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.85;

      this.bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(this.bufferLength);

      if (!this.audio._sourceConnected) {
        this.source = this.audioContext.createMediaElementSource(this.audio);
        this.audio._sourceConnected = true;
      }

      this.source.connect(this.analyser);
      this.analyser.connect(this.audioContext.destination);
    } catch (error) {
      console.error('Audio init error:', error);
    }
  }

  setupCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.resetMode();
  }

  clearCanvas(full = false) {
    if (full) {
      this.ctx.fillStyle = this.theme.bgColor;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.fadeAccumulator = 0;
      return;
    }

    this.fadeAccumulator++;

    if (this.fadeAccumulator > 100) {
      this.fadeAccumulator = 0;
      const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
      const data = imageData.data;
      const isDark = this.theme.isDark;

      for (let i = 0; i < data.length; i += 4) {
        if (isDark) {
          data[i] *= 0.98;
          data[i + 1] *= 0.98;
          data[i + 2] *= 0.98;
        } else {
          data[i] = Math.min(255, data[i] + 3);
          data[i + 1] = Math.min(255, data[i + 1] + 3);
          data[i + 2] = Math.min(255, data[i + 2] + 3);
        }
      }

      this.ctx.putImageData(imageData, 0, 0);
    } else {
      const fadeAlpha = this.getAdaptiveFadeAlpha() * 0.7;
      this.ctx.fillStyle = this.theme.bgFade + fadeAlpha + ')';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  getAdaptiveFadeAlpha() {
    const fadeSettings = {
      0: 0.04,
      1: 0.03,
      2: 0.05,
      3: 0.02,
      4: 0.03,
      5: 0.04,
      6: 0.05,
      7: 0.01
    };

    return fadeSettings[this.currentMode] || 0.04;
  }

  resetMode() {
    this.clearCanvas(true);

    this.hexagons = [];
    this.neurons = [];
    this.crystals = [];
    this.voronoiPoints = [];
    this.orbParticles = [];
    this.time = 0;
    this.frameCount = 0;
    this.fadeAccumulator = 0;
    this.isInitializing = false;
    this.hexagonGrid.spatial.clear();
    this.hexagonGrid.activeHexagons.clear();

    switch(this.currentMode) {
      case 0:
        requestAnimationFrame(() => this.initHexagonGrid());
        break;
      case 1: this.initSpiralGalaxy(); break;
      case 2: this.initCrystalFormation(); break;
      case 3: this.initVoronoiCells(); break;
      case 4: this.initNeuralNetwork(); break;
      case 7: this.initKaleidoscope(); break;
    }
  }

  animate() {
    this.animationId = requestAnimationFrame(() => this.animate());

    if (!this.isEnabled) {
      this.clearCanvas(true);
      return;
    }

    this.updatePerformance();
    this.getAudioData();

    if (this.currentMode === 0 && this.isInitializing && this.frameCount < 5) {
      this.frameCount++;
      return;
    }

    this.clearCanvas(false);

    if (this.modes[this.currentMode]) {
      this.ctx.save();

      try {
        this.modes[this.currentMode]();
      } catch (error) {
        console.error('Visualization error:', error);
      }

      this.ctx.restore();
    }

    this.time++;
    this.frameCount++;
  }

  getSpatialKey(x, y) {
    const cellX = Math.floor(x / this.hexagonGrid.cellSize);
    const cellY = Math.floor(y / this.hexagonGrid.cellSize);
    return `${cellX},${cellY}`;
  }

  addToSpatialGrid(hex) {
    const key = this.getSpatialKey(hex.x, hex.y);
    if (!this.hexagonGrid.spatial.has(key)) {
      this.hexagonGrid.spatial.set(key, []);
    }
    this.hexagonGrid.spatial.get(key).push(hex);
  }

  getNearbyHexagons(hex, radius) {
    const nearby = [];
    const cellRadius = Math.ceil(radius / this.hexagonGrid.cellSize);
    const centerX = Math.floor(hex.x / this.hexagonGrid.cellSize);
    const centerY = Math.floor(hex.y / this.hexagonGrid.cellSize);

    for (let dx = -cellRadius; dx <= cellRadius; dx++) {
      for (let dy = -cellRadius; dy <= cellRadius; dy++) {
        const key = `${centerX + dx},${centerY + dy}`;
        const cellHexagons = this.hexagonGrid.spatial.get(key);
        if (cellHexagons) {
          nearby.push(...cellHexagons);
        }
      }
    }
    return nearby;
  }

  initHexagonGrid() {
    this.isInitializing = true;
    const quality = this.performanceMonitor.adaptiveQuality;
    const baseSize = 60;
    const size = baseSize;
    const spacingX = size * Math.sqrt(3);
    const spacingY = size * 1.5;

    const cols = Math.ceil(this.canvas.width / spacingX) + 2;
    const rows = Math.ceil(this.canvas.height / spacingY) + 2;

    const totalHexagons = cols * rows;
    const batchSize = 50;
    let currentIndex = 0;

    const createBatch = () => {
      const endIndex = Math.min(currentIndex + batchSize, totalHexagons);

      for (let i = currentIndex; i < endIndex; i++) {
        const row = Math.floor(i / cols) - 1;
        const col = (i % cols) - 1;

        const x = col * spacingX + (row % 2) * spacingX / 2;
        const y = row * spacingY;

        if (x > -size * 2 && x < this.canvas.width + size * 2 &&
            y > -size * 2 && y < this.canvas.height + size * 2) {
          const hex = {
            x, y, size,
            energy: 0,
            targetEnergy: 0,
            hue: Math.random() * 360,
            phase: Math.random() * Math.PI * 2,
            index: this.hexagons.length,
            fadeIn: 0
          };
          this.hexagons.push(hex);
          this.addToSpatialGrid(hex);
        }
      }

      currentIndex = endIndex;

      if (currentIndex < totalHexagons) {
        requestAnimationFrame(createBatch);
      } else {
        this.isInitializing = false;
      }
    };

    requestAnimationFrame(createBatch);
  }

  drawHexagonGrid() {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const waveSpeed = this.time * 0.02;
    const quality = this.performanceMonitor.adaptiveQuality;

    this.hexagonGrid.activeHexagons.clear();
    this.hexagonGrid.renderBatch = [];

    const maxHexagons = Math.floor(this.hexagons.length * (0.5 + quality * 0.5));
    let processedCount = 0;

    for (let i = 0; i < this.hexagons.length && processedCount < maxHexagons; i++) {
      const hex = this.hexagons[i];

      if (hex.fadeIn < 1) {
        hex.fadeIn = Math.min(1, hex.fadeIn + 0.02);
      }

      if (quality < 0.5 && i % 2 === 0) continue;

      const dataIndex = i % this.bufferLength;
      const amp = this.dataArray[dataIndex] / 255;

      const distFromCenter = Math.sqrt((hex.x - centerX) ** 2 + (hex.y - centerY) ** 2);
      const waveOffset = Math.sin(waveSpeed - distFromCenter * 0.01) * 0.5 + 0.5;

      hex.targetEnergy = amp * (1 + waveOffset);
      hex.energy = hex.energy * 0.9 + hex.targetEnergy * 0.1;
      hex.hue = (hex.hue + amp * 2 + waveOffset) % 360;

      if (hex.energy > 0.05 && hex.fadeIn > 0.1) {
        this.hexagonGrid.activeHexagons.add(hex);
        this.hexagonGrid.renderBatch.push(hex);
        processedCount++;
      }
    }

    this.ctx.save();

    if (quality > 0.7) {
      this.ctx.shadowBlur = 10 * quality;
    }

    this.hexagonGrid.renderBatch.forEach(hex => {
      this.ctx.save();
      this.ctx.translate(hex.x, hex.y);

      const scale = (0.8 + hex.energy * 0.5) * hex.fadeIn;
      this.ctx.scale(scale, scale);
      this.ctx.rotate(this.time * 0.003 + hex.phase);

      const alpha = hex.energy * hex.fadeIn * quality;

      this.ctx.strokeStyle = `hsla(${hex.hue}, 100%, ${50 + hex.energy * 40}%, ${alpha})`;
      this.ctx.lineWidth = 2 * quality;

      if (quality > 0.6) {
        this.ctx.shadowColor = `hsla(${hex.hue}, 100%, 50%, ${alpha * 0.5})`;
      }

      this.ctx.beginPath();
      for (let j = 0; j < 6; j++) {
        const angle = (Math.PI / 3) * j;
        const x = Math.cos(angle) * hex.size;
        const y = Math.sin(angle) * hex.size;
        if (j === 0) this.ctx.moveTo(x, y);
        else this.ctx.lineTo(x, y);
      }
      this.ctx.closePath();
      this.ctx.stroke();

      if (hex.energy > 0.2 && quality > 0.5) {
        this.ctx.fillStyle = `hsla(${hex.hue}, 100%, 50%, ${alpha * 0.1})`;
        this.ctx.fill();
      }

      if (hex.energy > 0.4 && quality > 0.6) {
        const pulseSize = 2 + Math.sin(this.time * 0.1 + hex.phase) * 1.5;
        this.ctx.fillStyle = `hsla(${hex.hue + 180}, 100%, 80%, ${alpha})`;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, pulseSize, 0, Math.PI * 2);
        this.ctx.fill();
      }

      this.ctx.restore();
    });

    this.ctx.restore();
    this.ctx.shadowBlur = 0;

    if (quality > 0.3 && !this.isInitializing) {
      const maxConnections = Math.floor(30 * quality);
      let connectionCount = 0;

      const activeArray = Array.from(this.hexagonGrid.activeHexagons);

      for (let i = 0; i < activeArray.length && connectionCount < maxConnections; i++) {
        const hex1 = activeArray[i];
        if (hex1.energy < 0.3) continue;

        for (let j = i + 1; j < activeArray.length && connectionCount < maxConnections; j++) {
          const hex2 = activeArray[j];
          if (hex2.energy < 0.3) continue;

          const dist = Math.sqrt((hex1.x - hex2.x) ** 2 + (hex1.y - hex2.y) ** 2);
          if (dist < 100 && dist > 20) {
            const alpha = (1 - dist / 100) * Math.min(hex1.energy, hex2.energy) * 0.3 * quality;
            this.ctx.strokeStyle = `hsla(${(hex1.hue + hex2.hue) / 2}, 100%, 60%, ${alpha})`;
            this.ctx.lineWidth = 0.5;
            this.ctx.beginPath();
            this.ctx.moveTo(hex1.x, hex1.y);
            this.ctx.lineTo(hex2.x, hex2.y);
            this.ctx.stroke();
            connectionCount++;
          }
        }
      }
    }
  }

  initSpiralGalaxy() {
    const arms = 4;
    const particlesPerArm = 50;

    for (let arm = 0; arm < arms; arm++) {
      const armAngle = (arm / arms) * Math.PI * 2;

      for (let i = 0; i < particlesPerArm; i++) {
        const distance = (i / particlesPerArm) * Math.min(this.canvas.width, this.canvas.height) * 0.4;
        const angle = armAngle + (i / particlesPerArm) * Math.PI * 4;
        const spread = Math.random() * 50 - 25;

        this.hexagons.push({
          baseAngle: angle,
          distance: distance,
          spread: spread,
          size: Math.random() * 3 + 1,
          speed: Math.random() * 0.02 + 0.01,
          hue: arm * 90
        });
      }
    }
  }

  drawSpiralGalaxy() {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;

    this.ctx.save();
    this.ctx.translate(centerX, centerY);
    this.ctx.rotate(this.time * 0.001);

    this.hexagons.forEach((star, i) => {
      const dataIndex = Math.floor((star.distance / 400) * this.bufferLength) % this.bufferLength;
      const amp = this.dataArray[dataIndex] / 255;

      const angle = star.baseAngle + this.time * star.speed;
      const r = star.distance + amp * 50;

      const x = Math.cos(angle) * r + Math.sin(angle) * star.spread;
      const y = Math.sin(angle) * r + Math.cos(angle) * star.spread;

      const brightness = 50 + amp * 50;
      const size = star.size + amp * 3;

      this.ctx.fillStyle = `hsla(${star.hue + this.time * 0.1}, 100%, ${brightness}%, ${0.8 + amp * 0.2})`;
      this.ctx.shadowBlur = size * 2;
      this.ctx.shadowColor = `hsl(${star.hue}, 100%, 50%)`;

      this.ctx.beginPath();
      this.ctx.arc(x, y, size, 0, Math.PI * 2);
      this.ctx.fill();
    });

    this.ctx.restore();
    this.ctx.shadowBlur = 0;
  }

  initCrystalFormation() {
    const count = 8;
    for (let i = 0; i < count; i++) {
      this.crystals.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        size: Math.random() * 40 + 30,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.02,
        faces: Math.floor(Math.random() * 3 + 5),
        hue: Math.random() * 60 + 180,
        energy: 0,
        pulsePhase: Math.random() * Math.PI * 2,
        shardAngles: []
      });
    }

    this.crystals.forEach(crystal => {
      for (let i = 0; i < crystal.faces; i++) {
        crystal.shardAngles.push(Math.random() * Math.PI * 2);
      }
    });
  }

  drawCrystalFormation() {
    this.crystals.forEach((crystal, i) => {
      const dataIndex = i % this.bufferLength;
      const amp = this.dataArray[dataIndex] / 255;

      crystal.energy = crystal.energy * 0.9 + amp * 0.1;
      crystal.rotation += crystal.rotSpeed * (1 + amp * 3);
      crystal.pulsePhase += 0.05 + amp * 0.1;

      const pulse = Math.sin(crystal.pulsePhase) * 0.2 + 1;
      const energyPulse = 1 + crystal.energy * 0.3 * pulse;

      const orbitRadius = 50 + i * 20;
      const orbitSpeed = 0.005 + i * 0.002;
      crystal.x = this.canvas.width / 2 + Math.cos(this.time * orbitSpeed) * orbitRadius;
      crystal.y = this.canvas.height / 2 + Math.sin(this.time * orbitSpeed) * orbitRadius;

      this.ctx.save();
      this.ctx.translate(crystal.x, crystal.y);
      this.ctx.rotate(crystal.rotation);
      this.ctx.scale(energyPulse, energyPulse);

      const glowGradient = this.ctx.createRadialGradient(0, 0, crystal.size * 0.5, 0, 0, crystal.size * 1.5);
      glowGradient.addColorStop(0, `hsla(${crystal.hue}, 100%, 60%, ${crystal.energy * 0.3})`);
      glowGradient.addColorStop(1, `hsla(${crystal.hue}, 100%, 40%, 0)`);

      this.ctx.fillStyle = glowGradient;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, crystal.size * 1.5, 0, Math.PI * 2);
      this.ctx.fill();

      for (let j = 0; j < crystal.faces; j++) {
        const angle1 = (j / crystal.faces) * Math.PI * 2;
        const angle2 = ((j + 1) / crystal.faces) * Math.PI * 2;

        const shardOffset = Math.sin(this.time * 0.03 + crystal.shardAngles[j]) * crystal.energy * 15;
        const radius = crystal.size + shardOffset;

        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(Math.cos(angle1) * radius, Math.sin(angle1) * radius);
        this.ctx.lineTo(Math.cos(angle2) * radius, Math.sin(angle2) * radius);
        this.ctx.closePath();

        const faceBrightness = 40 + crystal.energy * 50 + j * 8;
        const faceHue = crystal.hue + j * 15 + this.time * 0.3;

        this.ctx.fillStyle = `hsla(${faceHue}, 100%, ${faceBrightness}%, ${0.2 + crystal.energy * 0.5})`;
        this.ctx.fill();

        this.ctx.strokeStyle = `hsla(${crystal.hue + this.time * 0.5}, 100%, ${60 + crystal.energy * 30}%, ${0.9})`;
        this.ctx.lineWidth = 1.5 + crystal.energy * 2;
        this.ctx.shadowBlur = crystal.energy * 25;
        this.ctx.shadowColor = `hsl(${crystal.hue}, 100%, 50%)`;
        this.ctx.stroke();

        if (crystal.energy > 0.4) {
          const innerRadius = radius * 0.5;
          const centerOffset = Math.sin(this.time * 0.05 + j) * 10;

          this.ctx.strokeStyle = `hsla(${faceHue + 60}, 100%, 80%, ${crystal.energy * 0.7})`;
          this.ctx.lineWidth = 1;
          this.ctx.beginPath();
          this.ctx.moveTo(centerOffset, centerOffset);
          this.ctx.lineTo(Math.cos(angle1) * innerRadius, Math.sin(angle1) * innerRadius);
          this.ctx.lineTo(Math.cos(angle2) * innerRadius, Math.sin(angle2) * innerRadius);
          this.ctx.closePath();
          this.ctx.stroke();
        }
      }

      const coreGradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, crystal.size * 0.4 * pulse);
      coreGradient.addColorStop(0, `hsla(${crystal.hue}, 100%, 90%, ${crystal.energy})`);
      coreGradient.addColorStop(0.5, `hsla(${crystal.hue}, 100%, 70%, ${crystal.energy * 0.7})`);
      coreGradient.addColorStop(1, `hsla(${crystal.hue}, 100%, 50%, ${crystal.energy * 0.3})`);

      this.ctx.fillStyle = coreGradient;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, crystal.size * 0.4 * pulse, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.fillStyle = `hsla(${crystal.hue + 180}, 100%, 95%, ${crystal.energy * 0.8})`;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, crystal.size * 0.15 * pulse, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.restore();
    });

    this.ctx.shadowBlur = 0;
  }

  initVoronoiCells() {
    const count = 15;
    for (let i = 0; i < count; i++) {
      this.voronoiPoints.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        hue: Math.random() * 360,
        energy: 0
      });
    }
  }

  drawVoronoiCells() {
    this.voronoiPoints.forEach((point, i) => {
      const dataIndex = i % this.bufferLength;
      const amp = this.dataArray[dataIndex] / 255;

      point.energy = point.energy * 0.9 + amp * 0.1;

      point.x += point.vx * 0.5 + amp;
      point.y += point.vy * 0.5 + amp;

      if (point.x < 0 || point.x > this.canvas.width) point.vx *= -1;
      if (point.y < 0 || point.y > this.canvas.height) point.vy *= -1;

      point.x = Math.max(0, Math.min(this.canvas.width, point.x));
      point.y = Math.max(0, Math.min(this.canvas.height, point.y));
    });

    this.voronoiPoints.forEach((point, i) => {
      if (point.energy > 0.1) {
        const radius = 150 + point.energy * 200;
        const gradient = this.ctx.createRadialGradient(
          point.x, point.y, 0,
          point.x, point.y, radius
        );

        const alpha = point.energy * 0.4;
        const hueShift = this.time * 0.5 + point.y * 0.1;

        gradient.addColorStop(0, `hsla(${point.hue + hueShift}, 70%, 50%, ${alpha * 0.8})`);
        gradient.addColorStop(0.5, `hsla(${point.hue + hueShift + 15}, 60%, 65%, ${alpha * 0.2})`);
        gradient.addColorStop(1, `hsla(${point.hue + hueShift + 30}, 50%, 30%, 0)`);

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(point.x - radius, point.y - radius, radius * 2, radius * 2);
      }
    });

    this.voronoiPoints.forEach(point => {
      if (point.energy > 0.2) {
        this.ctx.fillStyle = `hsla(${point.hue}, 100%, 70%, ${point.energy * 0.8})`;
        this.ctx.shadowBlur = point.energy * 15;
        this.ctx.shadowColor = `hsl(${point.hue}, 100%, 50%)`;
        this.ctx.beginPath();
        this.ctx.arc(point.x, point.y, 2 + point.energy * 5, 0, Math.PI * 2);
        this.ctx.fill();
      }
    });

    this.ctx.shadowBlur = 0;
  }

  initNeuralNetwork() {
    const layers = [3, 5, 6, 5, 3];
    const layerSpacing = this.canvas.width / (layers.length + 1);

    layers.forEach((count, layerIndex) => {
      const x = layerSpacing * (layerIndex + 1);
      const spacing = this.canvas.height / (count + 1);

      for (let i = 0; i < count; i++) {
        const y = spacing * (i + 1);
        this.neurons.push({
          x, y,
          layer: layerIndex,
          index: i,
          energy: 0,
          connections: []
        });
      }
    });

    for (let i = 0; i < layers.length - 1; i++) {
      const currentLayer = this.neurons.filter(n => n.layer === i);
      const nextLayer = this.neurons.filter(n => n.layer === i + 1);

      currentLayer.forEach(neuron => {
        nextLayer.forEach(nextNeuron => {
          if (Math.random() > 0.5) {
            neuron.connections.push(nextNeuron);
          }
        });
      });
    }
  }

  drawNeuralNetwork() {
    this.neurons.forEach((neuron, i) => {
      const dataIndex = (neuron.layer * 20 + neuron.index * 5) % this.bufferLength;
      const amp = this.dataArray[dataIndex] / 255;

      neuron.energy = neuron.energy * 0.85 + amp * 0.15;
    });

    this.neurons.forEach(neuron => {
      neuron.connections.forEach(target => {
        const energy = (neuron.energy + target.energy) / 2;

        if (energy > 0.15) {
          this.ctx.strokeStyle = `hsla(${180 + energy * 180}, 100%, 50%, ${energy * 0.6})`;
          this.ctx.lineWidth = energy * 4;
          this.ctx.shadowBlur = energy * 15;
          this.ctx.shadowColor = `hsl(${180 + energy * 180}, 100%, 50%)`;

          this.ctx.beginPath();
          this.ctx.moveTo(neuron.x, neuron.y);

          const cx = (neuron.x + target.x) / 2;
          const cy = (neuron.y + target.y) / 2 + Math.sin(this.time * 0.02) * 30;

          this.ctx.quadraticCurveTo(cx, cy, target.x, target.y);
          this.ctx.stroke();
        }
      });
    });

    this.neurons.forEach(neuron => {
      if (neuron.energy > 0.1) {
        const size = 8 + neuron.energy * 15;

        this.ctx.fillStyle = `hsla(${200 + neuron.layer * 30}, 100%, ${50 + neuron.energy * 30}%, ${0.8})`;
        this.ctx.shadowBlur = neuron.energy * 30;
        this.ctx.shadowColor = `hsl(${200 + neuron.layer * 30}, 100%, 50%)`;

        this.ctx.beginPath();
        this.ctx.arc(neuron.x, neuron.y, size, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = `hsla(${200 + neuron.layer * 30}, 100%, 80%, ${neuron.energy})`;
        this.ctx.beginPath();
        this.ctx.arc(neuron.x, neuron.y, size * 0.4, 0, Math.PI * 2);
        this.ctx.fill();
      }
    });

    this.ctx.shadowBlur = 0;
  }

  drawSacredGeometry() {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const baseRadius = Math.min(centerX, centerY) * 0.4;

    const avgAmp = this.dataArray.reduce((a, b) => a + b) / this.bufferLength / 255;

    this.ctx.save();
    this.ctx.translate(centerX, centerY);
    this.ctx.rotate(this.time * 0.002);

    for (let ring = 0; ring < 3; ring++) {
      const radius = baseRadius * (0.5 + ring * 0.3);
      const count = 6 + ring * 3;

      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        const dataIndex = (ring * count + i) % this.bufferLength;
        const amp = this.dataArray[dataIndex] / 255;

        const size = 30 + amp * 50;
        const hue = (ring * 120 + i * 30 + this.time * 0.5) % 360;

        this.ctx.strokeStyle = `hsla(${hue}, 100%, ${50 + amp * 30}%, ${0.6 + amp * 0.4})`;
        this.ctx.lineWidth = 2 + amp * 3;
        this.ctx.shadowBlur = amp * 20;
        this.ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;

        this.ctx.beginPath();
        this.ctx.arc(x, y, size, 0, Math.PI * 2);
        this.ctx.stroke();
      }
    }

    const segments = 12;
    for (let i = 0; i < segments; i++) {
      const angle1 = (i / segments) * Math.PI * 2;
      const angle2 = ((i + 1) / segments) * Math.PI * 2;

      const dataIndex = i % this.bufferLength;
      const amp = this.dataArray[dataIndex] / 255;

      const r = baseRadius * 0.3 + amp * 100;

      this.ctx.fillStyle = `hsla(${i * 30 + this.time}, 100%, 50%, ${0.3 + amp * 0.5})`;

      this.ctx.beginPath();
      this.ctx.moveTo(0, 0);
      this.ctx.arc(0, 0, r, angle1, angle2);
      this.ctx.closePath();
      this.ctx.fill();
    }

    this.ctx.restore();
    this.ctx.shadowBlur = 0;
  }

  drawPulsingOrb() {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const maxRadius = Math.min(centerX, centerY) * 0.8;

    const bass = this.dataArray.slice(0, 10).reduce((a, b) => a + b) / 10 / 255;
    const mid = this.dataArray.slice(10, 100).reduce((a, b) => a + b) / 90 / 255;
    const treble = this.dataArray.slice(100, 200).reduce((a, b) => a + b) / 100 / 255;

    if (bass > 0.7 && this.orbParticles.length < 30) {
      for (let i = 0; i < 2; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 3;
        this.orbParticles.push({
          x: centerX,
          y: centerY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          size: Math.random() * 4 + 2,
          hue: Math.random() * 60 + 280
        });
      }
    }

    this.orbParticles = this.orbParticles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.01;
      p.vx *= 0.98;
      p.vy *= 0.98;

      if (p.life > 0) {
        this.ctx.fillStyle = `hsla(${p.hue}, 100%, 50%, ${p.life})`;
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = `hsl(${p.hue}, 100%, 50%)`;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fill();
        return true;
      }
      return false;
    });

    const layers = 4;
    for (let layer = layers; layer > 0; layer--) {
      const layerRatio = layer / layers;
      const radius = maxRadius * layerRatio * (0.5 + bass * 0.5);

      const gradient = this.ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, radius
      );

      const hue = (this.time * 0.5 + layer * 60) % 360;
      const alpha = 0.1 + mid * 0.2;

      gradient.addColorStop(0, `hsla(${hue}, 100%, 70%, ${alpha})`)
      gradient.addColorStop(0.5, `hsla(${hue + 30}, 100%, 50%, ${alpha * 0.5})`);
      gradient.addColorStop(1, `hsla(${hue + 60}, 100%, 30%, 0)`);

      this.ctx.fillStyle = gradient;
      this.ctx.shadowBlur = 30;
      this.ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;

      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      this.ctx.fill();
    }

    for (let i = 0; i < 2; i++) {
      const ringRadius = maxRadius * (0.6 + i * 0.2) + treble * 50;
      const ringHue = (this.time + i * 180) % 360;

      this.ctx.strokeStyle = `hsla(${ringHue}, 100%, 50%, ${0.3 + treble * 0.5})`;
      this.ctx.lineWidth = 2 + treble * 5;
      this.ctx.shadowBlur = treble * 30;
      this.ctx.shadowColor = `hsl(${ringHue}, 100%, 50%)`;

      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
      this.ctx.stroke();
    }

    this.ctx.shadowBlur = 0;
  }

  initKaleidoscope() {
    this.kaleidoscopeSegments = 8;
  }

  drawKaleidoscope() {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const maxRadius = Math.min(centerX, centerY);

    this.ctx.save();
    this.ctx.translate(centerX, centerY);

    this.ctx.rotate(this.time * 0.003);

    const segments = this.kaleidoscopeSegments;
    const angleStep = (Math.PI * 2) / segments;

    for (let seg = 0; seg < segments; seg++) {
      this.ctx.save();
      this.ctx.rotate(angleStep * seg);

      if (seg % 2 === 1) {
        this.ctx.scale(1, -1);
      }

      this.ctx.beginPath();
      this.ctx.moveTo(0, 0);
      this.ctx.arc(0, 0, maxRadius, 0, angleStep);
      this.ctx.closePath();
      this.ctx.clip();

      for (let layer = 0; layer < 3; layer++) {
        const layerOffset = layer * 50;
        const layerScale = 1 - layer * 0.2;

        for (let i = 0; i < 25; i++) {
          const dataIndex = (seg * 25 + i + layer * 10) % this.bufferLength;
          const amp = this.dataArray[dataIndex] / 255;

          if (amp > 0.05) {
            const r = 30 + i * 18 + amp * 80 + layerOffset;
            const angle = (i / 25) * angleStep + this.time * 0.01 * (1 + layer * 0.5);
            const wobble = Math.sin(this.time * 0.05 + i + layer) * 10 * amp;

            const x = Math.cos(angle) * (r + wobble);
            const y = Math.sin(angle) * (r + wobble);

            const hue = (seg * 45 + i * 8 + this.time * 0.5 + layer * 60) % 360;
            const size = (3 + amp * 15) * layerScale;

            const shapeType = (seg + i + layer) % 4;

            this.ctx.fillStyle = `hsla(${hue}, 100%, ${50 + amp * 40}%, ${amp * (1 - layer * 0.3)})`;
            this.ctx.strokeStyle = `hsla(${hue + 180}, 100%, 60%, ${amp * 0.5})`;
            this.ctx.lineWidth = 1 + amp * 2;

            switch (shapeType) {
              case 0:
                this.ctx.beginPath();
                this.ctx.arc(x, y, size, 0, Math.PI * 2);
                this.ctx.fill();
                if (amp > 0.3) this.ctx.stroke();
                break;

              case 1:
                this.ctx.save();
                this.ctx.translate(x, y);
                this.ctx.rotate(angle + this.time * 0.05);
                this.ctx.beginPath();
                this.ctx.moveTo(0, -size);
                this.ctx.lineTo(-size * 0.866, size * 0.5);
                this.ctx.lineTo(size * 0.866, size * 0.5);
                this.ctx.closePath();
                this.ctx.fill();
                if (amp > 0.3) this.ctx.stroke();
                this.ctx.restore();
                break;

              case 2:
                this.ctx.save();
                this.ctx.translate(x, y);
                this.ctx.rotate(angle + this.time * 0.03);
                this.ctx.fillRect(-size/2, -size/2, size, size);
                if (amp > 0.3) this.ctx.strokeRect(-size/2, -size/2, size, size);
                this.ctx.restore();
                break;

              case 3:
                this.ctx.save();
                this.ctx.translate(x, y);
                this.ctx.rotate(angle + this.time * 0.04);
                this.ctx.beginPath();
                for (let j = 0; j < 5; j++) {
                  const starAngle = (j / 5) * Math.PI * 2 - Math.PI / 2;
                  const innerAngle = ((j + 0.5) / 5) * Math.PI * 2 - Math.PI / 2;
                  if (j === 0) {
                    this.ctx.moveTo(Math.cos(starAngle) * size, Math.sin(starAngle) * size);
                  } else {
                    this.ctx.lineTo(Math.cos(starAngle) * size, Math.sin(starAngle) * size);
                  }
                  this.ctx.lineTo(Math.cos(innerAngle) * size * 0.5, Math.sin(innerAngle) * size * 0.5);
                }
                this.ctx.closePath();
                this.ctx.fill();
                if (amp > 0.3) this.ctx.stroke();
                this.ctx.restore();
                break;
            }

            if (i > 0 && amp > 0.5 && Math.random() > 0.7) {
              const prevIndex = (seg * 25 + i - 1) % this.bufferLength;
              const prevAmp = this.dataArray[prevIndex] / 255;
              if (prevAmp > 0.5) {
                const prevR = 30 + (i - 1) * 18 + prevAmp * 80 + layerOffset;
                const prevAngle = ((i - 1) / 25) * angleStep + this.time * 0.01 * (1 + layer * 0.5);
                const prevX = Math.cos(prevAngle) * prevR;
                const prevY = Math.sin(prevAngle) * prevR;

                this.ctx.strokeStyle = `hsla(${hue}, 100%, 70%, ${amp * 0.3})`;
                this.ctx.lineWidth = 1;
                this.ctx.beginPath();
                this.ctx.moveTo(prevX, prevY);
                this.ctx.lineTo(x, y);
                this.ctx.stroke();
              }
            }
          }
        }
      }

      this.ctx.restore();
    }

    this.ctx.restore();
  }

  nextMode() {
    this.currentMode = (this.currentMode + 1) % this.modes.length;
    this.resetMode();
  }

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    if (this.handleResize) {
      window.removeEventListener('resize', this.handleResize);
    }

    if (this.themeObserver) {
      this.themeObserver.disconnect();
    }

    if (this.ctx) {
      this.ctx.globalAlpha = 1;
      this.ctx.fillStyle = this.theme.bgColor;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    this.hexagons = [];
    this.neurons = [];
    this.crystals = [];
    this.voronoiPoints = [];
    this.orbParticles = [];
    this.dataArray = null;
    this.bufferLength = null;
    this.hexagonGrid.spatial.clear();
    this.hexagonGrid.activeHexagons.clear();
    this.isInitializing = false;
  }
}

export default GeometricVisualizer;