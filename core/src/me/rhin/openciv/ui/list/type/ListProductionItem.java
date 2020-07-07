package me.rhin.openciv.ui.list.type;

import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.graphics.g2d.Sprite;
import com.badlogic.gdx.utils.Align;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.production.ProductionItem;
import me.rhin.openciv.shared.stat.Stat;
import me.rhin.openciv.ui.label.CustomLabel;
import me.rhin.openciv.ui.list.ListItem;

public class ListProductionItem extends ListItem {

	private ProductionItem productionItem;
	private CustomLabel itemNameLabel;
	private CustomLabel itemTurnCostLabel;
	private Sprite itemIconSprite;
	private Sprite backgroundSprite;

	public ListProductionItem(City city, ProductionItem productionItem, float width, float height) {
		super(width, height);
		this.productionItem = productionItem;
		this.backgroundSprite = TextureEnum.UI_GRAY.sprite();
		this.backgroundSprite.setSize(width, height);

		itemIconSprite = productionItem.getTexture().sprite();
		itemIconSprite.setSize(32, 32);

		this.itemNameLabel = new CustomLabel(productionItem.getName());
		itemNameLabel.setSize(width, height);
		itemNameLabel.setAlignment(Align.topLeft);
		// FIXME: In the future, we need to divide by the already applied production to
		// the item.
		this.itemTurnCostLabel = new CustomLabel(
				(int) (productionItem.getProductionCost() / city.getStatLine().getStatValue(Stat.PRODUCTION_GAIN))
						+ " Turns");
		itemTurnCostLabel.setSize(width, height);
		itemTurnCostLabel.setAlignment(Align.bottomLeft);
	}

	@Override
	public void draw(Batch batch, float parentAlpha) {
		backgroundSprite.draw(batch);
		itemIconSprite.draw(batch);
		itemNameLabel.draw(batch, parentAlpha);
		itemTurnCostLabel.draw(batch, parentAlpha);
	}

	@Override
	public void setPosition(float x, float y) {
		super.setPosition(x, y);
		backgroundSprite.setPosition(x, y);
		itemIconSprite.setPosition(x + width - itemIconSprite.getWidth(), y);
		itemNameLabel.setPosition(x, y);
		itemTurnCostLabel.setPosition(x, y);
	}
}
