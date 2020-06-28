package me.rhin.openciv.shared.stat;

import java.util.HashMap;

import me.rhin.openciv.shared.packet.type.CityStatUpdatePacket;
import me.rhin.openciv.shared.packet.type.PlayerStatUpdatePacket;

public class StatLine {

	private HashMap<Stat, Float> statValues;

	public StatLine() {
		this.statValues = new HashMap<>();
	}

	public static StatLine fromPacket(PlayerStatUpdatePacket packet) {
		StatLine statLine = new StatLine();
		for (int i = 0; i < packet.getStatNames().length; i++) {
			if (packet.getStatNames()[i] == null)
				break;

			statLine.addValue(Stat.valueOf(packet.getStatNames()[i]), packet.getStatValues()[i]);
		}
		return statLine;
	}
	
	//FIXME: This should really be only one method. City & Player Stat update should extend form an Abstract StatPacket.
	public static StatLine fromPacket(CityStatUpdatePacket packet) {
		StatLine statLine = new StatLine();
		for (int i = 0; i < packet.getStatNames().length; i++) {
			if (packet.getStatNames()[i] == null)
				break;

			statLine.addValue(Stat.valueOf(packet.getStatNames()[i]), packet.getStatValues()[i]);
		}
		return statLine;
	}

	@Override
	public String toString() {
		StringBuilder stringBuilder = new StringBuilder();
		stringBuilder.append("STATS:\n");
		for (Stat stat : statValues.keySet()) {
			stringBuilder.append(stat.name().toUpperCase() + ":" + statValues.get(stat));
			stringBuilder.append("\n");
		}

		return stringBuilder.toString();
	}

	public void mergeStatLine(StatLine statLine) {
		for (Stat stat : statLine.getStatValues().keySet()) {
			addValue(stat, statLine.getStatValues().get(stat));
		}
	}

	public void updateStatLine() {
		// Clone the statValues to avoid concurrent modification
		HashMap<Stat, Float> statValuesCopy = (HashMap<Stat, Float>) statValues.clone();
		for (Stat stat : statValuesCopy.keySet()) {
			if (stat.isGained()) {
				addValue(stat.getAddedStat(), statValues.get(stat));
			}
		}
	}

	public HashMap<Stat, Float> getStatValues() {
		return statValues;
	}

	public void addValue(Stat stat, float value) {
		if (!statValues.containsKey(stat))
			statValues.put(stat, value);
		else
			statValues.replace(stat, statValues.get(stat) + value);
	}

	public boolean isEmpty() {
		return statValues.size() < 1;
	}

	public float getStatValue(Stat stat) {
		if (!statValues.containsKey(stat))
			return 0;

		return statValues.get(stat);
	}
}
