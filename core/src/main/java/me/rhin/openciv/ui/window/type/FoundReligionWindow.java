package me.rhin.openciv.ui.window.type;

import java.util.ArrayList;

import com.badlogic.gdx.scenes.scene2d.actions.Actions;
import com.badlogic.gdx.utils.Align;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.religion.bonus.ReligionBonus;
import me.rhin.openciv.game.religion.icon.ReligionIcon;
import me.rhin.openciv.game.unit.Unit;
import me.rhin.openciv.listener.FoundReligionListener;
import me.rhin.openciv.shared.packet.type.FoundReligionPacket;
import me.rhin.openciv.ui.background.ColoredBackground;
import me.rhin.openciv.ui.button.type.CloseWindowButton;
import me.rhin.openciv.ui.button.type.FollowerBeliefButton;
import me.rhin.openciv.ui.button.type.FoundReligionButton;
import me.rhin.openciv.ui.button.type.FounderBeliefButton;
import me.rhin.openciv.ui.button.type.ReligionIconButton;
import me.rhin.openciv.ui.label.CustomLabel;
import me.rhin.openciv.ui.list.ContainerList;
import me.rhin.openciv.ui.window.AbstractWindow;

public class FoundReligionWindow extends AbstractWindow implements FoundReligionListener {

	private ColoredBackground blankBackground;
	private CloseWindowButton closeWindowButton;
	private FoundReligionButton foundReligionButton;
	private CustomLabel titleLabel;
	private CustomLabel chooseIconLabel;
	private ArrayList<ReligionIconButton> religionIconButtons;
	private CustomLabel religionNameDescLabel;
	private ColoredBackground religionIconBackground;
	private CustomLabel religionNameLabel;
	private CustomLabel pantheonDescLabel;
	private CustomLabel pantheonLabel;
	private CustomLabel founderBeliefDescLabel;
	private CustomLabel founderBeliefLabel;
	private CustomLabel followerBeliefDescLabel;
	private CustomLabel followerBeliefLabel;
	private FounderBeliefButton founderBeliefButton;
	private FollowerBeliefButton followerBeliefButton;
	private ContainerList bonusContianerList;

	private Unit unit;
	private ReligionIcon religionIcon;
	private ReligionBonus founderBonus;
	private ReligionBonus followerBonus;

	public FoundReligionWindow(Unit unit) {

		this.unit = unit;

		this.blankBackground = new ColoredBackground(TextureEnum.UI_GRAY.sprite(),
				viewport.getWorldWidth() / 2 - 600 / 2, viewport.getWorldHeight() / 2 - 600 / 2, 600, 600);
		addActor(blankBackground);

		this.closeWindowButton = new CloseWindowButton(getClass(), "Cancel",
				blankBackground.getX() + blankBackground.getWidth() / 2 - 135 / 2, blankBackground.getY() + 5, 165, 35);
		addActor(closeWindowButton);

		this.foundReligionButton = new FoundReligionButton(closeWindowButton.getX(), closeWindowButton.getY() + 35, 165,
				35);

		this.titleLabel = new CustomLabel("Found a Religion", Align.center, blankBackground.getX(),
				blankBackground.getY() + blankBackground.getHeight() - 18, blankBackground.getWidth(), 15);
		addActor(titleLabel);

		this.chooseIconLabel = new CustomLabel("Choose an Icon:");
		chooseIconLabel.setPosition(blankBackground.getX() + 5,
				blankBackground.getY() + blankBackground.getHeight() - 55);
		addActor(chooseIconLabel);

		this.religionIconButtons = new ArrayList<>();

		addReligionIconButtons();

		this.religionNameDescLabel = new CustomLabel("Religion: ");
		religionNameDescLabel.setPosition(chooseIconLabel.getX(), chooseIconLabel.getY() - 64);
		addActor(religionNameDescLabel);

		this.religionIconBackground = new ColoredBackground(TextureEnum.ICON_QUESTION.sprite(),
				religionNameDescLabel.getX(), religionNameDescLabel.getY() - 35, 32, 32);
		addActor(religionIconBackground);

		this.religionNameLabel = new CustomLabel("Name: N/A");
		religionNameLabel.setPosition(religionNameDescLabel.getX() + 40, religionNameDescLabel.getY() - 25);
		addActor(religionNameLabel);

		this.pantheonDescLabel = new CustomLabel("Pantheon:");
		pantheonDescLabel.setPosition(religionNameDescLabel.getX(), religionNameLabel.getY() - 45);
		addActor(pantheonDescLabel);

		this.pantheonLabel = new CustomLabel(
				Civilization.getInstance().getGame().getPlayer().getReligion().getPickedBonuses().get(0).getDesc());
		pantheonLabel.setPosition(pantheonDescLabel.getX(), pantheonDescLabel.getY() - 35);
		addActor(pantheonLabel);

		this.founderBeliefDescLabel = new CustomLabel("Founder Belief:");
		founderBeliefDescLabel.setPosition(pantheonLabel.getX(), pantheonLabel.getY() - 45);
		addActor(founderBeliefDescLabel);

		this.founderBeliefButton = new FounderBeliefButton(
				founderBeliefDescLabel.getX() + founderBeliefDescLabel.getWidth(), founderBeliefDescLabel.getY() - 11,
				80, 32);
		addActor(founderBeliefButton);

		this.founderBeliefLabel = new CustomLabel("None");
		founderBeliefLabel.setPosition(founderBeliefDescLabel.getX(), founderBeliefDescLabel.getY() - 55);
		addActor(founderBeliefLabel);

		this.followerBeliefDescLabel = new CustomLabel("Follower Belief:");
		followerBeliefDescLabel.setPosition(founderBeliefLabel.getX(), founderBeliefLabel.getY() - 45);
		addActor(followerBeliefDescLabel);

		this.followerBeliefButton = new FollowerBeliefButton(
				followerBeliefDescLabel.getX() + followerBeliefDescLabel.getWidth(),
				followerBeliefDescLabel.getY() - 11, 80, 32);
		addActor(followerBeliefButton);

		this.followerBeliefLabel = new CustomLabel("None");
		followerBeliefLabel.setPosition(followerBeliefDescLabel.getX(), followerBeliefDescLabel.getY() - 55);
		addActor(followerBeliefLabel);

		this.bonusContianerList = new ContainerList(this, blankBackground.getX() + blankBackground.getWidth() / 2 - 35,
				165, 300, 400);

		// FIXME: This is terrible:
		bonusContianerList.getScrollbar().addAction(Actions.removeActor());

		Civilization.getInstance().getEventManager().addListener(FoundReligionListener.class, this);
	}

