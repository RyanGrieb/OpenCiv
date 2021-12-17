package me.rhin.openciv.game.research.type;

import com.badlogic.gdx.graphics.g2d.Sprite;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.research.ResearchTree;
import me.rhin.openciv.game.research.Technology;
import me.rhin.openciv.game.research.TreePosition;

public class MetalCastingTech extends Technology {

	public MetalCastingTech(ResearchTree researchTree) {
		super(researchTree, new TreePosition(4, 1));
		
		requiredTechs.add(IronWorkingTech.class);
		requiredTechs.add(EngineeringTech.class);
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
