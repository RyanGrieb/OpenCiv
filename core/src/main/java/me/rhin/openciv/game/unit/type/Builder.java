package me.rhin.openciv.game.unit.type;

import java.util.Arrays;
import java.util.List;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.civilization.type.Rome;
import me.rhin.openciv.game.heritage.type.rome.DefensiveLogisticsHeritage;
import me.rhin.openciv.game.map.tile.ImprovementType;
import me.rhin.openciv.game.map.tile.Tile;
import me.rhin.openciv.game.map.tile.TileType;
import me.rhin.openciv.game.map.tile.TileType.TileProperty;
import me.rhin.openciv.game.research.type.AnimalHusbandryTech;
import me.rhin.openciv.game.research.type.BronzeWorkingTech;
import me.rhin.openciv.game.research.type.CalendarTech;
import me.rhin.openciv.game.research.type.MiningTech;
import me.rhin.openciv.game.research.type.WheelTech;
import me.rhin.openciv.game.unit.AbstractAction;
import me.rhin.openciv.game.unit.Unit;
import me.rhin.openciv.game.unit.UnitItem;
import me.rhin.openciv.game.unit.UnitParameter;
import me.rhin.openciv.listener.RemoveTileTypeListener;
import me.rhin.openciv.listener.SetTileTypeListener;
import me.rhin.openciv.listener.UnitActListener.UnitActEvent;
import me.rhin.openciv.listener.WorkTileListener;
import me.rhin.openciv.shared.packet.type.RemoveTileTypePacket;
import me.rhin.openciv.shared.packet.type.SetTileTypePacket;
import me.rhin.openciv.shared.packet.type.WorkTilePacket;

public class Builder extends UnitItem {

	public Builder(City city) {
		super(city);
	}

	public static class BuilderUnit extends Unit
			implements WorkTileListener, SetTileTypeListener, RemoveTileTypeListener {

		private ImprovementType improvementType;
		private boolean building;

		public BuilderUnit(UnitParameter unitParameter) {
			super(unitParameter, TextureEnum.UNIT_BUILDER);
			// FIXME: Move these classes into a separate package
			customActions.add(new FarmAction(this));
			customActions.add(new MineAction(this));
			customActions.add(new ChopAction(this));
			customActions.add(new PastureAction(this));
			customActions.add(new PlantationAction(this));
			customActions.add(new RoadAction(this));
			customActions.add(new ClearAction(this));
			customActions.add(new FortAction(this));
			this.canAttack = false;
			this.building = false;

			// FIXME: REALLY should remove these listeners when this unit gets destroyed
			Civilization.getInstance().getEventManager().addListener(WorkTileListener.class, this);
			Civilization.getInstance().getEventManager().addListener(SetTileTypeListener.class, this);
			Civilization.getInstance().getEventManager().addListener(RemoveTileTypeListener.class, this);
		}

		@Override
		public void onWorkTile(WorkTilePacket packet) {
			if (packet.getUnitID() != getID())
				return;

			getStandingTile().setAppliedTurns(packet.getAppliedTurns());
		}

		@Override
		public void onSetTileType(SetTileTypePacket packet) {
			if (building) {
				// Assume we finish building
				building = false;
				improvementType = null;
				standingTile.setAppliedTurns(0);

				// FIXME: This is a workaround for non improvement builds
				if (TileType.valueOf(packet.getTileTypeName()) != TileType.ROAD)
					standingTile.setImproved(true);
			}
		}

		@Override
		public void onRemoveTileType(RemoveTileTypePacket packet) {
			if (building) {
				// Assume we finish building
				building = false;
				improvementType = null;
				standingTile.setAppliedTurns(0);
			}
		}

		@Override
		public void moveToTargetTile() {
			super.moveToTargetTile();

			building = false;
		}

		@Override
		public float getMovementCost(Tile prevTile, Tile tile) {
			if (tile.containsTileProperty(TileProperty.WATER))
				return 1000000;
			else
				return tile.getMovementCost(prevTile);
		}

		@Override
		public boolean isUnitCapturable() {
			return true;
		}

		public void setBuilding(boolean building) {
			this.building = building;
		}

		public boolean isBuilding() {
			return building;
		}

		public void setImprovementType(ImprovementType improvementType) {
			this.improvementType = improvementType;
		}

		public String getImprovementDesc() {
			//FIXME: This is null sometimes?
			return improvementType.getImprovementDesc();
		}

		public int getMaxTurns() {
			return improvementType.getMaxTurns();
		}

		@Override
		public List<UnitType> getUnitTypes() {
			return Arrays.asList(UnitType.SUPPORT);
		}
	}

	public static class FarmAction extends AbstractAction {

