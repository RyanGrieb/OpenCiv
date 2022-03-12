package me.rhin.openciv.server.game.city.building.type;

import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.city.building.Building;
import me.rhin.openciv.server.game.city.building.IncreaseTileStatlineBuilding;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.server.game.map.tile.TileType;
import me.rhin.openciv.server.game.research.type.CalendarTech;
import me.rhin.openciv.shared.stat.Stat;
import me.rhin.openciv.shared.stat.StatLine;

public class Stoneworks extends Building implements IncreaseTileStatlineBuilding {

	public Stoneworks(City city) {
		super(city);

	}

	@Override
	public StatLine getStatLine() {
		StatLine statLine = new StatLine();

		statLine.addValue(Stat.PRODUCTION_GAIN, 1);
		statLine.addValue(Stat.MORALE_CITY, 5);
		statLine.addValue(Stat.MAINTENANCE, 1);

		return statLine;
	}

	@Override
	public StatLine getAddedStatline(Tile tile) {
		StatLine statLine = new StatLine();

		if (tile.containsTileType(TileType.MARBLE_IMPROVED)) {
			statLine.addValue(Stat.PRODUCTION_GAIN, 1);
			statLine.addValue(Stat.GOLD_GAIN, 1);
		}

		return statLine;
	}

	@Override
	public float getBuildingProductionCost() {
		return 75;
	}

	@Override
	public boolean meetsProductionRequirements() {
		boolean requiredTile = false;
		for (Tile tile : city.getTile().getAdjTiles())
			if (tile.containsTileType(TileType.MARBLE_IMPROVED))
				requiredTile = true;

		return city.getPlayerOwner().getResearchTree().hasResearched(CalendarTech.class) && requiredTile;
	}

	@Override
	public float getGoldCost() {
		return 200;
	}

	@Override
	public String getName() {
		return "Stoneworks";
	}

}
