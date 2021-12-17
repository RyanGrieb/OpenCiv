package me.rhin.openciv.game.research.type;

import com.badlogic.gdx.graphics.g2d.Sprite;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.research.ResearchTree;
import me.rhin.openciv.game.research.Technology;
import me.rhin.openciv.game.research.TreePosition;

public class MachineryTech extends Technology {

	public MachineryTech(ResearchTree researchTree) {
		super(researchTree, new TreePosition(5, 2));

		requiredTechs.add(EngineeringTech.class);
		requiredTechs.add(GuildsTech.class);
	}

	@Override
	public int getScienceCost() {
		return 485;
	}

	@Override
	public String getName() {
		return "Machinery";
	}

	@Override
	public Sprite getIcon() {
		return TextureEnum.UNIT_CROSSBOWMAN.sprite();
	}

	@Override
	public String getDesc() {
		return "- Unlocks crossbowman unit\n- Unlocks ironworks building";
	}

}
