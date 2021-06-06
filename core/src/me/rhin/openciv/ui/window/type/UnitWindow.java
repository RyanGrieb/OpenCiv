package me.rhin.openciv.ui.window.type;

import java.util.ArrayList;

import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.utils.Align;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.game.AbstractAction;
import me.rhin.openciv.game.unit.Unit;
import me.rhin.openciv.listener.ResizeListener;
import me.rhin.openciv.ui.background.BlankBackground;
import me.rhin.openciv.ui.button.Button;
import me.rhin.openciv.ui.button.type.UnitActionButton;
import me.rhin.openciv.ui.label.CustomLabel;
import me.rhin.openciv.ui.window.AbstractWindow;

public class UnitWindow extends AbstractWindow implements ResizeListener {

	private CustomLabel unitNameLabel;
	private CustomLabel movementLabel;
	private BlankBackground blankBackground;

	private Unit unit;
	private ArrayList<UnitActionButton> unitActionButtons;

	public UnitWindow(Unit unit) {
		this.unit = unit;
		this.unitActionButtons = new ArrayList<>();

		// viewport().getWorldWidth() - 200, 0, 200, 100;

		this.blankBackground = new BlankBackground(viewport.getWorldWidth() - 200, 0, 200, 100);
		addActor(blankBackground);

		this.unitNameLabel = new CustomLabel(unit.getName(), Align.center, viewport.getWorldWidth() - 200, 100 - 20,
				200, 20);
		addActor(unitNameLabel);

		this.movementLabel = new CustomLabel(
				"Movement: " + (int) unit.getCurrentMovement() + "/" + unit.getMaxMovement());
		movementLabel.setPosition((viewport.getWorldWidth() - (200 / 2)) - movementLabel.getWidth() / 2, 5);
		addActor(movementLabel);

		int index = 0;
		for (AbstractAction action : unit.getCustomActions()) {
			UnitActionButton actionButton = new UnitActionButton(unit, action, blankBackground.getX() + (75 * index),
					blankBackground.getY() + blankBackground.getHeight() / 2 - 20 / 2, 70, 30);
			unitActionButtons.add(actionButton);
			addActor(actionButton);
			index++;
		}

		Civilization.getInstance().getEventManager().addListener(ResizeListener.class, this);
	}

	@Override
	public void draw(Batch batch, float parentAlpha) {
		super.draw(batch, parentAlpha);
		// FIXME: This is not ideal
		movementLabel.setText("Movement: " + (int) unit.getCurrentMovement() + "/" + unit.getMaxMovement());
	}

	@Override
	public void onResize(int width, int height) {
		blankBackground.setPosition(width - 200, 0);
		unitNameLabel.setPosition(width - 200, 100 - 20);
		movementLabel.setPosition((width - (200 / 2)) - movementLabel.getWidth() / 2, 5);

		int index = 0;
		for (UnitActionButton actionButton : unitActionButtons) {
			actionButton.setPosition(blankBackground.getX() + (75 * index),
					blankBackground.getY() + blankBackground.getHeight() / 2 - 20 / 2);
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
		return true;
	}

	@Override
	public boolean closesGameDisplayWindows() {
		return false;
	}

}
