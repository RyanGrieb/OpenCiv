package me.rhin.openciv.game.sounds;

import java.util.ArrayList;

import com.badlogic.gdx.audio.Music;

import me.rhin.openciv.asset.SoundEnum;

public class GameSounds {

	private ArrayList<Music> playingSounds;

	public GameSounds() {
		this.playingSounds = new ArrayList<>();
	}

	public void playSkyAmbience() {
		// TODO: Play random one.
		Music sound = SoundEnum.getSound(SoundEnum.WIND_AMBIENCE);
		sound.play();
		sound.setVolume(0.03F);
		sound.setLooping(true);

		playingSounds.add(sound);
	}

}
