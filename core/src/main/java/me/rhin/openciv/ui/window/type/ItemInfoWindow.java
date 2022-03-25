package me.rhin.openciv.ui.window.type;

import java.util.ArrayList;

import com.badlogic.gdx.utils.Align;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.SoundEnum;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.production.ProductionItem;
import me.rhin.openciv.game.research.Unlockable;
import me.rhin.openciv.listener.ResizeListener;
import me.rhin.openciv.shared.stat.Stat;
import me.rhin.openciv.ui.background.ColoredBackground;
import me.rhin.openciv.ui.button.CustomButton;
import me.rhin.openciv.ui.button.type.CloseWindowButton;
import me.rhin.openciv.ui.label.CustomLabel;
import me.rhin.openciv.ui.window.AbstractWindow;

public class ItemInfoWindow extends AbstractWindow implements ResizeListener {

	private City city;
	private ProductionItem productionItem;

	private ColoredBackground background;
	private CustomLabel itemNameLabel;
	private ArrayList<CustomLabel> descLabels;
	private CustomLabel productionCostLabel;
	private CustomLabel goldCostLabel;
	private CustomLabel faithCostLabel;
	private ColoredBackground itemIcon;
	private CustomButton produceItemButton;
	private CustomButton buyItemButton;
	private CustomButton buyFaithItemButton;
	private CloseWindowButton closeWindowButton;
	private ColoredBackground produceIcon;
	private ColoredBackground buyIcon;
	private ColoredBackground faithIcon;

	public ItemInfoWindow(City city, ProductionItem productionItem) {
		this.setBounds(viewport.getWorldWidth() / 2 - 300 / 2, viewport.getWorldHeight() / 2 - 350 / 2, 300, 350);
		this.city = city;
		this.productionItem = productionItem;
		this.descLabels = new ArrayList<>();

		this.background = new ColoredBackground(TextureEnum.UI_POPUP_BOX_A.sprite(), 0, 0, getWidth(), getHeight());
		addActor(background);

		this.itemNameLabel = new CustomLabel(productionItem.getName(), Align.center, 0, getHeight() - 20, getWidth(),
				14);
		addActor(itemNameLabel);

		this.itemIcon = new ColoredBackground(productionItem.getTexture().sprite(), getWidth() / 2 - 32 / 2,
				getHeight() - 55, 32, 32);
		addActor(itemIcon);

		float lastYIndex = itemIcon.getY() - itemIcon.getHeight();
		for (String text : productionItem.getDesc()) {
			CustomLabel descLabel = new CustomLabel(text);
			descLabel.setWrap(true);
			descLabel.setWidth(getWidth() - 10);
			descLabel.setAlignment(Align.left);
			descLabel.pack();
			float labelHeight = descLabel.getHeight();
			descLabel.setPosition(6, lastYIndex - labelHeight);
			descLabel.setWidth(getWidth() - 10);

			descLabels.add(descLabel);
			addActor(descLabel);

			lastYIndex -= labelHeight;
		}

		this.produceItemButton = new CustomButton("Produce", 4, 4, 82, 28);
		produceItemButton.onClick(() -> {
			if (city.getProducibleItemManager().getCurrentProducingItem() == null) {
				city.getProducibleItemManager().requestSetProductionItem(productionItem);
				Civilization.getInstance().getWindowManager().closeWindow(ItemInfoWindow.class);
			} else {
				// Civilization.getInstance().getWindowManager().closeWindow(ItemInfoWindow.class);
				Civilization.getInstance().getWindowManager().toggleWindow(new QueueItemWindow(city, productionItem));
			}
		});

		if (productionItem.getProductionCost() > 0)
			addActor(produceItemButton);

		this.buyItemButton = new CustomButton("Buy", getWidth() / 2 - 82 / 2, 4, 82, 28);
		buyItemButton.onClick(() -> {
			if (city.getPlayerOwner().getStatLine().getStatValue(Stat.GOLD) < productionItem.getGoldCost())
				return;

			city.getProducibleItemManager().requestBuyProductionItem(productionItem);
			Civilization.getInstance().getWindowManager().closeWindow(ItemInfoWindow.class);

			Civilization.getInstance().getSoundHandler().playEffect(SoundEnum.BUY_ITEM);
		});

		if (productionItem.getGoldCost() > 0)
			addActor(buyItemButton);

		this.buyFaithItemButton = new CustomButton("Buy", getWidth() / 2 - 82 / 2, 4, 82, 28);
		buyFaithItemButton.onClick(() -> {
			if (city.getPlayerOwner().getStatLine().getStatValue(Stat.FAITH) < productionItem.getFaithCost())
				return;

			city.getProducibleItemManager().requestFaithBuyProductionItem(productionItem);
			Civilization.getInstance().getWindowManager().closeWindow(ItemInfoWindow.class);
		});

		if (productionItem.getFaithCost() > 0)
			addActor(buyFaithItemButton);

		this.closeWindowButton = new CloseWindowButton(this.getClass(), "Cancel", getWidth() - 86, 4, 82, 28);
		addActor(closeWindowButton);

		this.produceIcon = new ColoredBackground(TextureEnum.ICON_PRODUCTION.sprite(),
				produceItemButton.getX() + produceItemButton.getWidth() / 2 - 16 / 2,
				produceItemButton.getY() + produceItemButton.getHeight(), 16, 16);

		if (productionItem.getProductionCost() > 0)
			addActor(produceIcon);

		this.buyIcon = new ColoredBackground(TextureEnum.ICON_GOLD.sprite(),
				buyItemButton.getX() + buyItemButton.getWidth() / 2 - 16 / 2,
				buyItemButton.getY() + buyItemButton.getHeight(), 16, 16);

		if (productionItem.getGoldCost() > 0)
			addActor(buyIcon);

		this.faithIcon = new ColoredBackground(TextureEnum.ICON_FAITH.sprite(),
				buyItemButton.getX() + buyItemButton.getWidth() / 2 - 16 / 2,
				buyItemButton.getY() + buyItemButton.getHeight(), 16, 16);

		if (productionItem.getFaithCost() > 0)
			addActor(faithIcon);

		this.productionCostLabel = new CustomLabel(
				(int) Math.ceil(
						(productionItem.getProductionCost() / city.getStatLine().getStatValue(Stat.PRODUCTION_GAIN)))
						+ " Turns",
				Align.center, produceIcon.getX(), produceIcon.getY() + produceIcon.getHeight() + 2,
				produceIcon.getWidth(), 12);

		if (productionItem.getProductionCost() > 0)
			addActor(productionCostLabel);

		this.goldCostLabel = new CustomLabel((int) productionItem.getGoldCost() + " Gold", Align.center, buyIcon.getX(),
				buyIcon.getY() + buyIcon.getHeight() + 2, buyIcon.getWidth(), 12);

		if (productionItem.getGoldCost() > 0)
			addActor(goldCostLabel);

		this.faithCostLabel = new CustomLabel((int) productionItem.getFaithCost() + " Faith", Align.center,
				faithIcon.getX(), faithIcon.getY() + faithIcon.getHeight() + 2, faithIcon.getWidth(), 12);

		if (productionItem.getFaithCost() > 0)
			addActor(faithCostLabel);

		Civilization.getInstance().getEventManager().addListener(ResizeListener.class, this);
	}

