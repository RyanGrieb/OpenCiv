package me.rhin.openciv.game.civilization.type;

import com.badlogic.gdx.graphics.Color;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.civilization.Civ;
import me.rhin.openciv.game.heritage.type.mamluks.BazaarHeritage;
import me.rhin.openciv.game.heritage.type.mamluks.IslamicScholarHeritage;
import me.rhin.openciv.game.heritage.type.mamluks.MamlukMoraleHeritage;
import me.rhin.openciv.game.player.AbstractPlayer;

public class Mamluks extends Civ {

	public Mamluks(AbstractPlayer player) {
		super(player);
		
		addHeritage(new MamlukMoraleHeritage());
		addHeritage(new IslamicScholarHeritage());
		addHeritage(new BazaarHeritage());
	}

	@Override
	public TextureEnum getIcon() {
		return TextureEnum.ICON_MAMLUKS;
	}

	@Override
	public Color getColor() {
		return Color.GOLD;
	}

	@Override
	public Color getBorderColor() {
		return Color.BROWN;
	}

	@Override
	public String getName() {
		return "Mamluks";
	}

}
