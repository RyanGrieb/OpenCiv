package me.rhin.openciv.ui.list.type;

import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.graphics.g2d.Sprite;
import com.badlogic.gdx.scenes.scene2d.Actor;
import com.badlogic.gdx.scenes.scene2d.InputEvent;
import com.badlogic.gdx.scenes.scene2d.utils.ClickListener;
import com.badlogic.gdx.utils.Align;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.production.ProductionItem;
import me.rhin.openciv.shared.stat.Stat;
import me.rhin.openciv.ui.label.CustomLabel;
import me.rhin.openciv.ui.list.ListObject;

public class ListProductionItem extends ListObject {

	private City city;
	private ProductionItem productionItem;
	private CustomLabel itemNameLabel;
	private CustomLabel itemTurnCostLabel;
	private Sprite itemIconSprite;
	private Sprite backgroundSprite;
	private Sprite hoveredBackgroundSprite;
	private boolean hovered;

	public ListProductionItem(final City city, final ProductionItem productionItem, float width, float height) {
		super(width, height, "ProductionItem");

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
		// FIXME: In the future, we need to divide by the already applied production to
		// the item.
		this.itemTurnCostLabel = new CustomLabel((int) Math
				.ceil((productionItem.getProductionCost() / city.getStatLine().getStatValue(Stat.PRODUCTION_GAIN)))
				+ " Turns");
		itemTurnCostLabel.setSize(width, height);
		itemTurnCostLabel.setAlignment(Align.bottomLeft);

		this.hovered = false;

		this.addListener(new ClickListener() {
			@Override
			public void clicked(InputEvent event, float x, float y) {
				city.getProducibleItemManager().requestSetProductionItem(productionItem);
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
	}
	
	public ProductionItem getProductionItem() {
		return productionItem;
	}
}
