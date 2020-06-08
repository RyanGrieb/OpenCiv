package me.rhin.openciv.ui.screen.type;

import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.Input;
import com.badlogic.gdx.utils.Align;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.listener.LeftClickListener.LeftClickEvent;
import me.rhin.openciv.listener.MouseMoveListener.MouseMoveEvent;
import me.rhin.openciv.shared.listener.EventManager;
import me.rhin.openciv.ui.button.ButtonManager;
import me.rhin.openciv.ui.button.type.GithubButton;
import me.rhin.openciv.ui.button.type.MultiplayerButton;
import me.rhin.openciv.ui.button.type.PlayButton;
import me.rhin.openciv.ui.label.CustomLabel;
import me.rhin.openciv.ui.screen.AbstractScreen;

public class TitleScreen extends AbstractScreen {

	private EventManager eventManager;
	private ButtonManager buttonManager;
	private CustomLabel titleLabel;
	private CustomLabel subTitleLabel;

	public TitleScreen() {
		this.eventManager = Civilization.getInstance().getEventManager();
		eventManager.clearEvents();

		this.buttonManager = new ButtonManager(this);

		buttonManager.addButton(
				new PlayButton(Gdx.graphics.getWidth() / 2 - 150 / 2, Gdx.graphics.getHeight() - 200, 150, 45));
		buttonManager.addButton(new GithubButton(74, 4, 32, 32));
		buttonManager.addButton(
				new MultiplayerButton(Gdx.graphics.getWidth() / 2 - 150 / 2, Gdx.graphics.getHeight() - 260, 150, 45));

		this.titleLabel = new CustomLabel("Kingomraiders: Civilization", 0, Gdx.graphics.getHeight() / 1.1F,
				Gdx.graphics.getWidth(), 20);
		titleLabel.setAlignment(Align.center);
		stage.addActor(titleLabel);

		this.subTitleLabel = new CustomLabel("OpenCiv", 4, 0, Gdx.graphics.getWidth(), 20);
		subTitleLabel.setAlignment(Align.bottomLeft);
		stage.addActor(subTitleLabel);

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
	public void hide() {
		Gdx.input.setInputProcessor(null);
	}

	@Override
	public boolean touchUp(int screenX, int screenY, int pointer, int button) {
		if (button == Input.Buttons.LEFT)
			eventManager.fireEvent(new LeftClickEvent(screenX, screenY));
		return true;

	}
}
