package me.rhin.openciv.ui.list;

import java.util.HashMap;

import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.graphics.g2d.Sprite;
import com.badlogic.gdx.scenes.scene2d.Group;
import com.badlogic.gdx.scenes.scene2d.InputEvent;
import com.badlogic.gdx.scenes.scene2d.utils.DragListener;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.shared.listener.EventHandler;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.ui.list.ListContainer.ListContainerType;

//FIXME: The naming of ContainerList and ListContainer is bad.

public class ContainerList extends Group implements Listener {

	private float yOffset;
	private HashMap<String, ListContainer> listContainers;
	private ContainerScrollbar containerScrollbar;
	private Sprite backgroundSprite;
	private float initialHeight;

	public ContainerList(float x, float y, float width, float height) {
		this.yOffset = 0;
		this.listContainers = new HashMap<>();

		this.setBounds(x, y, width, height);

		this.containerScrollbar = new ContainerScrollbar(this, 0, 0, 20, height);
		addActor(containerScrollbar);

		backgroundSprite = TextureEnum.UI_LIGHT_GRAY.sprite();
		backgroundSprite.setPosition(x, y);
		backgroundSprite.setSize(width, height);

		initialHeight = height;
		// this.setCullingArea(new Rectangle(x, y, width, height));

		/*
		 * this.addListener(new DragScrollListener(null) {
		 * 
		 * @Override public void drag(InputEvent event, float x, float y, int amount) {
		 * return onScrolled(event, x, y, amount); } });
		 */

		// FIXME: This doesn't seem correct.
		final ContainerList thisContainer = this;

		this.addListener(new DragListener() {

			@Override
			public void touchDragged(InputEvent event, float x, float y, int pointer) {
				super.touchDragged(event, x, y, pointer);
				containerScrollbar.onTouchDragged(event, x, y);
			}

			@Override
			public void touchUp(InputEvent event, float x, float y, int pointer, int button) {
				super.touchUp(event, x, y, pointer, button);
			}

		});

		Civilization.getInstance().getEventManager().addListener(this);
	}

	@Override
	public void draw(Batch batch, float parentAlpha) {
		backgroundSprite.draw(batch);

		// Note: We do this instead of adding to the group is to override the trimming
		// of the children below.
		// containerScrollbar.draw(batch, parentAlpha);

		batch.flush();
		if (clipBegin(getX(), getY(), getWidth(), getHeight())) {
			if (isTransform())
				applyTransform(batch, computeTransform());
			drawChildren(batch, parentAlpha);
			if (isTransform())
				resetTransform(batch);
			batch.flush();
			clipEnd();
		}
	}

	@Override
	public void setPosition(float x, float y) {
		super.setPosition(x, y);
		backgroundSprite.setPosition(x, y);
		containerScrollbar.setPosition(x + getWidth(), y);
	}

	@EventHandler
	public void onScroll(float amountX, float amountY) {
		if (!Civilization.getInstance().getWindowManager().allowsInput(this)) {
			return;
		}

		// Problem, getX() returns 0 if we put ourselfs inside a window

		float y = Civilization.getInstance().getCurrentScreen().getViewport().getWorldHeight() - Gdx.input.getY();

		float xPos = getX();
		float yPos = getY();

		if (getParent() != null) {
			xPos += getParent().getX();
			yPos += getParent().getY();
		}

		if (Gdx.input.getX() >= xPos && y >= yPos)
			if (Gdx.input.getX() <= xPos + getWidth() && y <= yPos + getHeight()) {
				scroll(amountY);
			}
	}

	public void onClose() {
		containerScrollbar.onClose();
		Civilization.getInstance().getEventManager().removeListener(this);
	}

	public void scroll(float amount) {
		float yAmount = yOffset + (amount * 12);
		if (yAmount < 0)
			yAmount = 0;

		// FIXME: Redundant code, same as line 112
		float maxHeight = 0;
		for (ListContainer container : listContainers.values()) {
			maxHeight += container.getHeight();
		}

		if (yAmount > maxHeight - getHeight() && maxHeight - getHeight() >= 0) {
			yAmount = (int) (maxHeight - getHeight());
		} else if (maxHeight - getHeight() < 0) {
			yAmount = 0;
		}

		yOffset = yAmount;

		// Update scrollbar to relevant position
		// LOGGER.info(yOffset);
		// 0 -> top
		// maxHeight - getHeight() -> bottom

		float offset = yOffset / (maxHeight - getHeight());

		// Scrollbar top -> getY() + getHeight() - scrollbarHeight()
		// Scrollbar bottom - >getY()

		float scrollbarY = ((getHeight() - containerScrollbar.getScrubberHeight())
				- (((getHeight() - containerScrollbar.getScrubberHeight()) * offset)));

		containerScrollbar.setScrubberY(scrollbarY);

		updatePositions();
	}

	public void addItem(ListContainerType containerType, String categoryType, ListObject itemGroup) {
		if (!listContainers.containsKey(categoryType)) {
			listContainers.put(categoryType, new ListContainer(this, containerType, categoryType));
		}

		listContainers.get(categoryType).addItem(itemGroup);
		updatePositions();

		addActor(listContainers.get(categoryType));
	}

	public void removeItem(String listContainerName, String itemKey) {
		listContainers.get(listContainerName).clearListeners();
		listContainers.get(listContainerName).removeItem(itemKey);
		updatePositions();
	}

	public void removeItem(String listContainerName, int index) {
		listContainers.get(listContainerName).clearListeners();
		listContainers.get(listContainerName).removeItem(index);
		updatePositions();
	}

	public void updatePositions() {
		float nextHeight = 0;

		for (ListContainer container : listContainers.values()) {
			container.setPosition(0, yOffset + (0 + getHeight()) - container.getHeight() - nextHeight);
			nextHeight += container.getHeight();
		}
	}

	public void clearList() {
		for (ListContainer container : listContainers.values()) {
			removeActor(container);
		}

		listContainers.clear();
	}

	public HashMap<String, ListContainer> getListContainers() {
		return listContainers;
	}

	public void setYOffset(float yOffset) {
		this.yOffset = yOffset;
	}

	public float getYOffset() {
		return yOffset;
	}

	public void onTouchDragged(InputEvent event, float x, float y) {
		containerScrollbar.onTouchDragged(event, x, y);
	}

	public float getInitialHeight() {
		return initialHeight;
	}

	public ContainerScrollbar getScrollbar() {
		return containerScrollbar;
	}
}
