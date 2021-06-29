package me.rhin.openciv.ui.game;

import java.util.ArrayList;

import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.scenes.scene2d.Group;
import com.badlogic.gdx.scenes.scene2d.InputEvent;
import com.badlogic.gdx.scenes.scene2d.utils.ClickListener;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.research.Technology;
import me.rhin.openciv.ui.background.ColoredBackground;

public class TechnologyList extends Group {

	private ArrayList<TechnologyLeaf> technologyLeafs;
	private ColoredBackground blankBackground;

	public TechnologyList(float x, float y, float width, float height) {
		super.setBounds(x, y, width, height);

		this.technologyLeafs = new ArrayList<>();

		this.blankBackground = new ColoredBackground(TextureEnum.UI_GRAY.sprite(), 0, 0, width, height);
		addActor(blankBackground);

		addListener(new ClickListener() {

			@Override
			public void clicked(InputEvent event, float x, float y) {
				// FIXME: Shouldn't we just have a listener for each leaf?
				for (TechnologyLeaf leaf : technologyLeafs) {
					if (x > leaf.getX() && x < leaf.getX() + leaf.getWidth() && y > leaf.getY()
							&& y < leaf.getY() + leaf.getHeight())
						leaf.onClicked();
				}
			}
		});

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
		float y = getHeight() - height - 20;

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

		// Set the y axis, starting at the top of the window.
		// If we have a required tehch. Set the y axis to the required tech.
		// If more than required tehc, then were fucked!.
		int sameXAxisLeafs = 0;
		for (TechnologyLeaf leaf : technologyLeafs) {
			if (leaf.getX() == x)
				sameXAxisLeafs++;
		}

		y -= sameXAxisLeafs * 65;

		TechnologyLeaf leaf = new TechnologyLeaf(this, tech, x, y, width, height);
		technologyLeafs.add(leaf);
		addActor(leaf);
	}
}
