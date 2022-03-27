package me.rhin.openciv.options;

import com.badlogic.gdx.Gdx;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.sound.MusicWrapper;

public enum OptionType {

	MUSIC_VOLUME {

		@Override
		public void onUpdate(Object value) {

			float level = (int) value;

			if (Civilization.getInstance().getSoundHandler().getCurrentMusic() == null)
				return;

			MusicWrapper music = Civilization.getInstance().getSoundHandler().getCurrentMusic();
			music.setVolume(level / 100);
		}

		@Override
		public int getDefaultValue() {
			return 25;
		}

		@Override
		public VariableType getVariableType() {
			return VariableType.INTEGER;
		}

	},
	AMBIENCE_VOLUME {

		@Override
		public void onUpdate(Object value) {

			float level = (int) value;

			if (Civilization.getInstance().getSoundHandler().getCurrentAmbience() == null)
				return;

			MusicWrapper music = Civilization.getInstance().getSoundHandler().getCurrentAmbience();
			music.setVolume(level / 100);
		}

		@Override
		public int getDefaultValue() {
			return 15;
		}

		@Override
		public VariableType getVariableType() {
			return VariableType.INTEGER;
		}

	},
	EFFECTS_VOLUME {

		@Override
		public void onUpdate(Object value) {
		}

		@Override
		public int getDefaultValue() {
			return 25;
		}

		@Override
		public VariableType getVariableType() {
			return VariableType.INTEGER;
		}

	},
	FULLSCREEN_ENABLED {

		@Override
		public void onUpdate(Object value) {

			int level = (int) value;

			// FIXME: Disable temporarily for MACOS Compatibility
			if (level == 1)
				Gdx.graphics.setFullscreenMode(Gdx.graphics.getDisplayMode());
			else
				Gdx.graphics.setWindowedMode(900, 750);
		}

		@Override
		public int getDefaultValue() {
			return 0;
		}

		@Override
		public VariableType getVariableType() {
			return VariableType.INTEGER;
		}

	},
	ANIMATION_LEVEL {

		@Override
		public void onUpdate(Object value) {
		}

		@Override
		public int getDefaultValue() {
			return 1;
		}

		@Override
		public VariableType getVariableType() {
			return VariableType.STRING;
		}

	};

	public abstract int getDefaultValue();

	public abstract void onUpdate(Object value);

	public abstract VariableType getVariableType();

	public static enum VariableType {
		INTEGER,
		STRING;
	}
}
