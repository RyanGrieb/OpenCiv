package me.rhin.openciv.server.game.map.tile.improvement;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.Player;
import me.rhin.openciv.server.game.map.tile.TileType;
import me.rhin.openciv.shared.packet.type.SetTileTypePacket;

public class RoadImprovement extends TileImprovement {

	public RoadImprovement() {
		super(TileType.ROAD, 3);
	}

	@Override
	public void improveTile() {
		// Set road type to tile & other variables.

		tile.setTileType(tileType);
		finished = true;

		// Note: We reset the tile improvement here since other improvements can be
		// built.
		tile.setTileImprovement(null);

		SetTileTypePacket setTileTypePacket = new SetTileTypePacket();
		setTileTypePacket.setTile(tileType.name(), tile.getGridX(), tile.getGridY());

		Json json = new Json();
		for (Player player : Server.getInstance().getPlayers())
			player.getConn().send(json.toJson(setTileTypePacket));
	}
}
