/**
 * A Goldberg polyhedron: the hex-tiled sphere hexasphere.js builds. An icosahedron's faces are
 * split into a triangle grid `subdivisions` cells along each edge and pushed out onto the unit
 * sphere; every grid vertex then becomes a tile, whose corners are the centers of the triangles
 * around it. That gives 10 * subdivisions^2 + 2 tiles, all hexagons except the 12 sitting on the
 * icosahedron's corners, which are pentagons.
 *
 * Everything is kept in flat typed arrays (a few hundred thousand tiles stay cheap to build).
 * Tile t's corners are tileCorners[cornerStart[t] .. cornerStart[t + 1]), counter-clockwise seen
 * from outside the sphere, and neighbors[i] is the tile across the side from corner i to corner i + 1.
 */
export class HexSphere {
  private static readonly GOLDEN_RATIO = (1 + Math.sqrt(5)) / 2;
  private static readonly ICOSAHEDRON_VERTICES: [number, number, number][] = [
    [-1, HexSphere.GOLDEN_RATIO, 0],
    [1, HexSphere.GOLDEN_RATIO, 0],
    [-1, -HexSphere.GOLDEN_RATIO, 0],
    [1, -HexSphere.GOLDEN_RATIO, 0],
    [0, -1, HexSphere.GOLDEN_RATIO],
    [0, 1, HexSphere.GOLDEN_RATIO],
    [0, -1, -HexSphere.GOLDEN_RATIO],
    [0, 1, -HexSphere.GOLDEN_RATIO],
    [HexSphere.GOLDEN_RATIO, 0, -1],
    [HexSphere.GOLDEN_RATIO, 0, 1],
    [-HexSphere.GOLDEN_RATIO, 0, -1],
    [-HexSphere.GOLDEN_RATIO, 0, 1]
  ];
  // Counter-clockwise seen from outside.
  private static readonly ICOSAHEDRON_FACES: [number, number, number][] = [
    [0, 11, 5],
    [0, 5, 1],
    [0, 1, 7],
    [0, 7, 10],
    [0, 10, 11],
    [1, 5, 9],
    [5, 11, 4],
    [11, 10, 2],
    [10, 7, 6],
    [7, 1, 8],
    [3, 9, 4],
    [3, 4, 2],
    [3, 2, 6],
    [3, 6, 8],
    [3, 8, 9],
    [4, 9, 5],
    [2, 4, 11],
    [6, 2, 10],
    [8, 6, 7],
    [9, 8, 1]
  ];

  public readonly subdivisions: number;
  public readonly tileCount: number;
  /** Unit-length tile centers, xyz per tile. */
  public readonly centers: Float32Array;
  /** Unit-length corner positions, xyz per corner; corners are shared between the 3 tiles meeting there. */
  public readonly corners: Float32Array;
  public readonly cornerStart: Int32Array;
  public readonly tileCorners: Int32Array;
  public readonly neighbors: Int32Array;

  constructor(subdivisions: number) {
    this.subdivisions = subdivisions;
    const n = subdivisions;
    this.tileCount = 10 * n * n + 2;
    this.centers = new Float32Array(this.tileCount * 3);

    const triangles = this.buildTriangles(n);
    const triangleCount = triangles.length / 3;
    this.corners = new Float32Array(triangleCount * 3);
    for (let tri = 0; tri < triangleCount; tri++) {
      this.writeTriangleCenter(triangles, tri);
    }

    // Each tile (grid vertex) touches 6 triangles, or 5 at a pentagon.
    this.cornerStart = new Int32Array(this.tileCount + 1);
    for (let i = 0; i < triangles.length; i++) this.cornerStart[triangles[i] + 1]++;
    for (let t = 0; t < this.tileCount; t++) this.cornerStart[t + 1] += this.cornerStart[t];

    this.tileCorners = new Int32Array(triangles.length);
    this.neighbors = new Int32Array(triangles.length);
    const filled = new Int32Array(this.tileCount);
    for (let tri = 0; tri < triangleCount; tri++) {
      for (let k = 0; k < 3; k++) {
        const tile = triangles[tri * 3 + k];
        this.tileCorners[this.cornerStart[tile] + filled[tile]++] = tri;
      }
    }

    for (let t = 0; t < this.tileCount; t++) {
      this.orderCorners(t, triangles);
    }
  }

