package me.rhin.openciv.server.game.map;

import java.util.ArrayList;
import java.util.Random;

import org.java_websocket.WebSocket;

import com.badlogic.gdx.math.Rectangle;
import com.badlogic.gdx.math.Vector2;
import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.GameState;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.server.game.map.tile.Tile.TileTypeWrapper;
import me.rhin.openciv.server.game.map.tile.TileIndexer;
import me.rhin.openciv.server.game.map.tile.TileType;
import me.rhin.openciv.server.game.map.tile.TileType.TileLayer;
import me.rhin.openciv.server.game.map.tile.TileType.TileProperty;
import me.rhin.openciv.server.game.unit.Unit;
import me.rhin.openciv.server.listener.MapRequestListener;
import me.rhin.openciv.shared.packet.ChunkTile;
import me.rhin.openciv.shared.packet.type.AddUnitPacket;
import me.rhin.openciv.shared.packet.type.FinishLoadingPacket;
import me.rhin.openciv.shared.packet.type.MapChunkPacket;
import me.rhin.openciv.shared.util.MathHelper;

public class GameMap implements MapRequestListener {

	public static final int WIDTH = 80;
	public static final int HEIGHT = 52;
	public static final int MAX_NODES = WIDTH * HEIGHT;

	private static final int LAND_MASS_PARAM = 5;
	private static final int TEMPATURE_PARAM = 1;
	private static final int CLIMATE_PARAM = 2;

	private Tile[][] tiles;
	private GenerationValue[][] stencilMap;
	private GenerationValue[][] geographyMap;
	private ArrayList<Rectangle> mapPartition;
	private TileIndexer tileIndexer;

	private int[][] oddEdgeAxis = { { 0, -1 }, { 1, -1 }, { 1, 0 }, { 1, 1 }, { 0, 1 }, { -1, 0 } };
	private int[][] evenEdgeAxis = { { -1, -1 }, { 0, -1 }, { 1, 0 }, { 0, 1 }, { -1, 1 }, { -1, 0 } };

	public GameMap() {

		this.tiles = new Tile[WIDTH][HEIGHT];
		this.stencilMap = new GenerationValue[WIDTH][HEIGHT];
		this.geographyMap = new GenerationValue[WIDTH][HEIGHT];

		for (int x = 0; x < WIDTH; x++) {
			for (int y = 0; y < HEIGHT; y++) {
				Tile tile = new Tile(this, TileType.OCEAN, x, y);
				tiles[x][y] = tile;
				stencilMap[x][y] = new GenerationValue(0, x, y);
				geographyMap[x][y] = new GenerationValue(0, x, y);
			}
		}

		this.mapPartition = new ArrayList<>();
		this.tileIndexer = new TileIndexer(this);

		initializeEdges();

		Server.getInstance().getEventManager().addListener(MapRequestListener.class, this);
	}

