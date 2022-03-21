package me.rhin.openciv.game.city.building.type;

import java.util.Arrays;
import java.util.List;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.city.building.Building;
import me.rhin.openciv.game.map.tile.Tile;
import me.rhin.openciv.game.map.tile.TileType.TileProperty;
import me.rhin.openciv.game.research.type.OpticsTech;
import me.rhin.openciv.shared.stat.Stat;
import me.rhin.openciv.shared.stat.StatLine;

public class Lighthouse extends Building {

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
	public float getBuildingProductionCost() {
		return 75;
	}

	@Override
	public float getGoldCost() {
		return 150;
	}

	@Override
	public String getName() {
		return "Lighthouse";
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
	public TextureEnum getTexture() {
		return TextureEnum.BUILDING_LIGHTHOUSE;
	}

	@Override
	public List<String> getDesc() {
		return Arrays.asList("Bonus sea building. Can only be constructed in coastal cities.",
				"+1 Food from ocean tiles", "+1 Food from fish worked by the city",
				"+1 Production for every sea resource worked");
	}
}
