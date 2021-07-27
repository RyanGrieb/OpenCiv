package me.rhin.openciv.headless;

import com.badlogic.gdx.Application;
import com.badlogic.gdx.backends.headless.HeadlessApplication;
import com.badlogic.gdx.backends.headless.HeadlessApplicationConfiguration;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.shared.stat.Stat;
import me.rhin.openciv.shared.stat.StatLine;

/**
 * Launches the headless application. Can be converted into a utilities project
 * or a server application.
 */
public class HeadlessLauncher {
	public static void main(String[] args) {
		// createApplication();

		StatLine playerStatLine = new StatLine();
		//System.out.println("playerStatLine:" + playerStatLine.id);

		StatLine statLine = new StatLine();
		statLine.addValue(Stat.SCIENCE_GAIN, 5);
		//System.out.println("statLine:" + statLine.id);

		StatLine cityLine = new StatLine();
		//System.out.println("cityLine:" + cityLine.id);
		cityLine.addValue(Stat.SCIENCE_GAIN, 5);
		cityLine.addValue(Stat.FOOD_GAIN, 2);

		StatLine foodLine = new StatLine();
		foodLine.addValue(Stat.FOOD_GAIN, 2);

		// Problem. Merging more than 1 statline at a time, causes the previous statline
		// to merge values when it shouldn't.

		playerStatLine.mergeStatLine(statLine);
		playerStatLine.mergeStatLine(cityLine);

		System.out.println("============ PLAYER STAT LINE");
		System.out.println(playerStatLine);
		System.out.println("============  STAT LINE");
		System.out.println(statLine);
		System.out.println("============ CITY STAT LINE");
		System.out.println(cityLine);
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