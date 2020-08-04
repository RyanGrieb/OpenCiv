package me.rhin.openciv.ui.list.type;

import java.util.ArrayList;

import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.graphics.g2d.Sprite;
import com.badlogic.gdx.scenes.scene2d.Actor;
import com.badlogic.gdx.scenes.scene2d.Group;
import com.badlogic.gdx.scenes.scene2d.InputEvent;
import com.badlogic.gdx.scenes.scene2d.utils.ClickListener;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.ui.button.Button;
import me.rhin.openciv.ui.button.type.UnemployedCitizenButton;

public class ListUnemployedCitizens extends Group {
	// TODO: There really should be a Horizontal List class

	private Sprite backgroundSprite;
	private ArrayList<Button> citizenButtons;

	public ListUnemployedCitizens(int width, int height) {
		this.setSize(width, height);

		this.backgroundSprite = TextureEnum.UI_GRAY.sprite();
		this.backgroundSprite.setSize(width, height);

		this.citizenButtons = new ArrayList<>();
	}

	public ListUnemployedCitizens(int amount, int width, int height) {
		this(width, height);
		setCitizens(amount);
	}

	@Override
	public void draw(Batch batch, float parentAlpha) {
		backgroundSprite.draw(batch);
		super.draw(batch, parentAlpha);
	}

	@Override
	public void setPosition(float x, float y) {
		super.setPosition(x, y);
		backgroundSprite.setPosition(x, y);

		// TODO: Compress unemployed citizens positions if we can't fit
		for (int i = 0; i < citizenButtons.size(); i++) {
			float xPos = x + ((i == 0) ? 0 : citizenButtons.get(i).getWidth() * i);
			citizenButtons.get(i).setPosition(xPos, y);
		}
	}

	public void setCitizens(int amount) {
		citizenButtons.clear();

		for (int i = 0; i < amount; i++) {
			float xPos = 0 + ((i == 0) ? 0 : 32 * i);
			UnemployedCitizenButton button = new UnemployedCitizenButton(xPos, 0, 32, 32);
			addActor(button);
			citizenButtons.add(button);
		}
	}
}
