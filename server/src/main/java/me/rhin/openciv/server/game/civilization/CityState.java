package me.rhin.openciv.server.game.civilization;

import me.rhin.openciv.server.game.AbstractPlayer;
import me.rhin.openciv.server.game.map.tile.TileType;
import me.rhin.openciv.shared.util.StrUtil;

public class CityState extends Civ {

	private CityStateType cityStateType;

	public CityState(AbstractPlayer player, CityStateType cityStateType) {
		super(player);

		this.cityStateType = cityStateType;
	}

	@Override
	public String getName() {
		return StrUtil.capitalize(cityStateType.name().toLowerCase()) + "_CityState";
	}

	@Override
	public TileType getBiasTileType() {
		return null;
	}

	@Override
	public void initHeritage() {
	}

}
