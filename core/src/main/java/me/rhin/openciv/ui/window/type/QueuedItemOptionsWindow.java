package me.rhin.openciv.ui.window.type;

import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.utils.Align;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.production.ProducingItem;
import me.rhin.openciv.shared.packet.type.MoveDownQueuedProductionItemPacket;
import me.rhin.openciv.shared.packet.type.MoveUpQueuedProductionItemPacket;
import me.rhin.openciv.shared.packet.type.RemoveQueuedProductionItemPacket;
import me.rhin.openciv.ui.background.ColoredBackground;
import me.rhin.openciv.ui.button.CustomButton;
import me.rhin.openciv.ui.button.type.CloseWindowButton;
import me.rhin.openciv.ui.label.CustomLabel;
import me.rhin.openciv.ui.window.AbstractWindow;

public class QueuedItemOptionsWindow extends AbstractWindow {

	private City city;
	private ProducingItem item;
	private ColoredBackground coloredBackground;
	private CustomLabel queueOptionsLabel;
	private CloseWindowButton cancelButton;
	private CustomButton removeFromQueueButton;
	private CustomButton moveUpQueueButton;
	private CustomButton moveDownQueueButton;

	public QueuedItemOptionsWindow(City city, ProducingItem item) {

		setBounds(Gdx.input.getX(),
				Civilization.getInstance().getCurrentScreen().getViewport().getWorldHeight() - Gdx.input.getY() - 55,
				175, 55);

		this.city = city;
		this.item = item;
		this.coloredBackground = new ColoredBackground(TextureEnum.UI_BLACK.sprite(), 0, 0, getWidth(), getHeight());
		addActor(coloredBackground);

		this.queueOptionsLabel = new CustomLabel("Queue Options", 0, getHeight() - 15, getWidth(), 15);
		queueOptionsLabel.setAlignment(Align.center);
		addActor(queueOptionsLabel);

		float buttonX = 6;
		this.cancelButton = new CloseWindowButton(getClass(), TextureEnum.ICON_CANCEL, 6, 6, 32, 32);
		cancelButton.onHover(() -> {
			queueOptionsLabel.setText("Close Window");
			queueOptionsLabel.setBounds(0, getHeight() - 15, getWidth(), 15);
			queueOptionsLabel.setAlignment(Align.center);
		});

		addActor(cancelButton);

		buttonX = cancelButton.getX() + cancelButton.getWidth() + 6;

		this.removeFromQueueButton = new CustomButton(TextureEnum.UI_BUTTON_ICON, TextureEnum.UI_BUTTON_ICON_HOVERED,
				TextureEnum.ICON_TRASH, buttonX, cancelButton.getY(), 32, 32);
		removeFromQueueButton.onHover(() -> {
			queueOptionsLabel.setText("Remove From Queue");
			queueOptionsLabel.setBounds(0, getHeight() - 15, getWidth(), 15);
			queueOptionsLabel.setAlignment(Align.center);
		});

		removeFromQueueButton.onClick(() -> {
			RemoveQueuedProductionItemPacket packet = new RemoveQueuedProductionItemPacket();
			packet.setProductionItem(city.getName(), item.getProductionItem().getName(),
					city.getProducibleItemManager().getItemQueue().indexOf(item));

			Civilization.getInstance().getNetworkManager().sendPacket(packet);

			Civilization.getInstance().getWindowManager().closeWindow(getClass());
		});

		addActor(removeFromQueueButton);

		buttonX = removeFromQueueButton.getX() + removeFromQueueButton.getWidth() + 6;

		if (canMoveUp(item)) {
			this.moveUpQueueButton = new CustomButton(TextureEnum.UI_BUTTON_ICON, TextureEnum.UI_BUTTON_ICON_HOVERED,
					TextureEnum.ICON_GOTO_UP, buttonX, cancelButton.getY(), 32, 32);
			moveUpQueueButton.onHover(() -> {
				queueOptionsLabel.setText("Move Up Queue");
				queueOptionsLabel.setBounds(0, getHeight() - 15, getWidth(), 15);
				queueOptionsLabel.setAlignment(Align.center);
			});

			moveUpQueueButton.onClick(() -> {
				MoveUpQueuedProductionItemPacket packet = new MoveUpQueuedProductionItemPacket();
				packet.setProductionItem(city.getName(), item.getProductionItem().getName());

				Civilization.getInstance().getNetworkManager().sendPacket(packet);
			});

			addActor(moveUpQueueButton);

			buttonX = moveUpQueueButton.getX() + moveUpQueueButton.getWidth() + 6;
		}

		if (canMoveDown(item)) {
			this.moveDownQueueButton = new CustomButton(TextureEnum.UI_BUTTON_ICON, TextureEnum.UI_BUTTON_ICON_HOVERED,
					TextureEnum.ICON_GOTO_DOWN, buttonX, cancelButton.getY(), 32, 32);
			moveDownQueueButton.onHover(() -> {
				queueOptionsLabel.setText("Move Down Queue");
				queueOptionsLabel.setBounds(0, getHeight() - 15, getWidth(), 15);
				queueOptionsLabel.setAlignment(Align.center);
			});

			moveDownQueueButton.onClick(() -> {
				MoveDownQueuedProductionItemPacket packet = new MoveDownQueuedProductionItemPacket();
				packet.setProductionItem(city.getName(), item.getProductionItem().getName());

				Civilization.getInstance().getNetworkManager().sendPacket(packet);
			});

			addActor(moveDownQueueButton);

			buttonX = moveDownQueueButton.getX() + moveDownQueueButton.getWidth() + 6;
		}
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

	private boolean canMoveDown(ProducingItem item) {

		int index = 0;
		for (ProducingItem producingItem : city.getProducibleItemManager().getItemQueue()) {

			if (producingItem.equals(item) && index < city.getProducibleItemManager().getItemQueue().size() - 1)
				return true;

			index++;
		}

		return false;
	}

	private boolean canMoveUp(ProducingItem item) {

		int index = 0;
		for (ProducingItem producingItem : city.getProducibleItemManager().getItemQueue()) {

			if (producingItem.equals(item) && index != 0)
				return true;

			index++;
		}

		return false;
	}
}
