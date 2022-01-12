package me.rhin.openciv.ui.window.type;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.game.religion.bonus.ReligionBonus;
import me.rhin.openciv.listener.PickPantheonListener;
import me.rhin.openciv.listener.ResizeListener;
import me.rhin.openciv.shared.packet.type.PickPantheonPacket;
import me.rhin.openciv.ui.background.BlankBackground;
import me.rhin.openciv.ui.button.type.CloseWindowButton;
import me.rhin.openciv.ui.list.ContainerList;
import me.rhin.openciv.ui.list.ListContainer.ListContainerType;
import me.rhin.openciv.ui.list.type.ListReligionBonus;
import me.rhin.openciv.ui.window.AbstractWindow;

public class ChoosePantheonWindow extends AbstractWindow implements ResizeListener, PickPantheonListener {

	private BlankBackground blankBackground;
	private CloseWindowButton closeWindowButton;
	private ContainerList bonusContianerList;

	public ChoosePantheonWindow() {
		setBounds(viewport.getWorldWidth() / 2 - 300 / 2, viewport.getWorldHeight() / 2 - 450 / 2, 300, 450);

		this.blankBackground = new BlankBackground(0, 0, getWidth(), getHeight());
		addActor(blankBackground);

		this.bonusContianerList = new ContainerList(0, 55, getWidth(), getHeight() - 55);
		addActor(bonusContianerList);

		for (ReligionBonus religionBonus : Civilization.getInstance().getGame().getAvailableReligionBonuses()
				.getAvailablePantheons()) {
			bonusContianerList.addItem(ListContainerType.CATEGORY, "Available Pantheons",
					new ListReligionBonus(religionBonus, bonusContianerList, getWidth() - 20, 70));
		}

		this.closeWindowButton = new CloseWindowButton(getClass(), "Cancel", getWidth() / 2 - 135 / 2, 10, 135, 35);
		addActor(closeWindowButton);

		Civilization.getInstance().getEventManager().addListener(PickPantheonListener.class, this);
		Civilization.getInstance().getEventManager().addListener(ResizeListener.class, this);
	}

	@Override
	public void onPickPantheon(PickPantheonPacket packet) {

		bonusContianerList.clearList();

		for (ReligionBonus religionBonus : Civilization.getInstance().getGame().getAvailableReligionBonuses()
				.getAvailablePantheons()) {
			bonusContianerList.addItem(ListContainerType.CATEGORY, "Available Pantheons",
					new ListReligionBonus(religionBonus, bonusContianerList, blankBackground.getWidth(), 70));
		}
	}

	@Override
	public void onResize(int width, int height) {
		setPosition(width / 2 - 300 / 2, height / 2 - 450 / 2);
	}

	@Override
	public boolean disablesInput() {
		return false;
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
		return false;
	}

	@Override
	public boolean isGameDisplayWindow() {
		return false;
	}
}
