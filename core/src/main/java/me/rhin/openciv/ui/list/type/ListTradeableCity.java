package me.rhin.openciv.ui.list.type;

import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.graphics.g2d.Sprite;
import com.badlogic.gdx.scenes.scene2d.Actor;
import com.badlogic.gdx.scenes.scene2d.InputEvent;
import com.badlogic.gdx.scenes.scene2d.utils.ClickListener;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.unit.type.Caravan.CaravanUnit;
import me.rhin.openciv.shared.packet.type.TradeCityPacket;
import me.rhin.openciv.ui.label.CustomLabel;
import me.rhin.openciv.ui.list.ListObject;
import me.rhin.openciv.ui.window.type.TradeWindow;

public class ListTradeableCity extends ListObject {

	private City city;
	//FIXME: Use colored backgrounds?
	private Sprite hoveredBackgroundSprite;
	private Sprite backgroundSprite;
	private Sprite citySprite;
	private Sprite capitalSprite;
	private Sprite cityOwnerSprite;
	private CustomLabel cityNameLabel;
	private boolean hovered;

	public ListTradeableCity(final City city, CaravanUnit caravanUnit, float width, float height) {
		super(width, height, city.getName());

		this.city = city;
		backgroundSprite = TextureEnum.UI_DARK_GRAY.sprite();
		backgroundSprite.setSize(width, height);

		this.hoveredBackgroundSprite = TextureEnum.UI_GRAY.sprite();
		this.hoveredBackgroundSprite.setSize(width, height);

		this.citySprite = TextureEnum.TILE_CITY.sprite();
		citySprite.setSize(32, 32);

		this.cityOwnerSprite = city.getPlayerOwner().getCivilization().getIcon().sprite();
		cityOwnerSprite.setSize(32, 32);

		// TODO: Distinguish capital cities
		// this.capitalSprite = TextureEnum.UI_STAR.sprite();
		// capitalSprite.setSize(32, 32);

		this.cityNameLabel = new CustomLabel(city.getName());
		addActor(cityNameLabel);

		this.addListener(new ClickListener() {
			@Override
			public void clicked(InputEvent event, float x, float y) {
				System.out.println("Trade w/ city: " + city.getName());

				TradeCityPacket packet = new TradeCityPacket();
				packet.setCity(city.getName(), caravanUnit.getID(), caravanUnit.getStandingTile().getGridX(),
						caravanUnit.getStandingTile().getGridY());
				Civilization.getInstance().getNetworkManager().sendPacket(packet);

				Civilization.getInstance().getWindowManager().closeWindow(TradeWindow.class);
			}

			@Override
			public void enter(InputEvent event, float x, float y, int pointer, Actor fromActor) {
				hovered = true;
			}

			@Override
			public void exit(InputEvent event, float x, float y, int pointer, Actor fromActor) {
				hovered = false;
			}
		});

		// Update our initial positions
		setPosition(getX(), getY());
	}

	@Override
	public void draw(Batch batch, float parentAlpha) {
		if (hovered)
			hoveredBackgroundSprite.draw(batch);
		else
			backgroundSprite.draw(batch);

		citySprite.draw(batch);
		cityOwnerSprite.draw(batch);
		super.draw(batch, parentAlpha);
	}

	@Override
	public void setPosition(float x, float y) {
		super.setPosition(x, y);
		backgroundSprite.setPosition(x, y);
		hoveredBackgroundSprite.setPosition(x, y);
		citySprite.setPosition(4, y + 5);
		cityNameLabel.setPosition(citySprite.getX() + citySprite.getWidth() + 4,
				citySprite.getY() + citySprite.getHeight() / 2 - cityNameLabel.getHeight() / 2);
		cityOwnerSprite.setPosition(getWidth() - 48, y + 5);
	}

}
