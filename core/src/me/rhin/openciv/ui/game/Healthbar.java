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
	private float health;
	private float originalWidth;

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
		addActor(healthLabel);

		this.health = 100;
	}

	@Override
	public void setPosition(float x, float y) {
		super.setPosition(x, y);
		backgroundHealthBarActor.setPosition(0, 0);
		healthBarActor.setPosition(0, 0);
		healthLabel.setPosition(0, 0);
	}

	public float getHealth() {
		return health;
	}

	public void setHealth(float amount) {
		// FIXME: Account for setting health back to a greater value
		healthLabel.setText((int) amount + "%");
		healthLabel.setBounds(0, 0, getWidth(), getHeight());
		healthLabel.setAlignment(Align.center);

		float maxHealth = 100;
		this.health = amount;
		float newWidth = (originalWidth * (amount / maxHealth));
		healthBarActor.setWidth(newWidth);
	}
}
