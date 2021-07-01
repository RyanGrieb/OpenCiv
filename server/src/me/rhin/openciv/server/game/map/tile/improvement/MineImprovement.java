package me.rhin.openciv.server.game.map.tile.improvement;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.Player;
import me.rhin.openciv.server.game.map.tile.TileType;
import me.rhin.openciv.shared.packet.type.SetTileTypePacket;

public class MineImprovement extends TileImprovement {

	public MineImprovement(TileType tileType, int turns) {
		super(tileType, turns);
	}

	@Override
	public void improveTile() {
		tile.setTileType(tileType);
		finished = true;
		SetTileTypePacket setTileTypePacket = new SetTileTypePacket();
		setTileTypePacket.setTile(tileType.name(), tile.getGridX(), tile.getGridY());

		Json json = new Json();
		for (Player player : Server.getInstance().getPlayers())
			player.getConn().send(json.toJson(setTileTypePacket));
	}

	@Override
	public String getName() {
		return "mine";
	}
}
