package me.rhin.openciv.ui.button.type;

import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.graphics.g2d.Sprite;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.religion.icon.ReligionIcon;
import me.rhin.openciv.shared.util.StrUtil;
import me.rhin.openciv.ui.button.Button;
import me.rhin.openciv.ui.window.type.FoundReligionWindow;

public class ReligionIconButton extends Button {

	private ReligionIcon religionIcon;
	private Sprite iconSprite;

	public ReligionIconButton(ReligionIcon religionIcon, float x, float y, float width, float height) {
		super(TextureEnum.UI_BUTTON_CIRCLE, "", x, y, width, height);

		this.religionIcon = religionIcon;

		this.hoveredSprite = TextureEnum.UI_BUTTON_CIRCLE_HOVERED.sprite();
		hoveredSprite.setBounds(x, y, width, height);

		iconSprite = religionIcon.getTexture().sprite();
		iconSprite.setBounds(x + (width / 2) - (32 / 2), y + (height / 2) - (32 / 2), 32, 32);
	}

	@Override
	public void onClick() {

		FoundReligionWindow window = (FoundReligionWindow) getParent();

		window.getReligionNameLabel().setText(StrUtil.capitalize(religionIcon.name().toLowerCase()));

		float x = window.getReligionIconBackground().getX();
		float y = window.getReligionIconBackground().getY();
		window.getReligionIconBackground().setSprite(religionIcon.getTexture().sprite());
		window.getReligionIconBackground().setBounds(x, y, 32, 32);

		window.setReligionIcon(religionIcon);
		window.checkFoundableCondition();
	}

	@Override
	public void draw(Batch batch, float parentAlpha) {
		super.draw(batch, parentAlpha);
		iconSprite.draw(batch);
	}

	// FIXME: This isn't ideal updating the icon in a custom button. Make the button
	// class do that.
	@Override
	public void setPosition(float x, float y) {
		super.setPosition(x, y);
		iconSprite.setPosition(x + (getWidth() / 2) - (32 / 2), y + (getHeight() / 2) - (32 / 2));
	}

	public ReligionIcon getReligionIcon() {
		return religionIcon;
	}
}
