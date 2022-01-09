package me.rhin.openciv.options;

import com.badlogic.gdx.Gdx;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.sound.MusicWrapper;

public enum OptionType {
	MUSIC_VOLUME {
		@Override
		public void onUpdate(float value) {

			if (Civilization.getInstance().getSoundHandler().getCurrentMusic() == null)
				return;

			MusicWrapper music = Civilization.getInstance().getSoundHandler().getCurrentMusic();
			music.setVolume(music.getInitialVolume() * (value / 100));
		}

		@Override
		public int getDefaultValue() {
			return 25;
		}
	},
	AMBIENCE_VOLUME {
		@Override
		public void onUpdate(float value) {

			if (Civilization.getInstance().getSoundHandler().getCurrentAmbience() == null)
				return;

			MusicWrapper music = Civilization.getInstance().getSoundHandler().getCurrentAmbience();
			music.setVolume(music.getInitialVolume() * (value / 100));
		}

		@Override
		public int getDefaultValue() {
			return 15;
		}
	},
	EFFECTS_VOLUME {
		@Override
		public void onUpdate(float value) {
		}

		@Override
		public int getDefaultValue() {
			return 25;
		}
	},
	FULLSCREEN_ENABLED {
		@Override
		public void onUpdate(float value) {
			// FIXME: Disable temporarily for MACOS Compatibility
			if (value == 1)
				Gdx.graphics.setFullscreenMode(Gdx.graphics.getDisplayMode());
			else
				Gdx.graphics.setWindowedMode(900, 750);
		}

		@Override
		public int getDefaultValue() {
			return 0;
		}
	};

	public abstract int getDefaultValue();

	public abstract void onUpdate(float value);
}
