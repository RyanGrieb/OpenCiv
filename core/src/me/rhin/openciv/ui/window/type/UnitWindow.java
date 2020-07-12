package me.rhin.openciv.ui.window.type;

import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.utils.Align;

import me.rhin.openciv.game.AbstractAction;
import me.rhin.openciv.game.unit.Unit;
import me.rhin.openciv.ui.background.BlankBackground;
import me.rhin.openciv.ui.button.type.UnitActionButton;
import me.rhin.openciv.ui.label.CustomLabel;
import me.rhin.openciv.ui.window.AbstractWindow;

public class UnitWindow extends AbstractWindow {
	private CustomLabel unitNameLabel;
	private CustomLabel movementLabel;
	private BlankBackground blankBackground;
	private UnitActionButton unitActionButton;

	private Unit unit;

	public UnitWindow(Unit unit) {
		this.unit = unit;
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

		for (AbstractAction action : unit.getCustomActions()) {
			addActor(new UnitActionButton(unit, action, viewport.getWorldWidth() - 200 + 3, 50, 70, 30));
		}
	}

	@Override
	public void draw(Batch batch, float parentAlpha) {
		super.draw(batch, parentAlpha);
		// FIXME: This is not ideal
		movementLabel.setText("Movement: " + (int) unit.getCurrentMovement() + "/" + unit.getMaxMovement());
	}

	@Override
	public boolean disablesInput() {
		return false;
	}

	@Override
	public boolean closesOtherWindows() {
		return true;
	}
}
