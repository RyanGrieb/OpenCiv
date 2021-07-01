package me.rhin.openciv.ui.window.type;

import java.util.ArrayList;

import com.badlogic.gdx.graphics.Color;
import com.badlogic.gdx.graphics.glutils.ShapeRenderer;
import com.badlogic.gdx.utils.Align;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.game.research.Technology;
import me.rhin.openciv.listener.CompleteResearchListener;
import me.rhin.openciv.listener.PickResearchListener;
import me.rhin.openciv.listener.ResizeListener;
import me.rhin.openciv.listener.TopShapeRenderListener;
import me.rhin.openciv.shared.packet.type.CompleteResearchPacket;
import me.rhin.openciv.ui.background.BlankBackground;
import me.rhin.openciv.ui.button.type.CloseResearchButton;
import me.rhin.openciv.ui.game.TechnologyLeaf;
import me.rhin.openciv.ui.label.CustomLabel;
import me.rhin.openciv.ui.window.AbstractWindow;

public class ResearchWindow extends AbstractWindow
		implements ResizeListener, TopShapeRenderListener, PickResearchListener {

	private ArrayList<TechnologyLeaf> technologyLeafs;
	private BlankBackground blankBackground;
	private CustomLabel researchDescLabel;
	private CloseResearchButton closeResearchButton;

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

		this.closeResearchButton = new CloseResearchButton(viewport.getWorldWidth() / 2 - 150 / 2, 35, 150, 45);
		addActor(closeResearchButton);

		Civilization.getInstance().getEventManager().addListener(ResizeListener.class, this);
		Civilization.getInstance().getEventManager().addListener(TopShapeRenderListener.class, this);
		Civilization.getInstance().getEventManager().addListener(PickResearchListener.class, this);
	}

	@Override
	public void onResize(int width, int height) {
		super.setSize(width, height);
		blankBackground.setSize(width, height);
		researchDescLabel.setBounds(0, height - 25, width, 15);
		closeResearchButton.setPosition(width / 2 - 150 / 2, 35);

		for (TechnologyLeaf leaf : technologyLeafs) {

			float x = 25;
			float y = height - 75 - 50;

			int requiredTechs = 0;
			Technology currentTech = leaf.getTech();
			while (currentTech.getRequiredTechs().size() > 0) {
				// Just get the first element
				currentTech = Civilization.getInstance().getGame().getPlayer().getResearchTree()
						.getTechnology(currentTech.getRequiredTechs().get(0));
				requiredTechs++;
			}

			x += requiredTechs * 170;

			int sameXAxisLeafs = 0;
			for (TechnologyLeaf otherLeaf : technologyLeafs) {
				if (otherLeaf.equals(leaf))
					break;
				if (otherLeaf.getTech().getRequiredTechs().size() == leaf.getTech().getRequiredTechs().size())
					sameXAxisLeafs++;
			}

			y -= sameXAxisLeafs * 95;

			leaf.setPosition(x, y);
		}
	}

	@Override
	public void onTopShapeRender(ShapeRenderer shapeRenderer) {
		for (TechnologyLeaf leaf : technologyLeafs) {
			if (leaf.getTech().getRequiredTechs().size() > 0) {

				for (Class<? extends Technology> techClazz : leaf.getTech().getRequiredTechs()) {

					Technology tech = Civilization.getInstance().getGame().getPlayer().getResearchTree()
							.getTechnology(techClazz);

					for (TechnologyLeaf otherLeaf : technologyLeafs) {
						if (otherLeaf.getTech().equals(tech)) {

							// Draw line to other leaf of the required tech
							shapeRenderer.setColor(Color.WHITE);
							shapeRenderer.line(leaf.getBackVector(), otherLeaf.getFrontVector());
						}
					}
				}
			}
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

	private void addTech(Technology tech) {

		float width = 145;
		float height = 75;

		float x = 25;
		float y = getHeight() - height - 50;

		int requiredTechs = 0;
		Technology currentTech = tech;
		while (currentTech.getRequiredTechs().size() > 0) {
			// Just get the first element
			currentTech = Civilization.getInstance().getGame().getPlayer().getResearchTree()
					.getTechnology(currentTech.getRequiredTechs().get(0));
			requiredTechs++;
		}

		x += requiredTechs * 170;

		ArrayList<TechnologyLeaf> rowLeafs = new ArrayList<>();
		for (TechnologyLeaf leaf : technologyLeafs)
			if (leaf.getTech().getRequiredTechs().size() == tech.getRequiredTechs().size())
				rowLeafs.add(leaf);

		// Set the y axis, starting at the top of the window.
		// If we have a required tehch. Set the y axis to the required tech.
		// If more than required tehc, then were fucked!.
		int sameXAxisLeafs = 0;
		for (TechnologyLeaf leaf : technologyLeafs) {
			if (leaf.getTech().getRequiredTechs().size() == tech.getRequiredTechs().size())
				sameXAxisLeafs++;
		}

		y -= sameXAxisLeafs * 95;

		TechnologyLeaf leaf = new TechnologyLeaf(tech, x, y, width, height);
		technologyLeafs.add(leaf);
		addActor(leaf);
	}
}
