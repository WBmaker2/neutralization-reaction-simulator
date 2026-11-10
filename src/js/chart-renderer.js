/**
 * 거시적 비커 뷰 & 정량 실시간 차트 렌더러
 * HTML5 2D Canvas 기반 순수 렌더링 엔진 (외부 라이브러리 의존성 없음)
 */

export class BeakerRenderer {
  constructor() {
    this.beakerMarginTop = 85;
    this.beakerMarginBottom = 30;
  }

  /**
   * 부피(mL)에 따른 비커 내 수면 높이 Y 좌표 계산 (Canvas 좌표계: 위쪽이 0)
   * @param {number} volume - 현재 용액 총부피 (mL, 기본 10~40mL 스케일)
   * @param {number} height - 캔버스 높이 (px)
   * @returns {number} Y 좌표
   */
  getLiquidSurfaceY(volume, height) {
    const bottomY = height - this.beakerMarginBottom - 18;
    const topGradY = this.beakerMarginTop + 45;
    const maxVolume = 45;
    const clampedVol = Math.max(0, Math.min(maxVolume, volume));
    const fraction = clampedVol / maxVolume;
    return bottomY - fraction * (bottomY - topGradY);
  }

  /**
   * 지시약 종류 및 용액 상태에 따른 색상 코드 반환
   * @param {object} state - Chemistry state
   * @param {string} indicatorType - 'btb' | 'pp'
   * @returns {string} CSS 색상 문자열
   */
  resolveIndicatorColor(state, indicatorType = 'btb') {
    if (indicatorType === 'pp') {
      return state.ppColor || (state.solutionState === '염기성' ? '#E11D48' : 'rgba(224, 242, 254, 0.35)');
    }
    // BTB
    if (state.solutionState === '산성') return '#F59E0B'; // 노란색
    if (state.solutionState === '중성') return '#10B981'; // 초록색
    return '#2563EB'; // 파란색
  }

