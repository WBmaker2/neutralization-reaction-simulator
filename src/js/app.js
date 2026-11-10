/**
 * 중화 반응 시뮬레이터 메인 애플리케이션 오케스트레이터
 */

import { NeutralizationReaction } from './chemistry.js';
import { SoundEngine } from './audio-effects.js';
import { ParticleSimulation } from './particle-engine.js';
import { BeakerRenderer, QuantitativeChartRenderer } from './chart-renderer.js';
import { QUIZ_QUESTIONS, ConfettiEffect } from './quiz-data.js';
import { CONCEPT_TOPICS } from './concept-data.js';

export function initApp() {
  // 1. 핵심 인스턴스 초기화
  const reaction = new NeutralizationReaction(10, 1);
  const sound = new SoundEngine();
  const beakerRenderer = new BeakerRenderer();
  const chartRenderer = new QuantitativeChartRenderer();
  const confetti = new ConfettiEffect();

  // 2. 캔버스 엘리먼트 획득
  const beakerCanvas = document.getElementById('beakerCanvas');
  const particleCanvas = document.getElementById('particleCanvas');
  const ionChartCanvas = document.getElementById('ionChartCanvas');
  const tempChartCanvas = document.getElementById('tempChartCanvas');
  const confettiCanvas = document.getElementById('confettiCanvas');

  // 파티클 시뮬레이션 인스턴스 생성
  const particleSim = new ParticleSimulation(particleCanvas, {
    soundEngine: sound,
    onReactionOccurred: () => {
      // 결합 시 추가적인 효과가 필요하면 연동
    }
  });

  // 상태 변수
  let currentIndicator = 'btb'; // 'btb' | 'pp'
  let autoTimer = null;
  let currentTab = 'lab'; // 'lab' | 'concept' | 'quiz'

  // 3. UI 갱신 함수 (트리플 싱크)
  function updateAllViews() {
    const state = reaction.getState();
    const curveData = reaction.getCurveData(20, 0.5);

    // (1) 거시적 비커 렌더링
    beakerRenderer.render(beakerCanvas, state, currentIndicator);

    // (2) 미시적 파티클 시뮬레이션 상태 동기화
    particleSim.syncWithState(state);

    // (3) 정량적 실시간 차트 렌더링
    chartRenderer.renderIonChart(ionChartCanvas, curveData, state.naohVolume);
    chartRenderer.renderTempChart(tempChartCanvas, curveData, state.naohVolume);

    // (4) 상태 배지 및 수치 업데이트
    const statusBadge = document.getElementById('statusBadge');
    if (statusBadge) {
      if (state.solutionState === '산성') {
        statusBadge.className = 'px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse';
        statusBadge.innerHTML = '🟡 산성 (H⁺ > OH⁻, pH < 7)';
      } else if (state.solutionState === '중성') {
        statusBadge.className = 'px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/30 text-emerald-300 border border-emerald-400 shadow-lg shadow-emerald-500/30 animate-bounce';
        statusBadge.innerHTML = '🟢 중성 (H⁺ = OH⁻ = 0, ★ 중화점 도달!)';
      } else {
        statusBadge.className = 'px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40 animate-pulse';
        statusBadge.innerHTML = '🔵 염기성 (OH⁻ > H⁺, pH > 7)';
      }
    }

    // 이온 카운터 표 갱신
    const setTxt = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };
    setTxt('valH', state.hCount);
    setTxt('valOH', state.ohCount);
    setTxt('valCl', state.clCount);
    setTxt('valNa', state.naCount);
    setTxt('valH2O', state.h2oCount);
    setTxt('valTemp', `${state.temperature.toFixed(1)}°C`);
    setTxt('valVolume', `${state.naohVolume.toFixed(1)} mL`);
    setTxt('valTotalVol', `${state.totalVolume.toFixed(1)} mL`);
  }

  // 4. 애니메이션 루프 (파티클 및 컨페티)
  let lastTime = performance.now();
  function mainLoop(now) {
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;

    if (currentTab === 'lab') {
      particleSim.update(dt);
      particleSim.render();
    } else if (currentTab === 'quiz') {
      confetti.update(dt);
      const cCtx = confettiCanvas?.getContext('2d');
      if (cCtx) {
        cCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
        confetti.render(cCtx);
      }
    }

    requestAnimationFrame(mainLoop);
  }
  requestAnimationFrame(mainLoop);

  // 5. 컨트롤러 버튼 바인딩
  const btnDrop1 = document.getElementById('btnDrop1');
  if (btnDrop1) {
    btnDrop1.addEventListener('click', () => {
      sound.playDrop();
      particleSim.spawnDropAnimation('NaOH', () => {
        reaction.addNaoh(1);
        updateAllViews();
        const st = reaction.getState();
        if (st.isEquivalencePoint) sound.playEquivalenceFanfare();
      });
    });
  }

  const btnDrop5 = document.getElementById('btnDrop5');
  if (btnDrop5) {
    btnDrop5.addEventListener('click', () => {
      sound.playDrop();
      particleSim.spawnDropAnimation('NaOH', () => {
        reaction.addNaoh(5);
        updateAllViews();
        const st = reaction.getState();
        if (st.isEquivalencePoint) sound.playEquivalenceFanfare();
      });
    });
  }

  const btnAuto = document.getElementById('btnAuto');
  if (btnAuto) {
    btnAuto.addEventListener('click', () => {
      if (autoTimer) {
        clearInterval(autoTimer);
        autoTimer = null;
        btnAuto.innerHTML = '▶ 자동 연속 반응';
        btnAuto.classList.remove('bg-amber-600', 'hover:bg-amber-500');
        btnAuto.classList.add('bg-indigo-600', 'hover:bg-indigo-500');
      } else {
        btnAuto.innerHTML = '⏸ 일시정지';
        btnAuto.classList.remove('bg-indigo-600', 'hover:bg-indigo-500');
        btnAuto.classList.add('bg-amber-600', 'hover:bg-amber-500');

        autoTimer = setInterval(() => {
          const st = reaction.getState();
          if (st.naohVolume >= 20) {
            clearInterval(autoTimer);
            autoTimer = null;
            btnAuto.innerHTML = '▶ 자동 연속 반응';
            btnAuto.classList.remove('bg-amber-600', 'hover:bg-amber-500');
            btnAuto.classList.add('bg-indigo-600', 'hover:bg-indigo-500');
            return;
          }
          sound.playDrop();
          particleSim.spawnDropAnimation('NaOH', () => {
            reaction.addNaoh(1);
            updateAllViews();
            const currSt = reaction.getState();
            if (currSt.isEquivalencePoint) sound.playEquivalenceFanfare();
          });
        }, 750);
      }
    });
  }

  const btnEquiv = document.getElementById('btnEquiv');
  if (btnEquiv) {
    btnEquiv.addEventListener('click', () => {
      reaction.setNaohVolume(10);
      updateAllViews();
      sound.playEquivalenceFanfare();
      if (confettiCanvas) confetti.trigger(confettiCanvas, 50);
    });
  }

  const btnReset = document.getElementById('btnReset');
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      if (autoTimer) {
        clearInterval(autoTimer);
        autoTimer = null;
        if (btnAuto) btnAuto.innerHTML = '▶ 자동 연속 반응';
      }
      reaction.reset();
      updateAllViews();
    });
  }

  // 지시약 선택 라디오
  document.querySelectorAll('input[name="indicator"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      currentIndicator = e.target.value;
      updateAllViews();
    });
  });

  // 파티클 필터 옵션
  const chkNetIons = document.getElementById('chkNetIons');
  if (chkNetIons) {
    chkNetIons.addEventListener('change', (e) => {
      particleSim.setHighlightNetIons(e.target.checked);
    });
  }

  const chkWater = document.getElementById('chkWater');
  if (chkWater) {
    chkWater.addEventListener('change', (e) => {
      particleSim.setShowWaterMolecules(e.target.checked);
    });
  }

  const selSpeed = document.getElementById('selSpeed');
  if (selSpeed) {
    selSpeed.addEventListener('change', (e) => {
      particleSim.setSpeed(parseFloat(e.target.value) || 1.0);
    });
  }

  const btnSound = document.getElementById('btnSound');
  if (btnSound) {
    btnSound.addEventListener('click', () => {
      const isMuted = sound.toggleMute();
      btnSound.innerHTML = isMuted ? '🔇 소리 꺼짐' : '🔊 소리 켜짐';
      btnSound.classList.toggle('text-slate-400', isMuted);
      btnSound.classList.toggle('text-emerald-400', !isMuted);
    });
  }

  // 6. 탭 전환
  const tabBtnLab = document.getElementById('tabBtnLab');
  const tabBtnConcept = document.getElementById('tabBtnConcept');
  const tabBtnQuiz = document.getElementById('tabBtnQuiz');

  const panelLab = document.getElementById('panelLab');
  const panelConcept = document.getElementById('panelConcept');
  const panelQuiz = document.getElementById('panelQuiz');

  function switchTab(tabId) {
    currentTab = tabId;
    const tabs = [
      { id: 'lab', btn: tabBtnLab, panel: panelLab },
      { id: 'concept', btn: tabBtnConcept, panel: panelConcept },
      { id: 'quiz', btn: tabBtnQuiz, panel: panelQuiz }
    ];

    tabs.forEach(t => {
      if (t.id === tabId) {
        t.btn?.classList.add('bg-blue-600', 'text-white', 'shadow-md');
        t.btn?.classList.remove('text-slate-400', 'hover:text-white', 'hover:bg-slate-800');
        t.panel?.classList.remove('hidden');
      } else {
        t.btn?.classList.remove('bg-blue-600', 'text-white', 'shadow-md');
        t.btn?.classList.add('text-slate-400', 'hover:text-white', 'hover:bg-slate-800');
        t.panel?.classList.add('hidden');
      }
    });

    if (tabId === 'lab') {
      updateAllViews();
    }
  }

  if (tabBtnLab) tabBtnLab.addEventListener('click', () => switchTab('lab'));
  if (tabBtnConcept) tabBtnConcept.addEventListener('click', () => switchTab('concept'));
  if (tabBtnQuiz) tabBtnQuiz.addEventListener('click', () => switchTab('quiz'));

  // 7. 핵심 개념 카드 렌더링
  const conceptContainer = document.getElementById('conceptCardsContainer');
  if (conceptContainer) {
    conceptContainer.innerHTML = CONCEPT_TOPICS.map(topic => `
      <div class="bg-slate-800/70 border border-slate-700/80 rounded-2xl p-6 shadow-lg hover:border-blue-500/50 transition-all">
        <div class="flex items-center gap-3 mb-3">
          <span class="text-3xl">${topic.icon}</span>
          <h3 class="text-xl font-bold text-white">${topic.title}</h3>
        </div>
        <p class="text-slate-300 text-sm mb-4 leading-relaxed font-medium bg-slate-900/60 p-3 rounded-xl border border-slate-800">${topic.summary}</p>
        <ul class="space-y-2 text-sm text-slate-300">
          ${topic.points.map(pt => `
            <li class="flex items-start gap-2">
              <span class="text-blue-400 mt-0.5">•</span>
              <span>${pt}</span>
            </li>
          `).join('')}
        </ul>
      </div>
    `).join('');
  }

  // 8. 형성평가 골든벨 퀴즈 렌더링 & 채점
  let quizCurrentIndex = 0;
  let quizScore = 0;
  let quizAnswered = false;

  const quizCard = document.getElementById('quizCard');

  function renderQuizQuestion() {
    if (!quizCard) return;

    if (quizCurrentIndex >= QUIZ_QUESTIONS.length) {
      // 퀴즈 완료 화면
      sound.playEquivalenceFanfare();
      if (confettiCanvas) confetti.trigger(confettiCanvas, 90);

      quizCard.innerHTML = `
        <div class="text-center py-8">
          <span class="text-6xl mb-4 block animate-bounce">🏆</span>
          <h3 class="text-2xl font-black text-white mb-2">형성평가 골든벨 완료!</h3>
          <p class="text-lg text-emerald-400 font-bold mb-4">최종 점수: ${quizScore} / ${QUIZ_QUESTIONS.length} (${Math.round((quizScore / QUIZ_QUESTIONS.length) * 100)}점)</p>
          <p class="text-slate-300 text-sm max-w-md mx-auto mb-6">
            ${quizScore === QUIZ_QUESTIONS.length
              ? '축하합니다! 중화 반응의 핵심 원리와 이온 모델을 완벽하게 마스터하셨습니다!'
              : '수고하셨습니다! 틀린 문제는 가상 실험실에서 직접 이온을 조작하며 다시 확인해 보세요.'}
          </p>
          <button id="btnRestartQuiz" class="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all">
            ↺ 퀴즈 다시 풀기
          </button>
        </div>
      `;
      const btnRestart = document.getElementById('btnRestartQuiz');
      if (btnRestart) {
        btnRestart.addEventListener('click', () => {
          quizCurrentIndex = 0;
          quizScore = 0;
          quizAnswered = false;
          renderQuizQuestion();
        });
      }
      return;
    }

    const q = QUIZ_QUESTIONS[quizCurrentIndex];
    quizAnswered = false;

    quizCard.innerHTML = `
      <div class="mb-4 flex items-center justify-between">
        <span class="px-3 py-1 bg-blue-500/20 text-blue-300 text-xs font-bold rounded-full border border-blue-500/30">
          문제 ${quizCurrentIndex + 1} / ${QUIZ_QUESTIONS.length}
        </span>
        <span class="text-xs text-slate-400">현재 점수: <b class="text-emerald-400">${quizScore}점</b></span>
      </div>
      <h3 class="text-lg font-bold text-white mb-6 leading-relaxed">${q.question}</h3>
      <div class="grid grid-cols-1 gap-3 mb-6" id="quizOptionsContainer">
        ${q.options.map((opt, idx) => `
          <button data-opt-idx="${idx}" class="quiz-opt-btn w-full text-left p-4 rounded-xl bg-slate-900/70 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-sm font-medium transition-all flex items-center gap-3">
            <span class="w-7 h-7 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center text-xs font-bold text-slate-300">${idx + 1}</span>
            <span>${opt}</span>
          </button>
        `).join('')}
      </div>
      <div id="quizFeedbackBox" class="hidden p-4 rounded-xl border mb-6 text-sm leading-relaxed"></div>
      <div class="flex justify-end">
        <button id="btnNextQuiz" class="hidden px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl shadow transition-all">
          다음 문제 ➔
        </button>
      </div>
    `;

    document.querySelectorAll('.quiz-opt-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        if (quizAnswered) return;
        quizAnswered = true;

        const selectedIdx = parseInt(btn.dataset.optIdx, 10);
        const isCorrect = (selectedIdx === q.correctIndex);
        const feedbackBox = document.getElementById('quizFeedbackBox');
        const btnNext = document.getElementById('btnNextQuiz');

        if (isCorrect) {
          quizScore++;
          sound.playCorrect();
          btn.classList.add('bg-emerald-600/30', 'border-emerald-400', 'text-emerald-200');
          if (feedbackBox) {
            feedbackBox.className = 'p-4 rounded-xl border border-emerald-500/50 bg-emerald-950/40 text-emerald-200 mb-6 text-sm leading-relaxed block';
            feedbackBox.innerHTML = `<b>🎉 정답입니다!</b><br>${q.explanation}`;
          }
        } else {
          sound.playIncorrect();
          btn.classList.add('bg-rose-600/30', 'border-rose-400', 'text-rose-200');
          const correctBtn = document.querySelector(`.quiz-opt-btn[data-opt-idx="${q.correctIndex}"]`);
          if (correctBtn) correctBtn.classList.add('bg-emerald-600/20', 'border-emerald-400', 'text-emerald-300');
          if (feedbackBox) {
            feedbackBox.className = 'p-4 rounded-xl border border-rose-500/50 bg-rose-950/40 text-rose-200 mb-6 text-sm leading-relaxed block';
            feedbackBox.innerHTML = `<b>❌ 오답입니다. (정답: ${q.correctIndex + 1}번)</b><br>${q.explanation}`;
          }
        }

        if (btnNext) {
          btnNext.classList.remove('hidden');
          btnNext.addEventListener('click', () => {
            quizCurrentIndex++;
            renderQuizQuestion();
          }, { once: true });
        }
      });
    });
  }

  renderQuizQuestion();

  // 초기 뷰 렌더링
  updateAllViews();
}
