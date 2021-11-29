package me.rhin.openciv.ui.window.type;

import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.graphics.g2d.Sprite;
import com.badlogic.gdx.scenes.scene2d.Actor;

import me.rhin.openciv.asset.TextureEnum;

public class TitleOverlay extends Actor {

	private Sprite backgroundSprite;
	private static final int IMAGE_WIDTH = 1600;
	private static final int IMAGE_HEIGHT = 900;

	public TitleOverlay() {
		this.backgroundSprite = TextureEnum.UI_BACKGROUND.sprite();
		backgroundSprite.setSize(Gdx.graphics.getWidth(), Gdx.graphics.getHeight());
		backgroundSprite.setBounds(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
	}

	@Override
	public void draw(Batch batch, float parentAlpha) {
		backgroundSprite.draw(batch);
	}

	@Override
	public void setSize(float width, float height) {
		super.setSize(width, height);

		if (width > IMAGE_WIDTH)
			backgroundSprite.setSize(width, backgroundSprite.getHeight());
		else
			backgroundSprite.setSize(IMAGE_WIDTH, backgroundSprite.getHeight());

		if (height > IMAGE_HEIGHT)
			backgroundSprite.setSize(backgroundSprite.getWidth(), height);
		else
			backgroundSprite.setSize(backgroundSprite.getWidth(), IMAGE_HEIGHT);
	}
}
