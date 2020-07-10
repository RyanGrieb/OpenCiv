package me.rhin.openciv.ui.game;

import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.graphics.g2d.Sprite;
import com.badlogic.gdx.scenes.scene2d.Actor;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.production.ProducingItem;
import me.rhin.openciv.game.production.ProductionItem;
import me.rhin.openciv.listener.SetProductionItemListener;
import me.rhin.openciv.shared.packet.type.SetProductionItemPacket;
import me.rhin.openciv.shared.stat.Stat;
import me.rhin.openciv.ui.label.CustomLabel;

public class CityProductionInfo extends Actor implements SetProductionItemListener {

	private City city;
	private Sprite backgroundSprite;
	private Sprite productionItemSprite;
	private CustomLabel productionDescLabel;
	private CustomLabel productionItemNameLabel;
	private CustomLabel turnsLeftLabel;

	public CityProductionInfo(City city, float x, float y, float width, float height) {
		this.city = city;
		this.setBounds(x, y, width, height);

		backgroundSprite = TextureEnum.UI_BLACK.sprite();
		backgroundSprite.setBounds(x, y, width, height);

		ProducingItem producingItem = city.getProducibleItemManager().getCurrentProducingItem();

		if (producingItem == null)
			productionItemSprite = TextureEnum.UI_ERROR.sprite();
		else
			productionItemSprite = producingItem.getProductionItem().getTexture().sprite();

		productionItemSprite.setBounds(x + width - 34, y + 2, 32, 32);

		this.productionDescLabel = new CustomLabel("Producing:");
		productionDescLabel.setPosition(x, y + height - productionDescLabel.getHeight());

		this.productionItemNameLabel = new CustomLabel(
				(producingItem == null ? "Nothing" : producingItem.getProductionItem().getName()));
		productionItemNameLabel.setPosition(x, y + height - productionItemNameLabel.getHeight() - 15);

		if (producingItem != null) {

			int appliedTurns = (int) (producingItem.getAppliedProduction()
					/ city.getStatLine().getStatValue(Stat.PRODUCTION_GAIN));

			int totalTurns = (int) (producingItem.getProductionItem().getProductionCost()
					/ city.getStatLine().getStatValue(Stat.PRODUCTION_GAIN));

			this.turnsLeftLabel = new CustomLabel(appliedTurns + "/" + totalTurns + " Turns");
		} else {
			this.turnsLeftLabel = new CustomLabel("???/??? Turns");
		}

		turnsLeftLabel.setPosition(x + productionItemSprite.getX() - turnsLeftLabel.getWidth() - 5,
				y + productionItemSprite.getHeight() / 2 - turnsLeftLabel.getHeight() / 2);

		Civilization.getInstance().getEventManager().addListener(SetProductionItemListener.class, this);
	}

	@Override
	public void draw(Batch batch, float parentAlpha) {
		backgroundSprite.draw(batch);
		productionItemSprite.draw(batch);
		productionDescLabel.draw(batch, parentAlpha);
		productionItemNameLabel.draw(batch, parentAlpha);
		turnsLeftLabel.draw(batch, parentAlpha);
	}

	@Override
	public void onSetProductionItem(SetProductionItemPacket packet) {
		ProducingItem producingItem = Civilization.getInstance().getGame().getPlayer()
				.getCityFromName(packet.getCityName()).getProducibleItemManager().getCurrentProducingItem();

		productionItemNameLabel.setText(producingItem.getProductionItem().getName());

		Sprite sprite = producingItem.getProductionItem().getTexture().sprite();
		sprite.setBounds(productionItemSprite.getX(), productionItemSprite.getY(), productionItemSprite.getWidth(),
				productionItemSprite.getHeight());

		productionItemSprite = sprite;

		int appliedTurns = (int) (producingItem.getAppliedProduction()
				/ city.getStatLine().getStatValue(Stat.PRODUCTION_GAIN));

		int totalTurns = (int) (producingItem.getProductionItem().getProductionCost()
				/ city.getStatLine().getStatValue(Stat.PRODUCTION_GAIN));

		turnsLeftLabel.setText(appliedTurns + "/" + totalTurns + " Turns");
	}
}
