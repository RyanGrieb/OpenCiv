import * as THREE from "three";
import { TestRunner } from "../TestRunner";
import { Game } from "../../Game";
import { WebsocketClient } from "../../network/Client";
import { GameMap } from "../../map/GameMap";
import { Tile } from "../../map/Tile";
import { Unit } from "../../Unit";
import { GlobeProjection } from "../../globe/GlobeProjection";
import { TestUtils } from "../TestUtils";

// The globe with depth: what stands up off the map - trees, mountains' peaks, resources, cities,
// units and their badges, city banners - stands up off the globe too, rather than lying flat on it,
// so the world keeps its height toward the horizon and around the planet's edge. Starts an unexplored
// game on the Medium map, founds a city, and looks at it on the globe from close up, tilted toward
// the horizon: checks that the map's sprites and the city's banner stand, that on the planet's face
// the warrior stands upright, even well below its middle, while on its outline it stands straight out
// of the ground, that as the outline passes over the city everything does one or the other, never in
// between, a tile at a time (the warrior and the city's banner with their tiles), that however the
// ground turns or tilts away on screen the warrior's feet stay on its tile, that the mouse finds
// the warrior and the banner where they stand, that the fog of war shades what stands in it, and that
// a still view doesn't draw the map over again. Ends there to look around: drag, scroll, G for flat.
export function setupGlobeDepthTest(game: Game) {
  const runner = new TestRunner("GlobeDepth");
  const utils = new TestUtils(game);
  const scene = () => utils.getInGameScene();
  const globe = () => (scene().getCamera() as unknown as Record<string, any>)["globe"];
  const sprites = () => globe()["sprites"];
  const standing = (object: unknown) =>
    (sprites()["standing"] as { object: unknown }[]).some((entry) => entry.object === object);
  const clientPlayer = () => utils.getClientPlayer() as unknown as Record<string, any>;
  const hoveredTile = (): Tile | undefined => clientPlayer()["hoveredTile"]?.getRepresentedTile();
  const mouse = (type: string, [clientX, clientY]: number[], options: MouseEventInit = {}) =>
    game.getCanvas().dispatchEvent(new MouseEvent(type, { clientX, clientY, bubbles: true, ...options }));
  const cityBanner = () => (cityTile?.getCity() as unknown as Record<string, any>)?.["banner"];
  // How often each of the globe's pictures has been handed to the GPU.
  const uploads = () => [
    globe()["ground"].patchesCopied,
    sprites()["labels"].texture.version,
    sprites()["pieces"].atlas.texture.version
  ];
  // Close in over a tile, tilted toward the horizon, then lets a few frames draw.
  const lookAt = async (tile: Tile) => {
    scene().getCamera().jumpToLocation(tile.getCenterPosition().x, tile.getCenterPosition().y, 8);
    await utils.delay(1500);
  };
  // Looks straight down at the whole planet over the point `angle` radians from the warrior to its
  // west, north or north-west - putting the warrior toward the planet's east edge, below its middle,
  // or down to its right, where the ground both turns and tilts away aslant. Not past the north pole,
  // where the camera stops.
  const lookFromThe = async (way: "west" | "north" | "northwest", angle: number) => {
    const center = warrior.getTile().getCenterPosition();
    const [longitude, latitude] = globe().projection.toSphere(center.x, center.y);
    const west = [-Math.cos(longitude), 0, Math.sin(longitude)];
    const north = [
      -Math.sin(latitude) * Math.sin(longitude),
      Math.cos(latitude),
      -Math.sin(latitude) * Math.cos(longitude)
    ];
    if (way !== "west") angle = Math.min(angle, (1.3 - latitude) * (way === "north" ? 1 : Math.SQRT2));
    const toward =
      way === "west" ? west : way === "north" ? north : west.map((value, axis) => (value + north[axis]) / Math.SQRT2);
    const point = GlobeProjection.unitVector(longitude, latitude).map(
      (value, axis) => value * Math.cos(angle) + toward[axis] * Math.sin(angle)
    );
    const pointLatitude = Math.asin(point[1]);
    const [x, y] = globe().projection.toWorld(Math.atan2(point[0], point[2]), pointLatitude);
    // As far out wherever it looks from as the flat map's zoom of 0.9 is at the equator.
    scene()
      .getCamera()
      .jumpToLocation(x, y, 0.9 * Math.cos(pointLatitude));
    await utils.delay(1500);
  };
  // Where the planet's middle is on screen: what stands straight out of the ground points away from it,
  // however the camera tilts (it does in a short window, or toward the sun in a tall one).
  const planetMiddle = () => {
    const middle = new THREE.Vector3()
      .setFromMatrixPosition((globe()["planet"] as THREE.Object3D).matrixWorld)
      .project(globe()["camera"] as THREE.Camera);
    return [((middle.x + 1) / 2) * sprites()["screenWidth"], ((1 - middle.y) / 2) * sprites()["screenHeight"]];
  };
  // Where a world point is on screen, as it lies on the ground.
  const onScreen = ([worldX, worldY]: number[]) => {
    const [longitude, latitude] = globe().projection.toSphere(worldX, worldY);
    const point = new THREE.Vector3(...GlobeProjection.unitVector(longitude, latitude))
      .applyMatrix4((globe()["planet"] as THREE.Object3D).matrixWorld)
      .project(globe()["camera"] as THREE.Camera);
    return [((point.x + 1) / 2) * sprites()["screenWidth"], ((1 - point.y) / 2) * sprites()["screenHeight"]];
  };
  // Where the warrior's feet are on screen against its tile: how far inside the tile's hex (negative
  // outside it), and how far to the side of its middle, both as parts of how far the tile's bottom
  // corner is from its middle.
  const warriorFeet = () => {
    const feet = globe().screenPointOf(warrior, 0.5, 1);
    const center = warrior.getTile().getCenterPosition();
    const middle = onScreen([center.x, center.y]);
    const corners = [
      [0, -16],
      [16, -9],
      [16, 9],
      [0, 16],
      [-16, 9],
      [-16, -9]
    ].map(([x, y]) => onScreen([center.x + x, center.y + y]));
    if (!feet) return { inside: -Infinity, aside: Infinity };

    // The hex's corners run clockwise on screen, so what's inside is right of each side.
    const inside = Math.min(
      ...corners.map(([fromX, fromY], index) => {
        const [toX, toY] = corners[(index + 1) % corners.length];
        return (
          ((toX - fromX) * (feet[1] - fromY) - (toY - fromY) * (feet[0] - fromX)) / Math.hypot(toX - fromX, toY - fromY)
        );
      })
    );
    const size = Math.hypot(corners[3][0] - middle[0], corners[3][1] - middle[1]);
    return { inside: inside / size, aside: Math.abs(feet[0] - middle[0]) / size };
  };
  // How the warrior stands on screen, from the bottom of its picture to the top, and the way out from
  // the planet's middle to its feet.
  const warriorStanding = () => {
    const top = globe().screenPointOf(warrior, 0.5, 0);
    const bottom = globe().screenPointOf(warrior, 0.5, 1);
    if (!top || !bottom) return undefined;

    const middle = planetMiddle();
    return {
      up: [top[0] - bottom[0], top[1] - bottom[1]],
      out: [bottom[0] - middle[0], bottom[1] - middle[1]]
    };
  };
  // The tile each of the map's billboards comes from, worked out from the map as the globe cuts its
  // sprites (each piece, and each of its skirts), rather than from where it says it turns.
  const mapBillboardTiles = () =>
    GameMap.getInstance()
      .getStandingSprites()
      .flatMap((sprite) =>
        ((sprites()["pieces"].piecesOf(sprite.image, sprite.grounded) ?? []) as { bottoms: unknown[] }[]).flatMap(
          (piece) => Array(1 + (sprite.grounded ? piece.bottoms.length : 0)).fill(`${sprite.gridX},${sprite.gridY}`)
        )
      );
  // How the map's sprites, the warrior and the city's banner stand on screen where their feet are in
  // view, skirts aside: how many upright, how many straight out from the planet's middle, how many in
  // between, and on how many tiles they don't all do the same. One
  // near the top of the planet's outline can be both, and counts as neither.
  const spritesStanding = () => {
    const camera = globe()["camera"] as THREE.Camera;
    const planet = globe()["planet"] as THREE.Object3D;
    const middle = planetMiddle();
    const counts = { upright: 0, out: 0, between: 0, mixedTiles: 0, tilesKnown: false };
    const tileOf = mapBillboardTiles();
    const mapBillboards = sprites()["mapBillboards"] as Record<string, number>[];
    counts.tilesKnown = tileOf.length === mapBillboards.length;
    const onTiles = mapBillboards.map((billboard, index) => ({ billboard, tile: tileOf[index] }));
    for (const { object, billboard } of sprites()["standing"] as {
      object: unknown;
      billboard: Record<string, number>;
    }[]) {
      const tile = object === warrior ? warrior.getTile() : object === cityBanner() ? cityTile : undefined;
      if (tile) onTiles.push({ billboard, tile: `${tile.getGridX()},${tile.getGridY()}` });
    }

    const tiles = new Map<string, Set<string>>();
    for (const { billboard, tile } of onTiles) {
      if (billboard.height === 0) continue;

      const [longitude, latitude] = globe().projection.toSphere(billboard.footX, billboard.footY);
      const anchor = new THREE.Vector3(...GlobeProjection.unitVector(longitude, latitude));
      const toCamera = camera.position.clone().sub(anchor.clone().applyMatrix4(planet.matrixWorld));
      if (anchor.transformDirection(planet.matrixWorld).dot(toCamera) <= 0) continue;

      const [topLeft, topRight, bottomLeft] = sprites()["screenCorners"](billboard, camera) as number[][];
      const up = [topLeft[0] - bottomLeft[0], topLeft[1] - bottomLeft[1]];
      // Its foot, which is where its picture's left and top say it is.
      const [across, down] = [-billboard.left / billboard.width, -billboard.top / billboard.height];
      const foot = [0, 1].map(
        (axis) => topLeft[axis] + across * (topRight[axis] - topLeft[axis]) + down * (bottomLeft[axis] - topLeft[axis])
      );
      const out = [foot[0] - middle[0], foot[1] - middle[1]];
      const upright = degreesBetween(up, [0, -1]) < 1;
      const straightOut = degreesBetween(up, out) < 2;
      if (!upright && !straightOut) counts.between++;
      if (upright === straightOut) continue;

      counts[upright ? "upright" : "out"]++;
      tiles.set(tile, (tiles.get(tile) ?? new Set()).add(upright ? "upright" : "out"));
    }
    counts.mixedTiles = [...tiles.values()].filter((ways) => ways.size > 1).length;
    return counts;
  };
  // Clamped, as rounding can take the cosine of two lines pointing the same way just past 1.
  const degreesBetween = ([ax, ay]: number[], [bx, by]: number[]) =>
    (Math.acos(Math.min(1, Math.max(-1, (ax * bx + ay * by) / Math.hypot(ax, ay) / Math.hypot(bx, by)))) * 180) /
    Math.PI;
  let settler: Unit;
  let warrior: Unit;
  let cityTile: Tile;
  let warriorHead: number[] | undefined;
  let belowMiddle: { up: number[]; out: number[] } | undefined;
  let wellBelow: { up: number[]; out: number[] } | undefined;
  let onOutline: { up: number[]; out: number[] } | undefined;
  let outlineView: ReturnType<typeof spritesStanding> | undefined;
  let feetOnTile: ReturnType<typeof warriorFeet>[] = [];
  let uploadsBefore: number[] = [];

  runner.addStep({
    name: "Start an unexplored game on the Medium map, which wraps east-west",
    action: async () => {
      await utils.ensureInGame({ allowBarbarians: false, revealMap: false, wrapMap: true, mapSize: 3, mapPreset: "" });
      await utils.waitUntil(() => !scene()["loadingScreen"], 300000, "The map to be drawn");
      settler = await utils.findUnitWithAction("settle");
      warrior = utils
        .getClientPlayer()
        .getUnits()
        .find((unit: Unit) => unit !== settler);
      cityTile = settler.getTile();
    },
    verification: () => !!settler && !!warrior
  });

  runner.addStep({
    name: "Found a city with the settler",
    action: async () => {
      WebsocketClient.sendMessage({
        event: "unitAction",
        unitX: cityTile.getGridX(),
        unitY: cityTile.getGridY(),
        id: settler.getID(),
        actionName: "settle"
      });
      await utils.waitUntil(() => !!cityBanner(), 10000, "The city and its banner");
    },
    verification: () => !!cityBanner()
  });

  runner.addStep({
    name: "On the globe, close to the city and tilted toward the horizon, the map's sprites and the city's banner stand up",
    action: async () => {
      await scene().setGlobeView(true);
      await lookAt(cityTile);
      utils.log(`${sprites()["mapBillboards"].length} pieces of the map's sprites stand on the globe`, "yellow");
    },
    verification: () => sprites()["mapBillboards"].length > 0 && standing(cityBanner()) && standing(warrior)
  });

  runner.addStep({
    name: "On the planet's face the warrior stands upright, even well below its middle; on its outline it stands straight out of the ground, and as the outline passes over the city, everything stands one way or the other, a tile at a time",
    action: async () => {
      await lookFromThe("north", 0.25);
      belowMiddle = warriorStanding();
      await lookFromThe("north", 0.7);
      wellBelow = warriorStanding();
      await lookFromThe("west", 1.15);
      onOutline = warriorStanding();
      // Turning the planet a little at a time, so that the outline passes over the tiles around the city.
      outlineView = { upright: 0, out: 0, between: 0, mixedTiles: 0, tilesKnown: true };
      for (let step = 0; step <= 9; step++) {
        await lookFromThe("west", 0.9 + step * 0.05);
        const view = spritesStanding();
        outlineView.upright += view.upright;
        outlineView.out += view.out;
        outlineView.between += view.between;
        outlineView.mixedTiles += view.mixedTiles;
        outlineView.tilesKnown &&= view.tilesKnown;
      }
      if (belowMiddle && wellBelow && onOutline) {
        utils.log(
          `From upright it leans ${Math.round(degreesBetween(belowMiddle.up, [0, -1]))} degrees just below ` +
            `the middle, ${Math.round(degreesBetween(wellBelow.up, [0, -1]))} well below it and ` +
            `${Math.round(degreesBetween(onOutline.up, [0, -1]))} on the outline`,
          "yellow"
        );
      }
      if (outlineView) {
        const { upright, out, between, mixedTiles } = outlineView;
        utils.log(
          `Over those views, ${upright} sprites stood upright, ${out} straight out and ${between} in between; ` +
            `${mixedTiles} times a tile had some of each`,
          "yellow"
        );
      }
      await lookAt(cityTile);
    },
    // Below the middle, head over feet; on the outline, out from the planet's middle. Every sprite one
    // way or the other, and all of a tile's, the warrior and the city's banner among them, the same way.
    verification: () =>
      !!belowMiddle &&
      belowMiddle.out[1] > 0 &&
      degreesBetween(belowMiddle.up, [0, -1]) < 10 &&
      !!wellBelow &&
      wellBelow.out[1] > 0 &&
      degreesBetween(wellBelow.up, [0, -1]) < 10 &&
      !!onOutline &&
      degreesBetween(onOutline.up, onOutline.out) < 2 &&
      !!outlineView &&
      outlineView.tilesKnown &&
      outlineView.upright > 0 &&
      outlineView.out > 0 &&
      outlineView.between === 0 &&
      outlineView.mixedTiles === 0
  });

  runner.addStep({
    name: "However the ground turns or tilts away on screen, the warrior's feet stay on its tile, below its middle",
    action: async () => {
      // Close up and tilted toward the horizon; below the planet's middle; toward its east edge; down to
      // its right.
      await lookAt(warrior.getTile());
      feetOnTile = [warriorFeet()];
      await lookFromThe("north", 0.7);
      feetOnTile.push(warriorFeet());
      await lookFromThe("west", 0.8);
      feetOnTile.push(warriorFeet());
      await lookFromThe("northwest", 1);
      feetOnTile.push(warriorFeet());
      const percents = (key: "inside" | "aside") =>
        feetOnTile.map((feet) => `${Math.round(feet[key] * 100)}%`).join(", ");
      utils.log(
        `The warrior's feet are ${percents("inside")} of the way from its tile's edge toward its middle, ` +
          `and ${percents("aside")} of the way to its side`,
        "yellow"
      );
      await lookAt(cityTile);
    },
    // Its feet are just inside the bottom corner of its tile on the flat map, so near its edge here -
    // give or take, as the ground turns, its corners' reach past its sides, and the ground curving away
    // from how it looks at the tile's middle.
    verification: () => feetOnTile.length === 4 && feetOnTile.every((feet) => feet.inside > -0.1 && feet.aside < 0.05)
  });

  runner.addStep({
    name: "The mouse on the warrior's head, where it stands up, hovers the warrior's tile",
    action: async () => {
      if (clientPlayer()["selectedUnit"]) utils.getClientPlayer().unselectUnit();
      warriorHead = globe().screenPointOf(warrior, 0.5, 0.2);
      if (warriorHead) mouse("mousemove", warriorHead);
      await utils.delay(300);
    },
    verification: () => !!warriorHead && hoveredTile() === warrior.getTile()
  });

  runner.addStep({
    name: "Clicking it there selects the warrior",
    action: async () => {
      mouse("mousedown", warriorHead, { button: 0 });
      mouse("mouseup", warriorHead, { button: 0 });
      await utils.delay(300);
    },
    verification: () => clientPlayer()["selectedUnit"] === warrior
  });

  runner.addStep({
    name: "Clicking the city's banner, where it stands over the city, opens the city",
    action: async () => {
      utils.getClientPlayer().unselectUnit();
      const banner = globe().screenPointOf(cityBanner(), 0.5, 0.5);
      if (!banner) return;

      mouse("mousemove", banner);
      await utils.delay(200);
      mouse("mousedown", banner, { button: 0 });
      mouse("mouseup", banner, { button: 0 });
      await utils.delay(500);
    },
    verification: () => !!scene()["cityDisplayInfo"]
  });

  runner.addStep({
    name: "Walking the warrior off, what it no longer sees falls into the fog of war, which shades what stands there too",
    action: async () => {
      scene().toggleCityUI();
      const endTurn = async () => {
        WebsocketClient.sendMessage({ event: "nextTurnRequest", value: true });
        await utils.delay(800);
      };
      // To the far side of the city, out of sight of the tiles past the side it started on.
      const farSide = utils.tilesAround(warrior.getTile(), 3, 3);
      const destinations = utils.tilesAround(cityTile, 2, 2).filter((tile) => farSide.includes(tile));
      await utils.walkTo(
        warrior,
        () => destinations,
        (data) => WebsocketClient.sendMessage(data),
        endTurn
      );
      await lookAt(cityTile);
    },
    // Some of what was in sight is fogged now (how many of the map's sprites stand there depends on
    // the map), and each piece takes on the fog's color and thickness at its foot, hidden by thick clouds.
    verification: () => {
      const fog = GameMap.getInstance().getFogOfWar();
      const thicknessAt = (x: number, y: number) => fog.getPixelAt(x, y)[3] / 255;
      const fogged = GameMap.getInstance()
        .getTiles()
        .flat()
        .filter((tile) => tile)
        .some((tile) => {
          const thickness = thicknessAt(tile.getCenterPosition().x, tile.getCenterPosition().y);
          return thickness > 0 && thickness <= 0.75;
        });
      const pieces = sprites()["mapBillboards"] as { footX: number; footY: number; tint: number[] }[];
      const tinted = pieces.every(({ footX, footY, tint }) => {
        const thickness = thicknessAt(footX, footY - 1);
        return thickness > 0.75 ? tint[3] < 0 : Math.abs(tint[3] - thickness) < 0.01;
      });
      const shaded = pieces.filter(({ tint }) => tint[3] > 0).length;
      utils.log(`${shaded} of ${pieces.length} pieces of the map's sprites in the fog of war`, "yellow");
      return fogged && tinted;
    }
  });

  runner.addStep({
    name: "Holding still, the globe draws nothing over again",
    action: async () => {
      // Once the warrior's walk and what it uncovered have finished drawing: the map's chunks redrawn
      // around the tiles it found (queued one after another, see GameMap.enqueueRender()), then the
      // globe's pictures of them, unchanged for a while.
      const map = GameMap.getInstance() as unknown as Record<string, Promise<void>>;
      for (let queue = map["renderQueue"]; ; queue = map["renderQueue"]) {
        await queue;
        if (map["renderQueue"] === queue) break;
      }
      let last = "";
      let changedAt = Date.now();
      await utils.waitUntil(
        () => {
          if (uploads().join() !== last) [last, changedAt] = [uploads().join(), Date.now()];
          return Date.now() - changedAt >= 1500;
        },
        30000,
        "The map to settle"
      );
      uploadsBefore = uploads();
      await utils.delay(3000);
    },
    verification: () => {
      const names = ["ground", "units and labels", "map sprites"];
      const redrawn = names.filter((name, index) => uploads()[index] !== uploadsBefore[index]);
      if (redrawn.length > 0) utils.log(`Drawn again: ${redrawn.join(", ")}`, "yellow");
      return redrawn.length === 0;
    }
  });

  return runner;
}
