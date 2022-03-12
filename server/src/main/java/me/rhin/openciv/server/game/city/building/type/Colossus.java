package me.rhin.openciv.server.game.city.building.type;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.city.building.Building;
import me.rhin.openciv.server.game.city.wonders.Wonder;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.server.game.map.tile.TileType.TileProperty;
import me.rhin.openciv.server.game.research.type.IronWorkingTech;
import me.rhin.openciv.shared.stat.Stat;
import me.rhin.openciv.shared.stat.StatLine;

public class Colossus extends Building implements Wonder {

	public Colossus(City city) {
		super(city);
	}

	@Override
	public StatLine getStatLine() {
		StatLine statLine = new StatLine();

		statLine.addValue(Stat.HERITAGE_GAIN, 1);
		statLine.addValue(Stat.GOLD_GAIN, 5);

		return statLine;
	}

	@Override
	public void create() {
		super.create();

		city.getStatLine().addModifier(Stat.TRADE_GOLD_MODIFIER, 0.5F);
		city.getPlayerOwner().getStatLine().addValue(Stat.MAX_TRADE_ROUTES, 1);
		city.getPlayerOwner().updateOwnedStatlines(false);
	}

	@Override
	public boolean meetsProductionRequirements() {

		boolean nearWater = false;
		for (Tile tile : city.getTile().getAdjTiles())
			if (tile.containsTileProperty(TileProperty.WATER))
				nearWater = true;

		return city.getPlayerOwner().getResearchTree().hasResearched(IronWorkingTech.class)
				&& !Server.getInstance().getInGameState().getWonders().isBuilt(getClass()) && nearWater;
	}

	@Override
	public float getGoldCost() {
		return -1;
	}

	@Override
	public float getBuildingProductionCost() {
		return 185;
	}

	@Override
	public String getName() {
		return "Colossus";
	}

}
