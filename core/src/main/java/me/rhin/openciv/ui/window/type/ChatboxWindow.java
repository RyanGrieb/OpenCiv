package me.rhin.openciv.ui.window.type;

import java.util.ArrayList;

import com.badlogic.gdx.scenes.scene2d.ui.Skin;
import com.badlogic.gdx.scenes.scene2d.ui.TextField;
import com.badlogic.gdx.scenes.scene2d.ui.TextField.TextFieldListener;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.listener.SendChatMessageListener;
import me.rhin.openciv.shared.packet.type.SendChatMessagePacket;
import me.rhin.openciv.ui.background.ColoredBackground;
import me.rhin.openciv.ui.button.type.CloseWindowButton;
import me.rhin.openciv.ui.button.type.SendMessageButton;
import me.rhin.openciv.ui.label.CustomLabel;
import me.rhin.openciv.ui.window.AbstractWindow;

public class ChatboxWindow extends AbstractWindow implements SendChatMessageListener {

	private ArrayList<CustomLabel> chatLabels;
	private ColoredBackground coloredBackground;
	private CloseWindowButton closeWindowButton;
	private TextField chatTextField;
	private SendMessageButton sendMessageButton;

	public ChatboxWindow() {
		super.setBounds(4, 20, 225, 250);

		this.chatLabels = new ArrayList<>();

		this.coloredBackground = new ColoredBackground(TextureEnum.UI_GRAY.sprite(), 0, 0, getWidth(), getHeight());
		addActor(coloredBackground);

		this.closeWindowButton = new CloseWindowButton(this.getClass(), TextureEnum.ICON_CANCEL, getWidth() - 32,
				getHeight() - 32, 32, 32);
		addActor(closeWindowButton);

		this.chatTextField = new TextField("",
				Civilization.getInstance().getAssetHandler().get("skin/uiskin.json", Skin.class));
		chatTextField.setBounds(2, 2, getWidth() - 35, 25);
		stage.setKeyboardFocus(chatTextField);
		addActor(chatTextField);

		// TODO: I would use the listeners down below, but the stage overrides input ):
		chatTextField.setTextFieldListener(new TextFieldListener() {
			@Override
			public void keyTyped(TextField textField, char key) {
				if ((key == '\r' || key == '\n')) {
					sendMessage();
				}
			}
		});

		sendMessageButton = new SendMessageButton(chatTextField.getWidth() + 3, -1, 32, 32);
		addActor(sendMessageButton);

		// Close info buttons window
		Civilization.getInstance().getWindowManager().toggleWindow(new InfoButtonsWindow());

		for (String message : Civilization.getInstance().getChatHandler().getSentMessages()) {
			addMessage(message);
		}

		Civilization.getInstance().getEventManager().addListener(SendChatMessageListener.class, this);
	}

	@Override
	public void onClose() {
		super.onClose();

		Civilization.getInstance().getWindowManager().toggleWindow(new InfoButtonsWindow());
	}

	@Override
	public boolean disablesInput() {
		return true;
	}

	@Override
	public boolean disablesCameraMovement() {
		return true;
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

	@Override
	public void onSentChatMessage(SendChatMessagePacket packet) {

		String messageText = packet.getMessage();

		if (!packet.isServerMessage())
			messageText = packet.getPlayerName() + ": " + messageText;

		addMessage(messageText);
	}

	public void sendMessage() {
		String message = chatTextField.getText();
		SendChatMessagePacket packet = new SendChatMessagePacket();
		packet.setMessage(message);
		Civilization.getInstance().getNetworkManager().sendPacket(packet);

		chatTextField.setText("");
	}

	public void addMessage(String messageText) {

		CustomLabel initMessageLabel = new CustomLabel("");
		initMessageLabel.setPosition(2, 20);

		chatLabels.add(initMessageLabel);
		addActor(initMessageLabel);

		CustomLabel currentLabel = chatLabels.get(chatLabels.size() - 1);

		for (char c : messageText.toCharArray()) {
			String message = currentLabel.getText().toString() + c;
			currentLabel.setText(message);
			if (currentLabel.getWidth() + 15 >= getWidth()) {

				for (CustomLabel messageLabel : chatLabels)
					messageLabel.setY(messageLabel.getY() + 15);

				CustomLabel newLabel = new CustomLabel("");
				newLabel.setPosition(2, 20);
				addActor(newLabel);
				chatLabels.add(newLabel);

				currentLabel = newLabel;
			}
		}

		for (CustomLabel chatLabel : chatLabels) {
			chatLabel.setY(chatLabel.getY() + 15);
		}

		float chatHeight = 17 * chatLabels.size();

		while (chatHeight > getHeight()) {
			removeActor(chatLabels.remove(0));
			chatHeight -= 17;
		}
	}
}