	@Override
	public void onMapRequest(WebSocket conn) {
		Json json = new Json();

		ArrayList<AddUnitPacket> addUnitPackets = new ArrayList<>();

		for (int x = 0; x < GameMap.WIDTH; x++) {
			for (int y = 0; y < GameMap.HEIGHT; y++) {
				if (x % 4 == 0 && y % 4 == 0) {

					MapChunkPacket mapChunkPacket = new MapChunkPacket();

					ArrayList<int[][]> chunkLayers = new ArrayList<>();
					for (int i = 0; i < 3; i++) {
						int[][] chunkLayer = new int[MapChunkPacket.CHUNK_SIZE][MapChunkPacket.CHUNK_SIZE];
						for (int a = 0; a < chunkLayer.length; a++)
							for (int b = 0; b < chunkLayer[a].length; b++)
								chunkLayer[a][b] = -1;
						chunkLayers.add(chunkLayer);
					}

					ArrayList<ChunkTile> chunkTiles = new ArrayList<ChunkTile>();

					for (int i = 0; i < MapChunkPacket.CHUNK_SIZE; i++) {
						for (int j = 0; j < MapChunkPacket.CHUNK_SIZE; j++) {
							int tileX = x + i;
							int tileY = y + j;
							Tile tile = tiles[tileX][tileY];
							for (int k = 0; k < tile.getTileTypeWrappers().size(); k++)
								chunkLayers.get(k)[i][j] = ((TileTypeWrapper) tile.getTileTypeWrappers().toArray()[k])
										.getTileType().getID();

							int[] tileLayers = new int[tile.getTileTypeWrappers().size()];

							for (int k = 0; k < tile.getTileTypeWrappers().size(); k++) {
								tileLayers[k] = ((TileTypeWrapper) tile.getTileTypeWrappers().toArray()[k])
										.getTileType().getID();
							}

							int[] riverSides = new int[6];

							for (int k = 0; k < 6; k++) {
								riverSides[k] = tile.getRiverSides()[k] ? 1 : 0;
							}

							ChunkTile chunkTile = new ChunkTile();
							chunkTile.setTile(riverSides, tileLayers);
							chunkTiles.add(chunkTile);

							for (Unit unit : tile.getUnits()) {
								AddUnitPacket addUnitPacket = new AddUnitPacket();
								String unitName = unit.getClass().getSimpleName().substring(0,
										unit.getClass().getSimpleName().indexOf("Unit"));
								addUnitPacket.setUnit(unit.getPlayerOwner().getName(), unitName, unit.getID(), tileX,
										tileY);
								addUnitPackets.add(addUnitPacket);
							}

						}
					}

					// chunkJson.setElementType(type, fieldName, int);

					mapChunkPacket.setChunkTiles(chunkTiles);
					mapChunkPacket.setChunkLocation(x, y);

					conn.send(json.toJson(mapChunkPacket));
				}
			}
		}

		for (AddUnitPacket packet : addUnitPackets)
			conn.send(json.toJson(packet));

		// NOTE: The packet sent below assumes that no other loading packets have been
		// sent
		conn.send(json.toJson(new FinishLoadingPacket()));
	}

	public void resetTerrain() {
		for (int x = 0; x < WIDTH; x++) {
			for (int y = 0; y < HEIGHT; y++) {
				tiles[x][y].setTileType(TileType.OCEAN);
			}
		}
	}

