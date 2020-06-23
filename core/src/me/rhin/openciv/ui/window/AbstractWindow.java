package me.rhin.openciv.ui.window;

import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.InputMultiplexer;
import com.badlogic.gdx.scenes.scene2d.Stage;
import com.badlogic.gdx.utils.viewport.StretchViewport;
import com.badlogic.gdx.utils.viewport.Viewport;

import me.rhin.openciv.Civilization;

public abstract class AbstractWindow extends Stage {

	protected Viewport viewport;

	public AbstractWindow() {
		super(new StretchViewport(800, 600));
		this.viewport = getViewport();

		InputMultiplexer inputMultiplexer = Civilization.getInstance().getCurrentScreen().getInputMultiplexer();
		inputMultiplexer.addProcessor(this);
		Gdx.input.setInputProcessor(inputMultiplexer);
	}

	public abstract boolean disablesInput();

	public abstract boolean closesOtherWindows();

	@Override
	public void dispose() {
		super.dispose();
		// FIXME: Should we remove ourselves from the input processor here?
	}

	public void onResize(int width, int height) {
		viewport.setScreenSize(width, height);
		viewport.update(width, height, true);
		viewport.setScreenSize(Gdx.graphics.getWidth(), Gdx.graphics.getHeight());
	}
}
