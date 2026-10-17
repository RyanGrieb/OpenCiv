import * as THREE from "three";
import { ClientSettings } from "../ClientSettings";
import { GameMap } from "../map/GameMap";
import { Tile } from "../map/Tile";
import { Actor } from "../scene/Actor";
import { WorldView } from "../scene/Camera";
import { SceneObject } from "../scene/SceneObject";
import { Standing, StandingOptions } from "../scene/Standing";
import { AtlasCanvas } from "./AtlasCanvas";
import { Fingerprint } from "./Fingerprint";
import { GlobeProjection } from "./GlobeProjection";
import { OverStanding } from "./OverStanding";
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
  // The middle of the tile it's on (see StandingOptions.tileMiddle), or its foot if it's on none.
  // Everything on a tile stands upright or straight out of the ground together there (see
  // GlobeSprites.OUTLINE_REACH).
  middleX: number;
  middleY: number;
  // Standing upright, its foot is set off from middleX/middleY as the ground there looks on screen, but
  // turned so that what's straight below the middle on the flat map is straight below it on screen: as
  // much nearer the middle as the ground is squeezed, so it stays on its tile, but not swung round it
  // with the map - see GlobeSprites.footFromMiddle(). Everything but what rests on the ground all along
  // its bottom (mountains' peaks, hills' mounds), which stands on the ground painted under it.
  unturned: boolean;
  // One of several pieces cut out of its tile's sprite, like a tree of a forest: on the outline it stands
  // straight out of the ground at its own foot, where it is among the rest. Anything else - a unit, a
  // city, ruins, a mountain - is a picture of what's on its whole tile, which turns there about its
  // tile's middle (see GlobeSprites).
  ownFoot: boolean;
  // Which pose it has committed to: 1 straight out of the ground, 0 upright, or -1 before it has been
  // decided - see GlobeSprites.updatePoses() - and when, in seconds on the sprites' clock, it started
  // fading to it from the other (long ago if it hasn't).
  pose: number;
  poseSince: number;
  // Its tile's middle as a point on the unit sphere, once found.
  middleUnit?: [number, number, number];
  // For a skirt (see GlobeSprites.addSkirts()), how far above its foot the pixels it hangs from stop,
  // in world pixels; 0 for anything else.
  skirt: number;
  // Drawn over everything, like a label or badge, which keeps its width toward the planet's edge so it
  // stays readable (see GlobeSprites.narrowest).
  overlay: boolean;
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

// Billboards drawn from one atlas, as the instances of two meshes with one geometry: one drawing them
// upright, one straight out of the ground (see GlobeSprites.POSE_FADE), each fading out as the other
// fades in.
class BillboardBatch {
  public readonly meshes: THREE.Mesh<THREE.InstancedBufferGeometry, THREE.ShaderMaterial>[];
  private capacity = 0;

  constructor(upright: THREE.ShaderMaterial, outline: THREE.ShaderMaterial) {
    const geometry = BillboardBatch.createGeometry(0);
    this.meshes = [upright, outline].map((material) => {
      const mesh = new THREE.Mesh(geometry, material);
      // Each instance places itself in the shader, so the mesh's own bounds mean nothing.
      mesh.frustumCulled = false;
      return mesh;
    });
  }

