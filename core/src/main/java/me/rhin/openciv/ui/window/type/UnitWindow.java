package me.rhin.openciv.ui.window.type;

import java.util.ArrayList;

import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.utils.Align;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.unit.Unit;
import me.rhin.openciv.game.unit.actions.AbstractAction;
import me.rhin.openciv.game.unit.type.Builder.BuilderUnit;
import me.rhin.openciv.shared.listener.EventHandler;
import me.rhin.openciv.shared.packet.type.MoveUnitPacket;
import me.rhin.openciv.shared.packet.type.NextTurnPacket;
import me.rhin.openciv.shared.packet.type.RemoveTileTypePacket;
import me.rhin.openciv.shared.packet.type.SetTileTypePacket;
import me.rhin.openciv.shared.packet.type.SetUnitHealthPacket;
import me.rhin.openciv.shared.packet.type.UnitAttackPacket;
import me.rhin.openciv.shared.packet.type.WorkTilePacket;
import me.rhin.openciv.ui.background.BlankBackground;
import me.rhin.openciv.ui.button.CustomButton;
import me.rhin.openciv.ui.game.Healthbar;
import me.rhin.openciv.ui.label.CustomLabel;
import me.rhin.openciv.ui.window.AbstractWindow;

public class UnitWindow extends AbstractWindow {

	private CustomLabel unitNameLabel;
	private CustomLabel movementLabel;
	private BlankBackground blankBackground;
	private Healthbar healthbar;
	private CustomLabel buildDescLabel;
	private CustomLabel actionDescLabel;

	private Unit unit;
	private ArrayList<CustomButton> unitActionButtons;

	public UnitWindow(Unit unit) {
		super.setBounds(viewport.getWorldWidth() - 225, 0, 225, 125);
		this.unit = unit;
		this.unitActionButtons = new ArrayList<>();

		this.blankBackground = new BlankBackground(0, 0, 225, 125);
		addActor(blankBackground);

		this.healthbar = new Healthbar(getWidth() - 225, getHeight() - 35, 225, 15, true);
		healthbar.setHealth(unit.getMaxHealth(), unit.getHealth());
		addActor(healthbar);

		this.unitNameLabel = new CustomLabel(unit.getName(), Align.center, getWidth() - 225, 125 - 20, 225, 20);
		addActor(unitNameLabel);

		this.movementLabel = new CustomLabel(
				"Movement: " + (int) unit.getCurrentMovement() + "/" + unit.getMaxMovement());
		movementLabel.setPosition((getWidth() - (225 / 2)) - movementLabel.getWidth() / 2, 5);
		addActor(movementLabel);

		this.buildDescLabel = new CustomLabel("??? - (0/0)", 4, 125 - 52, 225, 20);

		this.actionDescLabel = new CustomLabel("???", 4, 125 - 52, 225, 20);

		if (unit instanceof BuilderUnit) {
			BuilderUnit builderUnit = (BuilderUnit) unit;

			if (builderUnit.isBuilding()) {
				this.buildDescLabel.setText(builderUnit.getImprovementDesc() + " ("
						+ builderUnit.getStandingTile().getAppliedImprovementTurns() + "/" + builderUnit.getMaxTurns()
						+ ")");
				addActor(buildDescLabel);
			}
		}

		int index = 0;
		for (AbstractAction action : unit.getCustomActions()) {
			if (!action.canAct())
				continue;
			CustomButton actionButton = new CustomButton(TextureEnum.UI_BUTTON_ICON, TextureEnum.UI_BUTTON_ICON_HOVERED,
					action.getSprite(), 4 + (52 * index), 17, 48, 48, 32, 32);

			actionButton.onHover(() -> {
				setHoveredAction(action);
			});

			actionButton.onUnhover(() -> {
				unsetHoveredAction();
			});

			actionButton.onClick(() -> {
				if (action.canAct())
					unit.addAction(action);
			});

			unitActionButtons.add(actionButton);
			addActor(actionButton);
			index++;
		}
	}

	@EventHandler
	public void onNextTurn(NextTurnPacket packet) {
		updateActionButtons();
	}

	@EventHandler
	public void onUnitMove(MoveUnitPacket packet) {
		updateActionButtons();
	}

	@EventHandler
	public void onUnitAct(Unit unit) {

		// FIXME: This is pretty much hard coded into the UI. Maybe each required unit
		// could build it's own unitWindow UI. that extends this.
		if (unit instanceof BuilderUnit) {
			BuilderUnit builderUnit = (BuilderUnit) unit;
			if (builderUnit.isBuilding()) {

				buildDescLabel.setText(builderUnit.getImprovementDesc() + " ("
						+ builderUnit.getStandingTile().getAppliedImprovementTurns() + "/" + builderUnit.getMaxTurns()
						+ ")");
				addActor(buildDescLabel);
			}
		}

		updateActionButtons();
	}

