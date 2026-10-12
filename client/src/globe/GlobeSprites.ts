import * as THREE from "three";
import { GameMap } from "../map/GameMap";
import { Actor } from "../scene/Actor";
import { WorldView } from "../scene/Camera";
import { SceneObject } from "../scene/SceneObject";
import { Standing, StandingOptions } from "../scene/Standing";
import { AtlasCanvas } from "./AtlasCanvas";
import { Fingerprint } from "./Fingerprint";
import { GlobeProjection } from "./GlobeProjection";
import { PixelArtSampling } from "./PixelArtSampling";
import { StandingPiece, StandingPieces } from "./StandingPieces";

/**
 * Something standing up on the globe: the point on the ground it stands on (its foot), its rectangle
 * around that point as the flat map would draw it, where its picture is in its atlas, and the fog of
 * war's color over it with how much of it shows (sRGB, 0 to 1; a negative amount hides it).
 */
interface Billboard {
  footX: number;
  footY: number;
  // For a skirt (see GlobeSprites.addSkirts()), how far above its foot the pixels it hangs from stop,
  // in world pixels; 0 for anything else.
  skirt: number;
  // How far behind its foot it counts as standing for the depth test, in world pixels: mountains' peaks
  // and hills' mounds stand at their back, so whatever stands on them shows in front. 0 for anything else.
  depthBack: number;
  left: number;
  top: number;
  width: number;
  height: number;
  atlasX: number;
  atlasY: number;
  atlasWidth: number;
  atlasHeight: number;
  tint: [number, number, number, number];
}

// A scene object standing up this frame, with its billboard, for pointing at it with the mouse.
interface StandingObject {
  object: SceneObject;
  options: StandingOptions;
  billboard: Billboard;
}

// Billboards drawn from one atlas with one material, as the instances of one mesh.
class BillboardBatch {
  public readonly mesh: THREE.Mesh<THREE.InstancedBufferGeometry, THREE.ShaderMaterial>;
  private capacity = 0;

  constructor(material: THREE.ShaderMaterial) {
    this.mesh = new THREE.Mesh(BillboardBatch.createGeometry(0), material);
    // Each instance places itself in the shader, so the mesh's own bounds mean nothing.
    this.mesh.frustumCulled = false;
  }

  // A unit square (x right, y down), one instance per billboard, with room for `capacity` of them.
  private static createGeometry(capacity: number) {
    const geometry = new THREE.InstancedBufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0], 3));
    geometry.setIndex([0, 2, 1, 1, 2, 3]);
    geometry.setAttribute("anchor", new THREE.InstancedBufferAttribute(new Float32Array(capacity * 3), 3));
    geometry.setAttribute("depthAnchor", new THREE.InstancedBufferAttribute(new Float32Array(capacity * 3), 3));
    geometry.setAttribute("skirt", new THREE.InstancedBufferAttribute(new Float32Array(capacity), 1));
    geometry.setAttribute("rect", new THREE.InstancedBufferAttribute(new Float32Array(capacity * 4), 4));
    geometry.setAttribute("atlasRect", new THREE.InstancedBufferAttribute(new Float32Array(capacity * 4), 4));
    geometry.setAttribute("tint", new THREE.InstancedBufferAttribute(new Float32Array(capacity * 4), 4));
    geometry.instanceCount = 0;
    return geometry;
  }

  public set(billboards: Billboard[], projection: GlobeProjection) {
    if (billboards.length > this.capacity) {
      this.capacity = Math.max(64, 2 ** Math.ceil(Math.log2(billboards.length)));
      this.mesh.geometry.dispose();
      this.mesh.geometry = BillboardBatch.createGeometry(this.capacity);
    }

    const geometry = this.mesh.geometry;
    const anchors = geometry.getAttribute("anchor") as THREE.InstancedBufferAttribute;
    const depthAnchors = geometry.getAttribute("depthAnchor") as THREE.InstancedBufferAttribute;
    const skirts = geometry.getAttribute("skirt") as THREE.InstancedBufferAttribute;
    const rects = geometry.getAttribute("rect") as THREE.InstancedBufferAttribute;
    const atlasRects = geometry.getAttribute("atlasRect") as THREE.InstancedBufferAttribute;
    const tints = geometry.getAttribute("tint") as THREE.InstancedBufferAttribute;
    billboards.forEach((billboard, index) => {
      anchors.setXYZ(index, ...GlobeSprites.footOnSphere(projection, billboard));
      depthAnchors.setXYZ(index, ...GlobeSprites.footOnSphere(projection, billboard, billboard.depthBack));
      skirts.setX(index, billboard.skirt);
      rects.setXYZW(index, billboard.left, billboard.top, billboard.width, billboard.height);
      atlasRects.setXYZW(index, billboard.atlasX, billboard.atlasY, billboard.atlasWidth, billboard.atlasHeight);
      tints.setXYZW(index, ...billboard.tint);
    });
    for (const attribute of [anchors, depthAnchors, skirts, rects, atlasRects, tints]) attribute.needsUpdate = true;
    geometry.instanceCount = billboards.length;
  }

  public dispose() {
    this.mesh.geometry.dispose();
  }
}

