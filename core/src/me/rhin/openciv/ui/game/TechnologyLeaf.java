package me.rhin.openciv.ui.game;

import com.badlogic.gdx.scenes.scene2d.Group;
import com.badlogic.gdx.utils.Align;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.research.Technology;
import me.rhin.openciv.ui.background.ColoredBackground;
import me.rhin.openciv.ui.label.CustomLabel;

public class TechnologyLeaf extends Group {

	private Technology tech;
	private ColoredBackground background;
	private CustomLabel techNameLabel;

	public TechnologyLeaf(TechnologyList technologyList, Technology tech, float x, float y, float width, float height) {
		this.tech = tech;

		super.setBounds(x, y, width, height);

		this.background = new ColoredBackground(TextureEnum.UI_LIGHTER_GRAY.sprite(), 0, 0, width, height);
		addActor(background);

		this.techNameLabel = new CustomLabel(tech.getName(), Align.center, 0, getHeight() - 30, width, height);
		addActor(techNameLabel);
	}

	public Technology getTech() {
		return tech;
	}

}
