package me.rhin.openciv.game.city.building.type;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.city.building.Building;
import me.rhin.openciv.game.map.tile.Tile;
import me.rhin.openciv.game.map.tile.TileType;
import me.rhin.openciv.game.research.type.CalendarTech;
import me.rhin.openciv.shared.stat.Stat;
import me.rhin.openciv.shared.stat.StatLine;

public class Stoneworks extends Building {

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
	public float getBuildingProductionCost() {
		return 75;
	}

	@Override
	public float getGoldCost() {
		return 200;
	}

	@Override
	public String getName() {
		return "Stoneworks";
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
	public TextureEnum getTexture() {
		return TextureEnum.BUILDING_STONEWORKS;
	}

	@Override
	public String getDesc() {
		return "Improves the output of quarries\n\n+5 Morale\n+1 Production\n+1 Production for each improved\nquarry tile.";
	}
}
