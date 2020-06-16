package me.rhin.openciv.server.game.map;

import java.util.ArrayList;
import java.util.LinkedList;
import java.util.Queue;
import java.util.Random;

import org.java_websocket.WebSocket;

import com.badlogic.gdx.math.Vector2;
import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.Game;
import me.rhin.openciv.server.game.Player;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.server.game.map.tile.TileType;
import me.rhin.openciv.server.game.unit.Unit;
import me.rhin.openciv.server.listener.MapRequestListener;
import me.rhin.openciv.shared.packet.type.AddUnitPacket;
import me.rhin.openciv.shared.packet.type.MapChunkPacket;
import me.rhin.openciv.shared.util.MathHelper;

public class GameMap implements MapRequestListener {
	public static final int WIDTH = 80; // Default: 104
	public static final int HEIGHT = 52; // Default: 64
	public static final int MAX_NODES = WIDTH * HEIGHT;
	private static final int CONTINENT_AMOUNT = 780; // Default: 780

	private Game game;
	private Tile[][] tiles;

	private int[][] oddEdgeAxis = { { 0, -1 }, { 1, -1 }, { 1, 0 }, { 1, 1 }, { 0, 1 }, { -1, 0 } };
	private int[][] evenEdgeAxis = { { -1, -1 }, { 0, -1 }, { 1, 0 }, { 0, 1 }, { -1, 1 }, { -1, 0 } };

