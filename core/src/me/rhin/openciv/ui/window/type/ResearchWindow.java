package me.rhin.openciv.ui.window.type;

import com.badlogic.gdx.utils.Align;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.game.research.ResearchTree;
import me.rhin.openciv.game.research.Technology;
import me.rhin.openciv.listener.ResizeListener;
import me.rhin.openciv.ui.background.BlankBackground;
import me.rhin.openciv.ui.game.TechnologyList;
import me.rhin.openciv.ui.label.CustomLabel;
import me.rhin.openciv.ui.window.AbstractWindow;

public class ResearchWindow extends AbstractWindow implements ResizeListener {

	private BlankBackground blankBackground;
	private CustomLabel researchDescLabel;
	private TechnologyList technologyList;

	public ResearchWindow() {
		super.setBounds(0, 0, viewport.getWorldWidth(), viewport.getWorldHeight());

		this.blankBackground = new BlankBackground(0, 0, getWidth(), getHeight());
		addActor(blankBackground);

		this.researchDescLabel = new CustomLabel("Research Tree", Align.center, 0, getHeight() - 25, getWidth(), 15);
		addActor(researchDescLabel);

		this.technologyList = new TechnologyList(100, 35, getWidth() - 200, getHeight() - 70);

		Civilization.getInstance().getGame().getPlayer().unselectUnit();

		Civilization.getInstance().getEventManager().addListener(ResizeListener.class, this);

		for (Technology tech : Civilization.getInstance().getGame().getPlayer().getResearchTree().getTechnologies()) {
			technologyList.addTech(tech);
		}
		
		addActor(technologyList);
	}

	@Override
	public void onResize(int width, int height) {
		super.setSize(width, height);
		blankBackground.setSize(width, height);
		researchDescLabel.setBounds(0, height - 25, width, 15);
	}

	@Override
	public void onClose() {
		super.onClose();

		Civilization.getInstance().getEventManager().clearListenersFromObject(this);
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
		return false;
	}

	@Override
	public boolean isGameDisplayWindow() {
		return false;
	}
}
