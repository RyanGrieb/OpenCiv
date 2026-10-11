import * as THREE from "three";
import { HexSphere } from "./HexSphere";
import { PlanetAtlas } from "./PlanetAtlas";
import { PlanetTile } from "./PlanetTerrain";

/**
 * Turns a HexSphere and its tiles into two meshes - one draw call each, however many tiles:
 * the terrain, each tile a fan of triangles with its hex sprite stretched over it, and the overlays
 * (hills, forests, mountains, resources), each a flat 32x32 quad lying on its tile like the 2D map
 * draws them, so a mountain's peak still pokes over the tile above it. Tiles given as null are left
 * out (the game's globe draws the map itself and only the polar caps this way).
 */
export class PlanetMesh {
  // The terrain sprites' hex corners in sprite pixels, counter-clockwise from the bottom corner
  // (seen with north up) - see HexPixels.CORNERS.
  private static readonly HEX_CORNERS: [number, number][] = [
    [16, 32],
    [32, 25],
    [32, 7],
    [16, 0],
    [0, 7],
    [0, 25]
  ];
  // Pulls terrain uvs this far inside the sprite's hex, so a tile never samples its see-through edge.
  private static readonly UV_INSET = 0.97;
  // Sprite pixels from a hex's center to its corners average about this.
  private static readonly SPRITE_TILE_RADIUS = 17.3;
  private static readonly OVERLAY_LIFT = 0.0006;

  public readonly group = new THREE.Group();
  public readonly triangleCount: number;
  private readonly materials: THREE.Material[] = [];
  private readonly geometries: THREE.BufferGeometry[] = [];

  constructor(sphere: HexSphere, tiles: (PlanetTile | null)[], radius: number, tint?: THREE.ColorRepresentation) {
    const atlas = PlanetAtlas.getInstance();
    const rotations = new Float32Array(sphere.tileCount);
    const terrain = this.buildTerrain(sphere, tiles, radius, rotations, atlas);
    const overlays = this.buildOverlays(sphere, tiles, radius, rotations, atlas);
    atlas.refresh();

    const terrainMaterial = new THREE.MeshLambertMaterial({ map: atlas.texture, color: tint ?? 0xffffff });
    const overlayMaterial = new THREE.MeshLambertMaterial({
      map: atlas.texture,
      color: tint ?? 0xffffff,
      alphaTest: 0.5,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -2
    });
    this.materials.push(terrainMaterial, overlayMaterial);
    this.geometries.push(terrain, overlays);
    this.group.add(new THREE.Mesh(terrain, terrainMaterial), new THREE.Mesh(overlays, overlayMaterial));
    this.triangleCount = (terrain.index.count + overlays.index.count) / 3;
  }

  // East then north, unit tangents at a point on the unit sphere; east is arbitrary at the poles.
  private static tangentFrame(cx: number, cy: number, cz: number, out: Float64Array) {
    let ex = cz;
    let ez = -cx;
    let length = Math.hypot(ex, ez);
    if (length < 1e-6) {
      ex = 1;
      ez = 0;
      length = 1;
    }
    ex /= length;
    ez /= length;
    out[0] = ex;
    out[1] = 0;
    out[2] = ez;
    // north = center x east
    out[3] = cy * ez;
    out[4] = cz * ex - cx * ez;
    out[5] = -cy * ex;
  }

  // Which of the sprite's corners the tile's first corner takes, keeping the rest in order, so the
  // sprite turns as little as possible to fit.
  private static bestHexShift(angles: number[]): number {
    let bestShift = 0;
    let bestError = Infinity;
    for (let shift = 0; shift < 6; shift++) {
      let error = 0;
      for (let i = 0; i < 6; i++) {
        const diff = PlanetMesh.angleDifference(angles[i], PlanetMesh.spriteCornerAngle((i + shift) % 6));
        error += diff * diff;
      }
      if (error < bestError) {
        bestError = error;
        bestShift = shift;
      }
    }
    return bestShift;
  }

  private static hexRotation(angles: number[], shift: number): number {
    let total = 0;
    for (let i = 0; i < 6; i++)
      total += PlanetMesh.angleDifference(angles[i], PlanetMesh.spriteCornerAngle((i + shift) % 6));
    return total / 6;
  }

  private static spriteCornerAngle(corner: number): number {
    const [x, y] = PlanetMesh.HEX_CORNERS[corner];
    return Math.atan2(16 - y, x - 16);
  }

