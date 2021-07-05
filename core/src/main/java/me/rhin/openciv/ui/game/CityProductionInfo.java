package me.rhin.openciv.ui.game;

import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.graphics.g2d.Sprite;
import com.badlogic.gdx.math.MathUtils;
import com.badlogic.gdx.scenes.scene2d.Actor;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.production.ProducingItem;
import me.rhin.openciv.listener.ApplyProductionToItemListener;
import me.rhin.openciv.listener.FinishProductionItemListener;
import me.rhin.openciv.listener.SetProductionItemListener;
import me.rhin.openciv.shared.packet.type.ApplyProductionToItemPacket;
import me.rhin.openciv.shared.packet.type.FinishProductionItemPacket;
import me.rhin.openciv.shared.packet.type.SetProductionItemPacket;
import me.rhin.openciv.shared.stat.Stat;
import me.rhin.openciv.ui.label.CustomLabel;

public class CityProductionInfo extends Actor
		implements SetProductionItemListener, ApplyProductionToItemListener, FinishProductionItemListener {

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

			int totalTurns = (int) Math.ceil((producingItem.getProductionItem().getProductionCost()
					/ city.getStatLine().getStatValue(Stat.PRODUCTION_GAIN)));

			this.turnsLeftLabel = new CustomLabel(appliedTurns + "/" + totalTurns + " Turns");
		} else {
			this.turnsLeftLabel = new CustomLabel("???/??? Turns");
		}

		turnsLeftLabel.setPosition(x + productionItemSprite.getX() - turnsLeftLabel.getWidth() - 5,
				y + productionItemSprite.getHeight() / 2 - turnsLeftLabel.getHeight() / 2);

		Civilization.getInstance().getEventManager().addListener(SetProductionItemListener.class, this);
		Civilization.getInstance().getEventManager().addListener(ApplyProductionToItemListener.class, this);
		Civilization.getInstance().getEventManager().addListener(FinishProductionItemListener.class, this);
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
	public void setPosition(float x, float y) {
		backgroundSprite.setPosition(x, y);
		productionItemSprite.setPosition(x + getWidth() - 34, y + 2);
		productionDescLabel.setPosition(x, y + getHeight() - productionDescLabel.getHeight());
		productionItemNameLabel.setPosition(x, y + getHeight() - productionItemNameLabel.getHeight() - 15);
		turnsLeftLabel.setPosition(x + productionItemSprite.getX() - turnsLeftLabel.getWidth() - 5,
				y + productionItemSprite.getHeight() / 2 - turnsLeftLabel.getHeight() / 2);
	}

	@Override
	public void onSetProductionItem(SetProductionItemPacket packet) {
		if (!city.getName().equals(packet.getCityName()))
			return;

		ProducingItem producingItem = city.getProducibleItemManager().getCurrentProducingItem();

		productionItemNameLabel.setText(producingItem.getProductionItem().getName());

		Sprite sprite = producingItem.getProductionItem().getTexture().sprite();
		sprite.setBounds(productionItemSprite.getX(), productionItemSprite.getY(), productionItemSprite.getWidth(),
				productionItemSprite.getHeight());

		productionItemSprite = sprite;

		float appliedProduction = producingItem.getAppliedProduction();

		int turnsLeft = MathUtils.ceil((producingItem.getProductionItem().getProductionCost() - appliedProduction)
				/ city.getStatLine().getStatValue(Stat.PRODUCTION_GAIN));

		int currentTurns = producingItem.getAppiedTurns();

		int totalTurns = currentTurns + turnsLeft;

		turnsLeftLabel.setText(currentTurns + "/" + totalTurns + " Turns");
	}

	@Override
	public void onApplyProductionToItem(ApplyProductionToItemPacket packet) {
		if (!city.getName().equals(packet.getCityName()))
			return;

		ProducingItem producingItem = city.getProducibleItemManager().getCurrentProducingItem();

		int appliedTurns = (int) (producingItem.getAppliedProduction()
				/ city.getStatLine().getStatValue(Stat.PRODUCTION_GAIN));

		int totalTurns = (int) Math.ceil((producingItem.getProductionItem().getProductionCost()
				/ city.getStatLine().getStatValue(Stat.PRODUCTION_GAIN)));

		turnsLeftLabel.setText(appliedTurns + "/" + totalTurns + " Turns");
	}

	@Override
	public void onFinishProductionItem(FinishProductionItemPacket packet) {
		productionItemNameLabel.setText("Nothing");
		turnsLeftLabel.setText("???/??? Turns");

		Sprite sprite = TextureEnum.UI_ERROR.sprite();
		sprite.setBounds(productionItemSprite.getX(), productionItemSprite.getY(), productionItemSprite.getWidth(),
				productionItemSprite.getHeight());

		productionItemSprite = sprite;
	}
}
