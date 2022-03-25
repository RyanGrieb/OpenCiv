package me.rhin.openciv.ui.screen.type;

import com.badlogic.gdx.Input;
import com.badlogic.gdx.utils.Align;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.listener.LeftClickListener.LeftClickEvent;
import me.rhin.openciv.listener.MouseMoveListener.MouseMoveEvent;
import me.rhin.openciv.shared.listener.EventManager;
import me.rhin.openciv.ui.button.type.PreviousScreenButton;
import me.rhin.openciv.ui.label.CustomLabel;
import me.rhin.openciv.ui.screen.AbstractScreen;
import me.rhin.openciv.ui.screen.ScreenEnum;

public class GameSettingsScreen extends AbstractScreen {

	private EventManager eventManager;

	public GameSettingsScreen() {
		this.eventManager = Civilization.getInstance().getEventManager();
		eventManager.clearEvents();

		CustomLabel todoLabel = new CustomLabel(
				"TODO: Multiplayer is only supported.\nOnce a proper AI is coded i'll start working on SP again.",
				Align.center, 0, viewport.getWorldHeight() - 100, viewport.getWorldWidth(), 20);

		stage.addActor(new PreviousScreenButton("Back", viewport.getWorldWidth() / 2 - 150 / 2, 50, 150, 45));

		stage.addActor(todoLabel);
	}

	@Override
	public void render(float delta) {
		super.render(delta);

		Civilization.getInstance().getEventManager().fireEvent(MouseMoveEvent.INSTANCE);
	}

	@Override
	public boolean touchUp(int screenX, int screenY, int pointer, int button) {
		if (button == Input.Buttons.LEFT) {
			Civilization.getInstance().getEventManager().fireEvent(new LeftClickEvent(screenX, screenY));
		}
		return false;
	}

	@Override
	public ScreenEnum getType() {
		return ScreenEnum.GAME_SETTINGS;
	}
}
