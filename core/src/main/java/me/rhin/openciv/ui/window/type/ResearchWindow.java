package me.rhin.openciv.ui.window.type;

import java.util.ArrayList;

import com.badlogic.gdx.scenes.scene2d.Actor;
import com.badlogic.gdx.utils.Align;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.game.research.Technology;
import me.rhin.openciv.listener.PickResearchListener;
import me.rhin.openciv.listener.ResizeListener;
import me.rhin.openciv.listener.TopShapeRenderListener;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.ui.background.BlankBackground;
import me.rhin.openciv.ui.button.type.CloseWindowButton;
import me.rhin.openciv.ui.game.TechLineWeb;
import me.rhin.openciv.ui.game.TechnologyLeaf;
import me.rhin.openciv.ui.label.CustomLabel;
import me.rhin.openciv.ui.scrollbar.HorizontalScrollbar;
import me.rhin.openciv.ui.window.AbstractWindow;
import me.rhin.openciv.ui.window.HorizontalWindow;

public class ResearchWindow extends AbstractWindow
		implements HorizontalWindow, ResizeListener, TopShapeRenderListener, PickResearchListener {

	private static final int LEAF_WIDTH = 185;
	private static final int LEAF_HEIGHT = 45;

	private ArrayList<TechnologyLeaf> technologyLeafs;
	private BlankBackground blankBackground;
	private CustomLabel researchDescLabel;
	private CloseWindowButton closeWindowButton;
	private TechLineWeb techLineWeb;
	private HorizontalScrollbar horizontalScrollbar;

	public ResearchWindow() {
		super.setBounds(0, 0, viewport.getWorldWidth(), viewport.getWorldHeight());

		this.technologyLeafs = new ArrayList<>();

		this.blankBackground = new BlankBackground(0, 0, getWidth(), getHeight());
		addActor(blankBackground);

		this.researchDescLabel = new CustomLabel("Research Tree", Align.center, 0, getHeight() - 25, getWidth(), 15);
		addActor(researchDescLabel);

		Civilization.getInstance().getGame().getPlayer().unselectUnit();

		for (Technology tech : Civilization.getInstance().getGame().getPlayer().getResearchTree().getTechnologies()) {
			addTech(tech);
		}

		this.closeWindowButton = new CloseWindowButton(this.getClass(), "Close", viewport.getWorldWidth() / 2 - 150 / 2,
				25, 150, 45);
		addActor(closeWindowButton);

		this.techLineWeb = new TechLineWeb(technologyLeafs);
		addActor(techLineWeb);

		this.horizontalScrollbar = new HorizontalScrollbar(this, 0, 75, getWidth(), 25);
		addActor(horizontalScrollbar);

		Civilization.getInstance().getEventManager().addListener(ResizeListener.class, this);
		Civilization.getInstance().getEventManager().addListener(TopShapeRenderListener.class, this);
		Civilization.getInstance().getEventManager().addListener(PickResearchListener.class, this);
	}

	@Override
	public void onResize(int width, int height) {
		super.setSize(width, height);
		blankBackground.setSize(width, height);
		researchDescLabel.setBounds(0, height - 25, width, 15);
		closeWindowButton.setPosition(width / 2 - 150 / 2, 25);
		horizontalScrollbar.setBounds(0, 75, width, 25);

		for (TechnologyLeaf leaf : technologyLeafs) {

			float x = (leaf.getTech().getTreePosition().getX() * (LEAF_WIDTH + 25)) + 25;
			float y = (leaf.getTech().getTreePosition().getY() * (LEAF_HEIGHT + 10)) + (height / 2 - 500 / 2);
			leaf.setPosition(x, y);
		}
	}

	@Override
	public void onPickResearch(Technology tech) {
		for (TechnologyLeaf leaf : technologyLeafs) {
			if (leaf.getTech().equals(tech))
				leaf.setResearching(true);
			else
				leaf.setResearching(false);
		}
	}

	@Override
	public void onClose() {
		super.onClose();

		for (Actor actor : getChildren()) {
			if (actor instanceof Listener)
				Civilization.getInstance().getEventManager().clearListenersFromObject((Listener) actor);
		}

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

	@Override
	public float getTotalWidth() {
		return 2075;
	}

	@Override
	public void updatePositions(float xAmount) {
		for (TechnologyLeaf leaf : technologyLeafs)
			leaf.setPosition(leaf.getX() + xAmount, leaf.getY());
	}

	private void addTech(Technology tech) {

		float x = (tech.getTreePosition().getX() * (LEAF_WIDTH + 25)) + 25;
		float y = (tech.getTreePosition().getY() * (LEAF_HEIGHT + 10)) + (getHeight() / 2 - 500 / 2);

		TechnologyLeaf leaf = new TechnologyLeaf(tech, x, y, LEAF_WIDTH, LEAF_HEIGHT);
		technologyLeafs.add(leaf);
		addActor(leaf);
	}

	public ArrayList<TechnologyLeaf> getTechnologyLeafs() {
		return technologyLeafs;
	}
}