  // A unit square (x right, y down), one instance per billboard, with room for `capacity` of them.
  private static createGeometry(capacity: number) {
    const geometry = new THREE.InstancedBufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0], 3));
    geometry.setIndex([0, 2, 1, 1, 2, 3]);
    geometry.setAttribute("anchor", new THREE.InstancedBufferAttribute(new Float32Array(capacity * 3), 3));
    geometry.setAttribute("depthAnchor", new THREE.InstancedBufferAttribute(new Float32Array(capacity * 3), 3));
    geometry.setAttribute("middleAnchor", new THREE.InstancedBufferAttribute(new Float32Array(capacity * 3), 3));
    geometry.setAttribute("fromMiddle", new THREE.InstancedBufferAttribute(new Float32Array(capacity * 2), 2));
    geometry.setAttribute("unturned", new THREE.InstancedBufferAttribute(new Float32Array(capacity), 1));
    geometry.setAttribute("ownFoot", new THREE.InstancedBufferAttribute(new Float32Array(capacity), 1));
    geometry.setAttribute("skirt", new THREE.InstancedBufferAttribute(new Float32Array(capacity), 1));
    geometry.setAttribute("pose", new THREE.InstancedBufferAttribute(new Float32Array(capacity), 1));
    geometry.setAttribute("poseSince", new THREE.InstancedBufferAttribute(new Float32Array(capacity), 1));
    geometry.setAttribute("rect", new THREE.InstancedBufferAttribute(new Float32Array(capacity * 4), 4));
    geometry.setAttribute("atlasRect", new THREE.InstancedBufferAttribute(new Float32Array(capacity * 4), 4));
    geometry.setAttribute("tint", new THREE.InstancedBufferAttribute(new Float32Array(capacity * 4), 4));
    geometry.instanceCount = 0;
    return geometry;
  }

  public set(billboards: Billboard[], projection: GlobeProjection) {
    if (billboards.length > this.capacity) {
      this.capacity = Math.max(64, 2 ** Math.ceil(Math.log2(billboards.length)));
      this.meshes[0].geometry.dispose();
      const created = BillboardBatch.createGeometry(this.capacity);
      this.meshes.forEach((mesh) => (mesh.geometry = created));
    }

    const geometry = this.meshes[0].geometry;
    const anchors = geometry.getAttribute("anchor") as THREE.InstancedBufferAttribute;
    const depthAnchors = geometry.getAttribute("depthAnchor") as THREE.InstancedBufferAttribute;
    const middleAnchors = geometry.getAttribute("middleAnchor") as THREE.InstancedBufferAttribute;
    const fromMiddles = geometry.getAttribute("fromMiddle") as THREE.InstancedBufferAttribute;
    const unturned = geometry.getAttribute("unturned") as THREE.InstancedBufferAttribute;
    const ownFeet = geometry.getAttribute("ownFoot") as THREE.InstancedBufferAttribute;
    const skirts = geometry.getAttribute("skirt") as THREE.InstancedBufferAttribute;
    const poses = geometry.getAttribute("pose") as THREE.InstancedBufferAttribute;
    const posesSince = geometry.getAttribute("poseSince") as THREE.InstancedBufferAttribute;
    const rects = geometry.getAttribute("rect") as THREE.InstancedBufferAttribute;
    const atlasRects = geometry.getAttribute("atlasRect") as THREE.InstancedBufferAttribute;
    const tints = geometry.getAttribute("tint") as THREE.InstancedBufferAttribute;
    billboards.forEach((billboard, index) => {
      anchors.setXYZ(index, ...GlobeSprites.footOnSphere(projection, billboard));
      depthAnchors.setXYZ(index, ...GlobeSprites.footOnSphere(projection, billboard, billboard.depthBack));
      middleAnchors.setXYZ(index, ...GlobeSprites.middleOnSphere(projection, billboard));
      fromMiddles.setXY(index, billboard.footX - billboard.middleX, billboard.footY - billboard.middleY);
      unturned.setX(index, billboard.unturned ? 1 : 0);
      ownFeet.setX(index, billboard.ownFoot ? 1 : 0);
      skirts.setX(index, billboard.skirt);
      poses.setX(index, billboard.pose);
      posesSince.setX(index, billboard.poseSince);
      rects.setXYZW(index, billboard.left, billboard.top, billboard.width, billboard.height);
      atlasRects.setXYZW(index, billboard.atlasX, billboard.atlasY, billboard.atlasWidth, billboard.atlasHeight);
      tints.setXYZW(index, ...billboard.tint);
    });
    const attributes = [
      anchors,
      depthAnchors,
      middleAnchors,
      fromMiddles,
      unturned,
      ownFeet,
      skirts,
      poses,
      posesSince,
      rects,
      atlasRects,
      tints
    ];
    for (const attribute of attributes) {
      attribute.needsUpdate = true;
    }
    geometry.instanceCount = billboards.length;
  }

  // Writes only each billboard's pose, when only that changed.
  public setPoses(billboards: Billboard[]) {
    const geometry = this.meshes[0].geometry;
    const poses = geometry.getAttribute("pose") as THREE.InstancedBufferAttribute;
    const posesSince = geometry.getAttribute("poseSince") as THREE.InstancedBufferAttribute;
    billboards.forEach((billboard, index) => {
      poses.setX(index, billboard.pose);
      posesSince.setX(index, billboard.poseSince);
    });
    poses.needsUpdate = true;
    posesSince.needsUpdate = true;
  }

  public dispose() {
    this.meshes[0].geometry.dispose();
  }
}

