package me.rhin.openciv.ui.list.type;

import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.graphics.g2d.Sprite;
import com.badlogic.gdx.scenes.scene2d.InputEvent;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.production.ProducingItem;
import me.rhin.openciv.ui.button.CustomButton;
import me.rhin.openciv.ui.label.CustomLabel;
import me.rhin.openciv.ui.list.ContainerList;
import me.rhin.openciv.ui.list.ListObject;

public class ListQueuedItem extends ListObject {

	private ProducingItem item;
	private CustomLabel itemNameLabel;
	private Sprite itemIconSprite;
	private Sprite backgroundSprite;
	private CustomButton cancelQueueButton;

	public ListQueuedItem(ProducingItem item, ContainerList containerList, float width, float height) {
		super(width, height, containerList, "QueuedItem");

		this.item = item;

		this.backgroundSprite = TextureEnum.UI_GRAY.sprite();
		this.backgroundSprite.setSize(width, height);

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

	}

	@Override
	public void draw(Batch batch, float parentAlpha) {
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
		itemIconSprite.setPosition(x, y + getHeight() / 2 - itemIconSprite.getHeight() / 2);
		itemNameLabel.setPosition(itemIconSprite.getX() + itemIconSprite.getWidth() + 4,
				y + itemIconSprite.getHeight() / 2);
		cancelQueueButton.setPosition(getWidth() - 38, itemIconSprite.getHeight() / 2);
	}
}
