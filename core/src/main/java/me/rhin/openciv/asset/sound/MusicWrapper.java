package me.rhin.openciv.asset.sound;

import com.badlogic.gdx.audio.Music;
import com.badlogic.gdx.audio.Music.OnCompletionListener;

public class MusicWrapper {

	private Music music;
	private float initialVolume;

	public MusicWrapper(Music music, float initialVolume) {
		this.music = music;
		this.initialVolume = initialVolume;
	}

	public Music getMusic() {
		return music;
	}

	public float getInitialVolume() {
		return initialVolume;
	}

	public void stop() {
		music.stop();
		music.dispose();
	}

	public void play() {
		music.play();
	}

	public void setVolume(float volume) {
		music.setVolume(volume);
	}
	
	public void setOnCompletionListener(OnCompletionListener onCompletionListener) {
		music.setOnCompletionListener(onCompletionListener);
	}
}
