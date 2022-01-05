package me.rhin.openciv.ui.list.type;

import java.util.ArrayList;

import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.graphics.g2d.Sprite;
import com.badlogic.gdx.scenes.scene2d.actions.Actions;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.ui.button.Button;
import me.rhin.openciv.ui.button.type.SpecialistCitizenButton;
import me.rhin.openciv.ui.list.ContainerList;
import me.rhin.openciv.ui.list.ListObject;

public class ListUnemployedCitizens extends ListObject {
	// TODO: There really should be a Horizontal List class

	private City city;
	private Sprite backgroundSprite;
	private ArrayList<Button> citizenButtons;

	public ListUnemployedCitizens(City city, ContainerList containerList, int width, int height) {
		super(width, height, containerList, "UnemployedCitizens");

		this.city = city;
		this.backgroundSprite = TextureEnum.UI_GRAY.sprite();
		this.backgroundSprite.setSize(width, height);

		this.citizenButtons = new ArrayList<>();
	}

	public ListUnemployedCitizens(City city, int amount, ContainerList containerList, int width, int height) {
		this(city, containerList, width, height);
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
		for (Button button : citizenButtons) {
			button.addAction(Actions.removeActor());
		}
		citizenButtons.clear();
		for (int i = 0; i < amount; i++) {
			float xPos = 0 + ((i == 0) ? 4 : 21 * i);
			SpecialistCitizenButton button = new SpecialistCitizenButton(city, city, xPos, 21 / 2, 21, 21);
			addActor(button);
			citizenButtons.add(button);
		}
	}
}