	public void generateTerrain() {
		int landMassSize = (int) ((WIDTH * HEIGHT) / 12.5) * (LAND_MASS_PARAM + 2);

		// Apply stencil's to geography map
		while (getTotalGeographyLandMass() < landMassSize) {
			ArrayList<GenerationValue> chunk = generateRandomStencilChunk();
			for (GenerationValue chunkValue : chunk) {
				GenerationValue geographyMapValue = geographyMap[chunkValue.getGridX()][chunkValue.getGridY()];

				if (geographyMapValue.getValue() == 0)
					geographyMapValue.setValue(1);
				else
					geographyMapValue.setValue(geographyMapValue.getValue() + 1);
			}
		}

		int maxHeight = 0;

		// Latitude adjustments
		Random rnd = new Random();
		for (int x = 0; x < WIDTH; x++) {
			for (int y = 0; y < HEIGHT; y++) {
				int latitude = y - 29; // FIXME: This should be the center of the map
				latitude += rnd.nextInt(7);
				latitude = Math.abs(latitude);
				latitude += (1 - TEMPATURE_PARAM);
				latitude = latitude / 6 + 1;

				if (geographyMap[x][y].getValue() > maxHeight)
					maxHeight = geographyMap[x][y].getValue();

				if (geographyMap[x][y].getValue() > 0) {
					if (latitude < 2)
						tiles[x][y].setTileType(TileType.DESERT);
					else if (latitude < 4)
						tiles[x][y].setTileType(TileType.PLAINS);
					else
						tiles[x][y].setTileType(TileType.TUNDRA);
				}
			}
		}

		float mountainTopHeightPrecent = 0.50F;
		float mountainSpawnChancePrecent = 0.90F;
		float hillTopHeightPrecent = 0.90F;
		float hillSpawnChancePrecent = 0.50F;

		for (int x = 0; x < WIDTH; x++) {
			for (int y = 0; y < HEIGHT; y++) {

				if (geographyMap[x][y].getValue() > 0) {

					float topHeightPrecent = 1 - ((float) geographyMap[x][y].getValue() / maxHeight);

					// Spawn mountains
					if (mountainTopHeightPrecent > topHeightPrecent
							&& rnd.nextInt(100) >= (100 - (mountainSpawnChancePrecent * 100)))
						tiles[x][y].setTileType(TileType.MOUNTAIN);

					if (hillTopHeightPrecent > topHeightPrecent
							&& rnd.nextInt(100) >= (100 - (hillSpawnChancePrecent * 100))) {
						switch (tiles[x][y].getBaseTileType()) {
						case PLAINS:
							tiles[x][y].setTileType(TileType.PLAINS_HILL);
							break;
						case DESERT:
							tiles[x][y].setTileType(TileType.DESERT_HILL);
							break;
						case TUNDRA:
							tiles[x][y].setTileType(TileType.TUNDRA_HILL);
							break;
						default:
							break;
						}
					}
				}

			}
		}

		// Climate adjustments
		for (int x = 0; x < WIDTH; x++) {
			int wetness = 0;
			for (int y = 0; y < HEIGHT; y++) {
				int latitude = Math.abs(25 - y);

				if (tiles[x][y].getBaseTileType() == TileType.OCEAN) {
					int wetnessYeild = Math.abs(latitude - 12) + (CLIMATE_PARAM * 4);

					if (wetnessYeild > wetness)
						wetness += 2;

				} else if (wetness > 0) {
					int rainfall = 1;

					wetness -= rainfall;

					switch (tiles[x][y].getBaseTileType()) {
					case PLAINS:
						tiles[x][y].setTileType(TileType.GRASS);
						break;
					case PLAINS_HILL:
						tiles[x][y].setTileType(TileType.GRASS_HILL);
						break;
					case TUNDRA:
						break;
					case DESERT:
						tiles[x][y].setTileType(TileType.PLAINS);
						break;
					case DESERT_HILL:
						tiles[x][y].setTileType(TileType.PLAINS_HILL);
						break;
					case MOUNTAIN:
						// wetness -= 2;
						break;
					default:
						break;
					}

					// FIXME: This is a slight workaround, but for now it works
					if (tiles[x][y].getMovementCost() == 2) {
						if (tiles[x][y].getBaseTileType() != TileType.DESERT_HILL
								&& tiles[x][y].getBaseTileType() != TileType.TUNDRA_HILL) {

							if (rnd.nextInt(100) >= 50) {
								if (rnd.nextInt(100) >= 75) {
									if (tiles[x][y].getBaseTileType() == TileType.PLAINS_HILL)
										tiles[x][y].setTileType(TileType.PLAINS);

									if (tiles[x][y].getBaseTileType() == TileType.GRASS_HILL)
										tiles[x][y].setTileType(TileType.GRASS);
								}

								tiles[x][y].setTileType(TileType.FOREST);
							}

						}
					}
				}
			}

			wetness = 0;

			for (int y = HEIGHT - 1; y >= 0; y--) {
				int latitude = Math.abs(25 - y);

				if (tiles[x][y].getBaseTileType() == TileType.OCEAN) {
					int wetnessYeild = latitude / 2 + CLIMATE_PARAM;

					if (wetnessYeild > wetness)
						wetness += 2;

				} else if (wetness > 0) {
					int rainfall = 1;

					wetness -= rainfall;

					switch (tiles[x][y].getBaseTileType()) {
					case PLAINS:
						tiles[x][y].setTileType(TileType.GRASS);
						break;
					case PLAINS_HILL:
						tiles[x][y].setTileType(TileType.GRASS_HILL);
						break;
					case GRASS:
						if (latitude > 10) {
							tiles[x][y].setTileType(TileType.JUNGLE);
							wetness--;
						}
						break;
					case DESERT:
						tiles[x][y].setTileType(TileType.PLAINS);
						break;
					case DESERT_HILL:
						tiles[x][y].setTileType(TileType.PLAINS_HILL);
						break;
					default:
						break;
					}

					// FIXME: This is a slight workaround, but for now it works
					if (tiles[x][y].getMovementCost() == 2) {
						if (tiles[x][y].getBaseTileType() != TileType.DESERT_HILL
								&& tiles[x][y].getBaseTileType() != TileType.TUNDRA_HILL) {

							if (rnd.nextInt(100) >= 50) {
								if (rnd.nextInt(100) >= 75) {
									if (tiles[x][y].getBaseTileType() == TileType.PLAINS_HILL)
										tiles[x][y].setTileType(TileType.PLAINS);

									if (tiles[x][y].getBaseTileType() == TileType.GRASS_HILL)
										tiles[x][y].setTileType(TileType.GRASS);
								}

								tiles[x][y].setTileType(TileType.FOREST);
							}

						}
					}

				}
			}

		}

		// Generate rivers
		int riverAmount = 75;
		int minRiverSize = 4;
		while (riverAmount > 0) {

			ArrayList<Tile> river = new ArrayList<>();

			// Attempt to create a river
			Tile currentTile = null;
			while (currentTile == null) {
				Tile rndTile = tiles[rnd.nextInt(WIDTH)][rnd.nextInt(HEIGHT)];
				if (isHill(rndTile) && !rndTile.hasRivers()) {
					currentTile = rndTile;
				}
			}

			// FIXME: Ensure our river is not on the same side adj to the target tile.

			Tile lowestElvTile = null;

			while (true) {
				river.add(currentTile);

				if (currentTile.getBaseTileType() == TileType.OCEAN)
					break;

				lowestElvTile = currentTile;
				for (Tile adjTile : currentTile.getAdjTiles()) {
					if (geographyMap[adjTile.getGridX()][adjTile.getGridY()]
							.getValue() < geographyMap[lowestElvTile.getGridX()][lowestElvTile.getGridY()].getValue())
						lowestElvTile = adjTile;
				}

				// If we hit the lowest elevation possible w/ out reaching ocean
				if (currentTile.equals(lowestElvTile) || river.contains(lowestElvTile) || lowestElvTile.hasRivers()) {
					// FIXME: Or if the lowestElvTile is already a river.
					break;
				}

				currentTile = lowestElvTile;
			}

			if (river.size() < minRiverSize)
				continue;

			// Apply the river sides
			ArrayList<Vector2> traversedVectors = new ArrayList<>();

			System.out.println("Generating river sides w/ river size of: " + river.size());
			for (int i = 0; i < river.size(); i++) {
				if (i + 1 >= river.size())
					break;

				Tile tile = river.get(i);
				Tile nextTile = river.get(i + 1);

				if (tile.hasRivers())
					break;

				Vector2 currentVector = null;

				if (i == 0) {
					// Assign a random starting vector not adj to the next tile
					while (currentVector == null || containsVector(nextTile, currentVector)) {
						currentVector = tile.getVectors()[rnd.nextInt(6)];
					}
				} else {
					// Assign the current vector to the previous traversed vector
					currentVector = traversedVectors.get(traversedVectors.size() - 1);
				}

				// System.out.println("Current river vector at: " + currentVector);

				while (!containsVector(nextTile, currentVector)) {
					Vector2 nextVector = null;

					int currentVectorIndex = -1;
					for (int j = 0; j < tile.getVectors().length; j++) {
						// FIXME: I shouldn't have to round my vectors
						if (roundedEquals(currentVector, tile.getVectors()[j]))
							currentVectorIndex = j;
					}

					// System.out.println("Current vector index: " + currentVectorIndex);

					Vector2 leftVector = tile.getVectors()[currentVectorIndex + 1 > 5 ? 0 : currentVectorIndex + 1];
					Vector2 rightVector = tile.getVectors()[currentVectorIndex - 1 < 0 ? 5 : currentVectorIndex - 1];

					// Determine which vector to take based on the distance to the next tile
					Vector2 nextTileCenterVector = new Vector2(
							((nextTile.getVectors()[1].x - nextTile.getVectors()[5].x) / 2)
									+ nextTile.getVectors()[5].x,
							((nextTile.getVectors()[4].y - nextTile.getVectors()[5].y) / 2)
									+ nextTile.getVectors()[5].y);

					if (leftVector.dst(nextTileCenterVector) < rightVector.dst(nextTileCenterVector))
						nextVector = leftVector;
					else
						nextVector = rightVector;

					// Determine which vector to take based on the distance to the next tile
					Vector2 currentTileCenterVector = new Vector2(
							((tile.getVectors()[1].x - tile.getVectors()[5].x) / 2) + tile.getVectors()[5].x,
							((tile.getVectors()[4].y - tile.getVectors()[5].y) / 2) + tile.getVectors()[5].y);

					// System.out.println("Current tile center vector: " + currentTileCenterVector);
					// System.out.println("Next tile center vector: " + nextTileCenterVector);

					// System.out.println("Next vector found at: " + nextVector);

					int nextVectorIndex = -1;
					for (int j = 0; j < tile.getVectors().length; j++)
						if (roundedEquals(nextVector, tile.getVectors()[j]))
							nextVectorIndex = j;

					// System.out.println("Next vector index: " + nextVectorIndex);

					// Determine the side from the current & next vector

					// 5 & 0, 0 & 5 == side 0
					int tileSide = -1;

					for (int j = 0; j < tile.getAdjTiles().length; j++) {
						Vector2 firstVector = tile.getVectors()[j - 1 < 0 ? 5 : j - 1];
						Vector2 lastVector = tile.getVectors()[j];

						// System.out.println("====== Side " + j + " ======");
						// System.out.println(firstVector + "," + lastVector);

						// FIXME: Not the prettiest approach

						if ((roundedEquals(firstVector, currentVector) && roundedEquals(lastVector, nextVector))
								|| roundedEquals(firstVector, nextVector) && roundedEquals(lastVector, currentVector)) {
							tileSide = j;
						}
					}
					// System.out.println("Adding river to side: " + tileSide);
					if (tile.getAdjTiles()[tileSide].getBaseTileType() != TileType.OCEAN) {
						tile.addRiverToSide(tileSide);

						// 5 = left &
						// 0 = bottom right
						// 1 = bottom left
						// 2 = right &
						// 3 = top right
						// 4 = top left

						// 2 & 5
						// 0 & 3
						// 4 & 1
						int otherSidedIndex = -1;
						switch (tileSide) {
						case 0:
							otherSidedIndex = 3;
							break;
						case 1:
							otherSidedIndex = 4;
							break;
						case 2:
							otherSidedIndex = 5;
							break;
						case 3:
							otherSidedIndex = 0;
							break;
						case 4:
							otherSidedIndex = 1;
							break;
						case 5:
							otherSidedIndex = 2;
							break;
						}

						// Add river side to opposite angle of side.
						tile.getAdjTiles()[tileSide].addRiverToSide(otherSidedIndex);
					}

					traversedVectors.add(nextVector);
					currentVector = nextVector;
				}
			}

			riverAmount--;
		}

		// Split the map to make resource generation & player spawnpoints balanced
		splitMapPartition();

		generateResource(TileType.HORSES, Server.getInstance().getPlayers().size() * 6, TileType.GRASS,
				TileType.PLAINS);

		generateResource(TileType.IRON, Server.getInstance().getPlayers().size() * 6, TileType.GRASS, TileType.PLAINS,
				TileType.PLAINS_HILL, TileType.GRASS_HILL, TileType.DESERT, TileType.DESERT_HILL);

		generateResource(TileType.COPPER, Server.getInstance().getPlayers().size() * 4, TileType.GRASS, TileType.PLAINS,
				TileType.PLAINS_HILL, TileType.GRASS_HILL, TileType.DESERT, TileType.DESERT_HILL);

		generateResource(TileType.COTTON, Server.getInstance().getPlayers().size() * 4, TileType.GRASS,
				TileType.PLAINS);

		generateResource(TileType.GEMS, Server.getInstance().getPlayers().size() * 4, TileType.GRASS, TileType.PLAINS,
				TileType.DESERT, TileType.DESERT_HILL);

		ArrayList<Tile> adjGroundTiles = new ArrayList<>();
		System.out.println(tileIndexer.getAdjacentTilesTo(TileType.GRASS).toString());
		adjGroundTiles.addAll(tileIndexer.getAdjacentTilesTo(TileType.GRASS));
		adjGroundTiles.addAll(tileIndexer.getAdjacentTilesTo(TileType.PLAINS));
		adjGroundTiles.addAll(tileIndexer.getAdjacentTilesTo(TileType.TUNDRA));

		for (Tile tile : adjGroundTiles)
			if (tile.getBaseTileType().hasProperty(TileProperty.WATER))
				tile.setTileType(TileType.SHALLOW_OCEAN);

		for (Tile tile : tileIndexer.getAdjacentTilesTo(TileType.SHALLOW_OCEAN))
			if (tile.getBaseTileType() == TileType.OCEAN && rnd.nextInt(8) == 0)
				tile.setTileType(TileType.SHALLOW_OCEAN);

		for (Tile tile : tileIndexer.getAdjacentRiverTiles()) {
			if (tile.getBaseTileType() == TileType.DESERT)
				tile.setTileType(TileType.FLOODPLAINS);
		}

	}