  // Where a ray from the sprite's center at `angle` (counter-clockwise from east) leaves its hex.
  private static hexOutlinePoint(angle: number): [number, number] {
    const dx = Math.cos(angle);
    const dy = -Math.sin(angle);
    let best = Infinity;
    for (let i = 0; i < 6; i++) {
      const [ax, ay] = PlanetMesh.HEX_CORNERS[i];
      const [bx, by] = PlanetMesh.HEX_CORNERS[(i + 1) % 6];
      const ex = bx - ax;
      const ey = by - ay;
      const denominator = dx * ey - dy * ex;
      if (Math.abs(denominator) < 1e-9) continue;
      const distance = ((ax - 16) * ey - (ay - 16) * ex) / denominator;
      const along = ((ax - 16) * dy - (ay - 16) * dx) / denominator;
      if (distance > 0 && along >= -1e-6 && along <= 1 + 1e-6) best = Math.min(best, distance);
    }
    return [16 + dx * best, 16 + dy * best];
  }

  private static tileRadius(sphere: HexSphere, tile: number): number {
    let total = 0;
    const start = sphere.cornerStart[tile];
    const end = sphere.cornerStart[tile + 1];
    for (let i = start; i < end; i++) {
      const corner = sphere.tileCorners[i];
      total += Math.hypot(
        sphere.corners[corner * 3] - sphere.centers[tile * 3],
        sphere.corners[corner * 3 + 1] - sphere.centers[tile * 3 + 1],
        sphere.corners[corner * 3 + 2] - sphere.centers[tile * 3 + 2]
      );
    }
    return total / (end - start);
  }

  private static angleDifference(a: number, b: number): number {
    let diff = a - b;
    while (diff > Math.PI) diff -= 2 * Math.PI;
    while (diff < -Math.PI) diff += 2 * Math.PI;
    return diff;
  }

  private static writeVertex(
    positions: Float32Array,
    normals: Float32Array,
    vertex: number,
    x: number,
    y: number,
    z: number,
    radius: number
  ) {
    positions[vertex * 3] = x * radius;
    positions[vertex * 3 + 1] = y * radius;
    positions[vertex * 3 + 2] = z * radius;
    normals[vertex * 3] = x;
    normals[vertex * 3 + 1] = y;
    normals[vertex * 3 + 2] = z;
  }

