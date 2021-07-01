package me.rhin.openciv.server.game.map.tile.improvement;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.Player;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.server.game.map.tile.TileType;
import me.rhin.openciv.shared.packet.type.SetTileTypePacket;

public class TileImprovement {

	protected Tile tile;
	protected TileType tileType;
	protected boolean finished;
	private int maxTurns;
	private int workedTurns;

	// FIXME: Just make this an interface or abstact class.
	public TileImprovement(TileType tileType, int maxTurns) {
		this.tileType = tileType;
		this.maxTurns = maxTurns;
	}

	public void setTile(Tile tile) {
		this.tile = tile;
	}

	public void addTurnsWorked() {
		workedTurns++;
	}

	public int getTurnsWorked() {
		return workedTurns;
	}

	public int getMaxTurns() {
		return maxTurns;
	}

	public TileType getTileType() {
		return tileType;
	}

	public void setFinished(boolean finished) {
		this.finished = finished;
	}

	public boolean isFinished() {
		return finished;
	}

	public String getName() {
		return tileType.name().toLowerCase();
	}

	public void improveTile() {
		// FIXME: Do we properly change the tiletype?
		tile.setTileType(tileType);
		finished = true;
		SetTileTypePacket setTileTypePacket = new SetTileTypePacket();
		setTileTypePacket.setTile(tileType.name(), tile.getGridX(), tile.getGridY());

		Json json = new Json();
		for (Player player : Server.getInstance().getPlayers())
			player.getConn().send(json.toJson(setTileTypePacket));
	}
}
