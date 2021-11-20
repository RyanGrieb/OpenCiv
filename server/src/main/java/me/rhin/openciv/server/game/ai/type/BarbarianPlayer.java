package me.rhin.openciv.server.game.ai.type;

import java.util.ArrayList;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.AbstractPlayer;
import me.rhin.openciv.server.game.Player;
import me.rhin.openciv.server.game.ai.AIPlayer;
import me.rhin.openciv.server.game.ai.unit.BarbarianWarriorAI;
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

		for(AbstractPlayer player : Server.getInstance().getAbstractPlayers()) {
			System.out.println(player.getName());
		}
		
		diplomacy.declarWarAll();
		
		Server.getInstance().getEventManager().addListener(NextTurnListener.class, this);
	}

	@Override
	public void onNextTurn() {
		if (turnsUntilSpawn < 1) {

			ArrayList<AddUnitPacket> addUnitPackets = new ArrayList<>();
			Json json = new Json();

			for (Tile tile : campTiles) {

				if (tile.getUnits().size() > 0)
					continue;

				Unit unit = new WarriorUnit(this, tile);
				unit.addAIBehavior(new BarbarianWarriorAI(unit, tile));
				tile.addUnit(unit);
				addOwnedUnit(unit);

				AddUnitPacket addUnitPacket = new AddUnitPacket();
				String unitName = unit.getClass().getSimpleName().substring(0,
						unit.getClass().getSimpleName().indexOf("Unit"));
				addUnitPacket.setUnit(unit.getPlayerOwner().getName(), unitName, unit.getID(), tile.getGridX(),
						tile.getGridY());

				addUnitPackets.add(addUnitPacket);
			}

			for (AddUnitPacket packet : addUnitPackets) {
				for (Player player : Server.getInstance().getPlayers()) {
					player.sendPacket(json.toJson(packet));
				}
			}

			turnsUntilSpawn = spawnTurnLength;
		}

		// Have all units choose a random tile further from the origin camp

		turnsUntilSpawn--;
	}

	public void addCampTile(Tile tile) {
		campTiles.add(tile);
	}

	@Override
	public String getName() {
		return "Barbarians";
	}


}