		public FarmAction(Unit unit) {
			super(unit);
		}

		@Override
		public boolean act(float delta) {
			// unit.getPlayerOwner().unselectUnit();
			unit.reduceMovement(2);
			WorkTilePacket packet = new WorkTilePacket();
			packet.setTile("farm", unit.getStandingTile().getGridX(), unit.getStandingTile().getGridY());
			Civilization.getInstance().getNetworkManager().sendPacket(packet);
			// unit.removeAction(this);

			BuilderUnit builderUnit = (BuilderUnit) unit;
			builderUnit.setBuilding(true);
			builderUnit.setImprovementType(ImprovementType.FARM);

			Civilization.getInstance().getEventManager().fireEvent(new UnitActEvent(unit));

			unit.removeAction(this);
			return true;
		}

		@Override
		public boolean canAct() {
			Tile tile = unit.getStandingTile();
			boolean farmableTile = !tile.isImproved() && tile.getBaseTileType().hasProperty(TileProperty.FARMABLE)
					&& tile.getTerritory() != null
					&& tile.getTerritory().getPlayerOwner().equals(unit.getPlayerOwner());

			BuilderUnit builderUnit = (BuilderUnit) unit;
			if (unit.getCurrentMovement() < 1 || !farmableTile || builderUnit.isBuilding()) {
				return false;
			}

			return true;
		}

		@Override
		public String getName() {
			return "Farm";
		}

		@Override
		public TextureEnum getSprite() {
			return TextureEnum.ICON_FARM;
		}
	}

	public static class MineAction extends AbstractAction {

		public MineAction(Unit unit) {
			super(unit);
		}

		@Override
		public boolean act(float delta) {
			// unit.getPlayerOwner().unselectUnit();
			unit.reduceMovement(2);
			WorkTilePacket packet = new WorkTilePacket();
			packet.setTile("mine", unit.getStandingTile().getGridX(), unit.getStandingTile().getGridY());
			Civilization.getInstance().getNetworkManager().sendPacket(packet);
			// unit.removeAction(this);

			BuilderUnit builderUnit = (BuilderUnit) unit;
			builderUnit.setBuilding(true);
			builderUnit.setImprovementType(ImprovementType.MINE);

			Civilization.getInstance().getEventManager().fireEvent(new UnitActEvent(unit));

			unit.removeAction(this);
			return true;
		}

		@Override
		public boolean canAct() {
			Tile tile = unit.getStandingTile();

			if (!unit.getPlayerOwner().getResearchTree().hasResearched(MiningTech.class)) {
				return false;
			}

			boolean farmableTile = !tile.isImproved() && tile.getBaseTileType().hasProperty(TileProperty.MINEABLE)
					&& tile.getTerritory() != null
					&& tile.getTerritory().getPlayerOwner().equals(unit.getPlayerOwner());

			BuilderUnit builderUnit = (BuilderUnit) unit;
			if (unit.getCurrentMovement() < 1 || !farmableTile || builderUnit.isBuilding()) {
				return false;
			}

			return true;
		}

		@Override
		public String getName() {
			return "Mine";
		}

		@Override
		public TextureEnum getSprite() {
			return TextureEnum.ICON_MINING;
		}
	}

	public static class ChopAction extends AbstractAction {

		public ChopAction(Unit unit) {
			super(unit);
		}

		@Override
		public boolean act(float delta) {
			// unit.getPlayerOwner().unselectUnit();
			unit.reduceMovement(2);
			WorkTilePacket packet = new WorkTilePacket();
			packet.setTile("chop", unit.getStandingTile().getGridX(), unit.getStandingTile().getGridY());
			Civilization.getInstance().getNetworkManager().sendPacket(packet);
			// unit.removeAction(this);

			BuilderUnit builderUnit = (BuilderUnit) unit;
			builderUnit.setBuilding(true);
			builderUnit.setImprovementType(ImprovementType.CHOP);

			Civilization.getInstance().getEventManager().fireEvent(new UnitActEvent(unit));

			unit.removeAction(this);
			return true;
		}

		@Override
		public boolean canAct() {
			Tile tile = unit.getStandingTile();

			if (tile.getCity() != null)
				return false;

			if (!unit.getPlayerOwner().getResearchTree().hasResearched(MiningTech.class)) {
				return false;
			}

			boolean farmableTile = !tile.isImproved() && tile.containsTileType(TileType.FOREST)
					&& tile.getTerritory() != null
					&& tile.getTerritory().getPlayerOwner().equals(unit.getPlayerOwner());

			BuilderUnit builderUnit = (BuilderUnit) unit;
			if (unit.getCurrentMovement() < 1 || !farmableTile || builderUnit.isBuilding()) {
				return false;
			}

			return true;
		}

