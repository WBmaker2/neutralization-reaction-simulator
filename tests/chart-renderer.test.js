import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { BeakerRenderer, QuantitativeChartRenderer } from '../src/js/chart-renderer.js';
import { NeutralizationReaction } from '../src/js/chemistry.js';

// Helper to create a comprehensive mock canvas
function createMockCanvas(width = 400, height = 300) {
  const drawCalls = [];
  const textCalls = [];
  const strokeStyles = [];
  const fillStyles = [];

  const ctx = {
    canvas: null,
    width,
    height,
    _fillStyle: '#000000',
    _strokeStyle: '#000000',
    lineWidth: 1,
    font: '10px sans-serif',
    textAlign: 'left',
    textBaseline: 'alphabetic',
    shadowColor: 'transparent',
    shadowBlur: 0,
    lineDashOffset: 0,
    globalAlpha: 1,
    get fillStyle() { return this._fillStyle; },
    set fillStyle(val) { this._fillStyle = val; fillStyles.push(val); },
    get strokeStyle() { return this._strokeStyle; },
    set strokeStyle(val) { this._strokeStyle = val; strokeStyles.push(val); },
    save: () => { drawCalls.push({ method: 'save' }); },
    restore: () => { drawCalls.push({ method: 'restore' }); },
    beginPath: () => { drawCalls.push({ method: 'beginPath' }); },
    closePath: () => { drawCalls.push({ method: 'closePath' }); },
    moveTo: (x, y) => { drawCalls.push({ method: 'moveTo', x, y }); },
    lineTo: (x, y) => { drawCalls.push({ method: 'lineTo', x, y }); },
    arc: (x, y, r, s, e) => { drawCalls.push({ method: 'arc', x, y, r, s, e }); },
    ellipse: (x, y, rx, ry, rot, s, e) => { drawCalls.push({ method: 'ellipse', x, y, rx, ry }); },
    quadraticCurveTo: (cpx, cpy, x, y) => { drawCalls.push({ method: 'quadraticCurveTo', cpx, cpy, x, y }); },
    bezierCurveTo: (cp1x, cp1y, cp2x, cp2y, x, y) => { drawCalls.push({ method: 'bezierCurveTo' }); },
    rect: (x, y, w, h) => { drawCalls.push({ method: 'rect', x, y, w, h }); },
    roundRect: (x, y, w, h, r) => { drawCalls.push({ method: 'roundRect', x, y, w, h, r }); },
    stroke: () => { drawCalls.push({ method: 'stroke', strokeStyle: ctx._strokeStyle }); },
    fill: () => { drawCalls.push({ method: 'fill', fillStyle: ctx._fillStyle }); },
    clearRect: (x, y, w, h) => { drawCalls.push({ method: 'clearRect', x, y, w, h }); },
    fillRect: (x, y, w, h) => { drawCalls.push({ method: 'fillRect', x, y, w, h, fillStyle: ctx._fillStyle }); },
    strokeRect: (x, y, w, h) => { drawCalls.push({ method: 'strokeRect', x, y, w, h }); },
    fillText: (text, x, y, maxW) => {
      textCalls.push({ text: String(text), x, y });
      drawCalls.push({ method: 'fillText', text: String(text), x, y });
    },
    strokeText: (text, x, y) => {
      textCalls.push({ text: String(text), x, y });
      drawCalls.push({ method: 'strokeText', text: String(text), x, y });
    },
    measureText: (text) => ({ width: String(text).length * 8 }),
    setLineDash: (arr) => { drawCalls.push({ method: 'setLineDash', arr }); },
    getLineDash: () => [],
    createLinearGradient: (x0, y0, x1, y1) => ({
      addColorStop: (offset, color) => {}
    }),
    createRadialGradient: (x0, y0, r0, x1, y1, r1) => ({
      addColorStop: (offset, color) => {}
    }),
    translate: (x, y) => { drawCalls.push({ method: 'translate', x, y }); },
    scale: (x, y) => { drawCalls.push({ method: 'scale', x, y }); },
    rotate: (angle) => { drawCalls.push({ method: 'rotate', angle }); }
  };

  const canvas = {
    width,
    height,
    clientWidth: width,
    clientHeight: height,
    getContext: (type) => (type === '2d' ? ctx : null),
    _drawCalls: drawCalls,
    _textCalls: textCalls,
    _strokeStyles: strokeStyles,
    _fillStyles: fillStyles,
    _ctx: ctx
  };
  ctx.canvas = canvas;
  return canvas;
}

