package me.rhin.openciv.ui.list;

import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.graphics.g2d.Sprite;
import com.badlogic.gdx.scenes.scene2d.Actor;
import com.badlogic.gdx.scenes.scene2d.InputEvent;
import com.badlogic.gdx.scenes.scene2d.utils.ClickListener;
import com.badlogic.gdx.scenes.scene2d.utils.DragListener;

import me.rhin.openciv.asset.TextureEnum;

public class ContainerScrollbar extends Actor {

	private ContainerList containerList;
	private Sprite backgroundSprite;
	private Sprite scrubber;
	private float nextHeight;
	private float originY;
	private float prevMouseY;

	public ContainerScrollbar(final ContainerList containerList, float x, float y, float width, float height) {

		this.setBounds(x, y, width, height);

		this.containerList = containerList;

		backgroundSprite = TextureEnum.UI_LIGHT_GRAY.sprite();
		backgroundSprite.setBounds(x, y, width, height);

		scrubber = TextureEnum.UI_BLACK.sprite();
		scrubber.setBounds(x, y, width, height);
		this.originY = y;
		this.prevMouseY = -1;

		this.addListener(new DragListener() {
			@Override
			public boolean scrolled(InputEvent event, float x, float y, int amount) {

				return containerList.onScrolled(event, x, y, amount);
			}
		});

		// FIXME: This doesn't seem correct.
		final ContainerScrollbar thisContainer = this;

		this.addListener(new ClickListener() {
			@Override
			public void enter(InputEvent event, float x, float y, int pointer, Actor fromActor) {
				thisContainer.getStage().setScrollFocus(thisContainer);
			}

			@Override
			public void exit(InputEvent event, float x, float y, int pointer, Actor fromActor) {
				thisContainer.getStage().setScrollFocus(null);
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

						// Keep dragging in bounds
						if (scrubber.getY() + scrubAmount < containerList.getY()) {
							scrubber.setPosition(scrubber.getX(), containerList.getY());
							prevMouseY = -1;
							return;
						}

						if (scrubber.getY() + scrubber.getHeight() + scrubAmount > containerList.getY()
								+ containerList.getHeight()) {
							scrubber.setPosition(scrubber.getX(),
									(containerList.getY() + containerList.getHeight() - scrubber.getHeight()));
							prevMouseY = -1;
							return;
						}

						containerList.setYOffset(containerList.getYOffset() - scrubAmount);
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
	}

	@Override
	public void draw(Batch batch, float parentAlpha) {
		backgroundSprite.draw(batch);

		if (nextHeight > containerList.getHeight())
			scrubber.draw(batch);
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
