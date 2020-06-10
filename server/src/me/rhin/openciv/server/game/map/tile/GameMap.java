package me.rhin.openciv.server.game.map.tile;

import java.util.LinkedList;
import java.util.Queue;
import java.util.Random;

import me.rhin.openciv.server.game.Game;
import me.rhin.openciv.server.game.map.Tile;

public class GameMap {
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