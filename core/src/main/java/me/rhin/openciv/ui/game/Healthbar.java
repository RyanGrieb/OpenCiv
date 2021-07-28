package me.rhin.openciv.ui.game;

import com.badlogic.gdx.scenes.scene2d.Group;
import com.badlogic.gdx.utils.Align;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.ui.background.ColoredBackground;
import me.rhin.openciv.ui.label.CustomLabel;

public class Healthbar extends Group {

	private ColoredBackground backgroundHealthBarActor;
	private ColoredBackground healthBarActor;
	private CustomLabel healthLabel;
	private float originalWidth;
	private boolean showLabel;

	public Healthbar(float x, float y, float width, float height) {
		super.setBounds(x, y, width, height);
		this.originalWidth = width;

		this.backgroundHealthBarActor = new ColoredBackground(TextureEnum.UI_RED.sprite(), 0, 0, width, height);
		addActor(backgroundHealthBarActor);

		this.healthBarActor = new ColoredBackground(TextureEnum.UI_GREEN.sprite(), 0, 0, width, height);
		addActor(healthBarActor);

		this.healthLabel = new CustomLabel("100%");
		healthLabel.setBounds(0, 0, width, height);
		healthLabel.setAlignment(Align.center);
	}

	public Healthbar(float x, float y, float width, float height, boolean showLabel) {
		this(x, y, width, height);
		this.showLabel = showLabel;

		if (showLabel)
			addActor(healthLabel);
	}

	@Override
	public void setPosition(float x, float y) {
		super.setPosition(x, y);
		backgroundHealthBarActor.setPosition(0, 0);
		healthBarActor.setPosition(0, 0);
		healthLabel.setPosition(0, 0);
	}

	public void setHealth(float maxHealth, float amount) {
		if (amount < 0)
			amount = 0;

		if (amount > maxHealth)
			amount = maxHealth;

		// FIXME: Account for setting health back to a greater value
		healthLabel.setText((int) ((amount / maxHealth) * 100) + "%");
		healthLabel.setBounds(0, 0, getWidth(), getHeight());
		healthLabel.setAlignment(Align.center);

		float newWidth = (originalWidth * (amount / maxHealth));
		healthBarActor.setWidth(newWidth);
	}
}
