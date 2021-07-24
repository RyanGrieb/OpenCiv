package me.rhin.openciv.game.civilization;

import java.util.Random;

import com.badlogic.gdx.graphics.Color;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.civilization.type.America;
import me.rhin.openciv.game.civilization.type.England;
import me.rhin.openciv.game.civilization.type.Germany;
import me.rhin.openciv.game.civilization.type.Rome;

@Deprecated
public enum CivType {

	RANDOM(TextureEnum.ICON_UNKNOWN) {
		public Civ getCiv() {
			Random rnd = new Random();
			return CivType.values()[rnd.nextInt(CivType.values().length)].getCiv();
		}

		@Override
		public String getName() {
			return "Random";
		}

		@Override
		public Color getColor() {
			return Color.WHITE;
		}
	},
	AMERICA(TextureEnum.ICON_AMERICA) {
		@Override
		public Civ getCiv() {
			return new America();
		}

		@Override
		public String getName() {
			return "America";
		}

		@Override
		public Color getColor() {
			return Color.CYAN;
		}
	},
	ENGLAND(TextureEnum.ICON_ENGLAND) {
		@Override
		public Civ getCiv() {
			return new England();
		}

		@Override
		public String getName() {
			return "England";
		}

		@Override
		public Color getColor() {
			return Color.FIREBRICK;
		}
	},
	GERMANY(TextureEnum.ICON_GERMANY) {
		@Override
		public Civ getCiv() {
			return new Germany();
		}

		@Override
		public String getName() {
			return "Germany";
		}

		@Override
		public Color getColor() {
			return Color.GRAY;
		}
	},
	ROME(TextureEnum.ICON_ROME) {
		@Override
		public Civ getCiv() {
			return new Rome();
		}

		@Override
		public String getName() {
			return "Rome";
		}

		@Override
		public Color getColor() {
			return Color.PURPLE;
		}
	};

	private TextureEnum icon;

	CivType(TextureEnum civIcon) {
		icon = civIcon;
	}

	public abstract Civ getCiv();

	public TextureEnum getIcon() {
		return icon;
	}

	public abstract String getName();

	public abstract Color getColor();
}
