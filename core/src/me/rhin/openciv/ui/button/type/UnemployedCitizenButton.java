package me.rhin.openciv.ui.button.type;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.ui.button.Button;

public class UnemployedCitizenButton extends Button {

	public UnemployedCitizenButton(float x, float y, float width, float height) {
		super(TextureEnum.ICON_CITIZEN_LOCKED, "", x, y, width, height);
	}

	@Override
	public void onClick() {
		System.out.println("Add back.");
	}

}
