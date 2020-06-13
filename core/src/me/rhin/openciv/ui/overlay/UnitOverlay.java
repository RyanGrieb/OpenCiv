package me.rhin.openciv.ui.overlay;

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
	private BlankBackground blankBackground;
	private UnitActionButton unitActionButton;

	public UnitOverlay(Unit unit) {
		this.buttonManager = new ButtonManager(this);
		// viewport().getWorldWidth() - 200, 0, 200, 100;

		this.blankBackground = new BlankBackground(viewport.getWorldWidth() - 200, 0, 200, 100);
		addActor(blankBackground);

		this.unitNameLabel = new CustomLabel(unit.getName(), Align.center, viewport.getWorldWidth() - 200, 100 - 20,
				200, 20);
		addActor(unitNameLabel);

		for (Action action : unit.getCustomActions()) {
			buttonManager.addButton(new UnitActionButton(unit, action, viewport.getWorldWidth() - 200 + 3, 50, 70, 30));
		}
	}
}
