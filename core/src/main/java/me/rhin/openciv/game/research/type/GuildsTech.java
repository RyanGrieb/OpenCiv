package me.rhin.openciv.game.research.type;

import com.badlogic.gdx.graphics.g2d.Sprite;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.research.ResearchTree;
import me.rhin.openciv.game.research.Technology;
import me.rhin.openciv.game.research.TreePosition;

public class GuildsTech extends Technology {

	public GuildsTech(ResearchTree researchTree) {
		super(researchTree, new TreePosition(4, 3));

		requiredTechs.add(CurrencyTech.class);
	}

	@Override
	public int getScienceCost() {
		return 275;
	}

	@Override
	public String getName() {
		return "Guilds";
	}

	@Override
	public Sprite getIcon() {
		return TextureEnum.BUILDING_MACHU_PICCHU.sprite();
	}

	@Override
	public String getDesc() {
		return "- Unlocks Machu Picchu\n- Allow builders to build\ntrading post improvement";
	}

}
