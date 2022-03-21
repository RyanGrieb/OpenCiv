package me.rhin.openciv.game.city.building.type;

import java.util.Arrays;
import java.util.List;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.city.building.Building;
import me.rhin.openciv.game.map.tile.Tile;
import me.rhin.openciv.game.map.tile.TileType;
import me.rhin.openciv.game.research.type.CurrencyTech;
import me.rhin.openciv.shared.stat.StatLine;

public class Mint extends Building {

	public Mint(City city) {
		super(city);
	}

	@Override
	public StatLine getStatLine() {
		StatLine statLine = new StatLine();

		return statLine;
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
	public List<String> getDesc() {
		return Arrays.asList(
				"Bonus building. Can only be constructed in cities with at least one improved Gold or Silver resource nearby.",
				"+2 Gold for each improved gold or silver tile.");
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