	private ArrayList<GenerationValue> generateRandomStencilChunk() {
		clearMap();

		ArrayList<GenerationValue> chunk = new ArrayList<>();
		Random rnd = new Random();

		// FIXME: These values need to chagne depedning on the map size.
		int xPadding = 4;
		int yPadding = 8;
		int minX = xPadding;
		int minY = yPadding;
		int maxX = GameMap.WIDTH - xPadding;
		int maxY = GameMap.HEIGHT - yPadding;
		int maxPathLength = 64;

		int rndX = rnd.nextInt(maxX - minX + 1) + minX;
		int rndY = rnd.nextInt(maxY - minY + 1) + minY;

		int pathLength = rnd.nextInt(maxPathLength - 1 + 1) + 1;

		for (int i = 0; i < pathLength; i++) {

			GenerationValue[] adjGenerationValues = stencilMap[rndX][rndY].getAdjGenerationValues();

			for (int j = 0; j < 5; j++) {
				// Set adj tiles execpt the last? to 1
				if (adjGenerationValues[j] == null)
					break;
				adjGenerationValues[j].setValue(1);
				chunk.add(adjGenerationValues[j]);
			}

			int nextAdjValueIndex = rnd.nextInt(6);

			if (adjGenerationValues[nextAdjValueIndex] == null)
				return chunk;

			rndX = adjGenerationValues[nextAdjValueIndex].getGridX();
			rndY = adjGenerationValues[nextAdjValueIndex].getGridY();

			// FIXME: I want these values to change depending on the map size
			if (outsidePaddingArea(rndX, rndY))
				return chunk;

		}

		return chunk;
	}

