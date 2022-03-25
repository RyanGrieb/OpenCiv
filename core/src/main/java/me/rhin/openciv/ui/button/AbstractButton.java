package me.rhin.openciv.ui.button;

import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.graphics.g2d.Sprite;
import com.badlogic.gdx.scenes.scene2d.Actor;
import com.badlogic.gdx.scenes.scene2d.InputEvent;
import com.badlogic.gdx.scenes.scene2d.Touchable;
import com.badlogic.gdx.scenes.scene2d.utils.ClickListener;
import com.badlogic.gdx.utils.Align;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.SoundEnum;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.ui.label.CustomLabel;

public abstract class AbstractButton extends Actor {

	private Sprite mainSprite, hoveredSprite, iconSprite;
	private CustomLabel label;
	private boolean hovered;

	public AbstractButton(TextureEnum mainTexture, TextureEnum hoveredTexture, float x, float y, float width,
			float height) {
		setBounds(x, y, width, height);
		this.setTouchable(Touchable.enabled);

		this.mainSprite = mainTexture.sprite();
		mainSprite.setBounds(x, y, width, height);

		this.hoveredSprite = hoveredTexture.sprite();
		hoveredSprite.setBounds(x, y, width, height);

		addListener(new ClickListener() {

			@Override
			public void clicked(InputEvent event, float x, float y) {
				if (!Civilization.getInstance().getWindowManager().allowsInput(event.getListenerActor())) {
					return;
				}

				onClicked();
				Civilization.getInstance().getSoundHandler().playEffect(SoundEnum.BUTTON_CLICK);
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

		this.hovered = false;
	}

	public AbstractButton(TextureEnum mainTexture, TextureEnum hoveredTexture, TextureEnum iconTexture, float x,
			float y, float width, float height) {
		this(mainTexture, hoveredTexture, x, y, width, height);

		this.iconSprite = iconTexture.sprite();
		iconSprite.setBounds(x, y, width, height);
	}

	public AbstractButton(TextureEnum mainTexture, TextureEnum hoveredTexture, String text, float x, float y,
			float width, float height) {
		this(mainTexture, hoveredTexture, x, y, width, height);

		this.label = new CustomLabel(text);
		label.setSize(Gdx.graphics.getWidth(), 20);
		label.setPosition(x + width / 2 - label.getWidth() / 2, (y + height / 2) - label.getHeight() / 2);
		label.setAlignment(Align.center);
	}

	/**
	 * Called when the button is clicked by the user.
	 */
	public abstract void onClicked();

	@Override
	public void draw(Batch batch, float parentAlpha) {
		// FIXME: We shouldn't be checking for a default textureEnum.
		if (hovered && hoveredSprite != null)
			hoveredSprite.draw(batch);
		else
			mainSprite.draw(batch);

		if (label != null)
			label.draw(batch, parentAlpha);
	}

	@Override
	public void setPosition(float x, float y) {
		super.setPosition(x, y);

		if (mainSprite != null)
			mainSprite.setPosition(x, y);

		if (hoveredSprite != null)
			hoveredSprite.setPosition(x, y);

		label.setPosition(x + mainSprite.getWidth() / 2 - label.getWidth() / 2,
				(y + mainSprite.getHeight() / 2) - label.getHeight() / 2);
	}

	public void setTexture(TextureEnum textureEnum) {
		Sprite mainSprite = textureEnum.sprite();

		mainSprite.setBounds(this.mainSprite.getX(), this.mainSprite.getY(), this.mainSprite.getWidth(),
				this.mainSprite.getHeight());

		this.mainSprite = mainSprite;
	}

	public void setText(String text) {
		label.setText(text);

		label.setPosition(getX() + mainSprite.getWidth() / 2 - label.getWidth() / 2,
				(getY() + mainSprite.getHeight() / 2) - label.getHeight() / 2);
	}
}