package me.rhin.openciv.ui.window.type;

import com.badlogic.gdx.scenes.scene2d.ui.Skin;
import com.badlogic.gdx.scenes.scene2d.ui.TextField;
import com.badlogic.gdx.scenes.scene2d.ui.TextField.TextFieldListener;
import com.badlogic.gdx.utils.Align;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.shared.listener.EventHandler;
import me.rhin.openciv.shared.packet.type.ChangeNamePacket;
import me.rhin.openciv.ui.background.ColoredBackground;
import me.rhin.openciv.ui.button.CustomButton;
import me.rhin.openciv.ui.button.type.CloseWindowButton;
import me.rhin.openciv.ui.label.CustomLabel;
import me.rhin.openciv.ui.window.AbstractWindow;

public class ChangeNameWindow extends AbstractWindow {

	private ColoredBackground coloredBackground;
	private CloseWindowButton closeWindowButton;
	private CustomButton changeNameButton;
	private CustomLabel changeNameDescLabel;
	private TextField nameTextField;

	public ChangeNameWindow() {
		setBounds(viewport.getWorldWidth() / 2 - 250 / 2, viewport.getWorldHeight() / 2 - 250 / 2, 250, 150);

		this.coloredBackground = new ColoredBackground(TextureEnum.UI_POPUP_BOX_B.sprite(), 0, 0, getWidth(),
				getHeight());
		addActor(coloredBackground);

		this.closeWindowButton = new CloseWindowButton(getClass(), "Close", getWidth() / 2 - 125 / 2, 4, 125, 42);
		addActor(closeWindowButton);

		this.changeNameButton = new CustomButton("Change Name", getWidth() / 2 - 125 / 2, 48, 125, 42);

		changeNameButton.onClick(() -> {
			changeName();
		});

		this.changeNameDescLabel = new CustomLabel("Change Name:", Align.center, 0, getHeight() - 25, 250, 15);
		addActor(changeNameDescLabel);

		this.nameTextField = new TextField("",
				Civilization.getInstance().getAssetHandler().get("skin/uiskin.json", Skin.class));
		nameTextField.setSize(200, 24);
		nameTextField.setPosition(getWidth() / 2 - 200 / 2, getHeight() - 55);
		stage.setKeyboardFocus(nameTextField);
		addActor(nameTextField);

		// TODO: I would use the listeners down below, but the stage overrides input ):
		nameTextField.setTextFieldListener(new TextFieldListener() {
			@Override
			public void keyTyped(TextField textField, char key) {

				if (!textField.getText().matches("^[a-zA-Z]+$") || textField.getText().length() <= 0) {
					removeActor(changeNameButton);
					return;
				} else if (!getChildren().contains(changeNameButton, false))
					addActor(changeNameButton);

				if (key == '\r' || key == '\n') {
					changeName();
				}
			}
		});
	}

	@EventHandler
	public void onChangeName(ChangeNamePacket packet) {

		Civilization.getInstance().getWindowManager().closeWindow(getClass());
	}

	@Override
	public boolean disablesInput() {
		return true;
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
		return false;
	}

	private void changeName() {
		ChangeNamePacket packet = new ChangeNamePacket();
		packet.setName(nameTextField.getText());

		Civilization.getInstance().getNetworkManager().sendPacket(packet);
	}
}
