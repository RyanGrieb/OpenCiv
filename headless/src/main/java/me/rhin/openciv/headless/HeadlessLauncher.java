package me.rhin.openciv.headless;

import java.util.Random;

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
		// System.out.println("playerStatLine:" + playerStatLine.id);

		StatLine statLine = new StatLine();
		
		statLine.setValue(Stat.MORALE_CITY, 10);
		statLine.addModifier(Stat.TRADE_GOLD_MODIFIER, 0.5F);
		statLine.clearNonAccumulative();
		
		float mod = statLine.getStatModifier(Stat.TRADE_GOLD_MODIFIER);
		
		System.out.println(mod);
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