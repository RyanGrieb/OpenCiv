package me.rhin.openciv.ui.game;

import com.badlogic.gdx.graphics.g2d.Sprite;
import com.badlogic.gdx.math.Vector2;
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
	private Vector2 backVector;
	private Vector2 frontVector;

	public TechnologyLeaf(TechnologyList technologyList, final Technology tech, float x, float y, float width,
			float height) {
		this.tech = tech;

		super.setBounds(x, y, width, height);

		Sprite sprite = null;

		if (tech.isResearched())
			sprite = TextureEnum.UI_GREEN.sprite();
		else if (tech.hasResearchedRequiredTechs())
			sprite = TextureEnum.UI_YELLOW.sprite();
		else
			sprite = TextureEnum.UI_RED.sprite();

		this.background = new ColoredBackground(sprite, 0, 0, width, height);
		// addActor(background);

		this.techNameLabel = new CustomLabel(tech.getName(), Align.center, 0, getHeight() - 30, width, height);
		addActor(techNameLabel);

		this.backVector = new Vector2(x, y);
		this.frontVector = new Vector2(x, y);
	}

	public Technology getTech() {
		return tech;
	}

	public void onClicked() {
		// Start researching the tech, ect.
		System.out.println("Research: " + tech.getName());
	}

	public Vector2 getBackVector() {
		return backVector;
	}

	public Vector2 getFrontVector() {
		return frontVector;
	}

}