  public isPentagon(tile: number): boolean {
    return this.cornerStart[tile + 1] - this.cornerStart[tile] === 5;
  }

  /**
   * The tile whose center is nearest the given unit vector, found by walking downhill from
   * `startTile` - a handful of steps when the start is close, as it is for a moving mouse.
   */
  public findTile(x: number, y: number, z: number, startTile = 0): number {
    let tile = startTile;
    let best = this.dotCenter(tile, x, y, z);
    for (;;) {
      let next = tile;
      for (let i = this.cornerStart[tile]; i < this.cornerStart[tile + 1]; i++) {
        const neighbor = this.neighbors[i];
        const dot = this.dotCenter(neighbor, x, y, z);
        if (dot > best) {
          best = dot;
          next = neighbor;
        }
      }
      if (next === tile) return tile;
      tile = next;
    }
  }

  // The triangle grid, as 3 tile indices per triangle. Grid vertices on an icosahedron corner or
  // edge are shared with the neighboring faces, so each is created exactly once.
  private buildTriangles(n: number): Int32Array {
    let nextVertex = 0;
    const addVertex = (x: number, y: number, z: number) => {
      const length = Math.hypot(x, y, z);
      this.centers[nextVertex * 3] = x / length;
      this.centers[nextVertex * 3 + 1] = y / length;
      this.centers[nextVertex * 3 + 2] = z / length;
      return nextVertex++;
    };
    const lerp = (a: number[], b: number[], t: number) => [
      a[0] + (b[0] - a[0]) * t,
      a[1] + (b[1] - a[1]) * t,
      a[2] + (b[2] - a[2]) * t
    ];

    const cornerVertices = HexSphere.ICOSAHEDRON_VERTICES.map(([x, y, z]) => addVertex(x, y, z));

    // An edge's inner vertices, ordered from its lower-numbered corner to its higher one.
    const edgeVertices = new Map<number, number[]>();
    const getEdge = (a: number, b: number) => {
      const low = Math.min(a, b);
      const high = Math.max(a, b);
      const key = low * 12 + high;
      let vertices = edgeVertices.get(key);
      if (!vertices) {
        vertices = [];
        const from = HexSphere.ICOSAHEDRON_VERTICES[low];
        const to = HexSphere.ICOSAHEDRON_VERTICES[high];
        for (let i = 1; i < n; i++) {
          const [x, y, z] = lerp(from, to, i / n);
          vertices.push(addVertex(x, y, z));
        }
        edgeVertices.set(key, vertices);
      }
      return vertices;
    };
    // The vertex `steps` cells along the edge from `a` toward `b`.
    const edgeVertex = (a: number, b: number, steps: number) => {
      if (steps === 0) return cornerVertices[a];
      if (steps === n) return cornerVertices[b];
      return a < b ? getEdge(a, b)[steps - 1] : getEdge(a, b)[n - steps - 1];
    };

    const triangles = new Int32Array(20 * n * n * 3);
    let written = 0;
    const grid = new Int32Array((n + 1) * (n + 1));

    for (const [a, b, c] of HexSphere.ICOSAHEDRON_FACES) {
      const pa = HexSphere.ICOSAHEDRON_VERTICES[a];
      const pb = HexSphere.ICOSAHEDRON_VERTICES[b];
      const pc = HexSphere.ICOSAHEDRON_VERTICES[c];

      // grid[i * (n + 1) + j] is the vertex i cells toward b and j cells toward c from a.
      for (let i = 0; i <= n; i++) {
        for (let j = 0; i + j <= n; j++) {
          let vertex: number;
          if (j === 0) vertex = edgeVertex(a, b, i);
          else if (i === 0) vertex = edgeVertex(a, c, j);
          else if (i + j === n) vertex = edgeVertex(b, c, j);
          else {
            const x = pa[0] + ((pb[0] - pa[0]) * i + (pc[0] - pa[0]) * j) / n;
            const y = pa[1] + ((pb[1] - pa[1]) * i + (pc[1] - pa[1]) * j) / n;
            const z = pa[2] + ((pb[2] - pa[2]) * i + (pc[2] - pa[2]) * j) / n;
            vertex = addVertex(x, y, z);
          }
          grid[i * (n + 1) + j] = vertex;
        }
      }

      const at = (i: number, j: number) => grid[i * (n + 1) + j];
      for (let i = 0; i < n; i++) {
        for (let j = 0; i + j < n; j++) {
          triangles[written++] = at(i, j);
          triangles[written++] = at(i + 1, j);
          triangles[written++] = at(i, j + 1);
          if (i + j < n - 1) {
            triangles[written++] = at(i + 1, j);
            triangles[written++] = at(i + 1, j + 1);
            triangles[written++] = at(i, j + 1);
          }
        }
      }
    }
    return triangles;
  }