/**
 * What stands up off the ground on the globe, drawn as billboards: pictures standing on the point of
 * the ground they belong to (their foot), facing the screen and as far from it as their foot all over.
 * Where the camera looks straight down at the ground they stand upright, just as the flat map draws
 * them; toward the planet's edge they lean out with the ground, until there they stand straight out
 * of it (see STAND_UPRIGHT). Below the middle of the planet on screen they lean out the same way, still
 * standing up, until near the edge they turn over to stand straight out of it there too - upside down
 * at its bottom (see TURN_OVER). Turning over only there, where the ground is turned side on, one hangs
 * out past the edge rather than over the tile below its own. Those with their feet in view are drawn
 * in front of the whole planet, so the ground never cuts into one, and one standing nearer covers one
 * behind it.
 *
 * The map's standing sprites (trees, mountains' peaks, hills' mounds, resources, cities) are cut into
 * pieces (see StandingPieces), each standing on its own foot, tinted by the fog of war there. Where a
 * mountain's peaks or a hill's mounds stop short of their foot, skirts reach on down from them to the
 * ground toward the planet's edge (see addSkirts()), so that none floats over it there. Units, labels,
 * badges and the like (see Standing) are drawn each into their own patch of a second atlas by the
 * game's usual drawing code - again only when they change. Units stand among the map's sprites;
 * labels and badges are drawn over everything, as on the flat map.
 */
export class GlobeSprites {
  // How the billboards are lit, matching the band's MeshLambertMaterial under GlobeView's lights.
  private static readonly AMBIENT = 1.1;
  private static readonly DIRECT = 1.9;
  // Fog of war more opaque than this over a sprite's foot means clouds, which hide it.
  private static readonly CLOUD_HIDES = 0.75;
  // Labels and badges are drawn into their atlas at the screen's resolution, up to this many atlas
  // pixels to a world pixel, so text stays sharp close up.
  private static readonly MAX_DETAIL = 4;
  // Pixels added around each label or badge's rectangle, for text outlines and shadows.
  private static readonly MARGIN = 2;
  // How a billboard leans: the ground's normal pointing out across the screen leans it out, and the
  // normal pointing at the camera stands it upright as on the flat map, weighted by this. At 1, one
  // to the side of the planet's middle leans as far as its ground is turned from the camera: upright
  // seen from straight above, 45 degrees where its ground is turned 45 degrees, flat out at the edge.
  private static readonly STAND_UPRIGHT = 1;
  // Below the planet's middle on screen a billboard leans out as though in a mirror, standing up, until
  // its ground is turned this far toward side on (the cosine of its angle from the camera); from there
  // to the edge it turns over, to stand straight out of the planet like one above its middle. Turning
  // from upright to upside down, one straight below the middle has to swing round somewhere: this
  // keeps that out at the edge.
  private static readonly TURN_OVER = 0.5;
  // For the depth test alone, billboards with their feet in view are brought in front of all of the
  // planet's ground, in the order of their feet: between these fractions of the nearest it can be.
  // Nothing standing on the side of a round planet in view is behind its ground, except where a
  // billboard leans back over it (below the planet's middle); past the horizon one keeps its foot's
  // distance, so the planet hides what of it is behind.
  private static readonly IN_FRONT_FROM = 0.9;
  private static readonly IN_FRONT_TO = 0.98;
  // How far units are brought toward the camera for the depth test, in world pixels, so that as on
  // the flat map they show in front of their tile's trees, but not of the next row's.
  private static readonly UNIT_DEPTH_LIFT = 16;
  // Units, labels and badges are only drawn into their atlas while their foot is in view: no further
  // past the horizon than this (the cosine of the angle past it), and within this much of the screen
  // past its edges (in halves of the screen), as what stands on a point just out of view reaches into it.
  private static readonly PAST_HORIZON = -0.1;
  private static readonly PAST_SCREEN = 1.5;
  private static readonly OVERLAY_RENDER_ORDER = 10;