describe('BeakerRenderer', () => {
  test('instantiates BeakerRenderer without error', () => {
    const renderer = new BeakerRenderer();
    assert.ok(renderer instanceof BeakerRenderer);
  });

  test('handles null, undefined or invalid canvas gracefully (safe no-op)', () => {
    const renderer = new BeakerRenderer();
    const rxn = new NeutralizationReaction(10, 1);
    const state = rxn.getState();

    assert.doesNotThrow(() => renderer.render(null, state, 'btb'));
    assert.doesNotThrow(() => renderer.render(undefined, state, 'pp'));
    assert.doesNotThrow(() => renderer.render({}, state, 'btb'));
    assert.doesNotThrow(() => renderer.render({ getContext: () => null }, state, 'btb'));
    assert.doesNotThrow(() => renderer.render({ width: 0, height: 0, getContext: () => null }, state, 'btb'));
  });

  test('renders beaker with graduation marks (10mL, 20mL, 30mL, 40mL)', () => {
    const renderer = new BeakerRenderer();
    const canvas = createMockCanvas(400, 450);
    const rxn = new NeutralizationReaction(10, 1);
    const state = rxn.getState();

    renderer.render(canvas, state, 'btb');

    const renderedTexts = canvas._textCalls.map(t => t.text);
    assert.ok(renderedTexts.some(t => t.includes('10mL') || t.includes('10 mL')), 'Should render 10mL mark');
    assert.ok(renderedTexts.some(t => t.includes('20mL') || t.includes('20 mL')), 'Should render 20mL mark');
    assert.ok(renderedTexts.some(t => t.includes('30mL') || t.includes('30 mL')), 'Should render 30mL mark');
    assert.ok(renderedTexts.some(t => t.includes('40mL') || t.includes('40 mL')), 'Should render 40mL mark');
  });

  test('renders thermometer with temperature formatted as X.X°C and red mercury bulb', () => {
    const renderer = new BeakerRenderer();
    const canvas = createMockCanvas(400, 450);
    const rxn = new NeutralizationReaction(10, 1);
    
    // Initial state: 20.0°C
    const state = rxn.getState();
    renderer.render(canvas, state, 'btb');

    const renderedTexts = canvas._textCalls.map(t => t.text);
    assert.ok(renderedTexts.some(t => t.includes('20.0°C') || t.includes('20.0')), 'Should render 20.0°C temperature');

    // Equivalence state: 28.5°C
    rxn.setNaohVolume(10);
    const eqState = rxn.getState();
    const eqCanvas = createMockCanvas(400, 450);
    renderer.render(eqCanvas, eqState, 'btb');
    const eqTexts = eqCanvas._textCalls.map(t => t.text);
    assert.ok(eqTexts.some(t => t.includes('28.5°C') || t.includes('28.5')), 'Should render 28.5°C temperature');
  });

  test('liquid level rises as volume increases (10mL -> 30mL)', () => {
    const renderer = new BeakerRenderer();
    const y10 = renderer.getLiquidSurfaceY(10, 400);
    const y20 = renderer.getLiquidSurfaceY(20, 400);
    const y30 = renderer.getLiquidSurfaceY(30, 400);

    // In canvas coordinates, higher liquid level means lower Y value
    assert.ok(y10 > y20, `10mL Y (${y10}) should be greater than 20mL Y (${y20})`);
    assert.ok(y20 > y30, `20mL Y (${y20}) should be greater than 30mL Y (${y30})`);
  });

  test('dynamically resolves indicator colors for BTB and Phenolphthalein', () => {
    const renderer = new BeakerRenderer();
    const rxn = new NeutralizationReaction(10, 1);

    // 1. Acidic (0mL NaOH)
    const acidState = rxn.getState();
    const btbAcidColor = renderer.resolveIndicatorColor(acidState, 'btb');
    const ppAcidColor = renderer.resolveIndicatorColor(acidState, 'pp');
    assert.ok(btbAcidColor.includes('#F59E0B') || btbAcidColor.includes('245, 158, 11') || btbAcidColor.includes('yellow') || btbAcidColor.includes('#f59e0b'), 'BTB acidic should be yellow');
    assert.ok(ppAcidColor.includes('rgba') || ppAcidColor.includes('#E0F2FE') || ppAcidColor.includes('transparent'), 'PP acidic should be clear/transparent tint');

    // 2. Neutral (10mL NaOH)
    rxn.setNaohVolume(10);
    const neutState = rxn.getState();
    const btbNeutColor = renderer.resolveIndicatorColor(neutState, 'btb');
    const ppNeutColor = renderer.resolveIndicatorColor(neutState, 'pp');
    assert.ok(btbNeutColor.includes('#10B981') || btbNeutColor.includes('16, 185, 129') || btbNeutColor.includes('green'), 'BTB neutral should be green');
    assert.ok(ppNeutColor.includes('rgba') || ppNeutColor.includes('#E0F2FE') || ppNeutColor.includes('transparent'), 'PP neutral should be clear/transparent tint');

    // 3. Basic (20mL NaOH)
    rxn.setNaohVolume(20);
    const baseState = rxn.getState();
    const btbBaseColor = renderer.resolveIndicatorColor(baseState, 'btb');
    const ppBaseColor = renderer.resolveIndicatorColor(baseState, 'pp');
    assert.ok(btbBaseColor.includes('#2563EB') || btbBaseColor.includes('37, 99, 235') || btbBaseColor.includes('blue'), 'BTB basic should be blue');
    assert.ok(ppBaseColor.includes('#E11D48') || ppBaseColor.includes('225, 29, 72') || ppBaseColor.includes('pink') || ppBaseColor.includes('red'), 'PP basic should be pink/red');
  });

  test('renders dropper/burette above the beaker', () => {
    const renderer = new BeakerRenderer();
    const canvas = createMockCanvas(400, 450);
    const rxn = new NeutralizationReaction(10, 1);
    renderer.render(canvas, rxn.getState(), 'btb');

    // Should draw burette / dropper geometry
    const hasPathCalls = canvas._drawCalls.filter(c => c.method === 'beginPath' || c.method === 'moveTo').length > 5;
    assert.ok(hasPathCalls, 'Should generate rich geometry for beaker and burette');
  });
});

