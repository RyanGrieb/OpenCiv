package me.rhin.openciv.ui.button.type;

import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.graphics.g2d.Sprite;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.research.Unlockable;
import me.rhin.openciv.ui.button.Button;
import me.rhin.openciv.ui.window.type.ItemInfoWindow;

public class ResearchUnlockableButton extends Button {

	private Unlockable unlockable;
	private Sprite unlockableSprite;

	public ResearchUnlockableButton(Unlockable unlockable, float x, float y) {
		super(TextureEnum.UI_BUTTON_ICON, "", x, y, 48, 48);

		this.unlockable = unlockable;

		this.hoveredSprite = TextureEnum.UI_BUTTON_ICON_HOVERED.sprite();
		hoveredSprite.setBounds(x, y, 48, 48);

		this.unlockableSprite = unlockable.getTexture().sprite();
		unlockableSprite.setBounds(x + getWidth() / 2 - 32 / 2, y + getHeight() / 2 - 32 / 2, 32, 32);
	}

	@Override
	public void onClick() {
		Civilization.getInstance().getWindowManager().addWindow(new ItemInfoWindow(unlockable));
	}

	@Override
	public void draw(Batch batch, float parentAlpha) {
		super.draw(batch, parentAlpha);
		unlockableSprite.draw(batch);
	}

}
