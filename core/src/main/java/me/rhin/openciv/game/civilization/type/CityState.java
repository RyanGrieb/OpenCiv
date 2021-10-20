package me.rhin.openciv.game.civilization.type;

import com.badlogic.gdx.graphics.Color;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.civilization.Civ;
import me.rhin.openciv.game.player.AbstractPlayer;

public class CityState extends Civ {

	public enum CityStateType {
		GOLD(TextureEnum.ICON_CITYSTATE_GOLD),
		PRODUCTION(TextureEnum.ICON_CITYSTATE_PRODUCTION),
		SCIENCE(TextureEnum.ICON_CITYSTATE_SCIENCE);

		private TextureEnum textureEnum;

		CityStateType(TextureEnum texture) {
			textureEnum = texture;
		}

		TextureEnum getIcon() {
			return textureEnum;
		}
	}

	private CityStateType cityStateType;

	public CityState(AbstractPlayer player) {
		super(player);
	}

	@Override
	public TextureEnum getIcon() {
		return cityStateType.getIcon();
	}

	@Override
	public Color getColor() {
		return Color.DARK_GRAY;
	}

	@Override
	public String getName() {
		return "CityState";
	}

	public void setCityStateType(CityStateType cityStateType) {
		this.cityStateType = cityStateType;
	}
}
