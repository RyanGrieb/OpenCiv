package me.rhin.openciv.server.game.city.building.type;

import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.city.building.Building;
import me.rhin.openciv.server.game.city.building.IncreaseTileStatlineBuilding;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.server.game.map.tile.TileType;
import me.rhin.openciv.server.game.map.tile.TileType.TileProperty;
import me.rhin.openciv.server.game.research.type.OpticsTech;
import me.rhin.openciv.shared.stat.Stat;
import me.rhin.openciv.shared.stat.StatLine;

public class Lighthouse extends Building implements IncreaseTileStatlineBuilding {

	public Lighthouse(City city) {
		super(city);
	}

	@Override
	public StatLine getStatLine() {
		StatLine statLine = new StatLine();

		statLine.addValue(Stat.FOOD_GAIN, 1);
		statLine.addValue(Stat.MAINTENANCE, 1);

		return statLine;
	}

	@Override
	public StatLine getAddedStatline(Tile tile) {
		StatLine statLine = new StatLine();

		if (tile.containsTileProperty(TileProperty.WATER))
			statLine.addValue(Stat.FOOD_GAIN, 1);

		if (tile.containsTileType(TileType.FISH_IMPROVED))
			statLine.addValue(Stat.FOOD_GAIN, 1);

		if (tile.containsTileType(TileType.FISH_IMPROVED) || tile.containsTileType(TileType.CRABS_IMPROVED))
			statLine.addValue(Stat.PRODUCTION_GAIN, 1);

		return statLine;
	}

	@Override
	public float getBuildingProductionCost() {
		return 75;
	}

	@Override
	public float getGoldCost() {
		return 150;
	}

	@Override
	public boolean meetsProductionRequirements() {
		boolean nearWater = false;
		for (Tile tile : city.getTile().getAdjTiles())
			if (tile.containsTileProperty(TileProperty.WATER))
				nearWater = true;

		return city.getPlayerOwner().getResearchTree().hasResearched(OpticsTech.class) && nearWater;
	}

	@Override
	public String getName() {
		return "Lighthouse";
	}
}