  private static readonly VERTEX_SHADER = `
    #include <common>
    attribute vec3 anchor;
    attribute vec3 depthAnchor;
    attribute float skirt;
    attribute vec4 rect;
    attribute vec4 atlasRect;
    attribute vec4 tint;
    uniform float worldPixel;
    uniform vec3 lightDirection;
    uniform float lit;
    uniform float depthLift;
    uniform vec2 groundDepths;
    varying vec2 vAtlas;
    varying vec4 vTint;
    varying float vLight;

    // Which way is up on screen for a billboard - see STAND_UPRIGHT, TURN_OVER and GlobeSprites.standingUp().
    vec2 standingUp(vec3 footView, vec3 normalView, float facing) {
      // Where the ground's normal points on screen: away from the planet's middle.
      vec2 outward = normalView.xy * -footView.z + footView.xy * normalView.z;
      outward = dot(outward, outward) > 0.0 ? normalize(outward) : vec2(0.0, 1.0);
      float across = sqrt(max(0.0, 1.0 - facing * facing));
      float turned = 1.0 - smoothstep(0.0, TURN_OVER, facing);
      float upward = mix(abs(outward.y), outward.y, turned);
      vec2 up = vec2(across * outward.x, across * upward + STAND_UPRIGHT * max(facing, 0.0));
      return dot(up, up) > 1e-12 ? normalize(up) : outward;
    }

    void main() {
      vec3 normal = normalize(mat3(modelMatrix) * anchor);
      vec3 foot = (modelMatrix * vec4(anchor, 1.0)).xyz;
      float facing = dot(normal, normalize(cameraPosition - foot));

      // In the camera's space, so it's square to the screen and as far away as its foot.
      vec4 corner = viewMatrix * vec4(foot, 1.0);
      vec2 up = standingUp(corner.xyz, mat3(viewMatrix) * normal, facing);
      float pixel = worldPixel * sqrt(max(0.0, 1.0 - anchor.y * anchor.y));
      vec2 local = (rect.xy + position.xy * rect.zw) * pixel;
      // A skirt reaches down from what it hangs from to the ground under that, seen side on as that is.
      if (skirt > 0.0) local.y = -skirt * mix(1.0, clamp(facing, 0.0, 1.0), position.y) * pixel;
      float depth = -(viewMatrix * modelMatrix * vec4(depthAnchor, 1.0)).z;
      corner.xy += vec2(up.y, -up.x) * local.x - up * local.y;
      gl_Position = projectionMatrix * corner;
      // For the depth test alone, one with its foot in view comes in front of the planet - see IN_FRONT_FROM.
      if (facing > 0.0) {
        float order = (depth - depthLift * pixel - groundDepths.x) / (groundDepths.y - groundDepths.x);
        depth = groundDepths.x * mix(IN_FRONT_FROM, IN_FRONT_TO, clamp(order, 0.0, 1.0));
      }
      vec4 placed = projectionMatrix * vec4(corner.xy, -depth, 1.0);
      gl_Position.z = placed.z / placed.w * gl_Position.w;
      // Hidden by clouds; or past the horizon, where a label drawn over everything would show through the planet.
      if (tint.a < 0.0 || (lit < 0.5 && facing < 0.0)) gl_Position = vec4(0.0, 0.0, 2.0, 1.0);

      vAtlas = atlasRect.xy + position.xy * atlasRect.zw;
      vTint = tint;
      float shade = (AMBIENT + DIRECT * max(dot(normal, lightDirection), 0.0)) / PI;
      vLight = mix(1.0, shade, lit);
    }
  `;

