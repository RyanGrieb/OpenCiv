package me.rhin.openciv.game.city.building.type;

import java.util.Arrays;
import java.util.List;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.city.building.Building;
import me.rhin.openciv.game.map.tile.Tile;
import me.rhin.openciv.game.map.tile.TileType;
import me.rhin.openciv.game.production.ProductionItem;
import me.rhin.openciv.game.research.type.MetalCastingTech;
import me.rhin.openciv.game.unit.UnitItem;
import me.rhin.openciv.game.unit.UnitItem.UnitType;
import me.rhin.openciv.shared.stat.Stat;
import me.rhin.openciv.shared.stat.StatLine;

public class Forge extends Building {

	public Forge(City city) {
		super(city);
	}

	@Override
	public StatLine getStatLine() {
		StatLine statLine = new StatLine();

		statLine.addValue(Stat.MAINTENANCE, 1);

		return statLine;
	}

	@Override
	public void onBuilt() {
		super.onBuilt();

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
	public TextureEnum getTexture() {
		return TextureEnum.BUILDING_FORGE;
	}

	@Override
	public boolean meetsProductionRequirements() {

		boolean hasRequiredTiles = false;

		for (Tile tile : city.getTerritory())
			if (tile.containsTileType(TileType.IRON_IMPROVED))
				hasRequiredTiles = true;

		return city.getPlayerOwner().getResearchTree().hasResearched(MetalCastingTech.class) && hasRequiredTiles;
	}

	@Override
	public List<String> getDesc() {
		return Arrays.asList(
				"A building containing a furnace capable of generating the temperatures necessary to melt and shape iron into whatever you can imagine.",
				"Requires an improved iron tile.", "+15% Production towards land units",
				"+1 Production for every improved iron tile", "+1 Maintenance");
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
}
