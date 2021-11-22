package me.rhin.openciv.server.game.city.building.type;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.city.building.Building;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.server.game.map.tile.TileType;
import me.rhin.openciv.server.game.production.ProductionItem;
import me.rhin.openciv.server.game.research.type.MetalCastingTech;
import me.rhin.openciv.server.game.unit.UnitItem;
import me.rhin.openciv.server.game.unit.UnitItem.UnitType;
import me.rhin.openciv.server.listener.TerritoryGrowListener;
import me.rhin.openciv.shared.stat.Stat;

public class Forge extends Building implements TerritoryGrowListener {

	public Forge(City city) {
		super(city);

		this.statLine.addValue(Stat.MAINTENANCE, 1);

		Server.getInstance().getEventManager().addListener(TerritoryGrowListener.class, this);
	}

	@Override
	public void create() {
		super.create();

		for (Tile tile : city.getTerritory()) {
			if (isRequiredTile(tile))
				city.getStatLine().addValue(Stat.PRODUCTION_GAIN, 1);
		}

		for (ProductionItem item : city.getProducibleItemManager().getPossibleItems().values()) {
			if (item instanceof UnitItem) {
				UnitItem unitItem = (UnitItem) item;
				if (!unitItem.getUnitItemTypes().contains(UnitType.NAVAL)
						&& !unitItem.getUnitItemTypes().contains(UnitType.SUPPORT)) {
					item.setProductionModifier(-0.15F);
				}
			}
		}
	}

	@Override
	public void onTerritoryGrow(City city, Tile territory) {
		if (!city.equals(this.city))
			return;

		if (!city.getBuildings().contains(this))
			return;

		if (isRequiredTile(territory))
			city.getStatLine().addValue(Stat.PRODUCTION_GAIN, 1);
	}

	@Override
	public boolean meetsProductionRequirements() {

		boolean hasRequiredTiles = false;

		for (Tile tile : city.getTerritory())
			if (isRequiredTile(tile))
				hasRequiredTiles = true;

		return city.getPlayerOwner().getResearchTree().hasResearched(MetalCastingTech.class) && hasRequiredTiles;
	}

	@Override
	public float getGoldCost() {
		return 250;
	}

	@Override
	public float getBuildingProductionCost() {
		return 120;
	}

	@Override
	public String getName() {
		return "Forge";
	}

	private boolean isRequiredTile(Tile tile) {
		return tile.containsTileType(TileType.IRON_IMPROVED);
	}
}
