package me.rhin.openciv.server.game.ai.behavior.nodes;

import java.util.ArrayList;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.AbstractPlayer;
import me.rhin.openciv.server.game.Player;
import me.rhin.openciv.server.game.ai.behavior.BehaviorResult;
import me.rhin.openciv.server.game.ai.behavior.BehaviorStatus;
import me.rhin.openciv.server.game.ai.behavior.PlayerNode;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.server.game.map.tile.TileType;
import me.rhin.openciv.server.game.unit.Unit;
import me.rhin.openciv.server.game.unit.type.Warrior.WarriorUnit;
import me.rhin.openciv.shared.packet.type.AddUnitPacket;

public class SpawnBarbariansNode extends PlayerNode {

	public SpawnBarbariansNode(AbstractPlayer player, String name) {
		super(player, name);
	}

	@Override
	public BehaviorResult tick() {
		// FIXME: This is inefficient, update tile indexer to support getting tiles of
		// tileType.

		ArrayList<AddUnitPacket> addUnitPackets = new ArrayList<>();

		for (int x = 0; x < Server.getInstance().getMap().getWidth(); x++) {
			for (int y = 0; y < Server.getInstance().getMap().getHeight(); y++) {
				Tile tile = Server.getInstance().getMap().getTiles()[x][y];

				if (tile.containsTileType(TileType.BARBARIAN_CAMP)) {

					Unit unit = new WarriorUnit(player, tile);
					tile.addUnit(unit);

					AddUnitPacket addUnitPacket = new AddUnitPacket();
					String unitName = unit.getClass().getSimpleName().substring(0,
							unit.getClass().getSimpleName().indexOf("Unit"));
					addUnitPacket.setUnit(unit.getPlayerOwner().getName(), unitName, unit.getID(), tile.getGridX(),
							tile.getGridY());

					addUnitPackets.add(addUnitPacket);
				}
			}
		}

		Json json = new Json();
		for (AddUnitPacket packet : addUnitPackets) {
			for (Player player : Server.getInstance().getPlayers()) {
				player.sendPacket(json.toJson(packet));
			}
		}

		return new BehaviorResult(BehaviorStatus.SUCCESS, this);
	}

}
