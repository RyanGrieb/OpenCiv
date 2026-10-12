/**
 * GLSL for sampling pixel art the way the flat map shows it, crisp at any size: up close each texel
 * is a hard-edged square whose edges are smoothed over a screen pixel (so they don't shimmer as the
 * globe turns), and far off it's averaged like any texture. `texel` is the position in the texture's
 * own pixels, and `dx`/`dy` how far it moves per screen pixel (its derivatives), passed in since a
 * position wrapped around the globe jumps where it wraps.
 */
export class PixelArtSampling {
  public static readonly GLSL = `
    vec4 samplePixelArt(sampler2D map, vec2 size, vec2 texel, vec2 dx, vec2 dy) {
      vec2 footprint = max(abs(dx) + abs(dy), vec2(1e-4));
      vec2 seam = floor(texel + 0.5);
      vec2 sharp = seam + clamp((texel - seam) / footprint, -0.5, 0.5);
      return textureGrad(map, sharp / size, dx / size, dy / size);
    }
  `;
}
