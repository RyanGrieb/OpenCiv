package me.rhin.openciv.game.city.building.type;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.city.building.Building;
import me.rhin.openciv.game.map.tile.Tile;
import me.rhin.openciv.game.map.tile.TileType;
import me.rhin.openciv.game.research.type.CurrencyTech;

public class Mint extends Building {

	public Mint(City city) {
		super(city);
	}

	@Override
	public TextureEnum getTexture() {
		return TextureEnum.BUILDING_MINT;
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
	public String getDesc() {
		return "+2 Gold for each source of\ngold or silver";
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
