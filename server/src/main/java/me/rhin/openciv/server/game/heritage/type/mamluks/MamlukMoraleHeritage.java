package me.rhin.openciv.server.game.heritage.type.mamluks;

import me.rhin.openciv.server.game.AbstractPlayer;
import me.rhin.openciv.server.game.heritage.Heritage;

public class MamlukMoraleHeritage extends Heritage {

	public MamlukMoraleHeritage(AbstractPlayer player) {
		super(player);
	}

	@Override
	public int getLevel() {
		return 0;
	}

	@Override
	public String getName() {
		return "Mamluk Morale";
	}

	@Override
	public float getCost() {
		return 35;
	}

	@Override
	protected void onStudied() {

	}

}
