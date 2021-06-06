package me.rhin.openciv.ui.window.type;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.listener.ResizeListener;
import me.rhin.openciv.ui.game.StatusBar;
import me.rhin.openciv.ui.label.CustomLabel;
import me.rhin.openciv.ui.window.AbstractWindow;

public class GameOverlay extends AbstractWindow implements ResizeListener {

	public static final int HEIGHT = 20;

	private CustomLabel fpsLabel;
	private StatusBar statusBar;

	public GameOverlay() {
		this.statusBar = new StatusBar(0, viewport.getWorldHeight() - HEIGHT, viewport.getWorldWidth(), HEIGHT);
		addActor(statusBar);

		this.fpsLabel = new CustomLabel("FPS: 60.0");
		fpsLabel.setPosition(viewport.getWorldWidth() - fpsLabel.getWidth() - 4,
				viewport.getWorldHeight() - fpsLabel.getHeight() - statusBar.getHeight() - 5);
		this.addActor(fpsLabel);

		Civilization.getInstance().getEventManager().addListener(ResizeListener.class, this);
	}

	public CustomLabel getFPSLabel() {
		return fpsLabel;
	}

	@Override
	public void onResize(int width, int height) {
		statusBar.setSize(width, HEIGHT);
		statusBar.setPosition(0, height - HEIGHT);

		fpsLabel.setPosition(width - fpsLabel.getWidth() - 4,
				height - fpsLabel.getHeight() - statusBar.getHeight() - 5);
	}

	@Override
	public boolean disablesInput() {
		return false;
	}

	@Override
	public boolean disablesCameraMovement() {
		return false;
	}

	@Override
	public boolean closesOtherWindows() {
		return false;
	}

	@Override
	public boolean isGameDisplayWindow() {
		return false;
	}

	@Override
	public boolean closesGameDisplayWindows() {
		return false;
	}

	public float getTopbarHeight() {
		return statusBar.getHeight();
	}
}
