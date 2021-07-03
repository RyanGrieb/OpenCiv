package me.rhin.openciv.game.research.type;

import com.badlogic.gdx.graphics.g2d.Sprite;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.research.Technology;

public class AnimalHusbandryTech extends Technology {

	@Override
	public int getScienceCost() {
		return 35;
	}

	@Override
	public String getName() {
		return "Animal Husbandry";
	}

	@Override
	public Sprite getIcon() {
		return TextureEnum.TILE_HORSES.sprite();
	}

	@Override
	public String getDesc() {
		return "- Unlocks caravans\n" + "- Workers can build pastures";
	}
}
