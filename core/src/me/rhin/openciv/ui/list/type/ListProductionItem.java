package me.rhin.openciv.ui.list.type;

import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.graphics.g2d.Sprite;
import com.badlogic.gdx.utils.Align;

import me.rhin.openciv.game.production.ProductionItem;
import me.rhin.openciv.ui.label.CustomLabel;
import me.rhin.openciv.ui.list.ListItem;

public class ListProductionItem extends ListItem {

	private ProductionItem productionItem;
	private CustomLabel itemNameLabel;
	private Sprite itemIconSprite;
	private Sprite backgroundSprite;

	public ListProductionItem(ProductionItem productionItem, float width, float height) {
		super(width, height);
		this.productionItem = productionItem;
		this.itemNameLabel = new CustomLabel(productionItem.getName());
		itemNameLabel.setSize(width, height);
		itemNameLabel.setAlignment(Align.topLeft);
	}

	@Override
	public void draw(Batch batch, float parentAlpha) {
		itemNameLabel.draw(batch, parentAlpha);
	}

	@Override
	public void setPosition(float x, float y) {
		super.setPosition(x, y);
		itemNameLabel.setPosition(x, y);
	}
}
