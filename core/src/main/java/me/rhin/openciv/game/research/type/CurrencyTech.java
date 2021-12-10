package me.rhin.openciv.game.research.type;

import com.badlogic.gdx.graphics.g2d.Sprite;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.research.ResearchTree;
import me.rhin.openciv.game.research.Technology;
import me.rhin.openciv.game.research.TreePosition;

public class CurrencyTech extends Technology {

	public CurrencyTech(ResearchTree researchTree) {
		super(researchTree, new TreePosition(3, 3));
		
		this.requiredTechs.add(MathematicsTech.class);
	}

	@Override
	public int getScienceCost() {
		return 175;
	}

	@Override
	public String getName() {
		return "Currency";
	}

	@Override
	public Sprite getIcon() {
		return TextureEnum.BUILDING_MARKET.sprite();
	}

	@Override
	public String getDesc() {
		return "- Unlocks market building\n- Unlocks mint building";
	}

}
