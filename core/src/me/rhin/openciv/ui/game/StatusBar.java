package me.rhin.openciv.ui.game;

import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.graphics.g2d.Sprite;
import com.badlogic.gdx.scenes.scene2d.Actor;
import com.badlogic.gdx.utils.Align;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.ui.label.CustomLabel;

public class StatusBar extends Actor {

	private Sprite sprite;
	private CustomLabel scienceDescLabel;
	private Sprite scienceIcon;
	private CustomLabel scienceLabel;

	public StatusBar(float x, float y, float width, float height) {
		this.sprite = TextureEnum.UI_BLACK.sprite();
		sprite.setPosition(x, y);
		sprite.setSize(width, height);

		this.scienceDescLabel = new CustomLabel("Science:");
		scienceDescLabel.setPosition(x + 3, y);
		scienceDescLabel.setSize(40, 20);

		this.scienceIcon = TextureEnum.ICON_RESEARCH.sprite();
		scienceIcon.setPosition(x + 75, y + 4);
		scienceIcon.setSize(12, 12);

		this.scienceLabel = new CustomLabel("0");
		scienceLabel.setPosition(x + 75, y);
		scienceLabel.setSize(40, 20);

		scienceLabel.setAlignment(Align.center);

		this.setPosition(x, y);
		this.setSize(width, height);
	}

	@Override
	public void act(float delta) {
		super.act(delta);
	}

	@Override
	public void draw(Batch batch, float parentAlpha) {
		sprite.draw(batch);
		scienceDescLabel.draw(batch, parentAlpha);
		scienceIcon.draw(batch);
		scienceLabel.draw(batch, parentAlpha);
	}

}
