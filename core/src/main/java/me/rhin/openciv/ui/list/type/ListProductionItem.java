package me.rhin.openciv.ui.list.type;

import com.badlogic.gdx.graphics.Color;
import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.graphics.g2d.Sprite;
import com.badlogic.gdx.scenes.scene2d.Actor;
import com.badlogic.gdx.scenes.scene2d.InputEvent;
import com.badlogic.gdx.scenes.scene2d.utils.ClickListener;
import com.badlogic.gdx.utils.Align;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.production.ProductionItem;
import me.rhin.openciv.listener.CityStatUpdateListener;
import me.rhin.openciv.shared.packet.type.CityStatUpdatePacket;
import me.rhin.openciv.shared.stat.Stat;
import me.rhin.openciv.ui.label.CustomLabel;
import me.rhin.openciv.ui.list.ContainerList;
import me.rhin.openciv.ui.list.ListObject;
import me.rhin.openciv.ui.window.type.ItemInfoWindow;

public class ListProductionItem extends ListObject implements CityStatUpdateListener {

	private City city;
	private ProductionItem productionItem;
	private CustomLabel itemNameLabel;
	private CustomLabel itemTurnCostLabel;
	private CustomLabel productionModifierLabel;
	private Sprite itemIconSprite;
	private Sprite backgroundSprite;
	private Sprite hoveredBackgroundSprite;
	private boolean hovered;

	public ListProductionItem(final City city, final ProductionItem productionItem, ContainerList containerList,
			float width, float height) {
		super(width, height, containerList, "ProductionItem");

		this.city = city;
		this.productionItem = productionItem;
		this.backgroundSprite = TextureEnum.UI_GRAY.sprite();
		this.backgroundSprite.setSize(width, height);

		this.hoveredBackgroundSprite = TextureEnum.UI_DARK_GRAY.sprite();
		this.hoveredBackgroundSprite.setSize(width, height);

		itemIconSprite = productionItem.getTexture().sprite();
		itemIconSprite.setSize(32, 32);

		this.itemNameLabel = new CustomLabel(productionItem.getName());
		itemNameLabel.setSize(width, height);
		itemNameLabel.setAlignment(Align.topLeft);

		this.itemTurnCostLabel = new CustomLabel((int) Math
				.ceil((productionItem.getProductionCost() / city.getStatLine().getStatValue(Stat.PRODUCTION_GAIN)))
				+ " Turns");

		itemTurnCostLabel.setSize(width, height);
		itemTurnCostLabel.setAlignment(Align.bottomLeft);

		this.productionModifierLabel = new CustomLabel(
				"(+" + (int) (100 * Math.abs(productionItem.getProductionModifier())) + "%)");
		productionModifierLabel.setColor(Color.GREEN);
		productionModifierLabel.setSize(width, height);
		productionModifierLabel.setAlignment(Align.center);

		this.hovered = false;

		this.addListener(new ClickListener() {
			@Override
			public void clicked(InputEvent event, float x, float y) {
				// city.getProducibleItemManager().requestSetProductionItem(productionItem);
				if (!Civilization.getInstance().getWindowManager().allowsInput())
					return;

				Civilization.getInstance().getWindowManager().addWindow(new ItemInfoWindow(city, productionItem));
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

		Civilization.getInstance().getEventManager().addListener(CityStatUpdateListener.class, this);
	}

	@Override
	public void onCityStatUpdate(CityStatUpdatePacket packet) {
		itemTurnCostLabel.setText((int) Math
				.ceil((productionItem.getProductionCost() / city.getStatLine().getStatValue(Stat.PRODUCTION_GAIN)))
				+ " Turns");

		this.productionModifierLabel
				.setText("(+" + (int) (100 * Math.abs(productionItem.getProductionModifier())) + "%)");
		productionModifierLabel.setSize(getWidth(), getHeight());
		productionModifierLabel.setAlignment(Align.center);
	}

	@Override
	public void clearListeners() {
		super.clearListeners();
		Civilization.getInstance().getEventManager().clearListenersFromObject(this);
	}

	@Override
	public void draw(Batch batch, float parentAlpha) {
		if (hovered)
			hoveredBackgroundSprite.draw(batch);
		else
			backgroundSprite.draw(batch);
		itemIconSprite.draw(batch);
		itemNameLabel.draw(batch, parentAlpha);
		itemTurnCostLabel.draw(batch, parentAlpha);
		if (Math.abs(productionItem.getProductionModifier()) > 0)
			productionModifierLabel.draw(batch, parentAlpha);

		super.draw(batch, parentAlpha);
	}

	@Override
	public void setPosition(float x, float y) {
		super.setPosition(x, y);
		backgroundSprite.setPosition(x, y);
		hoveredBackgroundSprite.setPosition(x, y);
		itemIconSprite.setPosition(x + getWidth() - itemIconSprite.getWidth(), y);
		itemNameLabel.setPosition(x, y);
		itemTurnCostLabel.setPosition(x, y);
		productionModifierLabel.setPosition(x, y);
	}

	public ProductionItem getProductionItem() {
		return productionItem;
	}

	@Override
	public int compareTo(ListObject listObj) {
		ListProductionItem listProductionItem = (ListProductionItem) listObj;
		return Integer.compare((int) listProductionItem.getProductionItem().getProductionCost(),
				(int) productionItem.getProductionCost());
	}
}
