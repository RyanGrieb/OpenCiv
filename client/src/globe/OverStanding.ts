import * as THREE from "three";

/**
 * Drawing what lies on the ground over what stands up off it, as the flat map draws its lines and the
 * hovered tile over the map's trees, mountains and units: after them, without testing depth, so that
 * nothing standing in front hides it - but not round the back of the planet, where it's left out as
 * its point of the ground faces away from the camera, as GlobeSprites leaves out labels there.
 */
export class OverStanding {
  // After the map's sprites and units, before labels and badges (see GlobeSprites.OVERLAY_RENDER_ORDER).
  public static readonly RENDER_ORDER = 6;
  // What the flat map draws under units, though over its trees - a city's territory, the tiles a ranged
  // unit can shoot into (see Marking.markUnderUnits), then the selected unit's outline over those:
  // after the map's sprites, but before units, which are drawn after them (see GlobeSprites) so as to
  // stand on them.
  public static readonly MARKING_UNDER_UNITS_RENDER_ORDER = 3;
  // Over ground markings, including the hovered tile, but depth-tested against standing map sprites.
  public static readonly CITY_BORDER_RENDER_ORDER = OverStanding.RENDER_ORDER + 0.5;
  public static readonly UNDER_UNITS_RENDER_ORDER = 4;
  public static readonly UNITS_RENDER_ORDER = 5;

  /** Sets a material up to be drawn over what stands; its shader also needs patch(). */
  public static setUp(material: THREE.Material) {
    material.transparent = true;
    material.depthTest = false;
    material.depthWrite = false;
  }

  /**
   * Leaves out, in a material's shader (from its onBeforeCompile), what's round the back of the planet:
   * where the normal - each point's way out from the planet's middle - faces away from the camera.
   */
  public static patch(shader: THREE.WebGLProgramParametersWithUniforms) {
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying float vFacingUs;")
      .replace(
        "#include <project_vertex>",
        `#include <project_vertex>
        vec4 onGround = modelMatrix * vec4(transformed, 1.0);
        vFacingUs = dot(normalize(mat3(modelMatrix) * objectNormal), cameraPosition - onGround.xyz);`
      );
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying float vFacingUs;")
      .replace(
        "#include <clipping_planes_fragment>",
        "if (vFacingUs < 0.0) discard;\n#include <clipping_planes_fragment>"
      );
  }
}