		@Override
		public String getName() {
			return "Chop";
		}

		@Override
		public TextureEnum getSprite() {
			return TextureEnum.ICON_CHOP;
		}
	}

	public static class ClearAction extends AbstractAction {

		public ClearAction(Unit unit) {
			super(unit);
		}

		@Override
		public boolean act(float delta) {
			// unit.getPlayerOwner().unselectUnit();
			unit.reduceMovement(2);
			WorkTilePacket packet = new WorkTilePacket();
			packet.setTile("clear", unit.getStandingTile().getGridX(), unit.getStandingTile().getGridY());
			Civilization.getInstance().getNetworkManager().sendPacket(packet);
			// unit.removeAction(this);

			BuilderUnit builderUnit = (BuilderUnit) unit;
			builderUnit.setBuilding(true);
			builderUnit.setImprovementType(ImprovementType.CLEAR);

			Civilization.getInstance().getEventManager().fireEvent(new UnitActEvent(unit));

			unit.removeAction(this);
			return true;
		}

		@Override
		public boolean canAct() {
			Tile tile = unit.getStandingTile();

			if (tile.getCity() != null)
				return false;

			if (!unit.getPlayerOwner().getResearchTree().hasResearched(BronzeWorkingTech.class)) {
				return false;
			}

			boolean farmableTile = !tile.isImproved() && tile.containsTileType(TileType.JUNGLE)
					&& tile.getTerritory() != null
					&& tile.getTerritory().getPlayerOwner().equals(unit.getPlayerOwner());

			BuilderUnit builderUnit = (BuilderUnit) unit;
			if (unit.getCurrentMovement() < 1 || !farmableTile || builderUnit.isBuilding()) {
				return false;
			}

			return true;
		}

		@Override
		public String getName() {
			return "Clear";
		}

		@Override
		public TextureEnum getSprite() {
			return TextureEnum.ICON_CHOP;
		}
	}

	public static class PastureAction extends AbstractAction {

		public PastureAction(Unit unit) {
			super(unit);
		}

		@Override
		public boolean act(float delta) {
			// unit.getPlayerOwner().unselectUnit();
			unit.reduceMovement(2);
			WorkTilePacket packet = new WorkTilePacket();
			packet.setTile("pasture", unit.getStandingTile().getGridX(), unit.getStandingTile().getGridY());
			Civilization.getInstance().getNetworkManager().sendPacket(packet);
			// unit.removeAction(this);

			BuilderUnit builderUnit = (BuilderUnit) unit;
			builderUnit.setBuilding(true);
			builderUnit.setImprovementType(ImprovementType.PASTURE);

			Civilization.getInstance().getEventManager().fireEvent(new UnitActEvent(unit));

			unit.removeAction(this);
			return true;
		}

		@Override
		public boolean canAct() {
			Tile tile = unit.getStandingTile();

			if (tile.getCity() != null)
				return false;

			if (!unit.getPlayerOwner().getResearchTree().hasResearched(AnimalHusbandryTech.class)) {
				return false;
			}

			boolean farmableTile = !tile.isImproved() && tile.getBaseTileType().hasProperty(TileProperty.ANIMAL)
					&& tile.getTerritory() != null
					&& tile.getTerritory().getPlayerOwner().equals(unit.getPlayerOwner());

			BuilderUnit builderUnit = (BuilderUnit) unit;
			if (unit.getCurrentMovement() < 1 || !farmableTile || builderUnit.isBuilding()) {
				return false;
			}

			return true;
		}

		@Override
		public String getName() {
			return "Pasture";
		}

		@Override
		public TextureEnum getSprite() {
			// TODO Auto-generated method stub
			return TextureEnum.ICON_PASTURE;
		}
	}

	public static class PlantationAction extends AbstractAction {

		public PlantationAction(Unit unit) {
			super(unit);
		}

		@Override
		public boolean act(float delta) {
			// unit.getPlayerOwner().unselectUnit();
			unit.reduceMovement(2);
			WorkTilePacket packet = new WorkTilePacket();
			packet.setTile("plantation", unit.getStandingTile().getGridX(), unit.getStandingTile().getGridY());
			Civilization.getInstance().getNetworkManager().sendPacket(packet);
			// unit.removeAction(this);

			BuilderUnit builderUnit = (BuilderUnit) unit;
			builderUnit.setBuilding(true);
			builderUnit.setImprovementType(ImprovementType.PLANTATION);

			Civilization.getInstance().getEventManager().fireEvent(new UnitActEvent(unit));

			unit.removeAction(this);
			return true;
		}

