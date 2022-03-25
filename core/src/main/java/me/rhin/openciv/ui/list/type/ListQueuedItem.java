package me.rhin.openciv.ui.list.type;

import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.graphics.g2d.Sprite;
import com.badlogic.gdx.scenes.scene2d.InputEvent;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.production.ProducingItem;
import me.rhin.openciv.ui.button.CustomButton;
import me.rhin.openciv.ui.label.CustomLabel;
import me.rhin.openciv.ui.list.ContainerList;
import me.rhin.openciv.ui.list.ListObject;
import me.rhin.openciv.ui.window.type.QueuedItemOptionsWindow;

public class ListQueuedItem extends ListObject {

	private City city;
	private ProducingItem item;
	private CustomLabel itemNameLabel;
	private Sprite itemIconSprite;
	private Sprite backgroundSprite;
	private Sprite hoveredBackgroundSprite;
	private CustomButton cancelQueueButton;

	public ListQueuedItem(City city, ProducingItem item, ContainerList containerList, float width, float height) {
		super(width, height, containerList, "QueuedItem");

		this.city = city;
		this.item = item;

		this.backgroundSprite = TextureEnum.UI_GRAY.sprite();
		this.backgroundSprite.setSize(width, height);

		this.hoveredBackgroundSprite = TextureEnum.UI_DARK_GRAY.sprite();
		this.hoveredBackgroundSprite.setSize(width, height);

		itemIconSprite = item.getProductionItem().getTexture().sprite();
		itemIconSprite.setSize(32, 32);

		this.itemNameLabel = new CustomLabel(item.getProductionItem().getName());

		this.cancelQueueButton = new CustomButton(TextureEnum.UI_BUTTON_ICON, TextureEnum.UI_BUTTON_ICON_HOVERED,
				TextureEnum.ICON_CANCEL, 0, 0, 32, 32);
		cancelQueueButton.onClick(() -> {

		});
	}

	@Override
	protected void onClicked(InputEvent event) {
		if (!Civilization.getInstance().getWindowManager().isOpenWindow(QueuedItemOptionsWindow.class))
			Civilization.getInstance().getWindowManager().addWindow(new QueuedItemOptionsWindow(city, item));
	}

	@Override
	public void draw(Batch batch, float parentAlpha) {
		if (hovered)
			hoveredBackgroundSprite.draw(batch);
		else
			backgroundSprite.draw(batch);
		itemIconSprite.draw(batch);
		itemNameLabel.draw(batch, parentAlpha);
		// cancelQueueButton.draw(batch, parentAlpha);

		super.draw(batch, parentAlpha);
	}

	@Override
	public void setPosition(float x, float y) {
		super.setPosition(x, y);
		backgroundSprite.setPosition(x, y);
		hoveredBackgroundSprite.setPosition(x, y);
		itemIconSprite.setPosition(x, y + getHeight() / 2 - itemIconSprite.getHeight() / 2);
		itemNameLabel.setPosition(itemIconSprite.getX() + itemIconSprite.getWidth() + 4,
				y + itemIconSprite.getHeight() / 2);
		cancelQueueButton.setPosition(getWidth() - 38, itemIconSprite.getHeight() / 2);
	}
}
