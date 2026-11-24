window.NaveMoonVisual = Object.freeze({
  footprintDiameterRatio: 0.22,
  surfaceOffsetRatio: 0.008,
  model23ReferenceWidth: 492,
  model23RendererScale: 0.34,
  fadeStartRadiusPx: 5,
  minimumMoonRadiusPx: 9,
  minimumVisibleRadiusPx: 9,
  surfaceAnchors(moon, modelGroundOffsetWorld = 0) {
    const radius = Number(moon?.r);
    const x = Number(moon?.x);
    const y = Number(moon?.y ?? 0);
    const z = Number(moon?.z);
    const groundOffset = Number(modelGroundOffsetWorld);
    if (![radius, x, y, z, groundOffset].every(Number.isFinite) || radius <= 0 || groundOffset < 0) {
      return null;
    }
    const surfaceY = y + radius * (1 + this.surfaceOffsetRatio);
    return {
      contact: { x, y: surfaceY, z, r: 0 },
      model: { x, y: surfaceY + groundOffset, z, r: 0 }
    };
  },
  calculateBaseScale(moonScreenRadius) {
    const radius = Number(moonScreenRadius);
    const width = this.model23ReferenceWidth;
    const rendererScale = this.model23RendererScale;
    const ratio = this.footprintDiameterRatio;
    if (!Number.isFinite(radius) || radius <= 0 || width <= 0 || rendererScale <= 0 || ratio <= 0) {
      return 0;
    }
    return radius * 2 * ratio / (width * rendererScale);
  }
});