  private static readonly FRAGMENT_SHADER = `
    uniform sampler2D atlas;
    uniform vec2 atlasSize;
    varying vec2 vAtlas;
    varying vec4 vTint;
    varying float vLight;
    ${PixelArtSampling.GLSL}

    void main() {
      vec4 color = samplePixelArt(atlas, atlasSize, vAtlas, dFdx(vAtlas), dFdy(vAtlas));
      #ifdef CUTOUT
        if (color.a < 0.5) discard;
        color.a = 1.0;
      #endif
      color.rgb = mix(color.rgb, pow(vTint.rgb, vec3(2.2)), max(vTint.a, 0.0)) * vLight;
      gl_FragColor = color;
      #include <colorspace_fragment>
    }
  `;

  private readonly projection: GlobeProjection;
  private readonly planet: THREE.Object3D;
  private readonly pieces: StandingPieces;
  private readonly labels: AtlasCanvas;
  private readonly lightDirection = new THREE.Vector3(0, 0, 1);
  // The nearest the planet's ground in view can be to the camera along its line of sight, and the
  // furthest - see IN_FRONT_FROM.
  private readonly groundDepths = new THREE.Vector2(0, 1);
  private readonly mapSprites: BillboardBatch;
  private readonly units: BillboardBatch;
  private readonly overlay: BillboardBatch;
  private readonly materials: THREE.ShaderMaterial[];
  // The map's sprites as last built, and what of the map and its fog of war they were built from.
  private mapBillboards: Billboard[] = [];
  private builtVersion = -1;
  private tintedVersion = -1;
  // What the label atlas holds, by its fingerprint, and where each standing object found then is in
  // it, in the order they were found (undefined for one that didn't fit).
  private labelsDrawn: number | undefined;
  private labelCorners: ([number, number] | undefined)[] = [];
  // Atlas pixels to a world pixel in the label atlas, fewer than asked for if it filled up.
  private labelScale = 1;
  private standing: StandingObject[] = [];
  private screenWidth = 1;
  private screenHeight = 1;

  constructor(projection: GlobeProjection, planet: THREE.Object3D, maxTextureSize: number) {
    this.projection = projection;
    this.planet = planet;
    this.pieces = new StandingPieces(maxTextureSize);
    this.labels = new AtlasCanvas(1024, 256, maxTextureSize);

    this.materials = [
      this.createMaterial(true, 0),
      this.createMaterial(true, GlobeSprites.UNIT_DEPTH_LIFT),
      this.createMaterial(false, 0)
    ];
    this.mapSprites = new BillboardBatch(this.materials[0]);
    this.units = new BillboardBatch(this.materials[1]);
    this.overlay = new BillboardBatch(this.materials[2]);
    this.overlay.mesh.renderOrder = GlobeSprites.OVERLAY_RENDER_ORDER;
    planet.add(this.mapSprites.mesh, this.units.mesh, this.overlay.mesh);
  }

  /** A billboard's foot as a point on the unit sphere, or the point `back` world pixels up the map from it. */
  public static footOnSphere(projection: GlobeProjection, billboard: Billboard, back = 0): [number, number, number] {
    const [longitude, latitude] = projection.toSphere(billboard.footX, billboard.footY - back);
    return GlobeProjection.unitVector(longitude, latitude);
  }

  // Which way is up on screen for a billboard, as the vertex shader works it out from its foot and
  // the ground's normal there in the camera's space, and how squarely its ground faces the camera.
  private static standingUp(footView: THREE.Vector3, normalView: THREE.Vector3, facing: number) {
    // Where the ground's normal points on screen: away from the planet's middle.
    const outward = new THREE.Vector2(
      normalView.x * -footView.z + footView.x * normalView.z,
      normalView.y * -footView.z + footView.y * normalView.z
    );
    if (outward.lengthSq() > 0) outward.normalize();
    else outward.set(0, 1);
    const across = Math.sqrt(Math.max(0, 1 - facing * facing));
    const turned = 1 - THREE.MathUtils.smoothstep(facing, 0, GlobeSprites.TURN_OVER);
    const upward = THREE.MathUtils.lerp(Math.abs(outward.y), outward.y, turned);
    const up = new THREE.Vector2(
      across * outward.x,
      across * upward + GlobeSprites.STAND_UPRIGHT * Math.max(facing, 0)
    );
    return up.lengthSq() > 1e-12 ? up.normalize() : outward;
  }

