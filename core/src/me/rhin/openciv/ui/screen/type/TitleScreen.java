package me.rhin.openciv.ui.screen.type;

import com.badlogic.gdx.Input;
import com.badlogic.gdx.utils.Align;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.listener.LeftClickListener.LeftClickEvent;
import me.rhin.openciv.listener.MouseMoveListener.MouseMoveEvent;
import me.rhin.openciv.shared.listener.EventManager;
import me.rhin.openciv.ui.button.type.AknowledgementsButton;
import me.rhin.openciv.ui.button.type.GithubButton;
import me.rhin.openciv.ui.button.type.MultiplayerButton;
import me.rhin.openciv.ui.button.type.PlayButton;
import me.rhin.openciv.ui.button.type.QuitGameButton;
import me.rhin.openciv.ui.label.CustomLabel;
import me.rhin.openciv.ui.screen.AbstractScreen;
import me.rhin.openciv.ui.window.type.TitleOverlay;

public class TitleScreen extends AbstractScreen {

	private EventManager eventManager;
	private TitleOverlay titleOverlay;
	private CustomLabel titleLabel;
	private CustomLabel subTitleLabel;

	public TitleScreen() {
		this.eventManager = Civilization.getInstance().getEventManager();
		eventManager.clearEvents();

		this.titleOverlay = new TitleOverlay();
		stage.addActor(titleOverlay);

		stage.addActor(
				new PlayButton(viewport.getWorldWidth() / 2 - 150 / 2, viewport.getWorldHeight() - 200, 150, 45));
		stage.addActor(new GithubButton(74, 4, 32, 32));
		stage.addActor(new MultiplayerButton(viewport.getWorldWidth() / 2 - 150 / 2, viewport.getWorldHeight() - 260,
				150, 45));
		stage.addActor(new AknowledgementsButton(viewport.getWorldWidth() / 2 - 150 / 2,
				viewport.getWorldHeight() - 320, 150, 45));
		stage.addActor(new QuitGameButton(viewport.getWorldWidth() / 2 - 150 / 2, viewport.getWorldHeight() - 380,
				150, 45));
		this.titleLabel = new CustomLabel("Kingomraiders: Civilization", Align.center, 0,
				viewport.getWorldHeight() / 1.1F, viewport.getWorldWidth(), 20);
		stage.addActor(titleLabel);

		this.subTitleLabel = new CustomLabel("OpenCiv", Align.bottomLeft, 4, 0, viewport.getWorldWidth(), 20);
		stage.addActor(subTitleLabel);
	}

	@Override
	public void show() {
		super.show();
	}

	@Override
	public void render(float delta) {
		super.render(delta);
		eventManager.fireEvent(MouseMoveEvent.INSTANCE);
	}

	@Override
	public boolean touchUp(int screenX, int screenY, int pointer, int button) {
		if (button == Input.Buttons.LEFT)
			eventManager.fireEvent(new LeftClickEvent(screenX, screenY));
		return false;

	}
}
