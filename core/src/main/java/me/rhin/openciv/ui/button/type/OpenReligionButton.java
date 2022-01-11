package me.rhin.openciv.ui.button.type;

import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.graphics.g2d.Sprite;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.ui.button.Button;
import me.rhin.openciv.ui.window.type.ReligionInfoWindow;

public class OpenReligionButton extends Button {

	private Sprite iconSprite;

	public OpenReligionButton(float x, float y, float width, float height) {
		super(TextureEnum.UI_BUTTON_ICON, "", x, y, width, height);

		this.hoveredSprite = TextureEnum.UI_BUTTON_ICON_HOVERED.sprite();
		hoveredSprite.setBounds(x, y, width, height);

		this.iconSprite = TextureEnum.ICON_FAITH.sprite();
		iconSprite.setBounds(x + (width / 2) - (24 / 2), y + (height / 2) - (24 / 2), 24, 24);
	}

	@Override
	public void draw(Batch batch, float parentAlpha) {
		super.draw(batch, parentAlpha);
		iconSprite.draw(batch);
	}

	@Override
	public void onClick() {
		Civilization.getInstance().getWindowManager().toggleWindow(new ReligionInfoWindow());
	}
	
}
