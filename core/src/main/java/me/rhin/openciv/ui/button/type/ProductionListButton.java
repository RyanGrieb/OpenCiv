package me.rhin.openciv.ui.button.type;

import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.graphics.g2d.Sprite;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.ui.button.Button;

public class ProductionListButton extends Button {

	private Sprite clockSprite;

	public ProductionListButton(float x, float y, float width, float height) {
		super(TextureEnum.UI_BUTTON_SMALL, "", x, y, width, height);

		this.hoveredSprite = TextureEnum.UI_BUTTON_SMALL_HOVERED.sprite();
		hoveredSprite.setBounds(x, y, width, height);

		clockSprite = TextureEnum.ICON_CLOCK.sprite();
		clockSprite.setBounds(x + (width / 2) - (16 / 2), y + (height / 2) - (16 / 2), 16, 16);
	}

	@Override
	public void onClick() {
		// TODO: Implement
	}

	@Override
	public void draw(Batch batch, float parentAlpha) {
		super.draw(batch, parentAlpha);
		clockSprite.draw(batch);
	}

	// FIXME: This isn't ideal updating the icon in a custom button. Make the button
	// class do that.
	@Override
	public void setPosition(float x, float y) {
		super.setPosition(x, y);
		clockSprite.setPosition(x + (getWidth() / 2) - (16 / 2), y + (getHeight() / 2) - (16 / 2));
	}

}