  // Its rectangle in the world, as given or the actor's own, with a margin - undefined if it has no size.
  private static boundsOf(object: SceneObject, options: StandingOptions): number[] | undefined {
    const margin = GlobeSprites.MARGIN;
    let bounds = options.bounds?.();
    if (!bounds && object instanceof Actor) {
      bounds = [object.getX(), object.getY(), object.getX() + object.getWidth(), object.getY() + object.getHeight()];
    }
    if (!bounds || !(bounds[2] > bounds[0]) || !(bounds[3] > bounds[1])) return undefined;
    return [bounds[0] - margin, bounds[1] - margin, bounds[2] + margin, bounds[3] + margin];
  }

  /**
   * Brings the billboards up to date for this frame: the map's when it or its fog of war changed,
   * and the scene's standing objects (see Standing) among `objects`. `detail` is how many screen
   * pixels a world pixel covers; `useView` makes a canvas the one the game draws the map into.
   */
  public update(
    objects: SceneObject[],
    detail: number,
    camera: THREE.PerspectiveCamera,
    useView: (view: WorldView) => void
  ) {
    this.updateGroundDepths(camera);
    this.updateMapSprites();
    this.updateStandingObjects(objects, detail, camera, useView);
  }

  /** The screen's size in CSS pixels, which the mouse's position is given in. */
  public setScreenSize(width: number, height: number) {
    this.screenWidth = width;
    this.screenHeight = height;
  }

  /** Points the lighting the way GlobeView's headlight shines, toward it in world space. */
  public setLightDirection(direction: THREE.Vector3) {
    this.lightDirection.copy(direction);
  }

  /**
   * The point a unit standing under a point on screen (CSS pixels) means - its tile - for the
   * nearest such unit, or undefined if there's none there.
   */
  public pick(screenX: number, screenY: number, camera: THREE.Camera): [number, number] | undefined {
    let nearest: { point: [number, number]; distance: number } | undefined;
    for (const { options, billboard } of this.standing) {
      if (!options.pickPoint) continue;

      const local = this.toBillboard(billboard, screenX, screenY, camera);
      if (!local || local[0] < 0 || local[0] > 1 || local[1] < 0 || local[1] > 1) continue;

      const distance = camera.position.distanceTo(this.footInWorld(billboard));
      if (!nearest || distance < nearest.distance) nearest = { point: options.pickPoint(), distance };
    }
    return nearest?.point;
  }

  /**
   * For a standing object, the world point the flat map would have under a point on screen (CSS
   * pixels) - where it is on the object as drawn standing up. Undefined for anything else.
   */
  public screenToWorldFor(
    object: SceneObject,
    screenX: number,
    screenY: number,
    camera: THREE.Camera
  ): [number, number] | undefined {
    const billboard = this.standing.find((standing) => standing.object === object)?.billboard;
    if (!billboard) return undefined;

    const local = this.toBillboard(billboard, screenX, screenY, camera);
    if (!local) return undefined;
    return [
      billboard.footX + billboard.left + local[0] * billboard.width,
      billboard.footY + billboard.top + local[1] * billboard.height
    ];
  }

  /**
   * Where on screen (CSS pixels) a standing object shows a point of what the flat map draws for it,
   * as it stands up this frame: `across` and `down` from 0 to 1 over its rectangle. Undefined if it
   * isn't drawn.
   */
  public screenPointOf(object: SceneObject, across: number, down: number, camera: THREE.Camera) {
    const billboard = this.standing.find((standing) => standing.object === object)?.billboard;
    if (!billboard) return undefined;

    // Its own rectangle within the billboard's, which has a margin around it.
    const margin = GlobeSprites.MARGIN;
    const u = (margin + across * (billboard.width - 2 * margin)) / billboard.width;
    const v = (margin + down * (billboard.height - 2 * margin)) / billboard.height;
    const [[x0, y0], [x1, y1], [x2, y2]] = this.screenCorners(billboard, camera);
    return [x0 + u * (x1 - x0) + v * (x2 - x0), y0 + u * (y1 - y0) + v * (y2 - y0)];
  }

  public dispose() {
    for (const batch of [this.mapSprites, this.units, this.overlay]) {
      batch.mesh.removeFromParent();
      batch.dispose();
    }
    this.materials.forEach((material) => material.dispose());
    this.pieces.dispose();
    this.labels.dispose();
  }

