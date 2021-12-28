package me.rhin.openciv.ui.button.type;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.options.OptionType;
import me.rhin.openciv.ui.button.Button;

public class FullscreenButton extends Button {

	public FullscreenButton(String name, float x, float y, float width, float height) {
		super(name, x, y, width, height);

	}

	@Override
	public void onClick() {
		int currentValue = Civilization.getInstance().getGameOptions().getInt(OptionType.FULLSCREEN_ENABLED);
		Civilization.getInstance().getGameOptions().setInt(OptionType.FULLSCREEN_ENABLED, (currentValue == 0 ? 1 : 0));

		String fullscreenButtonName = (Civilization.getInstance().getGameOptions()
				.getInt(OptionType.FULLSCREEN_ENABLED) == 1 ? "Disable Fullscreen" : "Enable Fullscreen");
		
		this.setText(fullscreenButtonName);
	}

}
