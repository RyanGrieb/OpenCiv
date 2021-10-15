package me.rhin.openciv.server.game.ai.unit;

import java.util.ArrayList;

import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.shared.listener.Listener;

public abstract class UnitAI implements Listener {

	protected Tile removeSmallest(ArrayList<Tile> queue, float fScore[][]) {
		float smallest = Integer.MAX_VALUE;
		Tile smallestTile = null;
		for (Tile tile : queue) {
			if (fScore[tile.getGridX()][tile.getGridY()] < smallest) {
				smallest = fScore[tile.getGridX()][tile.getGridY()];
				smallestTile = tile;
			}
		}

		queue.remove(smallestTile);
		return smallestTile;
	}
	
}
