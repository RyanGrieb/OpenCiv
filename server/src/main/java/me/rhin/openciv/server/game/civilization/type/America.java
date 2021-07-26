package me.rhin.openciv.server.game.civilization.type;

import me.rhin.openciv.server.game.Player;
import me.rhin.openciv.server.game.civilization.Civ;
import me.rhin.openciv.server.game.heritage.type.america.ExpandedVisionHeritage;
import me.rhin.openciv.server.game.heritage.type.america.ManifestDestinyHeritage;
import me.rhin.openciv.server.game.heritage.type.america.MinutemanHeritage;

public class America extends Civ {

	/*
	 * All units have +1 vision, 15% production to settlers, American Infrantry
	 */
	public America(Player player) {
		super(player);
	}

	@Override
	public String getName() {
		return "America";
	}

	@Override
	public void initHeritage() {
		addHeritage(new ExpandedVisionHeritage(player));
		addHeritage(new ManifestDestinyHeritage(player));
		addHeritage(new MinutemanHeritage(player));
	}
}
