import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { CONCEPT_TOPICS } from '../src/js/concept-data.js';
import { QUIZ_QUESTIONS, ConfettiEffect } from '../src/js/quiz-data.js';

describe('CONCEPT_TOPICS Curriculum Content', () => {
  test('contains 4 core topics matching 2022 revised science curriculum', () => {
    assert.ok(Array.isArray(CONCEPT_TOPICS));
    assert.equal(CONCEPT_TOPICS.length, 4);

    const ids = CONCEPT_TOPICS.map(t => t.id);
    assert.ok(ids.includes('ionization'), 'Should include ionization topic');
    assert.ok(ids.includes('neutralization-reaction'), 'Should include neutralization reaction topic');
    assert.ok(ids.includes('temperature-heat'), 'Should include heat & temperature topic');
    assert.ok(ids.includes('real-life-examples'), 'Should include real-life examples topic');
  });

  test('each topic has id, title, icon, summary, and bullet points', () => {
    CONCEPT_TOPICS.forEach(topic => {
      assert.ok(topic.id, 'Topic must have id');
      assert.ok(topic.title, 'Topic must have title');
      assert.ok(topic.icon, 'Topic must have icon');
      assert.ok(topic.summary, 'Topic must have summary');
      assert.ok(Array.isArray(topic.points) && topic.points.length > 0, 'Topic must have non-empty points array');
    });
  });

  test('verifies accurate chemical formulas in content', () => {
    const rxnTopic = CONCEPT_TOPICS.find(t => t.id === 'neutralization-reaction');
    assert.ok(rxnTopic.points.some(p => p.includes('H⁺') && p.includes('OH⁻') && p.includes('H₂O')));
    assert.ok(rxnTopic.points.some(p => p.includes('알짜 이온') && p.includes('구경꾼 이온')));

    const realLifeTopic = CONCEPT_TOPICS.find(t => t.id === 'real-life-examples');
    assert.ok(realLifeTopic.points.some(p => p.includes('제산제')));
    assert.ok(realLifeTopic.points.some(p => p.includes('비린내') || p.includes('레몬')));
  });
});

describe('QUIZ_QUESTIONS Formative Assessment', () => {
  test('contains 3 high-yield questions for middle/high school students', () => {
    assert.ok(Array.isArray(QUIZ_QUESTIONS));
    assert.equal(QUIZ_QUESTIONS.length, 3);
  });

  test('each quiz item has question, 4 choices, valid correctIndex (0-3), and explanation', () => {
    QUIZ_QUESTIONS.forEach((q, idx) => {
      assert.ok(q.question && typeof q.question === 'string', `Question ${idx + 1} must have question text`);
      assert.ok(Array.isArray(q.options) && q.options.length === 4, `Question ${idx + 1} must have 4 options`);
      assert.ok(Number.isInteger(q.correctIndex) && q.correctIndex >= 0 && q.correctIndex <= 3, `Question ${idx + 1} must have correctIndex 0-3`);
      assert.ok(q.explanation && typeof q.explanation === 'string' && q.explanation.length > 10, `Question ${idx + 1} must have detailed explanation`);
    });
  });

  test('verifies accuracy of correct answers', () => {
    // Q1: Equivalence point ions -> Na+ and Cl-
    const q1 = QUIZ_QUESTIONS[0];
    const q1Answer = q1.options[q1.correctIndex];
    assert.ok(q1Answer.includes('Na') && q1Answer.includes('Cl'), 'Q1 correct answer must be Na+ and Cl-');

    // Q2: Highest temperature -> maximum water molecules produced
    const q2 = QUIZ_QUESTIONS[1];
    const q2Answer = q2.options[q2.correctIndex];
    assert.ok(q2Answer.includes('물') && (q2Answer.includes('가장 많을 때') || q2Answer.includes('완전히 반응')), 'Q2 answer must relate to maximum water formation');

    // Q3: BTB indicator order -> yellow -> green -> blue
    const q3 = QUIZ_QUESTIONS[2];
    const q3Answer = q3.options[q3.correctIndex];
    assert.ok(q3Answer.includes('노란') && q3Answer.includes('초록') && q3Answer.includes('파란'), 'Q3 answer must be yellow -> green -> blue');
  });
});

describe('ConfettiEffect', () => {
  test('initializes and triggers canvas confetti particles', () => {
    const confetti = new ConfettiEffect();
    assert.equal(confetti.particles.length, 0);

    const mockCanvas = { width: 500, height: 400 };
    confetti.trigger(mockCanvas, 60);
    assert.equal(confetti.particles.length, 60);

    // Update particles
    confetti.update();
    assert.ok(confetti.particles.length > 0);

    // Render safely with mock context
    const calls = [];
    const mockCtx = {
      save: () => calls.push('save'),
      restore: () => calls.push('restore'),
      translate: () => {},
      rotate: () => {},
      fillRect: () => calls.push('fillRect'),
      fillStyle: ''
    };
    confetti.render(mockCtx);
    assert.ok(calls.length > 0);

    confetti.clear();
    assert.equal(confetti.particles.length, 0);
  });
});
