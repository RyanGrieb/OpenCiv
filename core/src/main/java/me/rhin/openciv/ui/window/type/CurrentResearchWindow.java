package me.rhin.openciv.ui.window.type;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.research.Technology;
import me.rhin.openciv.listener.CompleteResearchListener;
import me.rhin.openciv.listener.NextTurnListener;
import me.rhin.openciv.listener.PickResearchListener;
import me.rhin.openciv.listener.ResizeListener;
import me.rhin.openciv.shared.packet.type.CompleteResearchPacket;
import me.rhin.openciv.shared.packet.type.NextTurnPacket;
import me.rhin.openciv.shared.stat.Stat;
import me.rhin.openciv.ui.background.BlankBackground;
import me.rhin.openciv.ui.background.ColoredBackground;
import me.rhin.openciv.ui.button.type.OpenResearchButton;
import me.rhin.openciv.ui.label.CustomLabel;
import me.rhin.openciv.ui.window.AbstractWindow;

public class CurrentResearchWindow extends AbstractWindow
		implements ResizeListener, PickResearchListener, NextTurnListener, CompleteResearchListener {

	private BlankBackground blankBackground;
	private CustomLabel researchNameDesc;
	private CustomLabel researchTurnsLabel;
	private CustomLabel researchName;
	private OpenResearchButton researchButton;
	private ColoredBackground techIcon;
	private Technology tech;

	public CurrentResearchWindow() {
		super.setBounds(5, viewport.getWorldHeight() - 75, 225, 50);

		this.blankBackground = new BlankBackground(0, 0, getWidth(), getHeight());
		addActor(blankBackground);

		researchNameDesc = new CustomLabel("Researching: ");
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

		researchButton = new OpenResearchButton(blankBackground.getX() + blankBackground.getWidth() - 52,
				blankBackground.getY(), 48, 32);
		addActor(researchButton);

		this.techIcon = new ColoredBackground(TextureEnum.UI_BLACK.sprite(), 2, 2, 32, 32);
		addActor(techIcon);

		Civilization.getInstance().getEventManager().addListener(ResizeListener.class, this);
		Civilization.getInstance().getEventManager().addListener(PickResearchListener.class, this);
		Civilization.getInstance().getEventManager().addListener(NextTurnListener.class, this);
		Civilization.getInstance().getEventManager().addListener(CompleteResearchListener.class, this);
	}

	@Override
	public void onResize(int width, int height) {
		super.setPosition(5, height - 75);
	}

	@Override
	public void onPickResearch(Technology tech) {
		this.tech = tech;
		techIcon.setSprite(tech.getIcon());
		researchName.setText(tech.getName());

		int totalTurns = (int) Math.ceil(tech.getScienceCost()
				/ Civilization.getInstance().getGame().getPlayer().getStatLine().getStatValue(Stat.SCIENCE_GAIN));

		int currentTurns = (int) tech.getAppliedTurns();

		researchTurnsLabel.setText(currentTurns + "/" + totalTurns + " Turns");
	}

	@Override
	public void onNextTurn(NextTurnPacket packet) {
		if (tech == null)
			return;
		int totalTurns = (int) Math.ceil(tech.getScienceCost()
				/ Civilization.getInstance().getGame().getPlayer().getStatLine().getStatValue(Stat.SCIENCE_GAIN));

		int currentTurns = (int) tech.getAppliedTurns() + 1; // +1 since this listener before

		researchTurnsLabel.setText(currentTurns + "/" + totalTurns + " Turns");
	}

	@Override
	public void onCompleteResearch(CompleteResearchPacket packet) {
		if (tech.getID() != packet.getTechID())
			return;

		techIcon.setSprite(TextureEnum.UI_BLACK.sprite());
		researchName.setText("Nothing");
		researchTurnsLabel.setText("??/?? Turns");

		tech = null;
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