	public GameMap(Game game) {
		this.game = game;

		tiles = new Tile[WIDTH][HEIGHT];
		for (int x = 0; x < WIDTH; x++) {
			for (int y = 0; y < HEIGHT; y++) {
				Tile tile = new Tile(this, TileType.OCEAN, x, y);
				tiles[x][y] = tile;
			}
		}

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

					int[][] tileChunk = new int[MapChunkPacket.CHUNK_SIZE][MapChunkPacket.CHUNK_SIZE];
					for (int i = 0; i < MapChunkPacket.CHUNK_SIZE; i++) {
						for (int j = 0; j < MapChunkPacket.CHUNK_SIZE; j++) {
							int tileX = x + i;
							int tileY = y + j;
							tileChunk[i][j] = tiles[tileX][tileY].getTileType().getID();

							for (Unit unit : tiles[tileX][tileY].getUnits()) {
								AddUnitPacket addUnitPacket = new AddUnitPacket();
								addUnitPacket.setUnit(unit.getPlayerOwner().getName(), unit.getClass().getSimpleName(),
										tileX, tileY);
								addUnitPackets.add(addUnitPacket);
							}

						}
					}
					mapChunkPacket.setTileCunk(tileChunk);
					mapChunkPacket.setChunkLocation(x, y);

					conn.send(json.toJson(mapChunkPacket));
				}
			}
		}

		for (AddUnitPacket packet : addUnitPackets)
			conn.send(json.toJson(packet));

	}

	public void resetTerrain() {
		for (int x = 0; x < WIDTH; x++) {
			for (int y = 0; y < HEIGHT; y++) {
				tiles[x][y].setTileType(TileType.OCEAN);
			}
		}
	}

	public void generateTerrain() {
		Random rnd = new Random();

		for (int i = 0; i < CONTINENT_AMOUNT; i++) {
			int randomX = rnd.nextInt(WIDTH - 1);
			int randomY = rnd.nextInt(HEIGHT - 1);

			Tile tile = tiles[randomX][randomY];
			growTile(tile, rnd.nextInt(rnd.nextInt(5 - 3 + 1) + 5));
		}

		// Remove 1 tile ponds
		for (int x = 0; x < WIDTH; x++) {
			for (int y = 0; y < HEIGHT; y++) {
				Tile tile = tiles[x][y];
				if (!tile.getTileType().equals(TileType.OCEAN))
					continue;

				boolean adjOceanTile = false;
				for (Tile adjTile : tile.getAdjTiles()) {
					if (adjTile == null)
						continue;

					if (adjTile.getTileType().equals(TileType.OCEAN))
						adjOceanTile = true;
				}

				if (!adjOceanTile) {
					tile.setTileType(TileType.GRASS);
					continue;
				}

				// TODO: Add shallow sea tiles
			}
		}

		// Generate mountain chains
		Queue<Tile> mountainTiles = new LinkedList<>();

		for (int i = 0; i < 25; i++) {
			Tile tile = tiles[rnd.nextInt(WIDTH - 1)][rnd.nextInt(HEIGHT - 1)];
			if (tile.getTileType().equals(TileType.GRASS)) {
				tile.setTileType(TileType.MOUNTAIN);
				mountainTiles.add(tile);
			} else
				i--;
		}

		while (!mountainTiles.isEmpty()) {
			Tile tile = mountainTiles.remove();
			for (Tile adjTile : tile.getAdjTiles()) {
				if (rnd.nextInt(6) > 3 && adjTile.getTileType().equals(TileType.GRASS)) {
					tile.setTileType(TileType.MOUNTAIN);
					mountainTiles.add(adjTile);
					break;
				}
			}
		}

		// Generate forests
		Queue<Tile> forestTiles = new LinkedList<>();

		for (int i = 0; i < 70; i++) {
			Tile tile = tiles[rnd.nextInt(WIDTH - 1)][rnd.nextInt(HEIGHT - 1)];
			if (tile.getTileType().equals(TileType.GRASS)) {
				tile.setTileType(TileType.FOREST);
				forestTiles.add(tile);
			} else
				i--;
		}

		while (!forestTiles.isEmpty()) {
			Tile tile = forestTiles.remove();
			for (Tile adjTile : tile.getAdjTiles()) {
				if (rnd.nextInt(20) > 15 && adjTile.getTileType().equals(TileType.GRASS)) {
					tile.setTileType(TileType.FOREST);
					forestTiles.add(adjTile);
				}
			}
		}

		// Generate hills
		Queue<Tile> hillTiles = new LinkedList<>();

		for (int i = 0; i < 120; i++) {
			Tile tile = tiles[rnd.nextInt(WIDTH - 1)][rnd.nextInt(HEIGHT - 1)];
			if (tile.getTileType().equals(TileType.GRASS)) {
				tile.setTileType(TileType.GRASS_HILL);
				hillTiles.add(tile);
			} else
				i--;
		}

		while (!hillTiles.isEmpty()) {
			Tile tile = hillTiles.remove();
			for (Tile adjTile : tile.getAdjTiles()) {
				if (rnd.nextInt(20) > 17 && adjTile.getTileType().equals(TileType.GRASS)) {
					tile.setTileType(TileType.GRASS_HILL);
					hillTiles.add(adjTile);
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

	public Game getGame() {
		return game;
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
				}
			}
		}
	}

	private void growTile(Tile tile, int amount) {
		Random rnd = new Random();

		// #1
		// Set the initial tile the grass
		if (HEIGHT - tile.getGridY() < 10 || tile.getGridY() < 10 || WIDTH - tile.getGridX() < 10
				|| tile.getGridX() < 10)
			return;

		tile.setTileType(TileType.GRASS);
		amount--;

		// #2

		int edgeFillIndex = 2;
		for (int edgeIndex = 0; edgeIndex < tile.getAdjTiles().length; edgeIndex++) {
			Tile currentTile = tile.getAdjTiles()[edgeIndex];
			for (int i = 0; i < amount; i++) {

				// FIXME: The chance of this happening should decrease as our growth increases.
				// Also, this chance increase the closer the x & y is to the center. (Should be
				// 100% of grass in the center of the map).
				if (rnd.nextInt(8) > 2)
					currentTile.setTileType(TileType.GRASS);

				// Fill in the gap created
				if (amount > 1) {
					int fillAmount = amount - 1;
					Tile currentFillTile = currentTile;
					for (int j = 0; j < fillAmount; j++) {
						if (rnd.nextInt(8) > 2)
							currentFillTile.getAdjTiles()[edgeFillIndex].setTileType(TileType.GRASS);
						currentFillTile = currentFillTile.getAdjTiles()[edgeFillIndex];
					}
				}

				currentTile = currentTile.getAdjTiles()[edgeIndex];
			}
			edgeFillIndex++;

			if (edgeFillIndex > 5)
				edgeFillIndex = 0;
		}
	}
}