package me.rhin.openciv.ui.window.type;

import java.util.ArrayList;

import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.utils.Align;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.game.AbstractAction;
import me.rhin.openciv.game.unit.Unit;
import me.rhin.openciv.listener.ResizeListener;
import me.rhin.openciv.listener.UnitAttackListener;
import me.rhin.openciv.shared.packet.type.UnitAttackPacket;
import me.rhin.openciv.ui.background.BlankBackground;
import me.rhin.openciv.ui.button.type.UnitActionButton;
import me.rhin.openciv.ui.game.Healthbar;
import me.rhin.openciv.ui.label.CustomLabel;
import me.rhin.openciv.ui.window.AbstractWindow;

public class UnitWindow extends AbstractWindow implements ResizeListener, UnitAttackListener {

	private CustomLabel unitNameLabel;
	private CustomLabel movementLabel;
	private BlankBackground blankBackground;
	private Healthbar healthbar;

	private Unit unit;
	private ArrayList<UnitActionButton> unitActionButtons;

	public UnitWindow(Unit unit) {
		super.setBounds(viewport.getWorldWidth() - 200, 0, 200, 100);
		this.unit = unit;
		this.unitActionButtons = new ArrayList<>();

		this.blankBackground = new BlankBackground(0, 0, 200, 100);
		addActor(blankBackground);

		this.healthbar = new Healthbar(getWidth() - 200, getHeight() - 35, 200, 15);
		healthbar.setHealth(unit.getHealth());
		addActor(healthbar);

		this.unitNameLabel = new CustomLabel(unit.getName(), Align.center, getWidth() - 200, 100 - 20, 200, 20);
		addActor(unitNameLabel);

		this.movementLabel = new CustomLabel(
				"Movement: " + (int) unit.getCurrentMovement() + "/" + unit.getMaxMovement());
		movementLabel.setPosition((getWidth() - (200 / 2)) - movementLabel.getWidth() / 2, 5);
		addActor(movementLabel);

		int index = 0;
		for (AbstractAction action : unit.getCustomActions()) {
			UnitActionButton actionButton = new UnitActionButton(unit, action, blankBackground.getX() + (75 * index),
					blankBackground.getY() + blankBackground.getHeight() / 2 - 40 / 2, 70, 30);
			unitActionButtons.add(actionButton);
			addActor(actionButton);
			index++;
		}

		Civilization.getInstance().getEventManager().addListener(ResizeListener.class, this);
		Civilization.getInstance().getEventManager().addListener(UnitAttackListener.class, this);
	}

	@Override
	public void onUnitAttack(UnitAttackPacket packet) {
		// FIXME: Is this the best way to do this? How about onUnitSetHealth event?
		Unit attackingUnit = Civilization.getInstance().getGame().getMap().getTiles()[packet.getUnitGridX()][packet
				.getUnitGridY()].getTopUnit();
		Unit targetUnit = Civilization.getInstance().getGame().getMap().getTiles()[packet.getTargetGridX()][packet
				.getTargetGridY()].getTopUnit();

		if (unit.equals(attackingUnit) || unit.equals(targetUnit)) {
			healthbar.setHealth(unit.getHealth());
		}
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

	@Override
	public void onClose() {
		super.onClose();

		Civilization.getInstance().getEventManager().removeListener(ResizeListener.class, this);
	}

	public Unit getUnit() {
		return unit;
	}
}
