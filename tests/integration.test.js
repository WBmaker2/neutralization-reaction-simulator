import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = path.resolve('.');
const INDEX_HTML_PATH = path.join(ROOT_DIR, 'index.html');
const APP_JS_PATH = path.join(ROOT_DIR, 'src', 'js', 'app.js');

describe('Task 6 Integration & Standalone Architecture', () => {
  test('index.html exists and is non-empty', () => {
    assert.ok(fs.existsSync(INDEX_HTML_PATH), 'index.html must exist in project root');
    const content = fs.readFileSync(INDEX_HTML_PATH, 'utf-8');
    assert.ok(content.length > 500, 'index.html must have substantial content');
  });

  test('index.html contains 3 navigation tabs and panels', () => {
    const html = fs.readFileSync(INDEX_HTML_PATH, 'utf-8');
    assert.ok(html.includes('tabBtnLab'), 'Should contain tabBtnLab');
    assert.ok(html.includes('tabBtnConcept'), 'Should contain tabBtnConcept');
    assert.ok(html.includes('tabBtnQuiz'), 'Should contain tabBtnQuiz');

    assert.ok(html.includes('panelLab'), 'Should contain panelLab');
    assert.ok(html.includes('panelConcept'), 'Should contain panelConcept');
    assert.ok(html.includes('panelQuiz'), 'Should contain panelQuiz');
  });

  test('index.html contains all 5 required canvas elements', () => {
    const html = fs.readFileSync(INDEX_HTML_PATH, 'utf-8');
    assert.ok(html.includes('id="beakerCanvas"'), 'Should contain beakerCanvas');
    assert.ok(html.includes('id="particleCanvas"'), 'Should contain particleCanvas');
    assert.ok(html.includes('id="ionChartCanvas"'), 'Should contain ionChartCanvas');
    assert.ok(html.includes('id="tempChartCanvas"'), 'Should contain tempChartCanvas');
    assert.ok(html.includes('id="confettiCanvas"'), 'Should contain confettiCanvas');
  });

  test('index.html contains all controller buttons and parameter toggles', () => {
    const html = fs.readFileSync(INDEX_HTML_PATH, 'utf-8');
    assert.ok(html.includes('id="btnDrop1"'), 'Should have btnDrop1 (+1mL)');
    assert.ok(html.includes('id="btnDrop5"'), 'Should have btnDrop5 (+5mL)');
    assert.ok(html.includes('id="btnAuto"'), 'Should have btnAuto');
    assert.ok(html.includes('id="btnEquiv"'), 'Should have btnEquiv (10mL 중화점 바로가기)');
    assert.ok(html.includes('id="btnReset"'), 'Should have btnReset');
    assert.ok(html.includes('id="btnSound"'), 'Should have btnSound');
    assert.ok(html.includes('id="chkNetIons"'), 'Should have chkNetIons');
    assert.ok(html.includes('id="chkWater"'), 'Should have chkWater');
    assert.ok(html.includes('id="selSpeed"'), 'Should have selSpeed');
  });

  test('index.html is zero-setup and file:/// safe (no external local file module imports that break on file:///)', () => {
    const html = fs.readFileSync(INDEX_HTML_PATH, 'utf-8');
    // Ensure it doesn't try to load external local module files like <script type="module" src="./src/js/app.js"> which Chrome blocks on file:///
    const hasExternalLocalScript = /<script\s+type=["']module["']\s+src=["']\.\/src/i.test(html);
    assert.equal(hasExternalLocalScript, false, 'index.html must not depend on relative module script src which fails on file:/// CORS');
    
    // Ensure all core classes are self-contained in index.html
    assert.ok(html.includes('class NeutralizationReaction'), 'index.html must contain NeutralizationReaction');
    assert.ok(html.includes('class SoundEngine'), 'index.html must contain SoundEngine');
    assert.ok(html.includes('class ParticleSimulation'), 'index.html must contain ParticleSimulation');
    assert.ok(html.includes('class BeakerRenderer'), 'index.html must contain BeakerRenderer');
    assert.ok(html.includes('class QuantitativeChartRenderer'), 'index.html must contain QuantitativeChartRenderer');
    assert.ok(html.includes('class ConfettiEffect'), 'index.html must contain ConfettiEffect');
    assert.ok(html.includes('QUIZ_QUESTIONS'), 'index.html must contain QUIZ_QUESTIONS');
    assert.ok(html.includes('CONCEPT_TOPICS'), 'index.html must contain CONCEPT_TOPICS');
  });

  test('src/js/app.js exists as modular architecture source', () => {
    assert.ok(fs.existsSync(APP_JS_PATH), 'src/js/app.js must exist');
    const content = fs.readFileSync(APP_JS_PATH, 'utf-8');
    assert.ok(content.includes('NeutralizationReaction'), 'app.js must reference NeutralizationReaction');
  });
});