		@Override
		public boolean canAct() {
			Tile tile = unit.getStandingTile();

			if (tile.getCity() != null)
				return false;

			if (!unit.getPlayerOwner().getResearchTree().hasResearched(CalendarTech.class)) {
				return false;
			}

			boolean farmableTile = !tile.isImproved() && tile.getBaseTileType().hasProperty(TileProperty.HARVESTABLE)
					&& tile.getTerritory() != null
					&& tile.getTerritory().getPlayerOwner().equals(unit.getPlayerOwner());

			BuilderUnit builderUnit = (BuilderUnit) unit;
			if (unit.getCurrentMovement() < 1 || !farmableTile || builderUnit.isBuilding()) {
				return false;
			}

			return true;
		}

		@Override
		public String getName() {
			return "Plantation";
		}

		@Override
		public TextureEnum getSprite() {
			return TileType.valueOf(unit.getStandingTile().getBaseTileType().name() + "_IMPROVED").getTextureEnum();
		}
	}

	public static class FortAction extends AbstractAction {

		public FortAction(Unit unit) {
			super(unit);
		}

		@Override
		public boolean act(float delta) {
			// unit.getPlayerOwner().unselectUnit();
			unit.reduceMovement(2);
			WorkTilePacket packet = new WorkTilePacket();
			packet.setTile("fort", unit.getStandingTile().getGridX(), unit.getStandingTile().getGridY());
			Civilization.getInstance().getNetworkManager().sendPacket(packet);
			// unit.removeAction(this);

			BuilderUnit builderUnit = (BuilderUnit) unit;
			builderUnit.setBuilding(true);
			builderUnit.setImprovementType(ImprovementType.FORT);

			Civilization.getInstance().getEventManager().fireEvent(new UnitActEvent(unit));

			unit.removeAction(this);
			return true;
		}

		@Override
		public boolean canAct() {
			Tile tile = unit.getStandingTile();

			if (!unit.getPlayerOwner().getHeritageTree().hasStudied(DefensiveLogisticsHeritage.class)) {
				return false;
			}

			boolean farmableTile = !tile.isImproved() && !tile.containsTileType(TileType.FOREST)
					&& !tile.containsTileType(TileType.JUNGLE);

			BuilderUnit builderUnit = (BuilderUnit) unit;
			if (unit.getCurrentMovement() < 1 || !farmableTile || builderUnit.isBuilding()) {
				return false;
			}

			return true;
		}

		@Override
		public String getName() {
			return "Fort";
		}

		@Override
		public TextureEnum getSprite() {
			return TextureEnum.TILE_FORT;
		}
	}

	public static class RoadAction extends AbstractAction {

		public RoadAction(Unit unit) {
			super(unit);
		}

		@Override
		public boolean act(float delta) {
			// unit.getPlayerOwner().unselectUnit();
			unit.reduceMovement(2);
			WorkTilePacket packet = new WorkTilePacket();
			packet.setTile("road", unit.getStandingTile().getGridX(), unit.getStandingTile().getGridY());
			Civilization.getInstance().getNetworkManager().sendPacket(packet);
			// unit.removeAction(this);

			BuilderUnit builderUnit = (BuilderUnit) unit;
			builderUnit.setBuilding(true);
			builderUnit.setImprovementType(ImprovementType.ROAD);

			Civilization.getInstance().getEventManager().fireEvent(new UnitActEvent(unit));

			unit.removeAction(this);
			return true;
		}

		@Override
		public boolean canAct() {
			Tile tile = unit.getStandingTile();

			if (!unit.getPlayerOwner().getResearchTree().hasResearched(WheelTech.class)) {
				return false;
			}

			BuilderUnit builderUnit = (BuilderUnit) unit;
			if (unit.getCurrentMovement() < 1 || builderUnit.isBuilding()) {
				return false;
			}

			if (tile.containsTileType(TileType.ROAD))
				return false;

			return true;
		}

		@Override
		public String getName() {
			return "Road";
		}

		@Override
		public TextureEnum getSprite() {
			// TODO Auto-generated method stub
			return TextureEnum.ROAD_HORIZONTAL;
		}
	}

	@Override
	protected float getUnitProductionCost() {
		return 50;
	}

	@Override
	public float getGoldCost() {
		return 175;
	}

	@Override
	public boolean meetsProductionRequirements() {
		return true;
	}

	@Override
	public String getName() {
		return "Builder";
	}

	@Override
	public TextureEnum getTexture() {
		return TextureEnum.UNIT_BUILDER;
	}

	@Override
	public String getDesc() {
		return "Can improve tiles on the map. \nCertain tiles require a specific \nresearch.\nCan be captured by enemy units.";
	}

	@Override
	public List<UnitType> getUnitItemTypes() {
		return Arrays.asList(UnitType.SUPPORT);
	}
}
