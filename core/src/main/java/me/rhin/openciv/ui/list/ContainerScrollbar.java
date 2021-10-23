package me.rhin.openciv.ui.list;

import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.graphics.g2d.Sprite;
import com.badlogic.gdx.scenes.scene2d.Actor;
import com.badlogic.gdx.scenes.scene2d.InputEvent;
import com.badlogic.gdx.scenes.scene2d.utils.ClickListener;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.listener.ScrollListener;
import me.rhin.openciv.shared.util.MathHelper;
import me.rhin.openciv.ui.window.AbstractWindow;

public class ContainerScrollbar extends Actor implements ScrollListener {

	private ContainerList containerList;
	private Sprite backgroundSprite;
	private Sprite scrubber;
	private float nextHeight;
	private float originY;
	private float prevMouseY;

	public ContainerScrollbar(final ContainerList containerList, float x, float y, float width, float height) {

		this.setBounds(x, y, width, height);

		this.containerList = containerList;

		backgroundSprite = TextureEnum.UI_LIGHTER_GRAY.sprite();
		backgroundSprite.setBounds(x, y, width, height);

		scrubber = TextureEnum.UI_BLACK.sprite();
		scrubber.setBounds(x, y + getHeight() - 55, width, 55);
		this.originY = y;
		this.prevMouseY = -1;

		this.addListener(new ClickListener() {

			@Override
			public void touchDragged(InputEvent event, float x, float y, int pointer) {
				super.touchDragged(event, x, y, pointer);
				onTouchDragged(event, x, y);
			}

			@Override
			public void touchUp(InputEvent event, float x, float y, int pointer, int button) {
				super.touchUp(event, x, y, pointer, button);
				prevMouseY = -1;
			}

		});

		Civilization.getInstance().getEventManager().addListener(ScrollListener.class, this);
	}

	@Override
	public void draw(Batch batch, float parentAlpha) {
		super.draw(batch, parentAlpha);
		backgroundSprite.draw(batch);
		scrubber.draw(batch);
	}

	@Override
	public void setPosition(float x, float y) {
		backgroundSprite.setPosition(x, y);
		scrubber.setPosition(x, y + getHeight() - scrubber.getHeight());
	}

	@Override
	public void onScroll(float amountX, float amountY) {
		if (!Civilization.getInstance().getWindowManager().allowsInput(this)) {
			return;
		}

		float y = Civilization.getInstance().getCurrentScreen().getViewport().getWorldHeight() - Gdx.input.getY();

		if (Gdx.input.getX() >= getX() && y >= getY())
			if (Gdx.input.getX() <= getX() + getWidth() && y <= getY() + getHeight()) {
				containerList.scroll(amountY);
			}
	}

	public void onClose() {
		Civilization.getInstance().getEventManager().clearListenersFromObject(this);
	}

	public void setScrubberY(float y) {
		scrubber.setY(y);
	}

	public float getScrubberHeight() {
		return scrubber.getHeight();
	}

	public void onTouchDragged(InputEvent event, float x, float y) {

		if (event.getStageX() >= scrubber.getX() && event.getStageY() >= scrubber.getY())
			if (event.getStageX() <= scrubber.getX() + scrubber.getWidth()
					&& event.getStageY() <= scrubber.getY() + scrubber.getHeight()) {

				if (prevMouseY == -1)
					prevMouseY = event.getStageY();

				float maxHeight = 0;
				for (ListContainer container : containerList.getListContainers().values()) {
					maxHeight += container.getHeight();
				}

				if (containerList.getHeight() > maxHeight)
					return;

				float dist = ((containerList.getY() + containerList.getHeight() - scrubber.getHeight())
						- scrubber.getY()) / (containerList.getHeight() - scrubber.getHeight());

				float offset = (maxHeight - (containerList.getHeight())) * dist;

				float scrubberY = event.getStageY() - scrubber.getHeight() / 2;

				if (scrubberY < containerList.getY()) {
					prevMouseY = -1;
					scrubber.setPosition(scrubber.getX(), containerList.getY());
					containerList.setYOffset(maxHeight - containerList.getHeight());
					containerList.updatePositions();
					return;
				}

				if (scrubberY + scrubber.getHeight() > containerList.getY() + containerList.getHeight()) {
					prevMouseY = -1;
					scrubber.setPosition(scrubber.getX(),
							containerList.getY() + containerList.getHeight() - scrubber.getHeight());

					containerList.setYOffset(0);
					containerList.updatePositions();
					return;
				}

				containerList.setYOffset(offset);
				containerList.updatePositions();
				prevMouseY = event.getStageY();

				scrubber.setPosition(scrubber.getX(), scrubberY);
			}
	}
}
