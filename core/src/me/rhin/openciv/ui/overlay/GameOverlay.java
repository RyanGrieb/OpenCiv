package me.rhin.openciv.ui.overlay;

import me.rhin.openciv.ui.game.StatusBar;
import me.rhin.openciv.ui.label.CustomLabel;

public class GameOverlay extends Overlay {
	private CustomLabel fpsLabel;
	private StatusBar statusBar;

	public GameOverlay() {

		this.fpsLabel = new CustomLabel("FPS: 0", 4, 4, viewport.getWorldWidth(), 20);
		this.addActor(fpsLabel);

		this.statusBar = new StatusBar(0, viewport.getWorldHeight() - 20, viewport.getWorldWidth(), 20);
		addActor(statusBar);
	}

	public CustomLabel getFPSLabel() {
		return fpsLabel;
	}

}