describe('QuantitativeChartRenderer', () => {
  test('instantiates QuantitativeChartRenderer without error', () => {
    const renderer = new QuantitativeChartRenderer();
    assert.ok(renderer instanceof QuantitativeChartRenderer);
  });

  test('handles null canvas or empty curve points gracefully (safe no-op)', () => {
    const renderer = new QuantitativeChartRenderer();
    assert.doesNotThrow(() => renderer.renderIonChart(null, [], 0));
    assert.doesNotThrow(() => renderer.renderIonChart(undefined, null, 10));
    assert.doesNotThrow(() => renderer.renderIonChart({ getContext: () => null }, [], 5));
    assert.doesNotThrow(() => renderer.renderTempChart(null, [], 0));
    assert.doesNotThrow(() => renderer.renderTempChart(undefined, null, 10));
    assert.doesNotThrow(() => renderer.renderTempChart({ getContext: () => null }, [], 5));
  });

  test('coordinate mapping utilities map volume and values correctly to plot area', () => {
    const renderer = new QuantitativeChartRenderer();
    const bounds = { x: 50, y: 30, width: 300, height: 200 };

    // Volume X mapping: 0 -> x, 10 -> x + width/2, 20 -> x + width
    const x0 = renderer.mapVolumeToX(0, bounds, 0, 20);
    const x10 = renderer.mapVolumeToX(10, bounds, 0, 20);
    const x20 = renderer.mapVolumeToX(20, bounds, 0, 20);
    assert.equal(x0, 50);
    assert.equal(x10, 200);
    assert.equal(x20, 350);

    // Ion Count Y mapping: 0 -> bottom (y + height), 25 -> top (y)
    const y0 = renderer.mapValueToY(0, bounds, 0, 25);
    const y25 = renderer.mapValueToY(25, bounds, 0, 25);
    const y10Count = renderer.mapValueToY(10, bounds, 0, 25);
    assert.equal(y0, 230);
    assert.equal(y25, 30);
    assert.equal(y10Count, 150);

    // Temperature Y mapping: 18°C -> bottom, 30°C -> top
    const y18Temp = renderer.mapValueToY(18, bounds, 18, 30);
    const y30Temp = renderer.mapValueToY(30, bounds, 18, 30);
    assert.equal(y18Temp, 230);
    assert.equal(y30Temp, 30);
  });

  test('renderIonChart renders grid, axes, titles, 4 ion curves, cursor and equivalence annotation', () => {
    const renderer = new QuantitativeChartRenderer();
    const rxn = new NeutralizationReaction(10, 1);
    const curvePoints = rxn.getCurveData(20, 0.5);
    const canvas = createMockCanvas(420, 280);

    renderer.renderIonChart(canvas, curvePoints, 7.5);

    const texts = canvas._textCalls.map(t => t.text);
    // Axis titles
    assert.ok(texts.some(t => t.includes('NaOH') && t.includes('부피')), 'Should include X-axis title for NaOH volume');
    assert.ok(texts.some(t => t.includes('이온의 수')), 'Should include Y-axis title for Ion Count');

    // Ion legends
    assert.ok(texts.some(t => t.includes('Cl')), 'Should include Cl- in legend');
    assert.ok(texts.some(t => t.includes('Na')), 'Should include Na+ in legend');
    assert.ok(texts.some(t => t.includes('H⁺') || t.includes('H+')), 'Should include H+ in legend');
    assert.ok(texts.some(t => t.includes('OH')), 'Should include OH- in legend');

    // Equivalence annotation
    assert.ok(texts.some(t => t.includes('중화점') && t.includes('10mL')), 'Should mark equivalence point at 10mL');
  });

  test('renderTempChart renders temperature curve, peak badge at 28.5°C and cursor', () => {
    const renderer = new QuantitativeChartRenderer();
    const rxn = new NeutralizationReaction(10, 1);
    const curvePoints = rxn.getCurveData(20, 0.5);
    const canvas = createMockCanvas(420, 240);

    renderer.renderTempChart(canvas, curvePoints, 10.0);

    const texts = canvas._textCalls.map(t => t.text);
    // Axis titles
    assert.ok(texts.some(t => t.includes('NaOH') && t.includes('부피')), 'Should include X-axis title');
    assert.ok(texts.some(t => t.includes('온도')), 'Should include Y-axis title for Temperature');

    // Peak badge
    assert.ok(texts.some(t => t.includes('28.5') && t.includes('최고 온도')), 'Should display peak temperature badge at 28.5°C');
    assert.ok(texts.some(t => t.includes('중화점')), 'Should mention 중화점 on peak badge');
  });

  test('handles boundary and arbitrary currentVolume cursor values accurately', () => {
    const renderer = new QuantitativeChartRenderer();
    const rxn = new NeutralizationReaction(10, 1);
    const curvePoints = rxn.getCurveData(20, 0.5);

    for (const vol of [0, 5.3, 10, 18.7, 20]) {
      const canvas = createMockCanvas(420, 260);
      assert.doesNotThrow(() => renderer.renderIonChart(canvas, curvePoints, vol));
      assert.doesNotThrow(() => renderer.renderTempChart(canvas, curvePoints, vol));
    }
  });
});