	public ItemInfoWindow(Unlockable unlockable) {
		this.setBounds(viewport.getWorldWidth() / 2 - 300 / 2, viewport.getWorldHeight() / 2 - 350 / 2, 300, 350);
		this.descLabels = new ArrayList<>();

		this.background = new ColoredBackground(TextureEnum.UI_POPUP_BOX_A.sprite(), 0, 0, getWidth(), getHeight());
		addActor(background);

		this.itemNameLabel = new CustomLabel(unlockable.getName(), Align.center, 0, getHeight() - 20, getWidth(), 14);
		addActor(itemNameLabel);

		this.itemIcon = new ColoredBackground(unlockable.getTexture().sprite(), getWidth() / 2 - 32 / 2,
				getHeight() - 55, 32, 32);
		addActor(itemIcon);

		float lastYIndex = itemIcon.getY() - itemIcon.getHeight();
		for (String text : unlockable.getDesc()) {
			CustomLabel descLabel = new CustomLabel(text);
			descLabel.setWrap(true);
			descLabel.setWidth(getWidth() - 10);
			descLabel.setAlignment(Align.left);
			descLabel.pack();
			float labelHeight = descLabel.getHeight();
			descLabel.setPosition(6, lastYIndex - labelHeight);
			descLabel.setWidth(getWidth() - 10);

			descLabels.add(descLabel);
			addActor(descLabel);

			lastYIndex -= labelHeight;
		}

		this.closeWindowButton = new CloseWindowButton(this.getClass(), "Close", getWidth() - 100, 5, 100, 35);
		addActor(closeWindowButton);

		Civilization.getInstance().getEventManager().addListener(ResizeListener.class, this);
	}

	@Override
	public void onResize(int width, int height) {
		this.setBounds(width / 2 - 300 / 2, height / 2 - 350 / 2, 300, 350);
	}

	@Override
	public boolean disablesInput() {
		return true;
	}

	@Override
	public boolean disablesCameraMovement() {
		return false;
	}

	@Override
	public boolean closesOtherWindows() {
		return false;
	}

	@Override
	public boolean closesGameDisplayWindows() {
		return false;
	}

	@Override
	public boolean isGameDisplayWindow() {
		return false;
	}
}
