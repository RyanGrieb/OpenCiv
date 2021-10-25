package me.rhin.openciv.game.unit.type;

import java.util.Arrays;
import java.util.List;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.map.tile.Tile;
import me.rhin.openciv.game.map.tile.TileType;
import me.rhin.openciv.game.map.tile.TileType.TileProperty;
import me.rhin.openciv.game.research.type.SailingTech;
import me.rhin.openciv.game.unit.AbstractAction;
import me.rhin.openciv.game.unit.Unit;
import me.rhin.openciv.game.unit.UnitItem;
import me.rhin.openciv.game.unit.UnitParameter;
import me.rhin.openciv.listener.UnitActListener.UnitActEvent;
import me.rhin.openciv.shared.packet.type.WorkTilePacket;

public class WorkBoat extends UnitItem {

	public WorkBoat(City city) {
		super(city);
	}

	public static class WorkBoatUnit extends Unit {

		public WorkBoatUnit(UnitParameter unitParameter) {
			super(unitParameter, TextureEnum.UNIT_WORK_BOAT);
			this.canAttack = false;

			customActions.add(new FarmOceanAction(this));
		}

		@Override
		public float getMovementCost(Tile prevTile, Tile tile) {
			if (!tile.containsTileProperty(TileProperty.WATER))
				return 1000000;
			else
				return tile.getMovementCost(prevTile);
		}

		@Override
		public List<UnitType> getUnitTypes() {
			return Arrays.asList(UnitType.SUPPORT, UnitType.NAVAL);
		}
	}

	@Override
	protected float getUnitProductionCost() {
		return 30;
	}

	@Override
	public float getGoldCost() {
		return 150;
	}

	@Override
	public boolean meetsProductionRequirements() {
		return city.isCoastal() && city.getPlayerOwner().getResearchTree().hasResearched(SailingTech.class);
	}

	@Override
	public String getName() {
		return "Work Boat";
	}

	@Override
	public TextureEnum getTexture() {
		return TextureEnum.UNIT_WORK_BOAT;
	}

	@Override
	public String getDesc() {
		return "A naval builder. Can improve\nocean tiles.\nCan be captured by enemy units.";
	}

	@Override
	public List<UnitType> getUnitItemTypes() {
		return Arrays.asList(UnitType.SUPPORT, UnitType.NAVAL);
	}

	public static class FarmOceanAction extends AbstractAction {

		public FarmOceanAction(Unit unit) {
			super(unit);
		}

		@Override
		public boolean act(float delta) {
			unit.reduceMovement(2);

			WorkTilePacket packet = new WorkTilePacket();
			packet.setTile("farm_ocean", unit.getID(), unit.getStandingTile().getGridX(),
					unit.getStandingTile().getGridY());
			Civilization.getInstance().getNetworkManager().sendPacket(packet);

			Civilization.getInstance().getEventManager().fireEvent(new UnitActEvent(unit));

			unit.removeAction(this);
			return true;
		}

		@Override
		public boolean canAct() {
			Tile tile = unit.getStandingTile();
			boolean farmableTile = !tile.isImproved() && tile.getBaseTileType().hasProperty(TileProperty.OCEAN_FARMABLE)
					&& tile.getTerritory() != null
					&& tile.getTerritory().getPlayerOwner().equals(unit.getPlayerOwner());

			if (unit.getCurrentMovement() < 1 || !farmableTile) {
				return false;
			}

			return true;
		}

		@Override
		public String getName() {
			return "Farm Ocean";
		}

		@Override
		public TextureEnum getSprite() {
			return unit.getStandingTile().getBaseTileType().getTextureEnum();
		}
	}
}