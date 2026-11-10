/**
 * 2D Canvas 이온 물리 엔진 및 중화 반응 시뮬레이션
 * 
 * 염산(HCl)과 수산화나트륨(NaOH) 수용액의 미시적 이온 반응:
 * - H+ 와 OH- 의 인력 충돌 및 H2O 분자(104.5도 굽은형) 결합 애니메이션
 * - 반응 시 중화열 방출 스파크 파티클 및 사운드 트리거
 * - 구경꾼 이온(Na+, Cl-)의 열운동(브라운 운동) 유지
 * - 알짜 이온 강조 및 구경꾼 이온 반투명 모드 지원
 */

/**
 * 이온 입자 클래스 (H+, OH-, Cl-, Na+)
 */
export class IonParticle {
  /**
   * @param {'H+'|'OH-'|'Cl-'|'Na+'} type
   * @param {number} x
   * @param {number} y
   * @param {number} vx
   * @param {number} vy
   */
  constructor(type, x, y, vx = 0, vy = 0) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;

    // 이온별 시각 속성 설정
    switch (type) {
      case 'H+':
        this.radius = 11;
        this.color = '#EF4444'; // Vibrant red
        this.glowColor = 'rgba(239, 68, 68, 0.45)';
        this.label = 'H⁺';
        this.symbol = '+';
        this.charge = 1;
        this.isNet = true;
        this.isSpectator = false;
        break;
      case 'OH-':
        this.radius = 15;
        this.color = '#3B82F6'; // Vibrant blue
        this.glowColor = 'rgba(59, 130, 246, 0.45)';
        this.label = 'OH⁻';
        this.symbol = '-';
        this.charge = -1;
        this.isNet = true;
        this.isSpectator = false;
        break;
      case 'Cl-':
        this.radius = 17; // Slightly larger radius
        this.color = '#10B981'; // Bright green
        this.glowColor = 'rgba(16, 185, 129, 0.35)';
        this.label = 'Cl⁻';
        this.symbol = '-';
        this.charge = -1;
        this.isNet = false;
        this.isSpectator = true;
        break;
      case 'Na+':
        this.radius = 13;
        this.color = '#8B5CF6'; // Vibrant purple
        this.glowColor = 'rgba(139, 92, 246, 0.35)';
        this.label = 'Na⁺';
        this.symbol = '+';
        this.charge = 1;
        this.isNet = false;
        this.isSpectator = true;
        break;
      default:
        this.radius = 12;
        this.color = '#64748B';
        this.glowColor = 'rgba(100, 116, 139, 0.3)';
        this.label = '?';
        this.symbol = '';
        this.charge = 0;
        this.isNet = false;
        this.isSpectator = false;
    }

    this.pulsePhase = Math.random() * Math.PI * 2;
  }

  /**
   * 렌더링
   * @param {CanvasRenderingContext2D} ctx
   * @param {boolean} highlightNetIons
   */
  render(ctx, highlightNetIons = false) {
    ctx.save();

    let alpha = 1.0;
    let haloScale = 1.0;

    if (highlightNetIons) {
      if (this.isSpectator) {
        alpha = 0.22; // 구경꾼 이온 반투명
      } else {
        alpha = 1.0;
        haloScale = 1.5; // 알짜 이온 강조 발광
      }
    }

    ctx.globalAlpha = alpha;

    // 1. 외곽 발광 헤일로 (Glow halo)
    const haloRadius = this.radius * 1.8 * haloScale;
    const grad = ctx.createRadialGradient(
      this.x, this.y, this.radius * 0.4,
      this.x, this.y, haloRadius
    );
    grad.addColorStop(0, this.glowColor);
    grad.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(this.x, this.y, haloRadius, 0, Math.PI * 2);
    ctx.fill();

    // 2. 이온 구체 본체
    const sphereGrad = ctx.createRadialGradient(
      this.x - this.radius * 0.3, this.y - this.radius * 0.3, this.radius * 0.1,
      this.x, this.y, this.radius
    );
    sphereGrad.addColorStop(0, '#FFFFFF');
    sphereGrad.addColorStop(0.3, this.color);
    sphereGrad.addColorStop(1, this.color);

    ctx.fillStyle = sphereGrad;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // 3. 테두리 림
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 4. 전하 및 이온 기호 표기
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${Math.max(10, Math.floor(this.radius * 0.95))}px "Pretendard", "Segoe UI", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.label, this.x, this.y);

    ctx.restore();
  }
}