	@Override
	public void onFoundReligion(FoundReligionPacket packet) {
		for (ReligionIconButton iconButton : religionIconButtons) {
			iconButton.addAction(Actions.removeActor());
		}

		religionIconButtons.clear();

		addReligionIconButtons();
	}

	private void addReligionIconButtons() {
		int index = 0;
		for (ReligionIcon icon : Civilization.getInstance().getGame().getAvailableReligionIcons().getAvailableIcons()) {

			if (icon == ReligionIcon.PANTHEON)
				continue;

			ReligionIconButton iconButton = new ReligionIconButton(icon,
					chooseIconLabel.getX() + chooseIconLabel.getWidth() + 15 + (68 * index),
					chooseIconLabel.getY() - 28, 64, 64);

			religionIconButtons.add(iconButton);
			addActor(iconButton);

			index++;
		}
	}

	@Override
	public boolean disablesInput() {
		return true;
	}

	@Override
	public boolean disablesCameraMovement() {
		return true;
	}

	@Override
	public boolean closesOtherWindows() {
		return true;
	}

	@Override
	public boolean closesGameDisplayWindows() {
		return true;
	}

	@Override
	public boolean isGameDisplayWindow() {
		return false;
	}

	public CustomLabel getReligionNameLabel() {
		return religionNameLabel;
	}

	public ColoredBackground getReligionIconBackground() {
		return religionIconBackground;
	}

	public ContainerList getBonusContianerList() {
		return bonusContianerList;
	}

	public CustomLabel getFounderBeliefLabel() {
		return founderBeliefLabel;
	}

	public CustomLabel getFollowerBeliefLabel() {
		return followerBeliefLabel;
	}

	public void setFounderBelief(ReligionBonus religionBonus) {
		founderBonus = religionBonus;
	}

	public void setFollowerBelief(ReligionBonus religionBonus) {
		followerBonus = religionBonus;
	}

	public void setReligionIcon(ReligionIcon religionIcon) {
		this.religionIcon = religionIcon;
	}

	public void checkFoundableCondition() {
		if (religionIcon != null && founderBonus != null && followerBonus != null
				&& foundReligionButton.getParent() == null) {
			addActor(foundReligionButton);
		}
	}

	public ReligionBonus getFounderBonus() {
		return founderBonus;
	}

	public ReligionBonus getFollowerBonus() {
		return followerBonus;
	}

	public ReligionIcon getReligionIcon() {
		return religionIcon;
	}

	public Unit getUnit() {
		return unit;
	}
}
