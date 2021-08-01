package me.rhin.openciv.ui.list.type;

import com.badlogic.gdx.graphics.Color;
import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.graphics.g2d.Sprite;
import com.badlogic.gdx.scenes.scene2d.Actor;
import com.badlogic.gdx.scenes.scene2d.InputEvent;
import com.badlogic.gdx.scenes.scene2d.utils.ClickListener;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.unit.type.Caravan.CaravanUnit;
import me.rhin.openciv.ui.label.CustomLabel;
import me.rhin.openciv.ui.list.ListObject;

public class ListUntradeableCity extends ListObject {

	private City city;
	private Sprite hoveredBackgroundSprite;
	private Sprite backgroundSprite;
	private Sprite citySprite;
	private Sprite capitalSprite;
	private CustomLabel cityNameLabel;
	private CustomLabel untradeReasonLabel;
	private boolean hovered;

	public ListUntradeableCity(final City city, String untradeableReason, float width, float height) {
		super(width, height, city.getName());

		this.city = city;
		backgroundSprite = TextureEnum.UI_DARK_GRAY.sprite();
		backgroundSprite.setSize(width, height);

		this.hoveredBackgroundSprite = TextureEnum.UI_GRAY.sprite();
		this.hoveredBackgroundSprite.setSize(width, height);

		this.citySprite = TextureEnum.TILE_CITY.sprite();
		citySprite.setSize(32, 32);

		this.untradeReasonLabel = new CustomLabel(untradeableReason);
		untradeReasonLabel.setColor(Color.RED);
		addActor(untradeReasonLabel);

		// TODO: Distinguish capital cities
		// this.capitalSprite = TextureEnum.UI_STAR.sprite();
		// capitalSprite.setSize(32, 32);

		this.cityNameLabel = new CustomLabel(city.getName());
		addActor(cityNameLabel);

		this.addListener(new ClickListener() {
			@Override
			public void clicked(InputEvent event, float x, float y) {

			}

			@Override
			public void enter(InputEvent event, float x, float y, int pointer, Actor fromActor) {
				// hovered = true;
			}

			@Override
			public void exit(InputEvent event, float x, float y, int pointer, Actor fromActor) {
				// hovered = false;
			}
		});
	}

	@Override
	public void draw(Batch batch, float parentAlpha) {
		if (hovered)
			hoveredBackgroundSprite.draw(batch);
		else
			backgroundSprite.draw(batch);

		citySprite.draw(batch);
		super.draw(batch, parentAlpha);
	}

	@Override
	public void setPosition(float x, float y) {
		super.setPosition(x, y);
		backgroundSprite.setPosition(x, y);
		hoveredBackgroundSprite.setPosition(x, y);
		citySprite.setPosition(x + getHeight() / 2 - 16, y + 5);

		cityNameLabel.setPosition(40, getHeight() - 18);
		untradeReasonLabel.setPosition(40, 10);
	}
}
