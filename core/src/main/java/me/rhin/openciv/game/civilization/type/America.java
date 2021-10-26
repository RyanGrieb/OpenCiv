package me.rhin.openciv.game.civilization.type;

import com.badlogic.gdx.graphics.Color;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.civilization.Civ;
import me.rhin.openciv.game.heritage.type.america.ExpandedVisionHeritage;
import me.rhin.openciv.game.heritage.type.america.ManifestDestinyHeritage;
import me.rhin.openciv.game.heritage.type.america.MinutemanHeritage;
import me.rhin.openciv.game.player.AbstractPlayer;

public class America extends Civ {

	/*
	 * All units have +1 vision, 25% production to settlers, American musketmen
	 */
	public America(AbstractPlayer player) {
		super(player);

		addHeritage(new ExpandedVisionHeritage());
		addHeritage(new ManifestDestinyHeritage());
		addHeritage(new MinutemanHeritage());
	}

	@Override
	public TextureEnum getIcon() {
		return TextureEnum.ICON_AMERICA;
	}

	@Override
	public String getName() {
		return "America";
	}

	@Override
	public Color getColor() {
		return Color.CYAN;
	}

	@Override
	public Color getBorderColor() {
		return Color.CYAN;
	}
}
