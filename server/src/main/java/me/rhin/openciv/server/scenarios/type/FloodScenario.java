package me.rhin.openciv.server.scenarios.type;

import java.util.HashMap;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.Player;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.server.game.map.tile.TileType;
import me.rhin.openciv.server.game.map.tile.TileType.TileProperty;
import me.rhin.openciv.server.scenarios.Scenario;
import me.rhin.openciv.shared.listener.EventHandler;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.SetTileTypePacket;

public class FloodScenario extends Scenario implements Listener {

	@Override
	public void toggle() {
		// Change settings, ect.
		Server.getInstance().getEventManager().addListener(this);
	}

	@Override
	public boolean preGameOnly() {
		return false;
	}

	@EventHandler
	public void onNextTurn() {
		if (Server.getInstance().getInGameState().getCurrentTurn() < 1) {
			return;
		}
		HashMap<Tile, Tile> floodTiles = new HashMap<>();
		Json json = new Json();

		for (int x = 0; x < Server.getInstance().getMap().getWidth(); x++) {
			for (int y = 0; y < Server.getInstance().getMap().getHeight(); y++) {

				Tile tile = Server.getInstance().getMap().getTiles()[x][y];

				if (!tile.containsTileProperty(TileProperty.WATER)) {
					for (Tile adjTile : tile.getAdjTiles()) {
						if (adjTile == null)
							continue;

						if (adjTile.containsTileProperty(TileProperty.WATER)
								&& adjTile.getGeograpgyName().toLowerCase().contains("ocean")) {

							floodTiles.put(tile, adjTile);
						}
					}
				}

			}
		}

		for (Tile tile : floodTiles.keySet()) {
			// for (TileTypeWrapper type : tile.getTileTypeWrappers()) {
			// tile.removeTileType(type.getTileType());
			// }

			tile.setTileType(TileType.SHALLOW_OCEAN);
			tile.setGeographyName(floodTiles.get(tile).getGeograpgyName());
			SetTileTypePacket packet = new SetTileTypePacket();
			packet.setTile(TileType.SHALLOW_OCEAN.name(), tile.getGridX(), tile.getGridY());
			packet.setClearTileTypes(true);

			for (Player player : Server.getInstance().getPlayers()) {
				player.sendPacket(json.toJson(packet));
			}
		}
	}
}
