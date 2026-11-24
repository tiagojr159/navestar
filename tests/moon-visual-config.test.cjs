const test = require('node:test');
const assert = require('node:assert/strict');

global.window = global;
require('../js/moon-visual-config.js');

test('base footprint stays at 22% of the projected moon diameter', () => {
  const config = global.NaveMoonVisual;
  for (const moonRadius of [9, 32, 100, 420]) {
    const rendererScale = config.calculateBaseScale(moonRadius);
    const renderedWidth = config.model23ReferenceWidth * config.model23RendererScale * rendererScale;
    assert.ok(Math.abs(renderedWidth / (moonRadius * 2) - config.footprintDiameterRatio) < 1e-12);
  }
});

test('invalid lunar radii produce no rendered base scale', () => {
  for (const radius of [0, -1, NaN, Infinity, 'not-a-radius']) {
    assert.equal(global.NaveMoonVisual.calculateBaseScale(radius), 0);
  }
});


test('surface anchor is fixed to the moon world position', () => {
  const moon = { x: 120, y: 7, z: -42, r: 72 };
  const anchors = global.NaveMoonVisual.surfaceAnchors(moon, 3.5);
  assert.deepEqual(anchors.contact, { x: 120, y: 7 + 72 * 1.008, z: -42, r: 0 });
  assert.equal(anchors.model.x, moon.x);
  assert.equal(anchors.model.z, moon.z);
  assert.ok(Math.abs(anchors.model.y - anchors.contact.y - 3.5) < 1e-12);
  assert.equal(global.NaveMoonVisual.surfaceAnchors(moon, -1), null);
});
