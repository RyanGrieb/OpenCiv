package me.rhin.openciv.game.civilization;

import java.util.Random;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.civilization.type.America;
import me.rhin.openciv.game.civilization.type.Barbarians;
import me.rhin.openciv.game.civilization.type.CityState;
import me.rhin.openciv.game.civilization.type.England;
import me.rhin.openciv.game.civilization.type.Germany;
import me.rhin.openciv.game.civilization.type.Rome;
import me.rhin.openciv.game.civilization.type.CityState.CityStateType;
import me.rhin.openciv.game.player.AbstractPlayer;
import me.rhin.openciv.shared.util.StrUtil;

public enum CivType {

	RANDOM(TextureEnum.ICON_UNKNOWN) {
		public Civ getCiv(AbstractPlayer player) {
			Random rnd = new Random();
			return CivType.values()[rnd.nextInt(CivType.values().length)].getCiv(player);
		}
	},
	BARBARIANS(TextureEnum.ICON_BARBARIAN) {
		@Override
		public Civ getCiv(AbstractPlayer player) {
			return new Barbarians(player);
		}
	},
	GOLD_CITYSTATE(TextureEnum.ICON_CITYSTATE_GOLD) {
		@Override
		public Civ getCiv(AbstractPlayer player) {
			return new CityState(player, CityStateType.GOLD);
		}
	},
	PRODUCTION_CITYSTATE(TextureEnum.ICON_CITYSTATE_PRODUCTION) {
		@Override
		public Civ getCiv(AbstractPlayer player) {
			return new CityState(player, CityStateType.PRODUCTION);
		}
	},
	SCIENCE_CITYSTATE(TextureEnum.ICON_CITYSTATE_SCIENCE) {
		@Override
		public Civ getCiv(AbstractPlayer player) {
			return new CityState(player, CityStateType.SCIENCE);
		}
	},
	AMERICA(TextureEnum.ICON_AMERICA) {
		@Override
		public Civ getCiv(AbstractPlayer player) {
			return new America(player);
		}
	},
	ENGLAND(TextureEnum.ICON_ENGLAND) {
		@Override
		public Civ getCiv(AbstractPlayer player) {
			return new England(player);
		}
	},
	GERMANY(TextureEnum.ICON_GERMANY) {
		@Override
		public Civ getCiv(AbstractPlayer player) {
			return new Germany(player);
		}
	},
	ROME(TextureEnum.ICON_ROME) {
		@Override
		public Civ getCiv(AbstractPlayer player) {
			return new Rome(player);
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

	public String getName() {
		return StrUtil.capitalize(name().toLowerCase());
	}
}
