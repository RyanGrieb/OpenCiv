package me.rhin.openciv.game.research.type;

import com.badlogic.gdx.graphics.g2d.Sprite;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.research.ResearchTree;
import me.rhin.openciv.game.research.Technology;
import me.rhin.openciv.game.research.TreePosition;

public class TheologyTech extends Technology {

	public TheologyTech(ResearchTree researchTree) {
		super(researchTree, new TreePosition(4, 8));
		
		requiredTechs.add(PhilosophyTech.class);
	}

	@Override
	public int getScienceCost() {
		return 175;
	}

	@Override
	public String getName() {
		return "Theology";
	}

	@Override
	public Sprite getIcon() {
		return TextureEnum.BUILDING_GARDEN.sprite();
	}

	@Override
	public String getDesc() {
		return "- Unlocks garden building\n - Still WIP...";
	}

}
