package me.rhin.openciv.ui.game;

import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.graphics.g2d.Sprite;
import com.badlogic.gdx.scenes.scene2d.Actor;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.production.ProductionItem;
import me.rhin.openciv.ui.label.CustomLabel;

public class CityProductionInfo extends Actor {

	private City city;
	private CustomLabel productionDescLabel;
	private CustomLabel productionItemName;
	private Sprite backgroundSprite;
	private Sprite productionItemSprite;

	public CityProductionInfo(City city, float x, float y, float width, float height) {
		this.city = city;
		this.setBounds(x, y, width, height);

		backgroundSprite = TextureEnum.UI_BLACK.sprite();
		backgroundSprite.setBounds(x, y, width, height);

		this.productionDescLabel = new CustomLabel("Producing:");
		productionDescLabel.setPosition(x, y + height - productionDescLabel.getHeight());

		ProductionItem productionItem = city.getProducibleItemManager().getCurrentProductionItem();

		this.productionItemName = new CustomLabel((productionItem == null ? "Nothing" : productionItem.getName()));
		productionItemName.setPosition(x, y + height - productionItemName.getHeight() - 15);

		if (productionItem == null)
			productionItemSprite = TextureEnum.UI_ERROR.sprite();
		else
			productionItemSprite = productionItem.getTexture().sprite();

		productionItemSprite.setBounds(x + width - 34, y + 2, 32, 32);
	}

	@Override
	public void draw(Batch batch, float parentAlpha) {
		backgroundSprite.draw(batch);
		productionDescLabel.draw(batch, parentAlpha);
		productionItemName.draw(batch, parentAlpha);
		productionItemSprite.draw(batch);
	}

}
