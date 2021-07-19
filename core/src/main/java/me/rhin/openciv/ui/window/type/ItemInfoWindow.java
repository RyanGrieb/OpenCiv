package me.rhin.openciv.ui.window.type;

import com.badlogic.gdx.utils.Align;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.production.ProductionItem;
import me.rhin.openciv.listener.ResizeListener;
import me.rhin.openciv.shared.stat.Stat;
import me.rhin.openciv.ui.background.ColoredBackground;
import me.rhin.openciv.ui.button.type.BuyItemButton;
import me.rhin.openciv.ui.button.type.CancelItemButton;
import me.rhin.openciv.ui.button.type.ProduceItemButton;
import me.rhin.openciv.ui.label.CustomLabel;
import me.rhin.openciv.ui.window.AbstractWindow;

public class ItemInfoWindow extends AbstractWindow implements ResizeListener {

	private City city;
	private ProductionItem productionItem;

	private ColoredBackground background;
	private CustomLabel itemNameLabel;
	private CustomLabel itemDescLabel;
	private CustomLabel productionCostLabel;
	private CustomLabel goldCostLabel;
	private ColoredBackground itemIcon;
	private ProduceItemButton produceItemButton;
	private BuyItemButton buyItemButton;
	private CancelItemButton cancelItemButton;
	private ColoredBackground produceIcon;
	private ColoredBackground buyIcon;

	public ItemInfoWindow(City city, ProductionItem productionItem) {
		this.setBounds(viewport.getWorldWidth() / 2 - 300 / 2, viewport.getWorldHeight() / 2 - 300 / 2, 300, 300);
		this.city = city;
		this.productionItem = productionItem;

		this.background = new ColoredBackground(TextureEnum.UI_BLACK.sprite(), 0, 0, getWidth(), getHeight());
		addActor(background);

		this.itemNameLabel = new CustomLabel(productionItem.getName(), Align.center, 0, getHeight() - 14, getWidth(),
				14);
		addActor(itemNameLabel);

		this.itemIcon = new ColoredBackground(productionItem.getTexture().sprite(), getWidth() / 2 - 32 / 2,
				getHeight() - 48, 32, 32);
		addActor(itemIcon);

		this.itemDescLabel = new CustomLabel(productionItem.getDesc());
		itemDescLabel.setPosition(4, itemIcon.getY() - itemIcon.getHeight() - itemDescLabel.getHeight());
		addActor(itemDescLabel);

		this.produceItemButton = new ProduceItemButton(city, productionItem, 4, 4, 82, 28);
		addActor(produceItemButton);

		this.buyItemButton = new BuyItemButton(city, productionItem, getWidth() / 2 - 82 / 2, 4, 82, 28);
		addActor(buyItemButton);

		this.cancelItemButton = new CancelItemButton(getWidth() - 86, 4, 82, 28);
		addActor(cancelItemButton);

		this.produceIcon = new ColoredBackground(TextureEnum.ICON_PRODUCTION.sprite(),
				produceItemButton.getX() + produceItemButton.getWidth() / 2 - 16 / 2,
				produceItemButton.getY() + produceItemButton.getHeight(), 16, 16);
		addActor(produceIcon);

		this.buyIcon = new ColoredBackground(TextureEnum.ICON_GOLD.sprite(),
				buyItemButton.getX() + buyItemButton.getWidth() / 2 - 16 / 2,
				buyItemButton.getY() + buyItemButton.getHeight(), 16, 16);
		addActor(buyIcon);

		this.productionCostLabel = new CustomLabel(
				(int) Math.ceil(
						(productionItem.getProductionCost() / city.getStatLine().getStatValue(Stat.PRODUCTION_GAIN)))
						+ " Turns",
				Align.center, produceIcon.getX(), produceIcon.getY() + produceIcon.getHeight() + 2,
				produceIcon.getWidth(), 12);
		addActor(productionCostLabel);

		this.goldCostLabel = new CustomLabel((int) productionItem.getGoldCost() + " Gold", Align.center, buyIcon.getX(),
				buyIcon.getY() + buyIcon.getHeight() + 2, buyIcon.getWidth(), 12);
		addActor(goldCostLabel);

		Civilization.getInstance().getEventManager().addListener(ResizeListener.class, this);
	}

	@Override
	public void onResize(int width, int height) {
		this.setBounds(width / 2 - 300 / 2, height / 2 - 300 / 2, 300, 300);

		background.setPosition(0, 0);
		itemNameLabel.setPosition(0, getHeight() - 14);
		itemIcon.setPosition(getWidth() / 2 - 32 / 2, getHeight() - 48);
		itemDescLabel.setPosition(4, itemIcon.getY() - itemIcon.getHeight() - itemDescLabel.getHeight());
		produceItemButton.setPosition(4, 4);
		buyItemButton.setPosition(getWidth() / 2 - 82 / 2, 4);
		cancelItemButton.setPosition(getWidth() - 86, 4);

		produceIcon.setPosition(produceItemButton.getX() + produceItemButton.getWidth() / 2 - 16 / 2,
				produceItemButton.getY() + produceItemButton.getHeight());

		buyIcon.setPosition(buyItemButton.getX() + buyItemButton.getWidth() / 2 - 16 / 2,
				buyItemButton.getY() + buyItemButton.getHeight());

		productionCostLabel.setPosition(produceIcon.getX(), produceIcon.getY() + produceIcon.getHeight() + 2);
		goldCostLabel.setPosition(buyIcon.getX(), buyIcon.getY() + buyIcon.getHeight() + 2);

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
