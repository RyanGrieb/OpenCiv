package me.rhin.openciv.game.research.type;

import com.badlogic.gdx.graphics.g2d.Sprite;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.research.ResearchTree;
import me.rhin.openciv.game.research.Technology;

public class EngineeringTech extends Technology {

	public EngineeringTech(ResearchTree researchTree) {
		super(researchTree);
		
		requiredTechs.add(MathematicsTech.class);
		requiredTechs.add(ConstructionTech.class);
	}

	@Override
	public int getScienceCost() {
		return 175;
	}

	@Override
	public String getName() {
		return "Engineering";
	}

	@Override
	public Sprite getIcon() {
		return TextureEnum.BUILDING_AQUEDUCT.sprite();
	}

	@Override
	public String getDesc() {
		return "- Unlocks aqueduct building\n- +1 Trade route";
	}

}