/**
 * 결합된 물 분자 (H2O, 104.5도 굽은형 구조)
 */
export class WaterMolecule {
  /**
   * @param {number} x
   * @param {number} y
   * @param {number} vx
   * @param {number} vy
   */
  constructor(x, y, vx = 0, vy = 0) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;

    this.radius = 18; // 충돌/경계 반경
    this.oxygenRadius = 11;
    this.hydrogenRadius = 7;
    this.bondLength = 15;

    // 104.5도 결합각 (라디안: 104.5 * PI / 180 = 1.823869...)
    this.bondAngleRad = (104.5 * Math.PI) / 180;
    this.halfBondAngle = this.bondAngleRad / 2;

    this.rotation = Math.random() * Math.PI * 2;
    this.vRot = (Math.random() - 0.5) * 0.8; // 천천히 회전
  }

  /**
   * 렌더링
   * @param {CanvasRenderingContext2D} ctx
   * @param {boolean} showWaterMolecules
   * @param {boolean} highlightNetIons
   */
  render(ctx, showWaterMolecules = true, highlightNetIons = false) {
    if (!showWaterMolecules) return;

    ctx.save();
    ctx.globalAlpha = highlightNetIons ? 0.75 : 0.95;

    const rot = this.rotation;
    const h1Angle = rot - this.halfBondAngle;
    const h2Angle = rot + this.halfBondAngle;

    const ox = this.x;
    const oy = this.y;

    const h1x = ox + Math.cos(h1Angle) * this.bondLength;
    const h1y = oy + Math.sin(h1Angle) * this.bondLength;

    const h2x = ox + Math.cos(h2Angle) * this.bondLength;
    const h2y = oy + Math.sin(h2Angle) * this.bondLength;

    // 1. 공유 결합선
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(h1x, h1y);
    ctx.moveTo(ox, oy);
    ctx.lineTo(h2x, h2y);
    ctx.stroke();

    // 2. 수소 원자 (H) x 2 (밝은 회백색)
    [ { x: h1x, y: h1y }, { x: h2x, y: h2y } ].forEach(h => {
      const hGrad = ctx.createRadialGradient(
        h.x - 2, h.y - 2, 1,
        h.x, h.y, this.hydrogenRadius
      );
      hGrad.addColorStop(0, '#FFFFFF');
      hGrad.addColorStop(1, '#CBD5E1');

      ctx.fillStyle = hGrad;
      ctx.beginPath();
      ctx.arc(h.x, h.y, this.hydrogenRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#94A3B8';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#1E293B';
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('H', h.x, h.y);
    });

    // 3. 중심 산소 원자 (O) (산소 레드 #F87171)
    const oGrad = ctx.createRadialGradient(
      ox - 3, oy - 3, 2,
      ox, oy, this.oxygenRadius
    );
    oGrad.addColorStop(0, '#FECACA');
    oGrad.addColorStop(0.4, '#F87171');
    oGrad.addColorStop(1, '#DC2626');

    ctx.fillStyle = oGrad;
    ctx.beginPath();
    ctx.arc(ox, oy, this.oxygenRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('O', ox, oy);

    ctx.restore();
  }
}

/**
 * 중화 반응 에너지 방출 스파크 파티클
 */
export class SparkParticle {
  /**
   * @param {number} x
   * @param {number} y
   */
  constructor(x, y) {
    this.x = x;
    this.y = y;
    const angle = Math.random() * Math.PI * 2;
    const speed = 40 + Math.random() * 100;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;

    this.maxLife = 0.4 + Math.random() * 0.35;
    this.life = this.maxLife;
    this.radius = 2 + Math.random() * 3.5;

    const colors = ['#F59E0B', '#FCD34D', '#EF4444', '#FFFFFF'];
    this.color = colors[Math.floor(Math.random() * colors.length)];
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vx *= 0.96;
    this.vy *= 0.96;
    this.life -= dt;
  }

  render(ctx) {
    if (this.life <= 0) return;
    const alpha = Math.max(0, this.life / this.maxLife);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * alpha, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

/**
 * 상단 스포이트 액적 낙하 애니메이션
 */
export class DropAnimation {
  /**
   * @param {string} type - 'NaOH' | 'HCl'
   * @param {number} startX
   * @param {number} startY
   * @param {number} targetY
   * @param {Function|null} onComplete
   */
  constructor(type, startX, startY, targetY, onComplete = null) {
    this.type = type;
    this.x = startX;
    this.y = startY;
    this.targetY = targetY;
    this.onComplete = onComplete;
    this.speed = 360; // px/s
    this.radius = 6;
    this.color = type === 'NaOH' ? '#3B82F6' : '#EF4444';
    this.isDone = false;
    this.rippleRadius = 0;
    this.maxRippleRadius = 24;
  }

  update(dt) {
    if (this.isDone) {
      this.rippleRadius += dt * 45;
      return;
    }

    this.y += this.speed * dt;
    if (this.y >= this.targetY) {
      this.y = this.targetY;
      this.isDone = true;
      if (typeof this.onComplete === 'function') {
        this.onComplete();
      }
    }
  }

  isFinished() {
    return this.isDone && this.rippleRadius >= this.maxRippleRadius;
  }

  render(ctx) {
    ctx.save();
    if (!this.isDone) {
      // 떨어지는 물방울 (눈물 방울 형태)
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(this.x - this.radius * 0.8, this.y);
      ctx.lineTo(this.x, this.y - this.radius * 1.8);
      ctx.lineTo(this.x + this.radius * 0.8, this.y);
      ctx.closePath();
      ctx.fill();
    } else {
      // 착수 수면 파문 (Ripple)
      const rippleAlpha = Math.max(0, 1 - this.rippleRadius / this.maxRippleRadius);
      ctx.globalAlpha = rippleAlpha * 0.7;
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.x, this.targetY, this.rippleRadius, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }
}

/**
 * 2D Canvas 입자 물리 시뮬레이션 메인 엔진
 */
export class ParticleSimulation {
  /**
   * @param {HTMLCanvasElement|object|null} canvas
   * @param {object} [options={}]
   * @param {object} [options.soundEngine=null]
   * @param {Function} [options.onReactionOccurred=null]
   * @param {number} [options.width=600]
   * @param {number} [options.height=600]
   */
  constructor(canvas = null, options = {}) {
    this.canvas = canvas;
    this.soundEngine = options.soundEngine || null;
    this.onReactionOccurred = options.onReactionOccurred || null;

    this.width = canvas?.width || options.width || 600;
    this.height = canvas?.height || options.height || 600;

    this.centerX = this.width / 2;
    this.centerY = this.height / 2;
    this.viewportRadius = Math.min(this.width, this.height) * 0.42;

    /** @type {IonParticle[]} */
    this.particles = [];
    /** @type {WaterMolecule[]} */
    this.waterMolecules = [];
    /** @type {SparkParticle[]} */
    this.sparks = [];
    /** @type {DropAnimation[]} */
    this.dropAnimations = [];

    this.highlightNetIons = false;
    this.showWaterMolecules = true;
    this.speedMultiplier = 1.0;
    this.isRunning = false;
    this.animFrameId = null;
    this.lastTime = 0;

    // 물리 상수
    this.attractionRadius = 70; // H+와 OH- 간 인력 작동 거리 (px)
    this.combinedRadius = 24;   // 결합 충돌 판정 거리 (px)
    this.maxSpeed = 80;         // 최대 열운동 속도 (px/s)
    this.thermalJitter = 140;   // 브라운 운동 충격량
  }

  /**
   * 하이라이트 모드 설정 (알짜 이온 강조 / 구경꾼 이온 반투명)
   * @param {boolean} highlight
   */
  setHighlightNetIons(highlight) {
    this.highlightNetIons = Boolean(highlight);
  }

  /**
   * 물 분자 표시 여부 설정
   * @param {boolean} show
   */
  setShowWaterMolecules(show) {
    this.showWaterMolecules = Boolean(show);
  }

  /**
   * 시뮬레이션 속도 배율 설정 (0.1x ~ 3.0x)
   * @param {number} multiplier
   */
  setSpeed(multiplier) {
    this.speedMultiplier = Math.max(0.1, Number(multiplier) || 1.0);
  }

  /**
   * 모든 입자 및 효과 초기화
   */
  clear() {
    this.particles = [];
    this.waterMolecules = [];
    this.sparks = [];
    this.dropAnimations = [];
  }

  /**
   * 현재 시뮬레이션 내부 입자 수 계산
   * @returns {{ h: number, cl: number, na: number, oh: number, h2o: number, total: number }}
   */
  getParticleCounts() {
    let h = 0, cl = 0, na = 0, oh = 0;
    for (const p of this.particles) {
      if (p.type === 'H+') h++;
      else if (p.type === 'Cl-') cl++;
      else if (p.type === 'Na+') na++;
      else if (p.type === 'OH-') oh++;
    }
    const h2o = this.waterMolecules.length;
    return { h, cl, na, oh, h2o, total: h + cl + na + oh + h2o };
  }

  /**
   * 뷰포트 내부 랜덤 위치 생성
   * @param {number} margin
   * @returns {{ x: number, y: number }}
   */
  _getRandomSpawnPos(margin = 25) {
    const maxR = Math.max(10, this.viewportRadius - margin);
    const r = Math.sqrt(Math.random()) * maxR;
    const theta = Math.random() * Math.PI * 2;
    return {
      x: this.centerX + Math.cos(theta) * r,
      y: this.centerY + Math.sin(theta) * r
    };
  }

  /**
   * 화학 상태와 물리 시뮬레이션 입자 수 동기화
   * @param {{ hCount: number, clCount: number, naCount: number, ohCount: number, h2oCount: number }} chemistryState
   */
  syncWithState(chemistryState) {
    const targetH = Math.round(chemistryState.hCount || 0);
    const targetCl = Math.round(chemistryState.clCount || 0);
    const targetNa = Math.round(chemistryState.naCount || 0);
    const targetOH = Math.round(chemistryState.ohCount || 0);
    const targetH2O = Math.round(chemistryState.h2oCount || 0);

    // 각 이온 타입별 동기화 헬퍼
    const syncIonType = (type, targetCount) => {
      const currentList = this.particles.filter(p => p.type === type);
      const currentCount = currentList.length;

      if (currentCount < targetCount) {
        // 부족한 만큼 생성
        const needed = targetCount - currentCount;
        for (let i = 0; i < needed; i++) {
          const pos = this._getRandomSpawnPos();
          const angle = Math.random() * Math.PI * 2;
          const speed = 20 + Math.random() * 30;
          this.particles.push(new IonParticle(
            type,
            pos.x,
            pos.y,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed
          ));
        }
      } else if (currentCount > targetCount) {
        // 초과분 제거
        let toRemove = currentCount - targetCount;
        this.particles = this.particles.filter(p => {
          if (p.type === type && toRemove > 0) {
            toRemove--;
            return false;
          }
          return true;
        });
      }
    };

    syncIonType('H+', targetH);
    syncIonType('Cl-', targetCl);
    syncIonType('Na+', targetNa);
    syncIonType('OH-', targetOH);

    // 물 분자 (H2O) 동기화
    const currentH2O = this.waterMolecules.length;
    if (currentH2O < targetH2O) {
      const needed = targetH2O - currentH2O;
      for (let i = 0; i < needed; i++) {
        const pos = this._getRandomSpawnPos(30);
        const angle = Math.random() * Math.PI * 2;
        const speed = 10 + Math.random() * 20;
        this.waterMolecules.push(new WaterMolecule(
          pos.x,
          pos.y,
          Math.cos(angle) * speed,
          Math.sin(angle) * speed
        ));
      }
    } else if (currentH2O > targetH2O) {
      this.waterMolecules.splice(targetH2O);
    }
  }

  /**
   * 스포이트 액적 낙하 애니메이션 시작
   * @param {string} [type='NaOH']
   * @param {Function} [onComplete=null]
   */
  spawnDropAnimation(type = 'NaOH', onComplete = null) {
    const startX = this.centerX;
    const startY = 15;
    const targetY = this.centerY - this.viewportRadius + 35;

    const drop = new DropAnimation(type, startX, startY, targetY, onComplete);
    this.dropAnimations.push(drop);
  }

  /**
   * 중화열 스파크 파티클 버스트 생성
   * @param {number} x
   * @param {number} y
   * @param {number} [count=12]
   */
  spawnSparks(x, y, count = 12) {
    for (let i = 0; i < count; i++) {
      this.sparks.push(new SparkParticle(x, y));
    }
  }

  /**
   * 물리 엔진 상태 갱신
   * @param {number} [deltaTime=0.016]
   * @param {object} [physicsOptions={}]
   * @param {boolean} [physicsOptions.disableBrownian=false]
   */
  update(deltaTime = 0.016, physicsOptions = {}) {
    // deltaTime 안전 범위 보정
    const dt = Math.min(5.0, Math.max(0.001, deltaTime)) * this.speedMultiplier;
    const disableBrownian = Boolean(physicsOptions.disableBrownian);

    // 1. 드롭 애니메이션 갱신
    for (const drop of this.dropAnimations) {
      drop.update(dt);
    }
    this.dropAnimations = this.dropAnimations.filter(d => !d.isFinished());

    // 2. H+ 와 OH- 간의 정전기적 인력 및 중화 반응 충돌 판정
    const hList = this.particles.filter(p => p.type === 'H+');
    const ohList = this.particles.filter(p => p.type === 'OH-');

    const reactedHSet = new Set();
    const reactedOHSet = new Set();
    const reactionEvents = [];

    // 인력 및 결합 체크
    for (const h of hList) {
      if (reactedHSet.has(h)) continue;

      let nearestOH = null;
      let minDistance = Infinity;

      for (const oh of ohList) {
        if (reactedOHSet.has(oh)) continue;

        const dist = Math.hypot(h.x - oh.x, h.y - oh.y);
        if (dist < minDistance) {
          minDistance = dist;
          nearestOH = oh;
        }
      }

      if (nearestOH) {
        if (minDistance <= this.combinedRadius) {
          // 중화 반응 결합 발생!
          reactedHSet.add(h);
          reactedOHSet.add(nearestOH);
          reactionEvents.push({ h, oh: nearestOH });
        } else if (minDistance <= this.attractionRadius) {
          // 인력 적용 (거리에 반비례하는 스프링 인력)
          const force = 180 * (1 - minDistance / this.attractionRadius);
          const dx = (nearestOH.x - h.x) / minDistance;
          const dy = (nearestOH.y - h.y) / minDistance;

          h.vx += dx * force * dt;
          h.vy += dy * force * dt;
          nearestOH.vx -= dx * force * dt;
          nearestOH.vy -= dy * force * dt;
        }
      }
    }

    // 중화 반응 이벤트 처리: H+와 OH- 소멸 및 H2O 생성
    if (reactionEvents.length > 0) {
      for (const { h, oh } of reactionEvents) {
        const mx = (h.x + oh.x) / 2;
        const my = (h.y + oh.y) / 2;

        // 물 분자 생성
        const newMolecule = new WaterMolecule(mx, my, (h.vx + oh.vx) * 0.3, (h.vy + oh.vy) * 0.3);
        this.waterMolecules.push(newMolecule);

        // 중화열 스파크 버스트 방출
        this.spawnSparks(mx, my, 14);

        // 반응 사운드 트리거
        if (this.soundEngine && typeof this.soundEngine.playReact === 'function') {
          try {
            this.soundEngine.playReact();
          } catch (_) {}
        }

        // 반응 콜백 알림
        if (typeof this.onReactionOccurred === 'function') {
          this.onReactionOccurred({
            hIon: h,
            ohIon: oh,
            waterMolecule: newMolecule,
            x: mx,
            y: my
          });
        }
      }

      // 반응에 참여한 이온들을 시뮬레이션 배열에서 제거
      this.particles = this.particles.filter(p => !reactedHSet.has(p) && !reactedOHSet.has(p));
    }

    // 3. 이온 열운동 (브라운 운동) 및 경계 충돌 바운스
    for (const p of this.particles) {
      if (!disableBrownian) {
        // 브라운 열운동 랜덤 킥
        p.vx += (Math.random() - 0.5) * this.thermalJitter * dt;
        p.vy += (Math.random() - 0.5) * this.thermalJitter * dt;

        // 유체 저항 감쇠
        p.vx *= 0.985;
        p.vy *= 0.985;

        // 속도 제한
        const speed = Math.hypot(p.vx, p.vy);
        if (speed > this.maxSpeed) {
          p.vx = (p.vx / speed) * this.maxSpeed;
          p.vy = (p.vy / speed) * this.maxSpeed;
        }
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;

      // 원형 뷰포트 경계 반사
      const distFromCenter = Math.hypot(p.x - this.centerX, p.y - this.centerY);
      const maxDist = this.viewportRadius - p.radius;

      if (distFromCenter > maxDist && distFromCenter > 0.001) {
        const nx = (p.x - this.centerX) / distFromCenter;
        const ny = (p.y - this.centerY) / distFromCenter;

        // 위치 보정
        p.x = this.centerX + nx * maxDist;
        p.y = this.centerY + ny * maxDist;

        // 속도 벡터 반사
        const dot = p.vx * nx + p.vy * ny;
        if (dot > 0) {
          p.vx -= 1.8 * dot * nx;
          p.vy -= 1.8 * dot * ny;
        }
      }
    }

    // 4. 물 분자 (H2O) 열운동 및 경계 처리
    for (const m of this.waterMolecules) {
      if (!disableBrownian) {
        m.vx += (Math.random() - 0.5) * (this.thermalJitter * 0.6) * dt;
        m.vy += (Math.random() - 0.5) * (this.thermalJitter * 0.6) * dt;
        m.vx *= 0.98;
        m.vy *= 0.98;
      }

      m.x += m.vx * dt;
      m.y += m.vy * dt;
      m.rotation += m.vRot * dt;

      const dist = Math.hypot(m.x - this.centerX, m.y - this.centerY);
      const maxDist = this.viewportRadius - m.radius;
      if (dist > maxDist && dist > 0.001) {
        const nx = (m.x - this.centerX) / dist;
        const ny = (m.y - this.centerY) / dist;
        m.x = this.centerX + nx * maxDist;
        m.y = this.centerY + ny * maxDist;

        const dot = m.vx * nx + m.vy * ny;
        if (dot > 0) {
          m.vx -= 1.6 * dot * nx;
          m.vy -= 1.6 * dot * ny;
        }
      }
    }

    // 5. 스파크 파티클 갱신
    for (const spark of this.sparks) {
      spark.update(dt);
    }
    this.sparks = this.sparks.filter(s => s.life > 0);
  }

  /**
   * 캔버스 렌더링
   * @param {CanvasRenderingContext2D|null} [context=null]
   */
  render(context = null) {
    const ctx = context || this.canvas?.getContext?.('2d');
    if (!ctx) return;

    ctx.save();
    ctx.clearRect(0, 0, this.width, this.height);

    // 1. 원형 뷰포트 배경 렌더링
    this._renderViewportBackground(ctx);

    // 2. 결합된 물 분자 (H2O) 렌더링
    for (const m of this.waterMolecules) {
      m.render(ctx, this.showWaterMolecules, this.highlightNetIons);
    }

    // 3. 이온 입자 렌더링 (구경꾼 이온 먼저, 알짜 이온 나중에 그려서 가시성 확보)
    const spectators = this.particles.filter(p => p.isSpectator);
    const netIons = this.particles.filter(p => p.isNet);

    for (const p of spectators) {
      p.render(ctx, this.highlightNetIons);
    }
    for (const p of netIons) {
      p.render(ctx, this.highlightNetIons);
    }

    // 4. 중화열 스파크 파티클 렌더링
    for (const s of this.sparks) {
      s.render(ctx);
    }

    // 5. 상단 스포이트 드롭 애니메이션 렌더링
    for (const drop of this.dropAnimations) {
      drop.render(ctx);
    }

    // 6. 돋보기/비커 렌즈 테두리 림 렌더링
    this._renderViewportRim(ctx);

    ctx.restore();
  }

  /**
   * 뷰포트 내부 수용액 배경
   * @private
   */
  _renderViewportBackground(ctx) {
    ctx.save();

    // 원형 클리핑 영역 정의
    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, this.viewportRadius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    // 은은한 수용액 그라데이션
    const bgGrad = ctx.createRadialGradient(
      this.centerX, this.centerY - this.viewportRadius * 0.3, this.viewportRadius * 0.1,
      this.centerX, this.centerY, this.viewportRadius
    );
    bgGrad.addColorStop(0, '#F0F9FF'); // 아주 맑은 수용액 빛
    bgGrad.addColorStop(0.7, '#E0F2FE');
    bgGrad.addColorStop(1, '#BAE6FD');

    ctx.fillStyle = bgGrad;
    ctx.fill();

    // 미세한 파동 효과 (Water wave line)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const waveY = this.centerY - this.viewportRadius * 0.7;
    ctx.moveTo(this.centerX - this.viewportRadius, waveY);
    if (typeof ctx.bezierCurveTo === 'function') {
      ctx.bezierCurveTo(
        this.centerX - this.viewportRadius * 0.4, waveY - 8,
        this.centerX + this.viewportRadius * 0.4, waveY + 8,
        this.centerX + this.viewportRadius, waveY
      );
    } else {
      ctx.lineTo(this.centerX + this.viewportRadius, waveY);
    }
    ctx.stroke();

    ctx.restore();
  }

  /**
   * 뷰포트 외곽 돋보기 테두리 림
   * @private
   */
  _renderViewportRim(ctx) {
    ctx.save();

    // 1. 외곽 섀도우 및 금속 림
    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, this.viewportRadius, 0, Math.PI * 2);
    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 6;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, this.viewportRadius + 3, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(203, 213, 225, 0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 2. 유리 표면 하이라이트 아크 (Gloss shine)
    ctx.beginPath();
    ctx.arc(
      this.centerX, this.centerY,
      this.viewportRadius - 8,
      Math.PI * 1.15, Math.PI * 1.65
    );
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.stroke();

    ctx.restore();
  }

  /**
   * 애니메이션 루프 시작
   */
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = (typeof performance !== 'undefined' ? performance.now() : Date.now());

    const loop = (timestamp) => {
      if (!this.isRunning) return;

      const now = timestamp || (typeof performance !== 'undefined' ? performance.now() : Date.now());
      const delta = (now - this.lastTime) / 1000;
      this.lastTime = now;

      this.update(delta);
      this.render();

      if (typeof requestAnimationFrame !== 'undefined') {
        this.animFrameId = requestAnimationFrame(loop);
      }
    };

    if (typeof requestAnimationFrame !== 'undefined') {
      this.animFrameId = requestAnimationFrame(loop);
    }
  }

  /**
   * 애니메이션 루프 정지
   */
  stop() {
    this.isRunning = false;
    if (this.animFrameId && typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }
}