	private boolean outsidePaddingArea(int x, int y) {
		return (x < 3 || y < 3 || x > WIDTH - 4 || y > HEIGHT - 5);
	}

	private int getTotalGeographyLandMass() {
		int total = 0;
		for (int x = 0; x < GameMap.WIDTH; x++) {
			for (int y = 0; y < GameMap.HEIGHT; y++) {
				if (geographyMap[x][y].getValue() != 0)
					total++;
			}
		}

		return total;
	}

	private void clearMap() {
		for (int x = 0; x < GameMap.WIDTH; x++) {
			for (int y = 0; y < GameMap.HEIGHT; y++) {
				stencilMap[x][y].setValue(0);
			}
		}
	}

	private void generateResource(TileType tileType, int amount, TileType... exclusiveTiles) {
		Random rnd = new Random();
		while (amount > 0) {
			for (Rectangle rect : mapPartition) {
				while (true) {
					int rndX = rnd.nextInt((int) (rect.getX() + rect.getWidth() - 1) - (int) rect.getX() + 1)
							+ (int) rect.getX();

					int rndY = rnd.nextInt((int) (rect.getY() + rect.getHeight() - 1) - (int) rect.getY() + 1)
							+ (int) rect.getY();
					Tile tile = tiles[rndX][rndY];

					boolean isExclusiveTile = false;
					boolean containsResource = false;
					for (TileTypeWrapper tileWrapper : tile.getTileTypeWrappers())
						if (tileWrapper.getTileType().hasProperty(TileProperty.RESOURCE)) {
							containsResource = true;
						}

					if (!containsResource) {
						for (TileType exclusiveType : exclusiveTiles) {
							if (exclusiveType.getTileLayer() == TileLayer.BASE) {
								// If the exclusiveType is a base layer, make sure no other layers are there.
								isExclusiveTile = tile.onlyHasTileType(exclusiveType);
							} else if (exclusiveType.getTileLayer().ordinal() > 0)
								isExclusiveTile = tile.containsTileType(exclusiveType);

							if (isExclusiveTile)
								break;
						}
					}

					if (exclusiveTiles.length < 1 || isExclusiveTile) {
						tile.setTileType(tileType);
						amount--;
						break;
					}
				}
			}
		}
	}

