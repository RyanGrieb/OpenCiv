package me.rhin.openciv.ui.scrub;

import com.badlogic.gdx.scenes.scene2d.Group;
import com.badlogic.gdx.scenes.scene2d.InputEvent;
import com.badlogic.gdx.scenes.scene2d.utils.ClickListener;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.listener.ScrubberPositionUpdateListener.ScrubberPositionUpdateEvent;
import me.rhin.openciv.ui.background.ColoredBackground;

public class ScrubBar extends Group {

	private ColoredBackground background;
	private ColoredBackground fillBackground;
	private ColoredBackground scrubber;

	private float value;
	private float prevMouseX;
	private boolean clickedScrubber;

	public ScrubBar(float x, float y, float width, float height) {
		super.setBounds(x, y, width, height);

		background = new ColoredBackground(TextureEnum.UI_LIGHT_GRAY.sprite(), 0, 5, width, height - 5);
		addActor(background);

		fillBackground = new ColoredBackground(TextureEnum.UI_GREEN.sprite(), 0, 5, (value / 100) * width, height - 5);
		addActor(fillBackground);

		scrubber = new ColoredBackground(TextureEnum.UI_DARK_GRAY.sprite(), 0, 0, 20, height + 5);
		addActor(scrubber);

		this.addListener(new ClickListener() {

			@Override
			public boolean touchDown(InputEvent event, float x, float y, int pointer, int button) {
				super.touchDown(event, x, y, pointer, button);

				float scrubberX = getX() + scrubber.getX();
				float scrubberY = getY() + scrubber.getY();

				if (event.getStageX() >= scrubberX && event.getStageY() >= scrubberY)
					if (event.getStageX() <= scrubberX + scrubber.getWidth()
							&& event.getStageY() <= scrubberY + scrubber.getHeight()) {
						clickedScrubber = true;
					}

				return true;
			}

			@Override
			public void touchDragged(InputEvent event, float x, float y, int pointer) {
				super.touchDragged(event, x, y, pointer);
				onTouchDragged(event, x, y);
			}

			@Override
			public void touchUp(InputEvent event, float x, float y, int pointer, int button) {
				super.touchUp(event, x, y, pointer, button);
				prevMouseX = -1;

				clickedScrubber = false;
			}

		});

		prevMouseX = -1;
	}
	
	public void setValue(float value) {
		this.value = value;
		fillBackground.setWidth((value / 100F) * getWidth());

		// 0, or getWidth() - scrubber.getWidth()
		scrubber.setPosition((value / 100F) * (getWidth() - scrubber.getWidth()), scrubber.getY());
	}
	
	public float getValue() {
		return value;
	}
	
	private void onTouchDragged(InputEvent event, float x, float y) {

		if (event.getStageX() < getX() || event.getStageY() < getY() || event.getStageX() > getX() + getWidth()
				|| event.getStageY() > getY() + getHeight()) {
			clickedScrubber = false;
		}

		if (!clickedScrubber)
			return;

		if (prevMouseX == -1)
			prevMouseX = event.getStageX();

		float scrubberX = scrubber.getX() + (event.getStageX() - prevMouseX);

		if (scrubberX < 0)
			scrubberX = 0;

		if (scrubberX > getWidth() - scrubber.getWidth())
			scrubberX = getWidth() - scrubber.getWidth();

		scrubber.setPosition(scrubberX, scrubber.getY());

		prevMouseX = event.getStageX();

		float value = 100 * (scrubber.getX() / (getWidth() - scrubber.getWidth()));

		setValue(value);
		
		Civilization.getInstance().getEventManager().fireEvent(new ScrubberPositionUpdateEvent(this));
	}

}
