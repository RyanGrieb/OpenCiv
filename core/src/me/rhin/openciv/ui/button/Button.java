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
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.ui.label.CustomLabel;

public abstract class Button extends Actor {

	private String text;
	private TextureEnum textureEnum;
	private Sprite sprite;
	private Sprite hoveredSprite;
	private CustomLabel btnLabel;
	private boolean hovered;

	public Button(String text, float x, float y, float width, float height) {
		this(TextureEnum.UI_BUTTON, text, x, y, width, height);
	}

	public Button(TextureEnum textureEnum, String text, float x, float y, float width, float height) {
		this.setTouchable(Touchable.enabled);
		this.textureEnum = textureEnum;
		this.setBounds(x, y, width, height);
		this.sprite = textureEnum.sprite();
		sprite.setBounds(x, y, width, height);

		// FIXME: This should be specified in the constructor above
		this.hoveredSprite = TextureEnum.UI_BUTTON_HOVERED.sprite();
		hoveredSprite.setBounds(x, y, width, height);

		this.btnLabel = new CustomLabel(text);
		btnLabel.setSize(Gdx.graphics.getWidth(), 20);
		btnLabel.setPosition(x + width / 2 - btnLabel.getWidth() / 2, (y + height / 2) - btnLabel.getHeight() / 2);
		btnLabel.setAlignment(Align.center);

		this.addListener(new ClickListener() {
			@Override
			public void clicked(InputEvent event, float x, float y) {
				if (!Civilization.getInstance().getWindowManager().allowsInput(event.getListenerActor())) {
					return;
				}
				onClick();
			}

			@Override
			public void enter(InputEvent event, float x, float y, int pointer, Actor fromActor) {
				setHovered(true);
			}

			@Override
			public void exit(InputEvent event, float x, float y, int pointer, Actor fromActor) {
				setHovered(false);
			}
		});

		this.hovered = false;
	}

	public abstract void onClick();

	@Override
	public void draw(Batch batch, float parentAlpha) {
		// FIXME: We shouldn't be checking for a default textureEnum.
		if (textureEnum == TextureEnum.UI_BUTTON && hovered)
			hoveredSprite.draw(batch);
		else
			sprite.draw(batch);
		btnLabel.draw(batch, 1);
	}

	public void setTexture(TextureEnum textureEnum) {
		this.textureEnum = textureEnum;
		Sprite sprite = textureEnum.sprite();
		sprite.setBounds(this.sprite.getX(), this.sprite.getY(), this.sprite.getWidth(), this.sprite.getHeight());
		this.sprite = sprite;
	}

	public void setHovered(boolean hovered) {
		this.hovered = hovered;
	}

	public String getText() {
		return text;
	}

	public boolean isHovered() {
		return hovered;
	}

}
