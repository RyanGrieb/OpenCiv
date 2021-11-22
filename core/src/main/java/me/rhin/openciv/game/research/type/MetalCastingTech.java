package me.rhin.openciv.game.research.type;

import com.badlogic.gdx.graphics.g2d.Sprite;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.research.ResearchTree;
import me.rhin.openciv.game.research.Technology;

public class MetalCastingTech extends Technology {

	public MetalCastingTech(ResearchTree researchTree) {
		super(researchTree);
		
		requiredTechs.add(IronWorkingTech.class);
	}

	@Override
	public int getScienceCost() {
		return 275;
	}

	@Override
	public String getName() {
		return "Metal Casting";
	}

	@Override
	public Sprite getIcon() {
		return TextureEnum.BUILDING_FORGE.sprite();
	}

	@Override
	public String getDesc() {
		return "- Unlocks forge building\n- Unlocks workshop building.";
	}

}
