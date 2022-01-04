package me.rhin.openciv.game.city.building.type;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.city.building.Building;
import me.rhin.openciv.game.city.wonders.Wonder;
import me.rhin.openciv.game.map.tile.Tile;
import me.rhin.openciv.game.map.tile.TileType.TileProperty;
import me.rhin.openciv.game.research.type.IronWorkingTech;
import me.rhin.openciv.shared.stat.Stat;

public class Colossus extends Building implements Wonder {

	public Colossus(City city) {
		super(city);
		
		this.statLine.addValue(Stat.HERITAGE_GAIN, 1);
		this.statLine.addValue(Stat.GOLD_GAIN, 5);
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
	public String getDesc() {
		return "A bronze statue of Helios,\nthe Greek God of the Sun.\nMust be built on the coast.\n\n\n+1 Heritage\n+5 Gold\n+1 Trade slot\n25% Gold from trade routes";
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
