package me.rhin.openciv.ui.window.type;

import java.util.ArrayList;

import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.utils.Align;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.game.AbstractAction;
import me.rhin.openciv.game.unit.Unit;
import me.rhin.openciv.game.unit.type.Builder.BuilderUnit;
import me.rhin.openciv.listener.NextTurnListener;
import me.rhin.openciv.listener.RemoveTileTypeListener;
import me.rhin.openciv.listener.ResizeListener;
import me.rhin.openciv.listener.SetTileTypeListener;
import me.rhin.openciv.listener.UnitActListener;
import me.rhin.openciv.listener.UnitAttackListener;
import me.rhin.openciv.listener.WorkTileListener;
import me.rhin.openciv.shared.packet.type.NextTurnPacket;
import me.rhin.openciv.shared.packet.type.RemoveTileTypePacket;
import me.rhin.openciv.shared.packet.type.SetTileTypePacket;
import me.rhin.openciv.shared.packet.type.UnitAttackPacket;
import me.rhin.openciv.shared.packet.type.WorkTilePacket;
import me.rhin.openciv.ui.background.BlankBackground;
import me.rhin.openciv.ui.button.type.UnitActionButton;
import me.rhin.openciv.ui.game.Healthbar;
import me.rhin.openciv.ui.label.CustomLabel;
import me.rhin.openciv.ui.window.AbstractWindow;

public class UnitWindow extends AbstractWindow implements ResizeListener, UnitAttackListener, NextTurnListener,
		UnitActListener, WorkTileListener, SetTileTypeListener, RemoveTileTypeListener {

	private CustomLabel unitNameLabel;
	private CustomLabel movementLabel;
	private BlankBackground blankBackground;
	private Healthbar healthbar;
	private CustomLabel buildDescLabel;

	private Unit unit;
	private ArrayList<UnitActionButton> unitActionButtons;

	public UnitWindow(Unit unit) {
		super.setBounds(viewport.getWorldWidth() - 200, 0, 200, 100);
		this.unit = unit;
		this.unitActionButtons = new ArrayList<>();

		this.blankBackground = new BlankBackground(0, 0, 200, 100);
		addActor(blankBackground);

		this.healthbar = new Healthbar(getWidth() - 200, getHeight() - 35, 200, 15);
		healthbar.setHealth(unit.getMaxHealth(), unit.getHealth());
		addActor(healthbar);

		this.unitNameLabel = new CustomLabel(unit.getName(), Align.center, getWidth() - 200, 100 - 20, 200, 20);
		addActor(unitNameLabel);

		this.movementLabel = new CustomLabel(
				"Movement: " + (int) unit.getCurrentMovement() + "/" + unit.getMaxMovement());
		movementLabel.setPosition((getWidth() - (200 / 2)) - movementLabel.getWidth() / 2, 5);
		addActor(movementLabel);

		this.buildDescLabel = new CustomLabel("??? - (0/0)", 4, 100 - 55, 200, 20);

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
			UnitActionButton actionButton = new UnitActionButton(unit, action, blankBackground.getX() + (75 * index),
					blankBackground.getY() + blankBackground.getHeight() / 2 - 40 / 2, 70, 30);
			unitActionButtons.add(actionButton);
			addActor(actionButton);
			index++;
		}

		Civilization.getInstance().getEventManager().addListener(ResizeListener.class, this);
		Civilization.getInstance().getEventManager().addListener(UnitAttackListener.class, this);
		Civilization.getInstance().getEventManager().addListener(NextTurnListener.class, this);
		Civilization.getInstance().getEventManager().addListener(UnitActListener.class, this);
		Civilization.getInstance().getEventManager().addListener(WorkTileListener.class, this);
		Civilization.getInstance().getEventManager().addListener(SetTileTypeListener.class, this);
		Civilization.getInstance().getEventManager().addListener(RemoveTileTypeListener.class, this);
	}

	@Override
	public void onClose() {
		super.onClose();

		Civilization.getInstance().getEventManager().clearListenersFromObject(this);
	}

	@Override
	public void onNextTurn(NextTurnPacket packet) {
		updateActionButtons();
	}

	@Override
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

	@Override
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

	@Override
	public void onWorkTile(WorkTilePacket packet) {
		if (unit.getID() != packet.getUnitID())
			return;

		BuilderUnit builderUnit = (BuilderUnit) unit;

		this.buildDescLabel.setText(builderUnit.getImprovementDesc() + " ("
				+ builderUnit.getStandingTile().getAppliedImprovementTurns() + "/" + builderUnit.getMaxTurns() + ")");
	}

	@Override
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

	@Override
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

	@Override
	public void draw(Batch batch, float parentAlpha) {
		super.draw(batch, parentAlpha);
		// FIXME: This is not ideal
		movementLabel.setText("Movement: " + (int) unit.getCurrentMovement() + "/" + unit.getMaxMovement());
	}

	@Override
	public void onResize(int width, int height) {
		super.setPosition(width - 200, 0);
		blankBackground.setPosition(0, 0);
		unitNameLabel.setPosition(getWidth() - 200, 100 - 20);
		movementLabel.setPosition((getWidth() - (200 / 2)) - movementLabel.getWidth() / 2, 5);

		int index = 0;
		for (UnitActionButton actionButton : unitActionButtons) {
			actionButton.setPosition(blankBackground.getX() + (75 * index),
					blankBackground.getY() + blankBackground.getHeight() / 2 - 40 / 2);
			index++;
		}
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
		return true;
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

	private void updateActionButtons() {

		for (UnitActionButton button : unitActionButtons) {
			removeActor(button);
		}

		int index = 0;
		for (AbstractAction action : unit.getCustomActions()) {
			if (!action.canAct())
				continue;
			UnitActionButton actionButton = new UnitActionButton(unit, action, blankBackground.getX() + (75 * index),
					blankBackground.getY() + blankBackground.getHeight() / 2 - 40 / 2, 70, 30);
			unitActionButtons.add(actionButton);
			addActor(actionButton);
			index++;
		}
	}
}
