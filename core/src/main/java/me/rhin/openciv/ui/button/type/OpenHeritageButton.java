package me.rhin.openciv.ui.button.type;

import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.graphics.g2d.Sprite;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.ui.button.Button;
import me.rhin.openciv.ui.window.type.HeritageWindow;

public class OpenHeritageButton extends Button {

	private Sprite heritageIconSprite;

	public OpenHeritageButton(float x, float y, float width, float height) {
		super(TextureEnum.UI_BUTTON_SMALL, "", x, y, width, height);

		this.hoveredSprite = TextureEnum.UI_BUTTON_SMALL_HOVERED.sprite();
		hoveredSprite.setBounds(x, y, width, height);

		heritageIconSprite = TextureEnum.ICON_HERITAGE.sprite();
		heritageIconSprite.setBounds(x + (width / 2) - (16 / 2), y + (height / 2) - (16 / 2), 16, 16);
	}

	@Override
	public void onClick() {
		// TODO: Prompt the player that they need to settle a city.
		if (Civilization.getInstance().getGame().getPlayer().getOwnedCities().size() < 1)
			return;

		Civilization.getInstance().getWindowManager().toggleWindow(new HeritageWindow());
	}

	@Override
	public void draw(Batch batch, float parentAlpha) {
		super.draw(batch, parentAlpha);
		heritageIconSprite.draw(batch);
	}

	// FIXME: This isn't ideal updating the icon in a custom button. Make the button
	// class do that.
	@Override
	public void setPosition(float x, float y) {
		super.setPosition(x, y);
		heritageIconSprite.setPosition(x + (getWidth() / 2) - (16 / 2), y + (getHeight() / 2) - (16 / 2));
	}

}
