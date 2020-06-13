package me.rhin.openciv.ui.background;

import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.graphics.g2d.Sprite;
import com.badlogic.gdx.scenes.scene2d.Actor;

import me.rhin.openciv.asset.TextureEnum;

public class BlankBackground extends Actor {

	private Sprite sprite;

	public BlankBackground(float x, float y, float width, float height) {
		this.sprite = TextureEnum.UI_BLACK.sprite();
		sprite.setPosition(x, y);
		sprite.setSize(width, height);
		
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
	}

}
