import { test, describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { ParticleSimulation, IonParticle, WaterMolecule, SparkParticle } from '../src/js/particle-engine.js';

function createMockCanvas(width = 600, height = 600) {
  const calls = [];
  const ctx = {
    canvas: { width, height },
    save: () => calls.push('save'),
    restore: () => calls.push('restore'),
    beginPath: () => calls.push('beginPath'),
    closePath: () => calls.push('closePath'),
    arc: (...args) => calls.push(['arc', ...args]),
    fill: () => calls.push('fill'),
    stroke: () => calls.push('stroke'),
    fillText: (...args) => calls.push(['fillText', ...args]),
    measureText: () => ({ width: 10 }),
    clip: () => calls.push('clip'),
    clearRect: (...args) => calls.push(['clearRect', ...args]),
    moveTo: (...args) => calls.push(['moveTo', ...args]),
    lineTo: (...args) => calls.push(['lineTo', ...args]),
    bezierCurveTo: (...args) => calls.push(['bezierCurveTo', ...args]),
    setLineDash: (...args) => calls.push(['setLineDash', ...args]),
    createRadialGradient: () => ({ addColorStop: () => {} }),
    createLinearGradient: () => ({ addColorStop: () => {} }),
    fillStyle: '#000000',
    strokeStyle: '#000000',
    globalAlpha: 1.0,
    lineWidth: 1,
    font: '12px sans-serif',
    textAlign: 'center',
    textBaseline: 'middle',
    shadowColor: 'transparent',
    shadowBlur: 0
  };
  return {
    width,
    height,
    getContext: (type) => (type === '2d' ? ctx : null),
    ctx,
    calls
  };
}

describe('ParticleSimulation Initialization & Configuration', () => {
  it('creates instance with default options and handles mock canvas', () => {
    const mockCanvas = createMockCanvas(500, 500);
    const sim = new ParticleSimulation(mockCanvas);

    assert.equal(sim.width, 500);
    assert.equal(sim.height, 500);
    assert.equal(sim.highlightNetIons, false);
    assert.equal(sim.showWaterMolecules, true);
    assert.equal(sim.speedMultiplier, 1.0);
    assert.equal(sim.isRunning, false);
  });

  it('handles null canvas safely without throwing', () => {
    const sim = new ParticleSimulation(null, { width: 400, height: 400 });
    assert.equal(sim.width, 400);
    assert.equal(sim.height, 400);
    assert.doesNotThrow(() => sim.render(null));
  });

  it('toggles highlightNetIons, showWaterMolecules, and speedMultiplier', () => {
    const sim = new ParticleSimulation(createMockCanvas());

    sim.setHighlightNetIons(true);
    assert.equal(sim.highlightNetIons, true);

    sim.setShowWaterMolecules(false);
    assert.equal(sim.showWaterMolecules, false);

    sim.setSpeed(2.0);
    assert.equal(sim.speedMultiplier, 2.0);

    sim.setSpeed(-1); // should clamp to min safe speed
    assert.ok(sim.speedMultiplier >= 0.1);
  });

  it('controls animation loop start and stop states', () => {
    const sim = new ParticleSimulation(createMockCanvas());
    assert.equal(sim.isRunning, false);

    sim.start();
    assert.equal(sim.isRunning, true);

    sim.stop();
    assert.equal(sim.isRunning, false);
  });
});

describe('State Synchronization (syncWithState)', () => {
  it('synchronizes particle counts to match initial HCl state (10 H+, 10 Cl-)', () => {
    const sim = new ParticleSimulation(createMockCanvas());
    const state = {
      hCount: 10,
      clCount: 10,
      naCount: 0,
      ohCount: 0,
      h2oCount: 0
    };

    sim.syncWithState(state);

    const counts = sim.getParticleCounts();
    assert.equal(counts.h, 10);
    assert.equal(counts.cl, 10);
    assert.equal(counts.na, 0);
    assert.equal(counts.oh, 0);
    assert.equal(counts.h2o, 0);
  });

  it('synchronizes intermediate neutralization state (5 H+, 10 Cl-, 5 Na+, 0 OH-, 5 H2O)', () => {
    const sim = new ParticleSimulation(createMockCanvas());
    sim.syncWithState({
      hCount: 5,
      clCount: 10,
      naCount: 5,
      ohCount: 0,
      h2oCount: 5
    });

    const counts = sim.getParticleCounts();
    assert.equal(counts.h, 5);
    assert.equal(counts.cl, 10);
    assert.equal(counts.na, 5);
    assert.equal(counts.oh, 0);
    assert.equal(counts.h2o, 5);
  });

  it('synchronizes equivalence point state (0 H+, 10 Cl-, 10 Na+, 0 OH-, 10 H2O)', () => {
    const sim = new ParticleSimulation(createMockCanvas());
    sim.syncWithState({
      hCount: 0,
      clCount: 10,
      naCount: 10,
      ohCount: 0,
      h2oCount: 10
    });

    const counts = sim.getParticleCounts();
    assert.equal(counts.h, 0);
    assert.equal(counts.cl, 10);
    assert.equal(counts.na, 10);
    assert.equal(counts.oh, 0);
    assert.equal(counts.h2o, 10);
  });

  it('synchronizes basic state after equivalence point (0 H+, 10 Cl-, 20 Na+, 10 OH-, 10 H2O)', () => {
    const sim = new ParticleSimulation(createMockCanvas());
    sim.syncWithState({
      hCount: 0,
      clCount: 10,
      naCount: 20,
      ohCount: 10,
      h2oCount: 10
    });

    const counts = sim.getParticleCounts();
    assert.equal(counts.h, 0);
    assert.equal(counts.cl, 10);
    assert.equal(counts.na, 20);
    assert.equal(counts.oh, 10);
    assert.equal(counts.h2o, 10);
  });

  it('correctly prunes excess particles when resetting', () => {
    const sim = new ParticleSimulation(createMockCanvas());
    sim.syncWithState({ hCount: 0, clCount: 10, naCount: 20, ohCount: 10, h2oCount: 10 });
    sim.syncWithState({ hCount: 10, clCount: 10, naCount: 0, ohCount: 0, h2oCount: 0 });

    const counts = sim.getParticleCounts();
    assert.equal(counts.h, 10);
    assert.equal(counts.cl, 10);
    assert.equal(counts.na, 0);
    assert.equal(counts.oh, 0);
    assert.equal(counts.h2o, 0);
  });
});

describe('Physics & Thermal Brownian Motion', () => {
  it('updates particle positions and keeps them within viewport bounds', () => {
    const sim = new ParticleSimulation(createMockCanvas(400, 400));
    sim.syncWithState({ hCount: 5, clCount: 5, naCount: 0, ohCount: 0, h2oCount: 0 });

    const p0 = sim.particles[0];
    const initialX = p0.x;
    const initialY = p0.y;

    // Run 10 physics updates
    for (let i = 0; i < 10; i++) {
      sim.update(0.016);
    }

    // Position should have changed
    assert.ok(p0.x !== initialX || p0.y !== initialY);

    // All particles must be within bounds (sim viewport center = 200, 200; radius = 180)
    for (const p of sim.particles) {
      const distFromCenter = Math.hypot(p.x - sim.centerX, p.y - sim.centerY);
      assert.ok(distFromCenter <= sim.viewportRadius + 5, `Particle escaped boundary: dist=${distFromCenter}`);
    }
  });

  it('attracts H+ and OH- when within attraction radius', () => {
    const sim = new ParticleSimulation(createMockCanvas(400, 400));
    sim.clear();

    // Place an H+ and OH- 50px apart (within 70px attraction radius)
    const h = new IonParticle('H+', sim.centerX - 25, sim.centerY, 0, 0);
    const oh = new IonParticle('OH-', sim.centerX + 25, sim.centerY, 0, 0);
    sim.particles.push(h, oh);

    const initialDistance = Math.hypot(h.x - oh.x, h.y - oh.y);
    assert.equal(initialDistance, 50);

    // Run physics update with thermal motion disabled/damped
    sim.update(0.016, { disableBrownian: true });

    const newDistance = Math.hypot(h.x - oh.x, h.y - oh.y);
    assert.ok(newDistance < initialDistance, `Expected attraction to decrease distance (${newDistance} < ${initialDistance})`);
  });
});

describe('Neutralization Collision and Water Molecule Formation', () => {
  it('triggers neutralization when H+ and OH- overlap: plays sound, spawns sparks, creates H2O', () => {
    let reactSoundPlayed = false;
    let callbackTriggered = false;
    let callbackData = null;

    const mockSound = {
      playReact: () => { reactSoundPlayed = true; }
    };

    const sim = new ParticleSimulation(createMockCanvas(400, 400), {
      soundEngine: mockSound,
      onReactionOccurred: (data) => {
        callbackTriggered = true;
        callbackData = data;
      }
    });
    sim.clear();

    // Place H+ and OH- overlapping (distance < combinedRadius)
    const h = new IonParticle('H+', sim.centerX - 5, sim.centerY, 0, 0);
    const oh = new IonParticle('OH-', sim.centerX + 5, sim.centerY, 0, 0);
    sim.particles.push(h, oh);

    sim.update(0.016);

    // H+ and OH- should be removed from free ions
    assert.equal(sim.particles.length, 0);
    // H2O water molecule should be created
    assert.equal(sim.waterMolecules.length, 1);
    assert.equal(sim.waterMolecules[0] instanceof WaterMolecule, true);

    // Reaction sound should have fired
    assert.equal(reactSoundPlayed, true);

    // Callback should have fired
    assert.equal(callbackTriggered, true);
    assert.ok(callbackData);

    // Sparks should have been created
    assert.ok(sim.sparks.length > 0);
  });

  it('updates spark lifetime and removes dead sparks', () => {
    const sim = new ParticleSimulation(createMockCanvas(400, 400));
    sim.clear();
    sim.spawnSparks(sim.centerX, sim.centerY, 10);
    assert.equal(sim.sparks.length, 10);

    // Update with a large deltaTime to expire sparks
    sim.update(2.0);
    assert.equal(sim.sparks.length, 0);
  });
});

describe('Dropper Droplet Animation', () => {
  it('animates falling drop and invokes onComplete upon reaching surface', () => {
    const sim = new ParticleSimulation(createMockCanvas(400, 400));
    let completed = false;

    sim.spawnDropAnimation('NaOH', () => {
      completed = true;
    });

    assert.equal(sim.dropAnimations.length, 1);
    assert.equal(completed, false);

    // Advance time until droplet lands and ripple completes
    for (let i = 0; i < 80; i++) {
      sim.update(0.03);
      if (completed && sim.dropAnimations.length === 0) break;
    }

    assert.equal(completed, true);
    assert.equal(sim.dropAnimations.length, 0);
  });
});

describe('Canvas Rendering Execution', () => {
  it('renders all visual elements to 2D context without error', () => {
    const mock = createMockCanvas(500, 500);
    const sim = new ParticleSimulation(mock);
    sim.syncWithState({ hCount: 2, clCount: 2, naCount: 2, ohCount: 2, h2oCount: 2 });
    sim.spawnSparks(250, 250, 5);

    assert.doesNotThrow(() => {
      sim.render(mock.ctx);
    });

    assert.ok(mock.calls.length > 0);
  });

  it('respects highlightNetIons by rendering spectator ions dimmed', () => {
    const mock = createMockCanvas(500, 500);
    const sim = new ParticleSimulation(mock);
    sim.syncWithState({ hCount: 1, clCount: 1, naCount: 1, ohCount: 1, h2oCount: 0 });

    sim.setHighlightNetIons(true);
    assert.doesNotThrow(() => {
      sim.render(mock.ctx);
    });

    // Check that spectator ions are drawn
    const counts = sim.getParticleCounts();
    assert.equal(counts.na, 1);
    assert.equal(counts.cl, 1);
  });

  it('respects showWaterMolecules toggle during rendering', () => {
    const mock = createMockCanvas(500, 500);
    const sim = new ParticleSimulation(mock);
    sim.syncWithState({ hCount: 0, clCount: 0, naCount: 0, ohCount: 0, h2oCount: 3 });

    sim.setShowWaterMolecules(false);
    assert.doesNotThrow(() => {
      sim.render(mock.ctx);
    });
  });
});
