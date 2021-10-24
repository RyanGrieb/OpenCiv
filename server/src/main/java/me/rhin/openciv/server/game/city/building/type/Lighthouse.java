package me.rhin.openciv.server.game.city.building.type;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.city.building.Building;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.server.game.map.tile.TileType.TileProperty;
import me.rhin.openciv.server.game.research.type.OpticsTech;
import me.rhin.openciv.server.listener.TerritoryGrowListener;
import me.rhin.openciv.shared.stat.Stat;

public class Lighthouse extends Building implements TerritoryGrowListener {

	public Lighthouse(City city) {
		super(city);

		this.statLine.addValue(Stat.FOOD_GAIN, 1);

		Server.getInstance().getEventManager().addListener(TerritoryGrowListener.class, this);
	}

	@Override
	public void onTerritoryGrow(City city, Tile territory) {
		if (territory.containsTileProperty(TileProperty.WATER))
			territory.getStatLine().addValue(Stat.FOOD_GAIN, 1);
	}

	@Override
	public void create() {
		super.create();

		for (Tile tile : city.getTerritory())
			if (tile.containsTileProperty(TileProperty.WATER))
				tile.getStatLine().addValue(Stat.FOOD_GAIN, 1);
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
