package me.rhin.openciv.ui.overlay;

import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.graphics.g2d.Sprite;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.unit.Unit;

public class TitleOverlay extends Overlay {

	private Sprite backgroundSprite;
	
	public TitleOverlay() {
		this.backgroundSprite = TextureEnum.UI_BACKGROUND.sprite();
		backgroundSprite.setSize(Gdx.graphics.getWidth(), Gdx.graphics.getHeight());
		backgroundSprite.setPosition(0, 0);
	}

	@Override
	public void draw() {
		getBatch().begin();
		backgroundSprite.draw(getBatch());
		getBatch().end();
	}
}
