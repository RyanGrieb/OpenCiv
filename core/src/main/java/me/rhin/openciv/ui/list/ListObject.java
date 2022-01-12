package me.rhin.openciv.ui.list;

import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.graphics.g2d.Sprite;
import com.badlogic.gdx.scenes.scene2d.Actor;
import com.badlogic.gdx.scenes.scene2d.Group;
import com.badlogic.gdx.scenes.scene2d.InputEvent;
import com.badlogic.gdx.scenes.scene2d.utils.ClickListener;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;

public abstract class ListObject extends Group implements Comparable<ListObject> {

	private String key;
	private Sprite seperatorSprite;
	protected ContainerList containerList;
	protected boolean hovered;

	public ListObject(float width, float height, ContainerList containerList, String key) {
		this.setSize(width, height);
		this.key = key;

		this.seperatorSprite = TextureEnum.UI_BLACK.sprite();
		seperatorSprite.setSize(width, 1);

		this.containerList = containerList;

		this.addListener(new ClickListener() {
			@Override
			public void clicked(InputEvent event, float x, float y) {
				onClicked(event);
			}

			@Override
			public void enter(InputEvent event, float x, float y, int pointer, Actor fromActor) {
				hovered = true;
			}

			@Override
			public void exit(InputEvent event, float x, float y, int pointer, Actor fromActor) {
				hovered = false;
			}
		});
	}
	
	protected abstract void onClicked(InputEvent event);

	@Override
	public void draw(Batch batch, float parentAlpha) {
		super.draw(batch, parentAlpha);
		seperatorSprite.draw(batch);
	}

	@Override
	public void setPosition(float x, float y) {
		super.setPosition(x, y);
		seperatorSprite.setPosition(x, y);
	}

	@Override
	public int compareTo(ListObject listObj) {
		return key.compareTo(listObj.getKey());
	}

	public boolean inContainerListBounds() {
		float x = Gdx.input.getX();
		float y = Civilization.getInstance().getCurrentScreen().getViewport().getWorldHeight() - Gdx.input.getY();

		if (x > containerList.getX() && x < (containerList.getX() + containerList.getWidth()))
			if (y > containerList.getY() && y < (containerList.getY() + containerList.getInitialHeight())) {
				return true;
			}

		return false;
	}

	public String getKey() {
		return key;
	}
}
