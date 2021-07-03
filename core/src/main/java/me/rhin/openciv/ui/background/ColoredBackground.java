package me.rhin.openciv.ui.background;

import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.graphics.g2d.Sprite;
import com.badlogic.gdx.scenes.scene2d.Actor;

public class ColoredBackground extends Actor {

	private Sprite sprite;

	public ColoredBackground(Sprite sprite, float x, float y, float width, float height) {
		super.setBounds(x, y, width, height);

		this.sprite = sprite;
		sprite.setBounds(x, y, width, height);
	}

	@Override
	public void setPosition(float x, float y) {
		super.setPosition(x, y);
		sprite.setPosition(x, y);
	}

	@Override
	public void setBounds(float x, float y, float width, float height) {
		super.setBounds(x, y, width, height);
		sprite.setBounds(x, y, width, height);
	}

	@Override
	public void draw(Batch batch, float parentAlpha) {
		sprite.draw(batch);
	}

	@Override
	public void setWidth(float width) {
		super.setWidth(width);
		sprite.setSize(width, sprite.getHeight());
	}

	public void setSprite(Sprite sprite) {
		this.sprite = sprite;
	}
}