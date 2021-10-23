package me.rhin.openciv.ui.window.type;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.game.civilization.CivType;
import me.rhin.openciv.listener.ResizeListener;
import me.rhin.openciv.ui.background.BlankBackground;
import me.rhin.openciv.ui.list.ContainerList;
import me.rhin.openciv.ui.list.ListContainer.ListContainerType;
import me.rhin.openciv.ui.list.type.ListCivilization;
import me.rhin.openciv.ui.window.AbstractWindow;

public class ChooseCivWindow extends AbstractWindow implements ResizeListener {

	private BlankBackground blankBackground;
	private ContainerList civContianerList;

	public ChooseCivWindow() {
		super.setBounds(viewport.getWorldWidth() / 2 - 340, viewport.getWorldHeight() - 360, 200, 300);
		this.blankBackground = new BlankBackground(0, 0, getWidth(), getHeight());
		addActor(blankBackground);

		this.civContianerList = new ContainerList(this, 0, 0, getWidth(), getHeight());

		for (CivType civType : CivType.values()) {
			civContianerList.addItem(ListContainerType.CATEGORY, "Civilizations",
					new ListCivilization(civType, 200, 40));
		}

		addActor(civContianerList);

		Civilization.getInstance().getEventManager().addListener(ResizeListener.class, this);
	}

	@Override
	public void onResize(int width, int height) {
		super.setPosition(width / 2 - 340, height - 360);
		blankBackground.setPosition(0, 0);
		civContianerList.setPosition(0, 0);

	}

	@Override
	public void onClose() {
		super.onClose();

		civContianerList.onClose();
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
	public boolean closesGameDisplayWindows() {
		return false;
	}

	@Override
	public boolean isGameDisplayWindow() {
		return false;
	}

}
