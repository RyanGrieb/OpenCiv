package me.rhin.openciv.ui.window.type;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.production.ProducingItem;
import me.rhin.openciv.listener.FinishProductionItemListener;
import me.rhin.openciv.listener.RemoveQueuedProductionItemListener;
import me.rhin.openciv.listener.ResizeListener;
import me.rhin.openciv.shared.packet.type.FinishProductionItemPacket;
import me.rhin.openciv.shared.packet.type.RemoveQueuedProductionItemPacket;
import me.rhin.openciv.ui.background.ColoredBackground;
import me.rhin.openciv.ui.button.type.CloseWindowButton;
import me.rhin.openciv.ui.list.ContainerList;
import me.rhin.openciv.ui.list.ListContainer.ListContainerType;
import me.rhin.openciv.ui.list.type.ListQueuedItem;
import me.rhin.openciv.ui.window.AbstractWindow;

public class QueuedItemsListWindow extends AbstractWindow
		implements ResizeListener, FinishProductionItemListener, RemoveQueuedProductionItemListener {

	private City city;
	private ColoredBackground coloredBackground;
	private CloseWindowButton closeWindowButton;
	private ContainerList queuedItemsList;

	public QueuedItemsListWindow(City city) {
		this.setBounds(viewport.getWorldWidth() / 2 - 300 / 2, viewport.getWorldHeight() / 2 - 350 / 2, 300, 350);
		this.city = city;

		this.coloredBackground = new ColoredBackground(TextureEnum.UI_BLACK.sprite(), 0, 0, getWidth(), getHeight());
		addActor(coloredBackground);

		this.closeWindowButton = new CloseWindowButton(getClass(), "Close", getWidth() / 2 - 80 / 2, 4, 80, 32);
		addActor(closeWindowButton);

		this.queuedItemsList = new ContainerList(0, 38, getWidth(), getHeight() - 38);
		addActor(queuedItemsList);

		for (ProducingItem item : city.getProducibleItemManager().getItemQueue()) {
			queuedItemsList.addItem(ListContainerType.CATEGORY, "Queued Items",
					new ListQueuedItem(city, item, queuedItemsList, 280, 45));
		}

		Civilization.getInstance().getEventManager().addListener(ResizeListener.class, this);
		Civilization.getInstance().getEventManager().addListener(FinishProductionItemListener.class, this);
		Civilization.getInstance().getEventManager().addListener(RemoveQueuedProductionItemListener.class, this);
	}

	@Override
	public void onFinishProductionItem(FinishProductionItemPacket packet) {
		queuedItemsList.clearList();

		for (ProducingItem item : city.getProducibleItemManager().getItemQueue()) {
			queuedItemsList.addItem(ListContainerType.CATEGORY, "Queued Items",
					new ListQueuedItem(city, item, queuedItemsList, 280, 45));
		}
	}

	@Override
	public void onRemoveQueuedProductionItem(RemoveQueuedProductionItemPacket packet) {

		if (city.getProducibleItemManager().getItemQueue().size() < 2) {
			Civilization.getInstance().getWindowManager().closeWindow(getClass());
			return;
		}

		queuedItemsList.clearList();

		for (ProducingItem item : city.getProducibleItemManager().getItemQueue()) {
			queuedItemsList.addItem(ListContainerType.CATEGORY, "Queued Items",
					new ListQueuedItem(city, item, queuedItemsList, 280, 45));
		}
	}

	@Override
	public void onResize(int width, int height) {
		super.setPosition(width / 2 - 300 / 2, height / 2 - 350 / 2);
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

	@Override
	public void onClose() {
		super.onClose();
		Civilization.getInstance().getEventManager().clearListenersFromObject(this);
	}
}
