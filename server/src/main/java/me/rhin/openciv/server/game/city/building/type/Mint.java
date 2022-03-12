package me.rhin.openciv.server.game.city.building.type;

import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.city.building.Building;
import me.rhin.openciv.server.game.city.building.IncreaseTileStatlineBuilding;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.server.game.map.tile.TileType;
import me.rhin.openciv.server.game.research.type.CurrencyTech;
import me.rhin.openciv.shared.stat.Stat;
import me.rhin.openciv.shared.stat.StatLine;

public class Mint extends Building implements IncreaseTileStatlineBuilding {

	public Mint(City city) {
		super(city);
	}

	@Override
	public StatLine getStatLine() {
		StatLine statLine = new StatLine();

		return statLine;
	}
	
	@Override
	public StatLine getAddedStatline(Tile tile) {
		StatLine statLine = new StatLine();

		if (tile.containsTileType(TileType.SILVER_IMPROVED) || tile.containsTileType(TileType.GOLD_IMPROVED))
			statLine.addValue(Stat.GOLD_GAIN, 2);

		return statLine;
	}

	@Override
	public boolean meetsProductionRequirements() {
		boolean hasRequiredTiles = false;

		for (Tile tile : city.getTerritory())
			if (tile.containsTileType(TileType.SILVER_IMPROVED) || tile.containsTileType(TileType.GOLD_IMPROVED))
				hasRequiredTiles = true;

		return city.getPlayerOwner().getResearchTree().hasResearched(CurrencyTech.class) && hasRequiredTiles;
	}

	@Override
	public float getGoldCost() {
		return 200;
	}

	@Override
	public float getBuildingProductionCost() {
		return 100;
	}

	@Override
	public String getName() {
		return "Mint";
	}
}
