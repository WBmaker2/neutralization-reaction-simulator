import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { SoundEngine } from '../src/js/audio-effects.js';

// Helper to create a fully tracked mock Web Audio API context
function createMockAudioContext(initialState = 'running') {
  const oscillators = [];
  const gains = [];
  let resumeCalled = false;

  const mockCtx = {
    state: initialState,
    currentTime: 0.1,
    destination: { id: 'destination' },
    resume: async () => {
      resumeCalled = true;
      mockCtx.state = 'running';
    },
    createOscillator: () => {
      const paramCalls = {
        setValueAtTime: [],
        exponentialRampToValueAtTime: [],
        linearRampToValueAtTime: []
      };

      const osc = {
        type: 'sine',
        frequency: {
          value: 440,
          setValueAtTime: (val, time) => {
            paramCalls.setValueAtTime.push({ val, time });
          },
          exponentialRampToValueAtTime: (val, time) => {
            paramCalls.exponentialRampToValueAtTime.push({ val, time });
          },
          linearRampToValueAtTime: (val, time) => {
            paramCalls.linearRampToValueAtTime.push({ val, time });
          }
        },
        paramCalls,
        connectedTo: null,
        connect: (target) => {
          osc.connectedTo = target;
        },
        disconnect: () => {
          osc.disconnected = true;
        },
        start: (time) => {
          osc.startTime = time;
        },
        stop: (time) => {
          osc.stopTime = time;
        },
        disconnected: false,
        onended: null
      };
      oscillators.push(osc);
      return osc;
    },
    createGain: () => {
      const paramCalls = {
        setValueAtTime: [],
        exponentialRampToValueAtTime: [],
        linearRampToValueAtTime: []
      };

      const gainNode = {
        gain: {
          value: 1,
          setValueAtTime: (val, time) => {
            paramCalls.setValueAtTime.push({ val, time });
          },
          exponentialRampToValueAtTime: (val, time) => {
            paramCalls.exponentialRampToValueAtTime.push({ val, time });
          },
          linearRampToValueAtTime: (val, time) => {
            paramCalls.linearRampToValueAtTime.push({ val, time });
          }
        },
        paramCalls,
        connectedTo: null,
        connect: (target) => {
          gainNode.connectedTo = target;
        },
        disconnect: () => {
          gainNode.disconnected = true;
        },
        disconnected: false
      };
      gains.push(gainNode);
      return gainNode;
    },
    _getOscillators: () => oscillators,
    _getGains: () => gains,
    _isResumeCalled: () => resumeCalled
  };

  return mockCtx;
}

describe('SoundEngine in headless / Node environment (no AudioContext)', () => {
  test('creates SoundEngine instance safely without error', () => {
    const engine = new SoundEngine();
    assert.equal(engine.isMuted(), false);
  });

  test('mute state management works correctly', () => {
    const engine = new SoundEngine();
    assert.equal(engine.isMuted(), false);

    engine.setMuted(true);
    assert.equal(engine.isMuted(), true);

    const toggled1 = engine.toggleMute();
    assert.equal(toggled1, false);
    assert.equal(engine.isMuted(), false);

    const toggled2 = engine.toggleMute();
    assert.equal(toggled2, true);
    assert.equal(engine.isMuted(), true);
  });

  test('all play methods execute safely without AudioContext (graceful no-op)', () => {
    const engine = new SoundEngine();
    assert.doesNotThrow(() => engine.playDrop());
    assert.doesNotThrow(() => engine.playReact());
    assert.doesNotThrow(() => engine.playEquivalenceFanfare());
    assert.doesNotThrow(() => engine.playCorrect());
    assert.doesNotThrow(() => engine.playIncorrect());
  });
});

