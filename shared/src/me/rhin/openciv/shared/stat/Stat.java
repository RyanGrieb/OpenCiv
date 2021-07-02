package me.rhin.openciv.shared.stat;

public enum Stat {

	GOLD(),
	GOLD_GAIN(GOLD),
	MAINTENANCE(StatType.CITY_EXCLUSIVE, GOLD),
	HERITAGE,
	HERITAGE_GAIN(HERITAGE),
	SCIENCE_GAIN,
	PRODUCTION_GAIN(StatType.CITY_EXCLUSIVE),
	FOOD_SURPLUS(StatType.CITY_EXCLUSIVE),
	FOOD_GAIN(StatType.CITY_EXCLUSIVE),
	POPULATION(StatType.CITY_EXCLUSIVE),
	EXPANSION_REQUIREMENT(StatType.CITY_EXCLUSIVE),
	EXPANSION_PROGRESS(StatType.CITY_EXCLUSIVE),
	POLICY_COST(StatType.POLICY_EXCLUSIVE);

	private Stat addedStat;
	private StatType statType;

	private Stat() {
	}

	private Stat(Stat addedStat) {
		this.addedStat = addedStat;
	}

	private Stat(StatType statType) {
		this.statType = statType;
	}

	private Stat(StatType statType, Stat addedStat) {
		this.addedStat = addedStat;
		this.statType = statType;
	}

	public boolean isGained() {
		return addedStat != null;
	}

	public Stat getAddedStat() {
		return addedStat;
	}

	public StatType getStatType() {
		return statType;
	}
}