  /**
   * 비커 및 실험실 기구 전체 렌더링
   * @param {HTMLCanvasElement|object} canvas
   * @param {object} state - Chemistry state
   * @param {string} [indicatorType='btb'] - 'btb' | 'pp'
   */
  render(canvas, state, indicatorType = 'btb') {
    if (!canvas || typeof canvas.getContext !== 'function') return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width || 400;
    const height = canvas.height || 450;
    if (width <= 0 || height <= 0) return;

    ctx.save();
    ctx.clearRect(0, 0, width, height);

    const beakerX = width * 0.18;
    const beakerW = width * 0.64;
    const beakerTop = this.beakerMarginTop;
    const beakerBottom = height - this.beakerMarginBottom;
    const beakerH = beakerBottom - beakerTop;
    const radius = 16;

    const totalVol = state?.totalVolume || 10;
    const liquidY = this.getLiquidSurfaceY(totalVol, height);
    const liquidColor = this.resolveIndicatorColor(state || {}, indicatorType);

    // 1. 비커 그림자 (Glass Shadow)
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(width * 0.5, beakerBottom + 8, beakerW * 0.52, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 2. 비커 내부 수용액 (Liquid Fill)
    ctx.save();
    ctx.beginPath();
    // 비커 바닥 모서리 둥글게 클리핑
    ctx.moveTo(beakerX, liquidY);
    ctx.lineTo(beakerX, beakerBottom - radius);
    ctx.quadraticCurveTo(beakerX, beakerBottom, beakerX + radius, beakerBottom);
    ctx.lineTo(beakerX + beakerW - radius, beakerBottom);
    ctx.quadraticCurveTo(beakerX + beakerW, beakerBottom, beakerX + beakerW, beakerBottom - radius);
    ctx.lineTo(beakerX + beakerW, liquidY);
    ctx.closePath();

    // 수용액 그라데이션
    const liqGrad = ctx.createLinearGradient(beakerX, liquidY, beakerX + beakerW, beakerBottom);
    if (indicatorType === 'pp') {
      if (state?.solutionState === '염기성') {
        liqGrad.addColorStop(0, 'rgba(244, 63, 94, 0.75)');
        liqGrad.addColorStop(0.5, '#E11D48');
        liqGrad.addColorStop(1, 'rgba(190, 24, 93, 0.9)');
      } else {
        liqGrad.addColorStop(0, 'rgba(224, 242, 254, 0.35)');
        liqGrad.addColorStop(1, 'rgba(186, 230, 253, 0.45)');
      }
    } else {
      // BTB
      if (state?.solutionState === '산성') {
        liqGrad.addColorStop(0, '#FBBF24');
        liqGrad.addColorStop(1, '#D97706');
      } else if (state?.solutionState === '중성') {
        liqGrad.addColorStop(0, '#34D399');
        liqGrad.addColorStop(1, '#059669');
      } else {
        liqGrad.addColorStop(0, '#60A5FA');
        liqGrad.addColorStop(1, '#1D4ED8');
      }
    }
    ctx.fillStyle = liqGrad;
    ctx.fill();

    // 수면 표면 타원 (Water Meniscus)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.ellipse(beakerX + beakerW / 2, liquidY, beakerW / 2 - 2, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 3. 비커 눈금선 (Graduation marks)
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    const graduations = [10, 20, 30, 40];
    graduations.forEach(vol => {
      const gy = this.getLiquidSurfaceY(vol, height);
      ctx.beginPath();
      ctx.moveTo(beakerX + 6, gy);
      ctx.lineTo(beakerX + 22, gy);
      ctx.stroke();

      // 보조 눈금선
      if (vol < 40) {
        const subGy = this.getLiquidSurfaceY(vol + 5, height);
        ctx.beginPath();
        ctx.moveTo(beakerX + 6, subGy);
        ctx.lineTo(beakerX + 15, subGy);
        ctx.stroke();
      }

      ctx.fillText(`${vol}mL`, beakerX + 54, gy);
    });
    ctx.restore();

    // 4. 비커 유리 외곽선 및 반사 하이라이트 (Glass Outline & Specular)
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    // 비커 주둥이(Spout)
    ctx.moveTo(beakerX - 10, beakerTop);
    ctx.lineTo(beakerX, beakerTop + 6);
    ctx.lineTo(beakerX, beakerBottom - radius);
    ctx.quadraticCurveTo(beakerX, beakerBottom, beakerX + radius, beakerBottom);
    ctx.lineTo(beakerX + beakerW - radius, beakerBottom);
    ctx.quadraticCurveTo(beakerX + beakerW, beakerBottom, beakerX + beakerW, beakerBottom - radius);
    ctx.lineTo(beakerX + beakerW, beakerTop);
    ctx.stroke();

    // 상단 림 립
    ctx.beginPath();
    ctx.ellipse(beakerX + beakerW / 2, beakerTop, beakerW / 2 + 4, 6, 0, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 유리 광택 하이라이트 (세로 흰색 줄)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(beakerX + 12, beakerTop + 15);
    ctx.lineTo(beakerX + 12, beakerBottom - 20);
    ctx.stroke();
    ctx.restore();

    // 5. 상단 뷰렛/스포이트 (Burette / Dropper)
    ctx.save();
    const dropX = beakerX + beakerW * 0.38;
    const buretteTop = 6;
    const buretteBottom = beakerTop - 18;

    // 뷰렛 몸체
    ctx.fillStyle = 'rgba(147, 197, 253, 0.22)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.fillRect(dropX - 10, buretteTop, 20, buretteBottom - buretteTop);
    ctx.strokeRect(dropX - 10, buretteTop, 20, buretteBottom - buretteTop);

    // 뷰렛 속 NaOH 푸른 수용액
    ctx.fillStyle = 'rgba(59, 130, 246, 0.7)';
    ctx.fillRect(dropX - 8, buretteTop + 4, 16, buretteBottom - buretteTop - 8);

    // 뷰렛 노즐 팁
    ctx.beginPath();
    ctx.moveTo(dropX - 10, buretteBottom);
    ctx.lineTo(dropX - 3, buretteBottom + 16);
    ctx.lineTo(dropX + 3, buretteBottom + 16);
    ctx.lineTo(dropX + 10, buretteBottom);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fill();
    ctx.stroke();

    // 뷰렛 라벨
    ctx.fillStyle = '#93C5FD';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('NaOH 수용액', dropX, buretteTop + 14);
    ctx.restore();

    // 6. 비커 내 정밀 온도계 (Digital & Mercury Thermometer)
    ctx.save();
    const thermoX = beakerX + beakerW - 32;
    const thermoTop = beakerTop - 25;
    const thermoBottom = beakerBottom - 14;
    const thermoW = 10;
    const bulbR = 11;

    // 온도계 유리관
    ctx.fillStyle = 'rgba(241, 245, 249, 0.85)';
    ctx.strokeStyle = 'rgba(203, 213, 225, 0.9)';
    ctx.lineWidth = 1.5;
    ctx.fillRect(thermoX - thermoW / 2, thermoTop, thermoW, thermoBottom - thermoTop);
    ctx.strokeRect(thermoX - thermoW / 2, thermoTop, thermoW, thermoBottom - thermoTop);

    // 하단 수은 구(Bulb)
    ctx.beginPath();
    ctx.arc(thermoX, thermoBottom, bulbR, 0, Math.PI * 2);
    ctx.fillStyle = '#EF4444'; // 붉은 수은
    ctx.fill();
    ctx.strokeStyle = '#B91C1C';
    ctx.stroke();

    // 수은 기둥 높이 (온도 연동: 15°C ~ 32°C 범위)
    const temp = state?.temperature || 20.0;
    const tempFrac = Math.max(0, Math.min(1, (temp - 15) / (32 - 15)));
    const mercuryHeight = tempFrac * (thermoBottom - thermoTop - 15);

    ctx.fillStyle = '#EF4444';
    ctx.fillRect(thermoX - 2.5, thermoBottom - mercuryHeight, 5, mercuryHeight);

    // 디지털 온도 표시 LCD 박스
    const lcdW = 68;
    const lcdH = 26;
    const lcdX = thermoX - lcdW / 2;
    const lcdY = thermoTop - 32;

    ctx.fillStyle = '#0F172A';
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(lcdX, lcdY, lcdW, lcdH, 6) : ctx.rect(lcdX, lcdY, lcdW, lcdH);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#38BDF8';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${temp.toFixed(1)}°C`, thermoX, lcdY + lcdH / 2);

    ctx.restore();
    ctx.restore();
  }
}

export class QuantitativeChartRenderer {
  constructor() {}

  mapVolumeToX(vol, bounds, minVol = 0, maxVol = 20) {
    const fraction = (vol - minVol) / (maxVol - minVol);
    return bounds.x + fraction * bounds.width;
  }

  mapValueToY(val, bounds, minVal = 0, maxVal = 25) {
    const fraction = (val - minVal) / (maxVal - minVal);
    return bounds.y + bounds.height - fraction * bounds.height;
  }

  /**
   * 부피 대비 4대 이온수 곡선 차트 렌더링
   * @param {HTMLCanvasElement|object} canvas
   * @param {Array} curvePoints - getCurveData() 데이터
   * @param {number} currentVolume - 현재 주입된 NaOH 부피 (mL)
   */
  renderIonChart(canvas, curvePoints = [], currentVolume = 0) {
    if (!canvas || typeof canvas.getContext !== 'function') return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width || 420;
    const height = canvas.height || 280;
    if (width <= 0 || height <= 0) return;

    ctx.save();
    ctx.clearRect(0, 0, width, height);

    const bounds = {
      x: 52,
      y: 42,
      width: width - 78,
      height: height - 86
    };

    // 1. 차트 배경 및 그리드
    ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
    ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)';
    ctx.lineWidth = 1;

    // Y축 수평 그리드 (0, 5, 10, 15, 20, 25)
    ctx.fillStyle = '#94A3B8';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    for (let count = 0; count <= 25; count += 5) {
      const y = this.mapValueToY(count, bounds, 0, 25);
      ctx.beginPath();
      ctx.moveTo(bounds.x, y);
      ctx.lineTo(bounds.x + bounds.width, y);
      ctx.stroke();
      ctx.fillText(String(count), bounds.x - 6, y);
    }

    // X축 수직 그리드 (0, 5, 10, 15, 20 mL)
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let v = 0; v <= 20; v += 5) {
      const x = this.mapVolumeToX(v, bounds, 0, 20);
      ctx.beginPath();
      ctx.moveTo(x, bounds.y);
      ctx.lineTo(x, bounds.y + bounds.height);
      ctx.stroke();
      ctx.fillText(`${v}`, x, bounds.y + bounds.height + 6);
    }

    // 2. 축 레이블 및 제목
    ctx.fillStyle = '#E2E8F0';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('첨가한 NaOH 부피 (mL)', bounds.x + bounds.width / 2, bounds.y + bounds.height + 24);

    ctx.save();
    ctx.translate(14, bounds.y + bounds.height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('이온의 수 (개)', 0, 0);
    ctx.restore();

    // 3. 중화점(10mL) 수직 점선 가이드
    const eqX = this.mapVolumeToX(10, bounds, 0, 20);
    ctx.save();
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(eqX, bounds.y);
    ctx.lineTo(eqX, bounds.y + bounds.height);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = '#34D399';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('★ 중화점 (10mL)', eqX, bounds.y - 12);

    if (curvePoints && curvePoints.length > 0) {
      // 4. 이온 곡선 렌더링
      const series = [
        { key: 'clCount', name: 'Cl⁻ (일정)', color: '#10B981', dash: [] },
        { key: 'naCount', name: 'Na⁺ (증가)', color: '#A855F7', dash: [3, 2] },
        { key: 'hCount', name: 'H⁺ (감소)', color: '#EF4444', dash: [] },
        { key: 'ohCount', name: 'OH⁻ (10mL 이후 증가)', color: '#3B82F6', dash: [] },
        { key: 'totalIons', name: '총 이온 수', color: '#94A3B8', dash: [4, 4] }
      ];

      series.forEach(({ key, color, dash }) => {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = key === 'totalIons' ? 1.5 : 2;
        if (dash.length) ctx.setLineDash(dash);

        ctx.beginPath();
        curvePoints.forEach((pt, idx) => {
          const x = this.mapVolumeToX(pt.volume, bounds, 0, 20);
          const y = this.mapValueToY(pt[key] || 0, bounds, 0, 25);
          if (idx === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
        ctx.restore();
      });

      // 5. 현재 주입량 수직 탐색선 (Cursor Line)
      const curX = this.mapVolumeToX(currentVolume, bounds, 0, 20);
      ctx.save();
      ctx.strokeStyle = '#FCD34D';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(curX, bounds.y);
      ctx.lineTo(curX, bounds.y + bounds.height);
      ctx.stroke();

      // 현재 커서 포인트 표시
      ctx.fillStyle = '#FCD34D';
      ctx.beginPath();
      ctx.arc(curX, bounds.y + bounds.height, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 6. 상단 범례 (Legend)
    ctx.save();
    const legendItems = [
      { text: 'Cl⁻', color: '#10B981' },
      { text: 'Na⁺', color: '#A855F7' },
      { text: 'H⁺', color: '#EF4444' },
      { text: 'OH⁻', color: '#3B82F6' },
      { text: '총이온', color: '#94A3B8' }
    ];

    let legX = bounds.x + bounds.width - 200;
    const legY = bounds.y - 12;

    legendItems.forEach(({ text, color }) => {
      ctx.fillStyle = color;
      ctx.fillRect(legX, legY - 8, 10, 4);
      ctx.fillStyle = '#E2E8F0';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(text, legX + 14, legY - 5);
      legX += 42;
    });
    ctx.restore();

    ctx.restore();
  }

  /**
   * 부피 대비 온도 변화 곡선 차트 렌더링
   * @param {HTMLCanvasElement|object} canvas
   * @param {Array} curvePoints - getCurveData() 데이터
   * @param {number} currentVolume - 현재 주입된 NaOH 부피 (mL)
   */
  renderTempChart(canvas, curvePoints = [], currentVolume = 0) {
    if (!canvas || typeof canvas.getContext !== 'function') return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width || 420;
    const height = canvas.height || 240;
    if (width <= 0 || height <= 0) return;

    ctx.save();
    ctx.clearRect(0, 0, width, height);

    const bounds = {
      x: 52,
      y: 38,
      width: width - 78,
      height: height - 76
    };

    // 1. 차트 배경 및 그리드
    ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
    ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)';
    ctx.lineWidth = 1;

    // Y축 수평 그리드 (18°C ~ 30°C 범위, 2°C 간격)
    ctx.fillStyle = '#94A3B8';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    for (let temp = 18; temp <= 30; temp += 2) {
      const y = this.mapValueToY(temp, bounds, 18, 30);
      ctx.beginPath();
      ctx.moveTo(bounds.x, y);
      ctx.lineTo(bounds.x + bounds.width, y);
      ctx.stroke();
      ctx.fillText(`${temp}°C`, bounds.x - 6, y);
    }

    // X축 수직 그리드 (0 ~ 20 mL)
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let v = 0; v <= 20; v += 5) {
      const x = this.mapVolumeToX(v, bounds, 0, 20);
      ctx.beginPath();
      ctx.moveTo(x, bounds.y);
      ctx.lineTo(x, bounds.y + bounds.height);
      ctx.stroke();
      ctx.fillText(`${v}`, x, bounds.y + bounds.height + 6);
    }

    // 2. 축 제목
    ctx.fillStyle = '#E2E8F0';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('첨가한 NaOH 부피 (mL)', bounds.x + bounds.width / 2, bounds.y + bounds.height + 22);

    ctx.save();
    ctx.translate(14, bounds.y + bounds.height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('혼합 용액의 온도 (°C)', 0, 0);
    ctx.restore();

    if (curvePoints && curvePoints.length > 0) {
      // 3. 온도 곡선 채우기 (열역학 발열 그라데이션)
      ctx.save();
      ctx.beginPath();
      curvePoints.forEach((pt, idx) => {
        const x = this.mapVolumeToX(pt.volume, bounds, 0, 20);
        const y = this.mapValueToY(pt.temperature, bounds, 18, 30);
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.lineTo(this.mapVolumeToX(20, bounds, 0, 20), bounds.y + bounds.height);
      ctx.lineTo(this.mapVolumeToX(0, bounds, 0, 20), bounds.y + bounds.height);
      ctx.closePath();

      const fillGrad = ctx.createLinearGradient(0, bounds.y, 0, bounds.y + bounds.height);
      fillGrad.addColorStop(0, 'rgba(239, 68, 68, 0.35)');
      fillGrad.addColorStop(1, 'rgba(239, 68, 68, 0.02)');
      ctx.fillStyle = fillGrad;
      ctx.fill();

      // 온도 실선
      ctx.beginPath();
      curvePoints.forEach((pt, idx) => {
        const x = this.mapVolumeToX(pt.volume, bounds, 0, 20);
        const y = this.mapValueToY(pt.temperature, bounds, 18, 30);
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = '#EF4444';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.restore();

      // 4. 최고 온도 피크 배지 (중화점 10mL, 28.5°C)
      const peakX = this.mapVolumeToX(10, bounds, 0, 20);
      const peakY = this.mapValueToY(28.5, bounds, 18, 30);

      ctx.save();
      ctx.fillStyle = '#EF4444';
      ctx.beginPath();
      ctx.arc(peakX, peakY, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 배지 텍스트 박스
      const badgeText = '최고 온도 28.5°C (중화점)';
      ctx.font = 'bold 10px sans-serif';
      const textW = ctx.measureText ? ctx.measureText(badgeText).width : 130;
      const bW = textW + 16;
      const bH = 20;
      const bX = peakX - bW / 2;
      const bY = peakY - 26;

      ctx.fillStyle = 'rgba(220, 38, 38, 0.9)';
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(bX, bY, bW, bH, 4) : ctx.rect(bX, bY, bW, bH);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(badgeText, peakX, bY + bH / 2);
      ctx.restore();

      // 5. 현재 주입량 수직 탐색선
      const curX = this.mapVolumeToX(currentVolume, bounds, 0, 20);
      ctx.save();
      ctx.strokeStyle = '#FCD34D';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(curX, bounds.y);
      ctx.lineTo(curX, bounds.y + bounds.height);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }
}
