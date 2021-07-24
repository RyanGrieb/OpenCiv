package me.rhin.openciv.ui.window.type;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.research.Technology;
import me.rhin.openciv.ui.background.BlankBackground;
import me.rhin.openciv.ui.background.ColoredBackground;
import me.rhin.openciv.ui.button.type.OpenHeritageButton;
import me.rhin.openciv.ui.button.type.OpenResearchButton;
import me.rhin.openciv.ui.label.CustomLabel;
import me.rhin.openciv.ui.window.AbstractWindow;

public class CurrentHeritageWindow extends AbstractWindow {

	private BlankBackground blankBackground;
	private CustomLabel researchNameDesc;
	private CustomLabel researchTurnsLabel;
	private CustomLabel researchName;
	private OpenHeritageButton openHeritageButton;
	private ColoredBackground heritageIcon;
	private Technology tech;

	public CurrentHeritageWindow() {
		super.setBounds(5, viewport.getWorldHeight() - 135, 225, 50);

		this.blankBackground = new BlankBackground(0, 0, getWidth(), getHeight());
		addActor(blankBackground);

		researchNameDesc = new CustomLabel("Studying: ");
		researchNameDesc.setPosition(5 + 3,
				blankBackground.getY() + blankBackground.getHeight() - researchNameDesc.getHeight() - 3);
		addActor(researchNameDesc);

		researchTurnsLabel = new CustomLabel("??/?? Turns");
		researchTurnsLabel.setPosition(researchNameDesc.getX() + researchNameDesc.getWidth() - 2,
				researchNameDesc.getY());
		addActor(researchTurnsLabel);

		researchName = new CustomLabel("Nothing");
		researchName.setPosition(blankBackground.getX() + 36, blankBackground.getY() + researchName.getHeight() - 3);
		addActor(researchName);

		openHeritageButton = new OpenHeritageButton(blankBackground.getX() + blankBackground.getWidth() - 52,
				blankBackground.getY(), 48, 32);
		addActor(openHeritageButton);

		this.heritageIcon = new ColoredBackground(TextureEnum.UI_BLACK.sprite(), 2, 2, 32, 32);
		addActor(heritageIcon);
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
