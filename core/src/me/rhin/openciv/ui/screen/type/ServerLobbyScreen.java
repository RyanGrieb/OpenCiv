package me.rhin.openciv.ui.screen.type;

import java.util.ArrayList;

import com.badlogic.gdx.Input;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.listener.LeftClickListener.LeftClickEvent;
import me.rhin.openciv.listener.MouseMoveListener.MouseMoveEvent;
import me.rhin.openciv.shared.listener.EventManager;
import me.rhin.openciv.ui.button.ButtonManager;
import me.rhin.openciv.ui.label.CustomLabel;
import me.rhin.openciv.ui.screen.AbstractScreen;

public class ServerLobbyScreen extends AbstractScreen {

	private EventManager eventManager;
	private ButtonManager buttonManager;

	private ArrayList<CustomLabel> connectedPlayersLabels;

	public ServerLobbyScreen() {
		this.eventManager = Civilization.getInstance().getEventManager();
		eventManager.clearEvents();

		this.buttonManager = new ButtonManager(this);

		connectedPlayersLabels = new ArrayList<>();
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

}
