package me.rhin.openciv.ui.window;

import com.badlogic.gdx.scenes.scene2d.Actor;
import com.badlogic.gdx.scenes.scene2d.Group;
import com.badlogic.gdx.scenes.scene2d.Stage;
import com.badlogic.gdx.utils.viewport.Viewport;

import me.rhin.openciv.Civilization;

public abstract class AbstractWindow extends Group {

	protected Stage stage;
	protected Viewport viewport;

	public AbstractWindow() {
		this.stage = Civilization.getInstance().getScreenManager().getCurrentScreen().getOverlayStage();
		this.viewport = Civilization.getInstance().getScreenManager().getCurrentScreen().getViewport();
	}

	public abstract boolean disablesInput();

	public abstract boolean closesOtherWindows();
}
