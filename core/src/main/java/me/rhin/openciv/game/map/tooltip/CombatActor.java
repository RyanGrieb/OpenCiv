package me.rhin.openciv.game.map.tooltip;

import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.graphics.g2d.Sprite;
import com.badlogic.gdx.scenes.scene2d.Actor;

import me.rhin.openciv.asset.TextureEnum;

public class CombatActor extends Actor {

	private Sprite sprite;
	private TextureEnum textureEnum;
	private boolean isVisible;

	public CombatActor(TextureEnum textureEnum, float x, float y, float width, float height) {
		this.textureEnum = textureEnum;
		this.sprite = textureEnum.sprite();
		this.isVisible = true;

		setBounds(x, y, width, height);
	}

	@Override
	public void draw(Batch batch, float parentAlpha) {
		sprite.setAlpha(sprite.getColor().a - 0.006F);
		sprite.draw(batch);

		if (sprite.getColor().a <= 0)
			isVisible = false;
	}

	@Override
	public void setBounds(float x, float y, float width, float height) {
		super.setBounds(x, y, width, height);
		sprite.setBounds(x, y, width, height);
	}

	public Sprite getSprite() {
		return sprite;
	}

	public boolean isVisible() {
		return isVisible;
	}

	public TextureEnum getTexture() {
		return textureEnum;
	}
}
