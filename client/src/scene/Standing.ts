import { SceneObject } from "./SceneObject";

export interface StandingOptions {
  /** The world point it stands on: where it meets the ground. */
  anchor: () => [number, number];
  /** What it draws, in world coordinates (left, top, right, bottom); an actor's own rectangle if left out. */
  bounds?: () => [number, number, number, number];
  /** Drawn over everything, like a label, rather than among the map's sprites, where it can be hidden behind them. */
  overlay?: boolean;
  /**
   * The middle of the tile it stands on. On the globe, standing upright, it's drawn around that point
   * just as the flat map draws it there, so that it stays on its tile however the ground turns or tilts
   * away on screen; and near the planet's outline it stands upright or straight out of the ground with
   * the map's sprites on that tile. Its anchor if left out.
   */
  tileMiddle?: () => [number, number];
  /** The world point the mouse means when it's over this - a unit's tile, say. Only units need one. */
  pickPoint?: () => [number, number];
}

/**
 * The things in the world that stand up off the ground on the globe - units, labels, city banners -
 * rather than being painted on it like the terrain (see GlobeSprites). On the flat map this changes
 * nothing: everything is drawn flat, as always.
 */
export class Standing {
  private static readonly options = new WeakMap<SceneObject, StandingOptions>();

  public static set(object: SceneObject, options: StandingOptions) {
    Standing.options.set(object, options);
  }

  public static get(object: SceneObject): StandingOptions | undefined {
    return Standing.options.get(object);
  }
}
