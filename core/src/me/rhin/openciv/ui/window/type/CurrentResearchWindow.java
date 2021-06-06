package me.rhin.openciv.ui.window.type;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.listener.ResizeListener;
import me.rhin.openciv.ui.background.BlankBackground;
import me.rhin.openciv.ui.button.type.OpenResearchButton;
import me.rhin.openciv.ui.label.CustomLabel;
import me.rhin.openciv.ui.window.AbstractWindow;

public class CurrentResearchWindow extends AbstractWindow implements ResizeListener {

	private BlankBackground blankBackground;
	private CustomLabel researchNameDesc;
	private CustomLabel researchName;
	private OpenResearchButton researchButton;

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

		researchButton = new OpenResearchButton(blankBackground.getX() + blankBackground.getWidth() - 52,
				blankBackground.getY(), 48, 32);
		addActor(researchButton);

		Civilization.getInstance().getEventManager().addListener(ResizeListener.class, this);
	}

	@Override
	public void onResize(int width, int height) {
		blankBackground.setPosition(5, height - 75);

		researchNameDesc.setPosition(5 + 3,
				blankBackground.getY() + blankBackground.getHeight() - researchNameDesc.getHeight() - 3);
		researchName.setPosition(blankBackground.getX() + 3, blankBackground.getY() + researchName.getHeight() - 3);
		researchButton.setPosition(blankBackground.getX() + blankBackground.getWidth() - 52, blankBackground.getY());
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