  private writeTriangleCenter(triangles: Int32Array, tri: number) {
    let x = 0;
    let y = 0;
    let z = 0;
    for (let k = 0; k < 3; k++) {
      const vertex = triangles[tri * 3 + k];
      x += this.centers[vertex * 3];
      y += this.centers[vertex * 3 + 1];
      z += this.centers[vertex * 3 + 2];
    }
    const length = Math.hypot(x, y, z);
    this.corners[tri * 3] = x / length;
    this.corners[tri * 3 + 1] = y / length;
    this.corners[tri * 3 + 2] = z / length;
  }

  // Sorts a tile's corners counter-clockwise around its center, and fills in which tile lies
  // across each side: the one other tile both triangles on that side share.
  private orderCorners(tile: number, triangles: Int32Array) {
    const start = this.cornerStart[tile];
    const end = this.cornerStart[tile + 1];
    const cx = this.centers[tile * 3];
    const cy = this.centers[tile * 3 + 1];
    const cz = this.centers[tile * 3 + 2];

    // Any tangent direction, then the one perpendicular to it (center x first).
    let ex = -cy;
    let ey = cx;
    let ez = 0;
    if (Math.abs(cz) > 0.9) {
      ex = 0;
      ey = -cz;
      ez = cy;
    }
    const eLength = Math.hypot(ex, ey, ez);
    ex /= eLength;
    ey /= eLength;
    ez /= eLength;
    const fx = cy * ez - cz * ey;
    const fy = cz * ex - cx * ez;
    const fz = cx * ey - cy * ex;

    const angles: [number, number][] = [];
    for (let i = start; i < end; i++) {
      const corner = this.tileCorners[i];
      const px = this.corners[corner * 3];
      const py = this.corners[corner * 3 + 1];
      const pz = this.corners[corner * 3 + 2];
      angles.push([Math.atan2(px * fx + py * fy + pz * fz, px * ex + py * ey + pz * ez), corner]);
    }
    angles.sort((p, q) => p[0] - q[0]);
    for (let i = start; i < end; i++) this.tileCorners[i] = angles[i - start][1];

    for (let i = start; i < end; i++) {
      const triA = this.tileCorners[i];
      const triB = this.tileCorners[i + 1 < end ? i + 1 : start];
      this.neighbors[i] = this.sharedOtherVertex(triangles, triA, triB, tile);
    }
  }

  private sharedOtherVertex(triangles: Int32Array, triA: number, triB: number, tile: number): number {
    for (let p = 0; p < 3; p++) {
      const vertex = triangles[triA * 3 + p];
      if (vertex === tile) continue;
      for (let q = 0; q < 3; q++) {
        if (triangles[triB * 3 + q] === vertex) return vertex;
      }
    }
    return -1;
  }

  private dotCenter(tile: number, x: number, y: number, z: number) {
    return this.centers[tile * 3] * x + this.centers[tile * 3 + 1] * y + this.centers[tile * 3 + 2] * z;
  }
}
