package me.rhin.openciv.game.city.building.type;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.city.building.Building;
import me.rhin.openciv.game.map.tile.Tile;
import me.rhin.openciv.game.map.tile.TileType;
import me.rhin.openciv.game.production.ProductionItem;
import me.rhin.openciv.game.research.type.HorsebackRidingTech;
import me.rhin.openciv.game.unit.UnitItem;
import me.rhin.openciv.game.unit.UnitItem.UnitType;
import me.rhin.openciv.shared.stat.Stat;

public class Stables extends Building {

	public Stables(City city) {
		super(city);
		
		this.statLine.addValue(Stat.MAINTENANCE, 1);
	}

	@Override
	public void onBuilt() {
		super.onBuilt();

		for (ProductionItem item : city.getProducibleItemManager().getPossibleItems().values()) {
			if (item instanceof UnitItem) {
				UnitItem unitItem = (UnitItem) item;
				if (unitItem.getUnitItemTypes().contains(UnitType.MOUNTED)) {
					item.setProductionModifier(-0.15F);
				}
			}
		}
	}

	@Override
	public TextureEnum getTexture() {
		return TextureEnum.TILE_HORSES_IMPROVED;
	}

	@Override
	public boolean meetsProductionRequirements() {

		boolean hasRequiredTiles = false;

		for (Tile tile : city.getTerritory())
			if (tile.containsTileType(TileType.HORSES, TileType.HORSES_IMPROVED, TileType.CATTLE,
					TileType.CATTLE_IMPROVED, TileType.SHEEP, TileType.SHEEP_IMPROVED))
				hasRequiredTiles = true;

		return city.getPlayerOwner().getResearchTree().hasResearched(HorsebackRidingTech.class) && hasRequiredTiles;
	}

	@Override
	public String getDesc() {
		return "Improves production from animals.\n\n15% Production towards mounted\nunits in the city.+1 Production\nfor every horse, sheep, and\ncattle tiles.";
	}

	@Override
	public float getGoldCost() {
		return 250;
	}

	@Override
	public float getBuildingProductionCost() {
		return 100;
	}

	@Override
	public String getName() {
		return "Stables";
	}

}
