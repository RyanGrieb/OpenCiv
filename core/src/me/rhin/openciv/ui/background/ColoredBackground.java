package me.rhin.openciv.ui.background;

import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.graphics.g2d.Sprite;
import com.badlogic.gdx.scenes.scene2d.Actor;

public class ColoredBackground extends Actor {

	private Sprite sprite;

	public ColoredBackground(Sprite sprite, float x, float y, float width, float height) {
		this.setBounds(x, y, width, height);
		this.sprite = sprite;
		sprite.setBounds(x, y, width, height);
	}

	@Override
	public void setPosition(float x, float y) {
		super.setPosition(x, y);
		sprite.setPosition(x, y);
	}

	@Override
	public void draw(Batch batch, float parentAlpha) {
		sprite.draw(batch);
	}

}