  private createMaterial(cutout: boolean, depthLift: number) {
    return new THREE.ShaderMaterial({
      uniforms: {
        atlas: { value: null as THREE.Texture },
        atlasSize: { value: new THREE.Vector2(1, 1) },
        worldPixel: { value: (2 * Math.PI) / this.projection.worldWidth },
        lightDirection: { value: this.lightDirection },
        lit: { value: cutout ? 1 : 0 },
        depthLift: { value: depthLift },
        groundDepths: { value: this.groundDepths }
      },
      defines: {
        ...(cutout ? { CUTOUT: "" } : {}),
        AMBIENT: GlobeSprites.AMBIENT.toFixed(3),
        DIRECT: GlobeSprites.DIRECT.toFixed(3),
        STAND_UPRIGHT: GlobeSprites.STAND_UPRIGHT.toFixed(3),
        TURN_OVER: GlobeSprites.TURN_OVER.toFixed(3),
        IN_FRONT_FROM: GlobeSprites.IN_FRONT_FROM.toFixed(3),
        IN_FRONT_TO: GlobeSprites.IN_FRONT_TO.toFixed(3)
      },
      vertexShader: GlobeSprites.VERTEX_SHADER,
      fragmentShader: GlobeSprites.FRAGMENT_SHADER,
      side: THREE.DoubleSide,
      transparent: !cutout,
      depthTest: cutout,
      depthWrite: cutout
    });
  }

  private updateGroundDepths(camera: THREE.PerspectiveCamera) {
    const center = new THREE.Vector3().setFromMatrixPosition(this.planet.matrixWorld);
    const distance = camera.position.distanceTo(center);
    // No ground is nearer the camera than a radius (1) short of the planet's middle, and nothing in
    // view is further off the camera's line of sight than the screen's corners.
    const halfHeight = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const corner = Math.hypot(halfHeight, halfHeight * camera.aspect);
    this.groundDepths.set((distance - 1) / Math.hypot(1, corner), distance + 1);
  }

  private updateMapSprites() {
    const map = GameMap.getInstance();
    const fogVersion = map.getFogOfWar()?.getVersion() ?? -1;
    if (map.getStandingVersion() !== this.builtVersion) this.buildMapSprites();
    else if (fogVersion === this.tintedVersion) return;

    this.tintMapSprites();
    this.tintedVersion = fogVersion;
    this.mapSprites.set(this.mapBillboards, this.projection);
    this.pieces.upload();
    this.useAtlas(this.materials[0], this.pieces.atlas);
  }

  private buildMapSprites() {
    const map = GameMap.getInstance();
    let loading = false;
    this.mapBillboards = [];
    for (const sprite of map.getStandingSprites()) {
      const pieces = this.pieces.piecesOf(sprite.image, sprite.grounded);
      if (!pieces) loading = true;

      for (const piece of pieces ?? []) {
        const billboard: Billboard = {
          footX: sprite.x + piece.left + piece.width / 2,
          footY: sprite.y + piece.top + piece.height,
          skirt: 0,
          depthBack: sprite.grounded ? piece.height : 0,
          left: -piece.width / 2,
          top: -piece.height,
          width: piece.width,
          height: piece.height,
          atlasX: piece.atlasX,
          atlasY: piece.atlasY,
          atlasWidth: piece.width,
          atlasHeight: piece.height,
          tint: [0, 0, 0, 0]
        };
        if (sprite.grounded) this.addSkirts(billboard, piece);
        this.mapBillboards.push(billboard);
      }
    }
    // A sprite still loading has nothing to cut yet - try again next frame.
    this.builtVersion = loading ? -1 : map.getStandingVersion();
  }

  // Under a piece of something resting on the ground all along its bottom, like a mountain's peaks,
  // skirts: one under each strip of its columns that stops above its bottom row with nothing under it
  // (see StandingPiece.bottoms), that strip's lowest row of pixels drawn on down to where the ground
  // under it is. Seen from straight above that's where it stops, so they don't show; toward the
  // planet's edge, where that ground comes round to under its foot, they reach right down to it,
  // so that no peak at the back of a mountain hangs over the ground. Drawn before the piece, which
  // covers them where they hang down behind it.
  private addSkirts(billboard: Billboard, piece: StandingPiece) {
    for (const [from, to, above] of piece.bottoms) {
      this.mapBillboards.push({
        ...billboard,
        skirt: above,
        left: billboard.left + from,
        top: 0,
        width: to - from,
        height: 0,
        atlasX: piece.atlasX + from,
        // The middle of the strip's lowest row of pixels, over and over.
        atlasY: piece.atlasY + piece.height - above - 0.5,
        atlasWidth: to - from,
        atlasHeight: 0
      });
    }
  }

