package me.rhin.openciv.game.heritage.type.germany;

import com.badlogic.gdx.graphics.g2d.Sprite;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.heritage.Heritage;
import me.rhin.openciv.shared.packet.type.NextTurnPacket;

public class DisciplineHeritage extends Heritage {

	@Override
	public int getLevel() {
		return 1;
	}

	@Override
	public String getName() {
		return "Military Discipline";
	}

	@Override
	public Sprite getIcon() {
		return TextureEnum.UNIT_WARRIOR.sprite();
	}

	@Override
	public float getCost() {
		return 40;
	}

	@Override
	public String getDesc() {
		return "10% Production bonus towards \ncombat units.";
	}

	@Override
	protected void onStudied() {
	}
}
