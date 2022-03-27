package me.rhin.openciv.ui.window.type;

import com.badlogic.gdx.utils.Align;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.listener.ResizeListener;
import me.rhin.openciv.listener.ScrubberPositionUpdateListener;
import me.rhin.openciv.options.GameOptions;
import me.rhin.openciv.options.OptionType;
import me.rhin.openciv.ui.background.BlankBackground;
import me.rhin.openciv.ui.button.CustomButton;
import me.rhin.openciv.ui.button.type.CloseWindowButton;
import me.rhin.openciv.ui.label.CustomLabel;
import me.rhin.openciv.ui.scrub.ScrubBar;
import me.rhin.openciv.ui.window.AbstractWindow;

public class GameOptionsWindow extends AbstractWindow implements ResizeListener, ScrubberPositionUpdateListener {

	private BlankBackground blankBackground;
	private CloseWindowButton closeWindowButton;

	// Sound settings
	private CustomLabel soundDescLabel;

	private CustomLabel musicSoundDescLabel;
	private CustomLabel musicSoundLevelLabel;
	private ScrubBar musicScrubBar;

	private CustomLabel ambienceSoundDescLabel;
	private CustomLabel ambienceSoundLevelLabel;
	private ScrubBar ambienceScrubBar;

	private CustomLabel effectsSoundDescLabel;
	private CustomLabel effectsSoundLevelLabel;
	private ScrubBar effectsScrubBar;

	// Display settings
	private CustomLabel displayDescLabel;
	private CustomButton fullscreenButton;

	private CustomLabel animationsLevelLabel;
	private ScrubBar animationsScrubBar;

	public GameOptionsWindow() {
		super.setBounds(0, 0, viewport.getWorldWidth(), viewport.getWorldHeight());

		GameOptions gameOptions = Civilization.getInstance().getGameOptions();

		blankBackground = new BlankBackground(0, 0, getWidth(), getHeight());
		addActor(blankBackground);

		closeWindowButton = new CloseWindowButton(getClass(), "Close", viewport.getWorldWidth() / 2 - 150 / 2, 15, 150,
				45);
		addActor(closeWindowButton);

		// Sound settings

		soundDescLabel = new CustomLabel("Sound Settings:");
		soundDescLabel.setPosition(55, viewport.getWorldHeight() - 35);
		addActor(soundDescLabel);

		musicSoundDescLabel = new CustomLabel("Music Volume", Align.center, 55, viewport.getWorldHeight() - 70,
				soundDescLabel.getWidth(), 15);
		addActor(musicSoundDescLabel);

		musicSoundLevelLabel = new CustomLabel(gameOptions.getInt(OptionType.MUSIC_VOLUME) + "%", Align.center, 55,
				viewport.getWorldHeight() - 90, soundDescLabel.getWidth(), 15);
		addActor(musicSoundLevelLabel);

		musicScrubBar = new ScrubBar(70, viewport.getWorldHeight() - 120, 100, 20);
		musicScrubBar.setValue(gameOptions.getInt(OptionType.MUSIC_VOLUME));
		addActor(musicScrubBar);

		ambienceSoundDescLabel = new CustomLabel("Ambience Volume", Align.center, 55, viewport.getWorldHeight() - 155,
				soundDescLabel.getWidth(), 15);
		addActor(ambienceSoundDescLabel);

		ambienceSoundLevelLabel = new CustomLabel(gameOptions.getInt(OptionType.AMBIENCE_VOLUME) + "%", Align.center,
				55, viewport.getWorldHeight() - 175, soundDescLabel.getWidth(), 15);
		addActor(ambienceSoundLevelLabel);

		ambienceScrubBar = new ScrubBar(70, viewport.getWorldHeight() - 205, 100, 20);
		ambienceScrubBar.setValue(gameOptions.getInt(OptionType.AMBIENCE_VOLUME));
		addActor(ambienceScrubBar);

		effectsSoundDescLabel = new CustomLabel("Effects Volume", Align.center, 55, viewport.getWorldHeight() - 240,
				soundDescLabel.getWidth(), 15);
		addActor(effectsSoundDescLabel);

		effectsSoundLevelLabel = new CustomLabel(gameOptions.getInt(OptionType.EFFECTS_VOLUME) + "%", Align.center, 55,
				viewport.getWorldHeight() - 260, soundDescLabel.getWidth(), 15);
		addActor(effectsSoundLevelLabel);

		effectsScrubBar = new ScrubBar(70, viewport.getWorldHeight() - 290, 100, 20);
		effectsScrubBar.setValue(gameOptions.getInt(OptionType.EFFECTS_VOLUME));
		addActor(effectsScrubBar);

		// Display Settings

		displayDescLabel = new CustomLabel("Display Settings:");
		displayDescLabel.setPosition(270, viewport.getWorldHeight() - 35);
		addActor(displayDescLabel);

		String fullscreenButtonName = (gameOptions.getInt(OptionType.FULLSCREEN_ENABLED) == 1 ? "Disable Fullscreen"
				: "Enable Fullscreen");
		fullscreenButton = new CustomButton(fullscreenButtonName, 237, viewport.getWorldHeight() - 100, 220, 40);
		fullscreenButton.onClick(() -> {
			int currentValue = Civilization.getInstance().getGameOptions().getInt(OptionType.FULLSCREEN_ENABLED);
			Civilization.getInstance().getGameOptions().setInt(OptionType.FULLSCREEN_ENABLED,
					(currentValue == 0 ? 1 : 0));
			fullscreenButton.setText(fullscreenButtonName);
		});
		addActor(fullscreenButton);

		String animationLevel = "N/A";
		switch (gameOptions.getInt(OptionType.ANIMATION_LEVEL)) {
		case 0:
			animationLevel = "None";
			break;
		case 1:
			animationLevel = "Partial";
			break;
		case 2:
			animationLevel = "Full";
			break;
		default:
			animationLevel = "Error";
			break;
		}

		animationsLevelLabel = new CustomLabel("Animation Level: " + animationLevel);
		animationsLevelLabel.setPosition(270, viewport.getWorldHeight() - 155);
		addActor(animationsLevelLabel);

		animationsScrubBar = new ScrubBar(270, viewport.getWorldHeight() - 205, 100, 20);
		animationsScrubBar.setValue(gameOptions.getInt(OptionType.ANIMATION_LEVEL) * 50);
		addActor(animationsScrubBar);

		Civilization.getInstance().getEventManager().addListener(ScrubberPositionUpdateListener.class, this);
		Civilization.getInstance().getEventManager().addListener(ResizeListener.class, this);
	}

