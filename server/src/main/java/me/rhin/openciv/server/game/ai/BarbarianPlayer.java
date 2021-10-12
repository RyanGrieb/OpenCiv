package me.rhin.openciv.server.game.ai;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import org.java_websocket.WebSocket;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.Player;
import me.rhin.openciv.server.game.civilization.type.Barbarians;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.server.game.unit.Unit;
import me.rhin.openciv.server.game.unit.type.Warrior.WarriorUnit;
import me.rhin.openciv.server.listener.NextTurnListener;
import me.rhin.openciv.shared.packet.type.AddUnitPacket;

public class BarbarianPlayer extends AIPlayer implements NextTurnListener {

	private ArrayList<Tile> campTiles;
	private int turnsUntilSpawn;
	private int spawnTurnLength;

	public BarbarianPlayer() {

		this.campTiles = new ArrayList<>();
		this.turnsUntilSpawn = 0;
		this.spawnTurnLength = 1000;
		this.civilization = new Barbarians(this);

		Server.getInstance().getEventManager().addListener(NextTurnListener.class, this);
	}

	@Override
	public void onNextTurn() {
		if (turnsUntilSpawn < 1) {

			ArrayList<AddUnitPacket> addUnitPackets = new ArrayList<>();
			Json json = new Json();

			for (Tile tile : campTiles) {

				Unit unit = new WarriorUnit(this, tile);
				tile.addUnit(unit);

				AddUnitPacket addUnitPacket = new AddUnitPacket();
				String unitName = unit.getClass().getSimpleName().substring(0,
						unit.getClass().getSimpleName().indexOf("Unit"));
				addUnitPacket.setUnit(unit.getPlayerOwner().getName(), unitName, unit.getID(), tile.getGridX(),
						tile.getGridY());

				addUnitPackets.add(addUnitPacket);
			}

			for (AddUnitPacket packet : addUnitPackets) {
				for (Player player : Server.getInstance().getPlayers()) {
					player.getConn().send(json.toJson(packet));
				}
			}

			turnsUntilSpawn = spawnTurnLength;
		}

		turnsUntilSpawn--;
	}

	@Override
	public List<AIProperties> getProperties() {
		return Arrays.asList(AIProperties.BARBARIAN);
	}

	public void addCampTile(Tile tile) {
		campTiles.add(tile);
	}

	@Override
	public String getName() {
		return "Barbarians";
	}

	@Override
	public WebSocket getConn() {
		return null;
	}

}
