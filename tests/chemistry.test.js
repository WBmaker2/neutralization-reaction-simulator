import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NeutralizationReaction } from '../src/js/chemistry.js';

test('초기 상태: HCl 10mL일 때 H+ 10개, Cl- 10개, Na+ 0개, OH- 0개, 온도 20도, 산성', () => {
  const rxn = new NeutralizationReaction(10);
  const state = rxn.getState();
  assert.equal(state.hCount, 10);
  assert.equal(state.clCount, 10);
  assert.equal(state.naCount, 0);
  assert.equal(state.ohCount, 0);
  assert.equal(state.h2oCount, 0);
  assert.equal(state.totalIons, 20);
  assert.equal(state.totalVolume, 10);
  assert.equal(state.temperature, 20.0);
  assert.equal(state.solutionState, '산성');
  assert.equal(state.btbColor, '#F59E0B'); // 노랑
  assert.equal(state.ppColor, 'rgba(224, 242, 254, 0.4)'); // 무색투명
  assert.equal(state.isEquivalencePoint, false);
});

test('중화점 도달: NaOH 10mL 투입 시 H+ 0개, OH- 0개, H2O 10개, 최고 온도, 중성', () => {
  const rxn = new NeutralizationReaction(10);
  rxn.addNaoh(10);
  const state = rxn.getState();
  assert.equal(state.hCount, 0);
  assert.equal(state.clCount, 10);
  assert.equal(state.naCount, 10);
  assert.equal(state.ohCount, 0);
  assert.equal(state.h2oCount, 10);
  assert.equal(state.totalIons, 20);
  assert.equal(state.totalVolume, 20);
  assert.equal(state.isEquivalencePoint, true);
  assert.equal(state.solutionState, '중성');
  assert.equal(state.temperature, 28.5); // 최고 온도
  assert.equal(state.btbColor, '#10B981'); // 초록
  assert.equal(state.ppColor, 'rgba(224, 242, 254, 0.4)');
});

test('중화점 초과: NaOH 20mL 투입 시 OH- 10개 잔류, 염기성, 온도 하강', () => {
  const rxn = new NeutralizationReaction(10);
  rxn.addNaoh(20);
  const state = rxn.getState();
  assert.equal(state.hCount, 0);
  assert.equal(state.ohCount, 10);
  assert.equal(state.naCount, 20);
  assert.equal(state.clCount, 10);
  assert.equal(state.h2oCount, 10);
  assert.equal(state.totalIons, 40);
  assert.equal(state.totalVolume, 30);
  assert.equal(state.solutionState, '염기성');
  assert.equal(state.btbColor, '#2563EB'); // 파랑
  assert.equal(state.ppColor, '#E11D48'); // 붉은색
  assert.ok(state.temperature < 28.5 && state.temperature > 20.0);
  assert.equal(state.isEquivalencePoint, false);
});

test('getCurveData(20, 0.5) 호출 시 0mL부터 20mL까지 41개 데이터 포인트 반환', () => {
  const rxn = new NeutralizationReaction(10);
  const data = rxn.getCurveData(20, 0.5);
  assert.equal(data.length, 41);
  assert.equal(data[0].volume, 0);
  assert.equal(data[0].hCount, 10);
  assert.equal(data[20].volume, 10);
  assert.equal(data[20].isEquivalencePoint, true);
  assert.equal(data[40].volume, 20);
  assert.equal(data[40].ohCount, 10);
  // 원래 상태 복원 확인
  assert.equal(rxn.getState().naohVolume, 0);
});

test('setNaohVolume 및 reset 동작 확인', () => {
  const rxn = new NeutralizationReaction(10);
  rxn.setNaohVolume(5);
  assert.equal(rxn.getState().naohVolume, 5);
  assert.equal(rxn.getState().hCount, 5);
  assert.equal(rxn.getState().solutionState, '산성');

  rxn.reset();
  assert.equal(rxn.getState().naohVolume, 0);
  assert.equal(rxn.getState().hCount, 10);
});
