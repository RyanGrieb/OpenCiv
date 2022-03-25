package me.rhin.openciv.ui.window.type;

import com.badlogic.gdx.utils.Align;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.production.ProductionItem;
import me.rhin.openciv.ui.background.ColoredBackground;
import me.rhin.openciv.ui.button.type.CloseWindowButton;
import me.rhin.openciv.ui.button.type.QueueItemButton;
import me.rhin.openciv.ui.button.type.ReplaceItemButton;
import me.rhin.openciv.ui.label.CustomLabel;
import me.rhin.openciv.ui.window.AbstractWindow;

public class QueueItemWindow extends AbstractWindow {

	private City city;
	private ProductionItem productionItem;
	private ColoredBackground background;
	private CustomLabel itemNameLabel;
	private ColoredBackground itemIcon;
	private CustomLabel queueDescLabel;
	private QueueItemButton queueItemButton;
	private CloseWindowButton closeWindowButton;
	private ReplaceItemButton produceItemButton;
	private ColoredBackground queueIcon;
	private ColoredBackground produceIcon;

	public QueueItemWindow(City city, ProductionItem productionItem) {
		this.setBounds(viewport.getWorldWidth() / 2 - 300 / 2, viewport.getWorldHeight() / 2 - 350 / 2, 300, 350);
		this.city = city;
		this.productionItem = productionItem;

		this.background = new ColoredBackground(TextureEnum.UI_POPUP_BOX_A.sprite(), 0, 0, getWidth(), getHeight());
		addActor(background);

		this.itemNameLabel = new CustomLabel(productionItem.getName(), Align.center, 0, getHeight() - 20, getWidth(),
				14);
		addActor(itemNameLabel);

		this.itemIcon = new ColoredBackground(productionItem.getTexture().sprite(), getWidth() / 2 - 32 / 2,
				getHeight() - 55, 32, 32);
		addActor(itemIcon);

		this.queueDescLabel = new CustomLabel(
				"You are already producing another item. You can add this item to a production queue, or replace the current item.");
		queueDescLabel.setWrap(true);
		queueDescLabel.setWidth(getWidth() - 10);
		queueDescLabel.setAlignment(Align.left);
		queueDescLabel.pack();
		float labelHeight = queueDescLabel.getHeight();
		queueDescLabel.setPosition(6, getHeight() - labelHeight - 87);
		queueDescLabel.setWidth(getWidth() - 10);
		addActor(queueDescLabel);

		this.queueItemButton = new QueueItemButton(city, productionItem, 4, 4, 82, 28);
		addActor(queueItemButton);

		this.produceItemButton = new ReplaceItemButton(city, productionItem, getWidth() / 2 - 82 / 2, 4, 82,
				28);
		addActor(produceItemButton);

		this.closeWindowButton = new CloseWindowButton(this.getClass(), "Cancel", getWidth() - 86, 4, 82, 28);
		addActor(closeWindowButton);

		this.queueIcon = new ColoredBackground(TextureEnum.ICON_CLOCK.sprite(),
				queueItemButton.getX() + queueItemButton.getWidth() / 2 - 16 / 2,
				queueItemButton.getY() + queueItemButton.getHeight(), 16, 16);
		addActor(queueIcon);

		this.produceIcon = new ColoredBackground(TextureEnum.ICON_PRODUCTION.sprite(),
				produceItemButton.getX() + produceItemButton.getWidth() / 2 - 16 / 2,
				produceItemButton.getY() + produceItemButton.getHeight(), 16, 16);
		addActor(produceIcon);
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