  // Each sprite takes on the fog of war's color where it stands; clouds hide it.
  private tintMapSprites() {
    const fog = GameMap.getInstance().getFogOfWar();
    if (!fog) return;

    for (const billboard of this.mapBillboards) {
      const [r, g, b, a] = fog.getPixelAt(billboard.footX, billboard.footY - 1);
      const amount = a / 255;
      billboard.tint = [r / 255, g / 255, b / 255, amount > GlobeSprites.CLOUD_HIDES ? -1 : amount];
    }
  }

  private updateStandingObjects(
    objects: SceneObject[],
    detail: number,
    camera: THREE.Camera,
    useView: (view: WorldView) => void
  ) {
    const scale = Math.max(1, Math.min(GlobeSprites.MAX_DETAIL, Math.ceil(detail)));
    const print = new Fingerprint().add(scale);
    const found: { object: SceneObject; options: StandingOptions; foot: [number, number]; bounds: number[] }[] = [];

    for (const object of objects) {
      const options = Standing.get(object);
      const bounds = options && GlobeSprites.boundsOf(object, options);
      if (!bounds) continue;

      const foot = options.anchor();
      if (!this.inView(foot, camera)) continue;

      found.push({ object, options, foot, bounds });
      // Relative to where it stands, so one only moving about doesn't need drawing again.
      print.addObject(object, foot[0], foot[1]);
      bounds.forEach((edge, index) => print.add(edge - foot[index % 2]));
    }

    if (print.value() !== this.labelsDrawn) {
      this.drawLabels(found, scale, useView);
      this.labelsDrawn = print.value();
    }

    this.standing = [];
    found.forEach(({ object, options, foot, bounds }, index) => {
      const corner = this.labelCorners[index];
      if (!corner) return;

      const [left, top, right, bottom] = bounds;
      const billboard: Billboard = {
        footX: foot[0],
        footY: foot[1],
        skirt: 0,
        depthBack: 0,
        left: left - foot[0],
        top: top - foot[1],
        width: right - left,
        height: bottom - top,
        atlasX: corner[0],
        atlasY: corner[1],
        atlasWidth: (right - left) * this.labelScale,
        atlasHeight: (bottom - top) * this.labelScale,
        tint: [0, 0, 0, 0]
      };
      this.standing.push({ object, options, billboard });
    });

    const units = this.standing.filter(({ options }) => !options.overlay);
    this.units.set(
      units.map(({ billboard }) => billboard),
      this.projection
    );
    this.overlay.set(this.overlayBackToFront(camera), this.projection);
    this.useAtlas(this.materials[1], this.labels);
    this.useAtlas(this.materials[2], this.labels);
  }

  // Packs the standing objects in view into the label atlas, then draws each into its patch with the
  // game's own drawing code - all placed first, as the atlas may grow (onto a new canvas) while
  // packing. Should they not all fit, they're packed again smaller, down to a pixel to a pixel.
  private drawLabels(
    found: { object: SceneObject; bounds: number[] }[],
    scale: number,
    useView: (view: WorldView) => void
  ) {
    for (this.labelScale = scale; ; this.labelScale = Math.max(1, Math.floor(this.labelScale / 2))) {
      this.labels.clear();
      this.labelCorners = found.map(({ bounds: [left, top, right, bottom] }) =>
        this.labels.place((right - left) * this.labelScale, (bottom - top) * this.labelScale)
      );
      if (this.labelScale === 1 || this.labelCorners.every((corner) => corner)) break;
    }

    const context = this.labels.context;
    const labelScale = this.labelScale;
    found.forEach(({ object, bounds: [left, top, right, bottom] }, index) => {
      const corner = this.labelCorners[index];
      if (!corner) return;

      const [x, y] = [corner[0] - left * labelScale, corner[1] - top * labelScale];
      useView({ context, x, y, zoom: labelScale, pixelRatio: 1 });
      context.save();
      context.beginPath();
      context.rect(
        corner[0],
        corner[1],
        Math.ceil((right - left) * labelScale),
        Math.ceil((bottom - top) * labelScale)
      );
      context.clip();
      object.draw(context);
      context.restore();
    });
    this.labels.upload();
  }

