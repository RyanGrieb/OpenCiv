package me.rhin.openciv.ui.game;

import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.graphics.g2d.Sprite;
import com.badlogic.gdx.scenes.scene2d.Actor;
import com.badlogic.gdx.utils.Align;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.ui.label.CustomLabel;

public class StatusBar extends Actor {

	private Sprite sprite;

	private CustomLabel scienceDescLabel, hertiageDescLabel, goldDescLabel;
	private Sprite scienceIcon, heritageIcon, goldIcon;
	private CustomLabel scienceLabel, hertiageLabel, goldLabel;

	public StatusBar(float x, float y, float width, float height) {
		this.setPosition(x, y);
		this.setSize(width, height);
		this.sprite = TextureEnum.UI_BLACK.sprite();
		sprite.setPosition(x, y);
		sprite.setSize(width, height);

		this.scienceDescLabel = new CustomLabel("Science:");
		this.scienceIcon = TextureEnum.ICON_RESEARCH.sprite();
		scienceIcon.setSize(12, 12);
		this.scienceLabel = new CustomLabel("0");

		this.hertiageDescLabel = new CustomLabel("Hertiage:");
		this.heritageIcon = TextureEnum.ICON_HERITAGE.sprite();
		heritageIcon.setSize(12, 12);
		this.hertiageLabel = new CustomLabel("0");

		this.goldDescLabel = new CustomLabel("Gold:");
		this.goldIcon = TextureEnum.ICON_GOLD.sprite();
		goldIcon.setSize(12, 12);
		this.goldLabel = new CustomLabel("0");

		updatePositions();
	}

	@Override
	public void act(float delta) {
		super.act(delta);
	}

	@Override
	public void draw(Batch batch, float parentAlpha) {
		sprite.draw(batch);

		scienceDescLabel.draw(batch, parentAlpha);
		hertiageDescLabel.draw(batch, parentAlpha);
		goldDescLabel.draw(batch, parentAlpha);

		scienceIcon.draw(batch);
		heritageIcon.draw(batch);
		goldIcon.draw(batch);

		scienceLabel.draw(batch, parentAlpha);
		hertiageLabel.draw(batch, parentAlpha);
		goldLabel.draw(batch, parentAlpha);
	}

	private void updatePositions() {
		float x = getX();
		float y = getY();
		float originX = x + 3;

		scienceDescLabel.setPosition(originX, y + scienceDescLabel.getHeight() / 2);

		originX += scienceDescLabel.getWidth() + 5;
		scienceIcon.setPosition(originX, y + 4);

		originX += scienceIcon.getWidth() + 5;
		scienceLabel.setPosition(originX, y + scienceLabel.getHeight() / 2);

		originX += scienceLabel.getWidth() + 15;
		hertiageDescLabel.setPosition(originX, y + hertiageDescLabel.getHeight() / 2);

		originX += hertiageDescLabel.getWidth() + 5;
		heritageIcon.setPosition(originX, y + 4);

		originX += heritageIcon.getWidth() + 5;
		hertiageLabel.setPosition(originX, y + hertiageLabel.getHeight() / 2);

		originX += hertiageLabel.getWidth() + 15;
		goldDescLabel.setPosition(originX, y + goldDescLabel.getHeight() / 2);

		originX += goldDescLabel.getWidth() + 5;
		goldIcon.setPosition(originX, y + 4);

		originX += goldIcon.getWidth() + 5;
		goldLabel.setPosition(originX, y + goldLabel.getHeight() / 2);
	}
}
