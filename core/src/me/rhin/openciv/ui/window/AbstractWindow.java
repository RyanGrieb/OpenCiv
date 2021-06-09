package me.rhin.openciv.ui.window;

import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.InputProcessor;
import com.badlogic.gdx.scenes.scene2d.Group;
import com.badlogic.gdx.scenes.scene2d.Stage;
import com.badlogic.gdx.utils.viewport.Viewport;

import me.rhin.openciv.Civilization;

public abstract class AbstractWindow extends Group {

	protected Stage stage;
	protected Viewport viewport;
	private boolean open;

	public AbstractWindow() {
		this.stage = Civilization.getInstance().getScreenManager().getCurrentScreen().getOverlayStage();
		this.viewport = Civilization.getInstance().getScreenManager().getCurrentScreen().getViewport();

		open = true;
	}
	
	public abstract boolean disablesInput();

	public abstract boolean disablesCameraMovement();

	public abstract boolean closesOtherWindows();
	
	public abstract boolean closesGameDisplayWindows();
	
	public abstract boolean isGameDisplayWindow();

	public boolean isOpen() {
		return open;
	}

	public void onClose() {
		open = false;
	}
}