  private static createGeometry(
    positions: Float32Array,
    normals: Float32Array,
    uvs: Float32Array,
    indices: Uint32Array
  ) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
    geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    geometry.computeBoundingSphere();
    return geometry;
  }

  public dispose() {
    for (const geometry of this.geometries) geometry.dispose();
    for (const material of this.materials) material.dispose();
  }

  // Fills `rotations` with how far each tile is turned from north-up, which its overlays follow.
  private buildTerrain(
    sphere: HexSphere,
    tiles: (PlanetTile | null)[],
    radius: number,
    rotations: Float32Array,
    atlas: PlanetAtlas
  ) {
    let cornerTotal = 0;
    let tileTotal = 0;
    for (let t = 0; t < sphere.tileCount; t++) {
      if (!tiles[t]) continue;
      cornerTotal += sphere.cornerStart[t + 1] - sphere.cornerStart[t];
      tileTotal++;
    }
    const vertexCount = tileTotal + cornerTotal;
    const positions = new Float32Array(vertexCount * 3);
    const normals = new Float32Array(vertexCount * 3);
    const uvs = new Float32Array(vertexCount * 2);
    const indices = new Uint32Array(cornerTotal * 3);
    const frame = new Float64Array(6);
    const angles: number[] = [];

    let vertex = 0;
    let index = 0;
    for (let t = 0; t < sphere.tileCount; t++) {
      if (!tiles[t]) continue;
      const cx = sphere.centers[t * 3];
      const cy = sphere.centers[t * 3 + 1];
      const cz = sphere.centers[t * 3 + 2];
      PlanetMesh.tangentFrame(cx, cy, cz, frame);
      const start = sphere.cornerStart[t];
      const count = sphere.cornerStart[t + 1] - start;

      angles.length = 0;
      for (let i = 0; i < count; i++) {
        const corner = sphere.tileCorners[start + i];
        const px = sphere.corners[corner * 3];
        const py = sphere.corners[corner * 3 + 1];
        const pz = sphere.corners[corner * 3 + 2];
        angles.push(
          Math.atan2(px * frame[3] + py * frame[4] + pz * frame[5], px * frame[0] + py * frame[1] + pz * frame[2])
        );
      }

      const base = tiles[t].base;
      const centerVertex = vertex;
      PlanetMesh.writeVertex(positions, normals, vertex, cx, cy, cz, radius);
      const [cu, cv] = atlas.uv(base, 16, 16, true);
      uvs[vertex * 2] = cu;
      uvs[vertex * 2 + 1] = cv;
      vertex++;

      const shift = count === 6 ? PlanetMesh.bestHexShift(angles) : -1;
      rotations[t] = shift >= 0 ? PlanetMesh.hexRotation(angles, shift) : 0;
      for (let i = 0; i < count; i++) {
        const corner = sphere.tileCorners[start + i];
        PlanetMesh.writeVertex(
          positions,
          normals,
          vertex,
          sphere.corners[corner * 3],
          sphere.corners[corner * 3 + 1],
          sphere.corners[corner * 3 + 2],
          radius
        );
        // A hexagon's corners land on the sprite's corners; a pentagon's on the sprite's outline
        // in the same direction, squeezing the art a little.
        const [spriteX, spriteY] =
          shift >= 0 ? PlanetMesh.HEX_CORNERS[(i + shift) % 6] : PlanetMesh.hexOutlinePoint(angles[i]);
        const [u, v] = atlas.uv(
          base,
          16 + (spriteX - 16) * PlanetMesh.UV_INSET,
          16 + (spriteY - 16) * PlanetMesh.UV_INSET,
          true
        );
        uvs[vertex * 2] = u;
        uvs[vertex * 2 + 1] = v;
        indices[index++] = centerVertex;
        indices[index++] = centerVertex + 1 + i;
        indices[index++] = centerVertex + 1 + ((i + 1) % count);
        vertex++;
      }
    }
    return PlanetMesh.createGeometry(positions, normals, uvs, indices);
  }

  private buildOverlays(
    sphere: HexSphere,
    tiles: (PlanetTile | null)[],
    radius: number,
    rotations: Float32Array,
    atlas: PlanetAtlas
  ) {
    let quadCount = 0;
    for (const tile of tiles) quadCount += tile?.overlays.length ?? 0;
    const positions = new Float32Array(quadCount * 4 * 3);
    const normals = new Float32Array(quadCount * 4 * 3);
    const uvs = new Float32Array(quadCount * 4 * 2);
    const indices = new Uint32Array(quadCount * 6);
    const frame = new Float64Array(6);
    const quadCorners: [number, number][] = [
      [-16, 16],
      [16, 16],
      [16, -16],
      [-16, -16]
    ];

    let quad = 0;
    for (let t = 0; t < sphere.tileCount; t++) {
      const tile = tiles[t];
      if (!tile || tile.overlays.length === 0) continue;

      const cx = sphere.centers[t * 3];
      const cy = sphere.centers[t * 3 + 1];
      const cz = sphere.centers[t * 3 + 2];
      PlanetMesh.tangentFrame(cx, cy, cz, frame);
      const pixel = (PlanetMesh.tileRadius(sphere, t) * radius) / PlanetMesh.SPRITE_TILE_RADIUS;
      const cos = Math.cos(rotations[t]);
      const sin = Math.sin(rotations[t]);

      for (let layer = 0; layer < tile.overlays.length; layer++) {
        // Tiles further south sit a hair higher, so a peak poking north lies under its neighbor's
        // overlays, like the 2D map's row order.
        const lift = radius * (1 + PlanetMesh.OVERLAY_LIFT * (1 + layer + (1 - cy)));
        for (let k = 0; k < 4; k++) {
          const [sx, sy] = quadCorners[k];
          const east = (sx * cos - sy * sin) * pixel;
          const north = (sx * sin + sy * cos) * pixel;
          const v = quad * 4 + k;
          positions[v * 3] = cx * lift + frame[0] * east + frame[3] * north;
          positions[v * 3 + 1] = cy * lift + frame[1] * east + frame[4] * north;
          positions[v * 3 + 2] = cz * lift + frame[2] * east + frame[5] * north;
          normals[v * 3] = cx;
          normals[v * 3 + 1] = cy;
          normals[v * 3 + 2] = cz;
          const spriteX = tile.mirrored ? 16 - sx : 16 + sx;
          const [u, uvV] = atlas.uv(tile.overlays[layer], spriteX, 16 - sy, false);
          uvs[v * 2] = u;
          uvs[v * 2 + 1] = uvV;
        }
        const first = quad * 4;
        indices.set([first, first + 3, first + 1, first + 1, first + 3, first + 2], quad * 6);
        quad++;
      }
    }
    return PlanetMesh.createGeometry(positions, normals, uvs, indices);
  }
}
