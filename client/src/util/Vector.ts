export class Vector {
  public x: number;
  public y: number;
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  public clone() {
    return new Vector(this.x, this.y);
  }

  public distance(vector: Vector) {
    const dx = this.x - vector.x;
    const dy = this.y - vector.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  public subtract(vector: Vector) {
    return new Vector(this.x - vector.x, this.y - vector.y);
  }

  public multiplyScalar(scalar: number) {
    return new Vector(this.x * scalar, this.y * scalar);
  }

  public add(otherVec: Vector) {
    return new Vector(this.x + otherVec.x, this.y + otherVec.y);
  }

  public static getCenterOfPolygon(vectors: Vector[]): Vector {
    const centerPoint = vectors.reduce((acc, curr) => new Vector(acc.x + curr.x, acc.y + curr.y), new Vector(0, 0));
    centerPoint.x /= vectors.length;
    centerPoint.y /= vectors.length;

    return centerPoint;
  }

  public static shiftVectorsAwayFromCenter(
    centerX: number,
    centerY: number,
    vectors: Vector[],
    shiftDistance: number
  ): Vector[] {
    let centerPoint = new Vector(centerX, centerY);

    const shiftedVectors = vectors.map((vector) => {
      const distanceFromCenter = vector.distance(new Vector(centerPoint.x, centerPoint.y));
      const shiftAmount = 1 - shiftDistance / distanceFromCenter;
      const shiftedVector = vector
        .clone()
        .subtract(new Vector(centerPoint.x, centerPoint.y))
        .multiplyScalar(shiftAmount)
        .add(new Vector(centerPoint.x, centerPoint.y));
      return shiftedVector;
    });

    return shiftedVectors;
  }

  public static angleBetweenVectors(vector1: Vector, vector2: Vector): number {
    const dotProduct = vector1.x * vector2.x + vector1.y * vector2.y;
    const mag1 = Math.sqrt(vector1.x ** 2 + vector1.y ** 2);
    const mag2 = Math.sqrt(vector2.x ** 2 + vector2.y ** 2);
    const cosTheta = dotProduct / (mag1 * mag2);
    const angleInRadians = Math.acos(cosTheta);
    const angleInDegrees = angleInRadians * (180 / Math.PI);
    return angleInDegrees;
  }

  public static isInsidePolygon(vectors: Vector[], mouseVector: Vector, mouseExtremeVector: Vector) {
    // Count intersections of the above line
    // with sides of polygon
    let count = 0;
    let i = 0;
    do {
      let next = (i + 1) % 6;

      // Check if the line segment from 'p' to
      // 'extreme' intersects with the line
      // segment from 'polygon[i]' to 'polygon[next]'
      if (this.doIntersect(vectors[i], vectors[next], mouseVector, mouseExtremeVector)) {
        // If the point 'p' is colinear with line
        // segment 'i-next', then check if it lies
        // on segment. If it lies, return true, otherwise false
        if (this.orientation(vectors[i], mouseVector, vectors[next]) == 0) {
          return this.onSegment(vectors[i], mouseVector, vectors[next]);
        }

        count++;
      }
      i = next;
    } while (i != 0);

    return count % 2 == 1;
  }

  private static doIntersect(p1: Vector, q1: Vector, p2: Vector, q2: Vector) {
    let o1 = this.orientation(p1, q1, p2);
    let o2 = this.orientation(p1, q1, q2);
    let o3 = this.orientation(p2, q2, p1);
    let o4 = this.orientation(p2, q2, q1);

    // General case
    if (o1 != o2 && o3 != o4) {
      return true;
    }

    // Special Cases
    // p1, q1 and p2 are colinear and
    // p2 lies on segment p1q1
    if (o1 == 0 && this.onSegment(p1, p2, q1)) {
      return true;
    }

    // p1, q1 and p2 are colinear and
    // q2 lies on segment p1q1
    if (o2 == 0 && this.onSegment(p1, q2, q1)) {
      return true;
    }

    // p2, q2 and p1 are colinear and
    // p1 lies on segment p2q2
    if (o3 == 0 && this.onSegment(p2, p1, q2)) {
      return true;
    }

    // p2, q2 and q1 are colinear and
    // q1 lies on segment p2q2
    if (o4 == 0 && this.onSegment(p2, q1, q2)) {
      return true;
    }

    // Doesn't fall in any of the above cases
    return false;
  }

  private static onSegment(p: Vector, q: Vector, r: Vector) {
    if (
      q.x <= Math.max(p.x, r.x) &&
      q.x >= Math.min(p.x, r.x) &&
      q.y <= Math.max(p.y, r.y) &&
      q.y >= Math.min(p.y, r.y)
    ) {
      return true;
    }
    return false;
  }

  // To find orientation of ordered triplet (p, q, r).
  // The function returns following values
  // 0 --> p, q and r are colinear
  // 1 --> Clockwise
  // 2 --> Counterclockwise
  private static orientation(p: Vector, q: Vector, r: Vector) {
    let val = Math.floor((q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y));

    if (val == 0) {
      return 0; // colinear
    }
    return val > 0 ? 1 : 2; // clock or counter clock wise
  }
}
