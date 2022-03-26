package me.rhin.openciv.server.game.city.building.type;

import java.util.ArrayList;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.Player;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.city.building.Building;
import me.rhin.openciv.server.game.city.wonders.Wonder;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.server.game.research.type.ConstructionTech;
import me.rhin.openciv.server.game.unit.Unit;
import me.rhin.openciv.server.game.unit.UnitItem.UnitType;
import me.rhin.openciv.shared.packet.type.AddUnitPacket;
import me.rhin.openciv.shared.stat.Stat;
import me.rhin.openciv.shared.stat.StatLine;

public class TerracottaArmy extends Building implements Wonder {

	public TerracottaArmy(City city) {
		super(city);
	}

	@Override
	public void create() {
		super.create();

		ArrayList<String> copiedUnits = new ArrayList<>();

		for (Unit unit : new ArrayList<Unit>(city.getPlayerOwner().getOwnedUnits())) {
			if (copiedUnits.contains(unit.getName()) || unit.getUnitTypes().contains(UnitType.SUPPORT))
				continue;

			for (Tile tile : unit.getTile().getAdjTiles()) {
				if (unit.canStandOnTile(tile)) {

					Unit copyUnit = unit.copy();
					copyUnit.setStandingTile(tile);
					tile.addUnit(copyUnit);

					copiedUnits.add(copyUnit.getName());

					AddUnitPacket addUnitPacket = new AddUnitPacket();
					addUnitPacket.setUnit(copyUnit.getPlayerOwner().getName(), copyUnit.getName(), copyUnit.getID(),
							tile.getGridX(), tile.getGridY());

					Json json = new Json();
					for (Player player : Server.getInstance().getPlayers())
						player.sendPacket(json.toJson(addUnitPacket));

					break;
				}
			}

		}
	}

	@Override
	public boolean meetsProductionRequirements() {
		return city.getPlayerOwner().getResearchTree().hasResearched(ConstructionTech.class)
				&& !Server.getInstance().getInGameState().getWonders().isBuilt(getClass());
	}

	@Override
	public float getGoldCost() {
		return -1;
	}

	@Override
	public StatLine getStatLine() {
		StatLine statLine = new StatLine();

		statLine.addValue(Stat.HERITAGE_GAIN, 1);

		return statLine;
	}

	@Override
	public float getBuildingProductionCost() {
		return 200;
	}

	@Override
	public String getName() {
		return "Terracotta Army";
	}

}