	@Override
	public void onScrubberPositionUpdate(ScrubBar scrubber) {

		GameOptions gameOptions = Civilization.getInstance().getGameOptions();

		// FIXME: Just call updatePositions() method.

		if (scrubber.equals(musicScrubBar)) {
			gameOptions.setInt(OptionType.MUSIC_VOLUME, (int) scrubber.getValue());
			musicSoundLevelLabel.setText((int) scrubber.getValue() + "%");
		}

		if (scrubber.equals(ambienceScrubBar)) {
			gameOptions.setInt(OptionType.AMBIENCE_VOLUME, (int) scrubber.getValue());
			ambienceSoundLevelLabel.setText((int) scrubber.getValue() + "%");
		}

		if (scrubber.equals(effectsScrubBar)) {
			gameOptions.setInt(OptionType.EFFECTS_VOLUME, (int) scrubber.getValue());
			effectsSoundLevelLabel.setText((int) scrubber.getValue() + "%");
		}

		if (scrubber.equals(animationsScrubBar)) {

			int optionLevel = -1;

			if (scrubber.getValue() < 25) {
				optionLevel = 0;
			} else if (scrubber.getValue() >= 25 && scrubber.getValue() < 75) {
				optionLevel = 1;
			} else {
				optionLevel = 2;
			}

			String animationLevel = "N/A";

			switch (optionLevel) {
			case 0:
				animationLevel = "None";
				break;
			case 1:
				animationLevel = "Partial";
				break;
			case 2:
				animationLevel = "Full";
				break;
			default:
				animationLevel = "Error";
				break;
			}

			gameOptions.setInt(OptionType.ANIMATION_LEVEL, optionLevel);
			animationsLevelLabel.setText("Animation Level: " + animationLevel);
		}

		updatePositions(viewport.getWorldWidth(), viewport.getWorldHeight());
	}

	@Override
	public void onResize(int width, int height) {
		updatePositions(width, height);
	}

	private void updatePositions(float width, float height) {
		super.setBounds(0, 0, width, height);

		blankBackground.setSize(width, height);

		closeWindowButton.setPosition(width / 2 - 150 / 2, 15);

		soundDescLabel.setPosition(55, height - 35);

		musicSoundDescLabel.setPosition(55, height - 70);
		musicSoundLevelLabel.setBounds(55, height - 90, soundDescLabel.getWidth(), 15);
		musicSoundLevelLabel.setAlignment(Align.center);
		musicScrubBar.setPosition(70, height - 120);

		ambienceSoundDescLabel.setPosition(55, height - 155);
		ambienceSoundLevelLabel.setBounds(55, height - 175, soundDescLabel.getWidth(), 15);
		ambienceSoundLevelLabel.setAlignment(Align.center);
		ambienceScrubBar.setPosition(70, height - 205);

		effectsSoundDescLabel.setPosition(55, height - 240);
		effectsSoundLevelLabel.setBounds(55, height - 260, soundDescLabel.getWidth(), 15);
		effectsSoundLevelLabel.setAlignment(Align.center);
		effectsScrubBar.setPosition(70, height - 290);

		displayDescLabel.setPosition(270, height - 35);
		fullscreenButton.setPosition(237, height - 100);
	}

	@Override
	public void onClose() {
		super.onClose();

		Civilization.getInstance().getEventManager().clearListenersFromObject(this);
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
}
