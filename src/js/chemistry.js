/**
 * NeutralizationReaction
 * 
 * 중화 반응(HCl + NaOH) 및 열역학 상태 머신
 * 2022 개정 교육과정 중학교 3학년 / 고등학교 통합과학 기준
 */
export class NeutralizationReaction {
  /**
   * @param {number} initialHclVolume - 초기 묽은 염산 부피 (mL, 기본값 10)
   * @param {number} initialConcentration - 초기 농도 계수 (기본값 1, 1mL당 1입자)
   */
  constructor(initialHclVolume = 10, initialConcentration = 1) {
    this.initialHclVolume = initialHclVolume;
    this.initialConcentration = initialConcentration;
    this.initialParticles = Math.round(initialHclVolume * initialConcentration);
    this.reset();
  }

  /**
   * 상태 초기화 (NaOH 투입량 0mL)
   */
  reset() {
    this.naohVolume = 0;
  }

  /**
   * 수산화나트륨(NaOH) 부피 증분 추가
   * @param {number} volumeMl 
   */
  addNaoh(volumeMl) {
    this.naohVolume = Math.max(0, Math.round((this.naohVolume + volumeMl) * 1000) / 1000);
  }

  /**
   * 수산화나트륨(NaOH) 부피 직접 설정
   * @param {number} volumeMl 
   */
  setNaohVolume(volumeMl) {
    this.naohVolume = Math.max(0, Math.round(volumeMl * 1000) / 1000);
  }

  /**
   * 현재 상태 반환
   * @returns {{
   *   hclVolume: number,
   *   naohVolume: number,
   *   totalVolume: number,
   *   hCount: number,
   *   clCount: number,
   *   naCount: number,
   *   ohCount: number,
   *   h2oCount: number,
   *   totalIons: number,
   *   temperature: number,
   *   solutionState: '산성' | '중성' | '염기성',
   *   btbColor: string,
   *   ppColor: string,
   *   isEquivalencePoint: boolean
   * }}
   */
  getState() {
    const hclVol = this.initialHclVolume;
    const naohVol = this.naohVolume;
    const totalVolume = Math.round((hclVol + naohVol) * 1000) / 1000;

    const initialH = this.initialParticles;
    const initialCl = this.initialParticles;
    const addedNa = Math.round(naohVol * this.initialConcentration * 1000) / 1000;
    const addedOH = addedNa;

    const reactedH2O = Math.min(initialH, addedOH);
    const hCount = Math.max(0, Math.round((initialH - addedOH) * 1000) / 1000);
    const ohCount = Math.max(0, Math.round((addedOH - initialH) * 1000) / 1000);
    const clCount = initialCl;
    const naCount = addedNa;
    const totalIons = Math.round((hCount + clCount + naCount + ohCount) * 1000) / 1000;

    // 온도 계산 모델: 초기 20도 + 결합당 +0.85도, 중화점 이후 실온 용액 유입으로 인한 냉각
    let temperature;
    if (naohVol <= hclVol) {
      temperature = 20.0 + (reactedH2O * 0.85);
    } else {
      const heatLostFactor = (naohVol - hclVol) * 0.28;
      temperature = Math.max(20.0, 28.5 - heatLostFactor);
    }
    temperature = Math.round(temperature * 10) / 10;

    const isEquivalencePoint = (hCount === 0 && ohCount === 0 && naohVol > 0);

    let solutionState;
    let btbColor;
    let ppColor;

    if (hCount > ohCount) {
      solutionState = '산성';
      btbColor = '#F59E0B'; // 노란색
      ppColor = 'rgba(224, 242, 254, 0.4)'; // 무색투명
    } else if (isEquivalencePoint) {
      solutionState = '중성';
      btbColor = '#10B981'; // 청명한 에메랄드 초록
      ppColor = 'rgba(224, 242, 254, 0.4)'; // 무색투명
    } else {
      solutionState = '염기성';
      btbColor = '#2563EB'; // 파란색
      ppColor = '#E11D48'; // 붉은색
    }

    return {
      hclVolume: hclVol,
      naohVolume: naohVol,
      totalVolume,
      hCount,
      clCount,
      naCount,
      ohCount,
      h2oCount: reactedH2O,
      totalIons,
      temperature,
      solutionState,
      btbColor,
      ppColor,
      isEquivalencePoint
    };
  }

  /**
   * 중화 반응 곡선 데이터 전체 산출
   * @param {number} maxVolume 
   * @param {number} step 
   * @returns {Array<object>}
   */
  getCurveData(maxVolume = 20, step = 0.5) {
    const originalVol = this.naohVolume;
    const points = [];
    const count = Math.round(maxVolume / step);
    for (let i = 0; i <= count; i++) {
      const v = Math.round(i * step * 1000) / 1000;
      this.setNaohVolume(v);
      const st = this.getState();
      points.push({ volume: v, ...st });
    }
    this.setNaohVolume(originalVol);
    return points;
  }
}
