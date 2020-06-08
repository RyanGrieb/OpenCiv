package me.rhin.openciv.ui.screen.type;

import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.Input;
import com.badlogic.gdx.scenes.scene2d.ui.Skin;
import com.badlogic.gdx.scenes.scene2d.ui.TextField;
import com.badlogic.gdx.scenes.scene2d.ui.TextField.TextFieldListener;
import com.badlogic.gdx.utils.Align;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.game.player.Player;
import me.rhin.openciv.listener.LeftClickListener.LeftClickEvent;
import me.rhin.openciv.listener.MouseMoveListener.MouseMoveEvent;
import me.rhin.openciv.listener.ServerConnectListener;
import me.rhin.openciv.shared.listener.EventManager;
import me.rhin.openciv.ui.button.ButtonManager;
import me.rhin.openciv.ui.button.type.BackTitleScreenButton;
import me.rhin.openciv.ui.button.type.ConnectServerButton;
import me.rhin.openciv.ui.label.CustomLabel;
import me.rhin.openciv.ui.screen.AbstractScreen;
import me.rhin.openciv.ui.screen.ScreenEnum;

public class ServerSelectScreen extends AbstractScreen implements ServerConnectListener {

	private EventManager eventManager;
	private ButtonManager buttonManager;
	private CustomLabel serverIPLabel;
	private CustomLabel connectLabel;
	private TextField ipTextField;

	public ServerSelectScreen() {
		this.eventManager = Civilization.getInstance().getEventManager();
		eventManager.clearEvents();
		eventManager.addListener(ServerConnectListener.class, this);

		this.buttonManager = new ButtonManager(this);

		buttonManager.addButton(new ConnectServerButton(this, Gdx.graphics.getWidth() / 2 - 150 / 2,
				Gdx.graphics.getHeight() - 200, 150, 45));

		buttonManager.addButton(new BackTitleScreenButton(Gdx.graphics.getWidth() / 2 - 150 / 2,
				Gdx.graphics.getHeight() - 260, 150, 45));

		this.serverIPLabel = new CustomLabel("Enter server IP address:", 0, Gdx.graphics.getHeight() / 1.1F,
				Gdx.graphics.getWidth(), 20);
		serverIPLabel.setAlignment(Align.center);
		stage.addActor(serverIPLabel);

		this.ipTextField = new TextField("",
				Civilization.getInstance().getAssetHandler().get("skin/uiskin.json", Skin.class));
		ipTextField.setSize(200, 24);
		ipTextField.setPosition(Gdx.graphics.getWidth() / 2 - 200 / 2, Gdx.graphics.getHeight() - 100);
		stage.setKeyboardFocus(ipTextField);
		stage.addActor(ipTextField);

		// TODO: I would use the listeners down below, but the stage overrides input ):
		ipTextField.setTextFieldListener(new TextFieldListener() {
			@Override
			public void keyTyped(TextField textField, char key) {
				if ((key == '\r' || key == '\n'))
					Civilization.getInstance().getNetworkManager().connect(ipTextField.getText());
			}
		});
	}

	@Override
	public void show() {
		super.show();

	}

	@Override
	public void render(float delta) {
		super.render(delta);

		Civilization.getInstance().getEventManager().fireEvent(MouseMoveEvent.INSTANCE);
	}

	@Override
	public boolean touchUp(int screenX, int screenY, int pointer, int button) {
		if (button == Input.Buttons.LEFT) {
			eventManager.fireEvent(new LeftClickEvent(screenX, screenY));
		}
		return true;

	}

	public TextField getIPTextField() {
		return ipTextField;
	}

	@Override
	public void onServerConnect() {
		// NOTE: This method runs on a separate thread (shared library from gradle), we
		// need to get the libgdx thread first.
		Gdx.app.postRunnable(new Runnable() {
			public void run() {
				Civilization.getInstance().getScreenManager().setScreen(ScreenEnum.SERVER_LOBBY);
			}
		});

	}
}