  // Whether a world point is in view this frame: on the camera's side of the planet and on screen,
  // each with some room to spare (see PAST_HORIZON and PAST_SCREEN).
  private inView([worldX, worldY]: [number, number], camera: THREE.Camera) {
    const [longitude, latitude] = this.projection.toSphere(worldX, worldY);
    const normal = new THREE.Vector3(...GlobeProjection.unitVector(longitude, latitude));
    const point = normal.clone().applyMatrix4(this.planet.matrixWorld);
    const toCamera = camera.position.clone().sub(point).normalize();
    if (normal.transformDirection(this.planet.matrixWorld).dot(toCamera) < GlobeSprites.PAST_HORIZON) return false;

    const onScreen = point.project(camera);
    return Math.abs(onScreen.x) < GlobeSprites.PAST_SCREEN && Math.abs(onScreen.y) < GlobeSprites.PAST_SCREEN;
  }

  // Labels and badges are drawn over one another in order, so the furthest from the camera go first.
  // Those standing on the same spot keep the scene's order.
  private overlayBackToFront(camera: THREE.Camera): Billboard[] {
    const overlay = this.standing
      .filter(({ options }) => options.overlay)
      .map(({ billboard }) => ({
        billboard,
        distance: camera.position.distanceToSquared(this.footInWorld(billboard))
      }));
    overlay.sort((a, b) => b.distance - a.distance);
    return overlay.map(({ billboard }) => billboard);
  }

  private useAtlas(material: THREE.ShaderMaterial, atlas: AtlasCanvas) {
    material.uniforms.atlas.value = atlas.texture;
    material.uniforms.atlasSize.value.set(...atlas.getSize());
  }

  private footInWorld(billboard: Billboard) {
    return new THREE.Vector3(...GlobeSprites.footOnSphere(this.projection, billboard)).applyMatrix4(
      this.planet.matrixWorld
    );
  }

  // Where a point on screen falls on a billboard as drawn this frame: 0 to 1 across and down it when
  // on it, taking its corners to be a parallelogram (they're very nearly one).
  private toBillboard(
    billboard: Billboard,
    screenX: number,
    screenY: number,
    camera: THREE.Camera
  ): [number, number] | undefined {
    const [[x0, y0], [x1, y1], [x2, y2]] = this.screenCorners(billboard, camera);
    const determinant = (x1 - x0) * (y2 - y0) - (x2 - x0) * (y1 - y0);
    if (Math.abs(determinant) < 1e-9) return undefined;

    const dx = screenX - x0;
    const dy = screenY - y0;
    return [(dx * (y2 - y0) - dy * (x2 - x0)) / determinant, ((x1 - x0) * dy - (y1 - y0) * dx) / determinant];
  }

  // A billboard's top left, top right and bottom left corners on screen (CSS pixels) this frame,
  // placed as the vertex shader places them.
  private screenCorners(billboard: Billboard, camera: THREE.Camera): [number, number][] {
    const anchor = new THREE.Vector3(...GlobeSprites.footOnSphere(this.projection, billboard));
    const foot = anchor.clone().applyMatrix4(this.planet.matrixWorld);
    const normal = anchor.clone().transformDirection(this.planet.matrixWorld);
    const facing = normal.dot(camera.position.clone().sub(foot).normalize());
    const footView = foot.clone().applyMatrix4(camera.matrixWorldInverse);
    const normalView = normal.clone().transformDirection(camera.matrixWorldInverse);
    const up = GlobeSprites.standingUp(footView, normalView, facing);
    const pixel = ((2 * Math.PI) / this.projection.worldWidth) * Math.sqrt(Math.max(0, 1 - anchor.y * anchor.y));

    return [
      [0, 0],
      [1, 0],
      [0, 1]
    ].map(([across, down]) => {
      const x = (billboard.left + across * billboard.width) * pixel;
      const y = (billboard.top + down * billboard.height) * pixel;
      const point = new THREE.Vector3(footView.x + up.y * x - up.x * y, footView.y - up.x * x - up.y * y, footView.z);
      point.applyMatrix4(camera.projectionMatrix);
      return [((point.x + 1) / 2) * this.screenWidth, ((1 - point.y) / 2) * this.screenHeight];
    });
  }
}
