export class OrganicVisualizer {
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
      this.drawFluidSimulation.bind(this),
      this.drawAuroraWaves.bind(this),
      this.drawLavaLamp.bind(this),
      this.drawMagneticField.bind(this),
      this.drawSmokeTrails.bind(this),
      this.drawLightningStorm.bind(this),
      this.drawOceanDepths.bind(this),
      this.drawCosmicDust.bind(this)
    ];

    this.fluidParticles = [];
    this.auroraPoints = [];
    this.lavaBlobs = [];
    this.magneticLines = [];
    this.magneticSources = [];
    this.smokeParticles = [];
    this.lightningBolts = [];
    this.oceanWaves = [];
    this.dustParticles = [];

    this.time = 0;
    this.frameCount = 0;

    this.lightningIntensity = 1.0;
    this.lightningTypes = ['classic', 'plasma', 'energy'];
    this.currentLightningType = 0;

    this.framesSinceFullClear = 0;
    this.fullClearInterval = 300;

    this.performanceMonitor = {
      fps: 60,
      frameTime: 0,
      lastFrameTime: performance.now(),
      adaptiveQuality: 1,
      targetFrameTime: 16.67
    };

    this.magneticOptimization = {
      gridSize: 40,
      updateFrequency: 3,
      framesSinceUpdate: 0,
      cachedField: null,
      activeSources: [],
      renderBatch: []
    };
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
      if (e.detail.key === 'lightningIntensity') {
        this.lightningIntensity = e.detail.value;
      }
    });

    setInterval(() => {
      if (this.currentMode === 5) {
        this.currentLightningType = (this.currentLightningType + 1) % this.lightningTypes.length;
      }
    }, 10000);

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
    this.framesSinceFullClear++;

    if (full || this.framesSinceFullClear >= this.fullClearInterval) {
      this.ctx.fillStyle = this.theme.bgColor;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.framesSinceFullClear = 0;
    } else {
      const fadeAlpha = this.getFadeAlpha();
      this.ctx.fillStyle = this.theme.bgFade + fadeAlpha + ')';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  getFadeAlpha() {
    const fadeSettings = {
      0: 0.05,
      1: 0.02,
      2: 0.08,
      3: 0.03,
      4: 0.01,
      5: 0.10,
      6: 0.04,
      7: 0.02
    };

    return fadeSettings[this.currentMode] || 0.05;
  }

  resetMode() {
    this.clearCanvas(true);

    this.fluidParticles = [];
    this.auroraPoints = [];
    this.lavaBlobs = [];
    this.magneticLines = [];
    this.magneticSources = [];
    this.smokeParticles = [];
    this.lightningBolts = [];
    this.oceanWaves = [];
    this.dustParticles = [];

    this.time = 0;
    this.frameCount = 0;

    this.magneticOptimization.cachedField = null;
    this.magneticOptimization.framesSinceUpdate = 0;

    switch(this.currentMode) {
      case 0: this.initFluidSimulation(); break;
      case 1: this.initAuroraWaves(); break;
      case 2: this.initLavaLamp(); break;
      case 3: this.initMagneticField(); break;
      case 4: this.initSmokeTrails(); break;
      case 6: this.initOceanDepths(); break;
      case 7: this.initCosmicDust(); break;
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

  initFluidSimulation() {
    const particleCount = 120;
    for (let i = 0; i < particleCount; i++) {
      this.fluidParticles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        vx: 0,
        vy: 0,
        radius: Math.random() * 3 + 2,
        hue: Math.random() * 60 + 180,
        connections: []
      });
    }
  }

  drawFluidSimulation() {
    const mouseX = this.canvas.width / 2 + Math.sin(this.time * 0.01) * 200;
    const mouseY = this.canvas.height / 2 + Math.cos(this.time * 0.01) * 200;

    this.fluidParticles.forEach((p, i) => {
      const dataIndex = i % this.bufferLength;
      const amp = this.dataArray[dataIndex] / 255;

      const dx = mouseX - p.x;
      const dy = mouseY - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 200) {
        const force = (1 - dist / 200) * 0.5 * amp;
        p.vx += (dx / dist) * force;
        p.vy += (dy / dist) * force;
      }

      p.vx *= 0.95;
      p.vy *= 0.95;

      p.x += p.vx + amp * 2;
      p.y += p.vy + amp * 2;

      if (p.x < 0) p.x = this.canvas.width;
      if (p.x > this.canvas.width) p.x = 0;
      if (p.y < 0) p.y = this.canvas.height;
      if (p.y > this.canvas.height) p.y = 0;

      p.hue = (p.hue + amp * 5) % 360;
    });

    this.fluidParticles.forEach((p, i) => {
      if (i % 3 === 0) {
        this.fluidParticles.forEach((other, j) => {
          if (i < j && j % 3 === 0) {
            const dx = other.x - p.x;
            const dy = other.y - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 80) {
              const alpha = (1 - dist / 80) * 0.5;
              this.ctx.strokeStyle = `hsla(${(p.hue + other.hue) / 2}, 100%, 50%, ${alpha})`;
              this.ctx.lineWidth = alpha * 3;
              this.ctx.beginPath();
              this.ctx.moveTo(p.x, p.y);
              this.ctx.lineTo(other.x, other.y);
              this.ctx.stroke();
            }
          }
        });
      }

      const gradient = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 3);
      gradient.addColorStop(0, `hsla(${p.hue}, 100%, 60%, 0.8)`);
      gradient.addColorStop(1, `hsla(${p.hue}, 100%, 40%, 0)`);

      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius * 3, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }

  initAuroraWaves() {
    const waveCount = 3;
    for (let i = 0; i < waveCount; i++) {
      const points = [];
      const pointCount = 30;

      for (let j = 0; j < pointCount; j++) {
        points.push({
          x: (j / pointCount) * this.canvas.width,
          baseY: this.canvas.height * 0.3 + i * 80,
          offsetY: 0,
          phase: j * 0.1,
          hue: 120 + i * 60
        });
      }

      this.auroraPoints.push({
        points: points,
        alpha: 0.3 + i * 0.1,
        speed: 0.02 + i * 0.005
      });
    }
  }

  drawAuroraWaves() {
    this.auroraPoints.forEach((wave, waveIndex) => {
      const dataStart = waveIndex * 40;

      wave.points.forEach((point, i) => {
        const dataIndex = (dataStart + i) % this.bufferLength;
        const amp = this.dataArray[dataIndex] / 255;

        point.offsetY = Math.sin(this.time * wave.speed + point.phase) * 100 * (0.5 + amp);
        point.hue = (point.hue + amp * 2) % 360;
      });

      this.ctx.beginPath();

      wave.points.forEach((point, i) => {
        const x = point.x;
        const y = point.baseY + point.offsetY;

        if (i === 0) {
          this.ctx.moveTo(x, y);
        } else {
          const prevPoint = wave.points[i - 1];
          const cx = (prevPoint.x + x) / 2;
          const cy = (prevPoint.baseY + prevPoint.offsetY + y) / 2;
          this.ctx.quadraticCurveTo(prevPoint.x, prevPoint.baseY + prevPoint.offsetY, cx, cy);
        }
      });

      const gradient = this.ctx.createLinearGradient(0, wave.points[0].baseY - 100, 0, wave.points[0].baseY + 200);
      gradient.addColorStop(0, `hsla(${wave.points[0].hue}, 100%, 50%, 0)`);
      gradient.addColorStop(0.5, `hsla(${wave.points[Math.floor(wave.points.length/2)].hue}, 100%, 50%, ${wave.alpha})`);
      gradient.addColorStop(1, `hsla(${wave.points[0].hue + 60}, 100%, 30%, 0)`);

      this.ctx.lineTo(this.canvas.width, this.canvas.height);
      this.ctx.lineTo(0, this.canvas.height);
      this.ctx.closePath();

      this.ctx.fillStyle = gradient;
      this.ctx.fill();
    });
  }

  initLavaLamp() {
    const blobCount = 5;
    for (let i = 0; i < blobCount; i++) {
      this.lavaBlobs.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        radius: Math.random() * 60 + 50,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        heat: Math.random(),
        wobble: Math.random() * Math.PI * 2,
        pulsePhase: Math.random() * Math.PI * 2,
        targetRadius: 0
      });
    }
  }

  drawLavaLamp() {
    const avgAmp = this.dataArray.reduce((a, b) => a + b) / this.bufferLength / 255;

    this.lavaBlobs.forEach((blob, i) => {
      const dataIndex = (i * 40) % this.bufferLength;
      const amp = this.dataArray[dataIndex] / 255;

      blob.vx += (Math.random() - 0.5) * 0.2 * (1 + amp);
      blob.vy += (Math.random() - 0.5) * 0.2 - 0.05;

      const swirl = Math.sin(this.time * 0.02 + i) * 0.3;
      blob.vx += swirl;

      blob.vx *= 0.96;
      blob.vy *= 0.96;

      blob.x += blob.vx;
      blob.y += blob.vy;

      const edgeForce = 0.1;
      if (blob.x < blob.radius * 2) {
        blob.vx += edgeForce;
      }
      if (blob.x > this.canvas.width - blob.radius * 2) {
        blob.vx -= edgeForce;
      }
      if (blob.y < blob.radius * 2) {
        blob.vy += edgeForce;
      }
      if (blob.y > this.canvas.height - blob.radius * 2) {
        blob.vy -= edgeForce;
      }

      blob.heat = blob.heat * 0.93 + amp * 0.07;
      blob.wobble += 0.04 + amp * 0.04;
      blob.pulsePhase += 0.03;

      const pulse = Math.sin(blob.pulsePhase) * 0.15 + 1;
      blob.targetRadius = blob.radius * pulse * (0.8 + amp * 0.3);

      this.lavaBlobs.forEach((other, j) => {
        if (i !== j) {
          const dx = other.x - blob.x;
          const dy = other.y - blob.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const minDist = blob.targetRadius + other.targetRadius;

          if (dist < minDist * 1.5) {
            if (dist > minDist) {
              const attract = 0.01;
              blob.vx += (dx / dist) * attract;
              blob.vy += (dy / dist) * attract;
            } else {
              const overlap = (minDist - dist) * 0.02;
              const angle = Math.atan2(dy, dx);
              blob.vx -= Math.cos(angle) * overlap;
              blob.vy -= Math.sin(angle) * overlap;
            }
          }
        }
      });
    });

    this.lavaBlobs.forEach((blob, i) => {
      const glowGradient = this.ctx.createRadialGradient(
        blob.x, blob.y, blob.targetRadius * 0.8,
        blob.x, blob.y, blob.targetRadius * 1.5
      );

      const hue = 15 + blob.heat * 30 + i * 10;
      glowGradient.addColorStop(0, `hsla(${hue}, 100%, 50%, 0)`);
      glowGradient.addColorStop(1, `hsla(${hue}, 100%, 60%, ${blob.heat * 0.3})`);

      this.ctx.fillStyle = glowGradient;
      this.ctx.beginPath();
      this.ctx.arc(blob.x, blob.y, blob.targetRadius * 1.5, 0, Math.PI * 2);
      this.ctx.fill();

      const gradient = this.ctx.createRadialGradient(
        blob.x, blob.y, 0,
        blob.x, blob.y, blob.targetRadius
      );

      gradient.addColorStop(0, `hsla(${hue}, 100%, 70%, 0.95)`);
      gradient.addColorStop(0.3, `hsla(${hue + 15}, 100%, 60%, 0.8)`);
      gradient.addColorStop(0.7, `hsla(${hue + 30}, 90%, 50%, 0.6)`);
      gradient.addColorStop(1, `hsla(${hue + 45}, 80%, 40%, 0.3)`);

      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(blob.x, blob.y, blob.targetRadius, 0, Math.PI * 2);
      this.ctx.fill();

      const wobbleX = Math.sin(blob.wobble) * blob.targetRadius * 0.15;
      const wobbleY = Math.cos(blob.wobble * 1.3) * blob.targetRadius * 0.15;

      const innerGradient = this.ctx.createRadialGradient(
        blob.x + wobbleX, blob.y + wobbleY, 0,
        blob.x + wobbleX, blob.y + wobbleY, blob.targetRadius * 0.5
      );

      innerGradient.addColorStop(0, `hsla(${hue + 60}, 100%, 85%, ${blob.heat * 0.8})`);
      innerGradient.addColorStop(0.5, `hsla(${hue + 50}, 100%, 75%, ${blob.heat * 0.4})`);
      innerGradient.addColorStop(1, `hsla(${hue + 40}, 100%, 65%, 0)`);

      this.ctx.fillStyle = innerGradient;
      this.ctx.beginPath();
      this.ctx.arc(blob.x + wobbleX, blob.y + wobbleY, blob.targetRadius * 0.5, 0, Math.PI * 2);
      this.ctx.fill();

      if (blob.heat > 0.6) {
        this.ctx.fillStyle = `hsla(${hue + 80}, 100%, 95%, ${blob.heat * 0.5})`;
        this.ctx.beginPath();
        this.ctx.arc(blob.x + wobbleX * 0.5, blob.y + wobbleY * 0.5, blob.targetRadius * 0.2, 0, Math.PI * 2);
        this.ctx.fill();
      }
    });
  }

  initMagneticField() {
    const quality = this.performanceMonitor.adaptiveQuality;
    const gridSize = Math.floor(this.magneticOptimization.gridSize / (quality < 0.7 ? 1.5 : 1));

    const cols = Math.ceil(this.canvas.width / gridSize);
    const rows = Math.ceil(this.canvas.height / gridSize);

    for (let x = 0; x < cols; x++) {
      for (let y = 0; y < rows; y++) {
        this.magneticLines.push({
          x: x * gridSize + gridSize / 2,
          y: y * gridSize + gridSize / 2,
          angle: 0,
          strength: 0,
          gridX: x,
          gridY: y
        });
      }
    }

    for (let i = 0; i < 4; i++) {
      this.magneticSources.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        strength: 0,
        polarity: i % 2 === 0 ? 1 : -1,
        hue: i * 90,
        phase: Math.random() * Math.PI * 2,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2
      });
    }
  }

  drawMagneticField() {
    const quality = this.performanceMonitor.adaptiveQuality;

    this.magneticOptimization.activeSources = [];

    this.magneticSources.forEach((source, i) => {
      const dataIndex = i * 30;
      const amp = this.dataArray[dataIndex] / 255;

      source.strength = amp;
      source.phase += 0.02 + amp * 0.05;

      source.x += source.vx;
      source.y += source.vy;

      if (source.x < 0 || source.x > this.canvas.width) source.vx *= -1;
      if (source.y < 0 || source.y > this.canvas.height) source.vy *= -1;

      source.x = Math.max(0, Math.min(this.canvas.width, source.x));
      source.y = Math.max(0, Math.min(this.canvas.height, source.y));

      if (source.strength > 0.1) {
        this.magneticOptimization.activeSources.push(source);
      }
    });

    this.magneticOptimization.framesSinceUpdate++;
    const shouldUpdate = this.magneticOptimization.framesSinceUpdate >= Math.floor(this.magneticOptimization.updateFrequency / quality);

    if (shouldUpdate) {
      this.magneticOptimization.framesSinceUpdate = 0;
      this.magneticOptimization.renderBatch = [];

      this.magneticLines.forEach((line, idx) => {
        if (quality < 0.5 && idx % 2 === 0) return;

        let totalAngleX = 0;
        let totalAngleY = 0;
        let totalStrength = 0;

        this.magneticOptimization.activeSources.forEach(source => {
          const dx = source.x - line.x;
          const dy = source.y - line.y;
          const distSq = dx * dx + dy * dy;

          if (distSq > 100 && distSq < 40000) {
            const dist = Math.sqrt(distSq);
            const force = source.strength / (dist * 0.01 + 1);

            if (source.polarity > 0) {
              totalAngleX += (dx / dist) * force;
              totalAngleY += (dy / dist) * force;
            } else {
              totalAngleX -= (dx / dist) * force;
              totalAngleY -= (dy / dist) * force;
            }

            totalStrength += force;
          }
        });

        if (totalStrength > 0.1) {
          line.angle = Math.atan2(totalAngleY, totalAngleX);
          line.strength = Math.min(totalStrength, 1);
          this.magneticOptimization.renderBatch.push(line);
        } else {
          line.strength *= 0.9;
          if (line.strength > 0.05) {
            this.magneticOptimization.renderBatch.push(line);
          }
        }
      });
    }

    const shadowEnabled = quality > 0.6;
    if (shadowEnabled) {
      this.ctx.shadowBlur = 10 * quality;
    }

    this.magneticOptimization.renderBatch.forEach(line => {
      const length = 15 + line.strength * 20 * quality;
      const endX = line.x + Math.cos(line.angle) * length;
      const endY = line.y + Math.sin(line.angle) * length;

      const hue = (line.angle * 180 / Math.PI + this.time * 0.5) % 360;
      const alpha = line.strength * 0.8 * quality;

      this.ctx.strokeStyle = `hsla(${hue}, 100%, 50%, ${alpha})`;
      this.ctx.lineWidth = 1 + line.strength * 1.5 * quality;

      if (shadowEnabled) {
        this.ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;
      }

      this.ctx.beginPath();
      this.ctx.moveTo(line.x, line.y);
      this.ctx.lineTo(endX, endY);
      this.ctx.stroke();

      if (line.strength > 0.5 && quality > 0.5) {
        const arrowSize = 3 + line.strength * 2 * quality;
        const arrowAngle1 = line.angle + Math.PI * 0.8;
        const arrowAngle2 = line.angle - Math.PI * 0.8;

        this.ctx.beginPath();
        this.ctx.moveTo(endX, endY);
        this.ctx.lineTo(endX + Math.cos(arrowAngle1) * arrowSize, endY + Math.sin(arrowAngle1) * arrowSize);
        this.ctx.moveTo(endX, endY);
        this.ctx.lineTo(endX + Math.cos(arrowAngle2) * arrowSize, endY + Math.sin(arrowAngle2) * arrowSize);
        this.ctx.stroke();
      }
    });

    this.ctx.shadowBlur = 0;

    this.magneticOptimization.activeSources.forEach(source => {
      const size = 8 + source.strength * 20 * quality;

      if (quality > 0.4) {
        const glowGradient = this.ctx.createRadialGradient(
          source.x, source.y, 0,
          source.x, source.y, size * 2
        );

        const color = source.polarity > 0 ?
          `hsla(0, 100%, 50%, ${source.strength * 0.3})` :
          `hsla(240, 100%, 50%, ${source.strength * 0.3})`;

        glowGradient.addColorStop(0, color);
        glowGradient.addColorStop(1, 'transparent');

        this.ctx.fillStyle = glowGradient;
        this.ctx.beginPath();
        this.ctx.arc(source.x, source.y, size * 2, 0, Math.PI * 2);
        this.ctx.fill();
      }

      this.ctx.fillStyle = source.polarity > 0 ?
        `hsla(0, 100%, 50%, ${source.strength})` :
        `hsla(240, 100%, 50%, ${source.strength})`;

      if (quality > 0.6) {
        this.ctx.shadowBlur = source.strength * 20 * quality;
        this.ctx.shadowColor = source.polarity > 0 ? '#ff0000' : '#0000ff';
      }

      this.ctx.beginPath();
      this.ctx.arc(source.x, source.y, size, 0, Math.PI * 2);
      this.ctx.fill();

      if (quality > 0.3) {
        this.ctx.fillStyle = 'white';
        this.ctx.font = `${size}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(source.polarity > 0 ? '+' : '-', source.x, source.y);
      }
    });

    this.ctx.shadowBlur = 0;
  }

  initSmokeTrails() {
  }

  drawSmokeTrails() {
    const avgAmp = this.dataArray.reduce((a, b) => a + b) / this.bufferLength / 255;

    if (avgAmp > 0.2 && this.smokeParticles.length < 120) {
      for (let i = 0; i < 2; i++) {
        const source = {
          x: (this.canvas.width / 4) * (i + 1) + Math.sin(this.time * 0.02 + i) * 100,
          y: this.canvas.height - 30
        };

        this.smokeParticles.push({
          x: source.x + (Math.random() - 0.5) * 40,
          y: source.y,
          vx: (Math.random() - 0.5) * 4,
          vy: -Math.random() * 3 - 2,
          size: Math.random() * 30 + 15,
          life: 1,
          hue: 200 + Math.random() * 100,
          turbulence: Math.random() * 0.2,
          swirl: Math.random() * 0.15,
          type: 'bottom'
        });
      }

      if (avgAmp > 0.4 && Math.random() > 0.7) {
        const side = Math.random() > 0.5 ? 0 : this.canvas.width;
        this.smokeParticles.push({
          x: side,
          y: this.canvas.height * 0.3 + Math.random() * this.canvas.height * 0.4,
          vx: side === 0 ? 2 + Math.random() * 2 : -2 - Math.random() * 2,
          vy: (Math.random() - 0.5) * 2,
          size: Math.random() * 40 + 20,
          life: 1,
          hue: 250 + Math.random() * 60,
          turbulence: Math.random() * 0.15,
          swirl: Math.random() * 0.1,
          type: 'side'
        });
      }
    }

    this.smokeParticles = this.smokeParticles.filter(particle => {
      if (particle.type === 'bottom') {
        particle.vx += Math.sin(particle.y * particle.turbulence + this.time * 0.03) * 0.5;
        particle.vy += (Math.random() - 0.5) * 0.2 - 0.05;
        particle.vx += Math.cos(this.time * particle.swirl) * 0.3;
      } else {
        particle.vx += Math.sin(this.time * 0.02 + particle.y * 0.01) * 0.2;
        particle.vy += Math.cos(this.time * 0.03 + particle.x * 0.01) * 0.15;
      }

      particle.vx += (Math.random() - 0.5) * avgAmp * 2;
      particle.vy += (Math.random() - 0.5) * avgAmp;

      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vx *= 0.98;
      particle.vy *= 0.99;

      particle.size += 0.5 + avgAmp * 2;
      particle.life -= 0.008 - avgAmp * 0.002;

      if (particle.life > 0 &&
          particle.x > -particle.size &&
          particle.x < this.canvas.width + particle.size &&
          particle.y > -particle.size) {

        const gradient = this.ctx.createRadialGradient(
          particle.x, particle.y, particle.size * 0.2,
          particle.x, particle.y, particle.size
        );

        const alpha = particle.life * 0.5;
        const hueShift = this.time * 0.5 + particle.y * 0.1;

        gradient.addColorStop(0, `hsla(${particle.hue + hueShift}, 70%, 80%, ${alpha * 0.8})`);
        gradient.addColorStop(0.3, `hsla(${particle.hue + hueShift + 15}, 60%, 65%, ${alpha * 0.5})`);
        gradient.addColorStop(0.6, `hsla(${particle.hue + hueShift + 30}, 50%, 50%, ${alpha * 0.3})`);
        gradient.addColorStop(1, `hsla(${particle.hue + hueShift + 45}, 40%, 35%, 0)`);

        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        this.ctx.fill();

        if (particle.size > 30 && particle.life > 0.5) {
          const innerGlow = this.ctx.createRadialGradient(
            particle.x - particle.size * 0.2,
            particle.y - particle.size * 0.2,
            0,
            particle.x - particle.size * 0.2,
            particle.y - particle.size * 0.2,
            particle.size * 0.4
          );

          innerGlow.addColorStop(0, `hsla(${particle.hue + 60}, 80%, 90%, ${alpha * 0.4})`);
          innerGlow.addColorStop(1, `hsla(${particle.hue + 60}, 80%, 90%, 0)`);

          this.ctx.fillStyle = innerGlow;
          this.ctx.beginPath();
          this.ctx.arc(particle.x - particle.size * 0.2, particle.y - particle.size * 0.2, particle.size * 0.4, 0, Math.PI * 2);
          this.ctx.fill();
        }

        return true;
      }
      return false;
    });
  }

  drawLightningStorm() {
    const bass = this.dataArray.slice(0, 20).reduce((a, b) => a + b) / 20 / 255;
    const mid = this.dataArray.slice(20, 80).reduce((a, b) => a + b) / 60 / 255;
    const treble = this.dataArray.slice(80, 128).reduce((a, b) => a + b) / 48 / 255;

    const threshold = 0.8 - (this.lightningIntensity - 1) * 0.2;

    if (bass > threshold && Math.random() > 0.4) {
      this.generateLightning(this.lightningTypes[this.currentLightningType], bass, mid, treble);
    }

    if (this.lightningIntensity > 1.5 && mid > 0.6 && Math.random() > 0.7) {
      this.generateLightning(this.lightningTypes[(this.currentLightningType + 1) % 3], mid, bass, treble);
    }

    if (this.lightningIntensity > 2.0 && treble > 0.5 && Math.random() > 0.8) {
      this.generateLightning(this.lightningTypes[(this.currentLightningType + 2) % 3], treble, mid, bass);
    }

    this.lightningBolts = this.lightningBolts.filter(bolt => {
      bolt.life -= 0.08 + (this.lightningIntensity - 1) * 0.03;

      if (bolt.life > 0) {
        this.drawLightningBolt(bolt);
        return true;
      }
      return false;
    });

    this.ctx.shadowBlur = 0;
  }

  generateLightning(type, amp1, amp2, amp3) {
    const startX = Math.random() * this.canvas.width;
    const startY = Math.random() * this.canvas.height * 0.4;

    let bolt;

    switch (type) {
      case 'classic':
        bolt = this.generateClassicLightning(startX, startY, amp1);
        break;
      case 'plasma':
        bolt = this.generatePlasmaLightning(startX, startY, amp2);
        break;
      case 'energy':
        bolt = this.generateEnergyLightning(startX, startY, amp3);
        break;
    }

    if (bolt) {
      this.lightningBolts.push(bolt);
    }
  }

  generateClassicLightning(startX, startY, amp) {
    const endX = startX + (Math.random() - 0.5) * 400;
    const endY = startY + 200 + Math.random() * (this.canvas.height - startY - 200);

    const segments = [];
    const segmentCount = 8 + Math.floor(Math.random() * 12);

    for (let i = 0; i <= segmentCount; i++) {
      const t = i / segmentCount;
      const deviation = (Math.random() - 0.5) * 150 * Math.sin(t * Math.PI);
      const x = startX + (endX - startX) * t + deviation;
      const y = startY + (endY - startY) * t;
      segments.push({ x, y });
    }

    const branches = [];
    for (let i = 2; i < segments.length - 2; i++) {
      if (Math.random() > 0.6) {
        const branch = [];
        const start = segments[i];
        const branchLength = 3 + Math.floor(Math.random() * 5);
        const branchAngle = (Math.random() - 0.5) * Math.PI / 1.5;

        for (let j = 0; j < branchLength; j++) {
          const t = j / branchLength;
          const dist = t * 100;
          branch.push({
            x: start.x + Math.cos(branchAngle) * dist + (Math.random() - 0.5) * 30,
            y: start.y + Math.abs(Math.sin(branchAngle)) * dist + Math.random() * 20
          });
        }
        branches.push(branch);
      }
    }

    return {
      type: 'classic',
      segments,
      branches,
      life: 1,
      thickness: 3 + amp * 4,
      color: { r: 255, g: 255, b: 255 },
      intensity: amp
    };
  }

  generatePlasmaLightning(startX, startY, amp) {
    const segments = [];
    const numWaves = 3 + Math.floor(amp * 4);

    for (let wave = 0; wave < numWaves; wave++) {
      const waveSegments = [];
      const length = 300 + amp * 200;
      const frequency = 0.1 + wave * 0.05;
      const amplitude = 50 + amp * 100;

      for (let i = 0; i <= 20; i++) {
        const t = i / 20;
        const x = startX + Math.cos(wave * Math.PI / 3) * t * length;
        const y = startY + Math.sin(wave * Math.PI / 3) * t * length +
                  Math.sin(t * Math.PI * 4 + this.time * 0.1) * amplitude;
        waveSegments.push({ x, y });
      }
      segments.push(waveSegments);
    }

    return {
      type: 'plasma',
      segments,
      branches: [],
      life: 1,
      thickness: 2 + amp * 3,
      color: { r: 100, g: 200, b: 255 },
      intensity: amp
    };
  }

  generateEnergyLightning(startX, startY, amp) {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;

    const segments = [];
    const rayCount = 6 + Math.floor(amp * 6);

    for (let ray = 0; ray < rayCount; ray++) {
      const angle = (ray / rayCount) * Math.PI * 2;
      const raySegments = [];
      const maxRadius = 100 + amp * 200;

      for (let i = 0; i <= 15; i++) {
        const t = i / 15;
        const radius = t * maxRadius;
        const wobble = Math.sin(t * Math.PI * 3 + this.time * 0.2) * 20 * amp;

        const x = centerX + Math.cos(angle) * (radius + wobble);
        const y = centerY + Math.sin(angle) * (radius + wobble);
        raySegments.push({ x, y });
      }
      segments.push(raySegments);
    }

    return {
      type: 'energy',
      segments,
      branches: [],
      life: 1,
      thickness: 1 + amp * 2,
      color: { r: 255, g: 100, b: 255 },
      intensity: amp
    };
  }

  drawLightningBolt(bolt) {
    const alpha = bolt.life;
    const baseColor = bolt.color;

    switch (bolt.type) {
      case 'classic':
        this.drawClassicBolt(bolt, alpha, baseColor);
        break;
      case 'plasma':
        this.drawPlasmaBolt(bolt, alpha, baseColor);
        break;
      case 'energy':
        this.drawEnergyBolt(bolt, alpha, baseColor);
        break;
    }
  }

  drawClassicBolt(bolt, alpha, baseColor) {
    this.ctx.strokeStyle = `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, ${alpha})`;
    this.ctx.lineWidth = bolt.thickness * bolt.life;
    this.ctx.shadowBlur = 25;
    this.ctx.shadowColor = `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, 1)`;

    this.ctx.beginPath();
    bolt.segments.forEach((seg, i) => {
      if (i === 0) {
        this.ctx.moveTo(seg.x, seg.y);
      } else {
        this.ctx.lineTo(seg.x, seg.y);
      }
    });
    this.ctx.stroke();

    this.ctx.strokeStyle = `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, ${alpha * 0.4})`;
    this.ctx.lineWidth = bolt.thickness * bolt.life * 4;
    this.ctx.shadowBlur = 50;
    this.ctx.stroke();

    bolt.branches.forEach(branch => {
      this.ctx.strokeStyle = `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, ${alpha * 0.7})`;
      this.ctx.lineWidth = bolt.thickness * bolt.life * 0.6;
      this.ctx.shadowBlur = 20;

      this.ctx.beginPath();
      branch.forEach((seg, i) => {
        if (i === 0) {
          this.ctx.moveTo(seg.x, seg.y);
        } else {
          this.ctx.lineTo(seg.x, seg.y);
        }
      });
      this.ctx.stroke();
    });
  }

  drawPlasmaBolt(bolt, alpha, baseColor) {
    bolt.segments.forEach((wave, waveIndex) => {
      const hue = 200 + waveIndex * 30;
      this.ctx.strokeStyle = `hsla(${hue}, 100%, 70%, ${alpha * 0.8})`;
      this.ctx.lineWidth = bolt.thickness * bolt.life * (1 + waveIndex * 0.2);
      this.ctx.shadowBlur = 30;
      this.ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;

      this.ctx.beginPath();
      wave.forEach((seg, i) => {
        if (i === 0) {
          this.ctx.moveTo(seg.x, seg.y);
        } else {
          this.ctx.lineTo(seg.x, seg.y);
        }
      });
      this.ctx.stroke();
    });
  }

  drawEnergyBolt(bolt, alpha, baseColor) {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;

    const coreGradient = this.ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, 50 + bolt.intensity * 50
    );
    coreGradient.addColorStop(0, `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, ${alpha})`);
    coreGradient.addColorStop(1, `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, 0)`);

    this.ctx.fillStyle = coreGradient;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, 50 + bolt.intensity * 50, 0, Math.PI * 2);
    this.ctx.fill();

    bolt.segments.forEach((ray, rayIndex) => {
      const hue = 280 + rayIndex * 20;
      this.ctx.strokeStyle = `hsla(${hue}, 100%, 80%, ${alpha})`;
      this.ctx.lineWidth = bolt.thickness * bolt.life;
      this.ctx.shadowBlur = 20;
      this.ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;

      this.ctx.beginPath();
      ray.forEach((seg, i) => {
        if (i === 0) {
          this.ctx.moveTo(seg.x, seg.y);
        } else {
          this.ctx.lineTo(seg.x, seg.y);
        }
      });
      this.ctx.stroke();
    });
  }

  initOceanDepths() {
    for (let layer = 0; layer < 4; layer++) {
      const points = [];
      const pointCount = 30;

      for (let i = 0; i < pointCount; i++) {
        points.push({
          x: (i / pointCount) * this.canvas.width,
          baseY: 100 + layer * 120,
          phase: i * 0.2,
          amplitude: 30 + layer * 10
        });
      }

      this.oceanWaves.push({
        points: points,
        depth: layer,
        speed: 0.02 - layer * 0.003,
        hue: 180 + layer * 10
      });
    }

    for (let i = 0; i < 20; i++) {
      this.fluidParticles.push({
        x: Math.random() * this.canvas.width,
        y: this.canvas.height + Math.random() * 200,
        size: Math.random() * 5 + 2,
        speed: Math.random() * 2 + 1,
        wobble: Math.random() * Math.PI * 2
      });
    }
  }

  drawOceanDepths() {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, 'hsla(200, 50%, 20%, 0.8)');
    gradient.addColorStop(0.5, 'hsla(210, 60%, 10%, 0.9)');
    gradient.addColorStop(1, 'hsla(220, 70%, 5%, 1)');

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const lightRays = 3;
    for (let i = 0; i < lightRays; i++) {
      const dataIndex = i * 40;
      const amp = this.dataArray[dataIndex] / 255;

      const x = (i / lightRays) * this.canvas.width + this.canvas.width / (lightRays * 2);
      const angle = Math.sin(this.time * 0.01 + i) * 0.3;

      const rayGradient = this.ctx.createLinearGradient(
        x, 0,
        x + Math.sin(angle) * this.canvas.height, this.canvas.height
      );

      rayGradient.addColorStop(0, `hsla(180, 50%, 70%, ${amp * 0.4})`);
      rayGradient.addColorStop(1, 'hsla(200, 50%, 30%, 0)');

      this.ctx.fillStyle = rayGradient;
      this.ctx.beginPath();
      this.ctx.moveTo(x - 25, 0);
      this.ctx.lineTo(x + 25, 0);
      this.ctx.lineTo(x + Math.sin(angle) * this.canvas.height + 60, this.canvas.height);
      this.ctx.lineTo(x + Math.sin(angle) * this.canvas.height - 60, this.canvas.height);
      this.ctx.closePath();
      this.ctx.fill();
    }

    this.oceanWaves.forEach((wave, waveIndex) => {
      wave.points.forEach((point, i) => {
        const dataIndex = (waveIndex * 10 + i) % this.bufferLength;
        const amp = this.dataArray[dataIndex] / 255;

        point.offsetY = Math.sin(this.time * wave.speed + point.phase) * point.amplitude * (0.5 + amp);
      });

      this.ctx.strokeStyle = `hsla(${wave.hue}, 70%, ${40 - wave.depth * 5}%, ${0.7 - wave.depth * 0.1})`;
      this.ctx.lineWidth = 2 + wave.depth;

      this.ctx.beginPath();
      wave.points.forEach((point, i) => {
        const x = point.x;
        const y = point.baseY + point.offsetY;

        if (i === 0) {
          this.ctx.moveTo(x, y);
        } else {
          this.ctx.lineTo(x, y);
        }
      });
      this.ctx.stroke();
    });

    this.fluidParticles.forEach(bubble => {
      bubble.y -= bubble.speed;
      bubble.x += Math.sin(bubble.wobble + this.time * 0.05) * 0.8;

      if (bubble.y < -20) {
        bubble.y = this.canvas.height + 20;
        bubble.x = Math.random() * this.canvas.width;
      }

      const depth = bubble.y / this.canvas.height;
      const alpha = 0.4 + (1 - depth) * 0.5;

      this.ctx.fillStyle = `hsla(180, 50%, 80%, ${alpha})`;
      this.ctx.beginPath();
      this.ctx.arc(bubble.x, bubble.y, bubble.size, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.fillStyle = `hsla(180, 50%, 95%, ${alpha * 0.9})`;
      this.ctx.beginPath();
      this.ctx.arc(
        bubble.x - bubble.size * 0.3,
        bubble.y - bubble.size * 0.3,
        bubble.size * 0.4,
        0, Math.PI * 2
      );
      this.ctx.fill();
    });
  }

  initCosmicDust() {
    const particleCount = 300;
    for (let i = 0; i < particleCount; i++) {
      this.dustParticles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        z: Math.random() * 1000,
        size: Math.random() * 2 + 0.5,
        hue: Math.random() * 60 + 240,
        twinkle: Math.random() * Math.PI * 2
      });
    }
  }

  drawCosmicDust() {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const avgAmp = this.dataArray.reduce((a, b) => a + b) / this.bufferLength / 255;

    const nebulaGradient = this.ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, Math.max(centerX, centerY)
    );

    nebulaGradient.addColorStop(0, `hsla(280, 50%, 20%, ${0.25 + avgAmp * 0.35})`);
    nebulaGradient.addColorStop(0.5, `hsla(260, 40%, 10%, ${0.15 + avgAmp * 0.25})`);
    nebulaGradient.addColorStop(1, 'hsla(240, 30%, 5%, 0)');

    this.ctx.fillStyle = nebulaGradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.dustParticles.forEach((particle, i) => {
      const dataIndex = i % this.bufferLength;
      const amp = this.dataArray[dataIndex] / 255;

      particle.z -= 3 + avgAmp * 8;
      if (particle.z <= 0) {
        particle.x = Math.random() * this.canvas.width;
        particle.y = Math.random() * this.canvas.height;
        particle.z = 1000;
      }

      const scale = 1000 / particle.z;
      const x = centerX + (particle.x - centerX) * scale;
      const y = centerY + (particle.y - centerY) * scale;
      const size = particle.size * scale;

      particle.twinkle += 0.08 + amp * 0.15;
      const brightness = 0.6 + Math.sin(particle.twinkle) * 0.4;

      if (avgAmp > 0.5 && particle.z < 600) {
        const prevScale = 1000 / (particle.z + 15);
        const prevX = centerX + (particle.x - centerX) * prevScale;
        const prevY = centerY + (particle.y - centerY) * prevScale;

        this.ctx.strokeStyle = `hsla(${particle.hue}, 100%, ${60 * brightness}%, ${(1 - particle.z / 1000) * 0.7})`;
        this.ctx.lineWidth = size;
        this.ctx.beginPath();
        this.ctx.moveTo(prevX, prevY);
        this.ctx.lineTo(x, y);
        this.ctx.stroke();
      }

      const particleGradient = this.ctx.createRadialGradient(x, y, 0, x, y, size * 4);
      particleGradient.addColorStop(0, `hsla(${particle.hue}, 100%, ${80 * brightness}%, ${1 - particle.z / 1000})`);
      particleGradient.addColorStop(1, `hsla(${particle.hue}, 100%, ${60 * brightness}%, 0)`);

      this.ctx.fillStyle = particleGradient;
      this.ctx.beginPath();
      this.ctx.arc(x, y, size * 4, 0, Math.PI * 2);
      this.ctx.fill();
    });

    for (let i = 0; i < 2; i++) {
      const cloudX = centerX + Math.sin(this.time * 0.002 + i * 2.1) * 350;
      const cloudY = centerY + Math.cos(this.time * 0.002 + i * 2.1) * 250;

      const cloudGradient = this.ctx.createRadialGradient(
        cloudX, cloudY, 0,
        cloudX, cloudY, 150 + avgAmp * 100
      );

      const hue = 260 + i * 50;
      cloudGradient.addColorStop(0, `hsla(${hue}, 70%, 40%, ${0.15 + avgAmp * 0.25})`);
      cloudGradient.addColorStop(1, `hsla(${hue}, 50%, 20%, 0)`);

      this.ctx.fillStyle = cloudGradient;
      this.ctx.fillRect(cloudX - 250, cloudY - 250, 500, 500);
    }
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

    this.fluidParticles = [];
    this.auroraPoints = [];
    this.lavaBlobs = [];
    this.magneticLines = [];
    this.magneticSources = [];
    this.smokeParticles = [];
    this.lightningBolts = [];
    this.oceanWaves = [];
    this.dustParticles = [];
    this.dataArray = null;
    this.bufferLength = null;
  }
}

export default OrganicVisualizer;