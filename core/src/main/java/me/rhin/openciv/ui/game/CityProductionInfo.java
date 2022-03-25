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
import me.rhin.openciv.listener.BuyProductionItemListener;
import me.rhin.openciv.listener.CityStatUpdateListener;
import me.rhin.openciv.listener.FinishProductionItemListener;
import me.rhin.openciv.listener.RemoveQueuedProductionItemListener;
import me.rhin.openciv.listener.SetProductionItemListener;
import me.rhin.openciv.shared.packet.type.ApplyProductionToItemPacket;
import me.rhin.openciv.shared.packet.type.BuyProductionItemPacket;
import me.rhin.openciv.shared.packet.type.CityStatUpdatePacket;
import me.rhin.openciv.shared.packet.type.FinishProductionItemPacket;
import me.rhin.openciv.shared.packet.type.RemoveQueuedProductionItemPacket;
import me.rhin.openciv.shared.packet.type.SetProductionItemPacket;
import me.rhin.openciv.shared.stat.Stat;
import me.rhin.openciv.ui.label.CustomLabel;

public class CityProductionInfo extends Actor
		implements SetProductionItemListener, ApplyProductionToItemListener, FinishProductionItemListener,
		CityStatUpdateListener, BuyProductionItemListener, RemoveQueuedProductionItemListener {

	private City city;
	private Sprite backgroundSprite;
	private Sprite productionItemSprite;
	private CustomLabel productionDescLabel;
	private CustomLabel productionItemNameLabel;
	private CustomLabel turnsLeftLabel;

	public CityProductionInfo(City city, float x, float y, float width, float height) {
		this.city = city;
		this.setBounds(x, y, width, height);

		backgroundSprite = TextureEnum.UI_POPUP_BOX_C.sprite();
		backgroundSprite.setBounds(x, y, width, height);

		ProducingItem producingItem = city.getProducibleItemManager().getCurrentProducingItem();

		if (producingItem == null)
			productionItemSprite = TextureEnum.UI_CLEAR.sprite();
		else
			productionItemSprite = producingItem.getProductionItem().getTexture().sprite();

		productionItemSprite.setBounds(x + width - 40, y + 8, 32, 32);

		this.productionDescLabel = new CustomLabel("Producing:");
		productionDescLabel.setPosition(x + 6, y + height - productionDescLabel.getHeight() - 8);

		this.productionItemNameLabel = new CustomLabel(
				(producingItem == null ? "Nothing" : producingItem.getProductionItem().getName()));
		productionItemNameLabel.setPosition(x + 6, y + height - productionItemNameLabel.getHeight() - 25);

		if (producingItem != null) {

			int appliedTurns = (int) (producingItem.getAppliedProduction()
					/ city.getStatLine().getStatValue(Stat.PRODUCTION_GAIN));

			int totalTurns = (int) Math.ceil((producingItem.getProductionItem().getProductionCost()
					/ city.getStatLine().getStatValue(Stat.PRODUCTION_GAIN)));

			this.turnsLeftLabel = new CustomLabel(appliedTurns + "/" + totalTurns + " Turns");
		} else {
			this.turnsLeftLabel = new CustomLabel("???/??? Turns");
		}

		turnsLeftLabel.setPosition(x + 5, y + productionItemSprite.getHeight() / 2 - turnsLeftLabel.getHeight() / 2);

		Civilization.getInstance().getEventManager().addListener(SetProductionItemListener.class, this);
		Civilization.getInstance().getEventManager().addListener(ApplyProductionToItemListener.class, this);
		Civilization.getInstance().getEventManager().addListener(FinishProductionItemListener.class, this);
		Civilization.getInstance().getEventManager().addListener(CityStatUpdateListener.class, this);
		Civilization.getInstance().getEventManager().addListener(BuyProductionItemListener.class, this);
		Civilization.getInstance().getEventManager().addListener(RemoveQueuedProductionItemListener.class, this);
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
		productionItemSprite.setPosition(x + getWidth() - 40, y + 8);
		productionDescLabel.setPosition(x + 6, y + getHeight() - productionDescLabel.getHeight() - 8);
		productionItemNameLabel.setPosition(x + 6, y + getHeight() - productionItemNameLabel.getHeight() - 25);
		turnsLeftLabel.setPosition(x + 6, y + productionItemSprite.getHeight() / 2 - turnsLeftLabel.getHeight() / 2);
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

		int turnsLeft = MathUtils
				.ceil((producingItem.getProductionItem().getProductionCost() - producingItem.getAppliedProduction())
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

		int turnsLeft = MathUtils
				.ceil((producingItem.getProductionItem().getProductionCost() - producingItem.getAppliedProduction())
						/ city.getStatLine().getStatValue(Stat.PRODUCTION_GAIN));

		int currentTurns = producingItem.getAppiedTurns();

		int totalTurns = currentTurns + turnsLeft;

		turnsLeftLabel.setText(currentTurns + "/" + totalTurns + " Turns");
	}

	@Override
	public void onFinishProductionItem(FinishProductionItemPacket packet) {
		if (!city.getName().equals(packet.getCityName()))
			return;

		updateUI();
	}

	@Override
	public void onBuyProductionItem(BuyProductionItemPacket packet) {
		if (!city.getName().equals(packet.getCityName()))
			return;

		if (city.getProducibleItemManager().getCurrentProducingItem() == null) {
			updateUI();
		}
	}

	@Override
	public void onCityStatUpdate(CityStatUpdatePacket packet) {
		if (!city.getName().equals(packet.getCityName()))
			return;

		updateUI();
	}

	@Override
	public void onRemoveQueuedProductionItem(RemoveQueuedProductionItemPacket packet) {
		if (!city.getName().equals(packet.getCityName()))
			return;

		// System.out.println(packet.getItemName() + ","
		// +
		// city.getProducibleItemManager().getCurrentProducingItem().getProductionItem().getName());

		updateUI();
	}

	private void updateUI() {
		if (city.getProducibleItemManager().getCurrentProducingItem() == null) {
			productionItemNameLabel.setText("Nothing");
			turnsLeftLabel.setText("???/??? Turns");

			Sprite sprite = TextureEnum.UI_CLEAR.sprite();
			sprite.setBounds(productionItemSprite.getX(), productionItemSprite.getY(), productionItemSprite.getWidth(),
					productionItemSprite.getHeight());

			productionItemSprite = sprite;
		} else {
			ProducingItem producingItem = city.getProducibleItemManager().getCurrentProducingItem();

			if (producingItem == null)
				return;

			Sprite sprite = producingItem.getProductionItem().getTexture().sprite();
			sprite.setBounds(productionItemSprite.getX(), productionItemSprite.getY(), productionItemSprite.getWidth(),
					productionItemSprite.getHeight());

			productionItemSprite = sprite;

			int turnsLeft = MathUtils
					.ceil((producingItem.getProductionItem().getProductionCost() - producingItem.getAppliedProduction())
							/ city.getStatLine().getStatValue(Stat.PRODUCTION_GAIN));

			int currentTurns = producingItem.getAppiedTurns();

			int totalTurns = currentTurns + turnsLeft;

			productionItemNameLabel.setText(producingItem.getProductionItem().getName());
			turnsLeftLabel.setText(currentTurns + "/" + totalTurns + " Turns");
		}
	}
}
