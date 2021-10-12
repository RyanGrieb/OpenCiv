package me.rhin.openciv.game.civilization;

import java.util.Random;

import com.badlogic.gdx.graphics.Color;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.civilization.type.America;
import me.rhin.openciv.game.civilization.type.Barbarians;
import me.rhin.openciv.game.civilization.type.England;
import me.rhin.openciv.game.civilization.type.Germany;
import me.rhin.openciv.game.civilization.type.Rome;
import me.rhin.openciv.game.player.AbstractPlayer;

@Deprecated
public enum CivType {

	RANDOM(TextureEnum.ICON_UNKNOWN) {
		public Civ getCiv(AbstractPlayer player) {
			Random rnd = new Random();
			return CivType.values()[rnd.nextInt(CivType.values().length)].getCiv(player);
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
	BARBARIANS(TextureEnum.ICON_BARBARIAN) {
		@Override
		public Civ getCiv(AbstractPlayer player) {
			return new Barbarians(player);
		}

		@Override
		public String getName() {
			return "Barbarians";
		}

		@Override
		public Color getColor() {
			return Color.FIREBRICK;
		}
	},
	AMERICA(TextureEnum.ICON_AMERICA) {
		@Override
		public Civ getCiv(AbstractPlayer player) {
			return new America(player);
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
		public Civ getCiv(AbstractPlayer player) {
			return new England(player);
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
		public Civ getCiv(AbstractPlayer player) {
			return new Germany(player);
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
		public Civ getCiv(AbstractPlayer player) {
			return new Rome(player);
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

	public abstract Civ getCiv(AbstractPlayer player);

	public TextureEnum getIcon() {
		return icon;
	}

	public abstract String getName();

	public abstract Color getColor();
}
