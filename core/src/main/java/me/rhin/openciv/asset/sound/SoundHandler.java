package me.rhin.openciv.asset.sound;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Random;

import com.badlogic.gdx.audio.Music;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.SoundEnum;
import me.rhin.openciv.asset.SoundEnum.SoundType;

//TODO: Not sure if I should be using this
public class SoundHandler {

	private ArrayList<Music> ambienceTracks;
	private ArrayList<Music> musicTacks;

	private HashMap<SoundEnum, Music> soundMap;
	private Music currentMusic;
	private Music currentAmbience;

	public SoundHandler() {
		this.soundMap = new HashMap<>();
		this.ambienceTracks = new ArrayList<>();
		this.musicTacks = new ArrayList<>();
	}

	public void loadSounds() {
		for (SoundEnum soundEnum : SoundEnum.values()) {

			Music sound = Civilization.getInstance().getAssetHandler()
					.get("sound/" + soundEnum.name().toLowerCase() + ".ogg", Music.class);
			sound.setVolume(soundEnum.getVolume());

			soundMap.put(soundEnum, sound);

			if (soundEnum.getSoundType() == SoundType.AMBIENCE)
				ambienceTracks.add(sound);
		}
	}

	public void playSound(SoundEnum soundEnum) {
		soundMap.get(soundEnum).play();
	}

	/**
	 * Plays a random ambience soundtrack
	 */
	public void playAmbience() {

		Random rnd = new Random();

		Music rndSound = ambienceTracks.get(rnd.nextInt(ambienceTracks.size()));
		rndSound.play();

		currentAmbience = rndSound;

		rndSound.setOnCompletionListener(new Music.OnCompletionListener() {
			@Override
			public void onCompletion(Music music) {
				playAmbience();
			}
		});
	}
}
