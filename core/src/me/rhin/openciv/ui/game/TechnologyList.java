package me.rhin.openciv.ui.game;

import java.util.ArrayList;

import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.scenes.scene2d.Group;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.research.Technology;
import me.rhin.openciv.ui.background.BlankBackground;
import me.rhin.openciv.ui.background.ColoredBackground;

public class TechnologyList extends Group {

	private ArrayList<TechnologyLeaf> technologyLeafs;
	private ColoredBackground blankBackground;

	public TechnologyList(float x, float y, float width, float height) {
		super.setBounds(x, y, width, height);

		this.technologyLeafs = new ArrayList<>();

		this.blankBackground = new ColoredBackground(TextureEnum.UI_GRAY.sprite(), 0, 0, width, height);
		addActor(blankBackground);
	}

	@Override
	public void draw(Batch batch, float parentAlpha) {
		super.draw(batch, parentAlpha);
		// Scroll manipulation?
	}

	public void addTech(Technology tech) {

		float width = 125;
		float height = 45;

		float x = 25;
		float y = getHeight() / 2 - height / 2;

		int requiredTechs = 0;
		Technology currentTech = tech;
		while (currentTech.getRequiredTechs().size() > 0) {
			// Just get the first element
			currentTech = Civilization.getInstance().getGame().getPlayer().getResearchTree()
					.getTechnology(currentTech.getRequiredTechs().get(0));
			requiredTechs++;
		}

		x += requiredTechs * 150;

		ArrayList<TechnologyLeaf> rowLeafs = new ArrayList<>();
		for (TechnologyLeaf leaf : technologyLeafs)
			if (leaf.getTech().getRequiredTechs().size() == tech.getRequiredTechs().size())
				rowLeafs.add(leaf);

		// Now, determine the proper Y axis for the list of leafs in the same row.
		// There are 10 slots for leafs

		// Start at the center. Then for each leaf added. shift down the y axis by
		// height/2 for ALL leafs. (inc. the one being added)

		TechnologyLeaf leaf = new TechnologyLeaf(this, tech, x, y, width, height);
		technologyLeafs.add(leaf);
		addActor(leaf);
	}
}
