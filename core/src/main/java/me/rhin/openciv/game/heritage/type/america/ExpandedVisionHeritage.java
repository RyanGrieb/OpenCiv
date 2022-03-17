package me.rhin.openciv.game.heritage.type.america;

import com.badlogic.gdx.graphics.g2d.Sprite;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.heritage.Heritage;
import me.rhin.openciv.game.map.tile.Tile;
import me.rhin.openciv.game.unit.Unit;
import me.rhin.openciv.listener.AddUnitListener;
import me.rhin.openciv.shared.packet.type.AddUnitPacket;

public class ExpandedVisionHeritage extends Heritage implements AddUnitListener {

	public ExpandedVisionHeritage() {
		Civilization.getInstance().getEventManager().addListener(AddUnitListener.class, this);
	}

	@Override
	public int getLevel() {
		return 1;
	}

	@Override
	public String getName() {
		return "Expanded Vision";
	}

	@Override
	public Sprite getIcon() {
		return TextureEnum.UNIT_SCOUT.sprite();
	}

	@Override
	public float getCost() {
		return 40;
	}

	@Override
	public String getDesc() {
		return "Allow units to see past\nhills.";
	}

	@Override
	protected void onStudied() {
		for (Unit unit : Civilization.getInstance().getGame().getPlayer().getOwnedUnits())
			unit.setIgnoresTileObstructions(true);
	}

	@Override
	public void onUnitAdd(AddUnitPacket packet) {
		if (!isStudied())
			return;

		Tile tile = Civilization.getInstance().getGame().getMap().getTiles()[packet.getTileGridX()][packet
				.getTileGridY()];
		Unit unit = tile.getUnitFromID(packet.getUnitID());

		if (!unit.getPlayerOwner().equals(Civilization.getInstance().getGame().getPlayer()))
			return;

		unit.setIgnoresTileObstructions(true);
	}
}
