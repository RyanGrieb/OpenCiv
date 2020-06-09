package me.rhin.openciv.ui.button;

import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.graphics.Texture;
import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.graphics.g2d.Sprite;
import com.badlogic.gdx.scenes.scene2d.Actor;
import com.badlogic.gdx.utils.Align;

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
		this.textureEnum = textureEnum;
		this.setPosition(x, y);
		this.setSize(width, height);
		this.sprite = textureEnum.sprite();
		sprite.setSize(getWidth(), getHeight());
		sprite.setPosition(getX(), getY());

		// FIXME: This should be specified in the constructor above
		this.hoveredSprite = TextureEnum.UI_BUTTON_HOVERED.sprite();
		hoveredSprite.setSize(getWidth(), getHeight());
		hoveredSprite.setPosition(getX(), getY());

		this.btnLabel = new CustomLabel(text);
		btnLabel.setSize(Gdx.graphics.getWidth(), 20);
		btnLabel.setPosition(x + width / 2 - btnLabel.getWidth() / 2, (y + height / 2) - btnLabel.getHeight() / 2);
		btnLabel.setAlignment(Align.center);

		this.hovered = false;
	}

	public abstract void onClick();

	@Override
	public void act(float delta) {
		super.act(delta);
	}

	@Override
	public void draw(Batch batch, float parentAlpha) {
		// FIXME: We shouldn't be checking for a default textureEnum.
		if (textureEnum == TextureEnum.UI_BUTTON && hovered)
			hoveredSprite.draw(batch);
		else
			sprite.draw(batch);
		btnLabel.draw(batch, 1);
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
