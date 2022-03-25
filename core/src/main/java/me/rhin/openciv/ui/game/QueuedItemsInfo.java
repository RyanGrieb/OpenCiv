package me.rhin.openciv.ui.game;

import com.badlogic.gdx.scenes.scene2d.Group;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.ui.background.ColoredBackground;
import me.rhin.openciv.ui.button.CustomButton;

public class QueuedItemsInfo extends Group {

	private City city;
	private ColoredBackground coloredBackground;
	private CustomButton button;

	public QueuedItemsInfo(City city, float x, float y, float width, float height) {
		setBounds(x, y, width, height);
		this.city = city;

		this.coloredBackground = new ColoredBackground(TextureEnum.UI_POPUP_BOX_C.sprite(), x, y, width, height);
		addActor(coloredBackground);

		this.button = new CustomButton(TextureEnum.UI_BUTTON, TextureEnum.UI_BUTTON_HOVERED, TextureEnum.ICON_CLOCK, 6,
				getHeight() - 32, 32, 32);
		button.onClick(() -> {
			System.out.println("Hello.");
		});
	}
}
