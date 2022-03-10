package me.rhin.openciv.server.game.civilization.type;

import me.rhin.openciv.server.game.AbstractPlayer;
import me.rhin.openciv.server.game.civilization.Civ;
import me.rhin.openciv.server.game.heritage.type.mamluks.BazaarHeritage;
import me.rhin.openciv.server.game.heritage.type.mamluks.IslamicScholarHeritage;
import me.rhin.openciv.server.game.heritage.type.mamluks.MamlukMoraleHeritage;

public class Mamluks extends Civ {

	public Mamluks(AbstractPlayer player) {
		super(player);
	}

	@Override
	public String getName() {
		return "Mamluks";
	}

	@Override
	public void initHeritage() {
		addHeritage(new MamlukMoraleHeritage(player));
		addHeritage(new IslamicScholarHeritage(player));
		addHeritage(new BazaarHeritage(player));
	}

}
