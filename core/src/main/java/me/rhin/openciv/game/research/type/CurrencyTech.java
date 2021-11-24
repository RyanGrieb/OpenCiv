package me.rhin.openciv.game.research.type;

import com.badlogic.gdx.graphics.g2d.Sprite;

import me.rhin.openciv.game.research.ResearchTree;
import me.rhin.openciv.game.research.Technology;

public class CurrencyTech extends Technology {

	public CurrencyTech(ResearchTree researchTree) {
		super(researchTree);
	}

	@Override
	public int getScienceCost() {
		return 0;
	}

	@Override
	public String getName() {
		
		return null;
	}

	@Override
	public Sprite getIcon() {
		
		return null;
	}

	@Override
	public String getDesc() {
		
		return null;
	}

}
