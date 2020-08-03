package me.rhin.openciv.ui.list;

import java.util.HashMap;

import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.graphics.g2d.Sprite;
import com.badlogic.gdx.scenes.scene2d.Actor;
import com.badlogic.gdx.scenes.scene2d.Group;
import com.badlogic.gdx.scenes.scene2d.InputEvent;
import com.badlogic.gdx.scenes.scene2d.utils.ClickListener;
import com.badlogic.gdx.scenes.scene2d.utils.DragListener;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.ui.list.ListContainer.ListContainerType;

public class ContainerList extends Group {

	private int yOffset;
	private HashMap<String, ListContainer> listContainers;
	private Sprite backgroundSprite;

	public ContainerList(float x, float y, float width, float height) {
		this.yOffset = 0;
		this.listContainers = new HashMap<>();
		this.setBounds(x, y, width, height);

		backgroundSprite = TextureEnum.UI_LIGHT_GRAY.sprite();
		backgroundSprite.setPosition(x, y);
		backgroundSprite.setSize(width, height);
		// this.setCullingArea(new Rectangle(x, y, width, height));

		this.addListener(new DragListener() {
			@Override
			public boolean scrolled(InputEvent event, float x, float y, int amount) {
				// FIXME: We shouldn't use a low level listener for this. We shouldn't have to
				// check for the bounds here.

				if (!Civilization.getInstance().getWindowManager().allowsInput(event.getListenerActor())) {
					return false;
				}

				if (event.getStageX() >= getX() && event.getStageY() >= getY())
					if (event.getStageX() <= getX() + getWidth() && event.getStageY() <= getY() + getHeight()) {
						scroll(amount);
					}
				return false;
			}
		});

		// FIXME: This doesn't seem correct.
		final ContainerList thisContainer = this;

		this.addListener(new ClickListener() {
			@Override
			public void enter(InputEvent event, float x, float y, int pointer, Actor fromActor) {
				thisContainer.getStage().setScrollFocus(thisContainer);
			}

			@Override
			public void exit(InputEvent event, float x, float y, int pointer, Actor fromActor) {
				thisContainer.getStage().setScrollFocus(null);
			}
		});
	}

	@Override
	public void draw(Batch batch, float parentAlpha) {
		backgroundSprite.draw(batch);

		batch.flush();
		if (clipBegin(getX(), getY(), getWidth(), getHeight())) {
			drawChildren(batch, parentAlpha);
			batch.flush();
			clipEnd();
		}
	}

	public void scroll(int amount) {
		int yAmount = yOffset + (amount * 12);
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

	public void addItem(ListContainerType containerType, String categoryType, Actor itemActor) {
		if (!listContainers.containsKey(categoryType)) {
			listContainers.put(categoryType, new ListContainer(this, containerType, categoryType, getWidth()));
		}

		listContainers.get(categoryType).addItem(itemActor);
		updatePositions();

		addActor(listContainers.get(categoryType));
	}

	private void updatePositions() {
		float nextHeight = 0;

		// Problem:
		for (ListContainer container : listContainers.values()) {
			container.setPosition(getX(), yOffset + (getY() + getHeight()) - container.getHeight() - nextHeight);
			nextHeight += container.getHeight();
		}
	}

	public void clearList() {
		for (ListContainer container : listContainers.values()) {
			removeActor(container);
		}

		listContainers.clear();
	}
	
	public HashMap<String, ListContainer> getListContainers(){
		return listContainers;
	}
}
