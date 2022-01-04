package me.rhin.openciv.ui.window.type;

import java.util.Iterator;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.game.production.ProductionItem;
import me.rhin.openciv.game.religion.bonus.ReligionBonus;
import me.rhin.openciv.game.religion.bonus.ReligionBonusType;
import me.rhin.openciv.listener.PickPantheonListener;
import me.rhin.openciv.listener.ResizeListener;
import me.rhin.openciv.shared.packet.type.PickPantheonPacket;
import me.rhin.openciv.ui.background.BlankBackground;
import me.rhin.openciv.ui.button.type.CloseWindowButton;
import me.rhin.openciv.ui.list.ContainerList;
import me.rhin.openciv.ui.list.ListContainer.ListContainerType;
import me.rhin.openciv.ui.list.ListObject;
import me.rhin.openciv.ui.list.type.ListProductionItem;
import me.rhin.openciv.ui.list.type.ListReligionBonus;
import me.rhin.openciv.ui.window.AbstractWindow;

public class ChoosePantheonWindow extends AbstractWindow implements ResizeListener, PickPantheonListener {

	private BlankBackground blankBackground;
	private CloseWindowButton closeWindowButton;
	private ContainerList bonusContianerList;

	public ChoosePantheonWindow() {
		super.setBounds(viewport.getWorldWidth() / 2 - 300 / 2, viewport.getWorldHeight() / 2 - 450 / 2, 300, 450);

		this.blankBackground = new BlankBackground(0, 0, getWidth(), getHeight());
		addActor(blankBackground);

		this.closeWindowButton = new CloseWindowButton(getClass(), "Cancel", getWidth() / 2 - 135 / 2, 10, 135, 35);
		addActor(closeWindowButton);

		this.bonusContianerList = new ContainerList(this, 0, 55, getWidth() - 20, getHeight() - 55);
		addActor(bonusContianerList);

		for (ReligionBonus religionBonus : Civilization.getInstance().getGame().getAvailableReligionBonuses()
				.getAvailablePantheons()) {
			bonusContianerList.addItem(ListContainerType.CATEGORY, "Available Pantheons",
					new ListReligionBonus(religionBonus.getBonusType(), getWidth(), 70));
		}

		Civilization.getInstance().getEventManager().addListener(PickPantheonListener.class, this);
	}

	@Override
	public void onPickPantheon(PickPantheonPacket packet) {
		Civilization.getInstance().getGame().getAvailableReligionBonuses()
				.getPantheonFromID(packet.getReligionBonusID()).getBonusType();

		bonusContianerList.clearList();

		for (ReligionBonus religionBonus : Civilization.getInstance().getGame().getAvailableReligionBonuses()
				.getAvailablePantheons()) {
			bonusContianerList.addItem(ListContainerType.CATEGORY, "Available Pantheons",
					new ListReligionBonus(religionBonus.getBonusType(), getWidth(), 70));
		}
	}

	@Override
	public void onResize(int width, int height) {

	}

	@Override
	public boolean disablesInput() {
		return true;
	}

	@Override
	public boolean disablesCameraMovement() {
		return false;
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
