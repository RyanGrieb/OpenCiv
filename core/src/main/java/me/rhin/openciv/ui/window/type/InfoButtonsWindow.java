
package me.rhin.openciv.ui.window.type;
import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.ui.background.ColoredBackground;
import me.rhin.openciv.ui.button.CustomButton;
import me.rhin.openciv.ui.button.type.OpenChatButton;
import me.rhin.openciv.ui.window.AbstractWindow;

public class InfoButtonsWindow extends AbstractWindow {

	private ColoredBackground background;
	private OpenChatButton chatButton;
	private CustomButton openReligionInfoButton;
	private CustomButton openDiplomacyButton;

	public InfoButtonsWindow() {
		super.setBounds(4, 28, 200, 60);

		// background = new ColoredBackground(TextureEnum.UI_BLACK.sprite(), 0, 0,
		// getWidth(), getHeight());
		// addActor(background);

		this.chatButton = new OpenChatButton(0, 0, 42, 42);
		addActor(chatButton);

		this.openReligionInfoButton = new CustomButton(TextureEnum.UI_BUTTON_ICON, TextureEnum.UI_BUTTON_ICON_HOVERED,
				TextureEnum.ICON_FAITH, 52, 0, 42, 42);
		openReligionInfoButton.onClick(() -> {
			Civilization.getInstance().getWindowManager().toggleWindow(new ReligionInfoWindow());
		});
		addActor(openReligionInfoButton);

		this.openDiplomacyButton = new CustomButton(TextureEnum.UI_BUTTON_ICON, TextureEnum.UI_BUTTON_ICON_HOVERED,
				TextureEnum.ICON_DIPLOMACY, 104, 0, 42, 42);
		openDiplomacyButton.onClick(() -> {
			Civilization.getInstance().getWindowManager().toggleWindow(new DiplomacyWindow());
		});
		addActor(openDiplomacyButton);
	}

	@Override
	public boolean disablesInput() {
		return false;
	}

	@Override
	public boolean disablesCameraMovement() {
		return false;
	}

	@Override
	public boolean closesOtherWindows() {
		return false;
	}

	@Override
	public boolean closesGameDisplayWindows() {
		return false;
	}

	@Override
	public boolean isGameDisplayWindow() {
		return true;
	}

}
