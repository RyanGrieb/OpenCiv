package me.rhin.openciv.ui.list.type;

import java.util.ArrayList;

import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.graphics.g2d.Sprite;
import com.badlogic.gdx.scenes.scene2d.Actor;

import me.rhin.openciv.asset.TextureEnum;

public class ListUnemployedCitizens extends Actor {
	// TODO: There really should be a Horizontal List class

	private Sprite backgroundSprite;
	private ArrayList<Sprite> citizenIcons;

	public ListUnemployedCitizens(int width, int height) {
		this.setSize(width, height);

		this.backgroundSprite = TextureEnum.UI_GRAY.sprite();
		this.backgroundSprite.setSize(width, height);

		this.citizenIcons = new ArrayList<>();
	}

	public ListUnemployedCitizens(int amount, int width, int height) {
		this(width, height);
		setCitizens(amount);
	}

	@Override
	public void draw(Batch batch, float parentAlpha) {
		backgroundSprite.draw(batch);

		for (Sprite sprite : citizenIcons)
			sprite.draw(batch);
	}

	@Override
	public void setPosition(float x, float y) {
		super.setPosition(x, y);
		backgroundSprite.setPosition(x, y);

		// TODO: Compress unemployed citizens positions if we can't fit
		for (int i = 0; i < citizenIcons.size(); i++) {
			float xPos = x + ((i == 0) ? 0 : citizenIcons.get(i).getWidth() * i);
			citizenIcons.get(i).setPosition(xPos, y);
		}
	}

	public void setCitizens(int amount) {
		citizenIcons.clear();

		for (int i = 0; i < amount; i++) {
			Sprite sprite = TextureEnum.ICON_CITIZEN_LOCKED.sprite();
			sprite.setSize(32, 32);
			float xPos = getX() + ((i == 0) ? 0 : sprite.getWidth() * i);
			sprite.setPosition(xPos, getY());
			citizenIcons.add(sprite);
		}
	}
}
