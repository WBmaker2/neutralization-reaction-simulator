/**
 * 형성평가 골든벨 퀴즈 데이터 및 Canvas 축하 폭죽 파티클 모듈
 */

export const QUIZ_QUESTIONS = [
  {
    question: '일정한 양의 묽은 염산에 수산화나트륨 수용액을 조금씩 넣어 완전히 중화(중화점)되었을 때, 혼합 용액 속에 존재하는 이온은?',
    options: [
      'H⁺와 Cl⁻',
      'Na⁺와 OH⁻',
      'Na⁺와 Cl⁻',
      'H⁺, Cl⁻, Na⁺, OH⁻ 모두 존재'
    ],
    correctIndex: 2,
    explanation: 'H⁺와 OH⁻는 1:1로 결합하여 물(H₂O)이 되므로 모두 소진되고, 반응에 참여하지 않은 구경꾼 이온인 Na⁺와 Cl⁻만 수용액 속에 이온 상태로 남습니다.'
  },
  {
    question: '중화 반응 실험에서 묽은 염산에 수산화나트륨 수용액을 계속 첨가할 때, 혼합 용액의 온도가 가장 높은 지점은 언제인가?',
    options: [
      '수산화나트륨 수용액을 처음 한 방울 넣었을 때',
      '산과 염기가 완전히 반응하여 생성된 물 분자 수가 가장 많을 때 (중화점)',
      '수산화나트륨 수용액을 가장 많이 첨가하여 염기성이 강해졌을 때',
      '반응 내내 열이 발생하지 않으므로 온도는 일정하다'
    ],
    correctIndex: 1,
    explanation: 'H⁺와 OH⁻가 반응하여 물이 생성될 때 중화열이 방출되므로, 반응이 완결되어 물이 가장 많이 생성된 중화점에서 최고 온도를 기록합니다. 그 이후에는 차가운 용액이 추가되어 온도가 낮아집니다.'
  },
  {
    question: 'BTB 용액을 몇 방울 떨어뜨린 묽은 염산에 수산화나트륨 수용액을 계속해서 첨가할 때 나타나는 용액의 색깔 변화 순서는?',
    options: [
      '초록색 → 노란색 → 파란색',
      '노란색 → 초록색 → 파란색',
      '파란색 → 초록색 → 노란색',
      '무색 → 무색 → 붉은색'
    ],
    correctIndex: 1,
    explanation: 'BTB 용액은 산성에서 노란색, 중성(중화점)에서 초록색, 염기성에서 파란색을 띱니다. 염산(산성, 노랑)에 수산화나트륨을 넣으면 중성(초록)을 거쳐 염기성(파랑)으로 변합니다.'
  }
];

export class ConfettiEffect {
  constructor() {
    this.particles = [];
  }

  /**
   * 폭죽 파티클 발사
   * @param {HTMLCanvasElement|object} canvas
   * @param {number} [count=70]
   */
  trigger(canvas, count = 70) {
    if (!canvas) return;
    const width = canvas.width || 400;
    const height = canvas.height || 300;
    const colors = ['#F59E0B', '#10B981', '#3B82F6', '#EC4899', '#8B5CF6', '#FCD34D'];

    for (let i = 0; i < count; i++) {
      const x = width * 0.5 + (Math.random() - 0.5) * 80;
      const y = height * 0.4 + (Math.random() - 0.5) * 40;
      const angle = Math.random() * Math.PI * 2;
      const speed = 120 + Math.random() * 260;

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 120, // 위쪽으로 솟구침
        w: 6 + Math.random() * 6,
        h: 4 + Math.random() * 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 12,
        alpha: 1.0,
        decay: 0.008 + Math.random() * 0.015,
        gravity: 240
      });
    }
  }

  update(dt = 0.016) {
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.gravity * dt;
      p.vx *= 0.98;
      p.rotation += p.rotSpeed * dt;
      p.alpha -= p.decay;
    }
    this.particles = this.particles.filter(p => p.alpha > 0);
  }

  render(ctx) {
    if (!ctx) return;
    ctx.save();
    for (const p of this.particles) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    ctx.restore();
  }

  clear() {
    this.particles = [];
  }
}
