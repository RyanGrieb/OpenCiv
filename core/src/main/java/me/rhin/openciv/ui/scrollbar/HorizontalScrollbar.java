package me.rhin.openciv.ui.scrollbar;

import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.graphics.g2d.Sprite;
import com.badlogic.gdx.scenes.scene2d.Actor;
import com.badlogic.gdx.scenes.scene2d.InputEvent;
import com.badlogic.gdx.scenes.scene2d.utils.ClickListener;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.listener.ResizeListener;
import me.rhin.openciv.listener.ScrollListener;
import me.rhin.openciv.ui.window.HorizontalWindow;

public class HorizontalScrollbar extends Actor implements ScrollListener {

	private HorizontalWindow window;
	private Sprite backgroundSprite;
	private Sprite scrubber;

	private float prevScrollX;
	private float prevMouseX;

	public HorizontalScrollbar(HorizontalWindow window, float x, float y, float width, float height) {

		this.window = window;

		this.backgroundSprite = TextureEnum.UI_DARK_GRAY.sprite();
		this.scrubber = TextureEnum.UI_LIGHTER_GRAY.sprite();
		this.prevScrollX = -1;
		this.prevMouseX = -1;

		// Scrubber width is the initial viewed width / total width of tree
		setBounds(x, y, width, height);

		this.addListener(new ClickListener() {

			@Override
			public void touchDragged(InputEvent event, float x, float y, int pointer) {
				super.touchDragged(event, x, y, pointer);
				onTouchDragged(event, x, y);
			}

			@Override
			public void touchUp(InputEvent event, float x, float y, int pointer, int button) {
				super.touchUp(event, x, y, pointer, button);
			}

		});

		Civilization.getInstance().getEventManager().addListener(ScrollListener.class, this);
	}

	@Override
	public void onScroll(float amountX, float amountY) {
		float scrubberX = (scrubber.getX() + (amountY * 10));

		setScrubberX(scrubberX);
	}

	@Override
	public void setBounds(float x, float y, float width, float height) {
		super.setBounds(x, y, width, height);
		backgroundSprite.setBounds(x, y, width, height);

		float scrubberWidth = window.getWidth() / window.getTotalWidth();
		scrubber.setBounds(0, y, width * scrubberWidth, height);

		prevScrollX = -1;
		prevMouseX = -1;
	}

	@Override
	public void draw(Batch batch, float alpha) {
		backgroundSprite.draw(batch);
		scrubber.draw(batch);
	}

	private void onTouchDragged(InputEvent event, float x, float y) {

		if (event.getStageX() >= scrubber.getX() && event.getStageY() >= scrubber.getY())
			if (event.getStageX() <= scrubber.getX() + scrubber.getWidth()
					&& event.getStageY() <= scrubber.getY() + scrubber.getHeight()) {

				if (prevMouseX == -1)
					prevMouseX = event.getStageX();

				float scrubberX = scrubber.getX() + (event.getStageX() - prevMouseX);

				setScrubberX(scrubberX);

				prevMouseX = event.getStageX();
			}
	}

	private void setScrubberX(float scrubberX) {
		if (scrubberX < 0) {
			scrubberX = 0;
		}

		if (scrubberX + scrubber.getWidth() > getX() + getWidth()) {
			scrubberX = getX() + getWidth() - scrubber.getWidth();
		}

		if (prevScrollX == -1)
			prevScrollX = scrubberX;

		scrubber.setPosition(scrubberX, scrubber.getY());

		window.updatePositions(prevScrollX - scrubberX);

		prevScrollX = scrubberX;
	}
}
