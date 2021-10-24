package me.rhin.openciv.game.city.building.type;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.city.building.Building;
import me.rhin.openciv.game.map.tile.Tile;
import me.rhin.openciv.game.map.tile.TileType.TileProperty;
import me.rhin.openciv.game.research.type.OpticsTech;
import me.rhin.openciv.shared.stat.Stat;

public class Lighthouse extends Building {

	public Lighthouse(City city) {
		super(city);

		this.statLine.addValue(Stat.FOOD_GAIN, 1);
		this.statLine.addValue(Stat.MAINTENANCE, 1);
	}

	@Override
	public void onBuilt() {
		super.onBuilt();
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
	public String getDesc() {
		return "+1 Food for each worked ocean\ntile.\n+1 Food for every worked fish\ntile.\n+1 Production for every sea\nresource worked.";
	}
}
