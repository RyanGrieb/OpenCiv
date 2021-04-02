package me.rhin.openciv.ui.button.type;

import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.graphics.g2d.Sprite;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.ui.button.Button;

public class OpenResearchButton extends Button {

	private Sprite researchIconSprite;

	public OpenResearchButton(float x, float y, float width, float height) {
		super(TextureEnum.UI_BUTTON_SMALL, "", x, y, width, height);

		this.hoveredSprite = TextureEnum.UI_BUTTON_SMALL_HOVERED.sprite();
		hoveredSprite.setBounds(x, y, width, height);

		researchIconSprite = TextureEnum.ICON_RESEARCH.sprite();
		researchIconSprite.setBounds(x + (width / 2) - (16 / 2), y + (height / 2) - (16 / 2), 16, 16);
	}

	@Override
	public void onClick() {

	}

	@Override
	public void draw(Batch batch, float parentAlpha) {
		super.draw(batch, parentAlpha);
		researchIconSprite.draw(batch);
	}

}