/**
 * What stands up off the ground on the globe, drawn as billboards: pictures standing on the point of
 * the ground they belong to (their foot), facing the screen and as far from it as their foot all over.
 * On the planet's face they stand upright, just as the flat map draws them: a 2.5D overlay, as a globe's
 * map markers are drawn. The ground turns and tilts away on screen, but what stands on it doesn't turn
 * or squeeze, so a picture covering its tile, like a city's, standing up from its real foot near the
 * bottom of the tile would swing off it as the ground turns. So its foot is set off from its tile's
 * middle as the ground there is squeezed, but with down kept straight down (see Billboard.unturned): it
 * stays on its tile, and the picture right over it, without swinging round it. Only those on its
 * outline, which would stick out past its edge, stand straight out of the ground instead, as something
 * real would seen side on there: sideways at the planet's sides, upside down at its bottom (see
 * OUTLINE_REACH). Each does one or the other, and everything on a tile does the same: but a tile crossing
 * between them fades from one to the other rather than snapping (see POSE_FADE).
 * There a picture of what's on its whole tile - a unit, a city, a mountain - turns about its tile's
 * middle, its foot set off from that as the ground looks seen side on (see footFromMiddle()), so along
 * the edge but neither out over it nor sunk below it: turned about its own foot at the tile's bottom,
 * it would swing off the tile. But each of the pieces a
 * forest's trees or a field's plants are cut into stands out of the ground at its own foot (see
 * Billboard.ownFoot): turned together about the middle, those at the back of the tile would stack up
 * out past the edge.
 * Nothing can stand upright in the middle and straight out all round the edge without turning over
 * somewhere in between, so this keeps the turn to the outline, out of the way. Upright map sprites and
 * units narrow where the ground tilts away toward the edge, so they don't crowd together there; labels
 * and badges keep their width (see narrowest). Those with their feet in view are drawn in front of the
 * whole planet, so the ground never cuts into one, and one standing nearer covers one behind it.
 *
 * The map's standing sprites (trees, mountains' peaks, hills' mounds, resources, cities) are cut into
 * pieces (see StandingPieces), each with its own foot: where it stands among the rest, what it stands
 * straight out of on the outline, and where the fog of war tints it. Mountains' peaks and hills' mounds
 * stand up from their feet on the face too, as they rest on the ground painted under them. Where a
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
  // A billboard stands straight out of the ground, rather than upright, where the middle of its tile
  // (see Billboard.middleX) is within this many world pixels of the planet's outline on screen: half a
  // tile's height, so that at least half of one standing out there sticks out past the edge.
  private static readonly OUTLINE_REACH = 16;
  // Once straight out, a billboard stays so until its tile is this many world pixels further in, so one
  // right at the line doesn't flicker between the two.
  private static readonly OUTLINE_HOLD = 2;
  // A billboard doesn't snap from one pose to the other: it commits to the new one and, for this many
  // seconds, fades it in as the old one fades out (in dither for the map's sprites, which write depth,
  // in opacity for labels) - never held half way between.
  private static readonly POSE_FADE = 0.18;
  // For the depth test alone, billboards with their feet in view are brought in front of all of the
  // planet's ground, in the order of their feet: between these fractions of the nearest it can be.
  // Nothing standing on the side of a round planet in view is behind its ground, except where one on
  // the outline hangs back over it (below the planet's middle); past the horizon one keeps its foot's
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
    attribute vec3 middleAnchor;
    attribute vec2 fromMiddle;
    attribute float unturned;
    attribute float ownFoot;
    attribute float skirt;
    attribute float pose;
    attribute float poseSince;
    attribute vec4 rect;
    attribute vec4 atlasRect;
    attribute vec4 tint;
    uniform float worldPixel;
    uniform vec3 lightDirection;
    uniform float lit;
    uniform float depthLift;
    uniform vec2 groundDepths;
    uniform float narrowest;
    uniform float now;
    varying vec2 vAtlas;
    varying vec4 vTint;
    varying float vLight;
    varying float vFade;

    // Which way is out from the planet's middle on screen at a foot, from it and the ground's normal there
    // in the camera's space: where that normal points on screen - see GlobeSprites.outwardAt().
    vec2 outwardAt(vec3 footView, vec3 normalView) {
      vec2 outward = normalView.xy * -footView.z + footView.xy * normalView.z;
      return dot(outward, outward) > 0.0 ? normalize(outward) : vec2(0.0, 1.0);
    }

    // How much narrower the ground at a foot looks across the screen than it is, from how squarely it
    // faces the camera and the way out from the planet's middle there: squeezed toward the middle as it
    // tilts away, but not along the edge - see GlobeSprites.narrowest, and GlobeSprites.narrowing().
    float narrowing(vec2 outward, float facing) {
      vec2 across = vec2(1.0, 0.0) + (clamp(facing, 0.0, 1.0) - 1.0) * outward.x * outward;
      return max(narrowest, length(across));
    }

    // Where a foot stands from its tile's middle, at a point on the unit sphere (at, in the camera's
    // space), across and down what it stands in, which stands up the way up points on screen: set off
    // as the ground there looks, turned so that down stays down - see GlobeSprites.footFromMiddle().
    vec2 footFromMiddle(vec3 point, vec3 at, vec2 fromMiddle, float pixel, vec2 up) {
      vec3 east = normalize(vec3(point.z, 0.0, -point.x));
      mat3 toView = mat3(viewMatrix) * mat3(modelMatrix);
      vec3 eastView = toView * east;
      vec3 northView = toView * cross(point, east);
      // How a world pixel east of the point, and one south, look on screen - drawn in toward the
      // screen's middle as far as they go away from it.
      vec2 eastOnScreen = eastView.xy - at.xy * eastView.z / at.z;
      vec2 northOnScreen = northView.xy - at.xy * northView.z / at.z;
      vec2 alongX = vec2(eastOnScreen.x, -eastOnScreen.y) * pixel;
      vec2 alongY = vec2(-northOnScreen.x, northOnScreen.y) * pixel * ROW_STRETCH;
      // Across and down what it stands in, from right and down on screen.
      vec2 acrossIt = vec2(up.y, up.x);
      vec2 downIt = vec2(-up.x, up.y);
      alongX = vec2(dot(alongX, acrossIt), dot(alongX, downIt));
      alongY = vec2(dot(alongY, acrossIt), dot(alongY, downIt));
      // How far the ground reaches across, how far it slants down across, and how far it reaches
      // straight down from the point.
      float across = length(vec2(alongX.x, alongY.x));
      if (across <= 0.0) return vec2(0.0);
      float slant = dot(vec2(alongX.x, alongY.x), vec2(alongX.y, alongY.y)) / across;
      float down = abs(alongX.x * alongY.y - alongY.x * alongX.y) / across;
      return vec2(across * fromMiddle.x, slant * fromMiddle.x + down * fromMiddle.y);
    }

    void main() {
      // Drawn in one pose by each of two meshes: the one it has committed to fades in, the other out.
      bool outline = OUTLINE_POSE == 1;
      float faded = clamp((now - poseSince) / POSE_FADE, 0.0, 1.0);
      vFade = (pose > 0.5) == outline ? faded : 1.0 - faded;
      // Its foot set off from its tile's middle as it is standing upright - see Billboard.unturned - and on
      // the outline, turned with it straight out of the ground there, but for a piece on its own foot.
      bool fromItsMiddle = outline ? ownFoot < 0.5 : unturned > 0.5;
      vec3 standsOn = fromItsMiddle ? middleAnchor : anchor;
      vec3 normal = normalize(mat3(modelMatrix) * standsOn);
      vec3 foot = (modelMatrix * vec4(standsOn, 1.0)).xyz;
      float facing = dot(normal, normalize(cameraPosition - foot));
      float pixel = worldPixel * sqrt(max(0.0, 1.0 - standsOn.y * standsOn.y));

      // In the camera's space, so it's square to the screen and as far away as its foot.
      vec4 corner = viewMatrix * vec4(foot, 1.0);
      vec2 outward = outwardAt(corner.xyz, mat3(viewMatrix) * normal);
      // Upright, or on the planet's outline straight out of the ground.
      vec2 up = outline ? outward : vec2(0.0, 1.0);
      vec2 local = (rect.xy + position.xy * rect.zw) * pixel;
      #ifdef NARROWS
        if (!outline) local.x *= narrowing(outward, facing);
      #endif
      // A skirt reaches down from what it hangs from to the ground under that, seen side on as that is.
      if (skirt > 0.0) local.y = -skirt * mix(1.0, clamp(facing, 0.0, 1.0), position.y) * pixel;
      if (fromItsMiddle) local += footFromMiddle(middleAnchor, corner.xyz, fromMiddle, pixel, up);
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
      if (tint.a < 0.0 || vFade <= 0.0 || (lit < 0.5 && facing < 0.0)) gl_Position = vec4(0.0, 0.0, 2.0, 1.0);

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
    varying float vFade;
    ${PixelArtSampling.GLSL}

    // An ordered 4x4 dither threshold, 0 to 1, for the pixel on screen.
    float dither(vec2 pixel) {
      vec2 fine = mod(floor(pixel), 2.0);
      vec2 coarse = mod(floor(pixel / 2.0), 2.0);
      return (4.0 * mod(2.0 * fine.x + 3.0 * fine.y, 4.0) + mod(2.0 * coarse.x + 3.0 * coarse.y, 4.0) + 0.5) / 16.0;
    }

    void main() {
      vec4 color = samplePixelArt(atlas, atlasSize, vAtlas, dFdx(vAtlas), dFdy(vAtlas));
      #ifdef CUTOUT
        if (color.a < 0.5) discard;
        color.a = 1.0;
        // Fading between poses with the depth test on: dropping pixels, rather than blending them.
        if (vFade < 1.0 && vFade <= dither(gl_FragCoord.xy)) discard;
      #else
        color.a *= vFade;
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
  // Standing upright, a billboard narrows (toward its foot) as much as the ground under it looks
  // narrower across the screen, tilting away toward the planet's edge - so that there, where the ground
  // is squeezed thin, the map's sprites don't pile up into a wall - but to no less than this much of its
  // width, so each still reads as what it is (a client setting). Labels and badges keep their width.
  private readonly narrowest = { value: ClientSettings.get("GLOBE_EDGE_SPRITE_WIDTH") };
  // The nearest the planet's ground in view can be to the camera along its line of sight, and the
  // furthest - see IN_FRONT_FROM.
  private readonly groundDepths = new THREE.Vector2(0, 1);
  // Seconds since the sprites were made, for fading between poses, and the camera in the planet's own space.
  private readonly now = { value: 0 };
  private readonly startedAt = performance.now();
  private readonly cameraInPlanet = new THREE.Vector3();
  // Each standing object's pose, kept from frame to frame as its billboard is made anew every frame.
  private readonly standingPoses = new WeakMap<SceneObject, { pose: number; poseSince: number }>();
  private readonly mapSprites: BillboardBatch;
  private readonly units: BillboardBatch;
  private readonly overlay: BillboardBatch;
  private readonly materials: THREE.ShaderMaterial[][];
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

    // Each batch's materials: upright, then straight out of the ground.
    this.materials = [
      [this.createMaterial(true, 0, false), this.createMaterial(true, 0, true)],
      [
        this.createMaterial(true, GlobeSprites.UNIT_DEPTH_LIFT, false),
        this.createMaterial(true, GlobeSprites.UNIT_DEPTH_LIFT, true)
      ],
      [this.createMaterial(false, 0, false), this.createMaterial(false, 0, true)]
    ];
    this.mapSprites = new BillboardBatch(...(this.materials[0] as [THREE.ShaderMaterial, THREE.ShaderMaterial]));
    this.units = new BillboardBatch(...(this.materials[1] as [THREE.ShaderMaterial, THREE.ShaderMaterial]));
    this.overlay = new BillboardBatch(...(this.materials[2] as [THREE.ShaderMaterial, THREE.ShaderMaterial]));
    this.overlay.meshes.forEach((mesh) => (mesh.renderOrder = GlobeSprites.OVERLAY_RENDER_ORDER));
    // Units are drawn over what the flat map draws under them (see OverStanding.UNDER_UNITS_RENDER_ORDER).
    // That's drawn with what's see-through, after everything solid, so units are counted see-through
    // too, to come after it: their pixels are whole, so this changes nothing of how they look, and they
    // still test depth against the map's sprites, drawn before them.
    this.units.meshes.forEach((mesh) => {
      mesh.material.transparent = true;
      mesh.renderOrder = OverStanding.UNITS_RENDER_ORDER;
    });
    planet.add(...this.mapSprites.meshes, ...this.units.meshes, ...this.overlay.meshes);
  }

  /** A billboard's foot as a point on the unit sphere, or the point `back` world pixels up the map from it. */
  public static footOnSphere(projection: GlobeProjection, billboard: Billboard, back = 0): [number, number, number] {
    const [longitude, latitude] = projection.toSphere(billboard.footX, billboard.footY - back);
    return GlobeProjection.unitVector(longitude, latitude);
  }

  /** The middle of a billboard's tile as a point on the unit sphere (see Billboard.middleX). */
  public static middleOnSphere(projection: GlobeProjection, billboard: Billboard): [number, number, number] {
    const [longitude, latitude] = projection.toSphere(billboard.middleX, billboard.middleY);
    return GlobeProjection.unitVector(longitude, latitude);
  }

  // Which way is out from the planet's middle on screen at a foot, from it and the ground's normal there
  // in the camera's space, as the vertex shader's outwardAt() works it out.
  private static outwardAt(footView: THREE.Vector3, normalView: THREE.Vector3) {
    const outward = new THREE.Vector2(
      normalView.x * -footView.z + footView.x * normalView.z,
      normalView.y * -footView.z + footView.y * normalView.z
    );
    return outward.lengthSq() > 0 ? outward.normalize() : outward.set(0, 1);
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
    this.narrowest.value = ClientSettings.get("GLOBE_EDGE_SPRITE_WIDTH");
    this.now.value = (performance.now() - this.startedAt) / 1000;
    this.updateGroundDepths(camera);
    this.updateMapSprites();
    this.updatePoses(this.mapBillboards, camera) && this.mapSprites.setPoses(this.mapBillboards);
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
      batch.meshes.forEach((mesh) => mesh.removeFromParent());
      batch.dispose();
    }
    this.materials.flat().forEach((material) => material.dispose());
    this.pieces.dispose();
    this.labels.dispose();
  }

  private createMaterial(cutout: boolean, depthLift: number, outlinePose: boolean) {
    return new THREE.ShaderMaterial({
      uniforms: {
        atlas: { value: null as THREE.Texture },
        atlasSize: { value: new THREE.Vector2(1, 1) },
        worldPixel: { value: (2 * Math.PI) / this.projection.worldWidth },
        lightDirection: { value: this.lightDirection },
        lit: { value: cutout ? 1 : 0 },
        depthLift: { value: depthLift },
        groundDepths: { value: this.groundDepths },
        narrowest: this.narrowest,
        now: this.now
      },
      defines: {
        // Labels and badges, drawn over everything, keep their width - see narrowest.
        ...(cutout ? { CUTOUT: "", NARROWS: "" } : {}),
        AMBIENT: GlobeSprites.AMBIENT.toFixed(3),
        DIRECT: GlobeSprites.DIRECT.toFixed(3),
        OUTLINE_REACH: GlobeSprites.OUTLINE_REACH.toFixed(3),
        POSE_FADE: GlobeSprites.POSE_FADE.toFixed(3),
        OUTLINE_POSE: outlinePose ? "1" : "0",
        ROW_STRETCH: this.rowStretch().toFixed(6),
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
          middleX: sprite.x + Tile.WIDTH / 2,
          middleY: sprite.y + Tile.HEIGHT / 2,
          unturned: !sprite.grounded,
          ownFoot: !sprite.grounded && pieces.length > 1,
          overlay: false,
          pose: -1,
          poseSince: 0,
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
    const found: {
      object: SceneObject;
      options: StandingOptions;
      foot: [number, number];
      middle: [number, number];
      bounds: number[];
    }[] = [];

    for (const object of objects) {
      const options = Standing.get(object);
      const bounds = options && GlobeSprites.boundsOf(object, options);
      if (!bounds) continue;

      const foot = options.anchor();
      if (!this.inView(foot, camera)) continue;

      found.push({ object, options, foot, middle: options.tileMiddle?.() ?? foot, bounds });
      // Relative to where it stands, so one only moving about doesn't need drawing again.
      print.addObject(object, foot[0], foot[1]);
      bounds.forEach((edge, index) => print.add(edge - foot[index % 2]));
    }

    if (print.value() !== this.labelsDrawn) {
      this.drawLabels(found, scale, useView);
      this.labelsDrawn = print.value();
    }

    this.standing = [];
    found.forEach(({ object, options, foot, middle, bounds }, index) => {
      const corner = this.labelCorners[index];
      if (!corner) return;

      const [left, top, right, bottom] = bounds;
      const billboard: Billboard = {
        footX: foot[0],
        footY: foot[1],
        middleX: middle[0],
        middleY: middle[1],
        unturned: !!options.tileMiddle,
        ownFoot: false,
        overlay: !!options.overlay,
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
        tint: [0, 0, 0, 0],
        pose: -1,
        poseSince: 0
      };
      const kept = this.standingPoses.get(object);
      if (kept) Object.assign(billboard, kept);
      this.updatePoses([billboard], camera);
      this.standingPoses.set(object, { pose: billboard.pose, poseSince: billboard.poseSince });
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

  private useAtlas(materials: THREE.ShaderMaterial[], atlas: AtlasCanvas) {
    for (const material of materials) {
      material.uniforms.atlas.value = atlas.texture;
      material.uniforms.atlasSize.value.set(...atlas.getSize());
    }
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
    const middleAnchor = new THREE.Vector3(...GlobeSprites.middleOnSphere(this.projection, billboard));
    const outline = billboard.pose === 1;
    const fromItsMiddle = outline ? !billboard.ownFoot : billboard.unturned;
    const anchor = fromItsMiddle
      ? middleAnchor
      : new THREE.Vector3(...GlobeSprites.footOnSphere(this.projection, billboard));
    const foot = anchor.clone().applyMatrix4(this.planet.matrixWorld);
    const normal = anchor.clone().transformDirection(this.planet.matrixWorld);
    const facing = normal.dot(camera.position.clone().sub(foot).normalize());
    const footView = foot.clone().applyMatrix4(camera.matrixWorldInverse);
    const outward = GlobeSprites.outwardAt(footView, normal.clone().transformDirection(camera.matrixWorldInverse));
    const pixel = this.pixelAt(anchor);
    const up = outline ? outward : new THREE.Vector2(0, 1);
    const narrowing = outline || billboard.overlay ? 1 : this.narrowing(outward, facing);
    const [footX, footY] = fromItsMiddle
      ? this.footFromMiddle(
          anchor,
          footView,
          [billboard.footX - billboard.middleX, billboard.footY - billboard.middleY],
          camera,
          up
        )
      : [0, 0];

    return [
      [0, 0],
      [1, 0],
      [0, 1]
    ].map(([across, down]) => {
      const x = (billboard.left + across * billboard.width) * pixel * narrowing + footX;
      const y = (billboard.top + down * billboard.height) * pixel + footY;
      const point = new THREE.Vector3(footView.x + up.y * x - up.x * y, footView.y - up.x * x - up.y * y, footView.z);
      point.applyMatrix4(camera.projectionMatrix);
      return [((point.x + 1) / 2) * this.screenWidth, ((1 - point.y) / 2) * this.screenHeight];
    });
  }

  /**
   * Where a foot stands from its tile's middle, a point on the unit sphere (`at` in the camera's space),
   * this frame, `fromMiddle` world pixels off it on the flat map: across and down what it stands in, in
   * the camera's space at the point's distance, standing up the way `up` points on screen (x right, y
   * up) - upright, or straight out of the ground on the outline. The ground there looks turned and squeezed on screen - turned around the poles, where the map
   * runs every which way, and squeezed where it tilts away. Set off as the ground looks, a foot near its
   * tile's bottom would swing round its middle with the map, and a picture standing on it, covering its
   * tile, would swing off; set off as on the flat map, it would land on the tile below, where the ground
   * is squeezed. So it's set off as the ground looks, turned so that down stays down: a foot straight
   * below the middle on the flat map is straight below it on screen, as far down as the ground there
   * reaches, so it stays on its tile without swinging round it, and the picture stands right over the
   * tile. (That's the ground's look times a turn, which leaves a lower triangular matrix: the Cholesky
   * factor of the look times its transpose.) On the outline down is in toward the ground, which is seen
   * side on there, so a foot is set off along the outline and hardly in or out at all: anything standing
   * there, wherever on its tile its foot is, stands on the ground at the edge rather than hovering over
   * it or sunk below it. As the vertex shader's footFromMiddle() works it out.
   */
  private footFromMiddle(
    point: THREE.Vector3,
    at: THREE.Vector3,
    [fromX, fromY]: number[],
    camera: THREE.Camera,
    up: THREE.Vector2
  ): [number, number] {
    const east = new THREE.Vector3(point.z, 0, -point.x).normalize();
    const north = point.clone().cross(east);
    // How a world pixel east of the point, and one south, look on screen - drawn in toward the screen's
    // middle as far as they go away from it.
    const [eastOnScreen, northOnScreen] = [east, north].map((direction) => {
      const view = direction.transformDirection(this.planet.matrixWorld).transformDirection(camera.matrixWorldInverse);
      return [view.x - (at.x * view.z) / at.z, view.y - (at.y * view.z) / at.z];
    });
    const pixel = this.pixelAt(point);
    // Across and down what it stands in, from right and down on screen.
    const [alongX, alongY] = [
      [eastOnScreen[0] * pixel, -eastOnScreen[1] * pixel],
      [-northOnScreen[0] * pixel * this.rowStretch(), northOnScreen[1] * pixel * this.rowStretch()]
    ].map(([x, y]) => [up.y * x + up.x * y, -up.x * x + up.y * y]);
    // How far the ground reaches across, how far it slants down across, and how far it reaches straight
    // down from the point.
    const across = Math.hypot(alongX[0], alongY[0]);
    if (across <= 0) return [0, 0];
    const slant = (alongX[0] * alongX[1] + alongY[0] * alongY[1]) / across;
    const down = Math.abs(alongX[0] * alongY[1] - alongY[0] * alongX[1]) / across;
    return [across * fromX, slant * fromX + down * fromY];
  }

  // How many times longer a world pixel down the map is on the globe than one across it: the map's rows
  // are closer than its tiles are wide, but the globe's hexes are regular.
  private rowStretch() {
    return (this.projection.rowStep * this.projection.worldWidth) / (GlobeProjection.TILE_STRIDE_Y * 2 * Math.PI);
  }

  // Commits each billboard to its pose this frame: straight out of the ground where the middle of its
  // tile is within OUTLINE_REACH world pixels of the planet's outline on screen, upright elsewhere. One
  // that changes starts fading to its new pose, from where it had got to in fading to the old one. A
  // billboard not yet decided takes its pose at once. Whether any changed.
  private updatePoses(billboards: Billboard[], camera: THREE.Camera) {
    const now = this.now.value;
    const cameraSquared = this.planet.worldToLocal(this.cameraInPlanet.copy(camera.position)).lengthSq();
    let changed = false;
    for (const billboard of billboards) {
      const middle = (billboard.middleUnit ??= GlobeSprites.middleOnSphere(this.projection, billboard));
      const along =
        middle[0] * this.cameraInPlanet.x + middle[1] * this.cameraInPlanet.y + middle[2] * this.cameraInPlanet.z;
      const facing = Math.max((along - 1) / Math.sqrt(Math.max(cameraSquared - 2 * along + 1, 1e-12)), 0);
      // How far out across the planet's disc it is: 1 on its outline, and past it.
      const across = Math.sqrt(1 - facing * facing);
      const reach = GlobeSprites.OUTLINE_REACH + (billboard.pose === 1 ? GlobeSprites.OUTLINE_HOLD : 0);
      const pose = across >= 1 - reach * this.pixelAtY(middle[1]) ? 1 : 0;
      if (pose === billboard.pose) continue;

      const fadedIn =
        billboard.pose < 0 ? 1 : Math.min(Math.max((now - billboard.poseSince) / GlobeSprites.POSE_FADE, 0), 1);
      billboard.poseSince = billboard.pose < 0 ? -1000 : now - (1 - fadedIn) * GlobeSprites.POSE_FADE;
      billboard.pose = pose;
      changed = true;
    }
    return changed;
  }

  // How much narrower an upright billboard is drawn this frame, as the vertex shader's narrowing() works it out.
  private narrowing(outward: THREE.Vector2, facing: number) {
    const squeeze = THREE.MathUtils.clamp(facing, 0, 1) - 1;
    const across = new THREE.Vector2(1, 0).addScaledVector(outward, squeeze * outward.x);
    return Math.max(this.narrowest.value, across.length());
  }

  // The radians a world pixel spans at a point on the unit sphere, as the vertex shader works it out.
  private pixelAt(point: THREE.Vector3) {
    return this.pixelAtY(point.y);
  }

  // The same from the point's height alone.
  private pixelAtY(y: number) {
    return ((2 * Math.PI) / this.projection.worldWidth) * Math.sqrt(Math.max(0, 1 - y * y));
  }
}
