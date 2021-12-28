package me.rhin.openciv.options;

import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.Preferences;

public class GameOptions {

	private Preferences prefs;

	public GameOptions() {
		this.prefs = Gdx.app.getPreferences("openciv-options");

		// Initialize preferences
		for (OptionType option : OptionType.values()) {
			if (!prefs.contains(option.name()))
				prefs.putInteger(option.name(), option.getDefaultValue());
		}

		updatePrefs();
		
		//FIXME: Handle startup options better. Move this.
		if(getInt(OptionType.FULLSCREEN_ENABLED) == 1)
			Gdx.graphics.setFullscreenMode(Gdx.graphics.getDisplayMode());
	}

	public int getInt(OptionType option) {
		return prefs.getInteger(option.name());
	}

	public void setInt(OptionType optionType, int value) {
		prefs.putInteger(optionType.name(), value);
		
		optionType.onUpdate(value);
		updatePrefs();
	}

	private void updatePrefs() {
		prefs.flush();
	}

}