	public Tile getTileFromLocation(float x, float y) {
		float width = tiles[0][0].getWidth();
		float height = tiles[0][0].getHeight();

		int gridY = (int) (y / height);
		int gridX;

		if (gridY % 2 == 0) {
			gridX = (int) (x / width);
		} else
			gridX = (int) ((x - (width / 2)) / width);

		if (gridX < 0 || gridX > WIDTH - 1 || gridY < 0 || gridY > HEIGHT - 1)
			return null;

		Tile nearTile = tiles[gridX][gridY];
		Tile[] tiles = nearTile.getAdjTiles();

		// Check if the mouse is inside the surrounding tiles.
		Vector2 mouseVector = new Vector2(x, y);
		Vector2 mouseExtremeVector = new Vector2(x + 1000, y);

		// FIXME: I kind of want to add the near tile to the adjTile Array. This is
		// redundant.

		Tile locatedTile = null;

		if (MathHelper.isInsidePolygon(nearTile.getVectors(), mouseVector, mouseExtremeVector)) {
			locatedTile = nearTile;
		} else
			for (Tile tile : tiles) {
				if (tile == null)
					continue;
				if (MathHelper.isInsidePolygon(tile.getVectors(), mouseVector, mouseExtremeVector)) {
					locatedTile = tile;
					break;
				}
			}

		return locatedTile;
	}

