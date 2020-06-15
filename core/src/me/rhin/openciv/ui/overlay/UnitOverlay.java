package me.rhin.openciv.ui.overlay;

import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.scenes.scene2d.Action;
import com.badlogic.gdx.utils.Align;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.unit.Unit;
import me.rhin.openciv.ui.background.BlankBackground;
import me.rhin.openciv.ui.button.ButtonManager;
import me.rhin.openciv.ui.button.type.UnitActionButton;
import me.rhin.openciv.ui.label.CustomLabel;

//TODO: This should implement listener for unit health, and movement cooldown.
public class UnitOverlay extends Overlay {

	private ButtonManager buttonManager;
	private CustomLabel unitNameLabel;
	private CustomLabel movementLabel;
	private BlankBackground blankBackground;
	private UnitActionButton unitActionButton;

	private Unit unit;

	public UnitOverlay(Unit unit) {
		this.unit = unit;
		this.buttonManager = new ButtonManager(this);
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

		for (Action action : unit.getCustomActions()) {
			buttonManager.addButton(new UnitActionButton(unit, action, viewport.getWorldWidth() - 200 + 3, 50, 70, 30));
		}
	}

	@Override
	public void draw() {
		super.draw();
		// FIXME: Just create an event that the unit calls when it update's it's
		// currentMovement
		movementLabel.setText("Movement: " + (int) unit.getCurrentMovement() + "/" + unit.getMaxMovement());
	}
}
