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
		scrubber.setBounds(x, y, width, height);
		this.originY = y;
		this.prevMouseY = -1;

		/*
		 * this.addListener(new DragScrollListener(null) {
		 * 
		 * @Override public boolean scrolled(InputEvent event, float x, float y, int
		 * amount) { return containerList.onScrolled(event, x, y, amount); } });
		 */

		// FIXME: This doesn't seem correct.
		final ContainerScrollbar thisContainer = this;

		this.addListener(new ClickListener() {
			@Override
			public void enter(InputEvent event, float x, float y, int pointer, Actor fromActor) {
				//thisContainer.getStage().setScrollFocus(thisContainer);
			}

			@Override
			public void exit(InputEvent event, float x, float y, int pointer, Actor fromActor) {
				//thisContainer.getStage().setScrollFocus(null);
			}

			@Override
			public void touchDragged(InputEvent event, float x, float y, int pointer) {
				super.touchDragged(event, x, y, pointer);

				if (event.getStageX() >= scrubber.getX() && event.getStageY() >= scrubber.getY())
					if (event.getStageX() <= scrubber.getX() + scrubber.getWidth()
							&& event.getStageY() <= scrubber.getY() + scrubber.getHeight()) {

						if (prevMouseY == -1)
							prevMouseY = event.getStageY();

						float scrubAmount = (event.getStageY() - prevMouseY);

						// Contain the scrubber within the bounds
						if (scrubAmount < 0 && scrubber.getY() < containerList.getY()) {
							prevMouseY = -1;
							return;
						}

						if (scrubAmount > 0 && scrubber.getY() + scrubber.getHeight() > containerList.getY()
								+ containerList.getHeight()) {
							prevMouseY = -1;
							return;
						}

						// If our scrub amount exceeds our container, clamp the offset to our bounds.
						float offset = MathHelper.clamp(containerList.getYOffset() - scrubAmount, containerList.getY(),
								containerList.getY() + (containerList.getHeight() - scrubber.getHeight()));

						containerList.setYOffset(offset);
						containerList.updatePositions();
						prevMouseY = event.getStageY();
					}
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
		backgroundSprite.draw(batch);

		if (nextHeight > containerList.getHeight())
			scrubber.draw(batch);
	}

	@Override
	public void setPosition(float x, float y) {
		backgroundSprite.setPosition(x, y);
		scrubber.setPosition(x, y);
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

	public void setNextHeight(float nextHeight) {
		this.nextHeight = nextHeight;

		if (nextHeight > containerList.getHeight()) {
			float heightDiff = nextHeight - containerList.getHeight();
			scrubber.setBounds(scrubber.getX(), originY + heightDiff - containerList.getYOffset(), scrubber.getWidth(),
					containerList.getHeight() - heightDiff);
		}
	}
}
