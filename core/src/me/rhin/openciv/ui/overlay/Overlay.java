package me.rhin.openciv.ui.overlay;

import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.InputMultiplexer;
import com.badlogic.gdx.scenes.scene2d.Stage;
import com.badlogic.gdx.utils.viewport.StretchViewport;
import com.badlogic.gdx.utils.viewport.Viewport;

import me.rhin.openciv.Civilization;

public abstract class Overlay extends Stage {

	protected Viewport viewport;

	public Overlay() {
		super(new StretchViewport(800, 600));
		// overlayViewport.apply();
		this.viewport = getViewport();
		
		InputMultiplexer inputMultiplexer = Civilization.getInstance().getCurrentScreen().getInputMultiplexer();
		inputMultiplexer.addProcessor(this);
		Gdx.input.setInputProcessor(inputMultiplexer);
	}
}
