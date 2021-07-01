package me.rhin.openciv.game.unit;

import com.badlogic.gdx.graphics.Color;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.AbstractAction;
import me.rhin.openciv.game.map.tile.Tile;
import me.rhin.openciv.game.map.tile.Tile.TileTypeWrapper;
import me.rhin.openciv.game.map.tile.TileType;
import me.rhin.openciv.game.unit.type.Archer.ArcherUnit;
import me.rhin.openciv.listener.LeftClickListener;
import me.rhin.openciv.listener.RelativeMouseMoveListener;
import me.rhin.openciv.listener.RightClickListener;
import me.rhin.openciv.listener.SelectUnitListener;
import me.rhin.openciv.listener.UnitActListener.UnitActEvent;
import me.rhin.openciv.shared.packet.type.RangedAttackPacket;
import me.rhin.openciv.shared.packet.type.SelectUnitPacket;
import me.rhin.openciv.ui.window.type.UnitCombatWindow;
import me.rhin.openciv.util.ClickType;

public abstract class RangedUnit extends Unit
		implements LeftClickListener, RightClickListener, SelectUnitListener, RelativeMouseMoveListener {

	private UntargetAction untargetAction;
	private boolean targeting;
	private AttackableEntity rangedTarget;

	public RangedUnit(UnitParameter unitParameter, TextureEnum assetEnum) {
		super(unitParameter, assetEnum);

		this.untargetAction = new UntargetAction(this);

		customActions.add(new TargetAction(this));
		customActions.add(untargetAction);

		this.canAttack = true;
		this.targeting = false;

		Civilization.getInstance().getEventManager().addListener(LeftClickListener.class, this);
		Civilization.getInstance().getEventManager().addListener(RightClickListener.class, this);
		Civilization.getInstance().getEventManager().addListener(SelectUnitListener.class, this);
		Civilization.getInstance().getEventManager().addListener(RelativeMouseMoveListener.class, this);
	}

	public abstract int getMovementCost(Tile prevTile, Tile adjTile);

	public abstract int getRangedCombatStrength();

	@Override
	public void onLeftClick(float x, float y) {

		if (getPlayerOwner().getSelectedUnit() == null || !getPlayerOwner().getSelectedUnit().equals(this))
			return;

		if (rangedTarget == null || getCurrentMovement() < 1)
			return;

		reduceMovement(2);
		getPlayerOwner().unselectUnit();

		RangedAttackPacket packet = new RangedAttackPacket();
		packet.setUnit(getID(), standingTile.getGridX(), standingTile.getGridY());
		packet.setTargetEntity(rangedTarget.getTile().getGridX(), rangedTarget.getTile().getGridY());

		Civilization.getInstance().getNetworkManager().sendPacket(packet);

		addAction(untargetAction);
	}

	@Override
	public void onRightClick(ClickType clickType, int x, int y) {

		if (getPlayerOwner().getSelectedUnit() == null || !getPlayerOwner().getSelectedUnit().equals(this))
			return;

		if (untargetAction.canAct())
			addAction(untargetAction);
	}

	@Override
	public void onSelectUnit(SelectUnitPacket packet) {

		if (getPlayerOwner().getSelectedUnit() == null || !getPlayerOwner().getSelectedUnit().equals(this))
			return;

		if (untargetAction.canAct())
			addAction(untargetAction);
	}

	@Override
	public void onRelativeMouseMove(float x, float y) {

		if (getPlayerOwner().getSelectedUnit() == null || !getPlayerOwner().getSelectedUnit().equals(this))
			return;

		Tile tile = Civilization.getInstance().getGame().getPlayer().getHoveredTile();

		if (!targeting || tile == null || tile.getAttackableEntity() == null || !tile.hasRangedTarget()) {
			rangedTarget = null;
			targetSelectionSprite.setColor(Color.YELLOW);
			Civilization.getInstance().getWindowManager().closeWindow(UnitCombatWindow.class);
			return;
		}

		if (!tile.getAttackableEntity().getPlayerOwner().equals(getPlayerOwner())
				&& (rangedTarget == null || !rangedTarget.equals(tile.getAttackableEntity()))) {
			rangedTarget = tile.getAttackableEntity();
			System.out.println("hi3");
			targetSelectionSprite.setPosition(tile.getVectors()[0].x - tile.getWidth() / 2, tile.getVectors()[0].y + 4);
			targetSelectionSprite.setSize(tile.getWidth(), tile.getHeight());
			targetSelectionSprite.setColor(Color.RED);

			// Popup combat preview window
			Civilization.getInstance().getWindowManager().closeWindow(UnitCombatWindow.class);
			Civilization.getInstance().getWindowManager().addWindow(new UnitCombatWindow(this, rangedTarget));
		}
	}

	@Override
	public boolean hasRangedTarget() {
		return rangedTarget != null;
	}

	// TODO: Move to individual class
	public static class TargetAction extends AbstractAction {

		public TargetAction(Unit unit) {
			super(unit);
		}

		@Override
		public boolean act(float delta) {

			((ArcherUnit) unit).setTargeting(true);

			boolean isHill = unit.getStandingTile().getBaseTileType() == TileType.GRASS_HILL
					|| unit.getStandingTile().getBaseTileType() == TileType.DESERT_HILL
					|| unit.getStandingTile().getBaseTileType() == TileType.PLAINS_HILL;

			for (Tile tile : unit.getStandingTile().getAdjTiles()) {

				boolean denyVisibility = false;
				for (TileTypeWrapper wrapper : tile.getTileTypeWrappers())
					if (wrapper.getTileType().getMovementCost() > 1 && !tile.equals(unit.getStandingTile())) {
						denyVisibility = true;
					}

				// FIXME: confusing name. maybe like, setRangedVisibiltiy ?
				tile.setRangedTarget(true);

				if (denyVisibility && !isHill)
					continue;

				for (Tile adjTile : tile.getAdjTiles()) {

					if (adjTile == null)
						continue;

					adjTile.setRangedTarget(true);
				}
			}

			Civilization.getInstance().getEventManager().fireEvent(new UnitActEvent(unit));
			unit.removeAction(this);
			return true;
		}

		@Override
		public boolean canAct() {

			ArcherUnit archerUnit = (ArcherUnit) unit;

			if (archerUnit.getCurrentMovement() < 1 || archerUnit.isTargeting()) {
				return false;
			}

			return true;
		}

		@Override
		public String getName() {
			return "Target";
		}
	}

	public static class UntargetAction extends AbstractAction {

		public UntargetAction(Unit unit) {
			super(unit);
		}

		@Override
		public boolean act(float delta) {

			ArcherUnit archerUnit = (ArcherUnit) unit;

			archerUnit.setTargeting(false);
			archerUnit.setRangedTarget(null);

			for (Tile tile : unit.getStandingTile().getAdjTiles()) {

				// TODO: Check if this overrides other archers ranged targets.
				tile.setRangedTarget(false);

				for (Tile adjTile : tile.getAdjTiles()) {

					if (adjTile == null)
						continue;

					adjTile.setRangedTarget(false);
				}
			}

			Civilization.getInstance().getEventManager().fireEvent(new UnitActEvent(unit));
			unit.removeAction(this);
			return true;
		}

		@Override
		public boolean canAct() {
			return ((ArcherUnit) unit).isTargeting();
		}

		@Override
		public String getName() {
			return "Untarget";
		}
	}

	public void setRangedTarget(Unit rangedTarget) {
		this.rangedTarget = rangedTarget;
	}

	public void setTargeting(boolean targeting) {
		this.targeting = targeting;
	}

	public boolean isTargeting() {
		return targeting;
	}

}
