package me.rhin.openciv.ui.list;

import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.graphics.g2d.Sprite;
import com.badlogic.gdx.scenes.scene2d.Actor;
import com.badlogic.gdx.scenes.scene2d.InputEvent;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.shared.listener.EventHandler;
import me.rhin.openciv.shared.listener.Listener;

public class ContainerScrollbar extends Actor implements Listener {

	private ContainerList containerList;
	private Sprite backgroundSprite;
	private Sprite scrubber;
	private float nextHeight;
	private float originY;
	private float prevMouseY;

	public ContainerScrollbar(final ContainerList containerList, float x, float y, float width, float height) {
		setBounds(x, y, width, height);

		this.containerList = containerList;

		backgroundSprite = TextureEnum.UI_LIGHTER_GRAY.sprite();
		backgroundSprite.setBounds(containerList.getWidth() - width, 0, width, height);

		scrubber = TextureEnum.UI_BLACK.sprite();
		scrubber.setBounds(containerList.getWidth() - width, getHeight() - 55, width, 55);
		this.originY = y;
		this.prevMouseY = -1;

		Civilization.getInstance().getEventManager().addListener(this);
	}

	@Override
	public void draw(Batch batch, float parentAlpha) {
		super.draw(batch, parentAlpha);
		backgroundSprite.draw(batch);
		scrubber.draw(batch);
	}

	@Override
	public void setPosition(float x, float y) {
		backgroundSprite.setPosition(containerList.getWidth() - getWidth(), 0);
		scrubber.setPosition(containerList.getWidth() - getWidth(), getHeight() - 55);
	}

	@EventHandler
	public void onScroll(float amountX, float amountY) {
		if (!Civilization.getInstance().getWindowManager().allowsInput(this)) {
			return;
		}

		float y = Civilization.getInstance().getCurrentScreen().getViewport().getWorldHeight() - Gdx.input.getY();

		float xPos = getX();
		float yPos = getY();

		if (getParent() != null) {
			xPos += getParent().getX();
			yPos += getParent().getY();
		}
		if (Gdx.input.getX() >= xPos && y >= yPos)
			if (Gdx.input.getX() <= xPos + getWidth() && y <= yPos + getHeight()) {
				containerList.scroll(amountY);
			}
	}

	public void onClose() {
		Civilization.getInstance().getEventManager().removeListener(this);
	}

	public void setScrubberY(float y) {
		scrubber.setY(y);
	}

	public float getScrubberHeight() {
		return scrubber.getHeight();
	}

	public void onTouchDragged(InputEvent event, float x, float y) {

		float xPos = scrubber.getX();
		float yPos = scrubber.getY();

		if (getParent() != null) {
			// xPos += getParent().getX();
			// yPos += getParent().getY();
		}

		if (x >= xPos && y >= yPos)
			if (x <= xPos + scrubber.getWidth() && y <= yPos + scrubber.getHeight()) {

				if (prevMouseY == -1)
					prevMouseY = y;

				float maxHeight = 0;
				for (ListContainer container : containerList.getListContainers().values()) {
					maxHeight += container.getHeight();
				}

				if (containerList.getHeight() > maxHeight)
					return;

				float dist = ((containerList.getHeight() - scrubber.getHeight()) - yPos)
						/ (containerList.getHeight() - scrubber.getHeight());

				float offset = (maxHeight - (containerList.getHeight())) * dist;

				float scrubberY = y - scrubber.getHeight() / 2;

				if (scrubberY < 0) {
					prevMouseY = -1;
					scrubber.setPosition(xPos, 0);
					containerList.setYOffset(maxHeight - containerList.getHeight());
					containerList.updatePositions();
					return;
				}

				if (scrubberY + scrubber.getHeight() > containerList.getHeight()) {
					prevMouseY = -1;
					scrubber.setPosition(xPos, containerList.getHeight() - scrubber.getHeight());

					containerList.setYOffset(0);
					containerList.updatePositions();
					return;
				}

				containerList.setYOffset(offset);
				containerList.updatePositions();
				prevMouseY = event.getStageY();

				scrubber.setPosition(xPos, scrubberY);
			}
	}
}
