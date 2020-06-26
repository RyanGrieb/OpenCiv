package me.rhin.openciv.ui.list;

import java.util.ArrayList;
import java.util.HashMap;

import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.graphics.g2d.Sprite;
import com.badlogic.gdx.scenes.scene2d.Actor;
import com.badlogic.gdx.scenes.scene2d.InputEvent;
import com.badlogic.gdx.scenes.scene2d.utils.DragListener;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;

public class ItemList extends Actor {

	private int yOffset;
	private HashMap<Class<?>, ListContainer> listContainers;
	private Sprite backgroundSprite;

	public ItemList(float x, float y, float width, float height) {
		this.yOffset = 0;
		this.listContainers = new HashMap<>();
		this.setBounds(x, y, width, height);
		this.addListener(new DragListener() {

			@Override
			public boolean scrolled(InputEvent event, float x, float y, int amount) {
				// FIXME: We shouldn't use a low level listener for this. We shouldn't have to
				// check for the bounds here.

				if (!Civilization.getInstance().getWindowManager().allowsInput()) {
					if (!Civilization.getInstance().getWindowManager().isDisabledWindow(getStage()))
						return false;
				}

				if (event.getStageX() >= getX() && event.getStageY() >= getY())
					if (event.getStageX() <= getX() + getWidth() && event.getStageY() <= getY() + getHeight()) {
						scroll(amount);
					}
				return false;
			}
		});
		backgroundSprite = TextureEnum.UI_BLACK.sprite();
		backgroundSprite.setPosition(x, y);
		backgroundSprite.setSize(width, height);
	}

	@Override
	public void act(float delta) {
		super.act(delta);
	}

	@Override
	public void draw(Batch batch, float parentAlpha) {
		backgroundSprite.draw(batch);
		for (ListContainer container : listContainers.values()) {
			if (container.getY() > getY())
				container.draw(batch, parentAlpha);
		}
	}

	public void scroll(int amount) {
		// TODO: Display certain items depending on the yOffset.
		yOffset += amount;
		for (ListContainer container : listContainers.values()) {
			container.setYOffset(yOffset);
		}
	}

	public void addItem(Class<?> classType, ListItem listItem) {
		if (!listContainers.containsKey(classType)) {
			listContainers.put(classType, new ListContainer(classType.getSimpleName() + "s", getWidth(), 15));
			ListContainer container = listContainers.get(classType);
			container.setPosition(getX(), (getY() + getHeight() - container.getHeight())
					- (listContainers.size() - 1) * container.getHeight());
		}
		listContainers.get(classType).addItem(listItem);
	}
}
