package me.rhin.openciv.ui.screen.type;

import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.Input;
import com.badlogic.gdx.utils.Align;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.SoundEnum.SoundType;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.listener.LeftClickListener.LeftClickEvent;
import me.rhin.openciv.listener.MouseMoveListener.MouseMoveEvent;
import me.rhin.openciv.listener.ResizeListener;
import me.rhin.openciv.shared.listener.EventManager;
import me.rhin.openciv.ui.button.CustomButton;
import me.rhin.openciv.ui.label.CustomLabel;
import me.rhin.openciv.ui.screen.AbstractScreen;
import me.rhin.openciv.ui.screen.ScreenEnum;
import me.rhin.openciv.ui.window.type.GameOptionsWindow;
import me.rhin.openciv.ui.window.type.TitleOverlay;

public class TitleScreen extends AbstractScreen implements ResizeListener {

	private EventManager eventManager;
	private TitleOverlay titleOverlay;
	private CustomButton playButton;
	private CustomButton githubButton;
	private CustomButton multiplayerButton;
	private CustomButton gameOptionsButton;
	private CustomButton aknowledgementsButton;
	private CustomButton quitGameButton;
	private CustomLabel titleLabel;
	private CustomLabel subTitleLabel;

	public TitleScreen() {

		Civilization.getInstance().getSoundHandler().playTrackBySoundtype(this, SoundType.TITLE_MUSIC);

		this.eventManager = Civilization.getInstance().getEventManager();
		eventManager.clearEvents();

		this.titleOverlay = new TitleOverlay();
		stage.addActor(titleOverlay);

		playButton = new CustomButton("Singleplayer", viewport.getWorldWidth() / 2 - 150 / 2,
				viewport.getWorldHeight() - 200, 150, 45);
		playButton.onClick(() -> {
			Civilization.getInstance().getScreenManager().setScreen(ScreenEnum.GAME_SETTINGS);
		});
		stage.addActor(playButton);

		githubButton = new CustomButton(TextureEnum.UI_GITHUB, TextureEnum.UI_GITHUB, 74, 4, 32, 32);
		githubButton.onClick(() -> {
			Gdx.net.openURI("https://github.com/rhin123/OpenCiv");
		});
		stage.addActor(githubButton);

		multiplayerButton = new CustomButton("Multiplayer", viewport.getWorldWidth() / 2 - 150 / 2,
				viewport.getWorldHeight() - 260, 150, 45);
		multiplayerButton.onClick(() -> {
			Civilization.getInstance().getScreenManager().setScreen(ScreenEnum.SERVER_SELECT);
		});
		stage.addActor(multiplayerButton);

		gameOptionsButton = new CustomButton("Options", viewport.getWorldWidth() / 2 - 150 / 2,
				viewport.getWorldHeight() - 320, 150, 45);
		gameOptionsButton.onClick(() -> {
			Civilization.getInstance().getWindowManager().addWindow(new GameOptionsWindow());
		});
		stage.addActor(gameOptionsButton);

		aknowledgementsButton = new CustomButton("Credits", viewport.getWorldWidth() / 2 - 150 / 2,
				viewport.getWorldHeight() - 380, 150, 45);
		aknowledgementsButton.onClick(() -> {
			Civilization.getInstance().getScreenManager().setScreen(ScreenEnum.CREDITS);
		});
		stage.addActor(aknowledgementsButton);

		quitGameButton = new CustomButton("Quit Game", viewport.getWorldWidth() / 2 - 150 / 2,
				viewport.getWorldHeight() - 440, 150, 45);
		quitGameButton.onClick(() -> {
			Gdx.app.exit();
		});
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
		gameOptionsButton.setPosition(width / 2 - 150 / 2, height - 320);
		aknowledgementsButton.setPosition(width / 2 - 150 / 2, height - 380);
		quitGameButton.setPosition(width / 2 - 150 / 2, height - 440);

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
