package me.rhin.openciv.headless;

import com.badlogic.gdx.Application;
import com.badlogic.gdx.backends.headless.HeadlessApplication;
import com.badlogic.gdx.backends.headless.HeadlessApplicationConfiguration;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.shared.stat.Stat;
import me.rhin.openciv.shared.stat.StatLine;
import me.rhin.openciv.shared.stat.StatType;
import me.rhin.openciv.shared.stat.StatValue;

/**
 * Launches the headless application. Can be converted into a utilities project
 * or a server application.
 */
public class HeadlessLauncher {
	public static void main(String[] args) {
		// createApplication();

		StatLine statLine = new StatLine();
		statLine.addValue(Stat.SCIENCE_GAIN, 5);
		statLine.addValue(Stat.FOOD_GAIN, 3);
		statLine.addModifier(Stat.FOOD_GAIN, 1F);
		statLine.addModifier(Stat.MELE_UNIT_PROD_MODIFIFER, 0.1F);
		System.out.println(statLine);
	}

	private static Application createApplication() {
		// Note: you can use a custom ApplicationListener implementation for the
		// headless project instead of Civilization.
		return new HeadlessApplication(new Civilization(), getDefaultConfiguration());
	}

	private static HeadlessApplicationConfiguration getDefaultConfiguration() {
		HeadlessApplicationConfiguration configuration = new HeadlessApplicationConfiguration();
		// configuration.renderInterval = -1f; // When this value is negative,
		// Civilization#render() is never called.
		return configuration;
	}
}