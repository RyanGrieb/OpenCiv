package me.rhin.openciv.ui.window.type;

import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.graphics.g2d.Sprite;
import com.badlogic.gdx.scenes.scene2d.Actor;

import me.rhin.openciv.asset.TextureEnum;

public class TitleOverlay extends Actor {

	private Sprite backgroundSprite;
	
	public TitleOverlay() {
		this.backgroundSprite = TextureEnum.UI_BACKGROUND.sprite();
		backgroundSprite.setSize(Gdx.graphics.getWidth(), Gdx.graphics.getHeight());
		backgroundSprite.setPosition(0, 0);
	}

	@Override
	public void draw (Batch batch, float parentAlpha) {
		backgroundSprite.draw(batch);
	}
}
