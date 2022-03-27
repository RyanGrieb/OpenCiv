package me.rhin.openciv.ui.window.type;

import com.badlogic.gdx.math.MathUtils;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.notification.type.NotResearchingNotification;
import me.rhin.openciv.game.research.Technology;
import me.rhin.openciv.shared.listener.EventHandler;
import me.rhin.openciv.shared.packet.type.CompleteResearchPacket;
import me.rhin.openciv.shared.packet.type.NextTurnPacket;
import me.rhin.openciv.shared.stat.Stat;
import me.rhin.openciv.ui.background.ColoredBackground;
import me.rhin.openciv.ui.button.CustomButton;
import me.rhin.openciv.ui.label.CustomLabel;
import me.rhin.openciv.ui.window.AbstractWindow;

public class CurrentResearchWindow extends AbstractWindow {

	private ColoredBackground blankBackground;
	private CustomLabel researchNameDesc;
	private CustomLabel researchTurnsLabel;
	private CustomLabel researchName;
	private CustomButton researchButton;
	private ColoredBackground techIcon;
	private Technology tech;

	public CurrentResearchWindow() {
		super.setBounds(5, viewport.getWorldHeight() - 85, 225, 60);

		this.blankBackground = new ColoredBackground(TextureEnum.UI_POPUP_BOX_D.sprite(), 0, 0, getWidth(),
				getHeight());
		addActor(blankBackground);

		researchNameDesc = new CustomLabel("Researching: ");
		researchNameDesc.setPosition(5 + 3,
				blankBackground.getY() + blankBackground.getHeight() - researchNameDesc.getHeight() - 6);
		addActor(researchNameDesc);

		researchTurnsLabel = new CustomLabel("??/?? Turns");
		researchTurnsLabel.setPosition(researchNameDesc.getX() + researchNameDesc.getWidth() - 2,
				researchNameDesc.getY());
		addActor(researchTurnsLabel);

		researchName = new CustomLabel("Nothing");
		researchName.setPosition(blankBackground.getX() + 40, blankBackground.getY() + researchName.getHeight() - 2);
		addActor(researchName);

		researchButton = new CustomButton(TextureEnum.UI_BUTTON_SMALL, TextureEnum.UI_BUTTON_SMALL_HOVERED,
				TextureEnum.ICON_SCIENCE, blankBackground.getX() + blankBackground.getWidth() - 52,
				blankBackground.getY() + 3, 48, 32, 16, 16);
		researchButton.onClick(() -> {
			if (Civilization.getInstance().getGame().getPlayer().getOwnedCities().size() < 1)
				return;

			Civilization.getInstance().getWindowManager().toggleWindow(new ResearchWindow());
		});
		addActor(researchButton);

		this.techIcon = new ColoredBackground(TextureEnum.UI_CLEAR.sprite(), 6, 6, 32, 32);
		addActor(techIcon);
	}

	@EventHandler
	public void onResize(int width, int height) {
		super.setPosition(5, height - 85);
	}

	@EventHandler
	public void onPickResearch(Technology tech) {
		this.tech = tech;
		techIcon.setSprite(tech.getIcon());
		techIcon.setBounds(6, 6, 32, 32);
		researchName.setText(tech.getName());

		int totalTurns = (int) Math.ceil(tech.getScienceCost()
				/ Civilization.getInstance().getGame().getPlayer().getStatLine().getStatValue(Stat.SCIENCE_GAIN));

		int currentTurns = (int) tech.getAppliedTurns();

		researchTurnsLabel.setText(currentTurns + "/" + totalTurns + " Turns");
	}

	@EventHandler
	public void onNextTurn(NextTurnPacket packet) {
		if (tech == null)
			return;

		// FIXME: This returns incorrect values when our science increases. It assumes
		// we are at turn 0 when reseaching something, but when our science increases +
		// 10 when we have 1 turn left, we go over the totalTurns

		float techAppliedScience = tech.getAppliedScience()
				+ Civilization.getInstance().getGame().getPlayer().getStatLine().getStatValue(Stat.SCIENCE_GAIN);

		int turnsLeft = MathUtils.ceil((tech.getScienceCost() - techAppliedScience)
				/ Civilization.getInstance().getGame().getPlayer().getStatLine().getStatValue(Stat.SCIENCE_GAIN)) + 1;

		int currentTurns = (int) tech.getAppliedTurns(); // +1 since this listener before

		int totalTurns = currentTurns + turnsLeft;

		researchTurnsLabel.setText(currentTurns + "/" + totalTurns + " Turns");
	}

	@EventHandler
	public void onCompleteResearch(CompleteResearchPacket packet) {
		if (tech.getID() != packet.getTechID())
			return;

		techIcon.setSprite(TextureEnum.UI_CLEAR.sprite());
		techIcon.setBounds(6, 6, 32, 32);
		researchName.setText("Nothing");
		researchTurnsLabel.setText("??/?? Turns");

		tech = null;

		// FIXME: Move somewhere else?
		boolean treeComplete = true;

		for (Technology technology : Civilization.getInstance().getGame().getPlayer().getResearchTree()
				.getTechnologies()) {
			if (!technology.isResearched())
				treeComplete = false;
		}

		if (!treeComplete)
			Civilization.getInstance().getGame().getNotificationHanlder()
					.fireNotification(new NotResearchingNotification());
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
