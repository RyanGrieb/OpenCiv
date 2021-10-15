package me.rhin.openciv.server.game.city.building.type;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.Player;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.city.building.Building;
import me.rhin.openciv.server.game.city.wonders.Wonder;
import me.rhin.openciv.server.game.research.type.MasonryTech;
import me.rhin.openciv.server.game.unit.Unit;
import me.rhin.openciv.server.game.unit.type.Builder.BuilderUnit;
import me.rhin.openciv.shared.packet.type.AddUnitPacket;
import me.rhin.openciv.shared.stat.Stat;

public class GreatPyramids extends Building implements Wonder {

	public GreatPyramids(City city) {
		super(city);

		this.statLine.addValue(Stat.HERITAGE_GAIN, 1);
	}

	@Override
	public void create() {
		super.create();

		Server.getInstance().getGame().getWonders().setBuilt(getClass());

		for (int i = 0; i < 2; i++) {
			Unit unit = new BuilderUnit(city.getPlayerOwner(), city.getOriginTile());
			city.getOriginTile().addUnit(unit);

			AddUnitPacket addUnitPacket = new AddUnitPacket();
			addUnitPacket.setUnit(unit.getPlayerOwner().getName(), "Builder", unit.getID(),
					city.getOriginTile().getGridX(), city.getOriginTile().getGridY());

			Json json = new Json();
			for (Player player : Server.getInstance().getPlayers())
				player.sendPacket(json.toJson(addUnitPacket));
		}
	}

	@Override
	public float getBuildingProductionCost() {
		return 185;
	}

	@Override
	public float getGoldCost() {
		return -1;
	}

	@Override
	public boolean meetsProductionRequirements() {
		return city.getPlayerOwner().getResearchTree().hasResearched(MasonryTech.class)
				&& !Server.getInstance().getGame().getWonders().isBuilt(getClass());
	}

	@Override
	public String getName() {
		return "Great Pyramids";
	}
}
