package me.rhin.openciv.server.game.city.building.type;

import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.city.building.Building;
import me.rhin.openciv.server.game.city.building.IncreaseTileStatlineBuilding;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.server.game.research.type.CalendarTech;
import me.rhin.openciv.shared.stat.Stat;
import me.rhin.openciv.shared.stat.StatLine;

public class Stoneworks extends Building implements IncreaseTileStatlineBuilding {

	public Stoneworks(City city) {
		super(city);

		this.statLine.addValue(Stat.PRODUCTION_GAIN, 1);
	}

	@Override
	public float getProductionCost() {
		return 75;
	}

	@Override
	public boolean meetsProductionRequirements() {
		return city.getPlayerOwner().getResearchTree().hasResearched(CalendarTech.class);
	}

	@Override
	public float getGoldCost() {
		return 215;
	}

	@Override
	public String getName() {
		return "Stoneworks";
	}

	@Override
	public StatLine getTileStatline(Tile tile) {
		StatLine statLine = new StatLine();
		
		//if(tile.getBaseTileType() == TileType.MARBLE || tile.getBaseTileType() == TileType.STONE)
		//statLine.addValue(Stat.PRODUCTION_GAIN, 1);
		
		return statLine;
	}

}