	@EventHandler
	public void onUnitAttack(UnitAttackPacket packet) {
		// FIXME: Is this the best way to do this? How about onUnitSetHealth event?
		Unit attackingUnit = Civilization.getInstance().getGame().getMap().getTiles()[packet.getUnitGridX()][packet
				.getUnitGridY()].getTopUnit();
		Unit targetUnit = Civilization.getInstance().getGame().getMap().getTiles()[packet.getTargetGridX()][packet
				.getTargetGridY()].getTopUnit();

		if (unit.equals(attackingUnit) || unit.equals(targetUnit)) {
			healthbar.setHealth(unit.getMaxHealth(), unit.getHealth());
		}
	}

	@EventHandler
	public void onSetUnitHealth(SetUnitHealthPacket packet) {
		Unit unit = Civilization.getInstance().getGame().getMap().getTiles()[packet.getTileGridX()][packet
				.getTileGridY()].getUnitFromID(packet.getUnitID());

		if (unit.equals(this.unit)) {
			healthbar.setHealth(unit.getMaxHealth(), unit.getHealth());
		}
	}

	@EventHandler
	public void onWorkTile(WorkTilePacket packet) {

		if (unit.getID() != packet.getUnitID())
			return;

		BuilderUnit builderUnit = (BuilderUnit) unit;

		this.buildDescLabel.setText(builderUnit.getImprovementDesc() + " ("
				+ builderUnit.getStandingTile().getAppliedImprovementTurns() + "/" + builderUnit.getMaxTurns() + ")");
	}

	@EventHandler
	public void onSetTileType(SetTileTypePacket packet) {
		if (!(unit instanceof BuilderUnit))
			return;

		BuilderUnit builderUnit = (BuilderUnit) unit;

		if (builderUnit.getStandingTile().getGridX() == packet.getGridX()
				&& builderUnit.getStandingTile().getGridY() == packet.getGridY()) {

			// Assume the builder is done building
			removeActor(buildDescLabel);
		}

		updateActionButtons();
	}

	@EventHandler
	public void onRemoveTileType(RemoveTileTypePacket packet) {
		if (!(unit instanceof BuilderUnit))
			return;

		BuilderUnit builderUnit = (BuilderUnit) unit;

		if (builderUnit.getStandingTile().getGridX() == packet.getGridX()
				&& builderUnit.getStandingTile().getGridY() == packet.getGridY()) {

			// Assume the builder is done building
			removeActor(buildDescLabel);
		}

		updateActionButtons();
	}

	@EventHandler
	public void onResize(int width, int height) {
		super.setPosition(width - 225, 0);
		blankBackground.setPosition(0, 0);
		unitNameLabel.setPosition(getWidth() - 225, 125 - 20);
		movementLabel.setPosition((getWidth() - (225 / 2)) - movementLabel.getWidth() / 2, 5);

		/*
		 * int index = 0; for (UnitActionButton actionButton : unitActionButtons) {
		 * actionButton.setPosition((52 * index), 17); index++; }
		 */
	}

	@Override
	public void draw(Batch batch, float parentAlpha) {
		super.draw(batch, parentAlpha);
		// FIXME: This is not ideal
		movementLabel.setText("Movement: " + unit.getCurrentMovement() + "/" + unit.getMaxMovement());
	}

	@Override
	public boolean disablesInput() {
		return false;
	}

	@Override
	public boolean disablesCameraMovement() {
		return false;
	}

	@Override
	public boolean closesOtherWindows() {
		return false;
	}

	@Override
	public boolean isGameDisplayWindow() {
		return false;
	}

	@Override
	public boolean closesGameDisplayWindows() {
		return false;
	}

	public Unit getUnit() {
		return unit;
	}

	public void updateActionButtons() {

		for (CustomButton button : unitActionButtons) {
			removeActor(button);
		}

		int index = 0;
		for (AbstractAction action : unit.getCustomActions()) {
			if (!action.canAct())
				continue;

			CustomButton actionButton = new CustomButton(TextureEnum.UI_BUTTON_ICON, TextureEnum.UI_BUTTON_ICON_HOVERED,
					action.getSprite(), 4 + (52 * index), 17, 48, 48, 32, 32);

			actionButton.onHover(() -> {
				setHoveredAction(action);
			});

			actionButton.onUnhover(() -> {
				unsetHoveredAction();
			});

			actionButton.onClick(() -> {
				if (action.canAct())
					unit.addAction(action);
			});

			unitActionButtons.add(actionButton);
			addActor(actionButton);
			index++;
		}
	}

	public void setHoveredAction(AbstractAction action) {
		if (buildDescLabel.getStage() != null)
			return;

		actionDescLabel.setText(action.getName());
		addActor(actionDescLabel);
	}

	public void unsetHoveredAction() {
		actionDescLabel.setText("");
		removeActor(actionDescLabel);
	}
}