describe('SoundEngine with Web Audio Context (mocked)', () => {
  let mockCtx;
  let engine;

  beforeEach(() => {
    mockCtx = createMockAudioContext();
    engine = new SoundEngine(mockCtx);
  });

  test('playDrop generates a sine frequency ramp from 800Hz to 300Hz', () => {
    engine.playDrop();
    const oscs = mockCtx._getOscillators();
    assert.equal(oscs.length, 1);
    const osc = oscs[0];
    assert.equal(osc.type, 'sine');

    // Check frequency ramp: starts around 800, ramps to 300
    assert.equal(osc.paramCalls.setValueAtTime[0].val, 800);
    const rampTarget = osc.paramCalls.exponentialRampToValueAtTime[0]?.val ?? osc.paramCalls.linearRampToValueAtTime[0]?.val;
    assert.equal(rampTarget, 300);

    // Check gain connection & start/stop
    const gains = mockCtx._getGains();
    assert.equal(gains.length, 1);
    assert.equal(osc.connectedTo, gains[0]);
    assert.equal(gains[0].connectedTo, mockCtx.destination);
    assert.ok(osc.startTime !== undefined);
    assert.ok(osc.stopTime !== undefined);

    // Check cleanup callback
    assert.equal(typeof osc.onended, 'function');
    osc.onended();
    assert.equal(osc.disconnected, true);
    assert.equal(gains[0].disconnected, true);
  });

  test('playReact generates reaction energy sizzle/spark with fast exponential decay', () => {
    engine.playReact();
    const oscs = mockCtx._getOscillators();
    assert.ok(oscs.length >= 1);
    const osc = oscs[0];
    assert.ok(['triangle', 'sawtooth'].includes(osc.type));

    const gains = mockCtx._getGains();
    assert.ok(gains.length >= 1);
    // Gain should exponentially ramp down towards near 0 (e.g. 0.001)
    const expRamps = gains[0].paramCalls.exponentialRampToValueAtTime;
    assert.ok(expRamps.length >= 1);
    assert.ok(expRamps[0].val <= 0.01);
  });

  test('playEquivalenceFanfare plays arpeggio of 4 celebratory tones', () => {
    engine.playEquivalenceFanfare();
    const oscs = mockCtx._getOscillators();
    assert.equal(oscs.length, 4);

    // C5, E5, G5, C6 frequencies
    const expectedFreqs = [523.25, 659.25, 783.99, 1046.5];
    oscs.forEach((osc, idx) => {
      const initialFreq = osc.paramCalls.setValueAtTime[0]?.val;
      assert.ok(Math.abs(initialFreq - expectedFreqs[idx]) < 1);
    });
  });

  test('playCorrect plays Ding-Dong-Dang chord (G4, C5, E5)', () => {
    engine.playCorrect();
    const oscs = mockCtx._getOscillators();
    assert.equal(oscs.length, 3);

    // G4 (392Hz), C5 (523Hz), E5 (659Hz)
    const expectedFreqs = [392.0, 523.25, 659.25];
    oscs.forEach((osc, idx) => {
      const initialFreq = osc.paramCalls.setValueAtTime[0]?.val;
      assert.ok(Math.abs(initialFreq - expectedFreqs[idx]) < 1);
    });
  });

  test('playIncorrect plays low sawtooth buzz at ~130Hz', () => {
    engine.playIncorrect();
    const oscs = mockCtx._getOscillators();
    assert.ok(oscs.length >= 1);
    const osc = oscs[0];
    assert.equal(osc.type, 'sawtooth');
    const initialFreq = osc.paramCalls.setValueAtTime[0]?.val;
    assert.ok(Math.abs(initialFreq - 130) < 5);
  });

  test('when muted, no oscillators or audio nodes are created', () => {
    engine.setMuted(true);
    engine.playDrop();
    engine.playReact();
    engine.playEquivalenceFanfare();
    engine.playCorrect();
    engine.playIncorrect();

    assert.equal(mockCtx._getOscillators().length, 0);
    assert.equal(mockCtx._getGains().length, 0);
  });

  test('resumes suspended AudioContext on user interaction/play', () => {
    const suspendedCtx = createMockAudioContext('suspended');
    const suspendedEngine = new SoundEngine(suspendedCtx);

    assert.equal(suspendedCtx._isResumeCalled(), false);
    suspendedEngine.playDrop();
    assert.equal(suspendedCtx._isResumeCalled(), true);
  });
});
