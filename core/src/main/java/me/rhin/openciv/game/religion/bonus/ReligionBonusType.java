package me.rhin.openciv.game.religion.bonus;

import me.rhin.openciv.asset.TextureEnum;

public enum ReligionBonusType {

	GOD_OF_THE_SEA(ReligionProperty.PANTHEON) {

		@Override
		public TextureEnum getIcon() {
			return TextureEnum.UNIT_WORK_BOAT;
		}

		@Override
		public String getName() {
			return "God of the Sea";
		}

		@Override
		public String getDesc() {
			return "+1 Production from\nworkboats";
		}

	},
	TEARS_OF_THE_GODS(ReligionProperty.PANTHEON) {

		@Override
		public TextureEnum getIcon() {
			return TextureEnum.TILE_GEMS;
		}

		@Override
		public String getName() {

			return "Tears of the Gods";
		}

		@Override
		public String getDesc() {
			return "+2 Faith from gems\n";
		}

	},
	DESERT_FOLKLORE(ReligionProperty.PANTHEON) {

		@Override
		public TextureEnum getIcon() {
			return TextureEnum.TILE_DESERT;
		}

		@Override
		public String getName() {
			return "Desert Folklore";
		}

		@Override
		public String getDesc() {
			return "+1 Faith from desert tiles\n";
		}

	},
	RELIGIOUS_IDOLS(ReligionProperty.PANTHEON) {

		@Override
		public TextureEnum getIcon() {
			return TextureEnum.TILE_GOLD;
		}

		@Override
		public String getName() {
			return "Religious Idols";
		}

		@Override
		public String getDesc() {
			return "+1 Culture & Faith for\neach gold & silver tile";
		}

	};

	public enum ReligionProperty {
		PANTHEON,
		FOUNDER,
		FOLLOWER;
	}

	private ReligionProperty property;

	ReligionBonusType(ReligionProperty property) {
		this.property = property;
	}

	public abstract TextureEnum getIcon();

	public abstract String getName();

	public abstract String getDesc();

	public ReligionProperty getProperty() {
		return property;
	}

}
