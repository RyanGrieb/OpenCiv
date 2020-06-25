package me.rhin.openciv.ui.list;

import java.util.ArrayList;

import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.graphics.g2d.Sprite;
import com.badlogic.gdx.scenes.scene2d.Actor;
import com.badlogic.gdx.scenes.scene2d.InputEvent;
import com.badlogic.gdx.scenes.scene2d.utils.DragListener;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;

public class ItemList extends Actor {

	private int yOffset;
	private ArrayList<ListItem> listItems;
	private Sprite backgroundSprite;

	public ItemList(float x, float y, float width, float height) {
		this.yOffset = 0;
		this.listItems = new ArrayList<>();
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
		for (ListItem item : listItems) {
			if (item.getY() > getY())
				item.draw(batch, parentAlpha);
		}
	}

	public void scroll(int amount) {
		//TODO: Display certain items depending on the yOffset.
		yOffset += amount;
		for (ListItem item : listItems) {
			item.setYOffset(yOffset);
		}
	}

	public void addItem(ListItem listItem) {
		listItems.add(listItem);
		listItem.setPosition(getX(),
				(getY() + getHeight() - listItem.getHeight()) - (listItems.size() - 1) * listItem.getHeight());
	}
}
