package me.rhin.openciv.game.civilization.type;

import com.badlogic.gdx.graphics.Color;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.civilization.Civ;
import me.rhin.openciv.game.player.AbstractPlayer;

public class CityState extends Civ {

	public enum CityStateType {
		GOLD(TextureEnum.ICON_CITYSTATE_GOLD, Color.GOLD),
		PRODUCTION(TextureEnum.ICON_CITYSTATE_PRODUCTION, Color.ORANGE),
		SCIENCE(TextureEnum.ICON_CITYSTATE_SCIENCE, Color.BLUE),
		FAITH(TextureEnum.ICON_CITYSTATE_FAITH, Color.LIGHT_GRAY),
		HERITAGE(TextureEnum.ICON_CITYSTATE_HERITAGE, Color.PINK);

		private TextureEnum textureEnum;
		private Color color;

		CityStateType(TextureEnum texture, Color color) {
			textureEnum = texture;
			this.color = color;
		}

		public TextureEnum getIcon() {
			return textureEnum;
		}

		public Color getColor() {
			return color;
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

	public Color getBorderColor() {
		return cityStateType.getColor();
	}

	@Override
	public String getName() {
		return "City State";
	}

	public void setCityStateType(CityStateType cityStateType) {
		this.cityStateType = cityStateType;
	}
}
