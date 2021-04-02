package me.rhin.openciv.ui.window.type;

import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.graphics.g2d.Sprite;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.ui.background.BlankBackground;
import me.rhin.openciv.ui.button.type.OpenResearchButton;
import me.rhin.openciv.ui.label.CustomLabel;
import me.rhin.openciv.ui.window.AbstractWindow;

public class CurrentResearchWindow extends AbstractWindow {

	private BlankBackground blankBackground;
	private CustomLabel researchNameDesc;
	private CustomLabel researchName;

	public CurrentResearchWindow() {

		this.blankBackground = new BlankBackground(5, viewport.getWorldHeight() - 75, 200, 50);
		addActor(blankBackground);

		researchNameDesc = new CustomLabel("Researching: ");
		researchNameDesc.setPosition(5 + 3,
				blankBackground.getY() + blankBackground.getHeight() - researchNameDesc.getHeight() - 3);
		addActor(researchNameDesc);

		researchName = new CustomLabel("Nothing");
		researchName.setPosition(blankBackground.getX() + 3, blankBackground.getY() + researchName.getHeight() - 3);
		addActor(researchName);

		addActor(new OpenResearchButton(blankBackground.getX() + blankBackground.getWidth() - 52,
				blankBackground.getY(), 48, 32));
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
		return true;
	}
	
	@Override
	public boolean closesGameDisplayWindows() {
		return false;
	}
}
