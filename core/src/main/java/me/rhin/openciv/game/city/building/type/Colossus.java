package me.rhin.openciv.game.city.building.type;

import java.util.Arrays;
import java.util.List;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.city.building.Building;
import me.rhin.openciv.game.city.wonders.Wonder;
import me.rhin.openciv.game.map.tile.Tile;
import me.rhin.openciv.game.map.tile.TileType.TileProperty;
import me.rhin.openciv.game.research.type.IronWorkingTech;
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
	public TextureEnum getTexture() {
		return TextureEnum.BUILDING_COLOSSUS;
	}

	@Override
	public boolean meetsProductionRequirements() {

		boolean nearWater = false;
		for (Tile tile : city.getTile().getAdjTiles())
			if (tile.containsTileProperty(TileProperty.WATER))
				nearWater = true;

		return city.getPlayerOwner().getResearchTree().hasResearched(IronWorkingTech.class)
				&& !Civilization.getInstance().getGame().getWonders().isBuilt(getClass()) && nearWater;
	}

	@Override
	public List<String> getDesc() {
		return Arrays.asList("A bronze statue of Helios, the Greek God of the Sun. Must be built on the cost",
				"+1 Heritage", "+5 Gold", "+1 Trade Slot", "+25% Gold from trade routes");
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
