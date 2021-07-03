package me.rhin.openciv.ui.list;

import java.util.HashMap;

import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.graphics.g2d.Sprite;
import com.badlogic.gdx.scenes.scene2d.Actor;
import com.badlogic.gdx.scenes.scene2d.Group;
import com.badlogic.gdx.scenes.scene2d.InputEvent;
import com.badlogic.gdx.scenes.scene2d.Stage;
import com.badlogic.gdx.scenes.scene2d.utils.ClickListener;
import com.badlogic.gdx.scenes.scene2d.utils.DragListener;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.ui.list.ListContainer.ListContainerType;
import me.rhin.openciv.ui.window.AbstractWindow;

//FIXME: The naming of ContainerList and ListContainer is bad.

public class ContainerList extends Group {

	private float yOffset;
	private HashMap<String, ListContainer> listContainers;
	private ContainerScrollbar containerScrollbar;
	private Sprite backgroundSprite;

	public ContainerList(AbstractWindow window, float x, float y, float width, float height) {
		this(x, y, width, height);
		window.addActor(containerScrollbar);
	}

	public ContainerList(Stage stage, float x, float y, float width, float height) {
		this(x, y, width, height);
		stage.addActor(containerScrollbar);
	}

	public ContainerList(float x, float y, float width, float height) {
		this.yOffset = 0;
		this.listContainers = new HashMap<>();

		this.setBounds(x, y, width, height);

		this.containerScrollbar = new ContainerScrollbar(this, x + width, y, 20, height);

		backgroundSprite = TextureEnum.UI_LIGHT_GRAY.sprite();
		backgroundSprite.setPosition(x, y);
		backgroundSprite.setSize(width, height);
		// this.setCullingArea(new Rectangle(x, y, width, height));

		this.addListener(new DragListener() {
			@Override
			public boolean scrolled(InputEvent event, float x, float y, int amount) {
				return onScrolled(event, x, y, amount);
			}
		});

		// FIXME: This doesn't seem correct.
		final ContainerList thisContainer = this;

		this.addListener(new ClickListener() {
			@Override
			public void enter(InputEvent event, float x, float y, int pointer, Actor fromActor) {
				if (thisContainer != null)
					thisContainer.getStage().setScrollFocus(thisContainer);
			}

			@Override
			public void exit(InputEvent event, float x, float y, int pointer, Actor fromActor) {
				if (thisContainer != null)
					thisContainer.getStage().setScrollFocus(null);
			}
		});
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

	public boolean onScrolled(InputEvent event, float x, float y, int amount) {
		// FIXME: We shouldn't use a low level listener for this. We shouldn't have to
		// check for the bounds here.
		if (!Civilization.getInstance().getWindowManager().allowsInput(event.getListenerActor())) {
			return false;
		}

		// FIXME: I would be weary of commenting out the bounding check here.
		// if (event.getStageX() >= getX() && event.getStageY() >= getY())
		// if (event.getStageX() <= getX() + getWidth() && event.getStageY() <= getY() +
		// getHeight()) {
		scroll(amount);
		// }
		return false;
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
		listContainers.get(listContainerName).removeItem(itemKey);
		updatePositions();
	}

	public void updatePositions() {
		float nextHeight = 0;

		// Problem:
		for (ListContainer container : listContainers.values()) {
			container.setPosition(0, yOffset + (0 + getHeight()) - container.getHeight() - nextHeight);
			nextHeight += container.getHeight();
		}

		containerScrollbar.setNextHeight(nextHeight);
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
}
