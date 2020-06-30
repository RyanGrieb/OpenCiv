package me.rhin.openciv.ui.overlay;

import me.rhin.openciv.ui.game.StatusBar;
import me.rhin.openciv.ui.label.CustomLabel;

public class GameOverlay extends Overlay {

	public static final int HEIGHT = 20;

	private CustomLabel fpsLabel;
	private StatusBar statusBar;

	public GameOverlay() {
		this.statusBar = new StatusBar(0, viewport.getWorldHeight() - HEIGHT, viewport.getWorldWidth(), HEIGHT);
		addActor(statusBar);

		this.fpsLabel = new CustomLabel("FPS: 60.0");
		fpsLabel.setPosition(viewport.getWorldWidth() - fpsLabel.getWidth() - 4,
				viewport.getWorldHeight() - fpsLabel.getHeight() - 5);
		this.addActor(fpsLabel);
	}

	public CustomLabel getFPSLabel() {
		return fpsLabel;
	}

}