	public Tile[][] getTiles() {
		return tiles;
	}

	public ArrayList<Rectangle> getMapPartition() {
		return mapPartition;
	}

	private void splitMapPartition() {
		int playerSize = Server.getInstance().getPlayers().size();
		if (playerSize < 2) {
			mapPartition.add(new Rectangle(0, 0, WIDTH, HEIGHT));
			return;
		}

		int numRects = (playerSize % 2 == 0) ? playerSize : playerSize + 1;

		int columns = (int) Math.ceil(Math.sqrt(numRects));
		int fullRows = numRects / columns;

		int width = WIDTH / columns;
		int height = HEIGHT / fullRows;

		for (int y = 0; y < fullRows; ++y)
			for (int x = 0; x < columns; ++x)
				mapPartition.add(new Rectangle(x * width, y * height, width, height));
	}

	// FIXME: Rename to adjecent Tiles?
	private void initializeEdges() {
		// n^2 * 6
		for (int x = 0; x < WIDTH; x++) {
			for (int y = 0; y < HEIGHT; y++) {
				// Set the 6 edges of the hexagon.

				int[][] edgeAxis;
				if (y % 2 == 0)
					edgeAxis = evenEdgeAxis;
				else
					edgeAxis = oddEdgeAxis;

				for (int i = 0; i < edgeAxis.length; i++) {

					int edgeX = x + edgeAxis[i][0];
					int edgeY = y + edgeAxis[i][1];

					if (edgeX == -1 || edgeY == -1 || edgeX > WIDTH - 1 || edgeY > HEIGHT - 1) {
						tiles[x][y].setEdge(i, null);
						continue;
					}

					tiles[x][y].setEdge(i, tiles[x + edgeAxis[i][0]][y + edgeAxis[i][1]]);
					stencilMap[x][y].setEdge(i, stencilMap[x + edgeAxis[i][0]][y + edgeAxis[i][1]]);
					geographyMap[x][y].setEdge(i, geographyMap[x + edgeAxis[i][0]][y + edgeAxis[i][1]]);
				}
			}
		}
	}

	private boolean isHill(Tile tile) {
		// FIXME: Not ideal code
		return tile.getBaseTileType() == TileType.GRASS_HILL || tile.getBaseTileType() == TileType.PLAINS_HILL
				|| tile.getBaseTileType() == TileType.DESERT_HILL || tile.getBaseTileType() == TileType.TUNDRA_HILL;
	}

	private boolean containsVector(Tile tile, Vector2 vector) {
		for (Vector2 v : tile.getVectors()) {
			// FIXME: We shouldn't have to round out our vectors here
			if (roundedEquals(v, vector))
				return true;
		}
		return false;
	}

	private ArrayList<Vector2> getSharedVectors(Tile tile, int side, Tile otherTile) {
		// TODO: Verify this works.
		ArrayList<Vector2> sharedVectors = new ArrayList<>();

		// Get the 2 vectors from the side.
		Vector2 firstVector = tile.getVectors()[side - 1 < 0 ? 5 : side - 1];
		Vector2 lastVector = tile.getVectors()[side];

		for (Vector2 vector : otherTile.getVectors())
			if (firstVector.equals(vector) || lastVector.equals(vector))
				sharedVectors.add(vector);

		return sharedVectors;
	}

	private boolean roundedEquals(Vector2 v1, Vector2 v2) {
		if ((int) v1.x == (int) v2.x && (int) v1.y == (int) v2.y)
			return true;

		return false;
	}

	public TileIndexer getTileIndexer() {
		return tileIndexer;
	}
}