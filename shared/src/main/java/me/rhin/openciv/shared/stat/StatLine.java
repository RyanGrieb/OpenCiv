package me.rhin.openciv.shared.stat;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Random;

import me.rhin.openciv.shared.packet.type.CityStatUpdatePacket;
import me.rhin.openciv.shared.packet.type.PlayerStatUpdatePacket;

public class StatLine {

	private HashMap<Stat, StatValue> statValues;

	public StatLine() {
		this.statValues = new HashMap<>();
	}

	public static StatLine fromPacket(PlayerStatUpdatePacket packet) {
		StatLine statLine = new StatLine();
		for (int i = 0; i < packet.getStatNames().length; i++) {
			if (packet.getStatNames()[i] == null)
				break;

			statLine.setValue(Stat.valueOf(packet.getStatNames()[i]), packet.getStatValues()[i]);
		}
		return statLine;
	}

	// FIXME: This should really be only one method. City & Player Stat update
	// should extend form an Abstract StatPacket.
	public static StatLine fromPacket(CityStatUpdatePacket packet) {
		StatLine statLine = new StatLine();
		for (int i = 0; i < packet.getStatNames().length; i++) {
			if (packet.getStatNames()[i] == null)
				break;

			statLine.setValue(Stat.valueOf(packet.getStatNames()[i]), packet.getStatValues()[i]);
		}
		return statLine;
	}

	@Override
	public String toString() {
		StringBuilder stringBuilder = new StringBuilder();
		stringBuilder.append("STATS:\n");
		for (Stat stat : statValues.keySet()) {
			stringBuilder.append(stat.name().toUpperCase() + ": " + statValues.get(stat).getValue() + " - "
					+ 100 * statValues.get(stat).getModifier() + "%");
			stringBuilder.append("\n");
		}

		return stringBuilder.toString();
	}

	public void mergeStatLine(StatLine statLine) {
		for (Stat stat : statLine.getStatValues().keySet()) {
			mergeValue(stat, new StatValue(statLine.getStatValues().get(stat)));
		}
	}

	public void mergeStatLineExcluding(StatLine statLine, StatType statType) {
		for (Stat stat : statLine.getStatValues().keySet()) {
			if (stat.getStatType() == statType)
				continue;
			mergeValue(stat, new StatValue(statLine.getStatValues().get(stat)));
		}
	}

	public void updateStatLine() {
		HashMap<Stat, StatValue> statValuesCopy = (HashMap<Stat, StatValue>) statValues.clone();
		for (Stat stat : statValuesCopy.keySet()) {
			if (stat.isGained()) {
				// FIXME: Implement maintenance cost
				addValue(stat.getAddedStat(), statValues.get(stat).getValue());
			}
		}
	}

	public void reduceStatLine(StatLine statLine) {
		for (Stat stat : statLine.getStatValues().keySet()) {
			unmergeValue(stat, new StatValue(statLine.getStatValues().get(stat)));
		}
	}

	public HashMap<Stat, StatValue> getStatValues() {
		return statValues;
	}

	public void addValue(Stat stat, float value) {

		if (!statValues.containsKey(stat))
			statValues.put(stat, new StatValue(value));
		else
			statValues.get(stat).addValue(value);
	}

	public void subValue(Stat stat, float value) {
		if (!statValues.containsKey(stat))
			statValues.put(stat, new StatValue(value));
		else
			statValues.get(stat).subValue(value);
	}

	public void setValue(Stat stat, float value) {
		if (!statValues.containsKey(stat))
			statValues.put(stat, new StatValue(value));
		else
			statValues.get(stat).setValue(value);
	}

	public void mergeValue(Stat stat, StatValue statValue) {
		if (!statValues.containsKey(stat))
			statValues.put(stat, statValue);
		else
			statValues.get(stat).merge(statValue);
	}

	private void unmergeValue(Stat stat, StatValue statValue) {
		if (statValues.containsKey(stat))
			statValues.get(stat).unmerge(statValue);
	}

	public boolean isEmpty() {
		return statValues.size() < 1;
	}

	public float getStatValue(Stat stat) {
		if (!statValues.containsKey(stat))
			return 0;

		return statValues.get(stat).getValue();
	}

	public void clear() {
		statValues.clear();
	}

	/**
	 * Clear values that we don't accumulate, such as GOLD_GAIN, SCIENCE_GAIN, ect.
	 * We also don't clear player_exclusive stat types.
	 */
	public void clearNonAccumulative() {
		ArrayList<Stat> accumulativeStats = new ArrayList<>();
		for (Stat stat : statValues.keySet()) {

			if (stat.isGained()) {
				accumulativeStats.add(stat.getAddedStat());
			}

			if (stat.getStatType() == StatType.PLAYER_EXCLUSIVE)
				accumulativeStats.add(stat);
		}
		Iterator<Stat> iterator = statValues.keySet().iterator();
		while (iterator.hasNext()) {
			Stat stat = iterator.next();

			if (!accumulativeStats.contains(stat)) {
				iterator.remove();

			}
		}
	}

	public void addModifier(Stat stat, float modifier) {
		if (!statValues.containsKey(stat))
			statValues.put(stat, new StatValue(0));

		statValues.get(stat).addModifier(modifier);
	}

	public void setModifier(Stat stat, float modifier) {
		if (!statValues.containsKey(stat))
			statValues.put(stat, new StatValue(0));

		statValues.get(stat).setModifier(modifier);
	}

	public boolean hasStatValue(Stat stat) {
		return statValues.containsKey(stat);
	}
}
