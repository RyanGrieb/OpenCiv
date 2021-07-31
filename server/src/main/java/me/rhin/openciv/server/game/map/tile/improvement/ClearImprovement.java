package me.rhin.openciv.server.game.map.tile.improvement;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.Player;
import me.rhin.openciv.server.game.map.tile.TileType;
import me.rhin.openciv.server.game.research.Technology;
import me.rhin.openciv.server.game.research.type.BronzeWorkingTech;
import me.rhin.openciv.shared.packet.type.RemoveTileTypePacket;

public class ClearImprovement extends TileImprovement {

	public ClearImprovement(int turns) {
		super(TileType.JUNGLE, turns);
	}

	@Override
	public void improveTile() {
		// Remove the forest
		tile.removeTileType(TileType.JUNGLE);

		finished = true;

		// Set improvement to null, since this isn't an improvement.
		tile.setTileImprovement(null);

		// TODO: Remove tileType?
		RemoveTileTypePacket removeTileTypePacket = new RemoveTileTypePacket();
		removeTileTypePacket.setTile(tileType.name(), tile.getGridX(), tile.getGridY());

		Json json = new Json();
		for (Player player : Server.getInstance().getPlayers())
			player.getConn().send(json.toJson(removeTileTypePacket));
	}

	@Override
	public Class<? extends Technology> getRequiredTech() {
		return BronzeWorkingTech.class;
	}

	@Override
	public String getName() {
		return "clear";
	}

}