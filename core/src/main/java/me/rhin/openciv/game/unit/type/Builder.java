package me.rhin.openciv.game.unit.type;

import java.util.Arrays;
import java.util.List;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.map.tile.ImprovementType;
import me.rhin.openciv.game.map.tile.Tile;
import me.rhin.openciv.game.map.tile.TileType;
import me.rhin.openciv.game.map.tile.TileType.TileProperty;
import me.rhin.openciv.game.notification.type.AvailableMovementNotification;
import me.rhin.openciv.game.unit.Unit;
import me.rhin.openciv.game.unit.UnitItem;
import me.rhin.openciv.game.unit.UnitParameter;
import me.rhin.openciv.game.unit.actions.type.ChopAction;
import me.rhin.openciv.game.unit.actions.type.ClearAction;
import me.rhin.openciv.game.unit.actions.type.FarmAction;
import me.rhin.openciv.game.unit.actions.type.FortAction;
import me.rhin.openciv.game.unit.actions.type.LumberMillAction;
import me.rhin.openciv.game.unit.actions.type.MineAction;
import me.rhin.openciv.game.unit.actions.type.PastureAction;
import me.rhin.openciv.game.unit.actions.type.PlantationAction;
import me.rhin.openciv.game.unit.actions.type.QuarryAction;
import me.rhin.openciv.game.unit.actions.type.RoadAction;
import me.rhin.openciv.listener.MoveUnitListener;
import me.rhin.openciv.listener.RemoveTileTypeListener;
import me.rhin.openciv.listener.SetTileTypeListener;
import me.rhin.openciv.listener.WorkTileListener;
import me.rhin.openciv.shared.packet.type.MoveUnitPacket;
import me.rhin.openciv.shared.packet.type.NextTurnPacket;
import me.rhin.openciv.shared.packet.type.RemoveTileTypePacket;
import me.rhin.openciv.shared.packet.type.SetTileTypePacket;
import me.rhin.openciv.shared.packet.type.WorkTilePacket;

public class Builder extends UnitItem {

	public Builder(City city) {
		super(city);
	}

	public static class BuilderUnit extends Unit
			implements WorkTileListener, SetTileTypeListener, RemoveTileTypeListener, MoveUnitListener {

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
			customActions.add(new QuarryAction(this));
			customActions.add(new LumberMillAction(this));
			this.building = false;

			Civilization.getInstance().getEventManager().addListener(WorkTileListener.class, this);
			Civilization.getInstance().getEventManager().addListener(SetTileTypeListener.class, this);
			Civilization.getInstance().getEventManager().addListener(RemoveTileTypeListener.class, this);
			Civilization.getInstance().getEventManager().addListener(MoveUnitListener.class, this);
		}

		@Override
		public void onWorkTile(WorkTilePacket packet) {
			if (packet.getUnitID() != getID())
				return;

			getStandingTile().setAppliedTurns(packet.getAppliedTurns());
		}

		@Override
		public void onSetTileType(SetTileTypePacket packet) {
			Tile tile = Civilization.getInstance().getGame().getMap().getTiles()[packet.getGridX()][packet.getGridY()];
			if (!standingTile.equals(tile))
				return;

			if (building) {
				// Assume we finish building
				building = false;
				improvementType = null;
				standingTile.setAppliedTurns(0);

				// Notify the player the builder can move again.
				Civilization.getInstance().getGame().getNotificationHanlder()
						.fireNotification(new AvailableMovementNotification(this));

				// FIXME: This is a workaround for non improvement builds
				if (TileType.valueOf(packet.getTileTypeName()) != TileType.ROAD)
					standingTile.setImproved(true);
			}
		}

		@Override
		public void onRemoveTileType(RemoveTileTypePacket packet) {
			Tile tile = Civilization.getInstance().getGame().getMap().getTiles()[packet.getGridX()][packet.getGridY()];
			if (!standingTile.equals(tile))
				return;

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

		@Override
		public void onNextTurn(NextTurnPacket packet) {
			if (!building)
				super.onNextTurn(packet);
			else // TODO: Make this a method in Unit class if we need other methods called here
				movement = getMaxMovement();
		}

		@Override
		public void onUnitMove(MoveUnitPacket packet) {
			Unit unit = Civilization.getInstance().getGame().getMap().getTiles()[packet.getTargetGridX()][packet
					.getTargetGridY()].getUnitFromID(packet.getUnitID());

			if (!unit.equals(this))
				return;

			if (standingTile.getAppliedImprovementTurns() > 0) {
				building = false;
				improvementType = null;
				standingTile.setAppliedTurns(0);
			}
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
			// FIXME: This is null sometimes?
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
