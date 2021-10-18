package me.rhin.openciv.game.map.tile;

import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.graphics.g2d.Sprite;
import com.badlogic.gdx.scenes.scene2d.Actor;

import me.rhin.openciv.asset.TextureEnum;

public class CombatActor extends Actor {

	private Sprite sprite;
	private TextureEnum textureEnum;

	public CombatActor(TextureEnum textureEnum, float x, float y, float width, float height) {
		this.textureEnum = textureEnum;
		this.setBounds(x, y, width, height);
		this.sprite = textureEnum.sprite();
		sprite.setBounds(x, y, width, height);
	}

	@Override
	public void draw(Batch batch, float parentAlpha) {
		sprite.setAlpha(sprite.getColor().a - 0.01F);
		sprite.draw(batch);
	}

	public Sprite getSprite() {
		return sprite;
	}
}
