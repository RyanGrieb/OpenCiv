package me.rhin.openciv.ui.screen.type;

import com.badlogic.gdx.Input;
import com.badlogic.gdx.utils.Align;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.SoundEnum.SoundType;
import me.rhin.openciv.listener.LeftClickListener.LeftClickEvent;
import me.rhin.openciv.listener.MouseMoveListener.MouseMoveEvent;
import me.rhin.openciv.listener.ResizeListener;
import me.rhin.openciv.shared.listener.EventManager;
import me.rhin.openciv.ui.button.type.AknowledgementsButton;
import me.rhin.openciv.ui.button.type.GithubButton;
import me.rhin.openciv.ui.button.type.MultiplayerButton;
import me.rhin.openciv.ui.button.type.PlayButton;
import me.rhin.openciv.ui.button.type.QuitGameButton;
import me.rhin.openciv.ui.label.CustomLabel;
import me.rhin.openciv.ui.screen.AbstractScreen;
import me.rhin.openciv.ui.screen.ScreenEnum;
import me.rhin.openciv.ui.window.type.TitleOverlay;

public class TitleScreen extends AbstractScreen implements ResizeListener {

	private EventManager eventManager;
	private TitleOverlay titleOverlay;
	private PlayButton playButton;
	private GithubButton githubButton;
	private MultiplayerButton multiplayerButton;
	private AknowledgementsButton aknowledgementsButton;
	private QuitGameButton quitGameButton;
	private CustomLabel titleLabel;
	private CustomLabel subTitleLabel;

	public TitleScreen() {

		Civilization.getInstance().getSoundHandler().playTrackBySoundtype(SoundType.SOUNDTRACK_TITLE);

		this.eventManager = Civilization.getInstance().getEventManager();
		eventManager.clearEvents();

		this.titleOverlay = new TitleOverlay();
		stage.addActor(titleOverlay);

		playButton = new PlayButton(viewport.getWorldWidth() / 2 - 150 / 2, viewport.getWorldHeight() - 200, 150, 45);
		stage.addActor(playButton);

		githubButton = new GithubButton(74, 4, 32, 32);
		stage.addActor(githubButton);

		multiplayerButton = new MultiplayerButton(viewport.getWorldWidth() / 2 - 150 / 2,
				viewport.getWorldHeight() - 260, 150, 45);
		stage.addActor(multiplayerButton);

		aknowledgementsButton = new AknowledgementsButton(viewport.getWorldWidth() / 2 - 150 / 2,
				viewport.getWorldHeight() - 320, 150, 45);
		stage.addActor(aknowledgementsButton);

		quitGameButton = new QuitGameButton(viewport.getWorldWidth() / 2 - 150 / 2, viewport.getWorldHeight() - 380,
				150, 45);
		stage.addActor(quitGameButton);

		this.titleLabel = new CustomLabel("Kingdomraiders: Civilization", Align.center, 0,
				viewport.getWorldHeight() / 1.1F, viewport.getWorldWidth(), 20);
		overlayStage.addActor(titleLabel);

		this.subTitleLabel = new CustomLabel("OpenCiv");
		subTitleLabel.setPosition(3, 3);
		subTitleLabel.setWidth(0);
		stage.addActor(subTitleLabel);

		Civilization.getInstance().getEventManager().addListener(ResizeListener.class, this);
	}

	@Override
	public void show() {
		super.show();
	}

	@Override
	public void onResize(int width, int height) {
		titleOverlay.setSize(width, height);
		playButton.setPosition(width / 2 - 150 / 2, height - 200);
		githubButton.setPosition(74, 4);
		multiplayerButton.setPosition(width / 2 - 150 / 2, height - 260);
		aknowledgementsButton.setPosition(width / 2 - 150 / 2, height - 320);
		quitGameButton.setPosition(width / 2 - 150 / 2, height - 380);

		titleLabel.setPosition(0, height / 1.1F);
		titleLabel.setSize(width, 20);
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

	@Override
	public ScreenEnum getType() {
		return ScreenEnum.TITLE;
	}
}
