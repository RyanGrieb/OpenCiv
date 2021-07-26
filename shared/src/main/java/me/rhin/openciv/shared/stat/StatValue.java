package me.rhin.openciv.shared.stat;

public class StatValue {
	private float value;
	private float modifier;

	public StatValue(float value) {
		this.value = value;
		this.modifier = 0;
	}

	public StatValue(float value, float modifier) {
		this.value = value;
		this.modifier = modifier;
	}

	public void addValue(float value) {
		this.value += value;
	}

	public void subValue(float value) {
		this.value -= value;
	}

	public void setValue(float value) {
		this.value = value;
	}

	public float getValue() {
		return value * (1 + modifier);
	}

	public float getModifier() {
		return modifier;
	}

	public void merge(StatValue statValue) {
		this.value += statValue.getValue();
		this.modifier += statValue.getModifier();
	}

	public void unmerge(StatValue statValue) {
		this.value -= statValue.getValue();
		this.modifier -= statValue.getModifier();
	}

	public void addModifier(float modifier) {
		this.modifier += modifier;
	}

	public void subModifier(float modifier) {
		this.modifier -= modifier;
	}

	public void setModifier(float modifier) {
		this.modifier = modifier;
	}
}
